# Maintaining altaks-claude

This file governs work **on this config repo itself** (editing its skills, plugins, hooks, docs). It is
not global dev guidance: that lives in the `alta-dev` skill. See `README.md` for the full layout.

## What this repo is

A portable `.claude` shared across projects: always-on personal skills in `skills/`, an opt-in
`cybersec` security plugin in `plugins/`, a marketplace in `.claude-plugin/`, the Phase 6 hook in
`hooks/`. `alta-dev` is the flagship standard: the full lifecycle plus cross-cutting dimensions
(correctness, the simplicity ladder, tests, frontend and accessibility, compliance-legal,
sustainability, response manner), with depth in its `references/roles/` and `references/languages/`.

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
- **Wire a cross-cutting `alta-dev` rule in every relevant place at once**: the loop phase (or a
  top-level section), a red flag, and the matching `references/roles/` doc. Keep them consistent, and
  keep the citing-file's reference accurate (do not point at a doc or symbol that does not exist).
- **Folding an external skill**: paraphrase its directives in your own words (ideas, not text). Vendor a
  whole third-party skill only as an **opt-in plugin** under `plugins/` (never into `skills/`), keep its
  LICENSE and attribution, and never vendor AGPL or unclear-license content into the repo.

## Commits

- Small, scoped, Conventional Commits. Commit and push only when the user asks.
