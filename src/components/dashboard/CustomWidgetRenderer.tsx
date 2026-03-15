/**
 * CustomWidgetRenderer
 * Handles special widget rendering that can't be done through the registry
 */

import { ReactNode } from 'react';

import { ClipboardList, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EpaTrajectoryView } from '@/components/benchmarks/EpaTrajectoryView';
import ReadinessCard from '@/components/ReadinessCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { content } from '@/content/strings';
import { buildLearnerAssessmentFeed, type LearnerAssessmentFeedItem } from '@/hooks/useLearnerAssessmentFeed';
import { DEFAULT_READINESS } from '@/lib/readiness/config';
import type { WidgetId } from '@/lib/dashboard/types';

interface CustomWidgetRendererProps {
  widgetId: WidgetId;
  isCollapsed: boolean;
  className?: string;
  // Props for special widgets
  readinessData?: Array<{
    epaCode: string;
    percent: number;
    high: number;
    supCount: number;
    latestScore: number | null;
    latestAt: string | null;
  }>;
  assessmentsData?: {
    epa: any[];
    direct: any[];
    narrative: any[];
    procedure?: any[];
  };
  onEpaClick?: (epaCode: string) => void;
  selectedEpa?: string | null;
  profile?: any;
  profileRef?: React.RefObject<HTMLDivElement>;
  epaSectionRef?: React.RefObject<HTMLDivElement>;
  stats?: Array<{
    title: string;
    value: string;
    change: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }>;
}

export function CustomWidgetRenderer({
  widgetId,
  isCollapsed,
  className,
  readinessData = [],
  assessmentsData,
  onEpaClick,
  selectedEpa,
  profile,
  profileRef,
  epaSectionRef,
  stats,
}: CustomWidgetRendererProps): ReactNode {
  if (isCollapsed) {
    return null;
  }

  switch (widgetId) {
    case 'readiness_cards':
      return (
        <div className={className}>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Readiness</h2>
            {readinessData.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No data yet"
                description="Complete EPA assessments to see your readiness toward practice."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {readinessData.map((r) => (
                  <ReadinessCard
                    key={r.epaCode}
                    title={`EPA ${r.epaCode}`}
                    readinessPercent={r.percent}
                    metrics={{
                      highScore: { achieved: r.high, required: DEFAULT_READINESS.minCount },
                      supervisors: { achieved: r.supCount, required: DEFAULT_READINESS.minSupervisors },
                      latestScore: r.latestScore,
                      latestAt: r.latestAt,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'recent_assessments':
      if (!assessmentsData) return null;

      const { epa, direct, narrative, procedure = [] } = assessmentsData;
      const allRecentFeed = buildLearnerAssessmentFeed({ epa, direct, narrative, procedure });
      const unifiedObservations = allRecentFeed.filter(
        (item) => item.type === 'direct' || item.type === 'procedure'
      );
      const renderUnifiedFeedCard = (assessment: LearnerAssessmentFeedItem) => (
        <Card key={`${assessment.type}-${assessment.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>{assessment.title}</CardTitle>
              {assessment.statusOrRating && (
                <Badge variant={assessment.type === 'procedure' && assessment.statusOrRating === 'submitted' ? 'default' : 'secondary'}>
                  {assessment.statusOrRating}
                </Badge>
              )}
            </div>
            <CardDescription>
              {assessment.type === 'procedure'
                ? `${assessment.subtitle} · Observed by ${assessment.observerName ?? 'Unknown'} · ${new Date(assessment.created_at).toLocaleDateString()}`
                : `${assessment.subtitle} · ${new Date(assessment.created_at).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {assessment.summaryText ? (
              <p className="text-sm text-muted-foreground">{assessment.summaryText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No additional comments were provided.</p>
            )}
            {assessment.detailHref && (
              <Button variant="outline" size="sm" asChild>
                <Link to={assessment.detailHref}>View full observation</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      );

      return (
        <div className={className}>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Recent</TabsTrigger>
              <TabsTrigger value="epa">EPA Assessments</TabsTrigger>
              <TabsTrigger value="observations">Observations (Legacy + Procedure)</TabsTrigger>
              <TabsTrigger value="narrative">Narrative Assessments</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {allRecentFeed.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title={content.emptyStates.assessments.student.title}
                  description={content.emptyStates.assessments.student.description}
                />
              ) : (
                <>
                  {allRecentFeed.map((assessment) => renderUnifiedFeedCard(assessment))}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/student/assessments">Open full assessments list</Link>
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="epa" className="space-y-4" ref={epaSectionRef}>
              {epa.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title={content.emptyStates.assessments.student.title}
                  description={content.emptyStates.assessments.student.description}
                />
              ) : (
                <>
                  {epa.map((assessment: any) => (
                    <Card key={assessment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle>EPA {assessment.epa_number}</CardTitle>
                          <Badge>{assessment.rating}</Badge>
                        </div>
                        <CardDescription>
                          {new Date(assessment.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">Feedback</p>
                            <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                          </div>
                          {onEpaClick && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEpaClick(assessment.epa_number)}
                              className="mt-2"
                            >
                              {selectedEpa === assessment.epa_number ? 'Hide' : 'View'} Trajectory & Benchmark
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {selectedEpa && (
                    <EpaTrajectoryView
                      epaCode={selectedEpa}
                      currentLevel={
                        epa
                          .filter((a: any) => a.epa_number === selectedEpa)
                          .map((a: any) => Number(a.rating))
                          .reduce((max: number, rating: number) => Math.max(max, rating), 0) || 0
                      }
                      className="mt-4"
                    />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="observations" className="space-y-4">
              {unifiedObservations.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title={content.emptyStates.assessments.student.title}
                  description={content.emptyStates.assessments.student.description}
                />
              ) : (
                unifiedObservations.map((assessment) => renderUnifiedFeedCard(assessment))
              )}
            </TabsContent>

            <TabsContent value="narrative" className="space-y-4">
              {narrative.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title={content.emptyStates.assessments.student.title}
                  description={content.emptyStates.assessments.student.description}
                />
              ) : (
                narrative.map((assessment: any) => (
                  <Card key={assessment.id}>
                    <CardHeader>
                      <CardTitle>Assessment Period: {assessment.assessment_period}</CardTitle>
                      <CardDescription>
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Strengths</p>
                          <p className="text-sm text-muted-foreground">{assessment.strengths}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Areas for Growth</p>
                          <p className="text-sm text-muted-foreground">{assessment.areas_for_growth}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      );

    case 'statistics_grid':
      if (!stats) return null;
      return (
        <div className={className}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat: any, index: number) => (
              <Card key={index} className="border-0 bg-gradient-card shadow-card transition-all duration-300 hover:shadow-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                      <p className="mt-1 text-xs text-success">{stat.change}</p>
                    </div>
                    <div className={`rounded-lg bg-primary-light p-3 ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

