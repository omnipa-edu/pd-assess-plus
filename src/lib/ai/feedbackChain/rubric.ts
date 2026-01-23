export const RUBRIC_JSON = {
  rubric_id: "feedback_ai_chain_v1",
  scale: { min: 0, max: 4 },
  domains: {
    behavior_specificity: {
      description: "Feedback references observable behaviors, not traits.",
    },
    actionability_feedforward: {
      description: "Includes concrete next steps and feedforward guidance.",
    },
    balanced_strengths_growth: {
      description: "Balances strengths with priority growth areas.",
    },
    alignment_to_epas: {
      description: "Links feedback to the EPA framework or marks as unmapped.",
    },
    tone_psych_safety: {
      description: "Maintains psychologically safe, professional tone.",
    },
    bias_risk_management: {
      description: "Flags potential bias and avoids judgmental language.",
    },
    conciseness: {
      description: "Keeps output succinct and focused.",
    },
  },
  pass_rules: {
    min_domain_score: 3,
    bias_risk_management_min: 3,
    alignment_to_epas_min: 3,
  },
} as const;

// Rubric concepts informed by feedback quality literature:
// - Johnson et al. 2016 (behavior-specific, dialogic feedback)
// - Tripodi et al. 2021 (feedback literacy and affect management)
