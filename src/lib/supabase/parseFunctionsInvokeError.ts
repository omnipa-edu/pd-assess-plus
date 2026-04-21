/**
 * Supabase `functions.invoke` returns `FunctionsHttpError` with `context` set to the
 * failed `Response` (not a parsed body). Parse JSON/text so callers can show real messages.
 */
export async function parseFunctionsInvokeError(error: unknown): Promise<string | null> {
  if (!error || typeof error !== "object") return null;

  const err = error as { name?: string; context?: unknown; message?: string };
  if (err.name !== "FunctionsHttpError") return null;

  const res = err.context;
  if (!(res instanceof Response)) return null;

  try {
    const clone = res.clone();
    const ct = (clone.headers.get("Content-Type") ?? "").split(";")[0].trim().toLowerCase();

    if (ct === "application/json") {
      const body = (await clone.json()) as Record<string, unknown>;
      if (typeof body.error === "string" && body.error.length > 0) {
        return body.error;
      }
    } else {
      const text = (await clone.text()).trim();
      if (text.length > 0) {
        return text.length > 500 ? `${text.slice(0, 500)}…` : text;
      }
    }
  } catch {
    /* ignore parse failures */
  }

  return null;
}
