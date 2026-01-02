/**
 * CoachingEditor Component
 * Form for creating/editing coaching corner content
 */
import { useState, useEffect } from 'react';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { content } from '@/content/strings';
import { useAuth } from '@/hooks/useAuth';
import type { CoachingItem } from '@/hooks/useCoachingCorner';
import { parseEmbedUrl, validateEmbedUrl, getPlatformName } from '@/lib/embeds';
import { extractUrlFromEmbedCode, isEmbedCode } from '@/lib/embeds/extract-url';
import { validateVideoUrl } from '@/lib/coaching/video-utils';

import { CoachingEmbed } from './CoachingEmbed';

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
  
  // Attribution fields
  const [creatorName, setCreatorName] = useState(initialData?.creator_name || '');
  const [creatorHandle, setCreatorHandle] = useState(initialData?.creator_handle || '');
  const [creatorUrl, setCreatorUrl] = useState(initialData?.creator_url || '');
  const [sourcePlatform, setSourcePlatform] = useState(initialData?.source_platform || '');
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url || '');
  const [licenseNote, setLicenseNote] = useState(initialData?.license_note || '');

  const isVideoType = contentType === 'youtube' || contentType === 'instagram';
  
  // Auto-fill attribution when URL changes
  useEffect(() => {
    if (isVideoType && videoUrl) {
      // Try to extract URL from embed code if needed
      let urlToProcess = videoUrl;
      if (isEmbedCode(videoUrl)) {
        const extracted = extractUrlFromEmbedCode(videoUrl);
        if (extracted) {
          urlToProcess = extracted;
          // Update the field with extracted URL (only if different)
          if (extracted !== videoUrl) {
            setVideoUrl(extracted);
          }
        }
      }
      
      // Parse and auto-fill attribution
      if (urlToProcess && !sourcePlatform) {
        const embedInfo = parseEmbedUrl(urlToProcess);
        if (embedInfo) {
          setSourcePlatform(getPlatformName(embedInfo.platform));
          setSourceUrl(urlToProcess);
        }
      }
    }
  }, [videoUrl, isVideoType, sourcePlatform]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = content.coaching.form.errors.titleRequired;
    }

    if (isVideoType) {
      if (!videoUrl.trim()) {
        newErrors.videoUrl = content.coaching.form.errors.urlRequired;
      } else {
        // Extract URL from embed code if needed
        let urlToValidate = videoUrl;
        if (isEmbedCode(videoUrl)) {
          const extracted = extractUrlFromEmbedCode(videoUrl);
          if (extracted) {
            urlToValidate = extracted;
          } else {
            newErrors.videoUrl = 'Could not extract URL from embed code. Please paste a valid URL or embed code.';
            setErrors(newErrors);
            return false;
          }
        }
        
        const validation = validateEmbedUrl(urlToValidate, contentType);
        if (!validation.valid) {
          newErrors.videoUrl = validation.error || 'Invalid URL';
        }
      }
      
      // Require creator name for embeds
      if (!creatorName.trim()) {
        newErrors.creatorName = 'Creator name is required for embedded content';
      }
      
      // Require source URL
      if (!sourceUrl.trim()) {
        newErrors.sourceUrl = 'Source URL is required';
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
      // Extract URL from embed code if needed
      let finalUrl = videoUrl;
      if (isEmbedCode(videoUrl)) {
        const extracted = extractUrlFromEmbedCode(videoUrl);
        if (extracted) {
          finalUrl = extracted;
        }
      }
      
      data.video_url = finalUrl;
      data.url = finalUrl; // Also set url field
      // Allow body/caption for video items
      data.body = body || undefined;
      
      // Attribution fields
      data.creator_name = creatorName;
      data.creator_handle = creatorHandle || undefined;
      data.creator_url = creatorUrl || undefined;
      data.source_platform = sourcePlatform;
      data.source_url = sourceUrl || videoUrl;
      data.license_note = licenseNote || undefined;
    } else {
      data.body = body;
      data.video_url = undefined;
      data.url = undefined;
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
                    <Label htmlFor="video-url">
                      Video URL or Embed Code
                    </Label>
                    <Textarea
                      id="video-url"
                      value={videoUrl}
                      onChange={(e) => {
                        const value = e.target.value;
                        setVideoUrl(value);
                      }}
                      onPaste={(e) => {
                        // Handle paste event to extract URL from embed code
                        const pastedText = e.clipboardData.getData('text');
                        
                        // Check if pasted content is embed code
                        if (isEmbedCode(pastedText)) {
                          const extractedUrl = extractUrlFromEmbedCode(pastedText);
                          if (extractedUrl) {
                            e.preventDefault();
                            setVideoUrl(extractedUrl);
                            
                            // Clear any existing errors
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.videoUrl;
                              return newErrors;
                            });
                            
                            // Trigger auto-fill of attribution fields
                            const embedInfo = parseEmbedUrl(extractedUrl);
                            if (embedInfo && !sourcePlatform) {
                              setSourcePlatform(getPlatformName(embedInfo.platform));
                              setSourceUrl(extractedUrl);
                            }
                            
                            // Show success message briefly
                            const validation = validateEmbedUrl(extractedUrl, contentType);
                            if (!validation.valid) {
                              setTimeout(() => {
                                setErrors(prev => ({
                                  ...prev,
                                  videoUrl: validation.error || 'Invalid URL',
                                }));
                              }, 100);
                            }
                          }
                        }
                        // If not embed code, let default paste behavior happen
                      }}
                      placeholder="Paste YouTube/Instagram URL or embed code (iframe)..."
                      rows={3}
                      className={errors.videoUrl ? 'border-destructive font-mono text-sm' : 'font-mono text-sm'}
                    />
                    {errors.videoUrl ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.videoUrl}</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {content.coaching.form.videoHelp}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          💡 Tip: You can paste either a URL (e.g., https://youtube.com/watch?v=...) or embed code (e.g., &lt;iframe src="..."&gt;). The URL will be automatically extracted.
                        </p>
                      </div>
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
                  
                  {/* Attribution Section */}
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Attribution (Required for Embeds)</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Provide attribution information for the embedded content. This ensures proper credit and compliance.
                      </p>
                    </div>
                    
                    {/* Creator Name */}
                    <div className="space-y-2">
                      <Label htmlFor="creator-name">
                        Creator Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="creator-name"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="e.g., John Smith"
                        className={errors.creatorName ? 'border-destructive' : ''}
                        required
                      />
                      {errors.creatorName && (
                        <p className="text-xs text-destructive">{errors.creatorName}</p>
                      )}
                    </div>
                    
                    {/* Creator Handle */}
                    <div className="space-y-2">
                      <Label htmlFor="creator-handle">Creator Handle (Optional)</Label>
                      <Input
                        id="creator-handle"
                        value={creatorHandle}
                        onChange={(e) => setCreatorHandle(e.target.value)}
                        placeholder="e.g., @username or Channel Name"
                      />
                      <p className="text-xs text-muted-foreground">
                        Instagram handle, YouTube channel name, etc.
                      </p>
                    </div>
                    
                    {/* Creator URL */}
                    <div className="space-y-2">
                      <Label htmlFor="creator-url">Creator Profile URL (Optional)</Label>
                      <Input
                        id="creator-url"
                        type="url"
                        value={creatorUrl}
                        onChange={(e) => setCreatorUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Link to creator's profile or channel
                      </p>
                    </div>
                    
                    {/* Source Platform (Auto-filled) */}
                    <div className="space-y-2">
                      <Label htmlFor="source-platform">Source Platform</Label>
                      <Input
                        id="source-platform"
                        value={sourcePlatform}
                        onChange={(e) => setSourcePlatform(e.target.value)}
                        placeholder="YouTube or Instagram"
                        readOnly
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-filled from URL
                      </p>
                    </div>
                    
                    {/* Source URL */}
                    <div className="space-y-2">
                      <Label htmlFor="source-url">
                        Source URL <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="source-url"
                        type="url"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder="https://..."
                        className={errors.sourceUrl ? 'border-destructive' : ''}
                        required
                      />
                      {errors.sourceUrl && (
                        <p className="text-xs text-destructive">{errors.sourceUrl}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Original content URL (usually same as video URL)
                      </p>
                    </div>
                    
                    {/* License Note */}
                    <div className="space-y-2">
                      <Label htmlFor="license-note">License Note (Optional)</Label>
                      <Input
                        id="license-note"
                        value={licenseNote}
                        onChange={(e) => setLicenseNote(e.target.value)}
                        placeholder="e.g., Embedded with permission"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional note about licensing or permissions
                      </p>
                    </div>
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
              <div className="space-y-3 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:from-primary/10 dark:to-primary/5">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <span>💡</span>
                    {content.coaching.title}
                    {pinned && (
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">
                        Pinned
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {title || 'Your title will appear here'}
                  </p>
                </div>

                {/* Body text - shown for both text and video items */}
                {body && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-sm">{body}</p>
                  </div>
                )}

                {/* Video embed */}
                {isVideoType && videoUrl && !errors.videoUrl && (
                  <>
                    <CoachingEmbed url={videoUrl} title={title} />
                    {/* Attribution Preview */}
                    {(creatorName || sourcePlatform) && (
                      <div className="mt-3 border-t pt-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {creatorName && (
                            <div className="flex items-center gap-1">
                              <span>By</span>
                              {creatorUrl ? (
                                <a href={creatorUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                  {creatorName}
                                </a>
                              ) : (
                                <span className="font-medium">{creatorName}</span>
                              )}
                              {creatorHandle && (
                                <span className="text-muted-foreground">({creatorHandle})</span>
                              )}
                            </div>
                          )}
                          {sourcePlatform && (
                            <>
                              {creatorName && <span>•</span>}
                              <span>Source: <span className="font-medium">{sourcePlatform}</span></span>
                            </>
                          )}
                        </div>
                        {licenseNote && (
                          <div className="text-xs text-muted-foreground">
                            {licenseNote}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Text content */}
                {!isVideoType && !body && (
                  <p className="text-sm italic text-muted-foreground">
                    Add content to see preview
                  </p>
                )}

                {/* Video without URL */}
                {isVideoType && !videoUrl && (
                  <p className="text-sm italic text-muted-foreground">
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

