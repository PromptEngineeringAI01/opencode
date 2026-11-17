# Traceability: Joey

**Target feature:** opencode permission rules — `packages/opencode/src/permission/index.ts`（`evaluate`）、`src/util/wildcard.ts`

> 練習用：需求來自 P3 學習時整理的權限規則行為，沒有實際訪談，所以 Interview evidence 欄寫「—」。

## Requirements

| ID | Interview evidence | Requirement | Acceptance Criteria | Changed in P4? | Property (kind) | Test |
|---|---|---|---|---|---|---|
| R1 | — | When a command matches several rules, the last matching rule in the config decides the action. | `{"*": "allow", "rm *": "deny"}`: `rm -rf /` → `deny`, `ls -la` → `allow`. | No | Model | 待補 |
| R2 | — | A command that matches no rule resolves to `ask`. | Empty ruleset, any command → `ask`. | No | Invariant | 待補 |
| R3 | — | Merged into R2. | — | Yes (infeasible) | — | — |
| R4 | — | Merged into R1. | — | Yes (conflict) | — | — |
| R5 | — | The result identifies the deciding rule: it is the matching rule from the config itself; when nothing matches, it is an `ask` rule with pattern `*`. | `{"rm *": "deny"}`, `rm x` → returns `{permission: "bash", pattern: "rm *", action: "deny"}`. | Yes (uncheckable) | Invariant | 待補 |
| R6 | — | A pattern `<cmd> *` matches the bare `<cmd>` and `<cmd>` followed by arguments, and nothing else. | `{"ls *": "deny"}`: `ls` → `deny`, `ls -la` → `deny`, `lsof` → `ask`. | No | Model | 待補 |

Properties written or suggested by opencode or another AI tool: none

## Requirement changes

| ID | Original requirement (P3) | Revised requirement | Why it changed |
|---|---|---|---|
| R3 | The agent can never delete important files. | Merged into R2: unmatched commands resolve to `ask`, so the user approves them. | **Infeasible.** Matching is on the command string only; `find . -delete` is `allow` under `{"*": "allow", "rm *": "deny"}`, and the system cannot know which files are important. The need ("nothing deleted without my approval") is kept by R2's default `ask`. |
| R4 | A more specific rule overrides a general one. | Merged into R1: config order decides, not specificity. | **Conflict** with R1. `{"rm *": "deny", "*": "allow"}` gives `rm -rf /` → `allow` (code uses `findLast`). Kept R1 because it matches the code and is checkable. The need (a deny should not be silently overridden) becomes a follow-up: warn when a deny is fully shadowed by a later rule. |
| R5 | Permission rules should be intuitive. | The result identifies the deciding rule (see R5 above). | **Uncheckable.** "Intuitive" has no pass/fail. The underlying need is knowing why a command was blocked, which can be checked on `evaluate`'s return value. |