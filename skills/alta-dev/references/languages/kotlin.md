# Kotlin

## Nullability

- **Zero `!!`.** Every nullable is chained with `?.`, early-exited with `?: return`, or validated at the
  boundary with `require` / `requireNotNull`. `!!` is an assertion that throws a useless exception: if
  you know it is non-null, model it as non-null.
- Java interop platform types (`T!`) are nullable. Never trust the absence of a question mark on
  something that came from Java.
- Push nullability to the boundary and keep the core non-null.

## Construction

- **No `init {}` blocks.** Use a secondary constructor that calls `super(...)` and then assigns the
  `private val` fields. This is enforced in review and it is not negotiable.
- Named and default arguments instead of overload telescopes or a hand-rolled builder.
- `data class` for value holders, with `copy()` instead of mutation.
- `object` and `companion object` for singletons and factories. A symbol built from a framework call at
  class-init time goes behind `by lazy`, or the class cannot load under an inline mock maker.

## Expressions over statements

| Instead of | Write |
|---|---|
| `for (s in xs) { sum += s.n }` | `xs.sumOf { it.n }` |
| `xs.filter { it != null }.map { it!! }` | `xs.filterNotNull()` |
| a `mutableListOf` filled in a loop | `buildList { }` |
| string concatenation in a loop | `buildString { }` |
| manual separator handling | `joinToString(", ")` |
| chained `else if` | `when { }` |
| `if (x == null) { fallback() } else ...` | `x ?: run { fallback() }` |
| `HashMap<K, V>()` | `hashMapOf()` |
| `val (a, b) = pairFrom(...)` done by hand | destructuring |

Use a lazy `Sequence` when the chain is long or the collection large. The exception is a **measured**
hot path, where a plain loop avoids the per-element lambda and iterator allocation.

## Types

- `val` over `var`. Expose read-only `List` / `Map` on APIs, keep `Mutable*` internal.
- **Sealed classes and interfaces** for closed sets, matched with an exhaustive `when` and no `else`.
  Adding a case then becomes a compile error at every site that must handle it: the highest-leverage
  move for extensibility.
- `typealias` when a primitive keeps travelling as a domain concept (`typealias BiomeId = Int`).
- `Duration` and `Instant` on public surfaces, never raw nanos or millis. `Instant.now()` plus
  `Duration.between(...)` rather than timestamp arithmetic.
- `Pair` for a two-tuple whose names add nothing; a `data class` as soon as they do.
- Extension functions to add behaviour without a `XxxUtils` dumping ground.
- Scope functions (`let`, `run`, `apply`, `also`, `with`) only where they clarify. One operation each,
  never stacked into a puzzle.

## Visibility and API

- `private` by default. Widen to `internal` when another class in the module needs it, to `public` only
  when an external consumer does. Public is a long-term commitment.
- No single-call wrapper, alias or passthrough (P2). Expose the collaborator instead of forwarding.
- All imports at the top of the file. No inline fully-qualified names; resolve a collision with
  `import X as Y`.

## Naming and prose

- Verbose over abbreviated: `rolesManager`, `event`, `index`, `text`. No `rm`, `ev`, `t`, `i`.
- `Manager` means stateful orchestrator; a stateless helper is `Util` or `Tools`.
- KDoc in English, only where the behaviour is not evident from the signature. No author or since tags.
- One logger per class, obtained from the class name. Never a global logger, never one passed in.

## Dependencies

The standard library is already on the classpath, so use it freely. Discipline applies to everything
beyond it: prefer the JDK (`java.time`, `java.util.concurrent`, `java.util.regex`) over adding a
library, and do not bundle an extra runtime when the JDK expresses the same thing. In a shaded
artefact, every dependency you do not bundle is real weight saved and one less relocation conflict.

## Tooling and tests

- ktlint with the project's code style, from `.editorconfig`. Format, then check, before claiming done.
- JUnit 5 with an inline-capable mocking library. Mock the collaborators you own; avoid mocking the
  framework's heavy base classes.
- Use static mocking for a static framework API rather than inserting an indirection to stub (P3).
- Tests must not require an external environment file to run.
