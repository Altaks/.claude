# Maintaining altaks-claude

This file governs work **on this config repo itself** (editing its skills, plugins, hooks, docs). It is
not global dev guidance: that lives in the `alta-dev` skill. See `README.md` for the full layout.

## What this repo is

A portable `.claude` shared across projects: always-on personal skills in `skills/`, an opt-in
`cybersec` security plugin in `plugins/`, a marketplace in `.claude-plugin/`, the Phase 6 hook in
`hooks/`.

## Conventions (enforced)

- **No em dash (U+2014) anywhere.** Use `-`, `:`, or restructure. Every file, commit message, and reply.
- **No AI self-attribution.** No `Co-Authored-By: Claude`, no "Generated with", in commits or PR bodies.
- **Keep always-on cost low.** Only `skills/*/SKILL.md` frontmatter loads every session; keep the name
  and description tight. A description says *when* to use a skill, never a workflow summary.
- **cybersec stays an opt-in plugin.** Never move its skills into `skills/` (that reintroduces ~75k
  tokens of always-on discovery). Refresh it only via `plugins/cybersec/UPDATING.md`, and keep the
  pinned upstream SHA in `plugins/cybersec/ORIGIN.md` current.
- **No OS-specific junk** (`.DS_Store`, `._*`, ...); `.gitignore` blocks it.

## Editing a skill

- Invoke `superpowers:writing-skills` before creating or changing a skill.
- Validate a plugin or marketplace manifest with `claude plugin validate <path>`.
- After any change: sweep for em dashes, and confirm no duplicate skill `name:` across the repo.

## Commits

- Small, scoped, Conventional Commits. Commit and push only when the user asks.
