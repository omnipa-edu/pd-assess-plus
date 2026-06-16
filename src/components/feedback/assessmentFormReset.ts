import type { Dispatch, SetStateAction } from "react";

export const INITIAL_AI_USAGE = {
  used_smart_feedback: false,
  smart_feedback_applied: false,
} as const;

export function resetAssessmentSubmissionState(
  setAssessmentId: Dispatch<SetStateAction<string | null>>,
  setValidationErrors: Dispatch<SetStateAction<Record<string, string>>>,
  setAIUsage: Dispatch<SetStateAction<typeof INITIAL_AI_USAGE>>
) {
  setAssessmentId(null);
  setValidationErrors({});
  setAIUsage({ ...INITIAL_AI_USAGE });
}
