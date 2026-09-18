#!/usr/bin/env bash
# File one AUDIT-DX.md finding as a GitHub issue, put it on the Project v2 board
# and set its Status / Priority / Size. Field ids are resolved from the API at
# run time: never hardcode them, they drift.
#
#   scripts/file-finding.sh --check
#   scripts/file-finding.sh --title "..." --body-file f.md \
#       --labels "gdk,refactor" --priority "❗・Must be done" --size "👍・Normal"
#
# --priority and --size are optional (a BASSE finding leaves Priority unset).
# --status defaults to "🧩・Todo".
set -euo pipefail

OWNER="Noradrenalin-Developement"
PROJECT_NUMBER=2

TITLE="" BODY_FILE="" LABELS="" PRIORITY="" SIZE="" STATUS="🧩・Todo" CHECK=0 DRY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)     CHECK=1; shift ;;
    --dry-run)   DRY=1; shift ;;
    --title)     TITLE="$2"; shift 2 ;;
    --body-file) BODY_FILE="$2"; shift 2 ;;
    --labels)    LABELS="$2"; shift 2 ;;
    --priority)  PRIORITY="$2"; shift 2 ;;
    --size)      SIZE="$2"; shift 2 ;;
    --status)    STATUS="$2"; shift 2 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

command -v gh >/dev/null || { echo "gh is required" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

FIELDS=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 50)
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r '.id')

field_id()  { jq -r --arg n "$1" '.fields[] | select(.name == $n) | .id' <<<"$FIELDS"; }
option_id() { jq -r --arg n "$1" --arg o "$2" \
  '.fields[] | select(.name == $n) | .options[] | select(.name == $o) | .id' <<<"$FIELDS"; }

# Fail loudly if the board no longer looks like we expect, rather than
# silently filing an issue with no fields set.
require_option() {
  local field="$1" opt="$2" id
  id=$(option_id "$field" "$opt")
  [[ -n "$id" ]] || {
    echo "!! Option '$opt' introuvable dans le champ '$field' du board." >&2
    echo "   Options disponibles :" >&2
    jq -r --arg n "$field" '.fields[] | select(.name == $n) | .options[].name | "     - " + .' <<<"$FIELDS" >&2
    exit 1
  }
  printf '%s' "$id"
}

if [[ $CHECK -eq 1 ]]; then
  echo "Board : $OWNER / project $PROJECT_NUMBER ($PROJECT_ID)"
  jq -r '.fields[] | select(.options) | "  " + .name + ":\n" +
         (.options | map("     - " + .name) | join("\n"))' <<<"$FIELDS"
  echo
  echo "Labels du repo :"
  gh label list --limit 60 | sed 's/^/  /'
  exit 0
fi

[[ -n "$TITLE" && -n "$BODY_FILE" ]] || { echo "--title and --body-file are required" >&2; exit 2; }
[[ -f "$BODY_FILE" ]] || { echo "body file not found: $BODY_FILE" >&2; exit 1; }
grep -qP '\x{2014}' "$BODY_FILE" && { echo "!! em dash (U+2014) dans le corps de l'issue : interdit par le repo" >&2; exit 1; }

STATUS_FIELD=$(field_id "Status");   STATUS_OPT=$(require_option "Status" "$STATUS")
[[ -n "$PRIORITY" ]] && { PRIORITY_FIELD=$(field_id "Priority"); PRIORITY_OPT=$(require_option "Priority" "$PRIORITY"); }
[[ -n "$SIZE" ]]     && { SIZE_FIELD=$(field_id "Size");         SIZE_OPT=$(require_option "Size" "$SIZE"); }

if [[ $DRY -eq 1 ]]; then
  echo "[dry-run] issue: $TITLE"
  echo "[dry-run] labels: ${LABELS:-none} | status: $STATUS | priority: ${PRIORITY:-unset} | size: ${SIZE:-unset}"
  exit 0
fi

LABEL_ARGS=()
[[ -n "$LABELS" ]] && while IFS= read -r l; do LABEL_ARGS+=(--label "$l"); done < <(tr ',' '\n' <<<"$LABELS")

URL=$(gh issue create --title "$TITLE" --body-file "$BODY_FILE" "${LABEL_ARGS[@]}")
echo "issue  : $URL"

ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$URL" --format json | jq -r '.id')
echo "board  : $ITEM_ID"

set_field() {
  gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" \
    --field-id "$1" --single-select-option-id "$2" >/dev/null
}
set_field "$STATUS_FIELD" "$STATUS_OPT"
[[ -n "$PRIORITY" ]] && set_field "$PRIORITY_FIELD" "$PRIORITY_OPT"
[[ -n "$SIZE" ]]     && set_field "$SIZE_FIELD" "$SIZE_OPT"

echo "champs : status=$STATUS priority=${PRIORITY:-unset} size=${SIZE:-unset}"
