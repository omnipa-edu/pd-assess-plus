import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export interface TeachingStatistics {
  studentsTracked: number;
  assessmentCounts: {
    epa: number;
    direct_observation: number;
    narrative: number;
  };
  cmeTimeByType: {
    direct_observation: number; // minutes
    narrative_feedback: number;
    end_of_rotation: number;
    other: number;
  };
  feedbackTimeByType: {
    epa: number; // minutes
    direct_observation: number;
    narrative: number;
  };
  feedbackQuality: {
    averageOverall: number;
    averageClarity: number;
    averageSpecificity: number;
    averageActionability: number;
    averageBalance: number;
    averageEngagement: number;
    averageTone: number;
    highQualityPercentage: number; // % with overall_score >= 75
    aiUsagePercentage: number; // % with used_ai_assistant = true
  };
  aiAssistUsage: {
    runs: number;
    usedInFinal: number;
    adoptionRate: number;
  };
}

interface UseTeachingStatisticsOptions {
  supervisorId: string | null;
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
}

export function useTeachingStatistics({
  supervisorId,
  startDate,
  endDate,
  enabled = true,
}: UseTeachingStatisticsOptions) {
  // Memoize date strings to avoid recalculation
  const startDateStr = useMemo(
    () => startDate.toISOString().split('T')[0],
    [startDate]
  );
  const endDateStr = useMemo(
    () => endDate.toISOString().split('T')[0],
    [endDate]
  );

  return useQuery({
    queryKey: ['teaching-statistics', supervisorId, startDateStr, endDateStr],
    queryFn: async () => {
      if (!supervisorId) return null;

      try {
        // Use database function for efficient aggregation
        const { data, error } = await supabase.rpc('get_supervisor_teaching_stats', {
          p_supervisor_id: supervisorId,
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        });

        if (error) {
          // If function doesn't exist, fall back to individual queries
          if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
            console.warn('Database function not found, falling back to individual queries. Please run migration: 20250117_supervisor_teaching_stats_function.sql');
            return await loadStatisticsFallback();
          }
          throw error;
        }

        // Type assertion and ensure new fields exist
        const typed = data as TeachingStatistics;
        if (!typed.aiAssistUsage) {
          typed.aiAssistUsage = { runs: 0, usedInFinal: 0, adoptionRate: 0 };
        }
        return typed;
      } catch (err: any) {
        console.error('Error loading teaching statistics:', err);
        // Fallback to individual queries if RPC fails
        try {
          return await loadStatisticsFallback();
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }

      // Fallback function for when database function is not available
      async function loadStatisticsFallback(): Promise<TeachingStatistics> {
        // 1. Count unique students tracked
        let studentsTracked = 0;
        try {
          const { data: assignments } = await supabase
            .from('supervisor_student_assignments')
            .select('student_id')
            .eq('supervisor_id', supervisorId)
            .eq('is_active', true);
          
          studentsTracked = new Set(assignments?.map(a => a.student_id) || []).size;
        } catch (error: any) {
          if (error?.code === 'PGRST116' || error?.message?.includes('404')) {
            // Fallback: try to get from profiles
            const { data: allProfiles } = await supabase
              .from('profiles')
              .select('id')
              .limit(100);
            studentsTracked = allProfiles?.length || 0;
          } else {
            throw error;
          }
        }

        // 2. Count assessments by type
        const [epaData, directData, narrativeData] = await Promise.all([
          supabase
            .from('epa_assessments')
            .select('id', { count: 'exact', head: true })
            .eq('supervisor_id', supervisorId)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr),
          supabase
            .from('direct_observation_assessments')
            .select('id', { count: 'exact', head: true })
            .eq('supervisor_id', supervisorId)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr),
          supabase
            .from('narrative_assessments')
            .select('id', { count: 'exact', head: true })
            .eq('supervisor_id', supervisorId)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr),
        ]);

        // 3. Get CME time by activity type
        let cmeSessions: any[] = [];
        try {
          const { data } = await supabase
            .from('supervisor_cme_sessions')
            .select('activity_type, minutes')
            .eq('supervisor_id', supervisorId)
            .gte('session_date', startDateStr)
            .lte('session_date', endDateStr);
          cmeSessions = data || [];
        } catch (error: any) {
          if (error?.code === 'PGRST116' || error?.message?.includes('404')) {
            console.warn('supervisor_cme_sessions table not found. CME tracking may not be set up.');
            cmeSessions = [];
          } else {
            throw error;
          }
        }

        const cmeTimeByType = {
          direct_observation: 0,
          narrative_feedback: 0,
          end_of_rotation: 0,
          other: 0,
        };

        cmeSessions.forEach(session => {
          const type = session.activity_type as keyof typeof cmeTimeByType;
          if (type in cmeTimeByType) {
            cmeTimeByType[type] += session.minutes || 0;
          } else {
            cmeTimeByType.other += session.minutes || 0;
          }
        });

        // 4. Get feedback time by assessment type (from time tracking columns)
        const [epaWithTime, directWithTime, narrativeWithTime] = await Promise.all([
          supabase
            .from('epa_assessments')
            .select('feedback_time_minutes')
            .eq('supervisor_id', supervisorId)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr)
            .not('feedback_time_minutes', 'is', null),
          supabase
            .from('direct_observation_assessments')
            .select('feedback_time_minutes')
            .eq('supervisor_id', supervisorId)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr)
            .not('feedback_time_minutes', 'is', null),
          supabase
            .from('narrative_assessments')
            .select('feedback_time_minutes')
            .eq('supervisor_id', supervisorId)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr)
            .not('feedback_time_minutes', 'is', null),
        ]);

        const feedbackTimeByType = {
          epa: (epaWithTime.data || []).reduce((sum, a) => sum + (a.feedback_time_minutes || 0), 0),
          direct_observation: (directWithTime.data || []).reduce((sum, a) => sum + (a.feedback_time_minutes || 0), 0),
          narrative: (narrativeWithTime.data || []).reduce((sum, a) => sum + (a.feedback_time_minutes || 0), 0),
        };

        // 5. Get feedback quality scores
        let qualityScores: any[] = [];
        try {
          const { data } = await supabase
            .from('feedback_quality_scores')
            .select('overall_score, clarity_score, specificity_score, actionability_score, balance_score, learner_engagement_score, tone_professionalism_score, used_ai_assistant')
            .eq('supervisor_id', supervisorId)
            .gte('scored_at', startDateStr)
            .lte('scored_at', endDateStr);
          qualityScores = data || [];
        } catch (error: any) {
          if (error?.code === 'PGRST116' || error?.message?.includes('404')) {
            console.warn('feedback_quality_scores table not found. Please run the migration: 20250116_feedback_quality_scoring.sql');
            qualityScores = [];
          } else {
            throw error;
          }
        }

        // Single-pass calculation for quality stats (optimized)
        const qualityStats = qualityScores.reduce(
          (acc, s) => {
            const overall = s.overall_score || 0;
            acc.sumOverall += overall;
            acc.sumClarity += s.clarity_score || 0;
            acc.sumSpecificity += s.specificity_score || 0;
            acc.sumActionability += s.actionability_score || 0;
            acc.sumBalance += s.balance_score || 0;
            acc.sumEngagement += s.learner_engagement_score || 0;
            acc.sumTone += s.tone_professionalism_score || 0;
            if (overall >= 75) acc.highQualityCount++;
            if (s.used_ai_assistant) acc.aiUsageCount++;
            return acc;
          },
          {
            sumOverall: 0,
            sumClarity: 0,
            sumSpecificity: 0,
            sumActionability: 0,
            sumBalance: 0,
            sumEngagement: 0,
            sumTone: 0,
            highQualityCount: 0,
            aiUsageCount: 0,
          }
        );

        const count = qualityScores.length;
        const finalQualityStats = {
          averageOverall: count > 0 ? qualityStats.sumOverall / count : 0,
          averageClarity: count > 0 ? qualityStats.sumClarity / count : 0,
          averageSpecificity: count > 0 ? qualityStats.sumSpecificity / count : 0,
          averageActionability: count > 0 ? qualityStats.sumActionability / count : 0,
          averageBalance: count > 0 ? qualityStats.sumBalance / count : 0,
          averageEngagement: count > 0 ? qualityStats.sumEngagement / count : 0,
          averageTone: count > 0 ? qualityStats.sumTone / count : 0,
          highQualityPercentage: count > 0 ? (qualityStats.highQualityCount / count) * 100 : 0,
          aiUsagePercentage: count > 0 ? (qualityStats.aiUsageCount / count) * 100 : 0,
        };

        let aiAssistUsage = {
          runs: 0,
          usedInFinal: 0,
          adoptionRate: 0,
        };
        try {
          const { data: aiRuns } = await supabase
            .from("feedback_ai_runs")
            .select("used_in_final_feedback")
            .eq("supervisor_id", supervisorId)
            .gte("created_at", startDateStr)
            .lte("created_at", endDateStr);
          const totalRuns = aiRuns?.length || 0;
          const usedInFinal = aiRuns?.filter((run) => run.used_in_final_feedback).length || 0;
          aiAssistUsage = {
            runs: totalRuns,
            usedInFinal,
            adoptionRate: totalRuns > 0 ? (usedInFinal / totalRuns) * 100 : 0,
          };
        } catch (error: any) {
          if (error?.code === "PGRST116" || error?.message?.includes("404")) {
            console.warn("feedback_ai_runs table not found. Please run migration: 20260123_feedback_ai_runs.sql");
          } else {
            throw error;
          }
        }

        return {
          studentsTracked,
          assessmentCounts: {
            epa: epaData.count || 0,
            direct_observation: directData.count || 0,
            narrative: narrativeData.count || 0,
          },
          cmeTimeByType,
          feedbackTimeByType,
          feedbackQuality: finalQualityStats,
          aiAssistUsage,
        };
      }
    },
    enabled: enabled && !!supervisorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

