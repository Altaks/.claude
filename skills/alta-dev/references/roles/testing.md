# Qualité et tests

The full form of P10. Read before writing the first test of a feature, and before claiming anything is
done.

## The doctrine

1. **A test that still passes when the change is reverted proves nothing.** Revert, run, watch it go
   red, restore. Every behaviour change ships a test that has passed this check, and the PR says which
   symbol was reverted.
2. **Assert the exact signal.** The specific message, the specific event *type*, the state the entity
   ends in, the notification that must no longer fire. "Did not throw" and "the handler was called" are
   not assertions.
3. **Exhaustive, not representative.** Every leaf of the grilled decision tree becomes a test. No "the
   other cases are similar".
4. **Duration is never a criterion.** A behaviour that is expensive to verify gets verified anyway.
5. **Never complicate production code to be testable** (P3). If honest testing needs a contortion,
   test it from the outside and extend the harness instead.

## Which layer proves what

| Kind of logic | Where it is proven |
|---|---|
| Pure domain logic: rules, computation, distribution, victory conditions, parsing, formatting | Unit tests, no mocks, cheapest and most numerous |
| Orchestration: a use case calling ports | Unit tests with the ports doubled |
| Adapters: a repository, a controller, a serializer | Integration tests against the real dependency |
| Behaviour a user can observe | End to end, driving the real system |

Pull the decidable part out of the framework so it becomes a pure function of its inputs, **but only
when that split is cleaner on its own merit**. If it is not, the end-to-end test carries it.

## Plan the cases before writing them

Sketch the whole surface as a list of pending cases first, then promote one at a time through red /
green / refactor. The list is the checklist and it is what stops you cutting corners under
implementation pressure.

Cases that are always on the list: empty input, boundary values just inside and just outside, the
duplicate, the not-found, the expired or revoked state, out-of-order or concurrent operations, and the
invalid input that must be rejected at the boundary.

For anything with a usage limit, the refusal is its own test: the second use inside the window, the
exact refusal message, and then the use that succeeds once the window reopens. A test that fires a
power once passes happily while the limit is broken.

## La structure d'un test : given / when / then

Every test body is written in three phases, each marked with a comment, in order. The markers are
**mandatory**, even when the language has a BDD DSL (use its `given/when/then` blocks when it has them,
the comments otherwise). They make the test read as a specification and make a missing phase obvious.

- `// Given` - the preconditions: the world, the inputs, the state the system starts in, with named
  values rather than bare literals. Detailed enough that the reader knows exactly what is set up.
- `// When` - the single action under test. One action; if you need a second, it is a second test.
- `// Then` - the assertions on the exact observable signal (doctrine rule 2): the specific message,
  event type, resulting state, or the notification that must not fire.

No `Given` means hidden setup; no `Then` means it asserts nothing.

```kotlin
@Test
fun `refuses a second claim inside the cooldown window`() {
    // Given a player who just claimed the daily reward
    val clock = MutableClock(start = INSTANT_NOON)
    val rewards = DailyRewards(clock, cooldown = 24.hours)
    rewards.claim(PLAYER_ID)

    // When they claim again one hour later
    clock.advance(1.hours)
    val result = rewards.claim(PLAYER_ID)

    // Then the claim is refused with the time remaining, and no reward is granted
    assertEquals(Refused(retryAfter = 23.hours), result)
    assertEquals(1, rewards.grantedCount(PLAYER_ID))
}
```

## What makes a test worthless

- **Mocking the thing under test.** Blocking.
- Mocking more than necessary: mock the outermost call, not the service that wraps it.
- Not refetching from the store, so persistence is never actually proven.
- Loose partial matching where an exact comparison is possible.
- Reusing an entity between tests and inheriting its side effects.
- A wrapping `describe` that groups every test in the file: pure indentation.
- Naming the error class in the label. Labels describe behaviour: "throws if the user is not admin".
- Asserting an error with try/catch instead of the expectation matcher, which silently passes when
  nothing throws.

## Determinism

- Seeded randomness, and the seed reported so a failure is reproducible.
- An injected clock or tick counter, never the wall clock.
- Explicit waits on a state or a message. Never a fixed sleep; the timeout is a safety net, not a wait.
- A deterministic way to force the system into the state under test (a debug command, a test mode, a
  fixture), so you are not depending on random assignment.

## End-to-end harnesses

- Drive the **shipped artefact**, not a debug build, when the two can differ (obfuscation, minification,
  tree shaking). A test that only passes on the debug build proves the debug build.
- Use the real verbs the system exposes. Do not stub the server, fake the state or weaken the assertion
  to "it did not crash".
- **When a signal is not observable, extend the harness**, do not downgrade the test. Harness code is
  test infrastructure and that is exactly where observability belongs (P3).
- One file per feature or per role: it doubles as the specification while building and as the
  regression net afterwards.
- Keep the harness lint-clean and type-checked like production code.

## A bug is a missing test

Write the reproducing test first and watch it fail. Fix. Watch it pass. Keep it, labelled with the
issue or PR number so a future failure points straight back at its context.

## Coverage

Coverage is a diagnostic, not a target. Generate the report and read it to find the paths nobody
exercises, especially the refusal paths. A high number over tests that assert nothing is worse than a
low number, because it buys false confidence.
