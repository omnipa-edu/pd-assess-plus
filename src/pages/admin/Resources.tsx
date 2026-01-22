import { useEffect, useMemo, useState } from 'react';

import { Archive, CheckCircle2, Loader2, Plus, Search, Pencil } from 'lucide-react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  adminApproveResource,
  adminArchiveResource,
  adminCreateResource,
  adminUpdateResource,
  type ResourceLevel,
  type ResourceRow,
  type ResourceTag,
  type ResourceType,
} from '@/lib/resources';

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

const STATUS_OPTIONS: Array<ResourceRow['status'] | 'all'> = ['all', 'pending', 'approved', 'archived'];

interface ResourceEditorState {
  title: string;
  url: string;
  resource_type: ResourceType;
  publisher: string;
  summary: string;
  estimated_minutes: number;
  level: ResourceLevel;
  specialtyTags: string[];
  epaTags: string[];
  keywordTags: string[];
  selectedSpecialty: string;
  selectedEpa: string;
  keywordInput: string;
}

const emptyEditorState: ResourceEditorState = {
  title: '',
  url: '',
  resource_type: 'article',
  publisher: '',
  summary: '',
  estimated_minutes: 10,
  level: 'student',
  specialtyTags: [],
  epaTags: [],
  keywordTags: [],
  selectedSpecialty: '',
  selectedEpa: '',
  keywordInput: '',
};

const toTagPayload = (state: ResourceEditorState): Array<{ tag_type: ResourceTag['tag_type']; tag_value: string }> => [
  ...state.specialtyTags.map((tag) => ({ tag_type: 'specialty' as const, tag_value: tag })),
  ...state.epaTags.map((tag) => ({ tag_type: 'epa' as const, tag_value: tag })),
  ...state.keywordTags.map((tag) => ({ tag_type: 'keyword' as const, tag_value: tag })),
  { tag_type: 'level' as const, tag_value: state.level },
];

const mapTags = (tags: ResourceTag[]) => {
  return {
    specialtyTags: tags.filter((tag) => tag.tag_type === 'specialty').map((tag) => tag.tag_value),
    epaTags: tags.filter((tag) => tag.tag_type === 'epa').map((tag) => tag.tag_value),
    keywordTags: tags.filter((tag) => tag.tag_type === 'keyword').map((tag) => tag.tag_value),
  };
};

const fetchResourceTags = async (resourceIds: string[]) => {
  if (resourceIds.length === 0) return new Map<string, ResourceTag[]>();
  const { data, error } = await supabase
    .from('resource_tag_map')
    .select('resource_id, tag:resource_tags(id, tag_type, tag_value)')
    .in('resource_id', resourceIds);
  if (error) throw error;

  const map = new Map<string, ResourceTag[]>();
  (data || []).forEach((row: any) => {
    if (!row.tag) return;
    const list = map.get(row.resource_id) || [];
    list.push(row.tag as ResourceTag);
    map.set(row.resource_id, list);
  });
  return map;
};

export default function ResourcesAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResourceRow['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<ResourceLevel | 'all'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRow | null>(null);
  const [editorState, setEditorState] = useState<ResourceEditorState>(emptyEditorState);
  const [saving, setSaving] = useState(false);
  const [duplicateUrl, setDuplicateUrl] = useState<ResourceRow | null>(null);
  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string }>>([]);
  const [epas, setEpas] = useState<Array<{ id: string; code: string; title: string }>>([]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as ResourceRow[];
      const tagMap = await fetchResourceTags(rows.map((row) => row.id));
      setResources(
        rows.map((row) => ({
          ...row,
          tags: tagMap.get(row.id)
            ? {
                epa: tagMap.get(row.id)!.filter((tag) => tag.tag_type === 'epa').map((tag) => tag.tag_value),
                specialty: tagMap.get(row.id)!.filter((tag) => tag.tag_type === 'specialty').map((tag) => tag.tag_value),
                keyword: tagMap.get(row.id)!.filter((tag) => tag.tag_type === 'keyword').map((tag) => tag.tag_value),
                level: tagMap.get(row.id)!.filter((tag) => tag.tag_type === 'level').map((tag) => tag.tag_value),
              }
            : undefined,
        }))
      );
    } catch (error: any) {
      toast({
        title: 'Error loading resources',
        description: error.message || 'Unable to load resources.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTagOptions = async () => {
    const [specialtiesResult, epasResult] = await Promise.all([
      supabase.from('specialties').select('id, name').eq('is_active', true).order('name'),
      supabase.from('epas').select('id, code, title').eq('status', 'active').order('code'),
    ]);
    if (!specialtiesResult.error) setSpecialties(specialtiesResult.data || []);
    if (!epasResult.error) setEpas(epasResult.data || []);
  };

  useEffect(() => {
    loadResources();
    loadTagOptions();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      if (statusFilter !== 'all' && resource.status !== statusFilter) return false;
      if (typeFilter !== 'all' && resource.resource_type !== typeFilter) return false;
      if (levelFilter !== 'all' && resource.level !== levelFilter) return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matchesTitle = resource.title.toLowerCase().includes(term);
        const matchesPublisher = resource.publisher?.toLowerCase().includes(term);
        const matchesUrl = resource.url.toLowerCase().includes(term);
        if (!matchesTitle && !matchesPublisher && !matchesUrl) return false;
      }
      return true;
    });
  }, [resources, statusFilter, typeFilter, levelFilter, search]);

  const openCreate = () => {
    setEditingResource(null);
    setEditorState(emptyEditorState);
    setDuplicateUrl(null);
    setEditorOpen(true);
  };

  const openEdit = async (resource: ResourceRow) => {
    setEditingResource(resource);
    setEditorState({
      ...emptyEditorState,
      title: resource.title,
      url: resource.url,
      resource_type: resource.resource_type,
      publisher: resource.publisher || '',
      summary: resource.summary || '',
      estimated_minutes: resource.estimated_minutes,
      level: resource.level,
      ...mapTags(
        Object.entries(resource.tags || {}).flatMap(([type, values]) =>
          values.map((value) => ({ tag_type: type as ResourceTag['tag_type'], tag_value: value }))
        )
      ),
    });
    setDuplicateUrl(null);
    setEditorOpen(true);
  };

  const checkDuplicateUrl = async (url: string) => {
    if (!url.trim()) {
      setDuplicateUrl(null);
      return;
    }
    const { data } = await supabase
      .from('resources')
      .select('id, title, status')
      .eq('url', url.trim())
      .maybeSingle();
    if (data && data.id !== editingResource?.id) {
      setDuplicateUrl(data as ResourceRow);
    } else {
      setDuplicateUrl(null);
    }
  };

  const saveResource = async () => {
    if (!user?.id) return;
    if (!editorState.title.trim() || !editorState.url.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Title and URL are required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const tagPayload = toTagPayload(editorState);
      if (editingResource) {
        await adminUpdateResource(editingResource.id, {
          title: editorState.title.trim(),
          url: editorState.url.trim(),
          resource_type: editorState.resource_type,
          publisher: editorState.publisher || null,
          summary: editorState.summary || null,
          estimated_minutes: editorState.estimated_minutes,
          level: editorState.level,
          tags: tagPayload,
        });
      } else {
        await adminCreateResource({
          title: editorState.title.trim(),
          url: editorState.url.trim(),
          resource_type: editorState.resource_type,
          publisher: editorState.publisher || null,
          summary: editorState.summary || null,
          estimated_minutes: editorState.estimated_minutes,
          level: editorState.level,
          tags: tagPayload,
          created_by: user.id,
        });
      }

      toast({
        title: 'Resource saved',
        description: 'The resource has been saved.',
      });
      setEditorOpen(false);
      await loadResources();
    } catch (error: any) {
      toast({
        title: 'Unable to save resource',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (resourceId: string) => {
    if (!user?.id) return;
    try {
      await adminApproveResource(resourceId, user.id);
      toast({ title: 'Resource approved' });
      loadResources();
    } catch (error: any) {
      toast({
        title: 'Unable to approve',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (resourceId: string) => {
    try {
      await adminArchiveResource(resourceId);
      toast({ title: 'Resource archived' });
      loadResources();
    } catch (error: any) {
      toast({
        title: 'Unable to archive',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Resources</h1>
              <p className="text-muted-foreground">Curate and approve resources for the library.</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add resource
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Library</CardTitle>
              <CardDescription>Search, filter, and manage curated resources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, publisher, URL"
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ResourceRow['status'] | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ResourceType | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
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
                <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as ResourceLevel | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Level" />
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

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading resources...
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No resources found.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResources.map((resource) => (
                    <div key={resource.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{resource.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {resource.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{resource.publisher || resource.url}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">{resource.resource_type}</Badge>
                          <Badge variant="outline">~{resource.estimated_minutes} min</Badge>
                          <Badge variant="outline">{resource.level}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(resource)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        {resource.status !== 'approved' && (
                          <Button size="sm" onClick={() => handleApprove(resource.id)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {resource.status !== 'archived' && (
                          <Button variant="outline" size="sm" onClick={() => handleArchive(resource.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingResource ? 'Edit resource' : 'Create resource'}</DialogTitle>
              <DialogDescription>
                Provide metadata and tags. Pending resources require approval before appearing in the library.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editorState.title}
                    onChange={(event) => setEditorState((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={editorState.url}
                    onChange={(event) => setEditorState((prev) => ({ ...prev, url: event.target.value }))}
                    onBlur={() => checkDuplicateUrl(editorState.url)}
                  />
                  {duplicateUrl && (
                    <p className="text-xs text-amber-600">
                      Duplicate URL detected: {duplicateUrl.title} ({duplicateUrl.status})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editorState.resource_type}
                    onValueChange={(value) => setEditorState((prev) => ({ ...prev, resource_type: value as ResourceType }))}
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
                    value={editorState.publisher}
                    onChange={(event) => setEditorState((prev) => ({ ...prev, publisher: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated minutes</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editorState.estimated_minutes}
                    onChange={(event) =>
                      setEditorState((prev) => ({ ...prev, estimated_minutes: Number(event.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={editorState.level}
                    onValueChange={(value) => setEditorState((prev) => ({ ...prev, level: value as ResourceLevel }))}
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

              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea
                  value={editorState.summary}
                  onChange={(event) => setEditorState((prev) => ({ ...prev, summary: event.target.value }))}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Specialty tags</Label>
                  <div className="flex gap-2">
                    <Select
                      value={editorState.selectedSpecialty}
                      onValueChange={(value) => setEditorState((prev) => ({ ...prev, selectedSpecialty: value }))}
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
                        if (!editorState.selectedSpecialty) return;
                        setEditorState((prev) => ({
                          ...prev,
                          specialtyTags: Array.from(new Set([...prev.specialtyTags, prev.selectedSpecialty])),
                          selectedSpecialty: '',
                        }));
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editorState.specialtyTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => {
                        setEditorState((prev) => ({
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
                      value={editorState.selectedEpa}
                      onValueChange={(value) => setEditorState((prev) => ({ ...prev, selectedEpa: value }))}
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
                        if (!editorState.selectedEpa) return;
                        setEditorState((prev) => ({
                          ...prev,
                          epaTags: Array.from(new Set([...prev.epaTags, prev.selectedEpa])),
                          selectedEpa: '',
                        }));
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editorState.epaTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => {
                        setEditorState((prev) => ({
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
                    value={editorState.keywordInput}
                    onChange={(event) => setEditorState((prev) => ({ ...prev, keywordInput: event.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const value = editorState.keywordInput.trim();
                      if (!value) return;
                      setEditorState((prev) => ({
                        ...prev,
                        keywordTags: Array.from(new Set([...prev.keywordTags, value])),
                        keywordInput: '',
                      }));
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editorState.keywordTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => {
                      setEditorState((prev) => ({
                        ...prev,
                        keywordTags: prev.keywordTags.filter((value) => value !== tag),
                      }));
                    }}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditorOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveResource} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Resource
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
