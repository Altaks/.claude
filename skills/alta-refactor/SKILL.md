---
name: alta-refactor
description: Refactor and clean up Java or Kotlin code to make it readable, reusable, maintainable, extensible, and logically structured, without changing observable behavior. Use this whenever working on a .java or .kt file and the goal is to improve code quality: refactoring, cleaning up, simplifying, restructuring, removing duplication, untangling a god class, taming nested conditionals, applying SOLID, or modernizing to current Java/Kotlin idioms. Reach for it on any request like "make this cleaner", "more maintainable", or "better structured", even if the word "refactor" is never used, and also before adding a feature to messy code, to prepare the ground.
---

# Refactoring Java & Kotlin

## The core principle

Refactoring is changing the *structure* of code without changing its *observable behavior*. That single constraint is what makes the whole activity safe: if behavior is preserved, every step is reversible and reviewable, and you can never silently break a caller. Internalize it: most refactoring mistakes are really behavior changes that slipped in unnoticed.

If a change *should* alter behavior (fix a bug, add a feature), that is not a refactor. Do it separately, in its own commit, and say so.

## Start by understanding the need: use `grill-me`

Before reading a single line to change, invoke the **`grill-me`** skill to pin down what's actually wanted. Refactoring without agreed goals is how you end up "cleaning" code the user never wanted touched, or polishing for the wrong quality. Run the grilling the way that skill prescribes (one question at a time, recommend an answer for each, and explore the codebase to answer anything you can rather than asking) but walk it down *this* decision tree, specific to a refactor:

- **Scope and boundaries.** Which files, modules, or packages are in play? What is explicitly off-limits?
- **Goal and priority.** Of readable / reusable / maintainable / extensible / logically structured / performant (CPU, memory), which matter most here, and what is the concrete pain that triggered this? (Hard to read? Hard to change? Hard to test? Duplicated? Too slow or too heavy?) If performance is in scope, which paths are hot, and is there a profile or benchmark behind it or just a suspicion?
- **Behavior and API contract.** What observable behavior and which public APIs must stay byte-for-byte identical? Is anything safe to break?
- **Safety net.** What test coverage exists for this code? If it's thin, agree up front that characterization tests come first.
- **Constraints.** Which project-specific rules bound what "clean" is even allowed to mean: threading, hot paths, compatibility? (See *Project-specific rules* below; surface these as questions.)
- **Appetite.** How aggressive: a light tidy-up of recent changes, or deeper structural rework?

Resolve every branch before moving on. Only once these are settled do you start the loop below.

## The loop: follow it every time

1. **Establish a safety net first.** Refactoring without tests is editing in the dark. If tests already cover the code, run them and confirm they're green. If they don't, write *characterization tests* that pin down current behavior before touching anything, or, if that isn't feasible, stop and tell the user the change is unsafe and why.
2. **One refactoring at a time, in small atomic slices.** Extract one method, then run. Rename one thing, then run. Small steps keep the feedback loop tight and the diff easy to review.
3. **Compile + run tests after every slice.** Both must be green before the next slice. The rate of feedback is your speed limit.
4. **Never mix a refactor with a behavior change in the same commit.** Reviewers can trust a "pure refactor" diff at a glance; a mixed diff forces them to re-verify everything.
5. **Get explicit sign-off before changing any public API or observable behavior**, especially for a library or fork that other code depends on.

## Before starting

- Understand the code and its tests first. Don't refactor what you can't explain.
- Locate the seams: the points where a unit can be cut out and tested through a clean interface. Refactor toward seams, not away from them.

## Guardrails: these protect the user, don't skip them

- No observable behavior change during a pure refactor without approval.
- Keep each diff small and independently reviewable.
- Compile and tests green between every slice.
- Don't refactor and add a feature in the same change.
- Don't over-engineer. Apply YAGNI; avoid *speculative* generality: abstractions, hooks, and config "for later" that nothing uses yet. (Generalizing once real, repeated cases already exist is a different thing and is encouraged: see *Generalize tailored code into reusable modules*.)
- Preserve the public surface of anything external code depends on unless the user explicitly agrees to break it.
- When your taste conflicts with the codebase's existing conventions, the conventions win. Consistency is a feature.

## What to hunt: smell → fix

- **God class / large class** → extract cohesive responsibilities into focused types (SRP).
- **Long method** → Extract Method; aim for one level of abstraction per method.
- **Long parameter list** → introduce a Parameter Object (Kotlin `data class`, or a small immutable Java class).
- **Primitive obsession** (passing `String`/`Int` where a concept exists) → a small value type (Kotlin `value class`, or a dedicated type).
- **Data clumps** (the same fields traveling together everywhere) → group them into one type.
- **Feature envy** (a method that mostly uses another class's data) → Move Method to that class.
- **Duplicated code** → extract shared logic, but only *real* duplication. Two snippets that look alike today but change for different reasons are not duplication; don't couple them.
- **Reinvented wheel** (hand-rolling what the language or standard library already gives you) → use the built-in. Check first: stdlib helpers (`requireNotNull`/`Objects.requireNonNull`, `joinToString`/`String.join`, `maxOf`/`Math.max`, `sorted()`/`Collections.sort`, `Comparator.comparing`, `getOrElse`/`Map.getOrDefault`) and language features (a Kotlin `object` or an `enum` for a singleton, `data class` for value equality, `default` interface methods for shared behavior). A built-in is tested, documented, and instantly recognizable; a reimplementation is just more surface to maintain and a home for subtle bugs.
- **Nested conditionals / arrow code** → guard clauses and early returns; extract the branches.
- **`instanceof` / type-code chains** → polymorphism: a behavior-bearing `enum` or a class hierarchy in Java 8, or a Kotlin `sealed` type matched with an exhaustive `when`.
- **Boolean parameters** (`doThing(true)`) → split into named methods, or pass an enum that reads at the call site.
- **Null-littered code** → push nullability to the boundary; keep the core non-null.
- **Mutable shared state** → prefer immutability (`val`, `copy`, read-only collection types).
- **Comments that compensate for unclear code** → rename and extract until the code says what the comment said, then delete the comment.
- **A `when`/`switch` that grows every time a new type is added** → push the behavior onto the types themselves (OCP).

## Make it idiomatic

### Kotlin

- **Immutability by default.** `val` over `var`; `data class` + `copy()` over mutation; expose `List`/`Map` (read-only) in APIs, keep `Mutable*` internal.
- **Null safety.** Use `?.`, `?:`, and `requireNotNull`/`checkNotNull` at boundaries. Treat `!!` as a smell: it's an assertion that throws a useless exception; if you know it's non-null, model it as non-null.
- **Model closed sets with `sealed class`/`sealed interface`** and match with an exhaustive `when` (no `else`). Then adding a new case becomes a *compile error* at every `when`: the compiler reminds you of every place to handle it. This is one of the highest-leverage moves for extensibility.
- **`data class`** for value holders: `equals`/`hashCode`/`copy`/`toString` for free.
- **Extension functions** to add behavior without bloating a class or inventing a `XxxUtils` dumping ground.
- **Named and default arguments** instead of overload telescopes and hand-rolled builders.
- **`when` expressions** over `if`-`else` ladders.
- **Scope functions** (`let`/`run`/`apply`/`also`/`with`) only where they clarify: one operation each, never stacked into a puzzle.
- **Prefer collection operations over manual loops.** Express transformations declaratively (`map`, `filter`, `reduce`, `fold`, `groupBy`, `associate`, `sumOf`, `any`/`all`) instead of hand-writing the accumulation and index bookkeeping a loop needs. They state *what* you want, read top to bottom, and remove a whole class of off-by-one and mutable-accumulator bugs. Use a lazy `Sequence` when the chain is long or the collection large, so intermediate steps aren't materialized. The one exception is a *measured* hot path, where a plain loop avoids the per-element lambda and iterator allocation (see *Performance*).
- **`object` / `companion object`** for singletons and factories.

### Java 8

- **`Optional`** for return values that may be absent, instead of returning `null`, and return `Collections.emptyList()` / empty collections rather than `null`, so callers never have to null-check a collection.
- **Streams and lambdas** to replace verbose imperative loops where they clarify intent (`filter`/`map`/`collect`), but keep plain `for` loops on hot paths, where stream and lambda allocation costs add up (see *Performance*).
- **Method references** (`User::getName`) over trivial lambdas that only forward a call.
- **Enums with behavior** for a closed set of variants: give the enum an abstract method and a body per constant. This is the Java 8 way to get polymorphism over a fixed set instead of an `instanceof`/type-code ladder: the role `sealed` classes play in Kotlin.
- **`default` methods on interfaces** to evolve an interface or share behavior without breaking existing implementers.
- **Functional interfaces** (`Function`, `Predicate`, `Supplier`, `Consumer`, ...) for strategy and callback seams, instead of hand-rolled single-method interfaces.
- **Immutability without records.** Final fields set once in the constructor, no setters; hand out read-only views with `Collections.unmodifiableList`/`Map`. (If the project already uses Lombok, `@Value` removes the boilerplate; if Guava is on the classpath, `ImmutableList`/`ImmutableMap`.)
- **`java.time`** (`LocalDate`, `Instant`, `Duration`) over the legacy `Date`/`Calendar` for anything date- or time-related.
- **try-with-resources** for anything `Closeable`, over manual `try`/`finally`.

### Standard library and jar footprint

- **Reach for the JDK before adding a dependency.** `java.util`, `java.lang.Math`, `java.time`, `java.util.concurrent`, and `java.util.regex` already cover an enormous amount: use them rather than reinventing a helper or pulling a library in for it.
- **A Kotlin project ships `kotlin-stdlib` no matter what**: that's the floor, and the collection operations above cost nothing on top of it, so use them freely. Footprint discipline is about everything *beyond* that floor, not about avoiding the stdlib itself (you can't).
- **Don't bundle extra Kotlin or `kotlinx` libraries when the JDK already does the job.** Prefer `java.time` over `kotlinx-datetime`, and JDK concurrency (`CompletableFuture`, `ExecutorService`) over adding `kotlinx-coroutines` when you don't otherwise need structured concurrency. In a plugin that shades its dependencies, every artifact you *don't* bundle is real jar weight saved and one less relocation/conflict risk.
- **Keep Java-side code JDK-native.** Don't have Java classes call into `kotlin-stdlib` helpers: it adds a needless Java→Kotlin dependency edge for something the JDK already expresses.

## Structure & architecture: the "logically structured" part

- **Single Responsibility.** One reason to change per class. If you can't state its job in one sentence, it's doing too much: split it.
- **Deep modules.** Favor a small, simple interface that hides substantial behavior. Shallow modules (lots of surface area, little behind it) multiply complexity; they're the main thing to refactor away from.
- **Depend on abstractions (DIP).** Inject collaborators through constructors; don't `new` them deep inside a method where they can't be substituted or tested.
- **Open/Closed.** Add new behavior by adding a type or implementation, not by editing an ever-growing conditional.
- **Package by feature, not by layer.** Keep things that change together physically close; a feature should be graspable in one folder.
- **Minimize the public surface.** Make `internal` (Kotlin) or package-private (Java) everything that doesn't need to be public. A smaller surface is less to keep stable and freer to refactor.

## Generalize tailored code into reusable modules: when it pays

A behavior hardcoded for one precise case can often be lifted into a module or manager that handles the general case: this is where "reusable" and "extensible" actually come from. But generalizing *too early* is its own smell: a wrong or premature abstraction is harder to undo than duplication, and a general layer nothing yet needs is just dead weight. The two pulls reconcile under one rule:

- **Generalize on demonstrated repetition, not anticipation: the Rule of Three.** Write the first case specific. At the second similar case, note the duplication but resist. By the third real, concrete case, the shared shape is clear enough to extract a sound abstraction. Let the abstraction be *discovered* from real usage, not guessed up front.
- **When you do lift it,** extract the general module behind a small, intention-revealing interface (a deep module: much behavior, little surface), then inject it where the specific code used to live. Keep the move behavior-preserving: the original call site must produce identical results through the new general path. Do it as its own slice with tests green, separate from any new capability the generalization later unlocks.
- **If the cases only look alike** but change for different reasons, leave them separate. Forcing them under one abstraction couples things that should evolve independently: worse than the duplication you were trying to remove.

This is the legitimate counterpart to the YAGNI guardrail: that rule forbids generalizing for cases that *don't exist yet*; this one tells you to do it once they *do*.

## Performance: CPU and memory (measure before you touch)

Treat performance as a discipline layered on top of refactoring: behavior stays identical, only resource use changes. The cardinal rule mirrors the safety net: **measure first.** Optimizing on a hunch usually trades readability for nothing. Profile or benchmark to find the real hotspot, change it, then re-measure to confirm both the win *and* that tests are still green. Confine optimization to paths that actually matter (the tick loop, packet handling, anything per-frame or per-request, the project's hot paths, listed under *Project-specific rules*); leave cold code readable.

What to look for, roughly in order of payoff:

- **Algorithmic complexity first.** The biggest lever, and usually a data-structure problem in disguise. An O(n²) scan that should be an O(1) map lookup beats any micro-optimization. Hunt nested loops over the same collection, repeated linear searches, and derived data rebuilt from scratch on every call (cache it instead).
- **The right data structure for the access pattern**, not the one out of habit:
  - `ArrayList` for index/iteration; `ArrayDeque` over `LinkedList` for a queue/stack; `HashMap` for lookup, `LinkedHashMap` for insertion order, `TreeMap`/sorted structures only when you genuinely need ordering.
  - `EnumMap`/`EnumSet` when the keys are enums: much cheaper than a `HashMap`.
  - Pre-size a collection (`initialCapacity`) when the final size is known, to avoid repeated rehashing and array growth.
  - **Avoid autoboxing on hot paths.** `Map<Integer, ...>` or `List<Long>` boxes every primitive: real CPU and heap cost when it runs per tick. Reach for primitive-specialized collections (fastutil's `Int2ObjectOpenHashMap`, `LongOpenHashSet`, and similar: already on the classpath in most Spigot/Paper forks) or plain primitive arrays.
  - Prefer read-only views over defensive copies on hot paths; copy only when ownership truly transfers.
  - When swapping a structure, watch for *observable* side effects like iteration order: if any caller relied on it, that's a behavior change, not a pure optimization.
- **Allocation inside hot loops.** Per-tick allocations feed GC pressure. Watch for capturing lambdas, iterator and `Stream` allocation on tiny hot collections (a plain `for` can win there, but only where measured), boxing, varargs, and string concatenation in loops (use `StringBuilder`). Hoist loop-invariant work out of the loop; memoize values that get recomputed.
- **Memory footprint.** For huge numbers of small objects, header + reference overhead dominates: favor primitives and flatter layouts, and in extreme cases a struct-of-arrays over an array-of-objects. Watch for leaks: references parked in static or long-lived maps that are never evicted.

Never sacrifice clarity for a speedup you haven't measured, and leave a short comment on any non-obvious optimization saying *why* (what the profile showed), so the next reader doesn't innocently "simplify" it away.

## Naming

- Intention-revealing: a name should answer *why it exists* and *what it does*, so the reader needn't trace the implementation.
- Follow language conventions: `PascalCase` types, `camelCase` members and functions, `SCREAMING_SNAKE_CASE` constants.
- Drop abbreviations and encodings. Renaming is the cheapest refactoring with the best return: do it freely.

## Project-specific rules (UHCGDK)

These bound what "clean" is even allowed to mean in this codebase. Surface them as questions during the `grill-me` pass, and treat a refactor that violates one as a behavior change, not a tidy-up.

- **Concurrency / threading.** This targets Spigot **1.8.8 / 1.8.9**; the Bukkit API is main-thread-only. Never read or mutate worlds, entities, blocks, inventories, scoreboards, or teams off the main thread. Heavy or blocking work (the optional Mumble/Murmur Ice transport and CloudNet calls under `external.**`) runs off-thread, but its results must hop back to the main thread via the Bukkit scheduler before touching any game state. Moving a Bukkit call off-thread is never a "pure refactor": it is a real and dangerous behavior change. The `v1_8_R3` NMS reflection in `src/main/java` is version-pinned to 1.8.8; don't "modernize" it to another mapping.
- **Public API / compatibility.** The GDK is consumed by example modules (LoupGarouUHC) as `compileOnly`, so `public` is a long-term commitment to consumer plugins. Default new members to `internal`; relax to `public` only when a consumer genuinely needs it. The `verifyPublicApiClosure` gate forbids third-party types (CloudNet, Ice/Murmur, Apollo/Lunar, ...) in public GDK signatures: optional integrations stay `internal` under `external.**`. `@EventHandler` methods must stay `public` (Bukkit reflection). Use `Duration`/`Instant` on public surfaces, never raw nanos/millis longs.
- **Performance-sensitive paths.** The hot spots where allocation, boxing, and inner-loop lambdas matter: the per-tick timers in `GameTimerManager` (PVP, invulnerability, episodes, victory check), per-observer colour/scoreboard reconciliation in `PerObserverColorManager` (runs on join/death/game events and rewrites teams), the once-per-second combat-tracker poll in `GDKGameManager`, and NMS packet sends (particles, nametag visibility). Optimize these only with a profile in hand; leave cold code (config panels, one-shot setup) readable.
- **Required / forbidden patterns.**
  - **No single-call wrapper / alias methods.** If a method body is one delegating call (UUID-to-Player resolvers, scheduler facades, manager state setters, NBT-key getters that return a constant), delete it and call the underlying API at the call site. Mock the underlying API in tests instead of inserting a "test seam".
  - **No `init` blocks.** Use a secondary constructor that calls `super(...)` then runs setup; declare fields as `private val` assigned in that constructor (mirrors the FastInv view convention).
  - **No em dashes (U+2014)** anywhere checked into the repo: code, comments, KDoc, commit messages, player-facing strings, and markdown (including this file). Use `:` , `,` , `;` , `.` , or parentheses.
  - **Player messages** start with `GDK_PREFIX` (info), `GDK_PREFIX_ERROR` (red), or `GDK_PREFIX_SUCCESS` (green); `GDK_DEV_PREFIX` is dev-only. Wording is gameplay-flavoured, not technical.
  - **Logging:** each class uses its own `Logger.getLogger(ClassName::class.java.name)`; never `Bukkit.getLogger()` or a logger passed from another class.
  - **State accessors:** use `gdkGameManager.activePlayers()` for in-game logic (excludes spectators/eliminated), reserving `Bukkit.getOnlinePlayers()` for "everyone connected". Use `rolesManager.getCurrentRole(uuid)` for gameplay decisions so impersonators inherit behaviour; `getInitialRole(uuid)` only for identity checks. Drive impersonation through `impersonate(uuid, role, grantedBy = this)`/`stopImpersonating(uuid, this)`, never unassign + reassign; disguises stack, one layer per `grantedBy`. Activate a passive on `getPlayersOfRole` (who plays the role now), tear one down on `getPlayersBoundToRole` (bound at any level).
  - **Material sets** live once in the `MaterialSets` object (`ORES`, `TOOLS`, `SWORDS`, `ARMOR`, ...); never define a local set in a scenario.
  - **FastInv clicks are cancelled by default:** never write `event.isCancelled = true` inside a `setItem` handler; only set it `false` to re-enable a take.
  - **Style:** Kotlin for new code (Java only for NMS/events/NBT/item builders), ktlint `intellij_idea`, JVM 8 target, all imports at the top (resolve collisions with `import X as Y`, no inline fully-qualified names). Don't complicate production code purely to make it testable: manual testing is always available.
  - **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `sync:`); split unrelated hunks with `git add -p`; never add a `Co-Authored-By: Claude` (or any AI) trailer.

## When NOT to refactor

- Right before a release, or under a change freeze.
- Code with no tests and no time to add them: flag the risk and get a decision instead of refactoring blind.
- "Refactors" that are actually rewrites: call them out and discuss separately; they need their own plan and safety net.
- Pure churn: a change that moves code around without making it more readable, testable, or maintainable. If you can't name the benefit, don't do it.
