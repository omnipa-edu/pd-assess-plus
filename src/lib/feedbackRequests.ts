import { supabase } from "@/integrations/supabase/client";

/** Thrown when `supervisor_feedback_requests` (or RPC) is not deployed on the linked Supabase project. */
export class FeedbackRequestsSchemaUnavailableError extends Error {
  override readonly name = "FeedbackRequestsSchemaUnavailableError";

  constructor() {
    super(
      "Feedback requests are not enabled on this database. Run migration 202603271000_quick_feedback_and_requests.sql on Supabase (or `supabase db push`)."
    );
  }
}

/**
 * PostgREST returns PGRST205 when the table is missing from the schema cache (migration not applied).
 */
export function isFeedbackRequestsUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const parts = [e.message, e.details, e.hint].filter(Boolean).join(" ").toLowerCase();
  if (e.code === "PGRST205") return true;
  if (parts.includes("supervisor_feedback_requests")) {
    if (
      parts.includes("schema cache") ||
      parts.includes("does not exist") ||
      parts.includes("not found")
    ) {
      return true;
    }
  }
  if (
    parts.includes("create_supervisor_feedback_request") &&
    (parts.includes("does not exist") ||
      parts.includes("could not find") ||
      parts.includes("schema cache"))
  ) {
    return true;
  }
  return false;
}

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

  if (error) {
    if (isFeedbackRequestsUnavailableError(error)) {
      throw new FeedbackRequestsSchemaUnavailableError();
    }
    throw error;
  }
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
  if (error) {
    if (isFeedbackRequestsUnavailableError(error)) {
      throw new FeedbackRequestsSchemaUnavailableError();
    }
    throw error;
  }
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

  if (error) {
    if (isFeedbackRequestsUnavailableError(error)) {
      throw new FeedbackRequestsSchemaUnavailableError();
    }
    throw error;
  }
}
