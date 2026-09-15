# Review mode

Rigorous and impartial. Call out problems precisely, surface positives so the review is not a pile-on,
and always show the "do this instead" snippet. Never say "this could be cleaner" without showing what
cleaner is.

## Workflow

1. **Scope the diff.**
   - PR: `gh pr view <N> --repo <owner>/<repo>` then `gh pr diff <N> --repo <owner>/<repo>`.
   - Branch: `git diff <base>...HEAD`. Working tree: `git diff` / `git diff --staged`.
2. **Load the project's conventions**: `CLAUDE.md`, `AGENTS.md`, `docs/`. They win over this skill.
3. **Check prior reviews**: `gh pr view <N> --comments`, `gh api repos/<o>/<r>/pulls/<N>/comments`. Do
   not restate a finding already raised; build on it or skip it.
4. **Walk the diff** through the ten principles, then the role and language documents that match what
   it touches. A principle violation outweighs a style nitpick in the same hunk.
5. **Close with the five-pillar pass**, which catches what a rule-by-rule walk misses:
   - **Lisibilité**: could a stranger read this hunk once and know what it does?
   - **Maintenabilité**: if this behaviour changes next month, how many places must change?
   - **Extensibilité**: what does adding the next variant cost, a file or an edit inside a conditional?
   - **Simplicité**: is anything here built for a case that does not exist yet?
   - **Performance**: did anything move onto a per-event, per-request or per-tick path, and was the
     cost measured?
   Each "no" is a finding, and it is often the most valuable one in the review because no single rule
   names it.
6. **Tag every finding** with a severity, write it in the format below, and end with the summary and
   the verdict.
7. **Post the review to the right surface** (see `## Où poster la review`): GitHub for a ready PR, the
   Orca worktree card for a draft when the Orca CLI is present.

## Où poster la review

Route the finished review by the PR's state and the available tooling:

- **PR ready for review → GitHub, always.** Inline comments plus a summary via
  `gh pr review <N> --comment` / `gh api repos/<o>/<r>/pulls/<N>/comments`.
- **PR still a draft, the Orca CLI is available** (`command -v orca` succeeds) and the review runs in an
  Orca-managed worktree (`orca worktree current` succeeds): post a condensed
  summary to the Orca worktree card and move it to review:
  `orca worktree set --worktree active --comment "<counts + direction>" --workspace-status in-review --json`.
  The full findings go in the session output for the author; do not post to GitHub while the PR is a draft.
- **PR is a draft but Orca is not available → GitHub**, as above.

Read draft state with `gh pr view <N> --json isDraft -q .isDraft`. A local diff with no PR is neither:
deliver the review in the session. The worktree comment is one short status line (headline, not the full
review); verify flags with `orca worktree --help` before use.

## Severities

The label set used across these repos (Pullpo-style). Modifiers `(blocking)`, `(non-blocking)` and
`(if-minor)` attach to any of them and override the default weight.

| Label | Use for |
|---|---|
| `issue(blocking)` | Must not merge. Correctness, NPE risk, silent failure, missing permission check, leaked state, broken contract, security, a wrong comment, a domain layer importing infrastructure, a duplicated util, a passthrough wrapper, **fabricated code**, files that do not belong to the PR. |
| `issue` | A real defect or rule violation whose blast radius is contained. |
| `question(blocking)` | You cannot judge the change until the author answers. |
| `suggestion` | A better shape exists and you can show it. |
| `nitpick` | Style, naming, an idiomatic one-liner, a comment trim. |
| `todo` | A follow-up the author owes: a screenshot, a doc line, a `FIXME` marker. |
| `thought` | Context worth having, no action required. |
| `praise` | Good work. Say it. Do not invent problems to balance it out. |

End with a verdict: **APPROVE**, **REQUEST_CHANGES**, or **COMMENT**.

## Code fabriqué : bloquant

Its own category, because it is the failure mode of generated code and it looks plausible on a first
read. Check it explicitly on every diff:

- **An API that does not exist**, or exists with a different signature, a different parameter order, a
  different return type. Open the source or the documentation and compare; do not trust that it "looks
  right".
- **A wrapper that loses the typing** (a permissive map or record type where a real one exists), added
  to make something compile rather than to express anything.
- **An unnecessary abstraction around a one-liner**: a class, an interface or a helper wrapping a
  single call. That is P2, and generated code produces it constantly.
- **A confident comment describing behaviour the code does not have.**
- **A test that asserts nothing**, or that mocks the thing it claims to test.
- **A configuration key, a flag or an option that does not exist** in the tool being configured.
- **Invented constants and thresholds** presented as if they came from a specification.
- **A non-obvious source left uncited.** Code resting on an online reference, decompiled bytecode
  (Spigot, a JDK internal, any binary), or an obscure or undocumented library method must carry the
  source in a comment right above it (link, file / path and version, or a one-line note). Its absence is
  a blocking finding: the reader cannot trust or re-verify it. Five lines at most.

The rule for the author, and for you when you are the author: **verify the symbol before you use it.**
Read the actual declaration, run the actual command, check the actual key. Plausibility is not
evidence, and the reviewer's time is not the place to discover that.

## Finding format

````markdown
**[issue(blocking)]** `path/to/File.ext:L12-L18` - Passthrough wrapper around the scheduler

<one paragraph: what is wrong, why it matters here, which principle it breaks>

```<language>
// before
private fun runLater(task: Runnable) = scheduler.runLater(plugin, task, DELAY)

// after
scheduler.runLater(plugin, task, Constants.Time.secondsToTicks(1))
```
````

The "after" block must be complete and compile. No `...` placeholders.

## Output template

```markdown
### Code review - <branch / PR title>

<one line on the overall direction: "Solid refactor; 2 blocking issues around the revive path,
5 nitpicks on idioms, 1 todo on screenshots.">

**Blocking (N)**
1. **`path/File.ext:L12-L18`** - Title
   <what is wrong + why>
   ```<language>
   // before
   // after
   ```

**Issues (N)**
- ...

**Suggestions (N)**
- ...

**Nitpicks (N)**
- ...

**Todo (N)**
- ...

**Praise**
- <something specific that was done well>

**Verdict:** REQUEST_CHANGES
```

## When NOT to raise a finding

- The project's `CLAUDE.md` / `AGENTS.md` explicitly contradicts the rule. Defer to the project.
- The line was not modified in this diff. Pre-existing issues are out of scope unless the severity
  blocks merge regardless, in which case scope them as `todo`.
- A linter, type checker or CI step already covers it. Trust the pipeline, do not duplicate it.
- The fix would balloon the PR's scope. Note it as `todo`.

## Tone

- Specific and grounded in the diff. Quote the actual lines.
- Match the PR's language. If the diff, its description and the prior comments are in French, review in
  French; otherwise follow whatever the thread already uses.
- Educational, not punitive. With a junior contributor, explain the *why* and link the doc. Patient
  across cycles, and firm about a rule that has already been stated once.
- Surface positives. A review that is only blockers is harder to action.
- Ask the question when you do not know: "is this needed?", "why is there a length limit here?",
  "can't we make a proper decorator for this instead?" often lands better than an assertion.

## Answering review feedback (when you are the author)

The bar the user holds themselves to when replying, and expects back:

- **Verify before agreeing.** Check whether the reviewer is right. Blind agreement wastes both sides.
  `superpowers:receiving-code-review` covers this.
- **Trace the cause, do not just patch.** Name the commit that introduced it, explain why it stayed
  invisible, then say where it is fixed.
- **Bring evidence, not opinion.** Measurements, contrast ratios, dry-run output, the resolution rule
  that makes the alternative fail. A claim with a number attached ends the thread.
- **State the trade-off and offer the other branch.** "If you'd rather have a visible failure than a
  silent degradation, we can remove it, but then the deploy is coupled to the cache being available."
- **Point at the commit** that carries the fix.
- Answer every comment. Silence reads as ignored.
