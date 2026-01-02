/**
 * CoachingCornerCard Component
 * Displays coaching content (text or video) on dashboards
 */
import { useState } from 'react';

import { ChevronDown, ChevronUp, X, Pin, ExternalLink, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { content } from '@/content/strings';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

import { CoachingEmbed } from './CoachingEmbed';

export interface CoachingItem {
  id: string;
  title: string;
  content_type: 'text' | 'youtube' | 'instagram' | 'link';
  body?: string;
  video_url?: string;
  url?: string; // Canonical URL (preferred over video_url)
  
  // Attribution fields
  creator_name?: string;
  creator_handle?: string;
  creator_url?: string;
  source_platform?: string;
  source_url?: string;
  license_note?: string;
  
  pinned: boolean;
  start_at?: string;
  end_at?: string;
}

interface CoachingCornerCardProps {
  item?: CoachingItem | null;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function CoachingCornerCard({ item, onDismiss, className }: CoachingCornerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { hasRole } = useAuth();
  const isLearner = hasRole('student');
  const isSupervisor = hasRole('supervisor');
  
  // Get role-specific description
  const description = isLearner 
    ? content.coaching.learnerDescription 
    : isSupervisor 
    ? content.coaching.supervisorDescription 
    : content.coaching.subtitle;
  
  if (!item) {
    return (
      <Card className={cn("bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl" role="img" aria-label="lightbulb">💡</span>
            {content.coaching.title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {content.coaching.empty}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const isTextContent = item.content_type === 'text';
  const isLongText = isTextContent && item.body && item.body.length > 300;
  const displayBody = isTextContent && item.body
    ? (isExpanded || !isLongText ? item.body : `${item.body.substring(0, 300)}...`)
    : null;
  
  return (
    <Card 
      className={cn(
        "overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5",
        className
      )}
    >
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">
                <span className="mr-1 text-2xl" role="img" aria-label="lightbulb">💡</span>
                {content.coaching.title}
              </CardTitle>
              {item.pinned && (
                <Badge 
                  variant="secondary" 
                  className="bg-primary/20 text-primary"
                  aria-label={content.coaching.pinned}
                >
                  <Pin className="mr-1 h-3 w-3" aria-hidden="true" />
                  {content.coaching.pinned}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              {item.title}
            </CardDescription>
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onDismiss(item.id)}
              aria-label={content.coaching.dismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Body text - shown for both text and video items */}
        {item.body && (
          <div className="space-y-2">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {isTextContent && isLongText && !isExpanded
                  ? `${item.body.substring(0, 300)}...`
                  : item.body}
              </p>
            </div>
            {isTextContent && isLongText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 text-xs"
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" aria-hidden="true" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" aria-hidden="true" />
                    Read more
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        
        {/* Video Content - embedded iframe */}
        {(item.content_type === 'youtube' || item.content_type === 'instagram') && (item.url || item.video_url) && (
          <CoachingEmbed 
            url={item.url || item.video_url || ''} 
            title={item.title}
          />
        )}
        
        {/* Attribution Footer - Required for embeds */}
        {(item.content_type === 'youtube' || item.content_type === 'instagram') && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {/* Creator attribution */}
              {item.creator_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>By</span>
                  {item.creator_url ? (
                    <a
                      href={item.creator_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {item.creator_name}
                    </a>
                  ) : (
                    <span className="font-medium">{item.creator_name}</span>
                  )}
                  {item.creator_handle && (
                    <span className="text-muted-foreground">({item.creator_handle})</span>
                  )}
                </div>
              )}
              
              {/* Source platform */}
              {item.source_platform && (
                <>
                  <span>•</span>
                  <span>Source:</span>
                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      {item.source_platform}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-medium">{item.source_platform}</span>
                  )}
                </>
              )}
            </div>
            
            {/* License note or default attribution */}
            <div className="text-xs text-muted-foreground">
              {item.license_note || (
                <span>Embedded via {item.source_platform || 'platform'} tools</span>
              )}
            </div>
            
            {/* Open on platform button */}
            {(item.url || item.video_url || item.source_url) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  const openUrl = item.url || item.video_url || item.source_url;
                  if (openUrl) {
                    window.open(openUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                Open on {item.source_platform || (item.content_type === 'youtube' ? 'YouTube' : 'Instagram')}
              </Button>
            )}
          </div>
        )}
        
        {/* Metadata */}
        {(item.start_at || item.end_at) && (
          <div className="flex items-center gap-2 border-t pt-2 text-xs text-muted-foreground">
            {item.start_at && (
              <span>
                From {new Date(item.start_at).toLocaleDateString()}
              </span>
            )}
            {item.end_at && (
              <>
                {item.start_at && <span>•</span>}
                <span>
                  Until {new Date(item.end_at).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

