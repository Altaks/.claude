# Minecraft / in-game UI

The frontend of a Spigot/Paper plugin: chat, scoreboard, tab list, chest-GUI menus, item lore, action
bar, boss bar, titles, signs, books, holograms. **Read `ui-ux.md` first**: its ten rules (feedback, the
four states, words, hierarchy, consistency, support constraints, recovery, discoverability) all apply
here. This document is how they land in the game client. Same goal as the web: usable, consistent, with
a point of view, never the default server look.

## Pick the surface for the job

| Surface | Use for | Not for |
|---|---|---|
| **chat** | events, results, one-off messages, command output | persistent state (it scrolls away) |
| **action bar** | one short transient line above the hotbar | anything the player must keep reading |
| **boss bar** | a single ongoing quantity (timer, phase, progress) | menus, multi-line info |
| **scoreboard (sidebar)** | persistent per-player state: score, team, timers | paragraphs, long text |
| **tab list** | roster, ping, rank, global standings | per-moment feedback |
| **title / subtitle** | a big moment (round start, death, win) | routine confirmation (use chat / action bar) |
| **chest GUI** | choices, navigation, configuration | free text entry (use sign / anvil) |
| **item lore** | the fixed properties of a menu or kit item | live-updating values (re-render cost) |

Least astonishment: the same surface for the same kind of information across the whole plugin.

## Client rendering constraints (real, measure them)

- Target the oldest supported client (often 1.8.8): chat box ~320 px at scale 1.0, aim ~296 px per line.
- Unicode arrows (`→` `➡`) do not render reliably; use `»` and `«`. List markers: `·` or `-`. Test in the real client.
- Legacy `sendMessage(String)` strips trailing whitespace: close strikethrough / underline runs before the line edge.
- Multi-line output that must stay together goes in one message; another writer interleaves otherwise.
- Chest GUIs are 9 columns; a row is 9 slots. Design on the 9-wide grid and leave a border / padding row.
- Scoreboard lines have a per-version length cap; keep entries short and unique.

## Hierarchy, colour, consistency

- **One prefix system, everywhere.** A message's source is legible from its prefix and colour (the project's `GDK_PREFIX_*` constants), never a raw inline string.
- **Colour carries a role** (error, success, neutral, highlight), decided once and reused, never an ad-hoc `§c` / `§a` per call site.
- **Colour is never the only signal.** Minecraft has colourblind players and colour-stripped contexts: pair colour with a symbol, a label or position. Red vs green both need a word.
- Command output: name `AQUA`, required arg `WHITE`, optional `GRAY`, one scheme across every command.
- Align columns with padding, not by luck; numbers read better fixed-width.

## Feedback, states, recovery (the ui-ux rules, in-game)

- **Every player action returns a perceptible result**: a chat line, a sound, or a title. Silent success is a bug.
- **Sound is part of the UI**: a confirm cue vs a failure cue (for example `NOTE_PLING` vs a low tone), used consistently.
- **The four states apply**: an empty menu explains itself (never a blank chest); an async action says it is working; an error says why and what now; the populated state survives long names, full rosters, and the 55th item (paginate).
- **Destructive actions confirm and name what is destroyed**; prefer a confirm slot in the GUI over a blind click. Never destroy on a single misclick.
- **Chest GUIs**: dedicate fixed slots to navigation (back, next, close), the same slots on every menu; paginate when items exceed the grid; never overflow silently.

## Discoverability

- `syntax()`, `examples()` and tab-completion stay in sync; a bad invocation replies with the syntax.
- A menu item's lore says what clicking does. The empty state teaches the feature.

## Checklist avant de dire que c'est fini

- [ ] Right surface for each piece of information; same surface for the same job across the plugin.
- [ ] Rendered in the real client at the oldest supported version, screenshot in the PR.
- [ ] Prefixes and colour roles consistent; colour never the only carrier of meaning.
- [ ] Widths, glyphs, whitespace-stripping and the 9-slot grid respected as named constants.
- [ ] Every action returns perceptible feedback (message and/or sound and/or title).
- [ ] Empty / async / error / full states handled; long names and rosters paginate, not overflow.
- [ ] Destructive actions confirm and name the target; navigation slots fixed across menus.
