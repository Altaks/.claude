#!/bin/bash
# Claude Code status line, grouped by meaning (one line):
#   Opus 5.5 (high) │ .claude ⌥ main ↑2 +3−1 │ ctx 8% · 2h05 · +120−30 │ 5h 12% 00h40 · 7j 41% lun 01h53 │ v2.1.332
#   model (effort)    code                     session                   quotas                            version
# The model-gatekeeper mod inserts its counter into the first group (`· ●1 ●2 ~$0.27`).
# Derived from https://github.com/daniel3303/ClaudeCodeStatusLine (MIT, see LICENSE and ORIGIN.md).

set -f  # no globbing

input=$(cat)
if [ -z "$input" ]; then
    printf "Claude"
    exit 0
fi

# ===== Palette: Catppuccin Macchiato =====
blue='\033[38;2;138;173;244m'
green='\033[38;2;166;218;149m'
yellow='\033[38;2;238;212;159m'
orange='\033[38;2;245;169;127m'
red='\033[38;2;237;135;150m'
purple='\033[38;2;198;160;246m'
cyan='\033[38;2;139;213;202m'
lavender='\033[38;2;183;189;248m'
dim='\033[38;2;128;135;162m'
bar='\033[38;2;91;96;120m'
bold='\033[1m'
reset='\033[0m'

group_sep=" ${bar}│${reset} "
item_sep=" ${dim}·${reset} "

# ===== Helpers =====
usage_color() {
    local pct=$1
    if [ "$pct" -ge 90 ]; then echo "$red"
    elif [ "$pct" -ge 70 ]; then echo "$orange"
    elif [ "$pct" -ge 50 ]; then echo "$yellow"
    else echo "$green"
    fi
}

format_duration() {
    local s=$(( $1 / 1000 ))
    if [ "$s" -ge 3600 ]; then printf "%dh%02d" $(( s / 3600 )) $(( (s % 3600) / 60 ))
    elif [ "$s" -ge 60 ]; then printf "%dm" $(( s / 60 ))
    else printf "%ds" "$s"
    fi
}

# 0 (true) when $1 > $2 as semantic versions
version_gt() {
    local a="${1#v}" b="${2#v}"
    local IFS='.'
    read -r a1 a2 a3 <<< "$a"
    read -r b1 b2 b3 <<< "$b"
    a1=${a1:-0}; a2=${a2:-0}; a3=${a3:-0}
    b1=${b1:-0}; b2=${b2:-0}; b3=${b3:-0}
    [ "$a1" -gt "$b1" ] 2>/dev/null && return 0
    [ "$a1" -lt "$b1" ] 2>/dev/null && return 1
    [ "$a2" -gt "$b2" ] 2>/dev/null && return 0
    [ "$a2" -lt "$b2" ] 2>/dev/null && return 1
    [ "$a3" -gt "$b3" ] 2>/dev/null && return 0
    return 1
}

file_age() {
    local mtime
    mtime=$(stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null)
    echo $(( $(date +%s) - ${mtime:-0} ))
}

# "+3−1" glued, green then red; empty when both are zero
diff_pair() {
    local add=${1:-0} del=${2:-0}
    [ "$add" -gt 0 ] 2>/dev/null || [ "$del" -gt 0 ] 2>/dev/null || return 0
    printf '%s' "${green}+${add}${reset}${red}−${del}${reset}"
}

# Reset times: "00h40" for the 5h window, "lun 01h53" for the week
fmt_time() {
    date -d "@$1" +"%Hh%M" 2>/dev/null || date -j -r "$1" +"%Hh%M" 2>/dev/null
}
fmt_day_time() {
    local day
    day=$(LC_TIME=fr_FR.UTF-8 date -d "@$1" +"%a" 2>/dev/null || LC_TIME=fr_FR.UTF-8 date -j -r "$1" +"%a" 2>/dev/null)
    printf '%s %s' "${day%.}" "$(fmt_time "$1")"
}

iso_to_epoch() {
    local iso_str="$1" epoch stripped
    epoch=$(date -d "${iso_str}" +%s 2>/dev/null)
    if [ -n "$epoch" ]; then echo "$epoch"; return 0; fi
    stripped="${iso_str%%.*}"; stripped="${stripped%%Z}"; stripped="${stripped%%+*}"
    stripped="${stripped%%-[0-9][0-9]:[0-9][0-9]}"
    if [[ "$iso_str" == *"Z"* ]] || [[ "$iso_str" == *"+00:00"* ]] || [[ "$iso_str" == *"-00:00"* ]]; then
        epoch=$(env TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%S" "$stripped" +%s 2>/dev/null)
    else
        epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "$stripped" +%s 2>/dev/null)
    fi
    [ -n "$epoch" ] && echo "$epoch"
}

claude_config_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
settings_path="$claude_config_dir/settings.json"
mkdir -p /tmp/claude 2>/dev/null

# ===== Group 1: model (effort) =====
model_name=$(echo "$input" | jq -r '.model.display_name // "Claude"' | sed 's/ *([^)]*context)//')

effort_level=$(echo "$input" | jq -r '.effort.level // empty' 2>/dev/null)
[ -z "$effort_level" ] && effort_level="$CLAUDE_CODE_EFFORT_LEVEL"
[ -z "$effort_level" ] && [ -f "$settings_path" ] && effort_level=$(jq -r '.effortLevel // empty' "$settings_path" 2>/dev/null)
[ -z "$effort_level" ] && effort_level="medium"
case "$effort_level" in
    low)    effort_color="$dim" ;;
    medium) effort_color="$orange"; effort_level="med" ;;
    xhigh)  effort_color="$purple" ;;
    max)    effort_color="$red" ;;
    *)      effort_color="$green" ;;
esac
model_group="${bold}${blue}${model_name}${reset} ${dim}(${reset}${effort_color}${effort_level}${reset}${dim})${reset}"

# ===== Group 2: code (dir, branch, to push / pull, uncommitted diff) =====
code_group=""
cwd=$(echo "$input" | jq -r '.cwd // empty')
if [ -n "$cwd" ]; then
    code_group="${cyan}${cwd##*/}${reset}"
    git_branch=$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null)
    if [ -n "$git_branch" ]; then
        code_group+="${dim} ⌥ ${reset}${green}${git_branch}${reset}"
        ab_counts=$(git -C "$cwd" rev-list --left-right --count '@{upstream}...HEAD' 2>/dev/null)
        if [ -n "$ab_counts" ]; then
            read -r ab_behind ab_ahead <<< "$ab_counts"
            [ "${ab_ahead:-0}" -gt 0 ] 2>/dev/null && code_group+=" ${green}↑${ab_ahead}${reset}"
            [ "${ab_behind:-0}" -gt 0 ] 2>/dev/null && code_group+=" ${red}↓${ab_behind}${reset}"
        fi
        # Staged and unstaged together; a repository with no commit yet has no HEAD to compare.
        git_stat=$(git -C "$cwd" diff --numstat HEAD 2>/dev/null | awk '{a+=$1; d+=$2} END {printf "%d %d", a, d}')
        read -r git_add git_del <<< "${git_stat:-0 0}"
        pair=$(diff_pair "$git_add" "$git_del")
        [ -n "$pair" ] && code_group+=" ${pair}"
    fi
fi

# ===== Group 3: session (context, duration, lines changed) =====
size=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
[ "$size" -gt 0 ] 2>/dev/null || size=200000
current=$(echo "$input" | jq -r '(.context_window.current_usage // {}) | (.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0)')
pct_used=$(( current * 100 / size ))
session_group="${dim}ctx${reset} $(usage_color "$pct_used")${pct_used}%${reset}"

if [ "$(echo "$input" | jq -r 'has("cost") and (.cost != null)')" = "true" ]; then
    duration_ms=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
    [ "$duration_ms" -gt 0 ] 2>/dev/null && session_group+="${item_sep}${lavender}$(format_duration "$duration_ms")${reset}"
    pair=$(diff_pair "$(echo "$input" | jq -r '.cost.total_lines_added // 0')" "$(echo "$input" | jq -r '.cost.total_lines_removed // 0')")
    [ -n "$pair" ] && session_group+="${item_sep}${pair}"
fi

# ===== Group 4: quotas (5h, 7 days, extra credit) =====
# OAuth token, only for the usage endpoint (extra credit, or when Claude Code sends no rate limits).
get_oauth_token() {
    local token="" blob
    if [ -n "$CLAUDE_CODE_OAUTH_TOKEN" ]; then echo "$CLAUDE_CODE_OAUTH_TOKEN"; return 0; fi
    if command -v security >/dev/null 2>&1; then
        local keychain_svc="Claude Code-credentials"
        if [ -n "$CLAUDE_CONFIG_DIR" ]; then
            keychain_svc="Claude Code-credentials-$(echo -n "$CLAUDE_CONFIG_DIR" | shasum -a 256 | cut -c1-8)"
        fi
        blob=$(security find-generic-password -s "$keychain_svc" -w 2>/dev/null)
        token=$(echo "$blob" | jq -r '.claudeAiOauth.accessToken // empty' 2>/dev/null)
        if [ -n "$token" ]; then echo "$token"; return 0; fi
    fi
    if [ -f "${claude_config_dir}/.credentials.json" ]; then
        token=$(jq -r '.claudeAiOauth.accessToken // empty' "${claude_config_dir}/.credentials.json" 2>/dev/null)
        if [ -n "$token" ]; then echo "$token"; return 0; fi
    fi
    if command -v secret-tool >/dev/null 2>&1; then
        blob=$(timeout 2 secret-tool lookup service "Claude Code-credentials" 2>/dev/null)
        token=$(echo "$blob" | jq -r '.claudeAiOauth.accessToken // empty' 2>/dev/null)
        if [ -n "$token" ]; then echo "$token"; return 0; fi
    fi
    echo ""
}

five_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
five_reset=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
seven_pct=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
seven_reset=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')

# All zero with no reset time usually means Claude's side failed: fall back to the cache then.
use_builtin=false
for v in "$five_pct" "$seven_pct"; do
    [ -n "$v" ] && [ "$(printf '%.0f' "$v" 2>/dev/null)" != "0" ] && use_builtin=true
done
for v in "$five_reset" "$seven_reset"; do
    [ -n "$v" ] && [ "$v" != "null" ] && [ "$v" != "0" ] && use_builtin=true
done

config_hash=$(echo -n "$claude_config_dir" | { shasum -a 256 2>/dev/null || sha256sum; } | cut -c1-8)
cache_file="/tmp/claude/statusline-usage-cache-${config_hash}.json"
usage_data=""
[ -s "$cache_file" ] && usage_data=$(cat "$cache_file" 2>/dev/null)

# Refresh at most once a minute, shared by every pane; extra credit is only on this endpoint.
if [ ! -s "$cache_file" ] || [ "$(file_age "$cache_file")" -ge 60 ]; then
    touch "$cache_file"
    token=$(get_oauth_token)
    if [ -n "$token" ]; then
        response=$(curl -s --max-time 10 \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -H "anthropic-beta: oauth-2025-04-20" \
            -H "User-Agent: claude-code/2.1.34" \
            "https://api.anthropic.com/api/oauth/usage" 2>/dev/null)
        if echo "$response" | jq -e '.five_hour' >/dev/null 2>&1; then
            usage_data="$response"
            echo "$response" > "$cache_file"
        fi
    fi
    [ -f "$cache_file" ] && [ ! -s "$cache_file" ] && rm -f "$cache_file"
fi

if ! $use_builtin && echo "$usage_data" | jq -e '.five_hour' >/dev/null 2>&1; then
    five_pct=$(echo "$usage_data" | jq -r '.five_hour.utilization // empty')
    seven_pct=$(echo "$usage_data" | jq -r '.seven_day.utilization // empty')
    five_reset=$(iso_to_epoch "$(echo "$usage_data" | jq -r '.five_hour.resets_at // empty')")
    seven_reset=$(iso_to_epoch "$(echo "$usage_data" | jq -r '.seven_day.resets_at // empty')")
fi

quota_group=""
if [ -n "$five_pct" ]; then
    p=$(printf '%.0f' "$five_pct")
    quota_group="5h $(usage_color "$p")${p}%${reset}"
    [ -n "$five_reset" ] && [ "$five_reset" != "null" ] && [ "$five_reset" != "0" ] && quota_group+=" ${dim}$(fmt_time "$five_reset")${reset}"
fi
if [ -n "$seven_pct" ]; then
    p=$(printf '%.0f' "$seven_pct")
    [ -n "$quota_group" ] && quota_group+="$item_sep"
    quota_group+="7j $(usage_color "$p")${p}%${reset}"
    [ -n "$seven_reset" ] && [ "$seven_reset" != "null" ] && [ "$seven_reset" != "0" ] && quota_group+=" ${dim}$(fmt_day_time "$seven_reset")${reset}"
fi
# Extra credit only once it is on, capped and in use.
if [ "$(echo "$usage_data" | jq -r '.extra_usage.is_enabled // false' 2>/dev/null)" = "true" ]; then
    used=$(echo "$usage_data" | jq -r '.extra_usage.used_credits // 0' | LC_NUMERIC=C awk '{printf "%.2f", $1/100}')
    limit=$(echo "$usage_data" | jq -r '.extra_usage.monthly_limit // 0' | LC_NUMERIC=C awk '{printf "%.2f", $1/100}')
    if LC_NUMERIC=C awk -v u="$used" -v l="$limit" 'BEGIN {exit !(u > 0 && l > 0)}'; then
        p=$(echo "$usage_data" | jq -r '.extra_usage.utilization // 0' | awk '{printf "%.0f", $1}')
        [ -n "$quota_group" ] && quota_group+="$item_sep"
        quota_group+="extra $(usage_color "$p")\$${used}/\$${limit}${reset}"
    fi
fi

# ===== Group 5: version (red ⇡ with the newer one when the release channel has it) =====
cli_cache="/tmp/claude/statusline-cli-version"
cli_version=""
[ -s "$cli_cache" ] && [ "$(file_age "$cli_cache")" -lt 3600 ] && cli_version=$(cat "$cli_cache")
if [ -z "$cli_version" ]; then
    cli_version=$(claude --version 2>/dev/null | awk '{print $1}')
    [ -n "$cli_version" ] && echo "$cli_version" > "$cli_cache"
fi

version_group=""
if [ -n "$cli_version" ]; then
    version_group="${dim}v${cli_version}${reset}"
    # Set STATUSLINE_CHECK_UPDATES=false for no network call.
    if [ "${STATUSLINE_CHECK_UPDATES:-true}" != "false" ]; then
        channel=$(jq -r '.autoUpdatesChannel // "latest"' "$settings_path" 2>/dev/null)
        case "$channel" in latest|stable) ;; *) channel="latest" ;; esac
        latest_cache="/tmp/claude/statusline-cli-${channel}"
        latest=""
        [ -s "$latest_cache" ] && [ "$(file_age "$latest_cache")" -lt 21600 ] && latest=$(cat "$latest_cache")
        if [ -z "$latest" ]; then
            touch "$latest_cache"  # one fetch for parallel panes
            fetched=$(curl -s --max-time 5 "https://downloads.claude.ai/claude-code-releases/${channel}" 2>/dev/null)
            if [[ "$fetched" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                latest="$fetched"
                echo "$latest" > "$latest_cache"
            else
                rm -f "$latest_cache"
            fi
        fi
        [ -n "$latest" ] && version_gt "$latest" "$cli_version" && version_group+=" ${red}⇡${latest}${reset}"
    fi
fi

# ===== Output =====
out="$model_group"
for group in "$code_group" "$session_group" "$quota_group" "$version_group"; do
    [ -n "$group" ] && out+="${group_sep}${group}"
done
printf "%b" "$out"
exit 0
