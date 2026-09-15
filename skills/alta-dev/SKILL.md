---
name: alta-dev
description: Use when implementing a feature, fixing a bug, refactoring, reviewing a PR or diff, preparing work to ship, or wrapping up a work session, in any language or project. Triggers on "/alta-dev", "/alta-implement", "/alta-review", "implement X", "fix Y", "review this PR / branch / diff", "check this against our standards", "consolidate what we learned / fin de session", or any request to build or audit something the way the user does it.
---

# alta-dev

Full-lifecycle development standard, from the first question to the merged PR. Supersedes
`alta-implement` and `alta-review`.

**Two deliverables, always: clean code and an architecture that holds.** When the work creates
something new, the shape comes first (`roles/architecture.md`), then the code that fills it.

**Stack-agnostic.** `references/roles/` is one document per specialisation, `references/languages/`
one per language. Nothing here is tied to a repository, framework or domain.

**Project rules win.** Read the project's `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md` / `docs/`
first. Where they conflict with this skill they are right; where they are silent this applies.

## Modes

| Situation | Mode | Départ |
|---|---|---|
| Feature, bugfix, issue to close | **Build** | Phase 0 below |
| New component, module, service, project | **Design** | Phase 0, then `roles/architecture.md` |
| A bug, a failing test, unexpected behaviour | **Debug** | `roles/debugging.md`, then Build for the fix |
| Changing something already shipped and consumed | **Evolve** | `roles/evolution.md`, then Build |
| A PR, branch or diff to audit | **Review** | `roles/code-review.md` |
| Structure only, no behaviour change | **Refactor** | Build loop, Phase 1 scoped to goals and boundaries |
| "Write the test suite for X" | **Test** | `roles/testing.md`, then Phase 3 |

A project-local skill for any of these wins over the generic path. Build always ends with a Review
pass on your own diff.

## Les cinq piliers

Every rule serves one of five properties. Reason from them when no principle covers the case.

| Pilier | Concrètement | Porté par |
|---|---|---|
| **Lisibilité** | Read it once, know what it does. Domain names, no bare literals, one thing per function at one level of abstraction, comments adding what code cannot. | P5, P6, `languages/*` |
| **Maintenabilité** | Changing one behaviour touches one place. One source of truth, one owner per concern, layering that holds, tests that catch the regression. | P2, P4, P7, P10 |
| **Extensibilité** | The next variant is a new file plus a registration, never an edit inside a conditional. Closed sets exhaustive so the compiler names every site. | P8 |
| **Simplicité** | KISS and YAGNI. Nothing built for a case that does not exist yet: no layer, seam, parameter or wrapper without a consumer today. | P2, P3 |
| **Performance** | Measured, never assumed. Cost paid at construction, not per event. Hot paths optimised with a profile; cold code stays readable. | P8, `roles/systems.md` |

### Arbitrage

| Conflit | Qui gagne |
|---|---|
| Performance vs lisibilité | Lisibilité, until a profile says otherwise. On a **measured** hot path performance wins, with a comment stating what the profile showed. |
| Extensibilité vs simplicité | Simplicité. An extension point with no consumer today is maintenance cost with a nice name. |
| DRY vs simplicité | Two sites that look alike but change for different reasons stay apart. Extract at the third real repetition. |
| Maintenabilité vs élégance locale | The codebase's conventions. Consistency is a feature. |
| Lisibilité vs simplicité | A helper wrapping one call is surface, not readability (P2). Fix the name at the call site instead. |
| Simplicité vs testabilité | Simplicité. Never a seam for a test (P3); test from the outside. |
| Extensibilité vs performance | Off a hot path, extensibilité. On a measured one, the profile decides and the exception is documented. |
| N'importe lequel vs correction | Correction. P9 and P10 outrank all five. |

## Le canon

Shared vocabulary. **Name one in a finding title** when it gives a model that outlives the PR; do not
force jargon when the concrete rule is clearer. Example: `[issue(blocking)] File.kt:L44 - DIP
violation: the concrete adapter is injected instead of the port`.

| Principe | Smell | Pilier | Règle |
|---|---|---|---|
| **KISS** | A clever scheme where one stdlib call exists; an abstraction "to make it general". | Simplicité | P3 |
| **DRY** | Same non-trivial logic at 3+ sites; same literal in two files. | Maintenabilité | P4, P5 |
| **YAGNI** | A parameter, hook, config field or extension point with no consumer in this change. | Simplicité | P3, P8 |
| **SRP** (S de SOLID) | One class or function doing several identifiable things. An "and" in its name. | Maintenabilité | P6, P7 |
| **OCP** | A conditional gaining a branch per variant instead of using the extension point. | Extensibilité | P8 |
| **LSP** | A subtype that throws, returns null where the parent never does, or weakens a precondition. | Maintenabilité | - |
| **ISP** | A fat interface whose implementers leave most methods no-op. | Simplicité | - |
| **DIP** | A global, a static singleton or a concrete adapter instead of the injected port. (A platform's own static API is not a DIP smell.) | Maintenabilité | P7 |
| **Composition over inheritance** | A new abstract layer where injecting a collaborator would do. | Extensibilité | P7 |
| **Deep modules** | Much public surface hiding little behaviour. | Simplicité | P2 |
| **Single source of truth** | A parallel list beside the registry; a value duplicated across schema, contract and code. | Maintenabilité | P7 |
| **Least visibility** | A public or module-internal symbol with no consumer outside its file. | Maintenabilité | P7 |
| **Fail loud at boundaries** | A silent return deep inside; defensive null-checks downstream of validated input. | Correction | P9 |
| **Pure functions where possible** | A helper reading or mutating shared state for no reason. | Testabilité | P3, P10 |
| **Rule of three** | Extracting at the second lookalike, or never at the fifth. | Simplicité | P4 |
| **Least astonishment** | A name, return type or side effect that surprises the caller. | Lisibilité | P6 |
| **CQS** | A command returning the updated entity. | Maintenabilité | `roles/backend.md` |
| **Least privilege, default deny** | Any permission, scope, role, origin or token wider than needed. **Whitelist, never blacklist**, every grant justified in writing. | Correction | P9, `roles/security.md` |

## Les dix principes

Evidence, smells and do-instead: `references/principles.md`. Cite by number in a finding.

| # | Principe | Le tell |
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

## Ne jamais fabriquer

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

## La boucle (ne pas réordonner, ne pas sauter)

`references/worked-example.md`: one complete run, plus the blank orientation, report, PR and ledger
templates.

### Phase 0: s'orienter avant de toucher

1. **Read the task at its source.** `gh issue view <N> --comments`, then every linked issue, PR and
   document. Read the exact section of the spec and quote it. **A disagreement between the
   documentation and the code is itself a finding, and often the bug.**
2. **Read the project's rules**: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/`. They win.
3. **Load your references**: the role and language documents matching what you will touch, and say
   which. Not loading them is how a rule gets missed.
4. **Take stock**: current branch, correct base, clean tree, existing stack, an open PR already
   covering this, prior review comments. `git status`, `git log --oneline -10`, `gh pr list`. Correct
   the base now, not after three commits.
5. **Preflight the verification path, before writing anything.** Can the full gate run here? The
   end-to-end suite (container runtime, fixtures, credentials, expiry, built artefact)? If what you
   need to *prove* the work is unavailable, say so immediately: an unverifiable change is not
   shippable, so a blocker is the first thing the user needs.
6. **Check it is not already done**: partially implemented, superseded, or closed by another PR.

**Sortie**: an orientation note. What the issue asks, the branch, the references loaded, any blocker.

### Phase 1: se mettre d'accord (aucun code d'implémentation)

1. **Grill first.** `grill-me`, one question at a time, recommending an answer for each, exploring the
   codebase rather than asking what you can find. Then `superpowers:brainstorming` to converge.
2. **Surface what the request hides**: silent side effects, toggleability, public-API impact, the
   message the user actually sees, the unhappy path.
3. **If a human sees any of it, the UX is part of the spec.** `roles/ui-ux.md`, decided now: what
   confirms the action, what the refusal says and why, the empty / loading / error states, the exact
   wording. A screen, a command output, a chat line and an error string are all user-facing.
   **Show visual UI before you build it** (see `## Design d'interface`): a preview the user signs off
   on, never straight to code.
4. **Design against the intended architecture, not around it.** If an architecture document or diagram
   exists, read the relevant region and ask whether this was already envisioned. If yes, build it under
   the planned name, shape and layering rather than a side structure. Evolving the core toward the plan
   is preferred over routing around it.
5. **Anything new** (module, service, component, project): design its shape before its code via
   `roles/architecture.md` and its checklist. What it owns in one sentence, its contract, what it may
   import, how it fails, how the next variant is added.
6. **Cannot reach the user** (you are a subagent): **STOP** and return the open questions as blocking
   questions. No unconfirmed assumption survives into Phase 2. (P1)

**Sortie**: a 3 to 6 line spec the user confirmed, the legal and normative regimes that apply
(`roles/compliance-legal.md`, or "none" stated), the eco-design targets for a digital service
(`roles/sustainability.md`), plus the boundary sketch when something is new.

### Phase 2: construire, test d'abord là où une unité existe

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
- **REQUIRED when a natural unit exists:** `superpowers:test-driven-development`. Sketch the case list
  first (empty, boundary, duplicate, not-found, expired, out-of-order, invalid-rejected-at-the-edge),
  then promote one at a time through red / green / refactor. Watch each fail *for the right reason*.
  Write each test body in three commented phases, **given / when / then** (`roles/testing.md`).
- **No natural unit?** Do not invent one (P3). It is still proven end to end in Phase 3.
- Write to the principles as you go. Fixing a P2 or P5 in review costs more than not writing it.

### Phase 3: vérifier pour de vrai

`superpowers:verification-before-completion`. Evidence before assertions.

1. **Run the project's whole gate**, not the module subset: root `./gradlew check`,
   `pnpm exec nx affected -t lint test`, `make precommit module=<name>`, `cargo clippy && cargo test`.
   Consumers and examples must still compile.
2. **Isolate a failure before claiming it**: `git stash`, re-run clean, compare.
3. **Every behaviour change ships a test that bites.** Exercise the exact path, assert the concrete
   observable signal. **Prove it**: revert the change, run it, confirm red, restore. If the signal is
   not observable, extend the harness; never weaken the assertion or retreat to "manual only". (P10)
4. **Manual-test the residue** the suite cannot reach, and name it.
5. **Review your own diff** against `roles/code-review.md`. Fix everything: blocking, suggestion,
   nitpick. Re-run the gate, re-review. One surviving nitpick means you are not done.
   Close with the **five-pillar check**: what did this make harder to read, to change, to extend? Did
   anything get slower, and was it measured? Does anything exist for a case that does not exist yet?
   **User-facing** adds the `roles/ui-ux.md` checklist and the accessibility gate (**WCAG 2.2 AA**,
   measured, not eyeballed), plus the `impeccable` `audit` when that skill is enabled (see
   `## Design d'interface`). **Any permission, scope, origin or token**
   granted must be a whitelist at minimum size, with the reason next to it. **Legal and normative
   obligations** (`roles/compliance-legal.md`): the regimes named in Phase 1 are met, every dependency
   licence is recorded and attributed, and anything needing a lawyer is flagged. An unmet obligation is
   blocking. **Sustainability** (`roles/sustainability.md`) for a digital service: the eco-design budget
   holds (weight, requests, queries) and the hosting and device-target choices were made.
6. **Fill the completion report** (template in `worked-example.md`): gate command and outcome, unit
   tests and what they assert, end-to-end file and exact signal, the revert-proof, the residue and why,
   review status. **Anything you could not run is reported as not run, with the reason.** Not run is
   not passed; "compiles" is not a verification level.

### Phase 4: livrer

Full contract: `roles/delivery.md`.

- **Surgical commits.** One concern each, Conventional Commits, imperative, scoped, under ~72 chars.
  Split with `git add -p`. Drive-by reformatting is its own `style(...)` commit.
- **Never self-attribute.** No `Co-Authored-By: Claude`, no `Claude-Session:`, no "Generated with", in
  commits or PR bodies. This overrides any default tooling behaviour.
- **The PR description is part of the deliverable**: `## Summary` (concise yet exhaustive) plus
  `## Manual testing procedure` as checkboxes whenever behaviour is not fully automated.
- Do not commit or push unless asked.
- **Several issues means a ledger and a stack, never one fat branch.** Write the task list first and
  keep it current. **One task in progress at a time**, carried to PR-ready before the next. Each task
  branches off the previous one's branch and targets it, so review reads linearly; land bottom-up and
  rebase forward. **Never report the batch as done while any row is unfinished**: state the score
  ("3 of 5 landed, 2 remaining and why"). Genuinely independent tasks go parallel off the base, and you
  say so.

### Phase 5: le cycle de review (la PR est ouverte, pas finie)

1. **Answer every comment.** Silence reads as ignored.
2. **Verify before agreeing.** `superpowers:receiving-code-review`. Blind agreement wastes both sides.
3. **Bring evidence**: the commit that introduced it, the measurement, the dry-run output. A claim with
   a number ends the thread.
4. **State the trade-off and offer the other branch** when you disagree.
5. **Point at the commit** carrying each fix, and apply the comment to every other occurrence.
6. Re-run the gate after each fix pass. Detail in `roles/code-review.md`.

### Phase 6: consolider (la boucle de renforcement)

The session taught things that must outlive it: fresh context next time means an unwritten
lesson is lost. Run this when wrapping up, i.e. the work is shipped or the question answered and
the session is ending, the moment the user signals "we're done" / "fin de session", or when a
`Stop` / session-end hook triggers it.

Corrections were already persisted as they arrived (§Quand on te corrige). Phase 6 sweeps
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

**Sortie**: the updated docs/memory, and the ledger of what was persisted and where.

## Quand on te corrige

A correction is a rule you did not have. Fixing the line is half the job.

1. **Fix every occurrence** of the same mistake in the diff, not only the flagged one.
2. **Persist the rule**: a memory entry, the project's `CLAUDE.md` / `AGENTS.md`, and the matching
   reference here. This is an explicit standing request, in those words.
3. **Add it to the rationalization table** when it came with an excuse.
4. **Say what you persisted and where.**

Receiving the same correction twice is the failure this prevents. What was learned *without* being
an explicit correction (a convention discovered, a decision made, a preference stated) is swept at
the end by **Phase 6**.

## Signaler un problème (proposer un ticket)

Any bug, inconsistency, or broken feature you notice gets surfaced as a GitHub issue proposal,
whether it is the task itself or something you stumbled on beside it. Spotting it and staying silent
is the failure this prevents.

**Fix it or file it, not both by accident:**
- The problem **is** the task: fix it. A tracking issue only if the project drives work through issues.
- **Incidental**, outside the current scope: do not fix it inline (that is scope creep). Propose a
  ticket and keep going.

When you find one:

1. **Confirm it is real** before saying a word: reproduce it, or point at the exact `file:line` with
   expected vs actual. A plausible guess is not a bug (Ne jamais fabriquer). If you cannot confirm,
   say so instead of filing speculation.
2. **Check for a duplicate**: `gh issue list --search "<keywords>" --state all`. If it already exists,
   link it instead of opening another.
3. **Draft the issue and show it first.** Reuse the repo's `.github/ISSUE_TEMPLATE` and its labels when
   present; otherwise a concrete title (`area: symptom`), then expected vs actual, the minimal repro or
   trigger, evidence (`file:line`, commit, log), impact, and a suggested direction if you have one.
   Bug-report shape: `roles/product.md`.
4. **Create only on the user's OK**: `gh issue create --title ... --body ... [--label ...]` in the
   current repo. Never open an issue silently, and never in a repo you were not asked to touch. Report
   the issue URL.

One concrete ticket beats a bug lost in the diff.

## Table des rationalisations

The ones that fire most often. **Full set, grouped by theme: `references/rationalizations.md`.** Read it
the moment a sentence starting with "close enough", "I'll just", "surely" or "later" forms, and
systematically before claiming anything is done.

| Excuse | Réalité |
|---|---|
| "I'll assume the sensible default and note it." | Assuming is guessing. Ask; if unreachable, stop and return the question. (P1) |
| "It is a tiny helper, it reads better." | "REMEMBER THAT I DON'T WANT THIS KIND OF SMALL HELPER FUNCTIONS SINCE THEY ONLY ALIAS ONE METHOD CALL." Delete it. (P2) |
| "The wrapper is a test seam, not production logic." | It is in production code, so it is production complexity. Mock the API. (P3) |
| "I wrote a fresh implementation, it came out cleaner." | Find the exemplar and copy its shape. Consistency beats local elegance. (P4) |
| "It is only used once, a literal is clearer." | Magic string again. Name it. (P5) |
| "That method surely exists, the name is obvious." | Read the declaration. A plausible signature is fabricated until verified. |
| "The E2E is green." | Green *because* of your change? Revert, watch it go red, restore. (P10) |
| "I could not run the gate, so I described what it would do." | Not run is not passed. Say it up front. |
| "3 of the 5 tasks are done, the run is complete." | It is not. State the score and what is left. |
| "Review only left nitpicks, close enough." | Nitpicks are in scope. Loop until clean. |
| "The session is over, I'll remember next time." | Next session is fresh context; it remembers nothing you did not write. Consolidate now. (Phase 6) |
| "That is a minor preference, not worth recording." | Every repeated correction began as a minor preference. Persist it where it belongs. (Phase 6) |
| "It is a minor glitch, not worth a ticket." | Real bugs get tracked. Draft the issue and let the user decide; do not choose silence for them. |
| "I will just fix this unrelated bug while I am here." | Incidental bug: file a ticket, do not widen the diff. Fix only what the task is. |

## Red flags: stop

- "I'll just assume", or "the conservative reading is".
- Starting to write before knowing whether the gate and the suite can run here.
- Working from the issue title without its comments, its links and the spec it cites.
- Using a symbol, flag or config key whose declaration you have not read.
- Code from decompilation, web research or an obscure library method with no source comment (link, path or explanation).
- Shipping without naming which laws, standards or dependency licences apply, or adding a copyleft dependency without weighing its obligations.
- Ignoring eco-design (weight, energy, device longevity) on a digital service, or busting the eco-budget without reporting it.
- Writing a new type without having read the nearest existing one.
- Writing implementation before a confirmed spec, or skipping `grill-me`.
- A new component whose responsibility needs an "and".
- A top-level split by mechanism (`controllers/`, `services/`, `repositories/`).
- Choosing the folder layout after the code is written.
- A new function whose body is one call.
- Writing new code, or adding a dependency, before climbing the ladder: stdlib, a native platform feature, or an already-installed dependency already does it.
- A parameter, interface or flag whose only consumer is a test.
- A literal encoding a slot, unit, key or duration.
- A `domain/` file importing infrastructure, or an event emitted outside the layer that owns it.
- A conditional growing by one branch per type.
- A `catch` without a logger, or a silent `return` on a user-triggered action.
- A user-facing string written as a literal.
- Coding a visual UI before showing a preview the user signed off on.
- Shipping the templated default look (centered hero, three equal cards, untouched component library) with no point of view.
- A colour pair shipped without a measured contrast ratio; meaning carried by colour alone; no visible focus state or keyboard path.
- Proposing a fix without being able to say why the bug happened.
- Retrying, skipping or loosening a failing test instead of hunting the race behind it.
- Changing a shipped surface in place instead of expanding then contracting.
- Promoting spike code into the implementation.
- Reporting a batch as done while any ledger row is unfinished.
- Receiving the same correction a second time.
- Finding a bug, inconsistency or broken feature and moving on without proposing a ticket.
- Fixing an incidental, out-of-scope bug inline instead of filing it.
- Ending a session without consolidating what it taught (Phase 6 skipped).
- Persisting a transcript or task log instead of the durable rules behind it.
- Writing a learning into a new file when an existing doc already owns the topic.
- Claiming done without having watched the test go red with the change reverted.
- A test body with no given / when / then comment structure, or with more than one action under test.
- An em dash (U+2014) anywhere: code, comments, docs, commits, PR bodies, chat replies.
- A commit or PR body attributing work to an AI.
- A reply that buries the answer, the key number or the warning under a filler opener or a wall of paragraph.
- Wrapping a requested deliverable (commit message, email, snippet) in prose instead of outputting only it.
- A blocking question placed anywhere but last, or not named on line one when the reply carries other content.

## Design d'interface (frontend et in-game)

Two failure modes to kill: shipping **AI slop** (the generic, templated look with no point of view),
and skipping the parts that make an interface **usable and accessible**.

### Preview before code (mandatory for anything visual)

Never go straight to code for a screen, component or in-game menu the user has not seen. Show it first,
get sign-off, then build. This is Phase 1, and it replaces prose speculation about "what it could look
like".

- A single web screen or component: an **Artifact** (live, clickable HTML). Load `artifact-design` for
  the design pass, `dataviz` when it charts data.
- A multi-screen flow, or several visual directions to choose from: the **Claude Design** canvas (the
  `design` skill), one artboard per screen or variant.
- In-game (Minecraft / Spigot): a text mockup of the exact rendered surface (chat block, scoreboard,
  chest-GUI slot grid, item lore) at the real client width, per `roles/minecraft-ui.md`.

### Not AI slop (have a point of view)

Load the design language **before** designing: **`impeccable` if that skill is available** (propose
enabling its plugin for real frontend work), otherwise the **`frontend-design`** skill. Both exist to
push past the safe, templated default.

- **Direction first**: the mode (persuade / operate / read / experience), the one adjective this surface
  should feel, the reference it is not. A UI with no POV defaults to slop.
- **Distinctive by intention**: a real type hierarchy and a chosen typeface, a deliberate colour system
  (not the framework's defaults), decided spacing and rhythm, one memorable detail.
- **The tells to avoid**: the centered hero over three equal cards, default component-library styling
  left untouched, evenly grey everything, emoji as iconography, gradient on everything, copy that says
  nothing. Consistency is not monotony: vary weight and scale to build hierarchy.

### Accessible and correct by default (not a later pass)

The floor is **WCAG 2.2 AA**, checked not eyeballed, and it is a **blocking** review category for
user-facing web work. Details and the checklist: `roles/ui-ux.md` and `roles/frontend.md`. Essentials:
semantic HTML (landmarks, headings, lists, buttons vs links), a full keyboard path with visible focus,
accessible names, contrast measured against AA, colour never the only signal, layout holding at 200%
zoom and the smallest viewport, respected reduced-motion, and designed empty / loading / error states.
When `impeccable` is enabled, run its `audit` (a11y / perf / responsive) and `critique`; otherwise apply
the `roles/ui-ux.md` checklist by hand. In-game surfaces follow `roles/minecraft-ui.md`.

## Répondre à l'utilisateur

You are answering a human with limited attention, not another model. The failure to fear is not "too
long" or "too short", it is the reader coming away without what mattered, by omission or by burying it.

- **Lead with the bottom line, in one sentence.** Someone who reads only the first line has the answer.
  Then say the least that *fully* answers, and stop. No filler opener ("Great question"), no closing
  restatement.
- **Never drop an essential to be brief.** Numbers, thresholds, scoped conditions ("only under X", not
  "all") and warnings ride with the point they qualify, and are the last thing cut, never the first. A
  reader who acts on a rounded-off version acts wrong. This is "report faithfully" applied to the chat.
- **Scannable blocks.** One idea per block, a blank line between; the bold lead-in plus any key number or
  warning must carry the whole answer on their own, for the reader who only skims. One unbroken wall of
  paragraph is a bug, even when the reply is short.
- **Deliverable purity.** Asked to produce a thing (a commit message, an email, a snippet, a file),
  output only that thing, nothing wrapped around it.
- **A blocking question goes last, and nothing follows it**; when the reply carries other content, line
  one names it so a glance catches it (P1, and the subagent-STOP rule of Phase 1). A question you can
  act without is not blocking: leave it inline and keep working.
- **An instruction gets one line, then you do the work.** "On it" wrapped in a structured report is noise.
- **Give it in full when full is the ask.** A completion report, a PR description, or a deep-dive the
  user asked for ("really explain", "walk me through it") is delivered whole, every number and caveat,
  broken into scannable blocks. Brevity governs the chat answer, never the report, the deliverable, or
  the work behind it.
- **Tone: direct and calm**, a sharp colleague who respects their time. Name uncertainty or risk plainly
  in one line, never buried. No em dash (house rule). Dial terser or warmer to fit the moment.

## Références

`references/principles.md` is always relevant. Everything else loads on demand: **normally one role
plus one language**. A change crossing disciplines reads several.

### Par spécialisation, `references/roles/`

- **architecture** : a component, module, service or project; a layer, boundary or extension point. Design checklist.
- **product** : turning a request into a spec, user stories, acceptance criteria, bug reports, vertical slicing, spikes. Phase 1 in full.
- **ui-ux** : **obligatoire** as soon as a human sees any of it, screen, form, command output, chat line, error string. Read in Phase 1, checklist before done.
- **backend** : services, use cases, APIs, error taxonomy, DTOs.
- **frontend** : web UI, atomic design, state, data access, contrast, tokens, performance budgets, design direction (anti-slop), accessibility (WCAG 2.2 AA), preview before code.
- **mobile** : Flutter, Android, iOS. Layout, state, platform reality, quality gate.
- **desktop-and-cli** : desktop apps, CLI, TUI, engines. Core/shell split, backends behind one trait, packaging.
- **networking** : anything crossing a wire. Contracts, interceptors, timeouts, retries, streams, shading.
- **data** : schema, migrations, repositories, fixtures, pipelines.
- **devops** : CI, containers, infrastructure as code, releases, environments, incidents, postmortems.
- **observability** : what to log and at which level, what never to log, metric cardinality, traces, alerting.
- **security** : authorization, input, secrets, dependencies, scanning, runtime posture. Whitelist over blacklist. Applies to every role.
- **privacy** : personal data. Minimisation, consent, retention, cascading deletion, user rights, third parties. Decided in Phase 1.
- **compliance-legal** : the laws, licences and standards the software must satisfy. Regime triage (GDPR, AI Act, CRA, sector, accessibility law) in Phase 1; OSS licence and IP obligations; the Phase 3 gate. You are not counsel: flag what needs a lawyer.
- **sustainability** : eco-design of a digital service. RGESN and Green Software Foundation, the eco-budget (weight, energy, device longevity) in Phase 1, the gate in Phase 3. Same ship-less lever as `frontend` performance budgets.
- **systems** : C, C++, Rust, manual resources, measured hot paths, concurrency primitives.
- **concurrency** : threads, queues, events, retries. Races, ordering, idempotency, outbox, back-pressure, flaky tests.
- **iot-and-embedded** : firmware, sensor nodes, acquisition chains, the hardware/application split.
- **gameplay** : game logic, plugins, tick loops, registries and events, player-facing output.
- **minecraft-ui** : in-game Spigot/Paper interfaces - chat, scoreboard, tab, chest-GUI menus, item lore, action/boss bar, titles. Read with `gameplay` and `ui-ux`.
- **time** : any instant, date, duration, schedule, expiry or cooldown.
- **i18n** : any user-facing string, and before shipping a second language.
- **dependencies** : adding, isolating, updating or removing a library. Licences and attribution.
- **debugging** : any bug or unexpected behaviour, before proposing a fix. Reproduction, evidence, bisection, git archaeology, root cause.
- **evolution** : changing anything with a consumer you do not control. Expand and contract, deprecation, flags, rollout, removal.
- **testing** : before the first test, and before claiming done.
- **code-review** : severities, finding format, output template, tone, fabricated code, answering feedback.
- **delivery** : commits, branches, PR stacking, the description contract, the ledger.
- **documentation** : comments, READMEs, architecture documents, ADRs, doc sites.

### Par langage, `references/languages/`

`kotlin`, `java`, `typescript`, `javascript`, `rust`, `python`, `php`, `c`, `cpp`, `dart`, `hcl`,
`sql`, `bash`, `yaml`, `nix`, `markdown`. Idioms, layout, tooling and gate for each.

**A language with no file** falls back to the ten principles plus its community idioms: same discipline
(types over primitives, exhaustive matching, typed errors, no swallowing, committed formatter and
linter as the gate). Add a file when it becomes a real part of the stack.
