-- Migration: Supervisor Teaching Statistics Aggregation Function
-- Created: 2025-01-17
-- Purpose: Create database function to aggregate supervisor teaching statistics efficiently

-- ============================================================================
-- SUPERVISOR TEACHING STATISTICS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_supervisor_teaching_stats(
  p_supervisor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_students_tracked INTEGER;
  v_epa_count INTEGER;
  v_direct_obs_count INTEGER;
  v_narrative_count INTEGER;
  v_cme_direct_obs INTEGER;
  v_cme_narrative INTEGER;
  v_cme_end_rotation INTEGER;
  v_cme_other INTEGER;
  v_feedback_time_epa INTEGER;
  v_feedback_time_direct INTEGER;
  v_feedback_time_narrative INTEGER;
  v_quality_stats JSON;
BEGIN
  -- Count unique students tracked
  SELECT COUNT(DISTINCT student_id) INTO v_students_tracked
  FROM supervisor_student_assignments
  WHERE supervisor_id = p_supervisor_id
    AND is_active = true;

  -- Count assessments by type
  SELECT 
    COUNT(*) INTO v_epa_count
  FROM epa_assessments
  WHERE supervisor_id = p_supervisor_id
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date;

  SELECT 
    COUNT(*) INTO v_direct_obs_count
  FROM direct_observation_assessments
  WHERE supervisor_id = p_supervisor_id
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date;

  SELECT 
    COUNT(*) INTO v_narrative_count
  FROM narrative_assessments
  WHERE supervisor_id = p_supervisor_id
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date;

  -- Aggregate CME time by activity type
  SELECT 
    COALESCE(SUM(minutes) FILTER (WHERE activity_type = 'direct_observation'), 0),
    COALESCE(SUM(minutes) FILTER (WHERE activity_type = 'narrative_feedback'), 0),
    COALESCE(SUM(minutes) FILTER (WHERE activity_type = 'end_of_rotation'), 0),
    COALESCE(SUM(minutes) FILTER (WHERE activity_type NOT IN ('direct_observation', 'narrative_feedback', 'end_of_rotation')), 0)
  INTO v_cme_direct_obs, v_cme_narrative, v_cme_end_rotation, v_cme_other
  FROM supervisor_cme_sessions
  WHERE supervisor_id = p_supervisor_id
    AND session_date >= p_start_date
    AND session_date <= p_end_date;

  -- Aggregate feedback time by assessment type
  SELECT 
    COALESCE(SUM(feedback_time_minutes), 0) INTO v_feedback_time_epa
  FROM epa_assessments
  WHERE supervisor_id = p_supervisor_id
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date
    AND feedback_time_minutes IS NOT NULL;

  SELECT 
    COALESCE(SUM(feedback_time_minutes), 0) INTO v_feedback_time_direct
  FROM direct_observation_assessments
  WHERE supervisor_id = p_supervisor_id
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date
    AND feedback_time_minutes IS NOT NULL;

  SELECT 
    COALESCE(SUM(feedback_time_minutes), 0) INTO v_feedback_time_narrative
  FROM narrative_assessments
  WHERE supervisor_id = p_supervisor_id
    AND created_at::date >= p_start_date
    AND created_at::date <= p_end_date
    AND feedback_time_minutes IS NOT NULL;

  -- Calculate feedback quality statistics
  SELECT json_build_object(
    'averageOverall', COALESCE(AVG(overall_score), 0),
    'averageClarity', COALESCE(AVG(clarity_score), 0),
    'averageSpecificity', COALESCE(AVG(specificity_score), 0),
    'averageActionability', COALESCE(AVG(actionability_score), 0),
    'averageBalance', COALESCE(AVG(balance_score), 0),
    'averageEngagement', COALESCE(AVG(learner_engagement_score), 0),
    'averageTone', COALESCE(AVG(tone_professionalism_score), 0),
    'highQualityPercentage', COALESCE(
      (COUNT(*) FILTER (WHERE overall_score >= 75)::FLOAT / NULLIF(COUNT(*), 0) * 100),
      0
    ),
    'aiUsagePercentage', COALESCE(
      (COUNT(*) FILTER (WHERE used_ai_assistant)::FLOAT / NULLIF(COUNT(*), 0) * 100),
      0
    )
  ) INTO v_quality_stats
  FROM feedback_quality_scores
  WHERE supervisor_id = p_supervisor_id
    AND scored_at::date >= p_start_date
    AND scored_at::date <= p_end_date;

  -- Build result JSON
  v_result := json_build_object(
    'studentsTracked', v_students_tracked,
    'assessmentCounts', json_build_object(
      'epa', v_epa_count,
      'direct_observation', v_direct_obs_count,
      'narrative', v_narrative_count
    ),
    'cmeTimeByType', json_build_object(
      'direct_observation', v_cme_direct_obs,
      'narrative_feedback', v_cme_narrative,
      'end_of_rotation', v_cme_end_rotation,
      'other', v_cme_other
    ),
    'feedbackTimeByType', json_build_object(
      'epa', v_feedback_time_epa,
      'direct_observation', v_feedback_time_direct,
      'narrative', v_feedback_time_narrative
    ),
    'feedbackQuality', COALESCE(v_quality_stats, json_build_object(
      'averageOverall', 0,
      'averageClarity', 0,
      'averageSpecificity', 0,
      'averageActionability', 0,
      'averageBalance', 0,
      'averageEngagement', 0,
      'averageTone', 0,
      'highQualityPercentage', 0,
      'aiUsagePercentage', 0
    ))
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return empty stats if tables don't exist or other errors
    RETURN json_build_object(
      'studentsTracked', 0,
      'assessmentCounts', json_build_object('epa', 0, 'direct_observation', 0, 'narrative', 0),
      'cmeTimeByType', json_build_object('direct_observation', 0, 'narrative_feedback', 0, 'end_of_rotation', 0, 'other', 0),
      'feedbackTimeByType', json_build_object('epa', 0, 'direct_observation', 0, 'narrative', 0),
      'feedbackQuality', json_build_object(
        'averageOverall', 0, 'averageClarity', 0, 'averageSpecificity', 0,
        'averageActionability', 0, 'averageBalance', 0, 'averageEngagement', 0,
        'averageTone', 0, 'highQualityPercentage', 0, 'aiUsagePercentage', 0
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_supervisor_teaching_stats(UUID, DATE, DATE) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_supervisor_teaching_stats IS 'Aggregates supervisor teaching statistics including assessment counts, CME time, feedback time, and quality scores for a given date range';

