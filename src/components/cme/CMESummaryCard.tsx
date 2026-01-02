import { useState, useEffect } from 'react';

import { Clock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getSupervisorCMESessions, calculateCMESummary } from '@/lib/cme-tracking';

export const CMESummaryCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ReturnType<typeof calculateCMESummary> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadSummary = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);
        
        const sessions = await getSupervisorCMESessions(user.id, {
          startDate: startOfYear,
          endDate: endOfYear,
        });
        const calculated = calculateCMESummary(sessions, currentYear);
        setSummary(calculated);
      } catch (error: any) {
        // Handle case where table doesn't exist (404) gracefully
        if (error?.code === 'PGRST116' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
          console.warn('CME sessions table not found. This feature may not be set up yet.');
          setSummary({
            totalMinutes: 0,
            totalHours: 0,
            totalSessions: 0,
            averageHoursPerWeek: 0,
            breakdownByActivity: {
              direct_observation: { minutes: 0, hours: 0, count: 0 },
              chart_review: { minutes: 0, hours: 0, count: 0 },
              end_of_rotation: { minutes: 0, hours: 0, count: 0 },
              narrative_feedback: { minutes: 0, hours: 0, count: 0 },
              group_teaching: { minutes: 0, hours: 0, count: 0 },
              other: { minutes: 0, hours: 0, count: 0 },
            },
          });
        } else {
          // Check if it's a 404 (table doesn't exist)
          const errorStr = JSON.stringify(error).toLowerCase();
          const is404 = error?.code === 'PGRST116' || 
                        error?.message?.includes('404') ||
                        errorStr.includes('404') ||
                        errorStr.includes('not found');
          
          if (is404) {
            console.warn('CME sessions table not found. This feature may not be set up yet.');
            // Set empty summary instead of error
            setSummary({
              totalMinutes: 0,
              totalHours: 0,
              sessionCount: 0,
              breakdownByActivity: {
                direct_observation: { minutes: 0, hours: 0, count: 0 },
                chart_review: { minutes: 0, hours: 0, count: 0 },
                end_of_rotation: { minutes: 0, hours: 0, count: 0 },
                narrative_feedback: { minutes: 0, hours: 0, count: 0 },
                group_teaching: { minutes: 0, hours: 0, count: 0 },
                other: { minutes: 0, hours: 0, count: 0 },
              },
            });
          } else {
            console.error('Error loading CME summary:', error);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [user]);

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-8 w-1/2 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card className="border-0 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Clock className="mr-2 h-5 w-5 text-primary" />
          Coaching & Feedback Time (CME-Eligible)
        </CardTitle>
        <CardDescription>
          Current calendar year summary
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="text-2xl font-bold text-foreground">
              {summary.totalHours.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">this year</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold text-foreground">
              {summary.totalSessions}
            </p>
            <p className="text-xs text-muted-foreground">sessions</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average</p>
            <p className="text-2xl font-bold text-foreground">
              ~{summary.averageHoursPerWeek.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">hours/week</p>
          </div>
        </div>

        <div className="border-t pt-2">
          <p className="mb-2 text-xs text-muted-foreground">
            Use this log to support NCCPA Category II or Category II CME documentation. 
            You are responsible for claiming CME according to your board's rules.
          </p>
        </div>

        <Button
          onClick={() => navigate('/supervisor/cme-log')}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          <FileText className="mr-2 h-4 w-4" />
          View CME Log
        </Button>
      </CardContent>
    </Card>
  );
};


