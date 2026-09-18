# E2E tests: Mineflayer on a real 1.8.8 server

For **in-game behaviour**: role powers, victory triggers, phase transitions, UHC
rules, commands. Each test file boots a real Dockerized Spigot 1.8.8, loads the
plugins, and drives Mineflayer bots to observe what actually happens. This is the
only layer that validates behaviour on 1.8.8 (no MockBukkit). Pure logic stays in
`unit-tests.md`.

The harness lives in `e2e/` (a pnpm + Vitest + TypeScript project, separate from
Gradle).

## Prerequisites

- **Docker** running (servers use `itzg/minecraft-server:java8`).
- **pnpm** (provided by the repo `mise` toolchain).
- The **Spigot 1.8.8 jar** in the local Maven repo (`./gradlew :gdk:check`
  installs it; the harness copies it into `e2e/.cache/`).
- The **obfuscated plugin jars** in `artifacts/` (e.g. `UHCGDK-obfuscated.jar`),
  produced by the ProGuard tasks. The suite tests the *shipped* (obfuscated)
  bytecode on purpose: that is where obfuscation regressions (renamed symbols,
  broken reflection, stripped resources) surface.
- The GDK refuses to enable past the hardcoded expiry in
  `GDKMain.checkForLicenseDuration()`. If a server boots *without* the plugin and
  tests fail wholesale, check that date first.

## Run

```bash
just e2e                 # GDK suite: builds the obfuscated jars, then runs it
just e2e_lguhc           # LGUHC suite (its own repository), against this repository's jars
# or, manually:
./gradlew :gdk:proguard
pnpm -C e2e install      # first time only
pnpm -C e2e test         # vitest run
E2E_DEBUG=1 pnpm -C e2e test   # mirror server logs to stdout
just e2e_lint            # Biome; pnpm -C e2e typecheck for tsc
```

Vitest runs **files sequentially** (`fileParallelism: false`, `pool: "forks"`)
because each file boots its own container. Hooks get a generous timeout
(`hookTimeout: 240_000`; per-suite `beforeAll(..., 600_000)` for world-gen runs).

## Layout: one file per role, plus flows

The GDK suite lives in this repository; a game module's suite lives in the module's
own repository and consumes the harness as the published
`@noradrenalin-developement/uhcgdk-e2e` package.

```
e2e/tests/gdk/<topic>.test.ts        # GDK-core behaviour (host designation, mumble, ...)

consumers/LoupGarouUHC/e2e/tests/behavior-<role>.test.ts   # one file per role (spec + regression net)
consumers/LoupGarouUHC/e2e/tests/behavior-<flow>.test.ts   # night cycle, kill buffs, starter items, ...
consumers/LoupGarouUHC/e2e/tests/role-assignment.test.ts   # the give_role hook + drift guard
consumers/LoupGarouUHC/e2e/tests/game-boot.test.ts         # boot / start flow
```

A role's file is its **spec** while implementing it and its **regression net**
across refactors. A mechanic that spans roles (night, kill buffs) gets its own
flow file.

## Harness API (`e2e/src/index.ts`)

- `startServer({ plugins, ops?, startupTimeoutMs? })` -> `{ host, port, container,
  stop() }`. `plugins` is per-test: `["UHCGDK"]` for GDK-core,
  `["UHCGDK", "LoupGarouUHC"]` for a module. A module's own suite declares its jars
  with `registerPluginJar(name, { baseName, buildHint })`, from both its `globalSetup`
  and a `setupFiles` entry (`pool: "forks"` reloads the harness per worker).
- `startLgGame({ botNames })` -> `LgGame { host, bots[], stop() }`: the LGUHC
  convenience wrapper (server + connected bots; first joiner is the GDK main host).
- `TestBot`: a connected bot with assertion helpers (below).

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type LgGame, startLgGame } from "@noradrenalin-developement/uhcgdk-e2e";

describe("LGUHC role behavior: Barbare", () => {
  let game: LgGame;
  beforeAll(async () => {
    game = await startLgGame({ botNames: ["HostBot", "Barbare1", "Victim1"] });
    await game.host.runCommand("/dev timewarp real 15m", /Cycle avancé/i);
    await give(game, "Barbare1", "lguhc:barbare");
  }, 600_000);
  afterAll(async () => { await game?.stop(); });
  // it(...) per power / cooldown / charge / interaction / edge / victory contribution
});
```

## Deterministic role assignment (mandatory)

Never depend on the random distribution. Force each bot's role:

```ts
async function give(game: LgGame, player: string, roleId: string) {
  await game.host.runCommand(`/lg dev give_role ${player} ${roleId}`,
    new RegExp(`${player} is now`, "i"));
}
```

Role ids are in `src/lguhc-roles.ts` (`LGUHC_ROLE_IDS`, canonical `namespace:key`,
e.g. `lguhc:barbare`). That static list is cross-checked against the server's live
tab-completion by `role-assignment.test.ts`, so renaming a role without updating
the list fails the suite. Use `it.each(LGUHC_ROLE_IDS)` for granular per-role
reporting.

## Time and phase control

- `/dev timewarp real 15m` (reply `/Cycle avancé/i`) advances the clock. Common
  target: **15 min**, past the 10-min PvP unlock + invincibility fade but before
  the 20-min auto-attribution (which would hand out *random teams* and let two
  villager deaths collapse into a premature victory that wipes pending role state).
- `/dev kill <victim> [killer]` (reply `/Simulated death/i`) forces a death so a
  kill-triggered effect or an elimination/victory path fires deterministically.

## Explicit waits, never fixed sleeps

Use a `TestBot` waiter keyed on the exact signal; the timeout is a safety net, not
a wait. `delay(ms)` is only acceptable to let a server-side teleport settle before
acting (the entity sync, not the assertion).

| Need | Helper |
| --- | --- |
| chat reply to a command | `runCommand(cmd, predicate)` |
| a chat line | `waitForMessage(regex)` |
| a played sound (e.g. `mob.wolf.growl`) | `waitForSound(regex)` |
| an action-bar HUD line | `waitForActionBar(regex)` / `assertNoActionBar(regex, ms)` |
| a coloured particle (RGB in 1.8 offsets) | `waitForParticle(p => ...)` |
| a vanilla potion effect | `waitForEffect(id)` |
| a granted item | `waitForInventoryItem(name)` |
| proximity after a teleport | `waitUntilNear(name, blocks)` |
| a sidebar line | `waitForSidebar(regex)` / `readSidebar()` |
| nameplate / team decoration | `waitForNameTagVisibility`, `waitForTeamPrefix/Suffix` |
| command suggestions | `tabComplete("/lg dev give_role Bob ")` |

Observation without waiting: `health`, `activeEffectIds()`,
`inventoryItemNames()`, `position`, `distanceTo(name)`, `attack(name)` /
`tryAttack(name)`, `equipToHand(name)` + `activateItem()`, `consumeItem(name)`.

## A role spec, exhaustively

For each role, one `describe`, and one `it` per leaf of the `grill-me` tree:

- every power (active, passive, triggered),
- every cooldown and every charge state (works, then refuses when spent),
- every interaction with other roles,
- every edge case,
- its contribution to victory.

When the cases share game state, run them in order (one `describe`, ordered `it`s,
shared `beforeAll`); the Barbare spec does this (double-hit needs the victim alive,
absorption then kills it, scramble uses a fresh corpse). Reference the issue/PR
number in the `it` name when the test pins a bug or tracked feature.

## Bug regression (red before fix, green after)

1. Isolate the exact scenario with `grill-me`: observed vs expected, and the
   trigger.
2. Write the Mineflayer test that replays it and asserts the **expected**
   behaviour. It must be **red** on the current build (proof it captures the bug).
3. After the fix it goes **green**.
4. It stays, in the role's `behavior-<role>.test.ts` (or the right flow file), with
   the issue/PR number in its name. The bug cannot return without breaking it.

## Gotchas

- **Mineflayer drops one-time effect packets under load.** A single SetSlot /
  add-effect can be missed. Prefer asserting the **server-confirmed message** (the
  command reply) or poll (`waitForEffect`, `waitForInventoryItem`) rather than
  reading state once right after the action.
- **A single `attack` can whiff** through post-teleport entity-sync lag. Use
  `tryAttack` in a short retry loop when a melee-triggered effect must land.
- **Tests run against the obfuscated jars**, so a failure can be an obfuscation
  regression, not a logic bug.
- **Sequential files, real server**: keep suites focused; reuse one `startLgGame`
  per role file rather than rebooting per `it`.

## Coverage to aim for

- **Per role**: a `behavior-<role>.test.ts` covering all powers, cooldowns,
  charges, interactions, edges, and victory contribution.
- **Flows**: boot/start, role assignment (+ drift guard), phase machine
  (grace -> PvP -> border -> deathmatch -> end), night cycle, UHC rules (no natural
  regen, head drop, spectator on death, border), commands, and any cross-cutting
  GDK behaviour under `tests/gdk/`.
