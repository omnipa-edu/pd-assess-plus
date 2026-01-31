/**
 * Admin Resource Library Widget
 * Shows recent library content on the admin dashboard (similar to Coaching Corner setup)
 */
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { ResourceRow, ResourceStatus } from '@/lib/resources';

const STATUS_VARIANT: Record<ResourceStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  archived: 'outline',
};

async function fetchRecentResources(limit: number): Promise<ResourceRow[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as ResourceRow[];
}

const RESOURCE_LIMIT = 8;

export function AdminResourceLibraryWidget() {
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['admin-resource-library', RESOURCE_LIMIT],
    queryFn: () => fetchRecentResources(RESOURCE_LIMIT),
    staleTime: 2 * 60 * 1000,
  });

  const pendingCount = resources?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Resource Library
        </CardTitle>
        <CardDescription>
          Curated resources for learners. {pendingCount > 0 && `${pendingCount} pending approval.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load resources. Try again later.
          </p>
        )}
        {!isLoading && !error && resources && (
          <>
            <div className="space-y-2">
              {resources.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No resources yet. Add one from the header or manage at Resources.
                </p>
              ) : (
                resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-foreground" title={resource.title}>
                        {resource.title}
                      </h4>
                      <p className="truncate text-xs text-muted-foreground">
                        {resource.resource_type}
                        {resource.publisher ? ` · ${resource.publisher}` : ''}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[resource.status]} className="shrink-0 capitalize">
                      {resource.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/resources" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View all resources
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
