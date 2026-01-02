/**
 * Personalization Engine Types
 * Type definitions for learner and supervisor personalization summaries
 */

export interface KeyEPA {
  epa_code: string;
  epa_title: string;
  current_level: number | null;
  target_level: number | null;
  risk_flag: boolean;
  plateau_flag: boolean;
  benchmark_scope: string; // e.g., "current_cohort"
  benchmark_delta: number | null; // learner_level - expected_level
}

export interface LearnerPersonalizationSummary {
  key_epas: KeyEPA[];
  priority_actions: string[];
  suggested_focus_window_weeks: number; // e.g., 2-4
  coaching_tags: string[];
}

export interface LearnerOfInterest {
  learner_id: string;
  learner_name: string | null;
  key_epas: {
    epa_code: string;
    epa_title: string;
    risk_flag: boolean;
    plateau_flag: boolean;
    benchmark_delta: number | null;
  }[];
}

export interface FeedbackQuality {
  avg_overall_score: number | null; // 0-100
  strengths: string[]; // e.g., ["balanced tone", "clear next steps"]
  improvement_areas: string[]; // e.g., ["specificity", "inviting learner reflection"]
  ai_usage_rate: number | null; // fraction of feedback entries using smart assistant
}

export interface CMETeachingSnapshot {
  total_cme_hours_year_to_date: number;
  sessions_count_year_to_date: number;
}

export interface SupervisorPersonalizationSummary {
  learners_of_interest: LearnerOfInterest[];
  feedback_quality: FeedbackQuality;
  cme_teaching_snapshot: CMETeachingSnapshot;
  coaching_tags: string[];
}





