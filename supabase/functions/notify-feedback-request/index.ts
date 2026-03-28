import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const siteUrl = Deno.env.get("SITE_URL") ?? Deno.env.get("PUBLIC_SITE_URL") ?? "https://app.example.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as { feedback_request_id?: string };
    const requestId = body.feedback_request_id;
    if (!requestId) {
      return new Response(JSON.stringify({ error: "feedback_request_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingLog } = await supabase
      .from("feedback_request_email_log")
      .select("feedback_request_id")
      .eq("feedback_request_id", requestId)
      .maybeSingle();

    if (existingLog) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: reqRow, error: reqErr } = await supabase
      .from("supervisor_feedback_requests")
      .select("id, student_id, supervisor_id, message, status")
      .eq("id", requestId)
      .single();

    if (reqErr || !reqRow) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reqRow.student_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supervisorId = reqRow.supervisor_id as string;

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_feedback_requested")
      .eq("user_id", supervisorId)
      .maybeSingle();

    const emailAllowed = prefs?.email_feedback_requested !== false;

    if (!emailAllowed) {
      await supabase.from("feedback_request_email_log").insert({
        feedback_request_id: requestId,
        delivery_status: "skipped_user_prefs",
      });
      return new Response(JSON.stringify({ ok: true, skipped: "user_prefs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: supProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", supervisorId)
      .single();

    const { data: stuProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", reqRow.student_id)
      .single();

    const toEmail = supProfile?.email as string | undefined;
    if (!toEmail) {
      await supabase.from("feedback_request_email_log").insert({
        feedback_request_id: requestId,
        delivery_status: "failed",
      });
      return new Response(JSON.stringify({ ok: false, error: "Supervisor email missing" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendKey) {
      await supabase.from("feedback_request_email_log").insert({
        feedback_request_id: requestId,
        delivery_status: "skipped_no_provider",
      });
      return new Response(JSON.stringify({ ok: true, skipped: "no_provider" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const learnerName = (stuProfile?.full_name as string) || "A learner";
    const msg = (reqRow.message as string | null) || "";
    const link = `${siteUrl.replace(/\/$/, "")}/supervisor/feedback-requests`;

    const html = `
      <p><strong>${learnerName}</strong> requested feedback.</p>
      ${msg ? `<p>Message: ${escapeHtml(msg)}</p>` : ""}
      <p><a href="${link}">Open feedback requests</a></p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") ?? "PD Assess <onboarding@resend.dev>",
        to: [toEmail],
        subject: `Feedback request from ${learnerName}`,
        html,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Resend error", res.status, t);
      await supabase.from("feedback_request_email_log").insert({
        feedback_request_id: requestId,
        delivery_status: "failed",
      });
      return new Response(JSON.stringify({ ok: false, error: "Email send failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("feedback_request_email_log").insert({
      feedback_request_id: requestId,
      delivery_status: "sent",
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
