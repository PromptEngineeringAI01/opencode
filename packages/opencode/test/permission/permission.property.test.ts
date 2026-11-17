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