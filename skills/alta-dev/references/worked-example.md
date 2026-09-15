# Un run complet, de l'issue au PR

One pass through the loop, then the blank templates. Read it once to calibrate; work from the
templates afterwards.

The example is ordinary on purpose: an action missing the limits its own documentation specifies. It
exercises what usually gets skipped, namely the doc-versus-code conflict, the question that had to be
asked, the state that must survive a transfer, the test that bites, and the residue declared honestly.

---

## L'issue reçue

> **#412 The probe action has no usage limit**
> `probe.md` says the action is capped. It is not. A caller can probe every event in the session.

Two lines. Everything below came from Phase 0.

## Phase 0, note d'orientation

```
Issue #412, plus its 3 comments: the reporter also mentions the cost being charged on a refusal.
Linked: #398 (the state framework the other limited actions migrated to), PR #401 (its exemplar).
Spec read: probe.md:19 says "5x per session & 1x/5min". The code only checks the 30 second window
and the cost. So the documented rule was never implemented: a gap, not a regression.

Rules loaded: root CLAUDE.md. References: roles/backend.md, roles/testing.md, languages/kotlin.md.
Repository: on `main`, clean tree. The stack for this area sits on `fix/limits-drift`, so this
branches off that, not off `main`. No open PR covers #412.
Preflight: root gate runs. End-to-end suite runs, container runtime up, fixtures build. No blocker.
```

Caught before a single line was written: the wrong base branch, the exemplar to copy, and a second
question hidden in the issue's third comment.

## Phase 1, la spec confirmée

Two genuine ambiguities, asked rather than assumed (P1): does a **refused** probe consume a charge and
arm the cooldown, or only a successful one? Does the charge count reset per session, or follow the
caller across a transfer? Answers: only a probe returning data consumes and arms; the state follows the
caller and resets at the end of the session.

```
- probe is capped at 5 per session and 1 per 5 minutes, per caller (probe.md:19).
- Only a probe that returns data spends a charge and arms the cooldown. A refusal leaves the window
  open for a later, affordable probe.
- Two pieces of per-caller state: charges spent, instant of the last successful probe. Both follow the
  caller on transfer and reset at the end of the session.
- Existing cost unchanged. The action card states the new limits, in both languages.
- Public API impact: none.
```

## Phase 2, l'exemplaire puis les tests

**Exemplaire (P4).** Grepped the state framework from #398, listed the three actions already migrated,
read the most recent, copied its shape: same state holder keyed by caller, same registration, same
teardown hook. Nothing invented.

**Liste de cas d'abord**, promue une par une:

```
- a successful probe spends one charge and arms the cooldown
- a second probe within the cooldown is refused, on a different target   <- le piège: le refus
                                                                           "même cible" existant
                                                                           masquerait celui-ci
- the same probe five minutes later succeeds
- the sixth successful probe is refused for lack of charges
- a refused probe spends nothing and leaves the cooldown untouched
- the state follows the caller across a transfer
- the state is gone at the end of the session
```

Clock mocked, state object real. Every refusal asserts **its own message**, not just "refused".

## Phase 3, le rapport rempli

```
Gate:          root gate, green. Consumers compile.
Unit tests:    ProbeLimitsTest, 7 cases. Asserts the charge count and cooldown instant after each
               outcome, and the exact refusal reason for NO_CHARGES vs ON_COOLDOWN.
End to end:    e2e/probe-limits.test.ts. Two events probed back to back: the first returns data, the
               second is refused with the cooldown message on a distinct target, so the refusal cannot
               be the pre-existing same-target one.
Bites:         PROBE_COOLDOWN reverted, artefact rebuilt, suite red on the second assertion. Restored,
               green.
Residue:       the transfer case is unit-only. Reproducing a transfer end to end costs five minutes of
               setup to prove the same handoff the unit test already pins. Declared, not hidden.
Review:        self-reviewed, one finding fixed (a literal 5 hoisted into MAX_PROBES_PER_SESSION),
               gate re-run green, re-reviewed clean.
Not run:       nothing.
```

**Bites** is the line that matters. Without it the others are decoration.

## Phase 4, commits et PR

```
feat(probe): add per-caller charge and cooldown state
feat(probe): refuse a probe with no charges or an armed cooldown
test(probe): cover the limits, the refusals and the transfer
docs(probe): state the 5 per session and 5 minute limits on the action card
```

```markdown
## Summary

Closes **#412**. Branched on `fix/limits-drift`.

- **The action receives the two limits its documentation already specified.** `probe.md:19` caps it at
  5 per session and 1 per 5 minutes. The code only checked the 30 second window and the cost, so a
  caller could probe every event in the session.
- **Two pieces of per-caller state**, on the framework from #398 like the other migrated actions: the
  charges spent and the instant of the last successful probe. They follow the caller on transfer and
  reset at the end of the session.
- **Only a probe that returns data spends a charge and arms the cooldown.** A refusal leaves the window
  open. The outcome type gains `NO_CHARGES` and `ON_COOLDOWN`, each with its own message.
- The cost is unchanged. The action card now reads "5 per session, 1 per 5 min" in both languages.

**Public API impact:** none.

**Tests**
- Unit `ProbeLimitsTest`: a probe spends a charge and arms the cooldown; an immediate second probe on a
  different target is refused for the cooldown; five minutes later it passes; the sixth is refused for
  charges; a refusal spends nothing. Clock mocked, state object real.
- End to end `e2e/probe-limits.test.ts`: two events probed back to back, the second refused by the
  cooldown on a distinct target so it cannot be the pre-existing same-target refusal.
  **Proven biting**: `PROBE_COOLDOWN` reverted and the artefact rebuilt gives red, restored gives green.
- Root gate green.

**Not covered automatically:** the transfer case is unit-only. Reproducing a transfer end to end costs
five minutes of setup to re-prove the same handoff the unit test already pins.

## Manual testing procedure

- [ ] Prereq: a running session, a caller with the probe action, and a way to produce events.
- [ ] Probe an event within its window: data returned, cost charged.
- [ ] Probe a second event immediately: refused with the cooldown message, no cost charged.
- [ ] Wait 5 minutes (or warp the clock), probe a fresh event: accepted.
- [ ] Reach 5 successful probes, attempt a sixth: refused for lack of charges.
- [ ] Inspect the action card: it states "5 per session, 1 per 5 min".
- [ ] Non-regression: probing the same target twice still gives the original same-target refusal.
```

## Ce que l'exemple démontre

| Comportement | Où |
|---|---|
| The documentation is read and quoted, and its conflict with the code is the finding | Phase 0, first summary bullet |
| The base branch is corrected before any commit | Phase 0 |
| The verification path is proven runnable before writing | Phase 0 preflight |
| Ambiguity asked, never assumed (P1) | Phase 1 |
| The exemplar is found and copied (P4) | Phase 2 |
| Every refusal path has its own test with its own message (P10) | Phase 2 case list |
| The test is proven to bite (P10) | Report and summary |
| The residue is named with its reason | Report and summary |
| Commits surgical and conventional | Phase 4 |
| The manual procedure ends on a non-regression check | Phase 4 |

---

## Gabarits vierges

**Note d'orientation, fin de Phase 0**

```
Issue #<N>, plus its <k> comments: <what they add>.
Linked: <issues, PRs, docs>. Spec read: <file:line> says <quote>. The code does <what>.
Rules loaded: <project rule files>. References: <roles/...>, <languages/...>.
Repository: on <branch>, <clean|dirty>, base should be <branch> because <reason>. PR: <none|#N>.
Preflight: gate <runs|blocked by X>. End-to-end <runs|blocked by X>.
Blocker: <none | what is missing and what it prevents>.
```

**Rapport de complétion, fin de Phase 3**

```
Gate:          <command>, <green|red>. <consumers compile / affected projects pass>
Unit tests:    <file>, <n> cases. Asserts <the exact things>.
End to end:    <file>. Drives <path>, asserts <the exact signal>.
Bites:         <symbol> reverted -> red on <which assertion>. Restored -> green.
Residue:       <not covered automatically> because <reason>; covered by <unit test|manual step>.
Review:        self-reviewed, <n> findings fixed, gate re-run <green>, re-reviewed clean.
Not run:       <nothing | what could not run here, and why>.
```

**Description de PR**

```markdown
## Summary
- <behaviour changed>, driven by <type> in <file>. Closes #<N>, stacked on #<M>.
- Public API impact: <none | what>. Realises <plan element> / deviates on <point> because <reason>.
- Tests: <unit> covers <cases>; end to end <file> asserts <signal>. Proven biting: <symbol> reverted
  -> red, restored -> green. Gate green.
- Not covered automatically: <residue>, because <reason>; covered by <what>.

## Manual testing procedure
- [ ] Prereq: <environment, services, data state>.
- [ ] <action> -> <expected observable outcome>.
- [ ] Edge case: <input> -> <expected refusal>.
- [ ] Non-regression: <existing behaviour> still works.
```

**Registre, quand le run couvre plusieurs issues**

```
| # | Issue | Branch (off)     | State       | PR   |
|---|-------|------------------|-------------|------|
| 1 | #412  | fix/limits-drift | done        | #501 |
| 2 | #413  | task 1's branch  | in progress | -    |
| 3 | #414  | task 2's branch  | not started | -    |

Score: 1 of 3 landed. Reporting the run complete before the table is full is forbidden.
```
