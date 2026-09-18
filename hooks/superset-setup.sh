#!/usr/bin/env bash
# Claude Code SessionStart hook.
# On a fresh worktree (e.g. one superset just created), trust the repo's mise
# config and install the pinned toolchain (java / pnpm / prek) so the session
# starts with its tools ready, without a manual `mise trust` / `mise install`.
#
# Deliberately safe: it NO-OPs (exit 0) whenever mise is absent, and never fails
# the session. `mise install` is a fast no-op once the tools are already present,
# so running it on every session start is cheap and idempotent.
#
# Output: a single JSON line with a "systemMessage" only when it actually
# installs something, so a warm worktree stays quiet.

set -uo pipefail

# The hook receives JSON on stdin; we do not use it, so drain it.
cat >/dev/null 2>&1 || true

msg() { printf '{"systemMessage": "%s", "suppressOutput": true}\n' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"; }

command -v mise >/dev/null 2>&1 || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
[ -f mise.toml ] || [ -f .mise.toml ] || exit 0

# Trust the config (mise refuses to use an untrusted config on a fresh worktree).
mise trust >/dev/null 2>&1 || true

# Only announce when install actually does work: compare the tool list before/after.
before="$(mise ls --installed 2>/dev/null || true)"
mise install >/dev/null 2>&1 || true
after="$(mise ls --installed 2>/dev/null || true)"

if [ "$before" != "$after" ]; then
  msg "[superset-setup] mise: toolchain trusted and installed."
fi
exit 0
