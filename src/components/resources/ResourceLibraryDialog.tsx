import { useEffect, useState } from 'react';

import { Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  adminCreateResource,
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

interface ResourceLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (resource: ResourceRow) => void;
}

export function ResourceLibraryDialog({ open, onOpenChange, onCreated }: ResourceLibraryDialogProps) {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editorState, setEditorState] = useState<ResourceEditorState>(emptyEditorState);
  const [saving, setSaving] = useState(false);
  const [duplicateUrl, setDuplicateUrl] = useState<ResourceRow | null>(null);
  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string }>>([]);
  const [epas, setEpas] = useState<Array<{ id: string; code: string; title: string }>>([]);

  useEffect(() => {
    if (!open) return;
    const loadTagOptions = async () => {
      const [specialtiesResult, epasResult] = await Promise.all([
        supabase.from('specialties').select('id, name').eq('is_active', true).order('name'),
        supabase.from('epas').select('id, code, title').eq('status', 'active').order('code'),
      ]);
      if (!specialtiesResult.error) setSpecialties(specialtiesResult.data || []);
      if (!epasResult.error) setEpas(epasResult.data || []);
    };
    loadTagOptions();
  }, [open]);

  const resetState = () => {
    setEditorState(emptyEditorState);
    setDuplicateUrl(null);
  };

  const handleClose = (value: boolean) => {
    onOpenChange(value);
    if (!value) resetState();
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
    if (data) setDuplicateUrl(data as ResourceRow);
    else setDuplicateUrl(null);
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
      const resource = await adminCreateResource({
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

      const canViewResources = hasRole('admin');
      toast({
        title: 'Resource saved',
        description: 'The resource has been added as pending approval.',
        action: canViewResources ? (
          <ToastAction altText="View resources" onClick={() => navigate('/admin/resources')}>
            View resources
          </ToastAction>
        ) : undefined,
      });
      onCreated?.(resource);
      handleClose(false);
    } catch (error: any) {
      toast({
        title: 'Unable to save resource',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add resource to library</DialogTitle>
          <DialogDescription>
            Provide metadata and tags. Resources will be pending until approved by an admin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editorState.title}
                onChange={(e) => setEditorState((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={editorState.url}
                onChange={(e) => setEditorState((prev) => ({ ...prev, url: e.target.value }))}
                onBlur={() => checkDuplicateUrl(editorState.url)}
              />
              {duplicateUrl && (
                <p className="text-xs text-amber-600">
                  Duplicate URL: {duplicateUrl.title} ({duplicateUrl.status})
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
                onChange={(e) => setEditorState((prev) => ({ ...prev, publisher: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated minutes</Label>
              <Input
                type="number"
                min={1}
                value={editorState.estimated_minutes}
                onChange={(e) =>
                  setEditorState((prev) => ({ ...prev, estimated_minutes: Number(e.target.value) || 0 }))
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
              onChange={(e) => setEditorState((prev) => ({ ...prev, summary: e.target.value }))}
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
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!editorState.selectedSpecialty) return;
                    setEditorState((prev) => ({
                      ...prev,
                      specialtyTags: [...new Set([...prev.specialtyTags, prev.selectedSpecialty])],
                      selectedSpecialty: '',
                    }));
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editorState.specialtyTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setEditorState((prev) => ({ ...prev, specialtyTags: prev.specialtyTags.filter((t) => t !== tag) }))
                    }
                  >
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
                        EPA {epa.code} – {epa.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!editorState.selectedEpa) return;
                    setEditorState((prev) => ({
                      ...prev,
                      epaTags: [...new Set([...prev.epaTags, prev.selectedEpa])],
                      selectedEpa: '',
                    }));
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editorState.epaTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setEditorState((prev) => ({ ...prev, epaTags: prev.epaTags.filter((t) => t !== tag) }))
                    }
                  >
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
                onChange={(e) => setEditorState((prev) => ({ ...prev, keywordInput: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = editorState.keywordInput.trim();
                    if (v) {
                      setEditorState((prev) => ({
                        ...prev,
                        keywordTags: [...new Set([...prev.keywordTags, v])],
                        keywordInput: '',
                      }));
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const v = editorState.keywordInput.trim();
                  if (!v) return;
                  setEditorState((prev) => ({
                    ...prev,
                    keywordTags: [...new Set([...prev.keywordTags, v])],
                    keywordInput: '',
                  }));
                }}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editorState.keywordTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() =>
                    setEditorState((prev) => ({ ...prev, keywordTags: prev.keywordTags.filter((t) => t !== tag) }))
                  }
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={saveResource} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save resource
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
