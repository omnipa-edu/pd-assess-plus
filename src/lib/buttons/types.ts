/**
 * Types for data-driven button customization (button_definitions, button_sets, visibility_rules).
 */

export type ButtonContextScope = "global" | "procedure" | "program" | "procedure_instance";
export type ButtonContextType = "card" | "form" | "workflow";

export interface VisibilityRules {
  roles?: string[];
  screenSize?: ("mobile" | "desktop")[];
  fieldCondition?: {
    fieldId: string;
    operator: "eq" | "neq" | "present" | "empty";
    value?: string | number | boolean;
  };
  procedureStatus?: ("draft" | "active" | "retired")[];
  programContextRequired?: boolean;
}

export interface ButtonDefinition {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  variant: string;
  size: string;
  sort_order: number;
  tooltip: string | null;
  confirm_title: string | null;
  confirm_body: string | null;
  confirm_label: string | null;
  cancel_label: string | null;
  visibility_rules: VisibilityRules | null;
  action_type: string;
  action_payload: Record<string, unknown>;
  context_scope: ButtonContextScope;
}

export interface ButtonSet {
  id: string;
  name: string;
  description: string | null;
  context: ButtonContextType;
}

export interface ButtonSetItem {
  button_set_id: string;
  button_definition_id: string;
  sort_order: number;
  definition?: ButtonDefinition;
}

export interface ButtonRenderContext {
  role: string;
  screenSize: "mobile" | "desktop";
  procedureStatus?: string;
  programContext?: boolean;
  formState?: Record<string, unknown>;
}
