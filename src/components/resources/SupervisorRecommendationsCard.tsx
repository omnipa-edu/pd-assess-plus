import { useEffect, useMemo, useState } from 'react';

import { BookmarkPlus, Clock, Link2, Plus, User } from 'lucide-react';

import { ResourceLibraryDialog } from '@/components/resources/ResourceLibraryDialog';
import { ResourceRecommendationDialog } from '@/components/resources/ResourceRecommendationDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getSupervisorStudentAssignments } from '@/lib/student-assignments';
import { getSupervisorRecommendations, type ResourceRecommendationRow } from '@/lib/resources';

interface StudentOption {
  id: string;
  name: string;
  email: string;
}

const typeLabel = (rec: ResourceRecommendationRow) => {
  if (rec.resource?.resource_type) return rec.resource.resource_type;
  if (rec.resource_type) return rec.resource_type;
  return 'resource';
};

export function SupervisorRecommendationsCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [addToLibraryOpen, setAddToLibraryOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [recommendations, setRecommendations] = useState<Array<ResourceRecommendationRow & { student_name?: string }>>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [recommendationsData, assignments] = await Promise.all([
        getSupervisorRecommendations(user.id, 10),
        getSupervisorStudentAssignments(user.id),
      ]);
      setRecommendations(recommendationsData);
      setStudents(
        assignments.map((assignment) => ({
          id: assignment.student_id,
          name: assignment.student_name || 'Student',
          email: assignment.student_email || '',
        }))
      );
    } catch (error: any) {
      console.error('Error loading recommendations', error);
      toast({
        title: 'Unable to load recommendations',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  const monthlyCount = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    return recommendations.filter((rec) => new Date(rec.created_at) >= start).length;
  }, [recommendations]);

  const countsByType = useMemo(() => {
    return recommendations.reduce<Record<string, number>>((acc, rec) => {
      const key = typeLabel(rec);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [recommendations]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Recommended Resources</CardTitle>
            <CardDescription>
              Share curated resources or paste a link with context for your learners.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Recommend a Resource
            </Button>
            <Button variant="outline" onClick={() => setAddToLibraryOpen(true)}>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Add to library
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-dashed p-3">
              <p className="text-xs text-muted-foreground">Recommendations sent this month</p>
              <p className="text-2xl font-semibold">{monthlyCount}</p>
            </Card>
            <Card className="border-dashed p-3 md:col-span-2">
              <p className="text-xs text-muted-foreground">By type</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(countsByType).length === 0 && (
                  <span className="text-xs text-muted-foreground">No recommendations yet.</span>
                )}
                {Object.entries(countsByType).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type} · {count}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Recent recommendations</p>
              {loading && <span className="text-xs text-muted-foreground">Refreshing…</span>}
            </div>
            {recommendations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No recommendations yet. Share your first resource.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {rec.resource?.title || rec.title || rec.url || 'Resource'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {typeLabel(rec)}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {rec.student_name || 'Student'}
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3" />
                        ~{rec.estimated_minutes} min
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link2 className="h-3 w-3" />
                      <span>{rec.resource?.url || rec.url || 'Link added'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ResourceRecommendationDialog
        open={open}
        onOpenChange={setOpen}
        supervisorId={user?.id || ''}
        students={students}
        onCreated={() => refresh()}
      />

      <ResourceLibraryDialog
        open={addToLibraryOpen}
        onOpenChange={setAddToLibraryOpen}
        onCreated={() => refresh()}
      />
    </>
  );
}
