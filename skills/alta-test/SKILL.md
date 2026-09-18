---
name: alta-test
description: >-
  Builds an EXHAUSTIVE test suite for Minecraft "UHC à rôles" (roles-UHC)
  plugins on 1.8.8 (Spigot), in Kotlin: JUnit + Mockito (mockito-core +
  mockito-inline) unit tests for pure logic, and Mineflayer E2E tests in-game
  (no MockBukkit). Use whenever the topic is testing a Minecraft plugin: role
  behaviour and powers, role distribution, win conditions, the game state
  machine (grâce → PvP → bordure → deathmatch → fin), UHC rules, commands or
  config, even if the user never says "test", "Mineflayer" or "JUnit". Always
  START with the grill-me skill to pin down expected behaviour (every branch),
  then write ONE test per scenario: never sample, dodge, or skip a slow E2E
  test. Write one E2E file per role (spec + regression net). Also trigger WHEN
  A BUG IS MENTIONED: write an E2E test reproducing it (red before fix, green
  after) as a permanent guard. Sample triggers: "écris des tests pour mon
  rôle", "teste le Loup", "j'ai un bug avec le rôle X", "reproduce this bug in
  a test". Responses in French.
---

# alta-test: Test suites for Minecraft roles-UHC ("UHC à rôles") plugins (1.8.8)

You are helping a developer **build, complete, or repair a test suite** for a
Minecraft *roles-UHC* ("UHC à rôles") plugin on **1.8.8** (Spigot), written in
**Kotlin**. Two layers, both exhaustive:

- **Unit**: JUnit + **Mockito** (`mockito-core` + `mockito-inline`), for pure
  game logic.
- **E2E**: **Mineflayer** bots on a real 1.8.8 server, for in-game behaviour.

**No integration layer.** On 1.8.8, MockBukkit covers almost nothing, so in-game
behaviour is validated through E2E (Mineflayer), not through a mocked API.

The goal is not "tests for show" but a suite that *proves* every role and every
mechanic behaves as intended, and that stays a safety net through every internal
refactor.

## Principles

**Respond in French.** Code and identifiers stay in English (the norm); write
`@DisplayName`, test-case names (`it(...)`), comments, and explanations in French.

**Reference the PR/issue in the label when one exists.** When a test comes from a
bug fix or a tracked feature, put its number in the `@DisplayName` / `it(...)`
(e.g. `#1234`). A failing test then points straight back to its context, and the
regression files stay traceable across refactors.

**Start with `grill-me`.** Before writing a single test, use the `grill-me` skill
to make the developer pin down the **expected behaviour** of the role or feature:
every branch of the decision tree, every edge case, every interaction. You don't
test what you *assume*, you test what is *intended*. Concretely, **every leaf of
the grilled decision tree becomes a test.** That is also what makes the suite
exhaustive without guessing.

**Exhaustiveness, zero dodging: the cardinal principle.**
- **One test per possible scenario.** Enumerate *every* case (every branch coming
  out of `grill-me`) and write a test for each. No "representative" sample, no
  "the other cases are similar", no shortcut.
- **Test the functionality EXPLICITLY.** Verify the real behaviour, not a
  convenient proxy. No weak assertion that pretends to cover, no test that
  sidesteps the hard part. If a behaviour is painful to verify, verify it anyway,
  directly.
- **The duration of an E2E test NEVER factors into the decision to write a
  test.** A behaviour that is expensive to validate gets validated anyway.
  Coverage is not sacrificed for speed. An E2E test may legitimately be long: you
  write it.

**Every path, not just the happy path.** Asserting that a power *works* is only
half the test. For each ability, also assert the paths where it must NOT work, or
must behave differently. A test that only fires the power once silently passes
even when the limit is broken, or, like the Voyou `/lg masquer`, asserts the
WRONG constraint (a "cooldown" message where the power is actually once-per-game).
- **Usage limits / refusals.** Drive the SECOND use and assert the exact refusal:
  once per game ("déjà utilisé … cette partie"), once per episode ("… cet
  épisode"), once per night, a cooldown still running ("encore en récupération",
  "se recharge", "n'est pas encore prête"), or a per-target gate ("déjà
  sondé / croisé / enquêté ce joueur"). Then, where it matters, assert it works
  AGAIN once the window reopens (next episode / night / after the cooldown).
- **Invalid targets and states.** Self-target, the killer, a dead / eliminated /
  out-of-range target, the wrong phase (day-only vs night-only), a closed window.
  Assert the specific error each returns, not just "nothing happened".
- **Boundaries.** Just-inside vs just-outside the range/time, exactly-at-the-cap
  vs one-over, first use vs the Nth.
Every documented constraint ("1x/partie", "1x/10 min", "jamais deux fois le même
joueur", "uniquement la nuit", "à ≤25 blocs") is its own test, not a footnote on
the happy-path one.

**Detect the stack and respect its conventions.** We already know: 1.8.8, Kotlin,
Mockito (`mockito-core` + `mockito-inline`) for unit, Mineflayer for E2E. Still read the tree,
the build, and the existing tests to match conventions (packages, naming, test
location, JS runner in use).

**Testability of pure logic.** Pull game logic (distribution, win condition,
cooldown / charges, state machine, config parsing) out of the Bukkit API: simple
inputs → result, no `Player`, no `Bukkit`. It becomes unit-testable with Mockito,
no server needed. Anything that needs the server or a player's real behaviour goes
to E2E.

**Determinism.** Randomness and time make plugin tests flaky.
- Unit: a seeded `Random`; an injected clock / tick counter (mocked with Mockito)
  rather than `System.currentTimeMillis()`.
- E2E: a **deterministic way to assign roles** (debug command / test mode) so you
  can test *each role explicitly* without depending on the random distribution;
  and **explicit waits** (wait for a given message / state change) rather than
  fixed `sleep`s.

**Tests must run.** Generate the tooling (deps + config) and execute the suite. At
the end, check that *every* scenario from the `grill-me` tree has its test: no
gaps.

## What to test in a roles-UHC plugin

Map of concerns, with the layer where each is best tested:

- **Role distribution** *(unit)*: the right count of each role for N players,
  constraints (exactly 1 traitor, at most k× a given role, incompatible roles),
  reproducibility with a fixed seed, edge cases (fewer players than configured
  roles, 0 players, "fillers").
- **Win conditions** *(unit for the evaluator; E2E for the real trigger)*: solo
  win, team win, traitor / wolves, *no* winner while several camps are alive,
  deathmatch / timeout / draw resolution.
- **Roles, one E2E file per role** *(E2E)*: for each role: all its powers
  (active / passive / triggered), its cooldowns and charges, its interactions with
  other roles, its edge cases, its contribution to victory. This file serves as a
  **spec** when implementing the role **and** as a **regression** net through
  every internal refactor. (Isolable cooldown / charge logic is also covered in
  unit tests.)
- **State machine / phases** *(E2E)*: grace (PvP off) → PvP → border shrink →
  deathmatch → end: transitions and timer-driven triggers.
- **UHC rules** *(E2E)*: no natural regeneration, healing only via golden apples
  / potions, border shrink, head drop on death, spectator on death (no respawn).
- **Commands** *(E2E; parsing in unit tests)*: `/uhc start`, role configuration,
  permissions, error messages.
- **Configuration** *(unit)*: parsing `config.yml` → typed model, validation (an
  invalid config is rejected cleanly).

## Workflow

1. **`grill-me`**: extract the full expected behaviour (decision tree) of the
   targeted role or feature. Do not start from assumptions.
2. **Enumerate the scenarios** from the tree: one per leaf. That is your list of
   tests to write, and it must be exhaustive.
3. **Sort by layer**: pure logic → unit (Mockito); in-game behaviour → E2E
   (Mineflayer, one file per role).
4. **Set up the tooling**: JUnit + Mockito on the unit side; Mineflayer harness +
   1.8.8 server + deterministic assignment hook on the E2E side (see the
   references).
5. **Write the tests**: one per scenario, explicit, no dodging. One E2E file per
   role.
6. **Run and loop**: execute, fix, and check the suite against the tree: does
   every branch have its test? If not, fill the gap.

## When a bug is reported

A bug is proof that a scenario was missing from coverage. The response is not just
"fix it": it is to **first write the E2E test that captures the bug.**

1. With `grill-me` (or at minimum by clarifying), isolate the exact scenario: the
   *observed* (wrong) behaviour vs the *expected* behaviour, and what triggers the
   bug.
2. Write a Mineflayer E2E test that replays that scenario and **asserts the
   expected behaviour**. It must be **red** on the current build: that is what
   proves it truly captures the bug, rather than dodging it.
3. Once the fix is in place, the test turns **green**: proof that the bug is
   fixed.
4. The test **stays** as a regression guard, filed in the relevant role's file (or
   the appropriate flow file), with a name that points to the bug **and references
   the issue/PR number** (e.g. `#1234`). It cannot reappear without breaking this
   test.

## References

- `references/unit-tests.md`: JUnit + Mockito (`mockito-core` + `mockito-inline`):
  distribution, win condition, cooldown / charges, state machine, config; fixed
  seed and mocked clock; how to stay exhaustive (one case per branch). Read it for
  pure logic.
- `references/e2e-tests.md`: Mineflayer on a 1.8.8 server: **one file per role**,
  deterministic assignment hook, observation / assertions via the bots, explicit
  waits, and the exhaustive coverage to aim for (per role + game flows). Read it
  for in-game behaviour.

## Pitfalls to watch for

- **No sampling.** If a case exists in the tree, it has its test. "The others are
  the same" is not coverage.
- **No dodging.** Test the real behaviour, not an easy substitute. A green test
  that proves nothing is worse than no test.
- **Never skip an E2E test "because it's slow".** Duration is not a criterion.
- **Deterministic role assignment in E2E.** Without a hook to force a bot into a
  role, you depend on randomness and you are not testing the intended role.
- **No fixed `sleep` in E2E.** Explicit waits on a precise message / state; the
  timeout is only a safety net, not a wait.
- **Fixed seed in unit tests** for anything random.
- **Test observable behaviour, not implementation**: this is precisely what lets
  the per-role E2E files survive refactors and play their regression role.
