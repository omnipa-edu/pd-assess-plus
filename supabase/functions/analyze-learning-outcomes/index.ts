/**
 * Learning Plan Outcome Analysis Edge Function
 * Computes outcome metrics for recommendations after a time window
 * This creates training data for future ML models
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutcomeMetrics {
  delta_level: number | null;
  delta_benchmark_delta: number | null;
  delta_exposure_30d: number | null;
  initial_level: number | null;
  final_level: number | null;
  initial_benchmark_delta: number | null;
  final_benchmark_delta: number | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get configuration from request body or use defaults
    const { windowDays = 60, batchSize = 100 } = await req.json().catch(() => ({}));

    // Find recommendations that need outcome analysis
    // Criteria: outcome_window_days is null AND recommended_at is older than windowDays
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - windowDays);

    const { data: recommendations, error: fetchError } = await supabaseClient
      .from('learning_plan_recommendations')
      .select('id, learner_id, epa_id, recommended_at, recommendation_context')
      .is('outcome_window_days', null)
      .lt('recommended_at', cutoffDate.toISOString())
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Error fetching recommendations: ${fetchError.message}`);
    }

    if (!recommendations || recommendations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recommendations need outcome analysis', processed: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let processed = 0;
    const errors: string[] = [];

    for (const rec of recommendations) {
      try {
        const recommendedAt = new Date(rec.recommended_at);
        const outcomeDate = new Date(recommendedAt);
        outcomeDate.setDate(outcomeDate.getDate() + windowDays);

        const learnerId = rec.learner_id;
        const epaId = rec.epa_id;
        const context = rec.recommendation_context as any;
        const epaCode = context?.epa_code;

        if (!epaCode) {
          errors.push(`Recommendation ${rec.id}: No EPA code in context`);
          continue;
        }

        // Get initial state from recommendation_context
        const initialLevel = context?.current_level ?? null;
        const initialBenchmarkDelta = context?.benchmark_delta ?? null;

        // Compute final state at outcome_date
        // We'll use the compute_learner_epa_summary function
        const { data: epaSummary, error: summaryError } = await supabaseClient.rpc(
          'compute_learner_epa_summary',
          {
            p_learner_id: learnerId,
            p_lookback_days: 180,
          }
        );

        if (summaryError || !epaSummary) {
          errors.push(`Recommendation ${rec.id}: Error computing final state`);
          continue;
        }

        const finalEpaData = (epaSummary as any[]).find((e) => e.epa_code === epaCode);
        const finalLevel = finalEpaData?.current_level ?? null;

        // Get final benchmark delta
        let finalBenchmarkDelta: number | null = null;
        if (finalLevel !== null) {
          // Query benchmark for outcome date
          const { data: benchmarkContext } = await supabaseClient.rpc(
            'get_learner_benchmark_context',
            { p_learner_id: learnerId }
          );

          if (benchmarkContext && benchmarkContext.length > 0) {
            const { data: benchmark } = await supabaseClient
              .from('epa_benchmarks')
              .select('expected_level')
              .eq('scope', 'current_cohort')
              .eq('epa_code', epaCode)
              .single();

            if (benchmark && benchmark.expected_level !== null) {
              finalBenchmarkDelta = finalLevel - benchmark.expected_level;
            }
          }
        }

        // Compute exposure delta (assessments in 30 days before vs after)
        const beforeStart = new Date(recommendedAt);
        beforeStart.setDate(beforeStart.getDate() - 30);
        const afterEnd = new Date(outcomeDate);
        afterEnd.setDate(afterEnd.getDate() - 30);

        const { count: initialExposure } = await supabaseClient
          .from('epa_assessments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', learnerId)
          .eq('epa_number', epaCode)
          .gte('created_at', beforeStart.toISOString())
          .lt('created_at', recommendedAt.toISOString());

        const { count: finalExposure } = await supabaseClient
          .from('epa_assessments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', learnerId)
          .eq('epa_number', epaCode)
          .gte('created_at', afterEnd.toISOString())
          .lte('created_at', outcomeDate.toISOString());

        const deltaExposure30d =
          (finalExposure ?? 0) - (initialExposure ?? 0);

        // Compute deltas
        const deltaLevel =
          initialLevel !== null && finalLevel !== null ? finalLevel - initialLevel : null;
        const deltaBenchmarkDelta =
          initialBenchmarkDelta !== null && finalBenchmarkDelta !== null
            ? finalBenchmarkDelta - initialBenchmarkDelta
            : null;

        // Build outcome metrics
        const outcomeMetrics: OutcomeMetrics = {
          delta_level: deltaLevel,
          delta_benchmark_delta: deltaBenchmarkDelta,
          delta_exposure_30d: deltaExposure30d,
          initial_level: initialLevel,
          final_level: finalLevel,
          initial_benchmark_delta: initialBenchmarkDelta,
          final_benchmark_delta: finalBenchmarkDelta,
        };

        // Update recommendation with outcome data
        const { error: updateError } = await supabaseClient
          .from('learning_plan_recommendations')
          .update({
            outcome_window_days: windowDays,
            outcome_metrics: outcomeMetrics,
          })
          .eq('id', rec.id);

        if (updateError) {
          errors.push(`Recommendation ${rec.id}: Error updating outcome: ${updateError.message}`);
        } else {
          processed++;
        }
      } catch (error: any) {
        errors.push(`Recommendation ${rec.id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Outcome analysis completed',
        processed,
        total: recommendations.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});





