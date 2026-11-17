# Traceability: Joey

**Target feature:** opencode permission rules — `packages/opencode/src/permission/index.ts`（`evaluate`）、`src/util/wildcard.ts`

> 練習用：需求來自 P3 學習時整理的權限規則行為，沒有實際訪談，所以 Interview evidence 欄寫「—」。

## Requirements

| ID | Interview evidence | Requirement | Acceptance Criteria | Changed in P4? | Property (kind) | Test |
|---|---|---|---|---|---|---|
| R1 | — | When a command matches several rules, the last matching rule in the config decides the action. | `{"bash": {"*": "allow", "rm *": "deny"}}`: `rm -rf /` → `deny`, `ls -la` → `allow`. | No | Model | `permission.property.test.ts` › R1: the last matching rule decides |
| R2 | — | In `evaluate` with only the given rules, a command that matches no rule resolves to `ask`. (The app merges a built-in `"*": "allow"` default first, so at app level unmatched commands are `allow` unless the user sets a catch-all.) | Empty ruleset, any command → `ask`. | Yes (scope clarified) | Invariant | `permission.property.test.ts` › R2: no matching rule resolves to ask |
| R3 | — | A command whose last matching rule is `deny` is never executed. With the bash catch-all set to `ask` (`{"bash": {"*": "ask", "rm *": "deny"}}`), any command not allowed by a more specific rule needs user approval. | App level with that config: `find . -delete` → `ask`, `rm -rf /` → `deny`. | Yes (infeasible) | — (config recommendation; deny part covered by R1) | — |
| R4 | — | Merged into R1. | — | Yes (conflict) | — | — |
| R5 | — | The result identifies the deciding rule: it is the matching rule from the config itself; when nothing matches, it is an `ask` rule with pattern `*`. | `{"bash": {"rm *": "deny"}}`, `rm x` → returns `{permission: "bash", pattern: "rm *", action: "deny"}`. | Yes (uncheckable) | Invariant | `permission.property.test.ts` › R5: the result is the deciding rule itself |
| R6 | — | A pattern `<cmd> *` matches the bare `<cmd>` and `<cmd>` followed by arguments, and nothing else. | `{"bash": {"ls *": "deny"}}`: `ls` → `deny`, `ls -la` → `deny`, `lsof` → `ask`. | No | Model | `permission.property.test.ts` › R6: `ls *` matches bare ls and ls with arguments only |

Properties written or suggested by opencode or another AI tool: none

## Requirement changes

| ID | Original requirement (P3) | Revised requirement | Why it changed |
|---|---|---|---|
| R3 | The agent can never delete important files. | A command whose last matching rule is `deny` is never executed. With the bash catch-all set to `ask` (`{"bash": {"*": "ask", "rm *": "deny"}}`), any command not allowed by a more specific rule needs user approval. | **Infeasible.** Matching is on the command string only; `find . -delete` is `allow` under `{"bash": {"*": "allow", "rm *": "deny"}}`, and the system cannot know which files are important. The need ("nothing deleted without my approval") is kept by the recommended config (verified at app level: `find . -delete` → `ask`). opencode's built-in default is `"*": "allow"`, so this is a config recommendation, not a default guarantee. |
| R2 | A command that matches no rule resolves to `ask`. | Scoped to `evaluate` with only the given rules. | **Infeasible as an app-level promise.** `src/agent/agent.ts` merges a built-in `"*": "allow"` before user rules, so at app level an unmatched command is `allow` (verified: empty user config, `git push` → `allow`). The property tests `evaluate` directly, where `ask` holds. |
| R4 | A more specific rule overrides a general one. | Merged into R1: config order decides, not specificity. | **Conflict** with R1. `{"bash": {"rm *": "deny", "*": "allow"}}` gives `rm -rf /` → `allow` (code uses `findLast`). Kept R1 because it matches the code and is checkable. The need (a deny should not be silently overridden) becomes a follow-up: warn when a deny is fully shadowed by a later rule. |
| R5 | Permission rules should be intuitive. | The result identifies the deciding rule (see R5 above). | **Uncheckable.** "Intuitive" has no pass/fail. The underlying need is knowing why a command was blocked, which can be checked on `evaluate`'s return value. |