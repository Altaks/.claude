# cybersec skills — origin & attribution

Vendored from **26zl/cybersec-toolkit** (https://github.com/26zl/cybersec-toolkit),
MIT-licensed. This is an aggregated kit that itself curates skills from several upstream
projects (Claude-Red, Claude-BugHunter, and others) — see the `LICENSE-*` files and
`_THIRD_PARTY_NOTICES.md` in this directory for full attribution, and `CURATION.md` /
`curation.json` for provenance per skill.

## Vendored version (pinned)

| | |
|---|---|
| Upstream | https://github.com/26zl/cybersec-toolkit |
| Commit | `cf8dfbde3e30375179301b40216564708f12a902` (`cf8dfbd`) |
| Upstream date | 2026-09-14 |
| Vendored on | 2026-09-15 |

This library is packaged as an **opt-in Claude Code plugin** (`cybersec`), disabled by default to
keep context cost at zero until enabled per project. To refresh the vendored copy, follow
**`UPDATING.md`** in this directory (vendor + re-sync, no submodule).

## What was vendored
- The complete upstream `.claude/skills/` tree, placed under `plugins/cybersec/skills/`: `<skill>/SKILL.md` + `references/` + `scripts/` + per-skill `LICENSE`.
- Skills-root metadata: `SKILLS.md`, `CURATION.md`, `curation.json`, `requirements.txt`, all `LICENSE-*`.
- Repo-root attribution copied as `_LICENSE`, `_THIRD_PARTY_NOTICES.md`, `_CITATION.cff`.

## What was intentionally omitted
- The OS-specific installer machinery (`install.sh`, `Dockerfile`, `docker-compose.yml`,
  `mcp_server/`, `lib/`, `modules/`, repo-root `scripts/`, profiles, etc.).
- All OS junk (`.DS_Store`, `._*`, `Thumbs.db`).

Covers red team, blue team / DFIR, detection engineering, cloud, mobile, IoT/OT, and CTF.
Helper scripts under each `scripts/` may need `requirements.txt` deps installed to run;
the `SKILL.md` methodology itself is portable.

For **authorized** use only: red/blue team engagements, bug bounty, CTF, research, training.
