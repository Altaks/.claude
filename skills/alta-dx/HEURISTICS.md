# The catalogue: what counts as a DX finding

Seven lenses. Lens 0 is the one that pays; the other six are mostly ways of *discovering* a lens-0 finding from the outside. There is no minimum site count: a single site is enough if it exposes an axis the framework cannot express. What replaces the site count is the user's confirmation that the axis is one they want (see *Completing a notion* in SKILL.md).

---

## 0. Incomplete notion (the concept exists, but it cannot say enough)

**Tell:** the API exists and the consumer uses it, yet still has to finish the job by hand next to it. That leftover handwork names the missing axis.

For each notion, write its completeness grid: the axes a game mode could vary, and whether the API expresses them. The worked example, now fixed, is the potion effect:

| Axis | Before | Now |
|---|---|---|
| Magnitude | vanilla levels only | percentage, host-configurable |
| Lifetime | until removed by hand | permanent, or a TTL on the game clock |
| Bearer | a player, imperatively | declared on a role or a team |
| Condition | none | conditional, combat-only, reconciled each second |

Everything to the left of "Now" was a place a role had to bricoler. Ask the same four questions (how much, how long, on whom, under what condition) of every other notion, then add the ones specific to it.

Notions worth gridding, and the axes to probe:

- **Victory condition**: can it express camp precedence? a solo camp beating a team camp? a dynamic condition that must *not* cut the game short while two camps stand? Today a module writes a resolver by hand, which is the answer.
- **Announcement**: prefix, translation, target set (a role, a camp, the living, everyone), a hover card, a delay. Today it is a string concatenation repeated at every site.
- **Target selection**: active only? alive only? excluding self? excluding teammates? within a range? Today it is `Bukkit.getPlayerExact` plus a `takeIf`, written once per command.
- **Power state**: scoped to a game, a life, a night? reset by whom? Today `powerStates` covers part of it and roles hand-write the rest in an `onGameFinish` handler.
- **Day/night phase**: can a role *ask* the phase, or only be told when it flips? Both, ideally. Today 8 files keep their own `isNight`.
- **Role event dispatch**: does a handler fire for the carrier only? for the impersonated role? Today every handler re-checks `getCurrentRole !== this` by hand, and the KDoc tells them to.

A missing axis is a HAUTE finding even at one site, because it is a design gap, and design gaps get more expensive every week.

## 1. Invented concept (the consumer built what the framework owes it)

**Tell:** a class in a consumer module that has nothing to do with *this* game's fiction, and everything to do with plumbing any roles-UHC would need.

Ask of each such class: *would a second game mode need this?* If yes, it is a GDK gap, and the module is paying rent on the framework's behalf.

Known terrain (verify before citing, the code moves):

- `consumers/LoupGarouUHC/.../victory/LGVictoryResolver.kt`, a full camp-precedence resolver overriding `evaluateVictory`. Camp precedence, solo camps beating team camps, dynamic conditions cutting a game short: none of that is Loup-Garou-specific.
- `.../game/LGEliminationOrchestrator.kt`, behind `onPlayerDeath` / deferred elimination. Deferred death, revival windows and death interception are generic roles-UHC mechanics.
- `roles/RoleSymbols.kt`, a module-local `roleSymbolStack(...)` that every one of ~70 role files calls to build its `symbolItem()`. A framework that makes every consumer write its own symbol builder has not finished the job.

**Shape of the fix to propose:** a GDK-side declarative type with a default that reproduces today's behaviour, so no consumer breaks. Camp precedence becomes data on `UHCGameTeam`, not code in a module.

## 2. Escape hatch (the consumer left the framework to get work done)

Each of these is a hole where a declaration should be. Count them; the count is the argument.

- **Raw `Bukkit.*` reach-through.** Especially `Bukkit.getPlayer` / `getPlayerExact` for target resolution: ~76 sites in `roles/` alone, and 28 of them are the identical `Bukkit.getPlayerExact(name)?.takeIf { activePlayers().contains(it) }` incantation. That is a missing argument type (a Cloud parser that yields an *active* player and rejects the rest with a prefixed error), not 28 developer decisions.
- **Hand-rolled scheduling** around `gdkScheduler`: a raw `runTaskLater` / anonymous `BukkitRunnable` means the GDK scheduler could not express what was needed (a real-time delay vs a game-clock delay, a task that must survive a pause, a one-tick "after the GDK message" ordering). Do not just say "use gdkScheduler": ask *what it could not express*, that is the finding.
- **Events fired by hand**: `Bukkit.getPluginManager().callEvent(UHCNightStartEvent(...))` in a module is a lifecycle bug wearing a workaround's clothes. Something registered too late and had to be re-synced. The fix is in the GDK's registration order, not in the module.
- **Direct `addPotionEffect` / `removePotionEffect`** where a declarative modifier exists. Note *why* the developer bypassed it: if the declarative API cannot express "WEAKNESS while X", that limitation is the finding.

## 3. Copy-paste (the same shape, in file after file)

The loudest findings, though not the deepest: a repeated shape is a lens-0 gap that has already been paid for N times. Count the files, then go find the axis behind it. The count is not the argument for acting, it is the receipt for how long you waited.

- **Boilerplate headers**: the `id/name/description/defaultTeam/maxInstances/symbolItem/victoryCondition` block, verbatim in ~70 role files.
- **Self-filtering guards**: `if (rolesManager.getCurrentRole(uuid) !== this) return` at the top of ~41 handlers. The `UHCGameRole` KDoc *mandates* it, which is the admission: a rule the framework tells every consumer to remember by hand is a rule the framework should enforce. Proposal shape: the GDK dispatches role events only to the carrier's current role.
- **Day/night bookkeeping**: 22 role files keep a private `var isNight` fed by their own `UHCNightStartEvent` / `UHCDayStartEvent` pair, while `context.currentDayPhase()` exists. Either the accessor is undiscoverable or it does not answer the question they had.
- **Reset-on-finish**: `@EventHandler onGameFinish -> resetForNewGame()` duplicated in 22 role files. A role's state should be framework-owned and cleared by the framework (see the `powerStates` slots: they are the seed of the right answer).
- **The prefixed translated message**: `"${GDKMain.GDK_PREFIX} " + Main.translator.translate(player, key, ...)` then `sendMessage`, 189 sites. A missing announcement API. It also means 189 chances to forget the prefix, which is a repo rule.
- **The command quartet**: `@Command` + `@RequireOwningRole` + manual target resolution + a `when` mapping an outcome to three prefixed `sendMessage`s + a twin `@Suggestions` returning `activePlayers().map { it.name }`. Repeated in ~18 roles. The `@Suggestions` half is pure ceremony: an active-player argument type should supply its own completions.

## 4. Syntax and language leverage

Lighter is better, but only where it stays obvious. Look for:

- **Ceremony a Kotlin feature deletes**: an overload telescope that named/default arguments collapse; a hand-rolled builder that an `apply {}` or a DSL receiver replaces; a `when` on a type code that a `sealed` hierarchy makes exhaustive and compiler-checked.
- **A declaration that should read like data**, not like code. `conditionalAttributeModifiers()` returning a list of declared modifiers is the good pattern; a role that instead drives `apply()` / `remove()` by hand from its own `tick()` is the bad one, and the gap between them is a finding (what could the declarative form not express? conditions on interactions? on targets? on combat only?).
- **A trap in the API**: `permanentPotionEffects()` is the canonical one. `VanillaPotionReconciler` absorbs any vanilla Strength/Resistance/Speed into an undetachable buff, so roles document *not* using it. An API whose KDoc says "do not use this" is a design finding, not a documentation one. Either fix it or delete it.
- Do not turn this lens into a style review. Reach for `alta-refactor` for that. Here, only syntax that a *consumer* is forced to write counts.

## 5. Runtime CPU

Only on paths that actually run hot. Named hot paths: the per-tick timers in `GameTimerManager` (PVP, invulnerability, episodes, victory check), the 1 Hz `tick()` of every role, tickable and reconciler (`GDKConditionalAttributeReconciler`, `GDKConditionalPotionReconciler`), per-observer colour and scoreboard reconciliation in `PerObserverColorManager`, and NMS packet sends.

- **Complexity first.** A per-tick linear scan over all players inside a per-player loop is O(n squared) per second. Look for reconcilers that recompute from scratch what a dirty flag or an event could invalidate.
- **Allocation per tick.** Capturing lambdas, iterators and `Stream`s on tiny collections, `map`/`filter` chains rebuilt each tick, string concatenation, boxing. On a 1 Hz `tick()` across 70 roles times N players, this adds up; on a 20 Hz timer it matters more.
- **Work that could be event-driven.** The best optimisation of a polling loop is deleting it. If a reconciler exists only because state changes are not observable, propose making them observable.
- State the mechanism and the frequency. If the claim needs a profile to stand up, say so and make "profile it" the first step of the issue.

## 6. Memory and data structures

- **The structure vs the access pattern**: `HashMap` for lookup, `EnumMap` / `EnumSet` when the key is an enum (much cheaper, and `GDKPlayerAttribute` is an enum), `ArrayDeque` over `LinkedList`, pre-sized collections when the size is known.
- **Boxing on hot paths**: `Map<UUID, Int>` and friends box every value. Per-player-per-tick, that is real heap churn.
- **Per-player state scattered across N maps** in N managers, each keyed by `UUID`: one map lookup per manager per tick. A single per-player state object, resolved once, is both faster and better DX.
- **Leaks**: anything keyed by `UUID` in a long-lived map with no eviction on quit/elimination/game end. Check that every `apply` has a matching `clearAll` on the lifecycle events, and that `powerStates` slots die with the game.

---

## Rating a finding

Two axes, both go in the report and both drive the issue's Project v2 fields.

**Severity (HAUTE / MOYENNE / BASSE)** answers *how much of the framework's promise is broken*, which is not the same as how many sites hurt today:

- **HAUTE**: a notion cannot express an axis the user confirms they want, or the consumer had to invent a framework concept, or a documented API is a trap, or a real hot-path defect. It changes how every future game mode gets written. **Site count is irrelevant here**: one site is enough.
- **MOYENNE**: the concept is expressible but clumsy, or the axis is one the user is unsure they want. Friction, not a wall.
- **BASSE**: cosmetic, local, or an axis the user has explicitly said they do not need yet. Record it so the next audit does not rediscover it.

**Cost (Trivial / Easy / Normal / Hard / Hardcore)** answers *what it takes to build*, and must account for the blast radius on consumers: a change behind a defaulted hook is cheap, a change to `UHCGameRole`'s abstract members rewrites 70 files.

A HAUTE finding that is Hardcore is still worth filing. Say what the migration path is: a defaulted hook, then a deprecation, then the sweep.
