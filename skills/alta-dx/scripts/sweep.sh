#!/usr/bin/env bash
# Census of the escape hatches a consumer module had to take.
# Read-only. Prints counts and the file:line evidence behind them.
#
#   scripts/sweep.sh                 # all consumer modules
#   scripts/sweep.sh LoupGarouUHC        # one module
#   scripts/sweep.sh --evidence      # also print the matching lines, not just counts
set -uo pipefail

cd "$(git rev-parse --show-toplevel)" || exit 1

EVIDENCE=0
MODULES=()
for arg in "$@"; do
  case "$arg" in
    --evidence) EVIDENCE=1 ;;
    *) MODULES+=("consumers/$arg") ;;
  esac
done
[[ ${#MODULES[@]} -eq 0 ]] && MODULES=(examples)

command -v rg >/dev/null || { echo "ripgrep (rg) is required" >&2; exit 1; }

# count <label> <regex> [extra rg args...]
count() {
  local label="$1" pattern="$2"; shift 2
  local hits
  hits=$(rg -n --no-heading -e "$pattern" "$@" -g '*.kt' -g '*.java' "${MODULES[@]}" 2>/dev/null)
  local n files
  n=$(printf '%s' "$hits" | grep -c . || true)
  files=$(printf '%s' "$hits" | cut -d: -f1 | sort -u | grep -c . || true)
  printf '  %-52s %4s sites  %3s fichiers\n' "$label" "$n" "$files"
  if [[ $EVIDENCE -eq 1 && $n -gt 0 ]]; then
    printf '%s\n' "$hits" | sed 's/^/      /' | head -30
    [[ $n -gt 30 ]] && printf '      ... et %s de plus\n' "$((n - 30))"
    echo
  fi
}

echo "== Echappatoires : le consommateur sort du framework =="
count "Bukkit.getPlayer / getPlayerExact (ciblage)" '\bBukkit\.getPlayer(Exact)?\('
count "Autres reach-through Bukkit.*"              '\bBukkit\.(?!getPlayer)' -P
count "Scheduling hors gdkScheduler"               '\b(runTaskLater|runTaskTimer|BukkitRunnable|scheduleSyncRepeating)'
count "Evenements GDK refires a la main"           'getPluginManager\(\)\.callEvent'
count "Potions posees a la main"                   '\b(addPotionEffect|removePotionEffect)\('

echo
echo "== Copier-coller : la meme forme, fichier apres fichier =="
count "Garde de self-filtering (getCurrentRole !== this)" 'getCurrentRole\([^)]*\)\s*[!=]==\s*this'
count "isNight / isDay tenu a la main par le role"        '\b(isNight|isDay)\b'
count "Reset-on-finish (UHCGameFinishesEvent)"            'UHCGameFinishesEvent'
count "Message prefixe + traduit a la main"               'GDK_PREFIX.*translate|translate.*GDK_PREFIX'
count "@Suggestions (completions ecrites a la main)"      '@Suggestions'
count "activePlayers().map { it.name }"                   'activePlayers\(\)\s*\.map\s*\{\s*it\.name'

echo
echo "== Surface : ce que le consommateur doit ecrire =="
count "@EventHandler"                              '@EventHandler'
count "@Command"                                   '@Command'
count "override fun tick()"                        'override fun tick\(\)'
count "override fun victoryCondition()"            'override fun victoryCondition\(\)'

echo
echo "== Les fichiers les plus charges en @EventHandler =="
rg -c '@EventHandler' -g '*.kt' -g '*.java' "${MODULES[@]}" 2>/dev/null \
  | sort -t: -k2 -rn | head -10 | sed 's/^/  /'

echo
echo "Rappel : un chiffre n'est pas un constat. Chaque ligne ci-dessus doit etre"
echo "relue dans le code avant d'entrer dans AUDIT-DX.md (cf. HEURISTICS.md)."
