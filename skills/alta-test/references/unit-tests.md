# Unit tests: JUnit 5 + raw Mockito (Kotlin)

For **pure game logic** only: distribution, win-condition evaluation, cooldown /
charge bookkeeping, state-machine math, config parsing. No real server, no live
`Player`. Anything that needs the server or a player's real in-game behaviour goes
to E2E (`e2e-tests.md`), not here.

## Stack (already wired, do not re-add)

- **JUnit 5** (`org.junit.jupiter:junit-jupiter` 5.9.3), runner
  `junit-platform-launcher`.
- **Raw Mockito**: `org.mockito:mockito-core:4.11.0` and
  `org.mockito:mockito-inline:4.11.0`. The `inline` mock-maker is what lets you
  `mockStatic(...)` and mock final Kotlin classes. There is **no mockito-kotlin**
  in this repo: use `mock(X::class.java)` and `` `when`(...) ``, not `mock()` /
  `whenever()`.
- Tests live in `<module>/src/test/kotlin/...`, mirroring the main package.
- Run: `./gradlew :gdk:test`, or the module, e.g.
  `./gradlew :consumers:LoupGarouUHC:test`. Full gate: `./gradlew check`.

## Core idiom

```kotlin
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class SorciereRoleTest {
    private fun mockPlayer(uuid: UUID = UUID.randomUUID()): Player =
        mock(Player::class.java).also { `when`(it.uniqueId).thenReturn(uuid) }

    @Test fun `consumeResurrection refuses after first use`() {
        val role = SorciereRole()
        // ... drive the role through pure method calls, assert observable state
    }
}
```

- Test names: backticked sentences (`` fun `village alone wins`() ``). Comments
  and `@DisplayName` in French (see the skill). When a test pins a bug or a
  tracked feature, put its number in the name (e.g. `` `#1234 ...` ``).
- Assert through the **interface** (return values, sealed result types), not
  private fields. `assertTrue(result is VictoryResult.SingleWinner)`.

## Mock managers, build value objects by hand

Mock the GDK managers directly; never mock `GDKMain` / `JavaPlugin` (too heavy).
Plain interfaces with simple data are cheaper to *implement* than to mock:

```kotlin
val rolesManager = mock(GDKGameRolesManager::class.java)
val teamsManager = mock(GDKGameTeamsManager::class.java)

// GameContext is a small interface: implement it, don't mock it.
fun newContext(vararg players: Player) = object : GameContext {
    override fun activePlayers() = players.toSet()
    override fun eliminatedPlayers() = emptySet<Player>()
    override fun allPlayers() = players.toSet()
    override fun setMaximumGroupSize(size: Int) {}
}
```

## `Bukkit.*` statics: `mockStatic(...).use { }`

`Bukkit.getPlayer(uuid)` and friends need the inline mock-maker:

```kotlin
mockStatic(org.bukkit.Bukkit::class.java).use { bukkit ->
    bukkit.`when`<Player> { org.bukkit.Bukkit.getPlayer(uuid) }.thenReturn(winner)
    val result = resolver.evaluate(newContext(winner))
    assertTrue(result is VictoryResult.MultipleWinners)
}
```

`.use { }` closes the static mock; the `try { } finally { mb.close() }` form is
equivalent (both appear in `LGVictoryResolverTest`).

## Kotlin matcher gotcha (non-null params)

`ArgumentMatchers.any()` / `eq()` return `null`, which blows up Kotlin's non-null
parameters. Wrap them in helpers that return a real sentinel:

```kotlin
private fun <T : Any> eqNN(value: T): T { ArgumentMatchers.eq(value); return value }
private fun anyAliveFilter(): (UUID) -> Boolean {
    ArgumentMatchers.any<(UUID) -> Boolean>(); return { true }
}
`when`(teamsManager.isAlive(eqNN(VillageTeam), anyAliveFilter())).thenReturn(true)
```

## Determinism (the skill's hard rule)

- **Seeded `Random`** for any randomized logic (distribution shuffles). Inject the
  `Random`; never let the unit reach for a global one. A fixed seed makes the
  enumerated outcomes assertable.
- **Inject the clock, do not read it.** Time-driven logic takes its period / tick
  source as a constructor argument so a test feeds exact instants. The repo's
  `DayNightCycleManager(Duration.ofMinutes(5))` is the model: `phaseAt(seconds)`,
  `transitionsIn(from, to)`, `worldTimeAt(seconds)` are **pure** and tested
  against exact boundaries with no `System.currentTimeMillis()` anywhere.

```kotlin
private val cycle = DayNightCycleManager(Duration.ofMinutes(5))
@Test fun `alternates day and night every phase from t=0`() {
    assertEquals(DayPhase.DAY to 1, cycle.phaseAt(0))
    assertEquals(DayPhase.NIGHT to 1, cycle.phaseAt(5 * 60))   // boundary
    assertEquals(DayPhase.DAY to 2, cycle.phaseAt(10 * 60))
}
```

## Mockability gotchas

- **Wrap any static field that touches `Bukkit.*` at init in `by lazy`**
  (e.g. `Bukkit.getItemFactory()`), otherwise the inline mock-maker cannot load
  the class.
- **`Player` health getters are not reliably mockable** in this stack. Do not
  assert on a mocked `player.health`; instead verify the *manager call* the code
  makes, with real values, or move the check to E2E.
- **Build the player mock fully before `thenReturn`** (construct the stub, then
  wire its stubbings), to avoid Mockito's "unfinished stubbing" on nested mocks.
- Need `player.spigot()`? Mock the shim too:
  `` `when`(player.spigot()).thenReturn(mock(Player.Spigot::class.java)) ``.

## Stay exhaustive

- **One test per branch of the `grill-me` tree.** Enumerate every camp, every
  charge state, every edge (0 players, fewer players than roles, limit reached vs
  limit+1). No "representative" sample.
- **Factor the shape, not the coverage.** A per-case helper keeps each branch its
  own named test while sharing setup, e.g. `LGVictoryResolver`'s
  `` `barbare solo alone wins`() = assertSoloCampAloneWins(BarbareSoloTeam) ``:
  one `@Test` per camp, one assertion path.
- Pure splitters are the easiest exhaustiveness win: `planManualTeams(...)` and
  `planDiamondMine(baseDiamonds, multiplier, alreadyCollected, limit)` take inputs
  and return a result, so every interesting input combination is a one-line test.

## What belongs here

| Concern | Why it is unit-testable |
| --- | --- |
| Role distribution | pure function over (players, config), seeded `Random` |
| Win-condition evaluator | `evaluate(GameContext) -> VictoryResult` over mocked managers |
| Cooldown / charges | in-memory counters and timestamps (injected clock) |
| State-machine math | pure phase / transition / world-time functions |
| Config parsing | `config.yml` text to typed model + validation (reject bad input) |

The real in-game *trigger* of any of these (victory actually fires, a charge
actually refuses in play) is an E2E concern. Keep this layer pure.
