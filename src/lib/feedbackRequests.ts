import { supabase } from "@/integrations/supabase/client";

export type SupervisorFeedbackRequestStatus = "open" | "fulfilled" | "cancelled";

export interface SupervisorFeedbackRequestRow {
  id: string;
  student_id: string;
  supervisor_id: string;
  message: string | null;
  status: SupervisorFeedbackRequestStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Create a feedback request and in-app notification (RPC).
 * Caller should invoke `notify-feedback-request` edge function for email.
 */
export async function createSupervisorFeedbackRequest(
  supervisorId: string,
  message?: string | null
): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc("create_supervisor_feedback_request", {
    p_supervisor_id: supervisorId,
    p_message: message ?? null,
  });

  if (error) throw error;
  let parsed: { id?: string } = {};
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data) as { id?: string };
    } catch {
      parsed = {};
    }
  } else if (data && typeof data === "object") {
    parsed = data as { id?: string };
  }
  const id = parsed.id;
  if (!id) throw new Error("No request id returned");
  return { id };
}

export async function notifyFeedbackRequestEmail(feedbackRequestId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("notify-feedback-request", {
    body: { feedback_request_id: feedbackRequestId },
  });
  if (error) {
    console.warn("notify-feedback-request:", error);
  }
}

export type SupervisorFeedbackRequestWithStudent = SupervisorFeedbackRequestRow & {
  student?: { full_name: string | null } | null;
};

export async function fetchSupervisorFeedbackRequests(
  supervisorId: string,
  status: SupervisorFeedbackRequestStatus | "all" = "open"
): Promise<SupervisorFeedbackRequestWithStudent[]> {
  let q = supabase
    .from("supervisor_feedback_requests")
    .select(
      `*,
      student:profiles!supervisor_feedback_requests_student_id_fkey(full_name)
    `
    )
    .eq("supervisor_id", supervisorId)
    .order("created_at", { ascending: false });

  if (status !== "all") {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as SupervisorFeedbackRequestWithStudent[];
}

export async function updateSupervisorFeedbackRequestStatus(
  requestId: string,
  status: SupervisorFeedbackRequestStatus
): Promise<void> {
  const { error } = await supabase
    .from("supervisor_feedback_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) throw error;
}
