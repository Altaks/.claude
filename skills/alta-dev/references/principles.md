# Les dix principes, en détail

Pour chacun : la règle, le smell, le fix, la preuve. Les lignes **"Vu comme"** sont des commentaires de
review verbatim, gardées pour que la règle s'argumente sur des faits et pas sur du goût. Les
identifiants des exemples sont illustratifs.

---

## P1. Never guess

Any doubt about what to build, how it should behave, or which edge case wins is a question for the
user. A "reasonable default" chosen without confirmation is a guess.

**Fix.** Interactive: ask and wait. Subagent with no user access: STOP and return the open questions as
blocking questions. Never pick a conservative reading and proceed.

**Surface what the request hides.** Silent side effects (deleting the block instead of cancelling the
drop also kills the XP and changes the break feel; soft-deleting instead of deleting changes every
downstream count), toggleability, public-API impact on consumers, the exact message the user sees, the
unhappy path.

**Vu comme.** Grilling the requirements is the mandatory first step of every build, refactor and test
workflow. Nothing gets written before both sides share one picture.

---

## P2. No wrapper, no alias, no passthrough

A function body that is a single delegating call is deleted, and the underlying API called at each
site. The most repeated correction in these reviews.

**Smells.** `fun resolveUser(id) = Api.lookup(id)` / `fun runLater(task) = scheduler.runTaskLater(...)`
/ `fun setEnabled(v) { enabled = v }` / `Coordinator.foo() = subManager.foo()` / a getter returning a
constant / a `() -> T` callback wrapping a trivial accessor / a "test seam" wrapper existing only to be
stubbed.

**Fix.** Expose the collaborator and let the caller reach through it (`coordinator.subManager.foo()`).
When the wrapper exists because the target was not visible enough, widen the target's visibility
instead. For test seams, mock the underlying API (static mocking, module mocking, a fake at the real
boundary).

**Exception légitime.** A method adding real behaviour on top of the delegation (validation, state
injection, an invariant) is not a passthrough. Test: would deleting it lose anything besides a name?

**Vu comme.** "Revert this and REMEMBER THAT I DON'T WANT THIS KIND OF SMALL HELPER FUNCTIONS SINCE
THEY ONLY ALIAS ONE METHOD CALL." / "i told you NOT TO DO THIS. EVER. Just use the getter directly
instead" / "stop doing this kind of wrappers, write it in memory" / "this shouldn't exist, i already
told you to not do this kind of wrapper functions. This isn't needed at all." / "make the function
accessible from the consumer instead of making an alias function".

---

## P3. Never complicate production code to make it testable

Extract a pure function only when the split makes the code simpler on its own merits. An interface,
seam, wrapper, flag or parameter justified by "the test needs it" is KISS and YAGNI violated at once,
and P2 by another name.

**Fix.** If an honest unit test needs a contortion, do not contort: cover the behaviour end to end.
Harness code (driver bots, server helpers, in-memory repositories, fixtures, fakes) is not production
code; that is exactly where observability belongs, and extending it is encouraged.

**Vu comme.** "avoid indirections made only for tests, prefer mocking instead" / "Don't complicate
production code purely to make it testable: manual testing is always available."

---

## P4. Reuse before you write

The constant, builder, util, mapper or injection pattern almost certainly exists. Find it before
adding a second one.

**Smells.** A hand-rolled construction block where a typed builder exists. A second date-to-timestamp
mapper. A set of values redeclared locally instead of taken from the shared object. A bespoke accessor
invented where the codebase already threads a dependency through its modules. Durations or sizes
recomputed by hand where a constants object holds them.

**Fix.** Grep the concept before writing it. When the shared thing lacks the variant you need, add the
variant to the shared thing (a new builder alongside the existing ones); do not fork it locally.

**Règle de trois, dans l'autre sens.** Generalising too early is its own smell: first case specific,
second noticed, extract at the third real case. Two sites that look alike but change for different
reasons stay apart.

**Vu comme.** "This function already exists in the utils... `mapDateToTimestamp`" (blocking) / "this
should be a builder-built item" / "shouldn't this use the constants object ?" / "check how I made the
dependency injection through all the modules and copy its pattern, it'll be easier to maintain than
having this magic function everywhere" (blocking).

---

## P5. No magic values, no primitive obsession

Every literal encoding a slot, unit, key, duration, width or coordinate becomes a named constant. Every
primitive recurring as a concept becomes a type.

**Fix.**
- `private const val NAV_TOOL_SLOT = 8`, a private companion or module-level constant block holding the
  layout, a shared constants object for cross-file values.
- A type alias when a primitive keeps travelling as a domain concept (`typealias BiomeId = Int`).
- Duration and instant types on public surfaces, never raw nanos or millis. `now()` plus `between(...)`
  over hand-rolled timestamp arithmetic.
- Value objects validating themselves on construction, wherever the codebase models a domain.
- Hoist a constant out of the class when it does not depend on the instance: a compiled regex must not
  be rebuilt on every instantiation.
- Compile-time constants where the language offers them. `SCREAMING_SNAKE_CASE` only for true
  constants, never locals.

**Vu comme.** "Magic string again" / "Magic strings again ? Really ?" / "this `20L` is supposed to be a
constant time delay right ?" / "maybe add a type alias for biome id type" / "Hoist this from the class
since it's a constant, it doesn't need to be re-instantiated every time" (blocking).

---

## P6. Names carry domain meaning, and so does placement

A name answers *why it exists* and *what it returns*, in the domain's words. Folder, file name and
casing are part of the name.

- Intent over implementation: `countPlayersOnNetwork()` not `getServiceInfoSnapshot()`;
  `onCommandPreprocess` not `onPlayerUsesCommand` when the console can also trigger it.
- Domain preposition matters: `...OfProfile`, not `...FromProfile`.
- The type says what it is: a class reacting to domain events is a `PlayerProfileSubscriber` in
  `subscribers/`, not a `ProfileNotificationService` in `listeners/`. Its handler is `onProfileUpdate`.
- Stateful orchestrator is a `Manager`; a stateless helper is a `Util` / `Tools`.
- Mapping functions are `mapToXxxResource`, not `xxxMapper` (that reads as a class).
- Verbose over abbreviated: `rolesManager`, `event`, `index`, `text`. No `rm`, `tm`, `ev`, `t`, `i`.
- Enum and type values are nouns or actors (`CROWD`, `CUSTOMER`, `SOURCING_BOT`), not past participles
  (`AI_SOURCED`).
- File names follow the ecosystem and are lint-enforced where possible: kebab-case sources, uppercase
  standalone docs (`LEVELING.md`), kebab-case infrastructure modules.
- All imports at the top; no inline fully-qualified names, resolve a collision with an alias.

**Vu comme.** `"...OfProfile" not "...FromProfile"` / "This should be named `PlayerProfileSubscriber`" /
"This should be named `onProfileUpdate`" / "This file should be in the `subscribers` folder, not
`listeners`" / "rename this to `LEVELING.md`".

---

## P7. Layering is a contract

**La règle de dépendance.** `infrastructure -> application -> domain`, one way, always. A domain file
importing the web framework, the ORM, the transport layer or an HTTP client is a blocking finding: the
model has leaked and the design is wrong.

**Anti-corruption à chaque couture.** Persistence rows, generated transport messages, third-party HTTP
responses and another bounded context's published model are all foreign. The adapter translates both
ways at its edge; nothing above it knows the foreign type exists. "I'll just pass the row through" is
the most common way a domain rots.

**Propriété.** Logic lives in the class that owns the concern, not the coordinator: before adding a
method to the central manager, ask which class owns this. Domain events are emitted by the domain, not
by the use case that called it. Business invariants live in the aggregate, not the use case or route.

**Source de vérité unique.** One registry, enumerated once, looked up by id. No parallel lists, no
constructor-injected copies of a registered element, no identity comparison against a locally held
instance. Same across representations: wire contract, database schema and domain types tell one story,
enums aligned across all of them.

**Surface publique.** Least visibility by default: private, then module-internal when another class in
the module needs it, then public only for an external consumer. Public is a long-term commitment to
every downstream package or plugin.

**Vu comme.** "Domain event emission should be made in the domain layer, not here. (ça vaut partout
ça)" / "A `domain/` file importing from `infrastructure/` is a blocking review finding" / "Business
invariants belong in the aggregate, not in use-cases or routes."

---

## P8. Extend by adding, and pay the cost where it belongs

**Open/closed.** New behaviour arrives as a new type, a new registered implementation, or a new event
listener, never as another branch in a conditional that grows every release. When a function gets
heavier with each feature, move the reaction into the thing that owns it and have it subscribe.

**Composition over inheritance.** A new cross-cutting concern becomes its own injected class, not a new
abstract layer.

**Coût à la construction, pas par événement.** Read the config, compile the regex, resolve the handle
once at startup and pass it down. Re-reading configuration inside a click handler, per item, per tick
or per request is blocking. Same family: N+1 queries, loading a whole aggregate to read one field,
fetching a full user and account on every request where an indexed boolean would do, sequential awaits
that could run in parallel, allocation inside a hot loop, unbounded collections retaining everything
until a connection closes.

**Mesurer avant d'optimiser autre chose.** Outside the known hot paths, clarity wins. Inside them
(per-tick timers, packet sends, per-request middleware), profile first and leave a short comment saying
what the profile showed, so the next reader does not innocently simplify it away.

**Vu comme.** "cant we make a finish-event listener to make this happen without having to make this
function heavier over time ?" / "Re-reading from the configuration on EVERY click ?" (blocking) /
"Re-reading from the configuration for every item ???" (blocking) / "Memory leak here: Every UUID from
every message is retained until the connection closes."

---

## P9. Fail loud, at the boundary and in CI

**Valider une fois, au bord.** The command entry, the guard method, the controller, the schema. After
that internal code trusts its invariants; defensive null-checks downstream of validated input are noise
and they hide the real failure.

**Ne jamais avaler.** Every catch logs through the project logger, context as structured fields rather
than interpolated into the message. Never a raw print where a logger exists. Every promise chain gets
its error handler. A subscriber that cannot find its entity is looking at corrupted state: let it throw
instead of guarding with an early return.

**Ne jamais no-op en silence.** Throw explicitly for an already-in-state condition. A missing permission
check on a use case is blocking. Error types must match the situation (permission, business-rule
violation, idempotency conflict, not-found are four different things), and error classes never carry
transport status codes: the middleware maps them.

**Toute action utilisateur se confirme visiblement.** A silent return when the target is missing is a
bug. Success and failure both produce a message the user sees; logs are secondary. The message uses the
project's prefixes and the domain's language, not technical terms.

**En CI aussi.** Prefer the configuration that breaks loudly when someone forgets to update it over the
one that silently skips work. An allowlist that errors on a new package beats a denylist that quietly
stops linting it. Same shape for permissions: whitelist, never blacklist, minimum size, every grant
justified.

**Vu comme.** "Use a `logger.error`" (blocking) / "there's no permissions checks here ??" / "Not so
temporary debugging i guess ?" / "I just followed the principle of failing loud & early in CI, however
if you really want to use a whitelist instead of a blacklist, then I can go for it."

---

## P10. Nothing is done until it is proven

**"It compiles" is not verification.** Neither is "it matches the other implementations".

**Le test doit mordre.** Revert the change, run the test, confirm red, restore. A test that passes both
ways verifies nothing. This single check separates a regression net from decoration.

**Asserter le signal exact, jamais un proxy.** The specific message, the specific event *type*, the
state the entity ends in, the notification that must no longer fire. "Did not throw" and "the handler
was called" are not assertions. Exact matchers for a read response; loose partial matching hides
regressions. Assert thrown errors with the expectation matcher, not try/catch, so the "fails for the
right reason" guarantee survives.

**Ni esquive ni échantillon.** One test per case from the grilled decision tree. Every documented
constraint (once per game, once per period, a cooldown, never twice on the same target, only in a given
phase, within a given range) is its own test, not a footnote on the happy path. Cover the refusal paths
and the boundaries, not just the success. Duration never factors into whether a test gets written.

**Ne pas mocker ce qu'on teste.** Mock the outermost dependency (the HTTP call), not the service.
Refetch from the repository to prove persistence happened. Do not reuse entities across tests. Prefer
generated fixtures over literals, and a parameterised case table over a loop.

**Déterminisme.** Seeded randomness, injected clock, explicit waits on a state or a message. Never a
fixed sleep.

**Un bug est un test manquant.** Write the reproducing test first, watch it go red, then fix. It stays
as the regression guard, labelled with the issue or PR number.

**Vu comme.** "The test doesn't check the kind of event" / "It doesn't check if this is the right
event" / "This should use the solitary test bed now instead of writing hand-made mocks" (blocking todo)
/ "Mocking the thing you're testing = not testing anything." (blocking)
