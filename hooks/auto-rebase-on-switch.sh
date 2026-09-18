#!/usr/bin/env bash
# Claude Code PostToolUse hook (matcher: Bash, if: git *).
# After a git command that CHANGES the current branch (checkout / switch),
# rebase that branch onto its configured upstream so a feature (or stacked) branch
# never sits on a stale base. Uses the branch's `@{upstream}`, falling back to
# origin/dev when none is set.
#
# Deliberately conservative. It NO-OPs unless every guard passes:
#   - we are inside a git work tree, with no rebase/merge already in progress
#   - the current branch actually changed since the previous git command
#     (a plain `git status` or `git checkout -- file` never triggers a rebase)
#   - the branch is a real feature branch, not dev / main / master
#   - the working tree is clean (no staged, unstaged, or untracked changes)
# On any rebase conflict it runs `git rebase --abort`, leaving the branch exactly
# as it was, and tells the user to rebase by hand. It never force-pushes.
#
# Output: a single JSON line with a "systemMessage" so the outcome shows in the UI.

set -euo pipefail

# The hook receives JSON on stdin; we inspect live git state instead, so drain it.
cat >/dev/null 2>&1 || true

msg() { printf '{"systemMessage": "%s", "suppressOutput": true}\n' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"; }

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

git_dir="$(git rev-parse --git-dir 2>/dev/null)" || exit 0

# Never act in the middle of an in-progress rebase or merge.
if [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ] || [ -f "$git_dir/MERGE_HEAD" ]; then
  exit 0
fi

state_file="$git_dir/.claude-last-branch"
current="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo "")"
previous="$(cat "$state_file" 2>/dev/null || echo "")"
printf '%s' "$current" > "$state_file"

# Detached HEAD, no branch change, or first sighting this session: just record and leave.
[ -n "$current" ] || exit 0
[ -n "$previous" ] || exit 0
[ "$current" != "$previous" ] || exit 0

# Never rebase the integration branches themselves.
case "$current" in
  dev | main | master) exit 0 ;;
esac

# Rebase target: the branch's configured upstream, so a stacked feature branch
# tracks its real base (the parent branch it was created from), not a hardcoded
# trunk. Falls back to origin/dev when no upstream is set, or when the branch only
# tracks its own remote copy (origin/<same-name>), which carries no base to rebase onto.
target="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
if [ -z "$target" ] || [ "$target" = "origin/$current" ]; then
  target="origin/dev"
fi
# Never rebase a branch onto itself.
[ "$target" != "$current" ] || exit 0
target_remote="${target%%/*}"
target_ref="${target#*/}"

# Only rebase a pristine tree: no staged/unstaged changes and no untracked files.
if ! git diff --quiet --ignore-submodules 2>/dev/null \
  || ! git diff --quiet --cached --ignore-submodules 2>/dev/null \
  || [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
  msg "[auto-rebase] '$current' a des changements non commités : rebase sur $target ignoré."
  exit 0
fi

if ! git fetch --quiet "$target_remote" "$target_ref" 2>/dev/null; then
  msg "[auto-rebase] 'git fetch $target_remote $target_ref' a échoué : rebase de '$current' ignoré."
  exit 0
fi

before="$(git rev-parse HEAD)"
if git rebase --quiet "$target" >/dev/null 2>&1; then
  after="$(git rev-parse HEAD)"
  if [ "$before" = "$after" ]; then
    msg "[auto-rebase] '$current' déjà à jour sur $target."
  else
    msg "[auto-rebase] '$current' rebasé sur $target (${before:0:8} -> ${after:0:8}). Pense à 'git push --force-with-lease'."
  fi
else
  git rebase --abort >/dev/null 2>&1 || true
  msg "[auto-rebase] Conflits en rebasant '$current' sur $target : rebase annulé, branche intacte. Rebase à la main."
fi
exit 0
