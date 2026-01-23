import type { ChainOutput, DraftOutput, NormalizedOutput, RubricEvalOutput } from "./chain_v1";

type CaseExpectations = {
  initial_pass: boolean;
  final_pass: boolean;
  bias_flags_includes: string[];
  conflict_ack_required: boolean;
  missing_info_required: boolean;
  unmapped_required: boolean;
  privacy_stripped_required: boolean;
  priority_keywords_any?: string[];
  prioritization_required?: boolean;
};

type TestSpec = {
  case_id: string;
  expectations: CaseExpectations;
};

type SummaryRow = {
  case_id: string;
  initial_pass: boolean;
  final_pass: boolean;
  avg_score_initial: number;
  avg_score_final: number;
  flags: string[];
};

const IDENTIFIER_REGEX = /\b(Mr|Ms|Mrs)\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+|\broom\s+\d+/gi;

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const averageScore = (scores: Record<string, number>) => {
  const values = Object.values(scores);
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
};

const hasPrivacyViolation = (draft: DraftOutput) => {
  const digest = draft.learner_digest;
  const text = [
    ...digest.strengths,
    ...digest.priority_growth,
    digest.reflection_prompt,
    digest.follow_up,
    ...digest.next_case_plan.map((step) => step.action),
    ...digest.next_case_plan.map((step) => step.success_observed_as),
  ].join(" ");
  return IDENTIFIER_REGEX.test(text);
};

const hasMissingInfoAcknowledgement = (draft: DraftOutput) => {
  const text = [
    ...draft.learner_digest.strengths,
    ...draft.rater_coaching.quality_risks,
  ]
    .join(" ")
    .toLowerCase();
  return /missing|insufficient|not enough|limited/i.test(text);
};

const hasConflictAcknowledgement = (draft: DraftOutput) => {
  const text = [
    ...draft.learner_digest.priority_growth,
    draft.learner_digest.follow_up,
    ...draft.rater_coaching.quality_risks,
  ]
    .join(" ")
    .toLowerCase();
  return /conflict|differ|both impressions|mixed/i.test(text);
};

const hasShamingLanguage = (draft: DraftOutput) => {
  const text = [
    ...draft.learner_digest.strengths,
    ...draft.learner_digest.priority_growth,
    draft.learner_digest.follow_up,
    draft.learner_digest.reflection_prompt,
    ...draft.rater_coaching.quality_risks,
    ...draft.rater_coaching.two_rater_tips,
    ...draft.rater_coaching.rewritten_examples.map((ex) => ex.after),
  ]
    .join(" ")
    .toLowerCase();
  return /terrible|unacceptable|wasted everyone's time|shaming/i.test(text);
};

const hasUnmapped = (draft: DraftOutput) => {
  return draft.learner_digest.competency_map.some((entry) => entry.competency_id === "unmapped");
};

const meetsDigestConstraints = (draft: DraftOutput) => {
  const digest = draft.learner_digest;
  return (
    digest.strengths.length >= 2 &&
    digest.strengths.length <= 3 &&
    digest.priority_growth.length >= 1 &&
    digest.priority_growth.length <= 2 &&
    digest.next_case_plan.length === 2 &&
    digest.reflection_prompt.trim().length > 0
  );
};

const gradeFinal = (draft: DraftOutput, normalized: NormalizedOutput): RubricEvalOutput => {
  const scores: Record<string, number> = {};
  if (normalized.missing_info.length > 0 && hasMissingInfoAcknowledgement(draft)) {
    scores.specificity_observability = 3;
  } else {
    scores.specificity_observability = normalized.missing_info.length > 0 ? 2 : 3;
  }
  scores.competency_alignment = draft.learner_digest.competency_map.length > 0 ? 4 : 2;
  scores.actionability_feedforward =
    draft.learner_digest.next_case_plan.length === 2 ? 3 : 1;
  scores.tone_psychological_safety = hasShamingLanguage(draft) ? 1 : 3;
  scores.prioritization_impact = draft.learner_digest.priority_growth.length <= 2 ? 3 : 1;
  const biasAcknowledged = draft.rater_coaching.quality_risks.some((risk) =>
    /bias|reframe/i.test(risk)
  );
  if (normalized.bias_flags.length > 0 && biasAcknowledged) {
    scores.bias_equity_language = 3;
  } else {
    scores.bias_equity_language = normalized.bias_flags.length > 0 ? 2 : 3;
  }

  const avg = averageScore(scores);
  const autoFail =
    scores.tone_psychological_safety <= 1 || scores.bias_equity_language <= 1;
  return {
    scores,
    justifications: {},
    pass: avg >= 3 && Object.values(scores).every((v) => v >= 2) && !autoFail,
    required_fixes: [],
    risk_flags: [],
  };
};

export function runAssertions(
  spec: TestSpec,
  output: ChainOutput,
  rubricDomains: string[]
): SummaryRow {
  const { expectations } = spec;

  assert(output.normalized !== undefined, `${spec.case_id}: missing normalized`);
  assert(output.clusters !== undefined, `${spec.case_id}: missing clusters`);
  assert(output.draft !== undefined, `${spec.case_id}: missing draft`);
  assert(output.rubric_eval !== undefined, `${spec.case_id}: missing rubric_eval`);
  assert(output.final !== undefined, `${spec.case_id}: missing final`);

  rubricDomains.forEach((domain) => {
    assert(
      output.rubric_eval.scores[domain] !== undefined,
      `${spec.case_id}: rubric_eval missing domain score ${domain}`
    );
  });

  assert(
    meetsDigestConstraints(output.final),
    `${spec.case_id}: learner digest constraints failed`
  );

  if (expectations.privacy_stripped_required) {
    assert(!hasPrivacyViolation(output.final), `${spec.case_id}: privacy not stripped`);
  }

  expectations.bias_flags_includes.forEach((flag) => {
    assert(
      output.normalized.bias_flags.includes(flag),
      `${spec.case_id}: missing expected bias flag ${flag}`
    );
  });

  if (expectations.conflict_ack_required) {
    assert(hasConflictAcknowledgement(output.final), `${spec.case_id}: missing conflict acknowledgement`);
  }

  if (expectations.missing_info_required) {
    assert(
      output.normalized.missing_info.length > 0,
      `${spec.case_id}: missing_info should be surfaced`
    );
  }

  if (expectations.unmapped_required) {
    assert(hasUnmapped(output.final), `${spec.case_id}: unmapped competency not present`);
  }

  if (expectations.prioritization_required) {
    const riskText = output.final.rater_coaching.quality_risks.join(" ").toLowerCase();
    assert(/priorit/i.test(riskText), `${spec.case_id}: prioritization not noted`);
  }

  if (expectations.priority_keywords_any) {
    const growthText = output.final.learner_digest.priority_growth.join(" ").toLowerCase();
    const match = expectations.priority_keywords_any.some((keyword) =>
      growthText.includes(keyword.toLowerCase())
    );
    assert(match, `${spec.case_id}: missing priority keywords`);
  }

  assert(
    output.rubric_eval.pass === expectations.initial_pass,
    `${spec.case_id}: initial pass mismatch`
  );

  const finalRubric = gradeFinal(output.final, output.normalized);
  assert(
    finalRubric.pass === expectations.final_pass,
    `${spec.case_id}: final pass mismatch`
  );

  return {
    case_id: spec.case_id,
    initial_pass: output.rubric_eval.pass,
    final_pass: finalRubric.pass,
    avg_score_initial: averageScore(output.rubric_eval.scores),
    avg_score_final: averageScore(finalRubric.scores),
    flags: output.normalized.bias_flags,
  };
}

