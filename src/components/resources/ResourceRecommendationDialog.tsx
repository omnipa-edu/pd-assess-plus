import { useEffect, useMemo, useState } from 'react';

import { Loader2, Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { containsPotentialPhi, PHI_WARNING_TEXT } from '@/lib/phi';
import {
  createRecommendation,
  searchApprovedResources,
  type ResourceLevel,
  type ResourceRecommendationRow,
  type ResourceRow,
  type ResourceTag,
  type ResourceType,
} from '@/lib/resources';
import { supabase } from '@/integrations/supabase/client';

interface StudentOption {
  id: string;
  name: string;
  email: string;
}

interface ResourceRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisorId: string;
  students: StudentOption[];
  fixedStudent?: StudentOption;
  assessmentId?: string | null;
  onCreated?: (recommendation: ResourceRecommendationRow) => void;
}

const RESOURCE_TYPES: ResourceType[] = [
  'guideline',
  'review',
  'article',
  'video',
  'podcast',
  'pathway',
  'policy',
  'other',
];

const RESOURCE_LEVELS: ResourceLevel[] = ['student', 'supervisor', 'both'];

export function ResourceRecommendationDialog({
  open,
  onOpenChange,
  supervisorId,
  students,
  fixedStudent,
  assessmentId,
  onCreated,
}: ResourceRecommendationDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'library' | 'paste'>('library');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [whySuggested, setWhySuggested] = useState('');
  const [saving, setSaving] = useState(false);

  const [libraryResources, setLibraryResources] = useState<ResourceRow[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryType, setLibraryType] = useState<ResourceType | 'all'>('all');
  const [libraryLevel, setLibraryLevel] = useState<ResourceLevel | 'all'>('all');
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string; code: string | null }>>([]);
  const [epas, setEpas] = useState<Array<{ id: string; code: string; title: string }>>([]);

  const [pasteForm, setPasteForm] = useState({
    url: '',
    title: '',
    resourceType: 'article' as ResourceType,
    publisher: '',
    estimatedMinutes: 10,
    level: 'student' as ResourceLevel,
    specialtyTags: [] as string[],
    epaTags: [] as string[],
    keywordTags: [] as string[],
    selectedSpecialty: '',
    selectedEpa: '',
    keywordInput: '',
  });

  const selectedResource = libraryResources.find((resource) => resource.id === selectedResourceId) || null;

  useEffect(() => {
    if (fixedStudent?.id) {
      setSelectedStudentId(fixedStudent.id);
    }
  }, [fixedStudent?.id]);

  useEffect(() => {
    if (!open) return;
    setLibraryLoading(true);
    searchApprovedResources()
      .then(setLibraryResources)
      .catch((error) => {
        console.error('Error loading resources', error);
        toast({
          title: 'Error loading library',
          description: 'Unable to load approved resources.',
          variant: 'destructive',
        });
      })
      .finally(() => setLibraryLoading(false));
  }, [open, toast]);

  useEffect(() => {
    if (!open) return;
    const loadTags = async () => {
      const [specialtiesResult, epasResult] = await Promise.all([
        supabase.from('specialties').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('epas').select('id, code, title').eq('status', 'active').order('code'),
      ]);
      if (!specialtiesResult.error) {
        setSpecialties(specialtiesResult.data || []);
      }
      if (!epasResult.error) {
        setEpas(epasResult.data || []);
      }
    };
    loadTags();
  }, [open]);

  const filteredLibraryResources = useMemo(() => {
    return libraryResources.filter((resource) => {
      if (libraryType !== 'all' && resource.resource_type !== libraryType) return false;
      if (libraryLevel !== 'all' && resource.level !== libraryLevel) return false;
      if (librarySearch.trim()) {
        const term = librarySearch.trim().toLowerCase();
        const matchesTitle = resource.title.toLowerCase().includes(term);
        const matchesPublisher = resource.publisher?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesPublisher) return false;
      }
      return true;
    });
  }, [libraryResources, librarySearch, libraryType, libraryLevel]);

  const phiWarning = containsPotentialPhi(whySuggested);

  const resetState = () => {
    setActiveTab('library');
    setSelectedStudentId('');
    setWhySuggested('');
    setSelectedResourceId(null);
    setLibrarySearch('');
    setLibraryType('all');
    setLibraryLevel('all');
    setPasteForm({
      url: '',
      title: '',
      resourceType: 'article',
      publisher: '',
      estimatedMinutes: 10,
      level: 'student',
      specialtyTags: [],
      epaTags: [],
      keywordTags: [],
      selectedSpecialty: '',
      selectedEpa: '',
      keywordInput: '',
    });
  };

  const handleClose = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      resetState();
    }
  };

  const submitRecommendation = async () => {
    if (!selectedStudentId) {
      toast({
        title: 'Select a learner',
        description: 'Choose the learner receiving this recommendation.',
        variant: 'destructive',
      });
      return;
    }

    if (!whySuggested.trim()) {
      toast({
        title: 'Why suggested is required',
        description: 'Provide a brief rationale for the recommendation.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let recommendation: ResourceRecommendationRow;

      if (activeTab === 'library') {
        if (!selectedResource) {
          toast({
            title: 'Select a resource',
            description: 'Choose a resource from the library.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        recommendation = await createRecommendation({
          student_id: selectedStudentId,
          supervisor_id: supervisorId,
          assessment_id: assessmentId || null,
          resource_id: selectedResource.id,
          estimated_minutes: selectedResource.estimated_minutes,
          level: selectedResource.level,
          why_suggested: whySuggested.trim(),
        });
      } else {
        if (!pasteForm.url.trim() || !pasteForm.title.trim()) {
          toast({
            title: 'Missing details',
            description: 'Provide a URL and title for the resource.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        const tagPayload: Array<{ tag_type: ResourceTag['tag_type']; tag_value: string }> = [
          ...pasteForm.specialtyTags.map((tag) => ({ tag_type: 'specialty' as const, tag_value: tag })),
          ...pasteForm.epaTags.map((tag) => ({ tag_type: 'epa' as const, tag_value: tag })),
          ...pasteForm.keywordTags.map((tag) => ({ tag_type: 'keyword' as const, tag_value: tag })),
          { tag_type: 'level' as const, tag_value: pasteForm.level },
        ];

        recommendation = await createRecommendation({
          student_id: selectedStudentId,
          supervisor_id: supervisorId,
          assessment_id: assessmentId || null,
          url: pasteForm.url.trim(),
          title: pasteForm.title.trim(),
          resource_type: pasteForm.resourceType,
          publisher: pasteForm.publisher.trim() || null,
          estimated_minutes: pasteForm.estimatedMinutes,
          level: pasteForm.level,
          why_suggested: whySuggested.trim(),
          tags: tagPayload,
        });
      }

      toast({
        title: 'Recommendation sent',
        description: 'The learner can now view this resource.',
      });
      onCreated?.(recommendation);
      handleClose(false);
    } catch (error: any) {
      console.error('Error creating recommendation', error);
      toast({
        title: 'Error sending recommendation',
        description: error.message || 'Unable to save recommendation.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addKeywordTag = () => {
    const value = pasteForm.keywordInput.trim();
    if (!value) return;
    setPasteForm((prev) => ({
      ...prev,
      keywordTags: Array.from(new Set([...prev.keywordTags, value])),
      keywordInput: '',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Recommend a resource</DialogTitle>
          <DialogDescription>
            Add a curated library resource or paste a new link with metadata. {PHI_WARNING_TEXT}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Choose learner</Label>
            {fixedStudent ? (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                {fixedStudent.name || fixedStudent.email}
              </div>
            ) : (
              <Select modal={false} value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a learner" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name || student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'library' | 'paste')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library">Choose from library</TabsTrigger>
              <TabsTrigger value="paste">Paste a link</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label>Search library</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={librarySearch}
                      onChange={(event) => setLibrarySearch(event.target.value)}
                      className="pl-9"
                      placeholder="Search by title or publisher"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select modal={false} value={libraryType} onValueChange={(value) => setLibraryType(value as ResourceType | 'all')}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select modal={false} value={libraryLevel} onValueChange={(value) => setLibraryLevel(value as ResourceLevel | 'all')}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      {RESOURCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-3">
                  {libraryLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading resources...
                    </div>
                  )}
                  {!libraryLoading && filteredLibraryResources.length === 0 && (
                    <div className="text-sm text-muted-foreground">No resources match these filters.</div>
                  )}
                  {!libraryLoading && filteredLibraryResources.map((resource) => (
                    <Card
                      key={resource.id}
                      className={`cursor-pointer border p-3 transition ${
                        selectedResourceId === resource.id ? 'border-primary' : 'border-border'
                      }`}
                      onClick={() => setSelectedResourceId(resource.id)}
                    >
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-semibold">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">{resource.publisher || 'Publisher'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">{resource.resource_type}</Badge>
                          <Badge variant="outline">~{resource.estimated_minutes} min</Badge>
                          <Badge variant="outline">{resource.level}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="space-y-3 rounded-lg border p-4">
                  {selectedResource ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold">{selectedResource.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedResource.publisher || 'Publisher not set'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">{selectedResource.resource_type}</Badge>
                        <Badge variant="outline">~{selectedResource.estimated_minutes} min</Badge>
                        <Badge variant="outline">{selectedResource.level}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedResource.summary || 'No summary provided.'}
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Select a resource to review details.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={pasteForm.url}
                    onChange={(event) => setPasteForm((prev) => ({ ...prev, url: event.target.value }))}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={pasteForm.title}
                    onChange={(event) => setPasteForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Resource title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    modal={false}
                    value={pasteForm.resourceType}
                    onValueChange={(value) => setPasteForm((prev) => ({ ...prev, resourceType: value as ResourceType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Publisher</Label>
                  <Input
                    value={pasteForm.publisher}
                    onChange={(event) => setPasteForm((prev) => ({ ...prev, publisher: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated minutes</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pasteForm.estimatedMinutes}
                    onChange={(event) =>
                      setPasteForm((prev) => ({ ...prev, estimatedMinutes: Number(event.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    modal={false}
                    value={pasteForm.level}
                    onValueChange={(value) => setPasteForm((prev) => ({ ...prev, level: value as ResourceLevel }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Specialty tags</Label>
                  <div className="flex gap-2">
                    <Select
                      modal={false}
                      value={pasteForm.selectedSpecialty}
                      onValueChange={(value) => setPasteForm((prev) => ({ ...prev, selectedSpecialty: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.name}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!pasteForm.selectedSpecialty) return;
                        setPasteForm((prev) => ({
                          ...prev,
                          specialtyTags: Array.from(new Set([...prev.specialtyTags, prev.selectedSpecialty])),
                          selectedSpecialty: '',
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pasteForm.specialtyTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => {
                        setPasteForm((prev) => ({
                          ...prev,
                          specialtyTags: prev.specialtyTags.filter((value) => value !== tag),
                        }));
                      }}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>EPA tags</Label>
                  <div className="flex gap-2">
                    <Select
                      modal={false}
                      value={pasteForm.selectedEpa}
                      onValueChange={(value) => setPasteForm((prev) => ({ ...prev, selectedEpa: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select EPA" />
                      </SelectTrigger>
                      <SelectContent>
                        {epas.map((epa) => (
                          <SelectItem key={epa.id} value={`EPA ${epa.code}`}>
                            EPA {epa.code} - {epa.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!pasteForm.selectedEpa) return;
                        setPasteForm((prev) => ({
                          ...prev,
                          epaTags: Array.from(new Set([...prev.epaTags, prev.selectedEpa])),
                          selectedEpa: '',
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pasteForm.epaTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => {
                        setPasteForm((prev) => ({
                          ...prev,
                          epaTags: prev.epaTags.filter((value) => value !== tag),
                        }));
                      }}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Keyword tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={pasteForm.keywordInput}
                    onChange={(event) => setPasteForm((prev) => ({ ...prev, keywordInput: event.target.value }))}
                    placeholder="Type a keyword"
                  />
                  <Button type="button" variant="outline" onClick={addKeywordTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pasteForm.keywordTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => {
                      setPasteForm((prev) => ({
                        ...prev,
                        keywordTags: prev.keywordTags.filter((value) => value !== tag),
                      }));
                    }}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>Why this was suggested</Label>
            <Textarea
              value={whySuggested}
              onChange={(event) => setWhySuggested(event.target.value)}
              placeholder="Short rationale. No patient identifiers."
            />
            {phiWarning && (
              <p className="text-xs text-amber-600">{PHI_WARNING_TEXT}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={submitRecommendation} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Recommendation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
