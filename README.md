# altaks-claude: shared Claude Code configuration

A portable `.claude` shared across projects. Personal dev skills load everywhere; an opt-in mod
routes subagents to cheaper models.

## Layout

```
.
├── skills/                     # always-on skills (auto-discovered, recursive)
│   ├── alta-dev/               #   full-lifecycle dev standard (+ references/)
│   └── grill-me/               #   plan stress-test
├── plugins/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/             #   the 872 skills (loaded only when the plugin is enabled)
│   │   ├── ORIGIN.md           #   attribution + pinned upstream commit
│   │   └── UPDATING.md         #   how to refresh the vendored copy
│   ├── model-gatekeeper/       # mod: routes each subagent to haiku / sonnet / opus, opt-in
├── .claude-plugin/
│   └── marketplace.json        # exposes the mod (marketplace name: altaks-claude)
├── hooks/
│   └── consolidate.sh          # Stop hook: alta-dev Phase 6 reinforcement loop
├── output-styles/
│   └── install.sh              # fetches the attention-span styles (AGPL, referenced not vendored)
├── CLAUDE.md                   # maintenance guide, loaded when working in this repo
├── settings.json               # project scope: Stop hook, plugins, Spartan, secret deny rules, no AI attribution
├── user-settings.json          # user-scope defaults to merge into ~/.claude/settings.json (see below)
├── statusline/                 # status line script (MIT, from daniel3303/ClaudeCodeStatusLine, modified)
├── README.md                   # this file
└── .gitignore
```

## Context cost

Only `skills/` is auto-loaded, and only each skill's name and description. Always-on cost is
**~700 tokens** (4 of the 5 skills listed). The
`model-gatekeeper` mod adds no context: it holds no skills, only hooks.

**Skills `alta-dev` already covers are removed; rarely needed ones are hidden** (`skillOverrides` in
`settings.json`). Claude Code gives the skill listing 1% of the context window and shortens descriptions
past it, so a duplicate costs triggering accuracy as well as tokens:

- `user-invocable-only`, still typable as `/name`: `handoff` and `arena`.

Change one in `/skills` or in `settings.json`; remove the entry to restore it.

## Using this repo elsewhere

Pick whichever fits how you consume config:

- **As your user config:** point `~/.claude` at this repo (or copy/symlink `skills/` into it).
- **As a project's config:** drop this repo in as the project's `.claude/`.

Either way, `skills/` auto-loads; the security library stays off until enabled.

### User-scope defaults (`user-settings.json`)

Some settings only take effect from `~/.claude/settings.json`: Claude Code ignores them in a project's
checked-in settings (auto mode as the default mode, the auto mode classifier rules) or they are machine
preferences (update channel, transcript retention, UI). `user-settings.json` versions them. Merge it into
your user settings on a new machine, or after changing it:

```bash
cp ~/.claude/settings.json ~/.claude/settings.json.bak
tmp=$(mktemp) && jq -s '.[0] * .[1]' ~/.claude/settings.json user-settings.json > "$tmp" \
  && mv "$tmp" ~/.claude/settings.json
```

The template points the status line at `~/.claude/statusline.sh`; link it to the versioned script so
edits land in the repo:

```bash
ln -sf "$PWD/statusline/statusline.sh" ~/.claude/statusline.sh
```

The merge keeps your machine-specific keys (hooks, local marketplaces). Arrays are replaced,
not appended: `permissions.deny` and the `autoMode` lists come out exactly as in the template. Install
`model-gatekeeper` separately (see the mod section below).

## Output styles

`settings.json` sets **Spartan** as the default output style, so any Claude Code session running this
`.claude` gets answer-first, arrow-marked, zero-filler replies. It changes how Claude *talks*, never how
it codes (`keep-coding-instructions: true`).

The styles come from [alexgreensh/attention-span](https://github.com/alexgreensh/attention-span) and are
**AGPL-3.0**, so this repo references them instead of vendoring them (see the no-AGPL rule in
`CLAUDE.md`). `.gitignore` blocks `output-styles/*.md`, which makes that structural rather than a promise.

**Fetch them once per machine**, otherwise the `outputStyle` setting points at a style that is not there:

```bash
./output-styles/install.sh                    # into this repo's output-styles/
./output-styles/install.sh ~/.claude/output-styles   # or into your user config
```

Three styles land: **Spartan** (blunt, maximum compression), **Attention-kind** (same structure, warmer),
**Rundown** (TL;DR briefings, checkboxes). Switch with `/config` -> *Output style*, or change
`outputStyle` in `settings.json`. Re-run the script to update; it overwrites in place.

## The opt-in mod (`model-gatekeeper`)

A Claude Code mod (a function-hook plugin: a TypeScript hooks module, no skills) for sessions that use
subagents. Its README has the details.

- **`model-gatekeeper`** picks a model tier for each subagent as it starts, so Opus is not the default
  for every job: `Explore` runs on haiku, `general-purpose` is classified by a small model into haiku,
  sonnet or opus, never above the parent's model. It changes only the model, at spawn time: rewriting
  the Agent call itself makes auto mode refuse it, so effort is left as the session sets it.
  `/gatekeeper` lists its decisions; `/gatekeeper off` stops it for the session. A report from a cheaper
  model asks the parent to check it; a failed agent is started again one tier up. A segment of the
  status line counts subagents per tier with the estimated savings. The agent list shows
  each subagent as a branch of the spawn tree, with the model it runs on beside its type.

```bash
# Install at user scope (adds the altaks-claude marketplace on the way if needed)
claude plugin install model-gatekeeper --marketplace /path/to/this/repo --scope user

# Turn it back off
claude plugin disable model-gatekeeper@altaks-claude
```

A mod installed from a folder marketplace is read from that folder: after editing it, `/reload-plugins`
picks up the change. Check one with `claude plugin validate plugins/<mod>` and `claude plugin test plugins/<mod>`.

## What `alta-dev` covers

The full-lifecycle standard (orient → agree → build → verify → deliver → review → consolidate), plus
cross-cutting dimensions. Depth lives in `skills/alta-dev/references/` (one doc per role and per
language); the highlights:

- **Correctness first.** Never fabricate a symbol; verify before use. A non-obvious source (web research,
  decompiled code, an obscure library method) is cited in a comment (link, path, or note), 5 lines max.
- **Simplicity ladder** before writing: need it at all → reuse → stdlib → native feature → installed
  dependency → one line → minimum. Over-engineering review tags: `delete/stdlib/native/yagni/shrink`.
- **Tests** structured `// Given / // When / // Then`, asserting the exact signal, proven by revert.
- **Frontend design + accessibility** (below): preview before code, no AI slop, WCAG 2.2 AA gate;
  in-game (Minecraft/Spigot) UI has its own design language.
- **Compliance & legal** (`roles/compliance-legal.md`): which laws, standards and licences apply (GDPR,
  AI Act, CRA, sector rules, accessibility law, OSS/IP), triaged in Phase 1 and gated in Phase 3.
- **Sustainability / eco-design** (`roles/sustainability.md`): RGESN + Green Software Foundation, an
  eco-budget set in Phase 1 and gated in Phase 3.
- **Response manner**: lead with the bottom line, never drop an essential to be brief, scannable blocks,
  deliverable purity, a blocking question last.
- **On finding a bug**: propose a GitHub issue (confirm, draft, create on your OK), never silently.
- The **reinforcement loop**, **review routing**, and **frontend design** below.

## Reinforcement loop (alta-dev Phase 6)

`alta-dev` ends with **Phase 6: consolidate**, a sweep that turns what a session taught into durable
docs so the next session does not relearn it. Learnings route to their single home: project
behaviour/rules to `CLAUDE.md`/`AGENTS.md`, facts/architecture/decisions to `README.md`/`docs/`/ADRs,
personal cross-project preferences to the memory system, a standard's rule to `references/`.

It runs when the work wraps up, on "fin de session", or when the **Stop hook** triggers it:

- `hooks/consolidate.sh` fires on `Stop`, **once per session**, and only after substantive
  file-modifying work (≥ `ALTA_PHASE6_MIN_EDITS`, default 5). It then blocks the stop once and asks
  Claude to run Phase 6. Pure Q&A sessions never trigger it. It fails open: any error allows the stop.
- Active only when this repo is the running `.claude` (project or user). After enabling, open `/hooks`
  once or restart so Claude Code reloads the config. Tune the threshold with the `ALTA_PHASE6_MIN_EDITS`
  env var; remove the `Stop` block from `settings.json` to disable.

## Review routing (Orca / GitHub)

`alta-dev`'s Review mode routes a finished review by the PR's state:

- **Ready for review → GitHub**, always (`gh pr review` / inline comments).
- **Draft + the Orca CLI available**, inside an Orca-managed worktree → a condensed
  summary on the Orca worktree card (`orca worktree set --comment ... --workspace-status in-review`),
  with the full findings in the session; nothing posted to GitHub while draft.
- **Draft without Orca → GitHub.**

Orca's CLI has no inline PR-review-comment command, so the draft path uses the worktree comment (a short
status line) for the headline; the detail stays in the session.

## Frontend design and accessibility

`alta-dev` treats UI as a first-class deliverable, not an afterthought:

- **Preview before code.** For anything visual, it shows the design first and gets sign-off: an
  **Artifact** (live HTML) for a screen or component, the **Claude Design** canvas (`design` skill) for
  a multi-screen flow or several directions, a text mockup for in-game Minecraft surfaces.
- **No AI slop.** It loads a design language before designing: the **`impeccable`** skill when enabled,
  otherwise the always-available **`frontend-design`** skill. Direction, distinctive typography and
  colour, a point of view, over the templated default.
- **Accessibility is a gate.** WCAG 2.2 AA, measured, is a blocking review category for user-facing web
  work (`skills/alta-dev/references/roles/ui-ux.md` + `frontend.md`). In-game UI has its own design
  language in `references/roles/minecraft-ui.md`.

**Impeccable** ([`pbakaus/impeccable`](https://github.com/pbakaus/impeccable), Apache-2.0) is registered
as an opt-in marketplace in `settings.json` (not enabled by default, so ~0 cost). Enable it for a
frontend project, then restart:

```bash
claude plugin enable impeccable@impeccable --scope project   # marketplace already registered
claude plugin disable impeccable@impeccable                  # turn it back off
```

## Enabled third-party plugins (unslop, arena, code-modernization)

All three are **referenced, not vendored**, and **enabled** (`enabledPlugins` in `settings.json`), so they
load in every project that mounts this `.claude`. The two GitHub marketplaces fetch only `.claude-plugin/`
and `skills/` (`sparsePaths`).

- **unslop** ([`heydamir/unslop`](https://github.com/heydamir/unslop), CC-BY-4.0): turns AI-looking UI
  into a designed interface. Plugin id `unslop@heydamir` (marketplace name is `heydamir`). Its
  live-site snapshot and story-video scripts need Node.js, Playwright (`npm install -D playwright`,
  `npx playwright install chromium`) and FFmpeg on `PATH`. Writes `unslop/` and `unslop-story/` in the
  current directory.
- **arena** ([`Jakeschincariol/arena-skill`](https://github.com/Jakeschincariol/arena-skill), MIT):
  `/arena <task>` runs N subagents on one task through an attack/defend/judge bracket. **Costly:** the
  default 100 agents is 595 subagent calls, `--quick` (16 agents) is 91. **Explicit `/arena` only:**
  `skillOverrides` sets it `user-invocable-only`, so Claude never sees it and cannot fire it on its
  own (upstream would trigger on "try again" / "bad answer"). Needs `python3`. Writes `.arena/` in the
  current directory.
- **code-modernization** (`claude-plugins-official`, Apache-2.0): `/modernize` for legacy codebases
  (assess, map, extract rules, plan, transform, verify). Ships hooks that send **whole-number usage
  counts** through Claude Code's telemetry; off with `CODE_MODERNIZATION_TELEMETRY=0` or
  `DISABLE_TELEMETRY=1`. Writes `analysis/` in the current directory.

Gitignore the output folders where they should not be committed.

```bash
claude plugin update unslop@heydamir                       # pull a newer upstream release
claude plugin disable arena-skill@arena-skill --scope project   # turn one off for one project
```
