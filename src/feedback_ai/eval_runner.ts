import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { runFeedbackAIChainV1, type FeedbackAIInput } from "./chain_v1";
import { runAssertions } from "./assertions";

type TestCasesFile = {
  version: string;
  description: string;
  cases: FeedbackAIInput[];
};

type TestSpec = {
  case_id: string;
  expectations: {
    initial_pass: boolean;
    final_pass: boolean;
    bias_flags_includes: string[];
    conflict_ack_required: boolean;
    missing_info_required: boolean;
    unmapped_required: boolean;
    privacy_stripped_required: boolean;
    priority_keywords_any?: string[];
    prioritization_required?: boolean;
  };
};

type TestSpecsFile = {
  version: string;
  description: string;
  cases: TestSpec[];
};

const ROOT = process.cwd();
const CASES_PATH = join(ROOT, "eval/feedback_ai/fixtures/test_cases.json");
const SPECS_PATH = join(ROOT, "eval/feedback_ai/fixtures/test_specs.json");
const RUNS_DIR = join(ROOT, "eval/feedback_ai/runs");

const loadJson = <T>(path: string): T => {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
};

const writeJson = (path: string, payload: unknown) => {
  writeFileSync(path, JSON.stringify(payload, null, 2));
};

const ensureDir = (path: string) => {
  mkdirSync(path, { recursive: true });
};

const rubricDomains = [
  "specificity_observability",
  "competency_alignment",
  "actionability_feedforward",
  "tone_psychological_safety",
  "prioritization_impact",
  "bias_equity_language",
];

const main = () => {
  const casesFile = loadJson<TestCasesFile>(CASES_PATH);
  const specsFile = loadJson<TestSpecsFile>(SPECS_PATH);
  const specMap = new Map(specsFile.cases.map((spec) => [spec.case_id, spec]));

  const summaryRows: Array<ReturnType<typeof runAssertions>> = [];

  casesFile.cases.forEach((testCase) => {
    const spec = specMap.get((testCase as any).case_id);
    if (!spec) {
      throw new Error(`Missing test spec for case ${(testCase as any).case_id}`);
    }

    const result = runFeedbackAIChainV1(testCase);
    const caseDir = join(RUNS_DIR, (testCase as any).case_id);
    ensureDir(caseDir);

    writeJson(join(caseDir, "normalized.json"), result.normalized);
    writeJson(join(caseDir, "clusters.json"), result.clusters);
    writeJson(join(caseDir, "draft.json"), result.draft);
    writeJson(join(caseDir, "rubric_eval.json"), result.rubric_eval);
    writeJson(join(caseDir, "final.json"), result.final);
    if (result.change_log) {
      writeJson(join(caseDir, "change_log.json"), result.change_log);
    }

    const summary = runAssertions(spec, result, rubricDomains);
    summaryRows.push(summary);
  });

  console.log("case_id | initial_pass | final_pass | avg_score_initial | avg_score_final | flags");
  summaryRows.forEach((row) => {
    console.log(
      `${row.case_id} | ${row.initial_pass} | ${row.final_pass} | ${row.avg_score_initial.toFixed(2)} | ${row.avg_score_final.toFixed(2)} | ${row.flags.join(",")}`
    );
  });
};

main();

