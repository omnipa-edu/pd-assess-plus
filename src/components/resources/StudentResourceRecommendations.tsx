import { useEffect, useMemo, useState } from 'react';

import { CheckCircle2, Clock, ExternalLink, Info, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { containsPotentialPhi, PHI_WARNING_TEXT } from '@/lib/phi';
import {
  getLearningPlanItems,
  getStudentRecommendations,
  saveToLearningPlan,
  updateLearningPlanItem,
  type LearningPlanItem,
  type ResourceRecommendationRow,
} from '@/lib/resources';

const renderTags = (tags?: { epa: string[]; specialty: string[]; keyword: string[]; level: string[] }) => {
  if (!tags) return null;
  const items = [...tags.epa, ...tags.specialty, ...tags.keyword, ...tags.level];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export function StudentResourceRecommendations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<ResourceRecommendationRow[]>([]);
  const [planItems, setPlanItems] = useState<LearningPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [recData, planData] = await Promise.all([
        getStudentRecommendations(user.id),
        getLearningPlanItems(user.id),
      ]);
      setRecommendations(recData);
      setPlanItems(planData);
      setNoteDrafts(
        planData.reduce<Record<string, string>>((acc, item) => {
          acc[item.id] = item.notes || '';
          return acc;
        }, {})
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
    loadData();
  }, [user?.id]);

  const savedRecommendationIds = useMemo(() => {
    return new Set(planItems.map((item) => item.resource_recommendation_id));
  }, [planItems]);

  const savedItems = planItems.filter((item) => item.status === 'saved');
  const completedItems = planItems.filter((item) => item.status === 'completed');

  const handleSave = async (recommendationId: string) => {
    if (!user?.id) return;
    setSavingId(recommendationId);
    try {
      await saveToLearningPlan(user.id, recommendationId);
      toast({
        title: 'Saved to learning plan',
        description: 'You can track this resource in your learning plan.',
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Unable to save',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const handlePlanUpdate = async (itemId: string, payload: { status?: LearningPlanItem['status']; notes?: string | null }) => {
    setUpdatingId(itemId);
    try {
      await updateLearningPlanItem(itemId, payload);
      await loadData();
      toast({
        title: 'Learning plan updated',
        description: 'Your learning plan has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Unable to update',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended by your supervisor</CardTitle>
          <CardDescription>
            Resources selected for you with a brief explanation and estimated time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading recommendations...
            </div>
          )}
          {!loading && recommendations.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No recommendations yet.
            </div>
          )}
          {!loading && recommendations.map((rec) => (
            <div key={rec.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {rec.resource?.title || rec.title || rec.url || 'Resource'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recommended by {rec.supervisor_name || 'Supervisor'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> ~{rec.estimated_minutes} minutes
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{rec.why_suggested}</p>
              {renderTags(rec.tags)}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = rec.resource?.url || rec.url;
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Resource
                </Button>
                <Button
                  size="sm"
                  disabled={savingId === rec.id || savedRecommendationIds.has(rec.id)}
                  onClick={() => handleSave(rec.id)}
                >
                  {savingId === rec.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {savedRecommendationIds.has(rec.id) ? 'Saved' : 'Save to my learning plan'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My learning plan</CardTitle>
          <CardDescription>Track resources you saved and mark them complete.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="saved">
            <TabsList className="mb-4">
              <TabsTrigger value="saved">Saved</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="saved" className="space-y-4">
              {savedItems.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Save a recommendation to start tracking it here.
                </div>
              )}
              {savedItems.map((item) => {
                const recommendation = item.recommendation;
                const note = noteDrafts[item.id] || '';
                const phiNoteWarning = containsPotentialPhi(note);
                return (
                  <div key={item.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {recommendation?.resource?.title || recommendation?.title || recommendation?.url || 'Resource'}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = recommendation?.resource?.url || recommendation?.url;
                          if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        Open
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Info className="mr-1 inline h-3 w-3" />
                      {PHI_WARNING_TEXT}
                    </div>
                    <Textarea
                      value={note}
                      onChange={(event) =>
                        setNoteDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                      placeholder="Add a note (no patient identifiers)"
                    />
                    {phiNoteWarning && (
                      <p className="text-xs text-amber-600">{PHI_WARNING_TEXT}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePlanUpdate(item.id, { status: 'completed' })}
                        disabled={updatingId === item.id}
                      >
                        Mark completed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlanUpdate(item.id, { notes: note })}
                        disabled={updatingId === item.id}
                      >
                        Save note
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePlanUpdate(item.id, { status: 'archived' })}
                        disabled={updatingId === item.id}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedItems.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Completed items will appear here.
                </div>
              )}
              {completedItems.map((item) => {
                const recommendation = item.recommendation;
                return (
                  <div key={item.id} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {recommendation?.resource?.title || recommendation?.title || recommendation?.url || 'Resource'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Completed {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePlanUpdate(item.id, { status: 'archived' })}
                        disabled={updatingId === item.id}
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
