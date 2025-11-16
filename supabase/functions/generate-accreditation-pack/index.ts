// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

type Params = {
  orgId: string;
  from: string; // ISO
  to: string;   // ISO
  specialtyId?: string | null;
};

type EpaAssessment = {
  student_id: string;
  supervisor_id: string | null;
  epa_number: string;
  feedback: string | null;
  rating: string | null;
  created_at: string;
};

function toNum(n: string | number | null | undefined): number | null {
  if (n == null) return null;
  const num = typeof n === "number" ? n : Number(n);
  return Number.isFinite(num) ? num : null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function csv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const esc = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const { orgId, from, to, specialtyId } = (await req.json()) as Params;
    if (!orgId || !from || !to) {
      return new Response(JSON.stringify({ error: "Missing required params" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User-context client (respects RLS for data reads)
    const supabase = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    // Admin client for storage upload
    const supabaseAdmin = createClient(url, service);

    // 1) QUERY analytics data (filter by date and optional specialty if available)
    // Note: Using epa_assessments; if specialty mapping exists, you can join epas table by code.
    const { data: assessments, error } = await supabase
      .from("epa_assessments")
      .select("*")
      .gte("created_at", from)
      .lte("created_at", to);
    if (error) throw error;

    const epaRows = (assessments as EpaAssessment[]) || [];

    // Aggregate by learner/EPA (rotation unknown in schema → "unknown")
    const keyCounts = new Map<string, number>(); // key: learner|epa|rotation
    const epaScores = new Map<string, number[]>(); // epa -> scores
    const epaNarrativeStats = new Map<string, { total: number; narrativeCount: number; totalLen: number }>();
    const learnerEpaScores = new Map<string, number[]>(); // learner|epa -> scores ordered by time

    const sorted = [...epaRows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const r of sorted) {
      const learner = r.student_id;
      const epa = r.epa_number;
      const rotation = "unknown";
      const k = `${learner}|${epa}|${rotation}`;
      keyCounts.set(k, (keyCounts.get(k) ?? 0) + 1);

      const score = toNum(r.rating);
      if (score != null) {
        epaScores.set(epa, [...(epaScores.get(epa) ?? []), score]);
        const leKey = `${learner}|${epa}`;
        learnerEpaScores.set(leKey, [...(learnerEpaScores.get(leKey) ?? []), score]);
      }
      const fb = r.feedback?.trim() ?? "";
      const stats = epaNarrativeStats.get(epa) ?? { total: 0, narrativeCount: 0, totalLen: 0 };
      stats.total += 1;
      if (fb.length > 0) {
        stats.narrativeCount += 1;
        stats.totalLen += fb.length;
      }
      epaNarrativeStats.set(epa, stats);
    }

    // 2) CREATE CSVs
    const wbaCountsCsv = csv(
      ["learner_id", "epa_id", "rotation", "count"],
      [...keyCounts.entries()].map(([k, count]) => {
        const [learner, epa, rotation] = k.split("|");
        return [learner, epa, rotation, count];
        })
    );

    const oscoreDistributionsCsv = csv(
      ["epa_id", "min", "median", "mean", "max"],
      [...epaScores.entries()].map(([epa, scores]) => {
        const min = Math.min(...scores);
        const med = median(scores);
        const avg = mean(scores);
        const max = Math.max(...scores);
        return [epa, min, med.toFixed(2), avg.toFixed(2), max];
      })
    );

    const narrativeCoverageCsv = csv(
      ["epa_id", "total_wbas", "narrative_count", "narrative_pct", "avg_length"],
      [...epaNarrativeStats.entries()].map(([epa, s]) => {
        const pct = s.total === 0 ? 0 : s.narrativeCount / s.total;
        const avgLen = s.narrativeCount === 0 ? 0 : s.totalLen / s.narrativeCount;
        return [epa, s.total, s.narrativeCount, pct.toFixed(3), Math.round(avgLen)];
      })
    );

    const feedbackCyclesCsv = csv(
      ["learner_id", "epa_id", "improved", "first_score", "last_score"],
      [...learnerEpaScores.entries()].map(([k, scores]) => {
        const [learner, epa] = k.split("|");
        if (scores.length < 2) return [learner, epa, false, scores[0] ?? "", scores[scores.length - 1] ?? ""];
        const improved = (scores[scores.length - 1] ?? 0) > (scores[0] ?? 0);
        return [learner, epa, improved, scores[0] ?? "", scores[scores.length - 1] ?? ""];
      })
    );

    // 3) CREATE PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 750;
    const drawText = (text: string, size = 12, bold = false) => {
      page.drawText(text, { x: 48, y, size, font: bold ? fontBold : font });
      y -= size + 8;
    };
    drawText("Accreditation Summary", 20, true);
    drawText(`Org: ${orgId}`);
    drawText(`Date range: ${from} → ${to}`);
    drawText(`Specialty: ${specialtyId ?? "All"}`);
    y -= 8;
    drawText("EPA Coverage (counts)", 14, true);
    const coverageLines = [...keyCounts.entries()].slice(0, 15).map(([k, c]) => {
      const [learner, epa, rotation] = k.split("|");
      return `- ${epa} (${rotation}) → ${c}`;
    });
    for (const line of coverageLines) {
      drawText(line, 10);
    }
    y -= 8;
    drawText("O-SCORE Distributions", 14, true);
    const distLines = [...epaScores.entries()].slice(0, 10).map(([epa, scores]) => {
      const med = median(scores).toFixed(2);
      const avg = mean(scores).toFixed(2);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      // ASCII bar based on mean
      const bars = "█".repeat(Math.max(1, Math.round((Number(avg) / 5) * 20)));
      return `- ${epa}: min ${min}, med ${med}, mean ${avg}, max ${max} | ${bars}`;
    });
    for (const line of distLines) drawText(line, 10);
    y -= 8;
    drawText("Narrative Coverage", 14, true);
    const narrLines = [...epaNarrativeStats.entries()].slice(0, 10).map(([epa, s]) => {
      const pct = s.total === 0 ? 0 : s.narrativeCount / s.total;
      return `- ${epa}: ${s.narrativeCount}/${s.total} (${(pct * 100).toFixed(1)}%) with comments`;
    });
    for (const line of narrLines) drawText(line, 10);
    y -= 8;
    drawText("Feedback Cycles (improvement on repeats)", 14, true);
    const cycleLines = [...learnerEpaScores.entries()].slice(0, 10).map(([k, scores]) => {
      const [learner, epa] = k.split("|");
      const improved = scores.length >= 2 && (scores[scores.length - 1] ?? 0) > (scores[0] ?? 0);
      return `- ${learner.substring(0, 8)}… / ${epa}: ${improved ? "Improved" : "No change"}`;
    });
    for (const line of cycleLines) drawText(line, 10);

    const pdfBytes = await pdfDoc.save();

    // 4) BUILD ZIP
    const zip = new JSZip();
    zip.file("summary.pdf", pdfBytes);
    zip.file("wba_counts.csv", wbaCountsCsv);
    zip.file("oscore_distributions.csv", oscoreDistributionsCsv);
    zip.file("narrative_coverage.csv", narrativeCoverageCsv);
    zip.file("feedback_cycles.csv", feedbackCyclesCsv);
    const zipBytes = await zip.generateAsync({ type: "uint8array" });

    // 5) UPLOAD + SIGNED URL
    const bucket = "reports";
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `${orgId}/accreditation/pack-${ts}.zip`;
    const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(path, zipBytes, {
      contentType: "application/zip",
      upsert: true,
    });
    if (upErr) throw upErr;
    const { data: signed, error: signErr } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (signErr) throw signErr;

    return new Response(JSON.stringify({ signedUrl: signed.signedUrl }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});


