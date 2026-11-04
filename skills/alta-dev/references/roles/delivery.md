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

**Written for a human, not for a model.** A reviewer reads it between two other things, with a fraction
of your context; a wall of text is skimmed, and what it hides is missed. So:
- **No paragraph longer than two lines.** One fact per bullet, a bullet fits on one or two lines.
- **Group under bold sub-headings** (`**GDK**`, `**Roles**`, `**Also**`), a handful of bullets each.
- **Name, do not narrate.** A bullet names the behaviour and its entry point; the full rules live in the
  spec the summary links to, not in the summary. No numbers a reviewer does not need to judge the PR.
- **Changes after review get their own block**, one bullet per commit, its SHA first.
- Reread it as the reviewer would: if a bullet needs rereading to parse, split it.

**The description is as short as the reader's job allows.** The summary names what changed and links
the spec for the rules; the verification is two or three bullets; the procedure covers **only the
residue**, what no automated test can observe (what a player sees, hears or clicks), never a refusal or
a message a unit test already asserts. Twenty to thirty lines is the usual size; a description that
grows past fifty is restating the spec or the tests.

**`## Manual testing procedure`, written for someone who has never read the diff.** The tester runs it
at a keyboard, copying commands into a client while other windows are open. Every gap they hit (a
command to guess, a state nobody said how to reach, a cooldown to wait out) costs a round trip with
you, and a step they cannot reproduce is skipped or ticked on faith. The procedure is a deliverable
held to the same bar as the code.

**1. Plan the composition before writing a single step.** Read the steps you are about to write,
derive what they need, and state it once, up front:
- **The cast**: how many clients or accounts, and which role, permission or fixture each one holds.
  Use the fewest accounts that cover every step, and say when one account plays several parts in turn.
- **The starting state**: the exact commands that bring a fresh environment there (module selected,
  roles forced, game started, seed data loaded), in order, as one copyable block.
- **The layout** the steps depend on: distances, positions, groups, who stands near whom. "Three
  Freezer players within 30 blocks of each other" is a setup line, not something the tester discovers
  when a step fails.
- **The project's own scenario runner first.** When the project can set a scene up by itself (an
  in-game runner fed by `.feature` files, a seed command, fixtures loaded by a script), each scenario
  of the procedure starts from it, by its exact id, read off the runner rather than guessed (a slug is
  computed: `The Emblème makes a Majin` may become `the-embl-me-makes-a-majin`). Hand-built setup is
  only for what no scenario casts yet, and is flagged as such, with the scenario that should be added.
- **The accelerators**: the command that skips each cooldown, timer or wait the steps would otherwise
  sit through, and the command that reads the state each step checks (an inspector, a debug dump).
- **Scenarios, not one long list.** Group the steps under a `###` heading per feature or power, each
  starting from a state the setup or its own first step establishes. A step never relies on an
  unstated leftover from an earlier scenario; when it does rely on one, it says which.

**2. Every action is spelled out, never alluded to.** Each step names the exact command, request, URL
or click path with its arguments (`/db dev boosts <Bibidi> 5`, never "`/db dev`", "give him some
boosts" or "five deaths, or a dev command"). No "or any equivalent", no "(as X, or any information
power)": pick the one path the tester takes. A click path names the item, the slot or button label and
the mouse button. A wait names its duration and the command that skips it.

**3. What the tester replaces is in chevrons; everything else is typed as written.** A value to
substitute (a player, a role's carrier, an id, a coordinate) is always `<...>`, named after the cast:
`/db majin <Krilin>` means "the name of the account playing Krilin", where `/db majin Krilin` reads as
the literal word. A literal argument (a sub-command, a colour, an amount the step fixes) stays bare:
`/db dev boosts <Bibidi> 5`. Never mix the two in one token, and never leave a role or player name
bare inside a command.

**4. Every expected outcome is observable and quoted.** Say what the tester reads or sees, where (chat,
action bar, title, sidebar, a panel's tooltip, a log line, an HTTP status), and quote the message as
the client shows it in the language the tester plays, so a near-miss is not read as a pass. "It works"
or "the effect applies" is not an outcome; "`/dev effect show <Krilin>` lists `speed ×1,10`" is.

**5. Every cited command exists, as written.** Before publishing the procedure, list every command it
cites and check each against its registration in the code (the `@Command("...")` annotation, the
router, the CLI's parser, `plugin.yml`): the literal path, the argument order, the gates (dev only,
host only, which role holds it). Read the registration, never your memory of it. A command the
procedure needs and the code lacks is a gap in the change: add it (a dev or debug command is the usual
answer, in its own commit) or rewrite the step around a path that exists. Record the check in the
completion report (`Commands: 14/14 matched against their registrations`). A procedure citing a
command that does not exist is a blocking finding in self-review.

**6. Lean on GitHub-flavoured markdown for the reader, not for decoration.**
- `- [ ]` task lists for the steps only, one observable outcome per box, so progress is ticked in place.
- A table for the cast (role, what to know about it, where it stands), each client given a coloured
  square (🟥 🟦 🟩 🟨 🟪 🟧) repeated before every step or command that client runs or targets, so the
  tester's eye finds their own lines. A square, not `$\color{...}$`: colour cannot enter a code span,
  and LaTeX around a command breaks copying it.
- A fenced `text` block for each sequence of commands pasted in order (the setup, a scenario's
  preparation); inline code for a single command inside a step. Inside a list item, indent the fence
  so it stays in the item.
- `> [!NOTE]` for a prerequisite easy to miss (a client mod, an external service), `> [!WARNING]` for a
  step that is destructive or cannot be undone within the same run.
- `<details><summary>…</summary>` for long reference material (every field the inspector prints),
  never for a step: a folded step is a skipped step.
- Close with a `### Non-regression` scenario that re-runs, by its exact commands, the nearby behaviour
  the change could break.

~~~~markdown
## Summary
- <behaviour changed>, driven by <type> in <file>. Closes #NNN, stacked on #MMM.
- API impact: none. Realises <plan element>; deviates on <point> because <reason>.
- Tests: `<UnitTest>` covers <cases>; end-to-end `<file>` asserts <exact observable signal>.
  Proven biting: `<constant / handler>` reverted -> red, restored -> green. Full gate green.
- Not covered automatically: <residue>, because <reason>; covered by <unit test / manual step>.

## Manual testing procedure

> [!NOTE]
> Four clients. `<Bibidi>` below means the name of the account playing Bibidi, and so on.

| Role | Account | Stands |
|---|---|---|
| Bibidi | the host | anywhere |
| Freezer, Zarbon, Dodoria | three others | within 30 blocks of each other, 20 blocks from Bibidi |

Setup, from a fresh server:

```text
/dev activate_module DragonBallUHC
/dev game_start
/dev roles give <Bibidi> bibidi
```

Skip a cooldown with `/db dev recharge <Bibidi>`; read Bibidi's state with `/db dev show <Bibidi>`.

### Livre Magique on a red player
- [ ] `<Bibidi>` sees `<Freezer>` red with a ◆ in the tab list.
- [ ] `<Bibidi>` right-clicks the Livre aiming at `<Freezer>` -> `/dev effect show <Freezer>` lists
      Weakness, `/dev effect show <Bibidi>` lists `strength ×1,15`.
- [ ] Refusal: `/db dev boosts <Bibidi> 4`, then right-click the Boost item and pick red -> chat:
      "<quoted refusal message>".

### Non-regression
- [ ] `<Bibidi>` runs `/db potion` -> it still toggles the thrown potion, chat: "<quoted message>".
~~~~

A procedure that fails this check is not finished:
- [ ] Every account, role and position a step uses is in the cast or the setup.
- [ ] Every action is a literal command or click path with its arguments; no "or", no "any", no bare
      command root.
- [ ] Every substituted value is in chevrons, named after the cast; nothing a tester must replace is
      left bare.
- [ ] Every command was matched against its registration; a missing one was added or the step
      rewritten.
- [ ] Every wait has its skip command; every check has its read command.
- [ ] Every outcome quotes what the tester reads, and where.

Add a `## Screenshots` section with before / after when the change touches a UI.

## Issues

When turning work into issues, use the repo's templates. The user-story template asks for
"As a <role>, I want <action>, so that <reason>", concrete examples, and acceptance criteria. The bug
template asks for reproduction steps, expected versus actual, environment, severity and frequency.

**Acceptance criteria describe verifiable behaviour, not implementation.** "Admin can approve an
AI-sourced profile, which submits it to the client", not "`approveAiSubmission()` sets admin review and
calls `completeDraft()`". Implementation details belong in the description or the sub-tasks. The
criteria answer "how do we know this is done?" from the outside.
