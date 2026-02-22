/**
 * Renders a set of buttons from button_sets (with procedure/program overrides).
 * Evaluates visibility_rules and maps action_type to handlers.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Eye,
  Link2,
  MessageCircle,
  Pencil,
  Save,
  Check,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { evaluateVisibility, type EvalContext } from "@/lib/buttons/ruleEngine";
import type { ButtonDefinition } from "@/lib/buttons/types";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, LucideIcon> = {
  ClipboardList,
  Pencil,
  Link: Link2,
  Eye,
  Save,
  Check,
  CheckCircle,
  MessageCircle,
  Link2,
};

interface ButtonSetRendererProps {
  context: "card" | "form" | "workflow";
  procedureId?: string | null;
  programProcedureId?: string | null;
  evalContext: EvalContext;
  procedureTitle?: string;
  onAction?: (actionType: string, payload: Record<string, unknown>) => void;
  /** For NAVIGATE action: base path to replace :id (e.g. /admin/procedure-library) */
  navigateBasePath?: string;
}

export function ButtonSetRenderer({
  context,
  procedureId,
  programProcedureId,
  evalContext,
  procedureTitle,
  onAction,
  navigateBasePath = "/admin/procedure-library",
}: ButtonSetRendererProps) {
  const navigate = useNavigate();
  const [definitions, setDefinitions] = useState<ButtonDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSet = useCallback(async () => {
    setLoading(true);
    let buttonSetId: string | null = null;
    const contextType = context as "card" | "form" | "workflow";

    if (programProcedureId) {
      const { data: pp } = await supabase
        .from("program_procedure_button_set")
        .select("button_set_id")
        .eq("program_procedure_id", programProcedureId)
        .eq("context", contextType)
        .maybeSingle();
      if ((pp as { button_set_id: string } | null)?.button_set_id)
        buttonSetId = (pp as { button_set_id: string }).button_set_id;
    }
    if (!buttonSetId && procedureId) {
      const { data: pb } = await supabase
        .from("procedure_button_set")
        .select("button_set_id")
        .eq("procedure_id", procedureId)
        .eq("context", contextType)
        .maybeSingle();
      if ((pb as { button_set_id: string } | null)?.button_set_id)
        buttonSetId = (pb as { button_set_id: string }).button_set_id;
    }
    if (!buttonSetId) {
      const { data: defaultSet } = await supabase
        .from("button_sets")
        .select("id")
        .eq("context", contextType)
        .order("name")
        .limit(1)
        .maybeSingle();
      buttonSetId = (defaultSet as { id: string } | null)?.id ?? null;
    }
    if (!buttonSetId) {
      setDefinitions([]);
      setLoading(false);
      return;
    }
    const { data: items } = await supabase
      .from("button_set_items")
      .select("button_definition_id, sort_order")
      .eq("button_set_id", buttonSetId)
      .order("sort_order");
    const ids = (items || []).map((i: { button_definition_id: string }) => i.button_definition_id);
    if (ids.length === 0) {
      setDefinitions([]);
      setLoading(false);
      return;
    }
    const { data: defs } = await supabase
      .from("button_definitions")
      .select("*")
      .in("id", ids);
    const list = (defs || []) as ButtonDefinition[];
    const orderMap = new Map((items || []).map((i: { button_definition_id: string; sort_order: number }) => [i.button_definition_id, i.sort_order]));
    list.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    setDefinitions(list);
    setLoading(false);
  }, [context, procedureId, programProcedureId]);

  useEffect(() => {
    loadSet();
  }, [loadSet]);

  const handleClick = useCallback(
    (def: ButtonDefinition) => {
      if (onAction) {
        onAction(def.action_type, def.action_payload || {});
        return;
      }
      switch (def.action_type) {
        case "NAVIGATE": {
          let route = (def.action_payload?.route as string) || "";
          if (procedureId && route.includes(":id")) route = route.replace(":id", procedureId);
          else if (route && !route.startsWith("/")) route = `${navigateBasePath}/${procedureId}${route.startsWith("/") ? "" : "/"}${route}`;
          if (route) navigate(route);
          break;
        }
        case "OPEN_MODAL":
          // Caller can handle via onAction
          break;
        case "SET_FIELD_VALUE":
          // Form context only
          break;
        default:
          break;
      }
    },
    [procedureId, navigateBasePath, navigate, onAction]
  );

  const visible = definitions.filter((d) =>
    evaluateVisibility(d.visibility_rules ?? null, evalContext)
  );

  if (loading) return null;
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((def) => {
        const Icon = def.icon ? ICON_MAP[def.icon] ?? null : null;
        return (
          <Button
            key={def.id}
            variant={(def.variant as "default" | "outline" | "ghost" | "link" | "destructive" | "secondary") ?? "default"}
            size={(def.size as "default" | "sm" | "lg" | "icon") ?? "default"}
            onClick={() => handleClick(def)}
            title={def.tooltip ?? undefined}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {def.label}
          </Button>
        );
      })}
    </div>
  );
}
