/**
 * CoachingCornerCard Component
 * Displays coaching content (text or video) on dashboards
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Pin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CoachingEmbed } from './CoachingEmbed';
import { content } from '@/content/strings';
import { cn } from '@/lib/utils';

export interface CoachingItem {
  id: string;
  title: string;
  content_type: 'text' | 'youtube' | 'instagram';
  body?: string;
  video_url?: string;
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
  
  if (!item) {
    return (
      <Card className={cn("bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl" role="img" aria-label="lightbulb">💡</span>
            {content.coaching.title}
          </CardTitle>
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
        "bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 overflow-hidden",
        className
      )}
    >
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">
                <span className="text-2xl mr-1" role="img" aria-label="lightbulb">💡</span>
                {content.coaching.title}
              </CardTitle>
              {item.pinned && (
                <Badge 
                  variant="secondary" 
                  className="bg-primary/20 text-primary"
                  aria-label={content.coaching.pinned}
                >
                  <Pin className="h-3 w-3 mr-1" aria-hidden="true" />
                  {content.coaching.pinned}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              {item.title}
            </CardDescription>
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
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
                className="text-xs h-7"
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
        {(item.content_type === 'youtube' || item.content_type === 'instagram') && item.video_url && (
          <CoachingEmbed 
            url={item.video_url} 
            title={item.title}
          />
        )}
        
        {/* Metadata */}
        {(item.start_at || item.end_at) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
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

