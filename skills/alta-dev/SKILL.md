---
name: alta-dev
description: Use when implementing a feature, fixing a bug, refactoring, reviewing a PR or diff, preparing work to ship, or wrapping up a work session, in any language or project. Triggers on "/alta-dev", "/alta-implement", "/alta-review", "implement X", "fix Y", "review this PR / branch / diff", "check this against our standards", "consolidate what we learned / fin de session", or any request to build or audit something the way the user does it.
---

# alta-dev

Full-lifecycle development standard, from the first question to the merged PR.

**Two deliverables, always: clean code and an architecture that holds.** When the work creates
something new, the shape comes first (`roles/architecture.md`), then the code that fills it.

**Stack-agnostic.** `references/roles/` is one document per specialisation, `references/languages/`
one per language. Nothing here is tied to a repository, framework or domain.

**Project rules win.** Read the project's `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md` / `docs/`
first. Where they conflict with this skill they are right; where they are silent this applies.

## Modes

| Situation | Mode | Start |
|---|---|---|
| A change that passes all four fast-lane checks | **Fast lane** | `### Fast lane` below |
| Feature, bugfix, issue to close | **Build** | Phase 0 below |
| New component, module, service, project | **Design** | Phase 0, then `roles/architecture.md` |
| A bug, a failing test, unexpected behaviour | **Debug** | `roles/debugging.md`, then Build for the fix |
| Changing something already shipped and consumed | **Evolve** | `roles/evolution.md`, then Build |
| A PR, branch or diff to audit | **Review** | `roles/code-review.md` |
| Structure only, no behaviour change | **Refactor** | Build loop, Phase 1 scoped to goals and boundaries |
| "Write the test suite for X" | **Test** | `roles/testing.md`, then Phase 3 |

A project-local skill for any of these wins over the generic path. Build always ends with a Review
pass on your own diff.

## The five pillars

Every rule serves one of five properties. Reason from them when no principle covers the case.

| Pillar | In practice | Carried by |
|---|---|---|
| **Readability** | Read it once, know what it does. Domain names, no bare literals, one thing per function at one level of abstraction, comments adding what code cannot. | P5, P6, `languages/*` |
| **Maintainability** | Changing one behaviour touches one place. One source of truth, one owner per concern, layering that holds, tests that catch the regression. | P2, P4, P7, P10 |
| **Extensibility** | The next variant is a new file plus a registration, never an edit inside a conditional. Closed sets exhaustive so the compiler names every site. | P8 |
| **Simplicity** | KISS and YAGNI. Nothing built for a case that does not exist yet: no layer, seam, parameter or wrapper without a consumer today. | P2, P3 |
| **Performance** | Measured, never assumed. Cost paid at construction, not per event. Hot paths optimised with a profile; cold code stays readable. | P8, `roles/systems.md` |

### Arbitration

| Conflict | Winner |
|---|---|
| Performance vs readability | Readability, until a profile says otherwise. On a **measured** hot path performance wins, with a comment stating what the profile showed. |
| Extensibility vs simplicity | Simplicity. An extension point with no consumer today is maintenance cost with a nice name. |
| DRY vs simplicity | Two sites that look alike but change for different reasons stay apart. Extract at the third real repetition. |
| Maintainability vs local elegance | The codebase's conventions. Consistency is a feature. |
| Readability vs simplicity | A helper wrapping one call is surface, not readability (P2). Fix the name at the call site instead. |
| Simplicity vs testability | Simplicity. Never a seam for a test (P3); test from the outside. |
| Extensibility vs performance | Off a hot path, extensibility. On a measured one, the profile decides and the exception is documented. |
| Any of them vs correctness | Correctness. P9 and P10 outrank all five. |

## The ten principles

Cite by number in a finding. Evidence, smells, do-instead and the shared vocabulary (KISS, SOLID,
deep modules, ...): `references/principles.md`, opened at the principle you need.

| # | Principle | The tell |
|---|---|---|
| **P1** | **Never guess.** Any doubt about behaviour, edge case or intent is a question for the user, not a "reasonable default". | "I'll assume the sensible default and note it." |
| **P2** | **No wrapper, alias or passthrough.** A body that is one delegating call is deleted and the API called directly, everywhere. Test seams included: mock the real API. | `fun resolve(id) = Api.lookup(id)`, `manager.foo() = sub.foo()`, `setX(v) { x = v }`. |
| **P3** | **Never complicate production code to make it testable.** Extract only when the split is cleaner on its own merit; otherwise cover it end to end and extend the *harness*. | An interface, flag or parameter whose only consumer is a test. |
| **P4** | **Reuse before you write.** The constant, builder, util, mapper or injection pattern already exists. Find it. | A hand-rolled construction where a builder exists; a second date-to-timestamp mapper; a locally redeclared set. |
| **P5** | **No magic values, no primitive obsession.** Every literal becomes a named constant, every recurring primitive a type, constants hoist out of the instance. | `setItem(8, ...)`, a raw `"profile-stream-id"`, a bare `20L`, millis as `Long` on a public API, a regex rebuilt per instantiation. |
| **P6** | **Names carry domain meaning, and so does placement.** Intent over implementation, domain over mechanism, verbose over abbreviated. Folder and file name are part of the name. | `getServiceInfoSnapshot()`, `xxxFromProfile`, `rm` / `ev` / `t`, a subscriber in `listeners/`, a doc named `Leveling.md`. |
| **P7** | **Layering is a contract.** Domain never imports infrastructure; foreign shapes translated at the seam; logic in the class that owns the concern, not the coordinator; the registry is the single source of truth. | A persistence row in `application/`, a domain event emitted from the use case, a query bolted onto the coordinator, a parallel list. |
| **P8** | **Extend by adding a type or a listener, never by growing a conditional.** Cost paid where it belongs: cache at construction, never re-read per event, click or tick. | `if (x is A) else if (x is B)`, a function that "gets heavier over time", config read in a click handler, an N+1. |
| **P9** | **Fail loud, at the boundary and in CI. Deny by default.** Validate once at the edge then trust internals. Never swallow, never silently no-op, never let a missing check pass. Permissions whitelisted to the minimum, each grant justified. Every user action confirms visibly. | A silent `return`, `catch {}` with no logger, a missing permission check, a wildcard scope, a denylist where an allowlist belongs. |
| **P10** | **Nothing is done until it is proven.** A test that still passes with the change reverted proves nothing. Assert the exact signal, not a proxy. Duration is never a reason to skip a test. | "It compiles", "the E2E is green" without the revert check, `expect(handler).toHaveBeenCalled()` without checking which event. |

## Never fabricate

You are generating this code, so this is your most likely failure, and it is a **blocking** review
category.

**Verify the symbol before you use it**: the actual declaration, signature, parameter order, config
key, command flag. Plausibility is not evidence. When you cannot verify something, say so instead of
producing a plausible version of it.

The disguises: an API that does not exist or has a different signature; a wrapper that loses the
typing to make something compile; an abstraction around a one-liner; a confident comment describing
behaviour the code lacks; a test that asserts nothing; a config key the tool does not know; an
invented constant presented as a specification. Catalogue: `roles/code-review.md`.

**Cite a non-obvious source in a comment, always.** The flip side of verifying: when the code rests on
something the reader cannot see from the code itself - an online reference, decompiled bytecode (Spigot,
a JDK internal, any binary), or an obscure or undocumented library method - leave the source right above
it: the link, the file / path and version, or a one-line note of what you found. Five lines at most;
usually none is needed, but when the source is non-obvious it is **mandatory**. Detail in
`roles/documentation.md`.

## The loop (do not reorder, do not skip outside the fast lane)

`references/worked-example.md`: one complete run, plus the blank orientation, report, PR and ledger
templates.

### Fast lane

Take it only when **all four** hold on the actual diff, not on an estimate:

1. **30 lines or fewer** of production code changed (tests excluded).
2. **No new public symbol**: exported function, type, endpoint, command, config key or event.
3. **No user-facing change**: no string, screen, message or output a human reads.
4. **No dependency** added, removed or bumped.

Then, in order: Phase 0 steps 1, 2, 4 and 5; the fix, test first when a unit exists (Phase 2); Phase 3
steps 1 (whole gate), 3 (a test that bites, revert-proof included) and 6 (review your own diff), plus
step 5 when the diff removes or renames a symbol; a two-line report: the gate command and its outcome,
the revert-proof result. Skipped: grilling, the written spec, the templates, the completion report.

- **A check breaks mid-way** (the fix grows, needs a new symbol, touches a string): stop and resume
  the full loop at Phase 1.
- **The fast lane skips ceremony, never questions.** Unclear intent is still asked (P1).

### Phase 0: orient before touching anything

1. **Read the task at its source.** `gh issue view <N> --comments`, then every linked issue, PR and
   document. Read the exact section of the spec and quote it. **A disagreement between the
   documentation and the code is itself a finding, and often the bug.**
2. **Read the project's rules**: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/`. They win.
3. **Name your references**: the role and language documents this change needs (`## References`).
   Load each when its phase reaches it, not all up front, and say which you loaded. Skipping the one a
   phase names is how a rule gets missed.
4. **Take stock**: current branch, correct base, clean tree, existing stack, an open PR already
   covering this, prior review comments. `git status`, `git log --oneline -10`, `gh pr list`. Correct
   the base now, not after three commits.
5. **Preflight the verification path, before writing anything.** Can the full gate run here? The
   end-to-end suite (container runtime, fixtures, credentials, expiry, built artefact)? If what you
   need to *prove* the work is unavailable, say so immediately: an unverifiable change is not
   shippable, so a blocker is the first thing the user needs.
6. **Check it is not already done**: partially implemented, superseded, or closed by another PR.

**Context hygiene, in every phase.** Context is a budget; spend it on the task.
- A broad search (many files, unknown location) goes to an `Explore` subagent and comes back as a
  conclusion, not as file dumps.
- A large file: grep for the spot, then read that slice. Never re-read a file you just edited.

**Output**: an orientation note. What the issue asks, the branch, the references named, any blocker.

### Phase 1: agree first (no implementation code)

1. **Grill first.** `grill-me`, one question at a time, recommending an answer for each, exploring the
   codebase rather than asking what you can find. Then converge: lay out two or three approaches with
   their trade-offs and your recommendation, and get the user's pick.
2. **Surface what the request hides**: silent side effects, toggleability, public-API impact, the
   message the user actually sees, the unhappy path.
3. **If a human sees any of it, the UX is part of the spec.** `roles/ui-ux.md`, decided now: what
   confirms the action, what the refusal says and why, the empty / loading / error states, the exact
   wording. A screen, a command output, a chat line and an error string are all user-facing.
   **Visual UI gets a preview the user signs off on before any code**: an Artifact, a Claude Design
   canvas, or an in-game text mockup, with a design point of view (`roles/ui-ux.md`, `roles/frontend.md`).
4. **Design against the intended architecture, not around it.** If an architecture document or diagram
   exists, read the relevant region and ask whether this was already envisioned. If yes, build it under
   the planned name, shape and layering rather than a side structure. Evolving the core toward the plan
   is preferred over routing around it.
5. **Anything new** (module, service, component, project): design its shape before its code via
   `roles/architecture.md` and its checklist. What it owns in one sentence, its contract, what it may
   import, how it fails, how the next variant is added.
6. **Cannot reach the user** (you are a subagent): **STOP** and return the open questions as blocking
   questions. No unconfirmed assumption survives into Phase 2. (P1)

**Output**: a 3 to 6 line spec the user confirmed, the legal and normative regimes that apply
(`roles/compliance-legal.md`, or "none" stated), the eco-design targets for a digital service
(`roles/sustainability.md`), plus the boundary sketch when something is new.

### Phase 2: build, test first where a unit exists

- **Climb the ladder before writing (P3, P4), once you understand the change.** Stop at the first rung
  that holds: (1) does this need to exist at all? Speculative need, skip it and say so in one line
  (YAGNI); (2) already in this codebase? Reuse it (the exemplar step below); (3) does the standard
  library do it? (4) a native platform feature? (`<input type="date">` over a picker lib, a DB constraint
  over app code, CSS over JS); (5) an already-installed dependency? Never add a new one for what a few
  lines do (`roles/dependencies.md`); (6) can it be one line? (7) only then, the minimum code that works.
  The reflex shortens the solution, never the reading: trace the real flow first, then climb.
- **Find the exemplar first (P4).** Before a new type, adapter, panel, use case or migration: grep the
  concept, list the siblings, read the most recent, follow how it wires itself. Name it in the PR.
  "Check how I did it there and copy that pattern" is the standard correction; pre-empt it.
- **When a natural unit exists, test first** (`roles/testing.md`). Sketch the case list first (empty,
  boundary, duplicate, not-found, expired, out-of-order, invalid-rejected-at-the-edge), then promote
  one at a time through red / green / refactor. Watch each fail *for the right reason* before writing
  the code that passes it. Write each test body in three commented phases, **given / when / then**.
- **The project runs Gherkin** (`*.feature` files)? Every notion the PR touches gets its feature and
  every case of the decision tree its scenario (`roles/testing.md`, "Gherkin"). The manual procedure
  keeps only what no scenario can observe.
- **No natural unit?** Do not invent one (P3). It is still proven end to end in Phase 3.
- Write to the principles as you go. Fixing a P2 or P5 in review costs more than not writing it.

### Phase 3: verify for real

**Evidence before assertions.** A claim (passes, fixed, done) cites a command you ran in this session
and its output. No command, no claim.

1. **Run the project's whole gate**, not the module subset: root `./gradlew check`,
   `pnpm exec nx affected -t lint test`, `make precommit module=<name>`, `cargo clippy && cargo test`.
   Consumers and examples must still compile.
2. **Isolate a failure before claiming it**: `git stash`, re-run clean, compare.
3. **Every behaviour change ships a test that bites.** Exercise the exact path, assert the concrete
   observable signal. **Prove it**: revert the change, run it, confirm red, restore. If the signal is
   not observable, extend the harness; never weaken the assertion or retreat to "manual only". (P10)
4. **Manual-test the residue** the suite cannot reach, and name it. Every command the manual
   procedure will cite is read off its registration now (`@Command`, router, parser), so a missing one
   is added in this phase rather than discovered by the tester.
5. **Sweep for dead code with the language server** (the editor's LSP, not Liskov) after every build,
   refactor or fix: find-references and unused diagnostics, not grep, on every symbol, export,
   parameter, import, file and dependency touched or orphaned. Delete what nothing calls, in the same
   change. **Never delete what reflection calls** (a decorated handler, a generated-interface method,
   an injected provider, a serialized field), and no LSP installed means ask once and remember:
   `roles/code-review.md`, `delete:`.
6. **Review your own diff** against `roles/code-review.md`. Fix everything: blocking, suggestion,
   nitpick. Re-run the gate, re-review. One surviving nitpick means you are not done.
   Close with the **five-pillar check**: what did this make harder to read, to change, to extend? Did
   anything get slower, and was it measured? Does anything exist for a case that does not exist yet?
   Then the gates that apply, each blocking: **user-facing**, the `roles/ui-ux.md` checklist and
   **WCAG 2.2 AA** measured; **any permission, scope, origin or token**, a whitelist at minimum size
   with its reason; **legal** (`roles/compliance-legal.md`), the Phase 1 regimes met and every licence
   recorded; **sustainability** (`roles/sustainability.md`), the eco-budget holds.
7. **Fill the completion report** (template in `worked-example.md`): gate command and outcome, unit
   tests and what they assert, end-to-end file and exact signal, the revert-proof, the residue and why,
   review status. **Anything you could not run is reported as not run, with the reason.** Not run is
   not passed; "compiles" is not a verification level.

### Phase 4: deliver

Full contract: `roles/delivery.md`.

- **Surgical commits.** One concern each, Conventional Commits, imperative, scoped, under ~72 chars.
  Split with `git add -p`. Drive-by reformatting is its own `style(...)` commit.
- **Never self-attribute.** No `Co-Authored-By: Claude`, no `Claude-Session:`, no "Generated with", in
  commits or PR bodies. This overrides any default tooling behaviour.
- **The PR description is part of the deliverable**: `## Summary` plus, whenever behaviour is not fully
  automated, `## Manual testing procedure`, both per `roles/delivery.md`, "The description contract".
  **Every command the procedure cites is checked against its registration in the code** before the PR
  is published; a command the procedure needs and the code lacks is added, not alluded to.
- Do not commit or push unless asked.
- **Several issues means a ledger and a stack, never one fat branch.** Write the task list first and
  keep it current. **One task in progress at a time**, carried to PR-ready before the next. Each task
  branches off the previous one's branch and targets it, so review reads linearly; land bottom-up and
  rebase forward. **Never report the batch as done while any row is unfinished**: state the score
  ("3 of 5 landed, 2 remaining and why"). Genuinely independent tasks go parallel off the base, and you
  say so.

### Phase 5: the review cycle (the PR is open, not finished)

1. **Answer every comment.** Silence reads as ignored.
2. **Verify before agreeing.** `superpowers:receiving-code-review`. Blind agreement wastes both sides.
3. **Bring evidence**: the commit that introduced it, the measurement, the dry-run output. A claim with
   a number ends the thread.
4. **State the trade-off and offer the other branch** when you disagree.
5. **Point at the commit** carrying each fix, and apply the comment to every other occurrence.
6. Re-run the gate after each fix pass. Detail in `roles/code-review.md`.

### Phase 6: consolidate (the reinforcement loop)

The session taught things that must outlive it: fresh context next time means an unwritten
lesson is lost. Run this when wrapping up, i.e. the work is shipped or the question answered and
the session is ending, the moment the user signals "we're done" / "fin de session", or when a
`Stop` / session-end hook triggers it.

Corrections were already persisted as they arrived (`## When corrected`). Phase 6 sweeps
everything else the whole discussion produced.

1. **Harvest the durable, not the transcript.** Across the entire discussion, keep only what a
   future session would need and could not re-derive: rules and preferences the user stated,
   conventions found in the codebase, decisions and their rationale, gotchas, recurring habits.
   Drop one-off task state and anything already written or obvious from the code and git history.
2. **Route each item to its single home (P7, single source of truth).**
   - Project behaviour, rules, habits, conventions → the project's `CLAUDE.md` / `AGENTS.md`.
   - Project facts, setup, architecture, a decision worth its reasoning → `README.md`, `docs/`, an ADR.
   - Your own cross-project working preference → the memory system.
   - A rule belonging to this standard → the matching `references/` document.
3. **Read the target before writing.** Update the entry that already covers it; never add a parallel
   note beside one that owns the topic (P4). Keep the file's own structure, style and wording.
   Factual, not speculative; relative dates made absolute; no invented rule; no em dash.
4. **Report the ledger**: one line per file touched (what, where), plus anything you were unsure
   whether to record, for the user to confirm. Do not commit or push these unless asked.

**Output**: the updated docs/memory, and the ledger of what was persisted and where.

## When corrected

A correction is a rule you did not have. Fixing the line is half the job.

1. **Fix every occurrence** of the same mistake in the diff, not only the flagged one.
2. **Persist the rule**: a memory entry, the project's `CLAUDE.md` / `AGENTS.md`, and the matching
   reference here. This is an explicit standing request, in those words.
3. **Add it to `references/rationalizations.md`** when it came with an excuse.
4. **Say what you persisted and where.**

Receiving the same correction twice is the failure this prevents. What was learned *without* being
an explicit correction (a convention discovered, a decision made, a preference stated) is swept at
the end by **Phase 6**.

## Report a problem (propose a ticket)

Any bug, inconsistency or broken feature you notice is surfaced as a GitHub issue proposal. The
problem that **is** the task gets fixed; an **incidental** one gets a ticket, never an inline fix.
Confirm it, check for a duplicate, draft and show it, create only on the user's OK:
`roles/product.md`, "Report a problem".

## Rationalizations

The four that fire most. **Full set, grouped by theme: `references/rationalizations.md`.** Read it the
moment a sentence starting with "close enough", "I'll just", "surely" or "later" forms, and before
claiming anything is done.

| Excuse | Reality |
|---|---|
| "I'll assume the sensible default and note it." | Assuming is guessing. Ask; if unreachable, stop and return the question. (P1) |
| "It is a tiny helper, it reads better." | "REMEMBER THAT I DON'T WANT THIS KIND OF SMALL HELPER FUNCTIONS SINCE THEY ONLY ALIAS ONE METHOD CALL." Delete it. (P2) |
| "That method surely exists, the name is obvious." | Read the declaration. A plausible signature is fabricated until verified. |
| "The E2E is green." | Green *because* of your change? Revert, watch it go red, restore. (P10) |

## Red flags: stop

Only rules already broken in practice (each backed by `references/rationalizations.md` or a house
rule); every other rule lives in its phase.

- "I'll just assume", or "the conservative reading is".
- Starting to write before knowing whether the gate and the suite can run here.
- Working from the issue title without its comments, its links and the spec it cites.
- Using a symbol, flag or config key whose declaration you have not read.
- Writing a new type without having read the nearest existing one.
- Writing implementation before a confirmed spec, or skipping `grill-me`.
- A top-level split by mechanism (`controllers/`, `services/`, `repositories/`).
- Choosing the folder layout after the code is written.
- A new function whose body is one call.
- Writing new code, or adding a dependency, before climbing the ladder.
- A parameter, interface or flag whose only consumer is a test.
- A literal encoding a slot, unit, key or duration.
- A `domain/` file importing infrastructure, or an event emitted outside the layer that owns it.
- A `catch` without a logger, or a silent `return` on a user-triggered action.
- A user-facing string written as a literal.
- Proposing a fix without being able to say why the bug happened.
- Retrying, skipping or loosening a failing test instead of hunting the race behind it.
- Changing a shipped surface in place instead of expanding then contracting.
- Promoting spike code into the implementation.
- Reporting a batch as done while any ledger row is unfinished.
- Receiving the same correction a second time.
- Finding a bug, inconsistency or broken feature and moving on without proposing a ticket.
- Fixing an incidental, out-of-scope bug inline instead of filing it.
- Ending a session without consolidating what it taught (Phase 6 skipped).
- Claiming done without having watched the test go red with the change reverted.
- An em dash (U+2014) anywhere: code, comments, docs, commits, PR bodies, chat replies.
- A commit or PR body attributing work to an AI.

## Answering the user

A human with limited attention reads this. The failure is omission or burial, not length.

- **Bottom line first**, in one sentence; then the least that fully answers. No filler opener, no
  closing recap.
- **Never cut an essential to be brief**: numbers, thresholds, scoped conditions ("only under X") and
  warnings ride with the point they qualify.
- **Scannable blocks**: one idea each, bold lead-ins that carry the answer on their own. One unbroken
  wall of paragraph is a bug.
- **Deliverable purity**: asked for a thing (commit message, email, snippet, file), output only it.
- **A blocking question goes last**, named on line one when other content precedes it. An instruction
  gets one line, then the work.
- **Full when full is the ask**: completion reports, PR descriptions and requested deep dives keep
  every number and caveat, in scannable blocks.
- Direct and calm; risk named plainly in one line; no em dash.

## References

Load on demand, **normally one role plus one language**; `+` names the documents to read with it.
Every document a task needs is listed here: open it from this index and read it in full (long ones
start with a Contents list), even when another reference mentions it.

### By role, `references/roles/`

- **architecture**: a component, module, service or project; a layer, boundary or extension point. Design checklist.
- **product**: turning a request into a spec, user stories, acceptance criteria, bug reports, vertical slicing, spikes, reporting a problem you found. Phase 1 in full.
- **ui-ux** (+ the surface's own document: frontend, mobile, desktop-and-cli, gameplay, minecraft-ui, backend): **mandatory** as soon as a human sees any of it, screen, form, command output, chat line, error string. Preview before code, design direction. Read in Phase 1, checklist before done.
- **backend** (+ architecture, data): services, use cases, APIs, error taxonomy, DTOs.
- **frontend** (after ui-ux; + architecture, mobile): web UI, atomic design, state, data access, contrast, tokens, performance budgets, design direction (anti-slop), accessibility (WCAG 2.2 AA), preview before code.
- **mobile**: Flutter, Android, iOS. Layout, state, platform reality, quality gate.
- **desktop-and-cli**: desktop apps, CLI, TUI, engines. Core/shell split, backends behind one trait, packaging.
- **networking** (+ security, backend): anything crossing a wire. Contracts, interceptors, timeouts, retries, streams, shading.
- **data** (+ backend, architecture): schema, migrations, repositories, fixtures, pipelines.
- **devops** (+ security, delivery): CI, containers, infrastructure as code, releases, environments, incidents, postmortems.
- **observability** (+ devops, privacy): what to log and at which level, what never to log, metric cardinality, traces, alerting.
- **security** (+ networking, devops): authorization, input, secrets, dependencies, scanning, runtime posture. Whitelist over blacklist. Applies to every role.
- **privacy** (+ data, security, observability): personal data. Minimisation, consent, retention, cascading deletion, user rights, third parties. Decided in Phase 1.
- **compliance-legal** (+ privacy, security, dependencies): the laws, licences and standards the software must satisfy. Regime triage (GDPR, AI Act, CRA, sector, accessibility law) in Phase 1; OSS licence and IP obligations; the Phase 3 gate. You are not counsel: flag what needs a lawyer.
- **sustainability**: eco-design of a digital service. RGESN and Green Software Foundation, the eco-budget (weight, energy, device longevity) in Phase 1, the gate in Phase 3. Same ship-less lever as `frontend` performance budgets.
- **systems** (+ architecture, iot-and-embedded): C, C++, Rust, manual resources, measured hot paths, concurrency primitives.
- **concurrency** (+ systems, networking, data): threads, queues, events, retries. Races, ordering, idempotency, outbox, back-pressure, flaky tests.
- **iot-and-embedded** (+ systems, networking): firmware, sensor nodes, acquisition chains, the hardware/application split.
- **gameplay** (+ systems, architecture): game logic, plugins, tick loops, registries and events, player-facing output.
- **minecraft-ui** (+ gameplay, ui-ux): in-game Spigot/Paper interfaces - chat, scoreboard, tab, chest-GUI menus, item lore, action/boss bar, titles.
- **time** (+ data, i18n): any instant, date, duration, schedule, expiry or cooldown.
- **i18n** (+ ui-ux): any user-facing string, and before shipping a second language.
- **dependencies** (+ security, architecture): adding, isolating, updating or removing a library. Licences and attribution.
- **debugging**: any bug or unexpected behaviour, before proposing a fix. Reproduction, evidence, bisection, git archaeology, root cause.
- **evolution**: changing anything with a consumer you do not control. Expand and contract, deprecation, flags, rollout, removal.
- **testing**: before the first test, and before claiming done.
- **code-review**: severities, finding format, output template, tone, fabricated code, answering feedback.
- **delivery**: commits, branches, PR stacking, the description contract, the ledger.
- **documentation**: comments, READMEs, architecture documents, ADRs, doc sites.

### By language, `references/languages/`

`kotlin`, `java`, `typescript`, `javascript`, `rust`, `python`, `php`, `c`, `cpp`, `dart`, `hcl`,
`sql`, `bash`, `yaml`, `nix`, `markdown`. Idioms, layout, tooling and gate for each.

**A language with no file** falls back to the ten principles plus its community idioms: same discipline
(types over primitives, exhaustive matching, typed errors, no swallowing, committed formatter and
linter as the gate). Add a file when it becomes a real part of the stack.
