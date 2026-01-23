import { describe, expect, it } from "vitest";
import { z } from "zod";

const draftSchema = z.object({
  rater_coaching: z.object({
    quality_risks: z.array(z.string()),
    rewritten_examples: z.array(z.object({ before: z.string(), after: z.string() })),
    two_rater_tips: z.array(z.string()),
    bias_flags: z.array(z.string()),
  }),
  learner_digest: z.object({
    strengths: z.array(z.string()),
    priority_growth: z.array(z.string()),
    next_case_plan: z.array(
      z.object({
        action: z.string(),
        success_observed_as: z.string(),
      })
    ),
    reflection_prompt: z.string(),
    follow_up: z.string(),
    competency_map: z.array(
      z.object({
        digest_item: z.string(),
        competency_id: z.string(),
      })
    ),
  }),
});

const schema = z.object({
  chain_id: z.literal("FEEDBACK_AI_CHAIN_V1"),
  inputs: z.object({
    learner: z.object({ level: z.string(), role: z.string(), specialty: z.string() }),
    context: z.object({
      setting: z.string(),
      case_type: z.string(),
      complexity: z.string(),
      risk_level: z.string(),
    }),
    competency_framework: z.array(
      z.object({ id: z.string(), name: z.string(), definition: z.string() })
    ),
    raw_feedback: z.array(
      z.object({
        rater_role: z.string(),
        comment: z.string(),
        rating: z.number().nullable(),
        timestamp: z.string(),
      })
    ),
    learner_reflection: z.string().nullable(),
    prior_goals: z.array(z.string()),
  }),
  normalized: z.object({
    observations: z.array(z.string()),
    strengths: z.array(z.string()),
    concerns: z.array(z.string()),
    contradictions: z.array(z.string()),
    missing_info: z.array(z.string()),
    bias_flags: z.array(z.string()),
  }),
  clusters: z.object({
    clusters: z.array(
      z.object({
        competency_id: z.string(),
        theme: z.string(),
        evidence_quotes: z.array(z.string()),
        confidence: z.number(),
      })
    ),
    unmapped: z.array(z.object({ observation: z.string(), reason: z.string() })),
  }),
  draft: draftSchema,
  rubric_eval: z.object({
    scores: z.record(z.number()),
    justifications: z.record(z.string()),
    pass: z.boolean(),
    required_fixes: z.array(z.string()),
    risk_flags: z.array(z.string()),
  }),
  final: draftSchema,
  logs: z.object({
    change_log: z.array(z.string()).optional(),
    unresolved_limits: z.array(z.string()).optional(),
  }),
});

describe("FeedbackAIChainResult schema", () => {
  it("accepts a valid minimal result", () => {
    const payload = {
      chain_id: "FEEDBACK_AI_CHAIN_V1",
      inputs: {
        learner: { level: "PGY1", role: "student", specialty: "PA" },
        context: { setting: "clinic", case_type: "EPA 1.1", complexity: "low", risk_level: "low" },
        competency_framework: [{ id: "epa-1", name: "EPA 1", definition: "desc" }],
        raw_feedback: [
          { rater_role: "supervisor", comment: "Good job", rating: null, timestamp: new Date().toISOString() },
        ],
        learner_reflection: null,
        prior_goals: [],
      },
      normalized: {
        observations: [],
        strengths: [],
        concerns: [],
        contradictions: [],
        missing_info: [],
        bias_flags: [],
      },
      clusters: {
        clusters: [],
        unmapped: [],
      },
      draft: {
        rater_coaching: {
          quality_risks: [],
          rewritten_examples: [{ before: "Good job", after: "You gathered a complete history." }],
          two_rater_tips: ["Be specific [Johnson 2016]"],
          bias_flags: [],
        },
        learner_digest: {
          strengths: ["Clear history taking"],
          priority_growth: ["Sharpen assessment"],
          next_case_plan: [
            { action: "Lead summary", success_observed_as: "Summarizes in 60s" },
            { action: "Review differential", success_observed_as: "Lists top 3 causes" },
          ],
          reflection_prompt: "What went well?",
          follow_up: "We will review on next shift.",
          competency_map: [{ digest_item: "Clear history taking", competency_id: "epa-1" }],
        },
      },
      rubric_eval: {
        scores: { behavior_specificity: 3 },
        justifications: { behavior_specificity: "Observed" },
        pass: true,
        required_fixes: [],
        risk_flags: [],
      },
      final: {
        rater_coaching: {
          quality_risks: [],
          rewritten_examples: [{ before: "Good job", after: "You gathered a complete history." }],
          two_rater_tips: ["Be specific [Johnson 2016]"],
          bias_flags: [],
        },
        learner_digest: {
          strengths: ["Clear history taking"],
          priority_growth: ["Sharpen assessment"],
          next_case_plan: [
            { action: "Lead summary", success_observed_as: "Summarizes in 60s" },
            { action: "Review differential", success_observed_as: "Lists top 3 causes" },
          ],
          reflection_prompt: "What went well?",
          follow_up: "We will review on next shift.",
          competency_map: [{ digest_item: "Clear history taking", competency_id: "epa-1" }],
        },
      },
      logs: {
        change_log: [],
        unresolved_limits: [],
      },
    };

    expect(() => schema.parse(payload)).not.toThrow();
  });
});
