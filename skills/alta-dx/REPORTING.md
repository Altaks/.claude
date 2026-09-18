# Reporting: AUDIT-DX.md, then issues

Two stages, in this order, always. The report is written unconditionally; the issues are filed only after the user has pruned the list and said go.

## Stage 1: AUDIT-DX.md

Root of the repo, French, same register as the game-mode audits in `audits/` (notably `audits/lguhc-s9.md`, a *different* audit: documentation versus code, issue #499). Do not touch anything under `audits/`: that folder holds game-mode audits, this one is a framework/DX audit and stays at the root. If `AUDIT-DX.md` already exists, read it first and update it in place: keep the findings that still hold, strike through the ones that were fixed with a line saying in which PR, and add the new ones. An audit that silently loses its history is worthless.

Structure:

```markdown
# AUDIT-DX.md : la friction entre le GDK et ses consommateurs

[Un paragraphe : ce qui a ete balaye (quels modules, quels sous-systemes), a quel commit, et le verdict d'ensemble en une phrase.]

**Rapport seul : aucun correctif n'est applique ici.** Chaque constat est un candidat a une issue dediee.

## Methode

[Le recensement : les chiffres bruts sortis de scripts/sweep.sh. Combien de sites Bukkit.*, combien de @EventHandler, combien de fichiers partagent chaque forme recopiee. C'est la preuve, elle passe en premier.]

## Sommaire

- [Les constats HAUTS](#les-constats-hauts)
- [Les constats MOYENS](#les-constats-moyens)
- [Les constats BAS](#les-constats-bas)
- [Sous surveillance](#sous-surveillance)

---

## Les constats HAUTS

### 1. [Le titre dit la friction, pas la solution : "Chaque role resout sa cible a la main"]

**Friction.** [Ce que le developpeur de mode de jeu doit faire aujourd'hui, et pourquoi c'est du bricolage.]

**Preuves.** 28 sites, dont `VoyouRole.kt:139`, `EspionRole.kt:103`, `RenardRole.kt:132`. [Toujours file:line, toujours un compte.]

**Ce que le GDK devrait offrir.** [L'API declarative, avec la signature proposee et un exemple d'appel cote consommateur. Montrer le code du before et du after.]

**Cout.** Normal. [Ce qu'il faut construire, et l'impact sur les consommateurs existants : hook avec defaut, ou rupture d'API ?]

---
```

One `###` section per finding, numbered inside its severity band. Ordered by leverage (sites eliminated x friction per site), not by discovery order.

The "before / after" code pair is the heart of a finding. A reader must see, in ten seconds, the boilerplate that disappears. Write both snippets. If you cannot write the "after", the finding is not ripe: move it to *Sous surveillance*.

## Stage 2: the issues

Ask first. Present the list of findings as a numbered menu with severity and cost, and let the user strike the ones they do not want on the tracker. Never file 40 auto-generated issues unprompted.

Then, per retained finding, run `scripts/file-finding.sh` from the repo root. It creates the issue, adds it to the `Minecraft・UHC GDK` Project v2 board (owner `Noradrenalin-Developement`, project number 2) and sets Status, Priority and Size.

```bash
scripts/file-finding.sh \
  --title "Resolution de cible: un type d'argument actif, au lieu de 28 Bukkit.getPlayerExact" \
  --body-file /tmp/.../finding-1.md \
  --labels "gdk,refactor,enhancement" \
  --priority "❗・Must be done" \
  --size "👍・Normal"
```

Run `scripts/file-finding.sh --check` once before the first call: it re-reads the board's field ids from the API and fails loudly if the options have been renamed. Never hardcode a field id from this document into a `gh` call; the ids drift, the names are the contract.

### Issue body

The finding's section from `AUDIT-DX.md`, near enough verbatim (friction, preuves, API proposee, cout), plus a last line pointing back: `Extrait de AUDIT-DX.md (constat HAUT #1).` The issue must stand alone: someone picking it up months later should not need the audit open next to it.

### The label map

Existing labels only. Do not invent one without asking.

| Label | When |
|---|---|
| `gdk` | The fix lands in `gdk/`. Nearly every DX finding does. |
| `lguhc` | The fix also sweeps `consumers/LoupGarouUHC`, or the evidence lives there. |
| `refactor` | Behaviour-preserving: the concept exists, it moves or gets cleaned. |
| `enhancement` | A new declarative capability the GDK did not have. |
| `java` / `kotlin` | Only if the fix is confined to one language's sources. |
| `documentation` | Only for a finding that is purely a doc gap. Rare here: if an API needs a warning in its KDoc to be usable, that is a design finding. |

### Severity and cost to board fields

| Report | Project v2 field | Value |
|---|---|---|
| HAUTE, and it blocks or misleads a developer today | Priority | `‼️・Urgent` |
| HAUTE | Priority | `❗・Must be done` |
| MOYENNE | Priority | `❕・Important` |
| BASSE | Priority | leave unset |
| Cost Trivial ... Hardcore | Size | `🤏・Trivial`, `👌・Easy`, `👍・Normal`, `🤞・Hard`, `💢・Hardcore` |
| Any newly filed finding | Status | `🧩・Todo`, or `💡・Ideas` if the design is not settled |

`‼️・Hotfix` is for production fires. A DX finding is never a hotfix.

## Stage 3: the handoff

You do not fix anything. When the user picks a finding to act on, hand off to **`alta-refactor`** with: the scope (which files), the evidence (the `file:line` list), the target API (the "after" snippet), and the constraints (`public` is forever, `verifyPublicApiClosure`, main-thread only, no em dashes). That skill runs its own grill, safety net and atomic slices.

If the finding is a new capability rather than a cleanup, hand off to **`alta-dev`** instead.
