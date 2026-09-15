# Jeu et temps réel

Game logic, plugins, ticked simulations, anything where a loop runs at a fixed rate and players
observe the result. Everything a player perceives is user-facing, so **`ui-ux.md` applies here too**.
Read with `systems.md` (hot paths) and `architecture.md` (extension points).

## The shape that scales

- **A registry per family** (roles, scenarios, teams, modes, abilities), keyed by a stable namespaced
  id, enumerated once. Everything looks up by id; nothing holds a private copy of an instance, and no
  identity comparison happens against a locally kept object.
- **Variants are types, not branches.** A new role or scenario is a new class implementing the base
  type plus one registration line. A conditional that grows by one branch per variant is the failure
  mode.
- **The engine fires events, the variants react.** A module publishes "the game started", "a player
  was eliminated", "an episode began"; the roles subscribe. The engine never calls into a specific
  variant, so a function that "gets heavier over time" is a signal to invert it into a subscription.
- **A coordinator composes sub-managers** (timers, world, scoreboard, hosts) rather than absorbing
  their logic. Ask which class owns a concern before adding a method to the coordinator.

## State

- The game state is an explicit enum with explicit transitions, driven by one place. Not a set of
  booleans.
- Per-carrier state (charges, cooldowns, disguises) is held by the framework, keyed by carrier, created
  when the ability is granted and torn down on death, transfer or game end. It must survive a role
  swap and reset cleanly at the end of the game.
- Use the accessor that means what you mean: the active-players accessor for in-game logic (it excludes
  spectators and the eliminated), the connected-players accessor only for lobby-wide messaging. The
  effective-role accessor for gameplay decisions so an impersonator inherits behaviour, and the initial
  role only for identity checks.
- Drive a disguise or an impersonation through the dedicated operation, never through unassign plus
  reassign: the latter loses the state the framework keeps for the carrier.

## The tick loop

- Anything ticked is a measured hot path. No allocation, no boxing, no per-tick lookup that could be
  hoisted, no configuration read.
- Schedule against the game clock, not the wall clock, when the game can be sped up or warped, so a
  debug time warp moves scheduled work with it.
- Cache handles at construction and pass them down. Re-reading a configuration file per tick or per
  click is blocking.
- Long or blocking work goes off the loop and comes back through the scheduler before touching game
  state.

## Determinism and fairness

- Seeded randomness with the seed obtainable, so a round can be reproduced.
- A deterministic way to force a variant onto a player (a debug command, a test mode). Without it you
  cannot test a specific role, and you are testing the distribution instead.
- Distribution logic is a pure function: player count and configuration in, assignment out. That is
  where the constraints (exactly one traitor, at most k of a kind, incompatible pairs, fillers, fewer
  players than roles) get unit-tested.
- Victory resolution is a pure evaluator over a snapshot, unit-tested for solo win, team win, several
  camps alive, timeout and draw.

## Player-facing output is part of the feature

- **Every player action confirms visibly.** A silent return when the target is missing is a bug. Both
  success and failure produce a message the player sees; logs are secondary.
- Messages carry the project's info / error / success prefix. The dev prefix is dev-only and never
  duplicates player-visible feedback.
- Wording is in the game's language and vocabulary, not the implementation's: say what happened to the
  player, never the internal mechanism's name.
- Rendering constraints are real constraints: line widths, character limits, glyphs the client does not
  render, whitespace the client strips. A framed multi-line announcement is sent as one message,
  otherwise another player's chat interleaves and breaks the frame.
- Commands keep their syntax, their examples and their completion in sync. Every accepted token appears
  in both the completion and the examples, and a bad arity replies with the syntax rather than an
  ad-hoc string.

## Balance is data

Cooldowns, charges, durations, thresholds, compositions and level layouts live in typed configuration
or data files, not in constants scattered through the logic. That is what lets the design be tuned
without a rebuild, and it is what makes a documented rule ("5 times per game, once every 5 minutes")
checkable against the code.

When a documented rule and the implementation disagree, that is a bug with a specification, and it
gets a test.

## Verification

Behaviour a player can observe is proven by driving the real server with real clients against the
shipped artefact, one test file per role or per flow, asserting the exact in-game signal. See
`testing.md`; the "revert it and watch it go red" rule is not optional here, because a plugin that
compiles always looks like it works.
