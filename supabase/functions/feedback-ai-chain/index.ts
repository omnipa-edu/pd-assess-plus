import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

type FeedbackAIChainId = "FEEDBACK_AI_CHAIN_V1";

type FeedbackAIInputs = {
  learner: { level: string; role: string; specialty: string };
  context: { setting: string; case_type: string; complexity: string; risk_level: string };
  competency_framework: { id: string; name: string; definition: string }[];
  raw_feedback: { rater_role: string; comment: string; rating: number | null; timestamp: string }[];
  learner_reflection: string | null;
  prior_goals: string[];
};

type NormalizedOutput = {
  observations: string[];
  strengths: string[];
  concerns: string[];
  contradictions: string[];
  missing_info: string[];
  bias_flags: string[];
};

type ClusterOutput = {
  clusters: { competency_id: string; theme: string; evidence_quotes: string[]; confidence: number }[];
  unmapped: { observation: string; reason: string }[];
};

type DraftOutput = {
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

type RubricEvalOutput = {
  scores: Record<string, number>;
  justifications: Record<string, string>;
  pass: boolean;
  required_fixes: string[];
  risk_flags: string[];
};

type FeedbackAIChainResult = {
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

type FeedbackAIChainRequest = {
  inputs: FeedbackAIInputs;
  supervisor_id?: string | null;
  student_id?: string | null;
  assessment_id?: string | null;
};

const CHAIN_ID: FeedbackAIChainId = "FEEDBACK_AI_CHAIN_V1";

const RUBRIC_JSON = {
  rubric_id: "feedback_ai_chain_v1",
  scale: { min: 0, max: 4 },
  domains: {
    behavior_specificity: { description: "Feedback references observable behaviors, not traits." },
    actionability_feedforward: { description: "Includes concrete next steps and feedforward guidance." },
    balanced_strengths_growth: { description: "Balances strengths with priority growth areas." },
    alignment_to_epas: { description: "Links feedback to the EPA framework or marks as unmapped." },
    tone_psych_safety: { description: "Maintains psychologically safe, professional tone." },
    bias_risk_management: { description: "Flags potential bias and avoids judgmental language." },
    conciseness: { description: "Keeps output succinct and focused." },
  },
  pass_rules: { min_domain_score: 3, bias_risk_management_min: 3, alignment_to_epas_min: 3 },
};

async function callOpenAI(systemPrompt: string, userPrompt: string) {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response content from OpenAI");
  }

  return JSON.parse(content);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { inputs, supervisor_id, student_id, assessment_id }: FeedbackAIChainRequest = await req.json();

    if (!inputs) {
      throw new Error("inputs are required");
    }

    const step1Prompt = `Normalize supervisor feedback into structured observations. Output JSON with keys observations, strengths, concerns, contradictions, missing_info, bias_flags.`;
    const step1User = `{{JSON_INPUT}}\n${JSON.stringify({
      learner: inputs.learner,
      context: inputs.context,
      raw_feedback: inputs.raw_feedback,
      learner_reflection: inputs.learner_reflection,
      prior_goals: inputs.prior_goals,
    }, null, 2)}`;

    const normalized = await callOpenAI(step1Prompt, step1User) as NormalizedOutput;

    const step2Prompt = `Cluster normalized feedback by competency framework. Output JSON with keys clusters and unmapped. Each cluster must reference competency_id from the framework or "unmapped".`;
    const step2User = `{{competency_framework}}\n${JSON.stringify(inputs.competency_framework, null, 2)}\n\n{{normalized}}\n${JSON.stringify(normalized, null, 2)}`;
    const clusters = await callOpenAI(step2Prompt, step2User) as ClusterOutput;

    const step3Prompt = `Generate rater coaching and learner digest. Output JSON with rater_coaching and learner_digest.
Constraints:
- learner_digest.strengths 2-3 bullets
- learner_digest.priority_growth 1-2 bullets
- learner_digest.next_case_plan exactly 2 items
- learner_digest.competency_map must map every digest item to a competency_id from framework (UUID) or "unmapped"
- rater_coaching.rewritten_examples should include at least one entry where "after" is a full improved rewrite of the raw feedback.
- Include short citation tags like [Johnson 2016] or [Tripodi 2021] in two_rater_tips when applicable.
`;
    const step3User = `{{context}}\n${JSON.stringify(inputs.context)}\n\n{{learner}}\n${JSON.stringify(inputs.learner)}\n\n{{clusters}}\n${JSON.stringify(clusters)}\n\n{{learner_reflection}}\n${JSON.stringify(inputs.learner_reflection)}\n\n{{prior_goals}}\n${JSON.stringify(inputs.prior_goals)}`;
    const draft = await callOpenAI(step3Prompt, step3User) as DraftOutput;

    const step4Prompt = `Evaluate the draft against the rubric. Output JSON with scores, justifications, pass, required_fixes, risk_flags.`;
    const step4User = `{{RUBRIC_JSON}}\n${JSON.stringify(RUBRIC_JSON, null, 2)}\n\n{{draft}}\n${JSON.stringify(draft, null, 2)}`;
    const rubricEval = await callOpenAI(step4Prompt, step4User) as RubricEvalOutput;

    let finalDraft: DraftOutput = draft;
    let changeLog: string[] | undefined;
    let unresolvedLimits: string[] | undefined;

    if (!rubricEval.pass) {
      const step5Prompt = `Revise the draft to satisfy the rubric. Output JSON with either the DraftOutput shape or { final, change_log, unresolved_limits }. Ensure final adheres to the DraftOutput schema.`;
      const step5User = `{{rubric_eval}}\n${JSON.stringify(rubricEval, null, 2)}\n\n{{draft}}\n${JSON.stringify(draft, null, 2)}`;
      const revised = await callOpenAI(step5Prompt, step5User) as { final?: DraftOutput; change_log?: string[]; unresolved_limits?: string[] } & DraftOutput;
      if ("final" in revised && revised.final) {
        finalDraft = revised.final;
        changeLog = revised.change_log;
        unresolvedLimits = revised.unresolved_limits;
      } else {
        finalDraft = revised as DraftOutput;
      }
    }

    const chainResult: FeedbackAIChainResult = {
      chain_id: CHAIN_ID,
      inputs,
      normalized,
      clusters,
      draft,
      rubric_eval: rubricEval,
      final: finalDraft,
      logs: {
        change_log: changeLog,
        unresolved_limits: unresolvedLimits,
      },
    };

    let runId: string | null = null;
    if (supervisor_id && student_id) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: runRow, error: runError } = await supabaseAdmin
        .from("feedback_ai_runs")
        .insert({
          assessment_id: assessment_id || null,
          supervisor_id,
          student_id,
          chain_id: CHAIN_ID,
          inputs,
          result: chainResult,
        })
        .select("id")
        .single();

      if (runError) {
        console.error("Failed to store feedback_ai_runs", runError);
      } else {
        runId = runRow?.id ?? null;
      }
    }

    const responsePayload: FeedbackAIChainResult = {
      ...chainResult,
      logs: {
        change_log: [
          ...(chainResult.logs.change_log || []),
          ...(runId ? [`run_id:${runId}`] : []),
        ],
        unresolved_limits: chainResult.logs.unresolved_limits,
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
