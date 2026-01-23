export type FeedbackAIInput = {
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

export type ChainOutput = {
  normalized: NormalizedOutput;
  clusters: ClusterOutput;
  draft: DraftOutput;
  rubric_eval: RubricEvalOutput;
  final: DraftOutput;
  change_log?: string[];
  unresolved_limits?: string[];
};

const BIAS_PATTERNS: Record<string, RegExp[]> = {
  gendered_descriptor: [/bossy/i, /emotional/i],
  trait_label: [/confiden(t|ce)/i, /lazy/i, /aggressive/i, /scattered/i, /unsure/i],
  global_judgment: [/terrible/i, /unacceptable/i, /bad/i, /wasted everyone's time/i, /need to work on/i],
  double_standard_language: [/bossy/i, /aggressive/i],
  "non-specific_superlatives": [/good job/i, /nice work/i, /strong work/i],
  demeaning_or_shaming: [/terrible/i, /unacceptable/i, /wasted everyone's time/i],
  cultural_loading: [/professionalism issue/i]
};

const VAGUE_PATTERNS = [/good job/i, /nice work/i, /be more confident/i, /be more organized/i, /bad/i];

const CONTRADICTION_PAIRS: Array<[RegExp, RegExp, string]> = [
  [/efficient|on time/i, /rushed|didn’t understand|did not understand/i, "Raters noted efficiency alongside patient feeling rushed."],
  [/organized/i, /scattered|unsure/i, "Raters differed on organization versus uncertainty."],
];

const IDENTIFIER_PATTERNS: RegExp[] = [
  /\bMr\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  /\bMs\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  /\bMrs\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  /\broom\s+\d+\b/gi,
];

const KEYWORD_MAP: Array<{ key: string; patterns: RegExp[] }> = [
  { key: "communication", patterns: [/communicat/i, /teach-back/i, /patient/i, /explained/i, /summary/i] },
  { key: "reasoning", patterns: [/differential/i, /diagnos/i, /reason/i, /plan/i] },
  { key: "safety", patterns: [/safety/i, /risk/i, /red flags/i, /verify/i, /INR/i] },
  { key: "team", patterns: [/team/i, /scrub tech/i, /closed-loop/i] },
  { key: "professionalism", patterns: [/professional/i, /hallway/i, /privacy/i, /respect/i] },
  { key: "documentation", patterns: [/note/i, /document/i] },
];

const sentenceSplit = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

const detectBiasFlags = (text: string) => {
  const flags = new Set<string>();
  Object.entries(BIAS_PATTERNS).forEach(([flag, patterns]) => {
    patterns.forEach((pattern) => {
      if (pattern.test(text)) flags.add(flag);
    });
  });
  return Array.from(flags);
};

const isVague = (text: string) => VAGUE_PATTERNS.some((pattern) => pattern.test(text));

const stripIdentifiers = (text: string) => {
  return IDENTIFIER_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, "[redacted]"), text);
};

const hasIdentifiers = (text: string) => {
  return IDENTIFIER_PATTERNS.some((pattern) => pattern.test(text));
};

const getCompetencyId = (text: string, framework: FeedbackAIInput["competency_framework"]) => {
  const lowered = text.toLowerCase();
  for (const map of KEYWORD_MAP) {
    if (map.patterns.some((pattern) => pattern.test(lowered))) {
      const match = framework.find((c) => {
        const joined = `${c.name} ${c.definition}`.toLowerCase();
        return joined.includes(map.key);
      });
      if (match) return match.id;
    }
  }
  return "unmapped";
};

const buildCompetencyMap = (items: string[], framework: FeedbackAIInput["competency_framework"]) => {
  return items.map((item) => ({
    digest_item: item,
    competency_id: getCompetencyId(item, framework),
  }));
};

const normalizeInput = (input: FeedbackAIInput): NormalizedOutput => {
  const observations: string[] = [];
  const strengths: string[] = [];
  const concerns: string[] = [];
  const biasFlags = new Set<string>();

  input.raw_feedback.forEach((entry) => {
    sentenceSplit(entry.comment).forEach((sentence) => {
      detectBiasFlags(sentence).forEach((flag) => biasFlags.add(flag));
      if (/good|strong|well|effective|clear|accurate|improved/i.test(sentence)) {
        strengths.push(sentence);
      } else if (/next time|avoid|missed|didn’t|did not|need to|work on|try to|uncertain|unsure|hesitated/i.test(sentence)) {
        concerns.push(sentence);
      } else {
        observations.push(sentence);
      }
    });
  });

  const contradictions: string[] = [];
  CONTRADICTION_PAIRS.forEach(([pos, neg, message]) => {
    const posHit = [...strengths, ...observations].some((s) => pos.test(s));
    const negHit = [...concerns, ...observations].some((s) => neg.test(s));
    if (posHit && negHit) contradictions.push(message);
  });

  const missing_info: string[] = [];
  const allSentences = [...strengths, ...concerns, ...observations];
  if (allSentences.length <= 1 || allSentences.every((s) => isVague(s))) {
    missing_info.push("Insufficient specific observations to anchor feedback.");
  }

  return {
    observations,
    strengths,
    concerns,
    contradictions,
    missing_info,
    bias_flags: Array.from(biasFlags),
  };
};

const clusterByCompetency = (
  normalized: NormalizedOutput,
  framework: FeedbackAIInput["competency_framework"]
): ClusterOutput => {
  const clustersMap = new Map<string, { theme: string; evidence_quotes: string[] }>();
  const unmapped: { observation: string; reason: string }[] = [];
  const all = [...normalized.strengths, ...normalized.concerns, ...normalized.observations];

  all.forEach((sentence) => {
    const competencyId = getCompetencyId(sentence, framework);
    if (competencyId === "unmapped") {
      unmapped.push({ observation: sentence, reason: "No matching competency keyword." });
      return;
    }
    const existing = clustersMap.get(competencyId);
    if (existing) {
      existing.evidence_quotes.push(sentence);
    } else {
      const theme =
        framework.find((c) => c.id === competencyId)?.name || "Competency theme";
      clustersMap.set(competencyId, { theme, evidence_quotes: [sentence] });
    }
  });

  const clusters = Array.from(clustersMap.entries()).map(([competency_id, value]) => ({
    competency_id,
    theme: value.theme,
    evidence_quotes: value.evidence_quotes,
    confidence: 0.65,
  }));

  return { clusters, unmapped };
};

const buildDraft = (
  input: FeedbackAIInput,
  normalized: NormalizedOutput,
  clusters: ClusterOutput
): DraftOutput => {
  const quality_risks: string[] = [];
  if (normalized.missing_info.length > 0) {
    quality_risks.push("Feedback lacks specific observable examples.");
  }
  if (normalized.bias_flags.length > 0) {
    quality_risks.push("Bias-leaning descriptors detected; reframe to behaviors.");
  }
  if (normalized.contradictions.length > 0) {
    quality_risks.push("Conflicting rater impressions should be acknowledged.");
  }
  if (input.raw_feedback.some((entry) => hasIdentifiers(entry.comment))) {
    quality_risks.push("Privacy identifiers detected; remove names or room numbers.");
  }
  if (
    input.raw_feedback.some((entry) => entry.comment.split(",").length >= 5) ||
    normalized.concerns.length > 2
  ) {
    quality_risks.push("Prioritize 1-2 growth areas to avoid overload.");
  }

  const rewritten_examples = normalized.concerns
    .filter((sentence) => isVague(sentence))
    .map((sentence) => ({
      before: sentence,
      after: "Replace vague language with the specific behavior you observed and its impact.",
    }));

  const strengths = normalized.strengths.slice(0, 3);
  if (strengths.length < 2) {
    strengths.push("Not enough specific observations to highlight clear strengths.");
  }
  if (strengths.length < 2) {
    strengths.push("Identify at least one observable behavior to reinforce.");
  }

  const priority_growth = normalized.contradictions.length > 0
    ? ["Balance efficiency with patient understanding by pausing for confirmation."]
    : normalized.concerns.slice(0, 2);
  if (priority_growth.length === 0) {
    priority_growth.push("Select 1-2 specific behaviors to improve based on future observations.");
  }

  const next_case_plan = [
    {
      action: priority_growth[0]?.includes("verify") ? priority_growth[0] : "Before concluding, verify key data or questions relevant to the case.",
      success_observed_as: "States the verification step out loud before finalizing the plan.",
    },
    {
      action: "Summarize the plan clearly and confirm understanding.",
      success_observed_as: "Learner uses a concise summary and checks for comprehension.",
    },
  ];

  const reflection_prompt = input.learner_reflection
    ? "What part of your approach felt strongest, and where did you feel most uncertain?"
    : "What did you notice about your approach, and what would you change next time?";

  const follow_up =
    normalized.contradictions.length > 0
      ? "We will compare both impressions and align on a shared plan in the next observation."
      : "We will revisit these priorities in the next case.";

  const learner_digest = {
    strengths,
    priority_growth,
    next_case_plan,
    reflection_prompt,
    follow_up,
    competency_map: buildCompetencyMap(
      [...strengths, ...priority_growth, follow_up],
      input.competency_framework
    ),
  };

  return {
    rater_coaching: {
      quality_risks,
      rewritten_examples,
      two_rater_tips: [
        "Ground feedback in observable behaviors [Johnson 2016].",
        "Prioritize 1-2 improvements and co-create next steps [Tripodi 2021].",
      ],
      bias_flags: normalized.bias_flags,
    },
    learner_digest,
  };
};

const gradeDraft = (
  draft: DraftOutput,
  normalized: NormalizedOutput,
  input: FeedbackAIInput
): RubricEvalOutput => {
  const scores: Record<string, number> = {};
  const justifications: Record<string, string> = {};
  const risk_flags: string[] = [];

  scores.specificity_observability = normalized.missing_info.length > 0 ? 2 : 3;
  justifications.specificity_observability =
    normalized.missing_info.length > 0
      ? "Missing specific observations flagged."
      : "Includes observable behaviors.";

  const allMapped = draft.learner_digest.competency_map.every(
    (entry) => entry.competency_id && entry.competency_id.length > 0
  );
  scores.competency_alignment = allMapped ? 4 : 2;
  justifications.competency_alignment = allMapped
    ? "Digest items mapped to competencies."
    : "Some items lacked competency mapping.";

  const hasNextSteps =
    draft.learner_digest.next_case_plan.length === 2 &&
    draft.learner_digest.next_case_plan.every((step) => step.success_observed_as.trim().length > 0);
  scores.actionability_feedforward = hasNextSteps ? 3 : 1;
  justifications.actionability_feedforward = hasNextSteps
    ? "Provides actionable steps with success criteria."
    : "Missing actionable steps.";

  const hasShaming =
    normalized.bias_flags.includes("demeaning_or_shaming") ||
    normalized.bias_flags.includes("global_judgment");
  scores.tone_psychological_safety = hasShaming ? 1 : 3;
  justifications.tone_psychological_safety = hasShaming
    ? "Shaming language detected."
    : "Tone is supportive.";

  if (input.raw_feedback.some((entry) => hasIdentifiers(entry.comment))) {
    scores.tone_psychological_safety = 1;
    justifications.tone_psychological_safety =
      "Privacy identifiers detected in source feedback.";
  }

  const prioritized = draft.learner_digest.priority_growth.length <= 2;
  scores.prioritization_impact = prioritized ? 3 : 1;
  justifications.prioritization_impact = prioritized
    ? "Priority growth areas limited."
    : "Too many growth areas.";

  if (normalized.contradictions.length > 0) {
    scores.prioritization_impact = 1;
    justifications.prioritization_impact =
      "Conflicting rater impressions require explicit acknowledgement.";
  }

  if (input.context.risk_level === "high") {
    scores.prioritization_impact = 1;
    justifications.prioritization_impact =
      "High-risk cases require explicit prioritization of safety-critical actions.";
  }

  if (normalized.bias_flags.length > 0) {
    scores.bias_equity_language = 1;
    justifications.bias_equity_language = "Bias flags present and need mitigation.";
  } else {
    scores.bias_equity_language = 3;
    justifications.bias_equity_language = "No bias flags detected.";
  }

  const scoreValues = Object.values(scores);
  const average = scoreValues.reduce((sum, v) => sum + v, 0) / scoreValues.length;

  const autoFail =
    scores.tone_psychological_safety <= 1 || scores.bias_equity_language <= 1;
  const pass =
    average >= 3 &&
    scoreValues.every((v) => v >= 2) &&
    !autoFail;

  if (autoFail) {
    risk_flags.push("auto_fail_tone_or_bias");
  }

  const required_fixes: string[] = [];
  if (!pass) {
    if (normalized.missing_info.length > 0) required_fixes.push("Add specific observations or note missing info.");
    if (normalized.bias_flags.length > 0) required_fixes.push("Reframe biased or trait-based language.");
    if (!prioritized) required_fixes.push("Prioritize 1-2 growth areas.");
    if (normalized.contradictions.length > 0) required_fixes.push("Acknowledge conflicting rater impressions.");
    if (input.context.risk_level === "high") required_fixes.push("Prioritize safety-critical actions.");
    if (input.raw_feedback.some((entry) => hasIdentifiers(entry.comment))) {
      required_fixes.push("Remove privacy identifiers from learner-facing output.");
    }
  }

  return {
    scores,
    justifications,
    pass,
    required_fixes,
    risk_flags,
  };
};

const reviseDraft = (
  input: FeedbackAIInput,
  draft: DraftOutput,
  normalized: NormalizedOutput,
  rubric: RubricEvalOutput
) => {
  const change_log: string[] = [];
  const revised = { ...draft, learner_digest: { ...draft.learner_digest } };

  const reframeShamingText = (text: string) => {
    if (/wasted everyone's time/i.test(text)) {
      return "Preparation gaps affected the encounter flow; review a brief pre-visit checklist.";
    }
    if (/terrible/i.test(text)) {
      return "There were significant gaps that need review; focus on one safety-critical improvement.";
    }
    if (/unacceptable/i.test(text)) {
      return "This needs improvement to meet safety expectations.";
    }
    if (/missed obvious red flags/i.test(text)) {
      return "Key red flags were missed; prioritize identifying high-risk features.";
    }
    return text;
  };

  const reframeShamingStrength = (text: string) => {
    if (
      /wasted everyone's time|terrible|unacceptable|missed obvious red flags/i.test(text)
    ) {
      return "Specific strengths were not identified in the feedback.";
    }
    return text;
  };

  if (normalized.bias_flags.length > 0) {
    change_log.push("Reframed biased language into behavior-focused guidance.");
    revised.rater_coaching.bias_flags = normalized.bias_flags;
    revised.rater_coaching.quality_risks = Array.from(
      new Set([...revised.rater_coaching.quality_risks, "Bias cues flagged; reframe to behaviors."])
    );
  }

  revised.learner_digest.strengths = revised.learner_digest.strengths.map(reframeShamingStrength);
  revised.learner_digest.priority_growth = revised.learner_digest.priority_growth.map(reframeShamingText);
  revised.learner_digest.next_case_plan = revised.learner_digest.next_case_plan.map((step) => ({
    ...step,
    action: reframeShamingText(step.action),
  }));

  if (normalized.missing_info.length > 0) {
    change_log.push("Added missing-info note to keep feedback grounded.");
    revised.learner_digest.strengths = revised.learner_digest.strengths.map((s) =>
      s.includes("Not enough") ? "Specific observations were limited; focus on adding concrete examples." : s
    );
  }

  if (revised.learner_digest.priority_growth.length > 2) {
    change_log.push("Reduced priority growth to 1-2 items.");
    revised.learner_digest.priority_growth = revised.learner_digest.priority_growth.slice(0, 2);
  }

  if (revised.learner_digest.priority_growth.length === 0) {
    revised.learner_digest.priority_growth = [
      "Select one observable behavior to improve and track next time.",
    ];
  }

  revised.learner_digest.next_case_plan = [
    {
      action: revised.learner_digest.priority_growth[0] || "Confirm key data before acting.",
      success_observed_as: "States the verification step aloud before finalizing the plan.",
    },
    {
      action: "Summarize and confirm understanding before closing.",
      success_observed_as: "Uses teach-back or confirmation question.",
    },
  ];

  revised.learner_digest.competency_map = buildCompetencyMap(
    [
      ...revised.learner_digest.strengths,
      ...revised.learner_digest.priority_growth,
      revised.learner_digest.follow_up,
    ],
    input.competency_framework
  );

  if (rubric.required_fixes.length > 0) {
    change_log.push(`Addressed required fixes: ${rubric.required_fixes.join(", ")}`);
  }

  return { revised, change_log };
};

const sanitizeLearnerDigest = (draft: DraftOutput): DraftOutput => {
  const digest = draft.learner_digest;
  const sanitizeList = (list: string[]) => list.map(stripIdentifiers);
  return {
    ...draft,
    learner_digest: {
      ...digest,
      strengths: sanitizeList(digest.strengths),
      priority_growth: sanitizeList(digest.priority_growth),
      next_case_plan: digest.next_case_plan.map((step) => ({
        action: stripIdentifiers(step.action),
        success_observed_as: stripIdentifiers(step.success_observed_as),
      })),
      reflection_prompt: stripIdentifiers(digest.reflection_prompt),
      follow_up: stripIdentifiers(digest.follow_up),
      competency_map: digest.competency_map.map((entry) => ({
        digest_item: stripIdentifiers(entry.digest_item),
        competency_id: entry.competency_id,
      })),
    },
  };
};

export function runFeedbackAIChainV1(input: FeedbackAIInput): ChainOutput {
  const normalized = normalizeInput(input);
  const clusters = clusterByCompetency(normalized, input.competency_framework);
  const draft = buildDraft(input, normalized, clusters);
  const rubric_eval = gradeDraft(draft, normalized, input);

  if (rubric_eval.pass) {
    return {
      normalized,
      clusters,
      draft,
      rubric_eval,
      final: sanitizeLearnerDigest(draft),
    };
  }

  const { revised, change_log } = reviseDraft(input, draft, normalized, rubric_eval);
  const revisedRubric = gradeDraft(revised, normalized, input);
  const unresolved_limits: string[] = [];
  if (!revisedRubric.pass) {
    unresolved_limits.push("Revision could not fully satisfy rubric without additional observations.");
  }

  return {
    normalized,
    clusters,
    draft,
    rubric_eval,
    final: sanitizeLearnerDigest(revised),
    change_log,
    unresolved_limits,
  };
}
