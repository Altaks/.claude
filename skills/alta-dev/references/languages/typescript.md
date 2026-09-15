# TypeScript

## The type system is the point

- **No `any`.** Not in a cast, not in a generic default, not in a catch. `unknown` plus a narrowing
  guard where the shape is genuinely open.
- `strict` on, hoisted to the base config so no package can quietly opt out.
- Prefer a discriminated union over a bag of optional fields. If two states cannot coexist, the type
  must say so.
- Derive rather than duplicate: `Pick`, `Omit`, `ReturnType`, `satisfies`, and types generated from the
  contract or the schema. A hand-maintained mirror of a generated type will drift.
- Separate read types from write types. A resource is not a create payload.
- Never widen a generated type with `Record<string, any>` to make a wrapper compile: that wrapper is
  the bug.

## Nullish and booleans

- `|| false` for a boolean property that must never be null. `??` only for a nullable value where `0`
  or `''` are meaningful. Getting this backwards silently turns an empty string into a default.
- Optional chaining an index on a non-array yields `undefined` instead of throwing, so a wrong `[0]`
  can stay invisible for months. Type the field precisely enough that the mistake does not compile.

## Functions and shape

- Handlers are proper methods, not arrow-function properties, where the framework distinguishes them
  (decorators, prototypes, mocking).
- Guard clauses and early returns over nesting.
- No needless intermediate variable: inline a once-used readable expression.
- Simplify boolean returns: `return !this.hasX`, not a ternary.
- No `return await`, no `switch (true)`, no `isNil()` where a falsy check does.
- Getters for derived properties instead of a stored field kept in sync by hand.
- Mapping functions are named `mapToXxxResource`, not `xxxMapper`.

## Async

- Independent operations run in parallel, not sequentially awaited.
- Every promise chain has an error handler. A floating promise is a silently lost failure.
- Never swallow in a catch: log through the project logger with structured context passed as an object,
  not interpolated into the message.
- Dates through a date library (`subDays(now(), 7)`), never manual millisecond arithmetic.

## Files and modules

- File names kebab-case, enforced by lint where the ecosystem has that rule.
- Repositories and stores are instances: import `accountRepository`, not the class.
- Documentation comments on a symbol; line comments only for a short note on a non-obvious line. No
  comment that restates the code.
- Barrel files only where they genuinely reduce coupling; they otherwise hide cycles.
- Remove dead code without mercy.

## Configuration and toolchain

- Config files in TypeScript rather than JavaScript when the tool supports it, typed with the tool's own
  config type, so a wrong key is a compile error. When one must stay JavaScript for a tool's sake, say
  why in a comment or a doc line.
- ESLint flat config plus the formatter, both committed. Lint and typecheck are separate gates and both
  must pass.
- The typecheck runs against the **development** config with no emit, not the build config. Composing it
  from a build script that also cleans the output directory changes what is being checked.
- In a workspace, cross-package resolution goes through the package's declared exports. A lint or
  typecheck that resolves to emitted declarations needs those built first; know which of your gates
  depends on that and say so in the pipeline.

## Tests

- Parameterised cases (`it.each` / `describe.each`) over loops: the output names the failing case.
- Fixtures from generators, not hardcoded literals; a literal only for a deliberately invalid input.
- Assert thrown errors with the expectation matcher, never try/catch.
- Exact comparison for a read response; loose partial matching hides regressions.
- Do not mock the thing under test, and mock the outermost dependency rather than the service wrapping
  it.
- Labels describe behaviour, not the error class or the implementation.

## JavaScript interop

When a file must stay plain JavaScript, keep it typed through documentation comments and checked, so
it is not a hole in the type system. See `javascript.md`.
