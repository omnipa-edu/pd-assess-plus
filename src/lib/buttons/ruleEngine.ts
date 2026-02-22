/**
 * Client-side visibility rule evaluation for button_definitions.
 */

import type { VisibilityRules } from "./types";

export interface EvalContext {
  role: string;
  screenSize: "mobile" | "desktop";
  procedureStatus?: string;
  programContext?: boolean;
  formState?: Record<string, unknown>;
}

export function evaluateVisibility(rules: VisibilityRules | null | undefined, context: EvalContext): boolean {
  if (!rules || Object.keys(rules).length === 0) return true;

  if (rules.roles?.length) {
    if (!context.role || !rules.roles.includes(context.role)) return false;
  }
  if (rules.screenSize?.length) {
    if (!rules.screenSize.includes(context.screenSize)) return false;
  }
  if (rules.procedureStatus?.length && context.procedureStatus != null) {
    if (!rules.procedureStatus.includes(context.procedureStatus)) return false;
  }
  if (rules.programContextRequired === true && !context.programContext) return false;
  if (rules.fieldCondition && context.formState) {
    const { fieldId, operator, value } = rules.fieldCondition;
    const fieldValue = context.formState[fieldId];
    switch (operator) {
      case "eq":
        if (fieldValue !== value) return false;
        break;
      case "neq":
        if (fieldValue === value) return false;
        break;
      case "present":
        if (fieldValue === undefined || fieldValue === null || fieldValue === "") return false;
        break;
      case "empty":
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") return false;
        break;
      default:
        break;
    }
  }
  return true;
}
