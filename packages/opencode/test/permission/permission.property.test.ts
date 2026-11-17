import { test, expect } from "bun:test"
import fc from "fast-check"
import { Permission } from "../../src/permission"

// R2: A command that matches no rule resolves to `ask`.
// Kind: invariant
// Generator: any permission name and any command string; the ruleset is empty,
// so no rule can match. fc.string() includes "", spaces, and symbols.
test("R2: no matching rule resolves to ask", () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), (permission, command) => {
      expect(Permission.evaluate(permission, command, []).action).toBe("ask")
    }),
  )
})

// Shared generators: small value sets so rules often overlap,
// which is where "last match wins" can go wrong.
const action = fc.constantFrom("allow", "deny", "ask")
const rule = fc.record({
  permission: fc.constantFrom("bash", "edit", "*"),
  pattern: fc.constantFrom("rm *", "git *", "*"),
  action,
})
const command = fc.constantFrom("rm -rf /", "git push", "ls", "")
// Hand-written match table: which commands each pattern matches.
const matches: Record<string, string[]> = {
  "rm *": ["rm -rf /"],
  "git *": ["git push"],
  "*": ["rm -rf /", "git push", "ls", ""],
}

// R1: When a command matches several rules, the last matching rule in the config decides the action.
// Kind: model (reference = findLast over the hand-written match table)
test("R1: the last matching rule decides", () => {
  fc.assert(
    fc.property(fc.array(rule), command, (rules, cmd) => {
      const expected = rules.findLast((r) => r.permission !== "edit" && matches[r.pattern].includes(cmd))
      expect(Permission.evaluate("bash", cmd, rules).action).toBe(expected?.action ?? "ask")
    }),
  )
})

// R5: The result identifies the deciding rule: it is the matching rule from the config itself;
// when nothing matches, it is an `ask` rule with pattern `*`.
// Kind: invariant
test("R5: the result is the deciding rule itself", () => {
  fc.assert(
    fc.property(fc.array(rule), fc.string(), (rules, cmd) => {
      const result = Permission.evaluate("bash", cmd, rules)
      if (rules.some((r) => r === result)) return
      expect(result).toEqual({ permission: "bash", pattern: "*", action: "ask" })
    }),
  )
})

// R6: A pattern `<cmd> *` matches the bare `<cmd>` and `<cmd>` followed by arguments, and nothing else.
// Kind: model (reference = cmd === "ls" || cmd.startsWith("ls "))
// Generator: three layers. Hand-picked near-misses (lsof, LS, " ls"), structured
// command + flag + random tail, and fully random strings. Plain fc.string() almost never produces "ls".
const ls = fc.oneof(
  fc.constantFrom("ls", "ls ", "ls -la", "lsof", "LS", " ls", ""),
  fc
    .tuple(fc.constantFrom("ls", "lsof", "cat"), fc.constantFrom("", " ", " -la"), fc.string())
    .map(([cmd, flag, rest]) => cmd + flag + rest),
  fc.string(),
)
test("R6: `ls *` matches bare ls and ls with arguments only", () => {
  fc.assert(
    fc.property(ls, (cmd) => {
      const expected = cmd === "ls" || cmd.startsWith("ls ") ? "deny" : "ask"
      const rules = [{ permission: "bash", pattern: "ls *", action: "deny" as const }]
      expect(Permission.evaluate("bash", cmd, rules).action).toBe(expected)
    }),
  )
})