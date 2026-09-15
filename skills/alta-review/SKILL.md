---
name: alta-review
description: Use when reviewing a pull request, branch, or local diff in any codebase or language. Triggers on "/alta-review", "/alta-review <PR#>", "review this PR / branch / diff", "check this diff against our standards", or any pre-merge audit. Produces severity-tagged findings (blocking / nitpick / todo) with concrete "do this instead" snippets, and loads a stack-specific layer (e.g. Kotlin/Spigot) when the project calls for it.
---

# alta-review

Stack-agnostic PR-review companion. Goal: clean, maintainable, extensible, readable, explicit,
semantically correct code, in any language or framework. Rigorous and impartial: call out problems
precisely, surface positives so the review is not a pile-on, and always show the "do this instead"
snippet. For building (not just reviewing), `alta-dev` is the full lifecycle; this skill is the focused
pre-merge audit and shares its principles.

## When to use

- The user invokes `/alta-review`, `/alta-review <PR#>`, or a phrase like "review this PR / branch / diff"
  or "check this against our standards".
- A pre-merge audit of a diff in any repository and any language.
- The user pastes a snippet and asks what is wrong with it.

## Workflow

1. **Scope the diff.** PR number → `gh pr view <N> --repo <owner>/<repo>`, `gh pr diff <N> --repo <owner>/<repo>`. Branch → `git diff <base>...HEAD`. Local → `git diff` / `git diff --staged`.
2. **Load project conventions.** Read the repo's `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md` and the linter / formatter config if present. They encode a subset of these rules and add project-specific ones. **Project rules win when they conflict.**
3. **Load the stack layer.** Identify the language and framework from the diff.
   - Kotlin / Spigot / Minecraft: read `references/kotlin-spigot.md`.
   - Any other stack: apply the generic layers below plus the language's own idioms. When `alta-dev` is present, its `references/languages/<lang>.md` and `references/roles/*` cover those in depth; load the matching ones.
4. **Check prior reviews.** `gh pr view <N> --comments` and `gh api repos/<owner>/<repo>/pulls/<N>/comments`. Do not duplicate findings already raised; build on them or skip them.
5. **Walk the diff** through the catalogue, layer by layer. Note positives too; the review is corrective, not punitive.
6. **Tag each finding** with a severity:
   - **blocking** - must fix before merge. Correctness (NPE / crash / data loss), silent failure, broken contract, security, leaked or shared mutable state, a wrong comment, a missing user-facing signal on a user action, a magic value hiding a unit or key, an alias passthrough, a violated single-source-of-truth.
   - **nitpick** - non-blocking polish. Style, name tightening, an idiomatic one-liner, a comment trim.
   - **todo** - minor follow-up. A `FIXME`-style marker, a screenshot request, a doc gap, an out-of-scope fix.
7. **Write each finding in this format** (snippet language matches the code under review):
   ```
   **[blocking|nitpick|todo]** `path/to/File.ext:Lstart-Lend` - One-line title

   <one paragraph: what is wrong and why it matters here>

   // before
   <faithful excerpt of the current code>

   // after
   <the suggested rewrite, fully working - no "..." placeholders>
   ```
8. **Close with a short summary**: count per severity, 1-2 lines on the overall direction, and any positives worth flagging.
9. **Post to the right surface** (see `## Where the review is posted`): GitHub for a ready PR, the Orca worktree card for a draft when the Orca CLI is present.

## Where the review is posted

Route the finished review by the PR's state and the available tooling:

- **PR ready for review → GitHub, always.** Inline comments plus a summary via
  `gh pr review <N> --comment` / `gh api repos/<owner>/<repo>/pulls/<N>/comments`.
- **PR still a draft, and the Orca CLI is available** (`command -v orca` succeeds) and the review runs
  in an Orca-managed worktree (`orca worktree current` succeeds): post a **condensed
  summary** to the Orca worktree card and move it to review:
  `orca worktree set --worktree active --comment "<counts + direction, e.g. 2 blocking, 3 nitpicks: session state, idioms>" --workspace-status in-review --json`.
  The full findings (with snippets) go in the **session output** for the author; do not post them to
  GitHub while the PR is a draft.
- **PR is a draft but the Orca CLI is not available → GitHub**, as above.

Read draft state with `gh pr view <N> --json isDraft -q .isDraft`. A local-only diff with no PR is
neither: deliver the review in the session. The worktree comment is a single short status line, so it
carries the headline, not the full review; verify Orca's flags with `orca worktree --help` before use,
and fall back to GitHub if the worktree card is the wrong target for the project.

## Pattern catalogue

Applied top-down. Layer 0 is the "why", the engineering principles that frame everything below. Layers 1
and 2 are the concrete, language-agnostic checklist. Layer 3+ is the **stack layer** loaded in step 3
(e.g. `references/kotlin-spigot.md`). A layer-1 violation usually outweighs a stack-layer nitpick in the
same hunk; cite a layer-0 principle by name when it sharpens the finding.

### Layer 0 - Engineering principles (frame the catalogue)

When a finding maps cleanly to one of these, name it: it gives the contributor a mental model that
survives beyond this PR. Do not force a principle name when the concrete rule is clearer.

| # | Principle | Typical smell |
|---|---|---|
| 0.1 | **KISS** | A clever scheme where one stdlib call exists; an abstraction added "to make it general". |
| 0.2 | **SRP** | One class or function doing several identifiable things; an "and" in its name. |
| 0.3 | **OCP** | A conditional gaining a branch per variant instead of using the existing extension point. |
| 0.4 | **LSP** | A subtype that throws, returns null where the parent never does, or weakens a precondition. |
| 0.5 | **ISP** | A fat interface whose implementers leave most methods empty / no-op. |
| 0.6 | **DIP** | A global, a static singleton or a concrete adapter instead of an injected dependency. (A platform's own static API is not a DIP smell.) |
| 0.7 | **DRY** | The same non-trivial logic at 3+ sites; the same literal in two files. |
| 0.8 | **YAGNI** | A speculative parameter, hook, config field or extension point with no consumer in this PR. |
| 0.9 | **Composition over inheritance** | A new abstract layer where injecting a collaborator would do. |
| 0.10 | **Fail loud at boundaries** | A silent `return` or null-coalesce deep in internals; defensive checks downstream of validated input. |
| 0.11 | **Pure functions where possible** | A helper reading or mutating shared state for no reason. |
| 0.12 | **Least visibility** | A newly public / exported symbol with no consumer outside its file. |

**Rule of thumb when citing**: the principle name belongs in the one-line title or the "what is wrong"
paragraph, not as a separate section. Example: ``**[blocking]** `path/File.ext:Lxx` - DIP violation: the concrete adapter is injected instead of the port``.

### Layer 1 - Universal code quality

| # | Rule | Smell to flag | Do instead |
|---|---|---|---|
| 1.1 | **Names express intent, not implementation.** | `getServiceInfoSnapshot()`, `dataFromThing`, `MAGIC_INDEX`, a handler named for one caller when others exist. | Name by what is returned or done, in domain terms. |
| 1.2 | **No unsafe force-unwraps or unchecked nulls.** | A force-unwrap (`!!`, `x!`, `.unwrap()`, non-null `as`), an index without a bounds check, a map lookup assumed present. | Chain safely, early-return on absence, or validate at the boundary. Language specifics in the stack layer. |
| 1.3 | **Extract a named function for any identifiable sub-responsibility**, even single-use. | A block inside a handler that "decides" then "applies" inline. | A named predicate and a named action; the handler reads as steps, not loops. |
| 1.4 | **A named constant for every magic value.** Name by concept, not value. | `setItem(8, ...)`, `row * 9 + col`, a bare `"some.key"`, a raw duration. | A named constant or a small factory; hoist recurring literals to one owner. |
| 1.5 | **Comments add what the code cannot.** | A paraphrase of the signature; a wrong comment describing behaviour the code lacks. | Delete paraphrases, fix wrong ones, keep the non-obvious WHY (invariant, constraint, surprise). |
| 1.6 | **Idiomatic stdlib over manual loops.** | A hand-rolled accumulate/filter/map; chained `else if` where a match fits. | The language's collection operators, builders, and exhaustive match. |
| 1.7 | **Narrowest scope / visibility by default.** | A file-scope or exported symbol only its file uses; a `var` that could be `val`. | Start private / local / immutable; widen only with a real consumer. |
| 1.8 | **Names reflect role.** A stateful orchestrator is a `Manager`/service; a stateless helper is a `Util`/`Tools`. | An `XManager` that only computes and holds nothing. | Rename to match what it actually is. |
| 1.9 | **Pay cost once, not per event.** | An expensive read/compute inside a hot path (per tick, click, request, row). | Cache at construction and pass it down; do the work at the edge, not the loop. |
| 1.10 | **Every user-facing action confirms visibly.** Logs are secondary. | A silent `return` on a user command; no feedback after an action succeeds or fails. | A perceptible success and failure message in the domain's words (see `alta-dev` `roles/ui-ux.md`). |

### Layer 2 - Architecture and maintainability

| # | Rule | Smell to flag | Do instead |
|---|---|---|---|
| 2.1 | **Logic lives in the class that owns the concern**, not in the coordinator or `Main`. | The god-coordinator gaining a method that really belongs to a sub-component. | Move it to the owner; ask "which class owns this?" before adding to the coordinator. |
| 2.2 | **No alias / passthrough / single-call wrappers**, including "test seam" wrappers. | A body that is one delegating call (`fun foo() = bar.foo()`, `setX(v){ x = v }`, a resolver around one API call). | Expose the collaborator and call it directly; for tests, mock the real API, not a wrapper. |
| 2.3 | **Single source of truth.** No parallel list beside the registry; no injected copies of a shared entity. | A hand-kept list mirroring the registry; identity checks against a constructor-injected copy. | Inject the registry and look up by id; compare through its handle. |
| 2.4 | **Extend by adding a type or a listener, never by growing a conditional.** | A `when`/`if` chain gaining a branch per variant; a module calling each variant directly. | Use the extension point / event the codebase already has; the variant registers itself. |
| 2.5 | **Extract to a file or class only at 2+ real call sites.** | A one-file helper called from exactly one place. | Inline it where it is used. |
| 2.6 | **Fail loud at boundaries, trust internals downstream.** | Defensive null-checks scattered in private helpers past a validated edge. | Validate once at the public boundary; internals assert invariants and otherwise trust the input. |

### Layer 3+ - Stack layer (loaded)

The concrete idioms, framework rules and platform constraints of the code under review, loaded in step 3.
- Kotlin / Spigot / Minecraft: `references/kotlin-spigot.md` (unsafe-null specifics, framework builders, command surfaces, in-game UI constraints, mockability).
- Other stacks: the language's idioms plus, when `alta-dev` is present, its `references/languages/<lang>.md` and `references/roles/*` (and `roles/frontend.md` + `roles/ui-ux.md` for web UI, `roles/minecraft-ui.md` for in-game UI).

## Output template

```markdown
### Code review - <branch / PR title>

<one-line direction summary, e.g. "Solid refactor; 2 blocking issues around session state, 5 nitpicks on idioms, 1 todo on screenshots.">

**Blocking (N)**
1. **`path/File.ext:L12-L18`** - Title
   <what is wrong + why>
   ```
   // before
   ...
   // after
   ...
   ```
2. ...

**Nitpicks (N)**
- ...

**Todo (N)**
- ...

**Positives**
- <e.g. "The new `revive(...)` overload reads cleanly; no alias passthrough added.">

🤖 Generated with /alta-review
```

## When NOT to apply a finding

- The project's `CLAUDE.md` / config explicitly silences the rule.
- The line was not modified in this diff (pre-existing issues are out of scope unless the severity blocks merge regardless).
- A linter, type-checker or CI step already covers it. Trust the pipeline; do not duplicate.
- The fix would balloon the PR's scope. Note it as a `todo` instead.

## Tone

- Specific, grounded in the diff. No "this could be cleaner" without showing what cleaner is.
- **Match the PR's language.** Bilingual is fine; write findings in the language the contributor uses.
- Educational, not punitive. For a junior contributor, link the language's docs and explain the WHY; be patient across cycles.
- Surface positives. A review of only blockers is harder to action than positives plus blockers.
- Never attribute the suggestions to an AI in commit messages when the contributor applies them; that is a common project rule.

## Red flags - STOP and reconsider before posting

- A finding without a code excerpt → re-read the diff and quote the actual lines.
- A "do this instead" with `...` placeholders → finish the snippet; it must compile.
- More than ~10 findings on one small PR → you are piling on; group and summarize.
- Posting a draft PR's review to GitHub while the Orca CLI is available → it belongs on the Orca card.
- Posting to the Orca card a review of a PR that is ready for review → that always goes to GitHub.
- Flagging a pre-existing, unmodified issue as blocking → unless it is a true severity, scope it as `todo`.
- Citing a rule the project's `CLAUDE.md` contradicts → defer to the project.
- Applying Kotlin/Spigot (or any one stack's) idioms to a different language → load the right stack layer first.
