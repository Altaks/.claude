# Updating the vendored `cybersec` skills

These skills are **vendored** (a trimmed copy of the upstream repo), not a git submodule.
That keeps this shared `.claude` OS-agnostic and free of upstream installer machinery, at the
cost of updates being a deliberate, reviewable step. This document is that step.

- **Upstream:** https://github.com/26zl/cybersec-toolkit (MIT)
- **What we vendor:** only the upstream `.claude/skills/` tree + its root metadata/licenses.
- **What we drop:** installer machinery (`install.sh`, `Dockerfile`, `mcp_server/`, `lib/`,
  `modules/`, repo-root `scripts/`, …) and all OS junk (`.DS_Store`, `._*`, `Thumbs.db`).
- **Currently pinned commit:** see the "Vendored version" table in `ORIGIN.md`.

## When to update

- You want new/updated skills from upstream.
- A security-content fix landed upstream.

Because this is security tradecraft, **review the diff before committing** — never bump blindly.

## Procedure

Run from the repository root (the shared `.claude` directory). Adjust `DEST` if your checkout
path differs.

```bash
# 1. Clone upstream fresh into a temp dir (shallow is enough)
TMP="$(mktemp -d)"
git clone --depth 1 https://github.com/26zl/cybersec-toolkit.git "$TMP/cybersec-toolkit"

# 2. Record the exact commit you are vendoring (paste this into ORIGIN.md afterwards)
git -C "$TMP/cybersec-toolkit" rev-parse HEAD
git -C "$TMP/cybersec-toolkit" show -s --format='%ci' HEAD

# 3. Re-sync the skills tree into skills/cybersec/
#    --delete makes the copy an exact mirror (removes skills deleted upstream).
#    The excludes drop OS junk; installer machinery never lives under .claude/skills anyway.
DEST="plugins/cybersec/skills"
rsync -a --delete \
  --exclude '.DS_Store' --exclude '._*' --exclude 'Thumbs.db' \
  "$TMP/cybersec-toolkit/.claude/skills/" "$DEST/"

# 3b. Upstream ships some non-skill metadata inside .claude/skills/ (SKILLS.md, CURATION.md,
#     curation.json, requirements.txt, LICENSE-*). We keep those at the PLUGIN ROOT, not in the
#     discovered skills tree. Move them up one level after the mirror.
for f in SKILLS.md CURATION.md curation.json requirements.txt LICENSE-Apache-2.0 \
         LICENSE-BugHunter-MIT LICENSE-CC-BY-SA-4.0 LICENSE-Claude-Red-MIT \
         LICENSE-Karpathy-MIT LICENSE-Transilience-MIT; do
  [ -f "$DEST/$f" ] && mv "$DEST/$f" "$(dirname "$DEST")/$f"
done

# 4. Refresh the copied root attribution files (prefixed with _ to avoid collisions)
for f in LICENSE THIRD_PARTY_NOTICES.md CITATION.cff; do
  [ -f "$TMP/cybersec-toolkit/$f" ] && cp "$TMP/cybersec-toolkit/$f" "$(dirname "$DEST")/_$f"
done

# 5. Clean up
rm -rf "$TMP"
```

> **Note on step 3:** `ORIGIN.md` and `UPDATING.md` live in the plugin **root**
> (`plugins/cybersec/`), one level above the mirrored `skills/` tree, so `--delete` never touches
> them. Everything under `plugins/cybersec/skills/` is treated as an exact mirror of upstream
> `.claude/skills/`; step 3b then lifts upstream's non-skill metadata out of that tree.

## After syncing

1. **Update the pin** in `ORIGIN.md`: set the new commit SHA, upstream date, and "Vendored on".
2. **Review the diff:**
   ```bash
   git add -A plugins/cybersec
   git status --short plugins/cybersec | awk '{print $1}' | sort | uniq -c   # A/M/D summary
   git diff --cached --stat plugins/cybersec | tail -1                        # totals
   ```
3. **Sanity checks** (should match expectations — ~872 skills, all names unique, no OS junk):
   ```bash
   find plugins/cybersec/skills -name SKILL.md | wc -l
   find skills -name SKILL.md -print0 | xargs -0 grep -h -m1 -E '^name:' \
     | sed -E 's/^name:[[:space:]]*//; s/^["'"'"']//; s/["'"'"']$//' \
     | sort | uniq -d      # prints any DUPLICATE skill names across the whole repo (want: empty)
   find skills -name '.DS_Store' -o -name '._*' -o -name 'Thumbs.db'   # want: empty
   ```
4. **Commit** with the new pinned SHA in the message, e.g.
   `chore(cybersec): resync vendored skills to upstream <short-sha>`.

## Why not a submodule?

A plain submodule pulls the **whole** upstream repo (installer, Dockerfile, `mcp_server/`, a
nested `.claude/` and `CLAUDE.md`), nests skills at `skills/cybersec/.claude/skills/…`, and forces
every consumer of this shared `.claude` to run `git submodule update --init`. Vendoring keeps the
tree portable and the update reviewable; the trade-off is running the steps above by hand.
