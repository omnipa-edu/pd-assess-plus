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
      const unifiedObservations = [
        ...direct.map((assessment: any) => ({
          kind: 'legacy-direct',
          id: assessment.id,
          created_at: assessment.created_at,
          title: assessment.procedure_type,
          rating: assessment.performance_rating,
          feedback: assessment.feedback,
        })),
        ...procedure.map((assessment: any) => ({
          kind: 'procedure',
          id: assessment.id,
          created_at: assessment.created_at,
          title: assessment.procedure?.title ?? assessment.procedure_id,
          code: assessment.procedure?.code ?? '',
          status: assessment.status,
          observer: assessment.observer?.full_name ?? assessment.observer_id,
          comments: assessment.comments,
        })),
      ].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return (
        <div className={className}>
          <Tabs defaultValue="epa" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="epa">EPA Assessments</TabsTrigger>
              <TabsTrigger value="observations">Observations (Legacy + Procedure)</TabsTrigger>
              <TabsTrigger value="narrative">Narrative Assessments</TabsTrigger>
            </TabsList>

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
                unifiedObservations.map((assessment: any) => (
                  <Card key={assessment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle>{assessment.title}</CardTitle>
                        {assessment.kind === 'legacy-direct' ? (
                          <Badge>{assessment.rating}</Badge>
                        ) : (
                          <Badge variant={assessment.status === 'submitted' ? 'default' : 'secondary'}>
                            {assessment.status}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {assessment.kind === 'legacy-direct'
                          ? `Legacy direct observation · ${new Date(assessment.created_at).toLocaleDateString()}`
                          : `${assessment.code || ''} · Observed by ${assessment.observer} · ${new Date(assessment.created_at).toLocaleDateString()}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {assessment.kind === 'legacy-direct' ? (
                        <div>
                          <p className="text-sm font-medium">Feedback</p>
                          <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                        </div>
                      ) : assessment.comments ? (
                        <div>
                          <p className="text-sm font-medium">Comments</p>
                          <p className="text-sm text-muted-foreground">{assessment.comments}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No comments were provided for this observation.</p>
                      )}
                      {assessment.kind === 'procedure' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/student/observations/${assessment.id}`}>View full observation</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
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

