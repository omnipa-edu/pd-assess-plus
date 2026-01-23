export type FeedbackAIChainId = "FEEDBACK_AI_CHAIN_V1";

export type FeedbackAIInputs = {
  learner: { level: string; role: string; specialty: string };
  context: { setting: string; case_type: string; complexity: string; risk_level: string };
  competency_framework: { id: string; name: string; definition: string }[];
  raw_feedback: { rater_role: string; comment: string; rating: number | null; timestamp: string }[];
  learner_reflection: string | null;
  prior_goals: string[];
};

export type NormalizedOutput = {
  observations: string[];
  strengths: string[];
  concerns: string[];
  contradictions: string[];
  missing_info: string[];
  bias_flags: string[];
};

export type ClusterOutput = {
  clusters: { competency_id: string; theme: string; evidence_quotes: string[]; confidence: number }[];
  unmapped: { observation: string; reason: string }[];
};

export type DraftOutput = {
  rater_coaching: {
    quality_risks: string[];
    rewritten_examples: { before: string; after: string }[];
    two_rater_tips: string[];
    bias_flags: string[];
  };
  learner_digest: {
    strengths: string[];
    priority_growth: string[];
    next_case_plan: { action: string; success_observed_as: string }[];
    reflection_prompt: string;
    follow_up: string;
    competency_map: { digest_item: string; competency_id: string }[];
  };
};

export type RubricEvalOutput = {
  scores: Record<string, number>;
  justifications: Record<string, string>;
  pass: boolean;
  required_fixes: string[];
  risk_flags: string[];
};

export type FinalOutput =
  | DraftOutput
  | { final: DraftOutput; change_log: string[]; unresolved_limits: string[] };

export type FeedbackAIChainResult = {
  chain_id: FeedbackAIChainId;
  inputs: FeedbackAIInputs;
  normalized: NormalizedOutput;
  clusters: ClusterOutput;
  draft: DraftOutput;
  rubric_eval: RubricEvalOutput;
  final: DraftOutput;
  logs: {
    change_log?: string[];
    unresolved_limits?: string[];
  };
};
