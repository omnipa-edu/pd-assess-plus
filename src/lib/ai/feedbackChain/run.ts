import { supabase } from "@/integrations/supabase/client";
import { parseFunctionsInvokeError } from "@/lib/supabase/parseFunctionsInvokeError";

import type { FeedbackAIChainResult, FeedbackAIInputs } from "./types";

export interface FeedbackAIChainMetadata {
  supervisorId?: string;
  studentId?: string;
  assessmentId?: string | null;
}

export async function runFeedbackAIChain(
  inputs: FeedbackAIInputs,
  metadata?: FeedbackAIChainMetadata
): Promise<FeedbackAIChainResult> {
  const { data, error } = await supabase.functions.invoke("feedback-ai-chain", {
    body: {
      inputs,
      supervisor_id: metadata?.supervisorId || null,
      student_id: metadata?.studentId || null,
      assessment_id: metadata?.assessmentId || null,
    },
  });

  if (error) {
    const detail = await parseFunctionsInvokeError(error);
    throw detail ? new Error(detail) : error;
  }

  if (!data) {
    throw new Error("No response from feedback AI chain");
  }

  return data as FeedbackAIChainResult;
}

export function extractRunId(result: FeedbackAIChainResult): string | null {
  const changeLog = result.logs?.change_log || [];
  const runEntry = changeLog.find((entry) => entry.startsWith("run_id:"));
  return runEntry ? runEntry.replace("run_id:", "").trim() : null;
}

export async function markFeedbackAIRunUsed(runId: string) {
  if (!runId) return;
  const { error } = await supabase
    .from("feedback_ai_runs")
    .update({ used_in_final_feedback: true })
    .eq("id", runId);

  if (error) {
    throw error;
  }
}

