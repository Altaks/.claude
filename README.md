# altaks-claude: shared Claude Code configuration

A portable `.claude` shared across projects. Personal dev skills load everywhere; a large
security skill library is bundled but **opt-in** so it costs ~0 context until you turn it on.

## Layout

```
.
├── skills/                     # always-on skills (auto-discovered, recursive)
│   ├── alta-dev/               #   full-lifecycle dev standard (+ references/)
│   ├── alta-review/            #   Kotlin/Spigot PR review
│   ├── grill-me/               #   plan stress-test
│   └── cybersec-catalog/       #   tiny pointer to the opt-in security library (see below)
├── plugins/
│   └── cybersec/               # 872 offensive+defensive security skills, DISABLED by default
│       ├── .claude-plugin/plugin.json
│       ├── skills/             #   the 872 skills (loaded only when the plugin is enabled)
│       ├── ORIGIN.md           #   attribution + pinned upstream commit
│       └── UPDATING.md         #   how to refresh the vendored copy
├── .claude-plugin/
│   └── marketplace.json        # exposes the cybersec plugin (marketplace name: altaks-claude)
├── hooks/
│   └── phase6-consolidate.sh   # Stop hook: alta-dev Phase 6 reinforcement loop
├── output-styles/
│   └── install.sh              # fetches the attention-span styles (AGPL, referenced not vendored)
├── CLAUDE.md                   # maintenance guide, loaded when working in this repo
├── settings.json               # Stop hook; impeccable marketplace (opt-in); Spartan output style
├── README.md                   # this file
└── .gitignore
```

## Context cost

Only `skills/` is auto-loaded. Always-on cost is ~360 tokens (4 skills). Enabling the `cybersec`
plugin adds ~75k tokens **in that project only**; disabling returns it to ~0.

## Using this repo elsewhere

Pick whichever fits how you consume config:

- **As your user config:** point `~/.claude` at this repo (or copy/symlink `skills/` into it).
- **As a project's config:** drop this repo in as the project's `.claude/`.

Either way, `skills/` auto-loads; the security library stays off until enabled.

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

## The opt-in security library (`cybersec`)

872 red + blue / DFIR / detection-engineering / cloud / mobile / IoT-OT / CTF skills, MITRE-mapped.
Vendored from [26zl/cybersec-toolkit](https://github.com/26zl/cybersec-toolkit) (MIT); see
`plugins/cybersec/ORIGIN.md` for full attribution and the pinned commit.

Enable it only for **authorized** security work:

```bash
# One-time: register this repo as a marketplace
claude plugin marketplace add /path/to/this/repo

# Enable (project scope keeps it local to the current repo); then restart the session
claude plugin enable cybersec@altaks-claude --scope project

# Turn it back off any time
claude plugin disable cybersec@altaks-claude
```

Enabled-plugin skills load at session start, so they become available the **next** session.
The always-on `cybersec-catalog` skill reminds Claude the library exists and walks through enabling it.

## Security note

The `cybersec` skills were audited for host-targeting malicious content (backdoors, exfiltration,
prompt injection against the agent): none found; the content is offensive/defensive tradecraft
whose only risk is running it against systems you are not authorized to test. Use accordingly.

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

`alta-dev` ends with **Phase 6: consolider**, a sweep that turns what a session taught into durable
docs so the next session does not relearn it. Learnings route to their single home: project
behaviour/rules to `CLAUDE.md`/`AGENTS.md`, facts/architecture/decisions to `README.md`/`docs/`/ADRs,
personal cross-project preferences to the memory system, a standard's rule to `references/`.

It runs when the work wraps up, on "fin de session", or when the **Stop hook** triggers it:

- `hooks/phase6-consolidate.sh` fires on `Stop`, **once per session**, and only after substantive
  file-modifying work (≥ `ALTA_PHASE6_MIN_EDITS`, default 2). It then blocks the stop once and asks
  Claude to run Phase 6. Pure Q&A sessions never trigger it. It fails open: any error allows the stop.
- Active only when this repo is the running `.claude` (project or user). After enabling, open `/hooks`
  once or restart so Claude Code reloads the config. Tune the threshold with the `ALTA_PHASE6_MIN_EDITS`
  env var; remove the `Stop` block from `settings.json` to disable.

## Review routing (Orca / GitHub)

`alta-review` (and `alta-dev`'s Review mode) route a finished review by the PR's state:

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

## Updating the vendored security skills

See `plugins/cybersec/UPDATING.md` (vendor + re-sync, deliberately not a submodule).
