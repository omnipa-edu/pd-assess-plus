# Feedback AI v1

## Run the eval harness

From the repo root:

```
npx tsx src/feedback_ai/eval_runner.ts
```

## Outputs

Each case writes artifacts to `eval/feedback_ai/runs/<case_id>/`:
- `normalized.json`
- `clusters.json`
- `draft.json`
- `rubric_eval.json`
- `final.json`
- `change_log.json` (only if revisions occurred)

## Interpreting `rubric_eval.json`

`rubric_eval.json` contains per-domain scores, pass/fail, and any required fixes.
The eval runner prints a summary table with initial and final pass/fail plus averages.
