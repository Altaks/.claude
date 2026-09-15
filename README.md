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
├── settings.json               # wires the Stop hook
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

## Updating the vendored security skills

See `plugins/cybersec/UPDATING.md` (vendor + re-sync, deliberately not a submodule).
