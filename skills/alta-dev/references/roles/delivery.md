# Git, commits and pull requests

## Commits

**Conventional Commits**, enforced by a pre-commit or commit-msg hook in every repo that matters.

- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `build`, `ci`, `style`, `revert`.
  Project-specific additions in use: `sync`, `dx`, `security`, `git`.
- Shape: `<type>(<scope>): <imperative summary>`. Scope is the affected project or module as the
  repository names it (`api`, `website`, `database`, `proto`, `e2e`, `ci`, `docs`, a plugin name, or
  the ticket id where the project uses one). Subject under ~72 chars, imperative mood (`add`, `wire`,
  `fix`, not `added`), lowercase after the colon.
- The body explains **why**, never what. The diff already says what.

**Surgical scope.** One commit does one thing and that thing matches its message. Stage specific files,
avoid `git add -A`. Split unrelated hunks with `git add -p`. No `wip:`, no `misc:`, no "various fixes".
Drive-by reformatting is its own `style(...)` commit, never bundled with logic. If a change touches
several scopes, it is several commits.

**Never self-attribute.** No `Co-Authored-By: Claude`, no `Claude-Session:`, no "Generated with Claude
Code", in commit messages or PR bodies. This is a standing project rule and it overrides any default
tooling behaviour. The commit message stops at its content: subject, body, and legitimate trailers
(`Refs:`, `Fixes:`).

**Do not commit or push unless asked.** Never `--no-verify`, never `--amend` or force-push on the
integration branch (`main`, `trunk`, `dev`).

## Branches

- Branch names follow the commit type: `feat/*`, `fix/*`, `refactor/*`, `chore/*`, `dx/*`. Where the
  repo works from a tracker, the ticket id is the branch name.
- The integration branch differs per project (`dev`, `main`, `trunk`). Check before branching.
- Versioning is automated and derived from the commit history or from a PR label. Do not hand-edit a
  version number.

## Pull requests

**One task means one PR. Several tasks mean a stack, never one fat branch.**

Implement task 1 on a branch off the base. Branch task 2 off task 1's branch and target task 2's PR at
task 1's branch, not at the base. Same for task 3 on task 2. Each PR carries a single concern and its
own description. The reviewer then reads the stack linearly instead of untangling N concerns in one
diff. Land bottom-up and rebase the rest forward as each parent merges. If the tasks are genuinely
independent (no shared code, any order), say so and open parallel PRs off the base instead of forcing
a stack.

**Check how PRs are opened in this repo.** Some repos have a bot that opens the PR when you push, and
running `gh pr create` there only errors. In that case push, wait for the bot, then `gh pr edit` the
title and body. When the bot's body carries a checklist template, fetch the current body first and fill
your section into it: never replace it wholesale.

**Rebase hygiene.** A file in the diff that has nothing to do with the PR is a failed rebase, and it is
a blocking finding. Check the file list before asking for review.

### Running a multi-issue batch

A run covering several issues keeps a **ledger**, written before the work starts and kept current:

```
| # | Issue | Branch (off)     | State       | PR   |
|---|-------|------------------|-------------|------|
| 1 | #412  | dev              | done        | #501 |
| 2 | #413  | task 1's branch  | in progress | -    |
| 3 | #414  | task 2's branch  | not started | -    |
```

- **One task in progress at a time**, carried to a PR-ready state before the next one starts. Half of
  three tasks is worse than one finished task, because nothing in it is reviewable.
- Each task inherits the previous one's branch, so the stack stays linear.
- **Never report the batch as done while any row is unfinished.** Close with the score and the reason:
  "1 of 3 landed; #413 is blocked on the answer to X; #414 not started." A run summarised as complete
  with two of five tasks actually delivered is the exact failure this rule exists to prevent.
- When a parent PR changes during review, rebase the children forward before touching anything else. A
  stack built on a stale parent produces a diff nobody can read.

### The description contract

Two required sections whenever the PR carries behaviour.

**`## Summary`, concise yet exhaustive.** Scannable, bullets over prose. No padding, no line-by-line
restatement of the diff, and nothing a reviewer needs left out. It covers:
- what behaviour changed, and the manager / role / use case / file that drives it;
- the issue it closes, and which PR it is stacked on;
- public-API or core impact, or an explicit "none";
- which architecture-plan elements it realises, and any deliberate deviation with its reason;
- the tests: the unit tests added, the end-to-end file and the exact signal it asserts, and the
  **proof that it bites** (which constant or handler was reverted, that the run went red, that it was
  restored);
- what is **not** covered automatically and why, named explicitly.

**`## Manual testing procedure`, GitHub checkboxes.** One `- [ ]` per step, ordered, prerequisites
first, one observable outcome per box, and a final non-regression check.

```markdown
## Summary
- <behaviour changed>, driven by <type> in <file>. Closes #NNN, stacked on #MMM.
- API impact: none. Realises <plan element>; deviates on <point> because <reason>.
- Tests: `<UnitTest>` covers <cases>; end-to-end `<file>` asserts <exact observable signal>.
  Proven biting: `<constant / handler>` reverted -> red, restored -> green. Full gate green.
- Not covered automatically: <residue>, because <reason>; covered by <unit test / manual step>.

## Manual testing procedure
- [ ] Prereq: <environment, running services, data or config state>.
- [ ] <action> -> <expected observable outcome>.
- [ ] Edge case: <input> -> <expected refusal message>.
- [ ] Non-regression: <existing behaviour> still works.
```

Add a `## Screenshots` section with before / after when the change touches a UI.

## Issues

When turning work into issues, use the repo's templates. The user-story template asks for
"As a <role>, I want <action>, so that <reason>", concrete examples, and acceptance criteria. The bug
template asks for reproduction steps, expected versus actual, environment, severity and frequency.

**Acceptance criteria describe verifiable behaviour, not implementation.** "Admin can approve an
AI-sourced profile, which submits it to the client", not "`approveAiSubmission()` sets admin review and
calls `completeDraft()`". Implementation details belong in the description or the sub-tasks. The
criteria answer "how do we know this is done?" from the outside.
