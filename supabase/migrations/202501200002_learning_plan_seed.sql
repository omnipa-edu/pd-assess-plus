-- Seed Learning Actions Library
-- Migration: 20250120_learning_plan_seed.sql
-- Purpose: Populate initial learning actions for testing and production use

-- ============================================================================
-- EPA-SPECIFIC ACTIONS
-- ============================================================================

-- Increase exposure actions (generic, can be linked to specific EPAs)
INSERT INTO public.learning_actions (code, label, description, intensity, action_type, dimension_tags, learning_mode_tags, prerequisites)
VALUES
  -- High-priority exposure actions
  ('EPA_INCREASE_EXPOSURE_ED', 
   'Get 3 more supervised WBAs in this EPA in the Emergency Department',
   'Request 3 additional workplace-based assessments (WBAs) for this EPA specifically in Emergency Department settings. Focus on diverse patient presentations to build competency.',
   2, 
   'increase_exposure',
   ARRAY['clinical_reasoning', 'procedural_skills'],
   ARRAY['supervised_practice'],
   '{"min_exposures_last_30": 0, "max_exposures_last_30": 5, "preferred_setting": "emergency_department"}'::jsonb
  ),
  
  ('EPA_INCREASE_EXPOSURE_INPATIENT',
   'Get 3 more supervised WBAs in this EPA on inpatient wards',
   'Request 3 additional workplace-based assessments for this EPA in inpatient ward settings. Focus on longitudinal patient care and team coordination.',
   2,
   'increase_exposure',
   ARRAY['clinical_reasoning', 'communication', 'teamwork'],
   ARRAY['supervised_practice'],
   '{"min_exposures_last_30": 0, "max_exposures_last_30": 5, "preferred_setting": "inpatient"}'::jsonb
  ),
  
  ('EPA_INCREASE_EXPOSURE_OUTPATIENT',
   'Get 3 more supervised WBAs in this EPA in outpatient clinics',
   'Request 3 additional workplace-based assessments for this EPA in outpatient clinic settings. Focus on efficiency and patient communication.',
   2,
   'increase_exposure',
   ARRAY['communication', 'clinical_reasoning'],
   ARRAY['supervised_practice'],
   '{"min_exposures_last_30": 0, "max_exposures_last_30": 5, "preferred_setting": "outpatient"}'::jsonb
  ),

  -- Micro-modules for skill building
  ('EPA_MICRO_MODULE_CLINICAL_REASONING',
   'Complete micro-module: Clinical Reasoning for this EPA',
   'Complete a focused 30-minute micro-module on clinical reasoning patterns specific to this EPA. Includes case studies and self-assessment.',
   1,
   'micro_module',
   ARRAY['clinical_reasoning'],
   ARRAY['self_study'],
   '{"min_level": 0, "max_level": 4, "target_dimension": "clinical_reasoning"}'::jsonb
  ),
  
  ('EPA_MICRO_MODULE_COMMUNICATION',
   'Complete micro-module: Communication Skills for this EPA',
   'Complete a focused 30-minute micro-module on effective communication strategies for this EPA context. Includes role-play scenarios.',
   1,
   'micro_module',
   ARRAY['communication'],
   ARRAY['self_study', 'peer_learning'],
   '{"min_level": 0, "max_level": 4, "target_dimension": "communication"}'::jsonb
  ),

  -- Reflection activities
  ('EPA_REFLECTION_RECENT_ASSESSMENT',
   'Reflect on your most recent assessment for this EPA',
   'Write a structured reflection on your most recent assessment. Identify 2 strengths and 2 areas for improvement. Share with your supervisor.',
   1,
   'reflection',
   ARRAY['self_awareness', 'metacognition'],
   ARRAY['self_study'],
   '{"min_assessments": 1, "require_recent_assessment": true}'::jsonb
  ),
  
  ('EPA_REFLECTION_BENCHMARK_COMPARISON',
   'Reflect on your progress compared to cohort benchmarks',
   'Review your current competency level compared to cohort benchmarks for this EPA. Write a reflection on your trajectory and set 1-2 specific goals.',
   1,
   'reflection',
   ARRAY['self_awareness', 'goal_setting'],
   ARRAY['self_study'],
   '{"require_benchmark_data": true}'::jsonb
  ),

  -- Feedback requests
  ('EPA_FEEDBACK_REQUEST_SPECIFIC',
   'Request specific feedback on this EPA from your supervisor',
   'Proactively request detailed feedback on this EPA from your supervisor. Prepare specific questions about areas you want to improve.',
   1,
   'feedback_request',
   ARRAY['communication', 'self_advocacy'],
   ARRAY['supervised_practice'],
   '{"min_assessments": 1}'::jsonb
  ),

  -- Simulation practice
  ('EPA_SIMULATION_PRACTICE',
   'Complete simulation practice for this EPA',
   'Participate in a simulation session focused on this EPA. Practice in a safe environment with immediate feedback.',
   2,
   'simulation',
   ARRAY['procedural_skills', 'clinical_reasoning'],
   ARRAY['supervised_practice'],
   '{"min_level": 0, "max_level": 3}'::jsonb
  ),

  -- Peer learning
  ('EPA_PEER_DISCUSSION',
   'Participate in peer discussion group for this EPA',
   'Join a peer discussion group focused on this EPA. Share experiences, challenges, and strategies with fellow learners.',
   1,
   'peer_learning',
   ARRAY['communication', 'collaboration'],
   ARRAY['peer_learning'],
   '{}'::jsonb
  );

-- ============================================================================
-- CROSS-CUTTING ACTIONS (No specific EPA)
-- ============================================================================

INSERT INTO public.learning_actions (code, label, description, intensity, action_type, dimension_tags, learning_mode_tags, prerequisites)
VALUES
  ('GLOBAL_FEEDBACK_QUALITY_REVIEW',
   'Review feedback quality scores and identify improvement areas',
   'Review your recent feedback quality scores across all EPAs. Identify patterns in dimensions that need improvement (clarity, specificity, actionability).',
   1,
   'self_study',
   ARRAY['self_awareness', 'metacognition'],
   ARRAY['self_study'],
   '{"min_assessments": 3}'::jsonb
  ),
  
  ('GLOBAL_EXPOSURE_DIVERSITY',
   'Increase diversity of clinical settings for assessments',
   'Seek assessments across different clinical settings (ED, inpatient, outpatient) to build well-rounded competency.',
   2,
   'increase_exposure',
   ARRAY['adaptability', 'clinical_reasoning'],
   ARRAY['supervised_practice'],
   '{"require_multiple_settings": false}'::jsonb
  ),
  
  ('GLOBAL_SUPERVISOR_DIVERSITY',
   'Get assessments from different supervisors',
   'Request assessments from 2-3 different supervisors to get diverse perspectives and feedback styles.',
   2,
   'increase_exposure',
   ARRAY['adaptability', 'communication'],
   ARRAY['supervised_practice'],
   '{"min_supervisors": 1, "target_supervisors": 3}'::jsonb
  );

-- ============================================================================
-- RISK-FLAG SPECIFIC ACTIONS
-- ============================================================================

INSERT INTO public.learning_actions (code, label, description, intensity, action_type, dimension_tags, learning_mode_tags, prerequisites)
VALUES
  ('RISK_IMMEDIATE_SUPERVISOR_MEETING',
   'Schedule immediate meeting with supervisor about this EPA',
   'Schedule a focused meeting with your supervisor to discuss this EPA. Review recent assessments and create an action plan.',
   3,
   'feedback_request',
   ARRAY['communication', 'self_advocacy'],
   ARRAY['supervised_practice'],
   '{"require_risk_flag": true}'::jsonb
  ),
  
  ('RISK_INCREASED_FREQUENCY_ASSESSMENTS',
   'Request weekly assessments for this EPA until improvement',
   'Request weekly workplace-based assessments for this EPA to accelerate improvement. Focus on specific areas identified in recent feedback.',
   3,
   'increase_exposure',
   ARRAY['clinical_reasoning', 'procedural_skills'],
   ARRAY['supervised_practice'],
   '{"require_risk_flag": true, "min_frequency_days": 7}'::jsonb
  );

-- ============================================================================
-- PLATEAU-FLAG SPECIFIC ACTIONS
-- ============================================================================

INSERT INTO public.learning_actions (code, label, description, intensity, action_type, dimension_tags, learning_mode_tags, prerequisites)
VALUES
  ('PLATEAU_CHALLENGE_CASES',
   'Seek more challenging cases for this EPA',
   'Request assessments on more complex or challenging cases for this EPA to push beyond current plateau.',
   2,
   'increase_exposure',
   ARRAY['clinical_reasoning', 'problem_solving'],
   ARRAY['supervised_practice'],
   '{"require_plateau_flag": true, "prefer_complexity": "high"}'::jsonb
  ),
  
  ('PLATEAU_DIFFERENT_APPROACH',
   'Try a different learning approach for this EPA',
   'If current approach isn''t working, try a different learning method: simulation, peer discussion, or micro-modules.',
   2,
   'self_study',
   ARRAY['metacognition', 'adaptability'],
   ARRAY['self_study', 'simulation', 'peer_learning'],
   '{"require_plateau_flag": true}'::jsonb
  );

-- Note: These are example actions. In production, you may want to:
-- 1. Link specific actions to EPAs via epa_id
-- 2. Add discipline-specific actions via discipline_id
-- 3. Refine prerequisites based on real usage patterns
-- 4. Add more action types as needed





