#!/usr/bin/env bash
# Fetch the attention-span output styles from upstream.
#
# The styles are AGPL-3.0, so this repo references them instead of vendoring them
# (see the "no AGPL" rule in CLAUDE.md). Nothing downloaded here is committed:
# .gitignore blocks output-styles/*.md.
#
# Upstream: https://github.com/alexgreensh/attention-span (AGPL-3.0)
#
# Usage:
#   ./output-styles/install.sh            # install next to this script
#   ./output-styles/install.sh ~/.claude/output-styles
set -euo pipefail

REPO="alexgreensh/attention-span"
RAW="https://raw.githubusercontent.com/$REPO/main/output-styles"
STYLES=(attention-kind rundown spartan)

target="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
mkdir -p "$target"

for style in "${STYLES[@]}"; do
  curl -sfL -o "$target/$style.md" "$RAW/$style.md"
  printf '  %-16s %s\n' "$style" "$(sed -n 's/.*attention-span \(v[0-9.]*\).*/\1/p' "$target/$style.md")"
done

echo
echo "Installed ${#STYLES[@]} styles in $target"
echo "Activate one under /config -> Output style, or set \"outputStyle\" in settings.json."
echo "Licensed AGPL-3.0 by their authors; see https://github.com/$REPO/blob/main/LICENSE"
