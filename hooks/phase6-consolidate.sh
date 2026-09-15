#!/usr/bin/env bash
# alta-dev Phase 6 reinforcement loop (Stop hook).
#
# Fires when Claude stops. Once per session, and only after substantive
# file-modifying work, it blocks the stop and asks Claude to run alta-dev
# Phase 6: consolidate durable learnings into CLAUDE.md / README / docs / memory.
#
# Guards:
#   - stop_hook_active: never re-fire on a stop we ourselves triggered (no loop).
#   - per-session sentinel: remind at most once per session.
#   - work threshold: skip pure Q&A sessions (no Edit/Write/MultiEdit).
#
# Fail-open everywhere: any error or missing dependency exits 0 (allow the stop),
# so a broken hook can never trap a session.
set -u

# --- read hook input (JSON on stdin) ---------------------------------------
input="$(cat 2>/dev/null || true)"

# Need python3 to parse safely; without it, do nothing.
command -v python3 >/dev/null 2>&1 || exit 0

read -r SESSION_ID STOP_ACTIVE TRANSCRIPT <<EOF
$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    print(". . ."); sys.exit(0)
sid = str(d.get("session_id") or ".").replace(" ", "_") or "."
active = "1" if d.get("stop_hook_active") else "0"
tp = str(d.get("transcript_path") or ".") or "."
print(sid, active, tp)
' 2>/dev/null)
EOF

[ "${STOP_ACTIVE:-0}" = "1" ] && exit 0                 # our own stop -> allow
[ -z "${SESSION_ID:-}" ] || [ "$SESSION_ID" = "." ] && exit 0

# --- once per session ------------------------------------------------------
STATE_DIR="${TMPDIR:-/tmp}/claude-phase6"
mkdir -p "$STATE_DIR" 2>/dev/null || exit 0
SENTINEL="$STATE_DIR/$SESSION_ID"
[ -e "$SENTINEL" ] && exit 0                            # already reminded

# --- substantive-work gate: count file-mutating tool uses in the transcript -
[ -f "$TRANSCRIPT" ] || exit 0
EDITS="$(python3 - "$TRANSCRIPT" <<'PY' 2>/dev/null
import json, sys
tools = {"Edit", "Write", "MultiEdit", "NotebookEdit"}
n = 0
try:
    with open(sys.argv[1], encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except Exception:
                continue
            msg = ev.get("message", ev)
            content = msg.get("content") if isinstance(msg, dict) else None
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "tool_use" and block.get("name") in tools:
                        n += 1
except Exception:
    pass
print(n)
PY
)"
EDITS="${EDITS:-0}"
THRESHOLD="${ALTA_PHASE6_MIN_EDITS:-2}"                 # override via env if wanted
[ "$EDITS" -ge "$THRESHOLD" ] 2>/dev/null || exit 0

# --- fire once: mark, then block the stop with the Phase 6 instruction ------
: > "$SENTINEL" 2>/dev/null || true

python3 - <<'PY'
import json
reason = (
    "alta-dev reinforcement loop (Phase 6): this session did substantive work. "
    "Before ending, consolidate what it TAUGHT that a future session could not re-derive. "
    "First judge scope: if little durable was learned, say so briefly and stop. Otherwise: "
    "(1) harvest durable rules, preferences, conventions and decisions from the whole discussion "
    "(not a transcript); (2) route each to its single home: project behaviour/rules/habits to "
    "CLAUDE.md/AGENTS.md, facts/architecture/decisions to README.md/docs/ADR, personal cross-project "
    "preferences to the memory system, a standard's rule to references/; (3) read the target before "
    "writing, update the entry that already owns the topic (no duplicates, no invented rules, no em dash); "
    "(4) report a one-line ledger per file touched. Do not commit or push unless asked. "
    "This reminder fires once per session."
)
print(json.dumps({"decision": "block", "reason": reason}))
PY
exit 0
