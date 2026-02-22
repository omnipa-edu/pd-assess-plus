import { describe, it, expect } from "vitest";

import { evaluateVisibility } from "../ruleEngine";
import type { VisibilityRules } from "../types";

describe("evaluateVisibility", () => {
  const baseContext = {
    role: "admin",
    screenSize: "desktop" as const,
  };

  it("returns true when rules are null or empty", () => {
    expect(evaluateVisibility(null, baseContext)).toBe(true);
    expect(evaluateVisibility(undefined, baseContext)).toBe(true);
    expect(evaluateVisibility({}, baseContext)).toBe(true);
  });

  it("filters by role when rules.roles is set", () => {
    expect(
      evaluateVisibility({ roles: ["admin"] }, baseContext)
    ).toBe(true);
    expect(
      evaluateVisibility({ roles: ["admin", "supervisor"] }, baseContext)
    ).toBe(true);
    expect(
      evaluateVisibility({ roles: ["supervisor"] }, { ...baseContext, role: "admin" })
    ).toBe(false);
    expect(
      evaluateVisibility({ roles: ["supervisor"] }, { ...baseContext, role: "learner" })
    ).toBe(false);
  });

  it("filters by screenSize when rules.screenSize is set", () => {
    expect(
      evaluateVisibility({ screenSize: ["desktop"] }, baseContext)
    ).toBe(true);
    expect(
      evaluateVisibility({ screenSize: ["mobile"] }, baseContext)
    ).toBe(false);
    expect(
      evaluateVisibility({ screenSize: ["mobile", "desktop"] }, { ...baseContext, screenSize: "mobile" })
    ).toBe(true);
  });

  it("filters by procedureStatus when set", () => {
    expect(
      evaluateVisibility(
        { procedureStatus: ["active", "draft"] },
        { ...baseContext, procedureStatus: "active" }
      )
    ).toBe(true);
    expect(
      evaluateVisibility(
        { procedureStatus: ["active"] },
        { ...baseContext, procedureStatus: "draft" }
      )
    ).toBe(false);
  });

  it("requires programContext when programContextRequired is true", () => {
    expect(
      evaluateVisibility(
        { programContextRequired: true },
        { ...baseContext, programContext: true }
      )
    ).toBe(true);
    expect(
      evaluateVisibility(
        { programContextRequired: true },
        { ...baseContext, programContext: false }
      )
    ).toBe(false);
  });

  it("evaluates fieldCondition with formState", () => {
    const formState = { consent: true, note: "ok" };
    expect(
      evaluateVisibility(
        { fieldCondition: { fieldId: "consent", operator: "eq", value: true } },
        { ...baseContext, formState }
      )
    ).toBe(true);
    expect(
      evaluateVisibility(
        { fieldCondition: { fieldId: "consent", operator: "eq", value: false } },
        { ...baseContext, formState }
      )
    ).toBe(false);
    expect(
      evaluateVisibility(
        { fieldCondition: { fieldId: "missing", operator: "present" } },
        { ...baseContext, formState }
      )
    ).toBe(false);
    expect(
      evaluateVisibility(
        { fieldCondition: { fieldId: "note", operator: "present" } },
        { ...baseContext, formState }
      )
    ).toBe(true);
  });
});
