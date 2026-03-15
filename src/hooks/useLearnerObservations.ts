import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface LearnerObservationRow {
  id: string;
  procedure_id: string;
  learner_id: string;
  observer_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  procedure?: { code: string; title: string };
  observer?: { full_name: string | null };
}

export interface LearnerObservationFilters {
  status?: string;
  procedureId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useLearnerObservations(filters: LearnerObservationFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      "learner-observations",
      user?.id,
      filters.status || "all",
      filters.procedureId || "all",
      filters.dateFrom || "",
      filters.dateTo || "",
    ],
    queryFn: async () => {
      if (!user) return [] as LearnerObservationRow[];

      let query = supabase
        .from("observations")
        .select("id, procedure_id, learner_id, observer_id, status, created_at, submitted_at")
        .eq("learner_id", user.id)
        .order("created_at", { ascending: false });

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.procedureId && filters.procedureId !== "all") {
        query = query.eq("procedure_id", filters.procedureId);
      }
      if (filters.dateFrom) {
        query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
      }
      if (filters.dateTo) {
        query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
      }

      const { data, error } = await query;
      if (error || !data) return [] as LearnerObservationRow[];

      const list = data as LearnerObservationRow[];
      if (list.length === 0) return [] as LearnerObservationRow[];

      const procedureIds = [...new Set(list.map((row) => row.procedure_id))];
      const observerIds = [...new Set(list.map((row) => row.observer_id))];

      const [{ data: procedures }, { data: observers }] = await Promise.all([
        supabase.from("procedures").select("id, code, title").in("id", procedureIds),
        supabase.from("profiles").select("id, full_name").in("id", observerIds),
      ]);

      const procedureMap = new Map(
        (procedures || []).map((proc: { id: string; code: string; title: string }) => [proc.id, proc])
      );
      const observerMap = new Map(
        (observers || []).map((observer: { id: string; full_name: string | null }) => [observer.id, observer])
      );

      return list.map((row) => ({
        ...row,
        procedure: procedureMap.get(row.procedure_id),
        observer: observerMap.get(row.observer_id),
      }));
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
