/**
 * Supabase Edge Function: Generate Personalization Summaries
 * Scheduled job to refresh personalization summaries for all active learners and supervisors
 * 
 * Usage:
 * - Schedule via Supabase cron or external scheduler
 * - Call: POST /functions/v1/generate-personalization-summaries
 * - Optional query params: ?role=learner|supervisor&userId=<uuid>
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  role?: 'learner' | 'supervisor';
  userId?: string;
  batchSize?: number;
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

    const { role, userId, batchSize = 50 }: GenerateRequest = await req.json().catch(() => ({}));

    // If specific user requested, generate only for that user
    if (userId) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determine role
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const userRoles = roles?.map((r) => r.role) || [];
      const isLearner = userRoles.includes('student');
      const isSupervisor = userRoles.includes('supervisor');

      const results: any = {};

      if (isLearner) {
        // Generate learner summary
        const summary = await generateLearnerSummary(supabaseClient, userId);
        results.learner = summary ? 'success' : 'failed';
      }

      if (isSupervisor) {
        // Generate supervisor summary
        const summary = await generateSupervisorSummary(supabaseClient, userId);
        results.supervisor = summary ? 'success' : 'failed';
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch generation
    const results = {
      learners: { processed: 0, success: 0, failed: 0 },
      supervisors: { processed: 0, success: 0, failed: 0 },
    };

    if (!role || role === 'learner') {
      // Get all active learners
      const { data: learners } = await supabaseClient
        .from('profiles')
        .select('id')
        .in('id', 
          supabaseClient
            .from('user_roles')
            .select('user_id')
            .eq('role', 'student')
        );

      const learnerIds = (learners || []).map((l) => l.id);
      
      for (let i = 0; i < learnerIds.length; i += batchSize) {
        const batch = learnerIds.slice(i, i + batchSize);
        
        for (const learnerId of batch) {
          results.learners.processed++;
          try {
            const summary = await generateLearnerSummary(supabaseClient, learnerId);
            if (summary) {
              results.learners.success++;
            } else {
              results.learners.failed++;
            }
          } catch (error) {
            results.learners.failed++;
            console.error(`Error generating summary for learner ${learnerId}:`, error);
          }
        }
      }
    }

    if (!role || role === 'supervisor') {
      // Get all active supervisors
      const { data: supervisors } = await supabaseClient
        .from('profiles')
        .select('id')
        .in('id',
          supabaseClient
            .from('user_roles')
            .select('user_id')
            .eq('role', 'supervisor')
        );

      const supervisorIds = (supervisors || []).map((s) => s.id);
      
      for (let i = 0; i < supervisorIds.length; i += batchSize) {
        const batch = supervisorIds.slice(i, i + batchSize);
        
        for (const supervisorId of batch) {
          results.supervisors.processed++;
          try {
            const summary = await generateSupervisorSummary(supabaseClient, supervisorId);
            if (summary) {
              results.supervisors.success++;
            } else {
              results.supervisors.failed++;
            }
          } catch (error) {
            results.supervisors.failed++;
            console.error(`Error generating summary for supervisor ${supervisorId}:`, error);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-personalization-summaries:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate learner summary (server-side)
 */
async function generateLearnerSummary(supabaseClient: any, learnerId: string): Promise<any> {
  // This would call the same logic as generateLearnerPersonalizationSummary
  // For now, we'll use a simplified version that calls the database function
  // In production, you'd want to import and use the actual rule engine logic
  
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('id, cohort_id, specialty_id')
    .eq('id', learnerId)
    .single();

  if (!profile) return null;

  // Call the client-side function via RPC or implement server-side logic
  // For now, return a placeholder - in production, implement the full rule engine here
  const summary = {
    key_epas: [],
    priority_actions: [],
    suggested_focus_window_weeks: 2,
    coaching_tags: [],
  };

  const { error } = await supabaseClient
    .from('learner_personalization_summaries')
    .upsert(
      {
        learner_id: learnerId,
        specialty_id: profile.specialty_id || null,
        cohort_id: profile.cohort_id || null,
        summary: summary,
      },
      { onConflict: 'learner_id' }
    );

  return error ? null : summary;
}

/**
 * Generate supervisor summary (server-side)
 */
async function generateSupervisorSummary(supabaseClient: any, supervisorId: string): Promise<any> {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('id, institution_id, specialty_id')
    .eq('id', supervisorId)
    .single();

  if (!profile) return null;

  // Placeholder - implement full rule engine logic here
  const summary = {
    learners_of_interest: [],
    feedback_quality: {
      avg_overall_score: null,
      strengths: [],
      improvement_areas: [],
      ai_usage_rate: null,
    },
    cme_teaching_snapshot: {
      total_cme_hours_year_to_date: 0,
      sessions_count_year_to_date: 0,
    },
    coaching_tags: [],
  };

  const { error } = await supabaseClient
    .from('supervisor_personalization_summaries')
    .upsert(
      {
        supervisor_id: supervisorId,
        specialty_id: profile.specialty_id || null,
        institution_id: profile.institution_id || null,
        summary: summary,
      },
      { onConflict: 'supervisor_id' }
    );

  return error ? null : summary;
}





