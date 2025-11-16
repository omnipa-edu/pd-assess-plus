/**
 * CoachingEditor Component
 * Form for creating/editing coaching corner content
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CoachingEmbed } from './CoachingEmbed';
import { validateVideoUrl } from '@/lib/coaching/video-utils';
import { content } from '@/content/strings';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import type { CoachingItem } from '@/hooks/useCoachingCorner';

interface CoachingEditorProps {
  initialData?: Partial<CoachingItem>;
  onSave: (data: Partial<CoachingItem>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function CoachingEditor({ initialData, onSave, onCancel, loading }: CoachingEditorProps) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [contentType, setContentType] = useState<'text' | 'youtube' | 'instagram'>(
    initialData?.content_type || 'text'
  );
  const [body, setBody] = useState(initialData?.body || '');
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || '');
  const [audience, setAudience] = useState<'all' | 'supervisors' | 'learners'>(
    initialData?.audience || 'all'
  );
  const [roleScope, setRoleScope] = useState<'admin' | 'supervisor'>(
    initialData?.role_scope || (isAdmin ? 'admin' : 'supervisor')
  );
  const [startAt, setStartAt] = useState(
    initialData?.start_at ? new Date(initialData.start_at).toISOString().slice(0, 16) : ''
  );
  const [endAt, setEndAt] = useState(
    initialData?.end_at ? new Date(initialData.end_at).toISOString().slice(0, 16) : ''
  );
  const [pinned, setPinned] = useState(initialData?.pinned || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isVideoType = contentType === 'youtube' || contentType === 'instagram';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = content.coaching.form.errors.titleRequired;
    }

    if (isVideoType) {
      if (!videoUrl.trim()) {
        newErrors.videoUrl = content.coaching.form.errors.urlRequired;
      } else {
        const urlError = validateVideoUrl(videoUrl);
        if (urlError) {
          newErrors.videoUrl = urlError;
        }
      }
    } else {
      if (!body.trim()) {
        newErrors.body = content.coaching.form.errors.contentRequired;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const data: Partial<CoachingItem> = {
      title,
      content_type: contentType,
      audience,
      role_scope: roleScope,
      pinned,
      is_active: true,
    };

    if (isVideoType) {
      data.video_url = videoUrl;
      // Allow body/caption for video items
      data.body = body || undefined;
    } else {
      data.body = body;
      data.video_url = undefined;
    }

    if (startAt) {
      data.start_at = new Date(startAt).toISOString();
    }

    if (endAt) {
      data.end_at = new Date(endAt).toISOString();
    }

    if (initialData?.id) {
      data.id = initialData.id;
    }

    try {
      await onSave(data);
    } catch (error) {
      console.error('Error saving coaching:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{content.coaching.form.title}</CardTitle>
              <CardDescription>
                {content.coaching.form.bodyHelp}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{content.coaching.form.titleLabel}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={content.coaching.form.titlePlaceholder}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label htmlFor="content-type">{content.coaching.form.contentType}</Label>
                <Select value={contentType} onValueChange={(val) => setContentType(val as any)}>
                  <SelectTrigger id="content-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{content.coaching.form.contentTypes.text}</SelectItem>
                    <SelectItem value="youtube">{content.coaching.form.contentTypes.youtube}</SelectItem>
                    <SelectItem value="instagram">{content.coaching.form.contentTypes.instagram}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text Body */}
              {!isVideoType && (
                <div className="space-y-2">
                  <Label htmlFor="body">{content.coaching.form.bodyLabel}</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={content.coaching.form.bodyPlaceholder}
                    rows={6}
                    className={errors.body ? 'border-destructive' : ''}
                    maxLength={1000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{errors.body || content.coaching.form.bodyHelp}</span>
                    <span>{body.length}/1000</span>
                  </div>
                </div>
              )}

              {/* Video URL */}
              {isVideoType && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-url">{content.coaching.form.videoUrlLabel}</Label>
                    <Input
                      id="video-url"
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={content.coaching.form.videoUrlPlaceholder}
                      className={errors.videoUrl ? 'border-destructive' : ''}
                    />
                    {errors.videoUrl ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.videoUrl}</AlertDescription>
                      </Alert>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {content.coaching.form.videoHelp}
                      </p>
                    )}
                  </div>
                  
                  {/* Body/Caption for video items */}
                  <div className="space-y-2">
                    <Label htmlFor="body">Caption or Description</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Add a caption or description that appears above the video..."
                      rows={3}
                      className={errors.body ? 'border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      This text will appear above the video to provide context
                    </p>
                  </div>
                </div>
              )}

              {/* Audience */}
              <div className="space-y-2">
                <Label htmlFor="audience">{content.coaching.form.audienceLabel}</Label>
                <Select value={audience} onValueChange={(val) => setAudience(val as any)}>
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{content.coaching.form.audiences.all}</SelectItem>
                    <SelectItem value="supervisors">{content.coaching.form.audiences.supervisors}</SelectItem>
                    <SelectItem value="learners">{content.coaching.form.audiences.learners}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Scope (Admin Only) */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="role-scope">Content Level</Label>
                  <Select value={roleScope} onValueChange={(val) => setRoleScope(val as any)}>
                    <SelectTrigger id="role-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Organization-wide (Admin)</SelectItem>
                      <SelectItem value="supervisor">Supervisor-level</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Admin: Visible across the entire organization. Supervisor: Scoped to supervisor's learners.
                  </p>
                </div>
              )}

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start-at">{content.coaching.form.startDateLabel}</Label>
                <Input
                  id="start-at"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end-at">{content.coaching.form.endDateLabel}</Label>
                <Input
                  id="end-at"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>

              {/* Pinned */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="pinned">{content.coaching.form.pinnedLabel}</Label>
                  <p className="text-sm text-muted-foreground">
                    {content.coaching.form.pinnedHelp}
                  </p>
                </div>
                <Switch
                  id="pinned"
                  checked={pinned}
                  onCheckedChange={setPinned}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              {content.coaching.form.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (initialData?.id ? content.coaching.form.update : content.coaching.form.save)}
            </Button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How it will appear to users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span>💡</span>
                    {content.coaching.title}
                    {pinned && (
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                        Pinned
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {title || 'Your title will appear here'}
                  </p>
                </div>

                {/* Body text - shown for both text and video items */}
                {body && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm whitespace-pre-wrap">{body}</p>
                  </div>
                )}

                {/* Video embed */}
                {isVideoType && videoUrl && !errors.videoUrl && (
                  <CoachingEmbed url={videoUrl} title={title} />
                )}

                {/* Text content */}
                {!isVideoType && !body && (
                  <p className="text-sm text-muted-foreground italic">
                    Add content to see preview
                  </p>
                )}

                {/* Video without URL */}
                {isVideoType && !videoUrl && (
                  <p className="text-sm text-muted-foreground italic">
                    Add video URL to see preview
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

