import { supabase } from "@/integrations/supabase/client";

import type { FeedbackAIInputs } from "./types";

export async function getCompetencyFramework(specialty?: string | null): Promise<FeedbackAIInputs["competency_framework"]> {
  let specialtyId: string | null = null;

  if (specialty && specialty.trim()) {
    const trimmed = specialty.trim();
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(trimmed);

    if (isUuid) {
      specialtyId = trimmed;
    } else {
      const { data: specialtyRow } = await supabase
        .from("specialties")
        .select("id")
        .eq("name", trimmed)
        .maybeSingle();
      specialtyId = specialtyRow?.id ?? null;
    }
  }

  let query = supabase
    .from("epas")
    .select("id, title, description, status, specialty_id")
    .eq("status", "active")
    .order("code");

  if (specialtyId) {
    query = query.eq("specialty_id", specialtyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map((epa) => ({
    id: epa.id,
    name: epa.title,
    definition: epa.description || "",
  }));
}
