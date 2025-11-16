/**
 * CoachingEmbed Component
 * Safe video embedding with YouTube (privacy-enhanced) and Instagram support
 */
import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { AspectBox } from '@/components/ui/aspect-box';
import { parseVideoUrl } from '@/lib/coaching/video-utils';
import { content } from '@/content/strings';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface CoachingEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

interface InstagramEmbedData {
  html: string;
  width: number;
  height: number;
  version: string;
  provider_name: string;
  provider_url: string;
  author_name: string;
  author_url: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export function CoachingEmbed({ url, title, className }: CoachingEmbedProps) {
  const videoInfo = parseVideoUrl(url);
  const [instagramEmbed, setInstagramEmbed] = useState<InstagramEmbedData | null>(null);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  // Fetch Instagram oEmbed data
  useEffect(() => {
    if (videoInfo.platform === 'instagram' && !instagramEmbed && !instagramLoading && !instagramError) {
      setInstagramLoading(true);
      setInstagramError(null);
      
      // Try Edge Function first, fallback to direct API call
      const fetchInstagramEmbed = async () => {
        try {
          // First, try Supabase Edge Function
          const { data, error } = await supabase.functions.invoke('instagram-oembed', {
            body: { url },
          });

          if (error) {
            console.warn('Edge Function failed, trying direct API:', error);
            throw error; // Will trigger fallback
          }

          if (data) {
            setInstagramEmbed(data as InstagramEmbedData);
            return;
          }
        } catch (edgeFunctionError) {
          // Fallback: Call Instagram oEmbed API directly
          try {
            const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
            const response = await fetch(oembedUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            });

            if (!response.ok) {
              throw new Error(`Instagram API error: ${response.status}`);
            }

            const data = await response.json();
            setInstagramEmbed(data as InstagramEmbedData);
          } catch (directApiError) {
            console.error('Both Edge Function and direct API failed:', directApiError);
            setInstagramError(
              directApiError instanceof Error 
                ? directApiError.message 
                : 'Failed to load Instagram embed. Please check the URL or try again later.'
            );
          }
        } finally {
          setInstagramLoading(false);
        }
      };

      fetchInstagramEmbed();
    }
  }, [videoInfo.platform, url, instagramEmbed, instagramLoading, instagramError]);

  // Load Instagram embed script when embed HTML is ready
  useEffect(() => {
    if (instagramEmbed && !scriptLoadedRef.current) {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="instagram.com/embed"]');
      if (existingScript) {
        scriptLoadedRef.current = true;
        // Process embeds if script is already loaded
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
        }
        return;
      }

      // Load Instagram embed script
      const script = document.createElement('script');
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
        }
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup: don't remove script as it might be used by other embeds
      };
    }
  }, [instagramEmbed]);

  // YouTube embed
  if (videoInfo.platform === 'youtube' && videoInfo.embedUrl && videoInfo.id) {
    return (
      <AspectBox className={className}>
        <iframe
          title={title || 'Coaching video'}
          src={videoInfo.embedUrl}
          className="h-full w-full rounded-lg"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="no-referrer"
          allowFullScreen
          frameBorder="0"
        />
      </AspectBox>
    );
  }

  // Instagram embed
  if (videoInfo.platform === 'instagram') {
    // Loading state
    if (instagramLoading) {
      return (
        <div className={className}>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading Instagram content...</span>
          </div>
        </div>
      );
    }

    // Error state - fallback to link
    if (instagramError || !instagramEmbed) {
      return (
        <div className={className}>
          <div className="rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
            {instagramError && (
              <p className="mb-4 text-sm text-muted-foreground">{instagramError}</p>
            )}
            <Button
              variant="outline"
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
              View on Instagram
            </Button>
          </div>
        </div>
      );
    }

    // Render Instagram embed HTML
    return (
      <div className={className}>
        <div
          className="instagram-embed-container"
          dangerouslySetInnerHTML={{ __html: instagramEmbed.html }}
        />
      </div>
    );
  }

  // Fallback for unrecognized URLs
  return (
    <div className={className}>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      >
        <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
        {content.coaching.embed.loadError}
      </Button>
    </div>
  );
}

