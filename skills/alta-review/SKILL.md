---
name: alta-review
description: Use when reviewing a pull request, branch, or local diff on Noradrenalin's UHCGDK or any JungleUHC repository (or any Kotlin/Spigot project the user wants reviewed "like Altaks would"). Triggers on "/alta-review <PR#>", "review this PR like Altaks", "check this diff against our standards", or any pre-merge audit of substantial Kotlin/Spigot work. Produces severity-tagged findings with concrete "do this instead" snippets.
---

# alta-review

PR-review companion grounded in the recurring themes Altaks calls out across UHCGDK and JungleUHC. Goal: clean, maintainable, extensible, readable, explicit, semantically valid Kotlin/Spigot code. Rigorous and impartial — call out problems precisely, surface positives so the review is not a pile-on, and always show the "do this instead" snippet.

## When to use

- The user invokes `/alta-review`, `/alta-review <PR#>`, or a phrase like "review this PR like Altaks would" / "check this branch against our review standards".
- A pre-merge audit of a Kotlin/Spigot diff in `Noradrenalin-Developement/Minecraft-UHCGDK` or any `JungleUHC/*` repo.
- The user pastes a snippet and says "what would Altaks say about this?".

## Workflow

1. **Scope the diff.** PR number → `gh pr view <N> --repo <owner>/<repo>`, `gh pr diff <N> --repo <owner>/<repo>`. Branch → `git diff <base>...HEAD`. Local diff → `git diff` / `git diff --staged`.
2. **Load project conventions.** Read the repo's `CLAUDE.md` if present — it usually already encodes a subset of these rules. Project rules win when they conflict.
3. **Check prior reviews.** `gh pr view <N> --comments` and `gh api repos/<owner>/<repo>/pulls/<N>/comments`. Do not duplicate findings already raised; build on them or skip them.
4. **Walk the diff** through the pattern catalogue below, layer by layer. Note positives too — Altaks reviews are corrective, not punitive.
5. **Tag each finding** with a Pullpo-style severity:
   - **blocking** — must fix before merge. NPE risk, silent failure, broken contract, security, naked `!!`, leaked state, wrong comment, missing user feedback on user action, magic value that hides a unit/coordinate, alias passthrough, role/team reference outside the registry.
   - **nitpick** — non-blocking polish. Style, name tightening, idiomatic Kotlin one-liner, comment trim.
   - **todo** — minor follow-up. `// FIXME`-style marker, screenshot request, doc gap.
6. **Write each finding in this format:**
   ```
   **[blocking|nitpick|todo]** `path/to/File.kt:Lstart-Lend` — One-line title

   <one paragraph: what's wrong and why it matters here>

   ```kotlin
   // before
   <faithful excerpt of the current code>

   // after
   <the suggested rewrite, fully working — no "..." placeholders>
   ```
   ```
7. **Close with a short summary**: count of findings per severity, 1-2 lines on the overall direction, and any positives worth flagging.

## Pattern catalogue

Four layers, applied top-down. Layer 0 is the "why" — the engineering principles that frame everything below. Layers 1-3 are the concrete checklist. A layer-1 violation usually outweighs a layer-3 nitpick in the same hunk; cite a layer-0 principle by name when it sharpens the finding.

### Layer 0 — Engineering principles (frame the catalogue)

When a finding maps cleanly to one of these, name it: it gives the contributor a mental model that survives beyond this PR. Don't force-name a principle when the concrete rule is enough — naming should add clarity, not jargon.

| # | Principle | Lens / typical smell | Concrete rules |
|---|---|---|---|
| 0.1 | **KISS** — simplest thing that works | A 6-line imperative builder loop where one stdlib call exists; a clever bit-packing scheme; an abstract layer added "to make it general". | 1.6, 1.3 |
| 0.2 | **SRP** (Single Responsibility) | One class / one function doing several identifiable things. "And" in a function name. | 1.3, 2.1 |
| 0.3 | **OCP** (Open/Closed) | Adding a hard-coded `if (role is Sorciere) { … } else if (role is Idiot) { … }` instead of leveraging the existing `UHCGameRole` / `UHCGameTeam` / `UHCGameModule` extension points. | 2.4 |
| 0.4 | **LSP** (Liskov Substitution) | A subclass that overrides a method to throw, return null when the parent never does, or weakens a precondition the parent guarantees. Rare in this codebase — flag explicitly when seen. | — |
| 0.5 | **ISP** (Interface Segregation) | A 12-method interface where most implementers leave 8 methods empty / no-op. Rare here — flag when a fat interface is introduced. | — |
| 0.6 | **DIP** (Dependency Inversion) | Reaching for a project-side global / `companion object` registry / static singleton instead of injecting through the constructor. (Bukkit's own static API — `Bukkit.getPlayer`, `Bukkit.broadcastMessage`, etc. — is the idiomatic Spigot surface and is NOT a DIP smell.) | 2.3 |
| 0.7 | **DRY** (Don't Repeat Yourself) | Same logic at 3+ sites without a shared helper. Same numeric / string literal in two files. | 3.1, 1.4 |
| 0.8 | **YAGNI** (You Aren't Gonna Need It) | A speculative parameter, hook, config field, or extension point with no concrete consumer in the PR. "We might need this later" is the tell. The codebase only adds extension points when a consumer needs them right now. | 2.5 |
| 0.9 | **Composition over inheritance** | A new abstract layer added when injecting a sub-manager / extracting a small helper would do. `GDKGameManager` composes `HostManager`, `GameTimerManager`, etc. — that pattern, not a new abstract base class. | 2.2 |
| 0.10 | **Fail loud at boundaries** | Silent `return` / null-coalesce in deep internals; defensive null-checks scattered downstream of validated input. | 2.6 |
| 0.11 | **Pure functions where possible** | Helpers reading or mutating shared state for no reason. Pixel-width / wrap-text / victory-resolution helpers should be `(input) -> output` only. | — |
| 0.12 | **Least visibility** | A new `public` / `internal` symbol with no consumer outside the file. | 1.7 |

**Rule of thumb when citing**: principle names belong in the *one-line title* or the *what's wrong* paragraph, not as a separate section. Example: `**[blocking]** path/File.kt:Lxx — DIP violation: Sorcière injected directly instead of via the registry`.

### Layer 1 — Universal Kotlin / Spigot

| # | Rule | Smell to flag | Do instead |
|---|---|---|---|
| 1.1 | **Names express intent, not implementation.** | `getServiceInfoSnapshot()`, `playerUuidFromCloudPlayer`, `MAGIC_INDEX`, `onPlayerUsesCommand` (when console can run it too). | Name by *what is returned / done* in domain terms: `countPlayersOnNetwork()`, `playerCloudIdentity`, `PLAYER_VISIBILITY_TOOL_SLOT`, `onCommandPreprocess`. |
| 1.2 | **Zero `!!`.** Every nullable is `?.` chained, `?: return` early-exited, or `require`'d at the boundary. | `event.player.itemInHand!!`, `Bukkit.getPlayer(uuid)!!`. | `val item = event.player.itemInHand ?: return`. At trusted boundaries: `require(player.isOnline) { "player offline" }`. Java-interop `T!` is treated as nullable — never trust the `!`. |
| 1.3 | **Extract a named function for any identifiable sub-responsibility**, even single-use. | A 6-line block inside an event handler that "decides" then "applies". | `private fun canPlayerToggleVisibility(player: Player): Boolean` / `private fun refreshVisibilityCooldown(player: Player)`. The handler reads as decisions, not loops. |
| 1.4 | **Constants for every magic value.** Name by concept, not value. | `setItem(8, ...)`, `slot = row * 9 + col`, naked `"navigation.lobby"` strings. | `private const val GREEN_GLASS_BYTE: Byte = 5`; `private fun slot(row: Int, column: Int) = row * SLOTS_PER_ROW + column`; `const val NAV_TOOL_SLOT = 8`. Use `const val` for primitives so the compiler inlines them. |
| 1.5 | **Comments add information the code cannot.** | `// returns the player's name` over `fun playerName()`. Wrong comments ("registers listeners" for a function that calls them). | Delete paraphrase comments. Fix wrong ones. Keep KDoc for non-obvious WHY (constraints, invariants, surprise behavior). Use `// FIXME:` / `// TODO:` for intentional gaps so IDEs surface them. |
| 1.6 | **Idiomatic Kotlin — stdlib over manual loops.** | `for (s in services) { sum += s.players }`, `list.filter { it != null }.map { it!! }`, `if (x != null) doIt(x) else fallback()`. | `services.sumOf { it.players }`, `list.filterNotNull()`, `doIt(x ?: return fallback())`. Also: `buildList {}`, `buildString {}`, `setItems(range, item)`, `.unzip()`, `when {}` over chained `else if`, `hashMapOf()` over `HashMap<K,V>()`. |
| 1.7 | **`private` by default; widen with justification.** | `val foo = ...` at file scope or `internal` on a manager method only the same module calls. | Start `private`. Promote to `internal` only when another GDK class needs it; `public` only when a consumer plugin / module needs it. |
| 1.8 | **`Manager` ⇒ stateful orchestrator. Stateless helpers ⇒ `*Util` / `*Tools`.** | `InventorySlotManager` that just computes slots. | Rename to `InventoryUtil` / `InventoryTools`. |
| 1.9 | **Cache expensive reads at construction; never re-fetch per-event.** | `onJoin { cloudNet.proxiesInstance().permissionManagement().userOf(...) }` inside a hot path. | Inject the cached instance once at plugin start; pass it down. Re-reading `config.yml` per scoreboard tick is blocking. |
| 1.10 | **Every user-facing action confirms visibly.** Logs are secondary. | Silent `return` when teleport target is null, no actionbar/chat feedback after `/spawn`. | `${GDK_PREFIX_SUCCESS} Tu as été téléporté.` or actionbar. On failure: `${GDK_PREFIX_ERROR} Joueur introuvable.` plus log. |

### Layer 2 — Architectural (UHCGDK-flavored, broadly applicable)

| # | Rule | Smell to flag | Do instead |
|---|---|---|---|
| 2.1 | **Place logic in the class that owns the concern**, not in the coordinator (`GDKGameManager` / `Main`). | `GDKGameManager.isScenarioActive<T>()`, `GDKGameManager.getActiveOreMultiplier()`. | Move to `ScenarioRegistry.isActive<T>()` / `OreDropProcessor.activeMultiplier()`. Ask "which class owns this?" before adding to the coordinator. |
| 2.2 | **No alias / passthrough methods. No single-call wrappers, ever.** Expose the sub-manager directly. Wrappers whose body is one delegating call (`fun foo() = bar.foo()`, `fun setX(v) { x = v }`, scheduler facades, UUID->Player resolvers, NBT-key getters returning a constant) are blocking offenses — including "test seam" wrappers that exist only so a test can stub them. | `GDKGameManager.foo() = hostManager.foo()`. `private fun resolvePlayer(uuid) = Bukkit.getPlayer(uuid)`. `fun runLater(t) = Bukkit.getScheduler().runTaskLater(...)`. | Expose `gdkGameManager.hostManager` and let callers do `manager.hostManager.foo()`. Inline `Bukkit.getPlayer(uuid)` directly. For test seams: mock the underlying API (`mockStatic(Bukkit::class.java).use { ... }`) instead of inserting indirection. |
| 2.3 | **Registry is single source of truth.** No parallel lists; no constructor-injected role/team copies. | `class LgRoleSubCommand(private val sorciere: SorciereRole)`, identity check `role === sorciereInstance`. | Inject the registry; look up by id: `rolesManager.getById("lguhc:sorciere")`. Identity comparisons go through the registry handle. |
| 2.4 | **Role / scenario lifecycle hooks fire via GDK custom events**, not direct module → role calls. | `LGGameModule.onGameStart() { sorciere.activate(); chasseur.activate() }`. | Roles are `Listener`s on `UHCGameStartEvent`, `UHCPlayerEliminationEvent`, etc. Module fires the event, roles react. |
| 2.5 | **Extract to file/class only at 2+ call sites.** Single-use logic stays inline. | A `RoleAttributionScheduling.kt` whose body is called from one place. | Inline it where it's used. |
| 2.6 | **Fail loudly at boundaries, trust internals downstream.** | Defensive null-checks in private helpers downstream of validated input. | Validate once in `canStart()` / `LgSubCommand.execute()` / public boundary. Internal code asserts via `require` when invariants break. |

### Layer 3 — GDK / Spigot 1.8.8 specifics

| # | Rule | Smell to flag | Do instead |
|---|---|---|---|
| 3.1 | **Use GDK constants and builders.** No re-invented ticks, item-stack constructions, or material sets. Raw `ItemStack(Material.X).apply { itemMeta = … }` is a re-invention — `GDKItems.Builder` exists for exactly this. | `private const val PVP_TICKS = 6000L`; any block of `ItemStack(...).apply { val meta = itemMeta; meta.setDisplayName(...); itemMeta = meta }`. | `GDKConstants.Time.minutesToTicks(5)`, `GDKItems.Builder(Material.NETHER_STAR, 1, name).addLore(...).build()`, `MaterialSets.ORES`. |
| 3.2 | **Symbol items are `companion object val`, not instance `var`.** | `class FooScenario { private var symbol = buildSymbol(...) }`. | `class FooScenario { companion object { val SYMBOL by lazy { buildSymbol(...) } } }`. |
| 3.3 | **`syntax()` / `examples()` / `tabComplete()` stay in sync — and `examples()` is not optional.** Every accepted token shows in tab-completion AND examples. A new sub-command without an `examples()` override is a blocker. Bad-arity reply uses `${GDK_PREFIX_ERROR} ${syntax()}` (or per-action equivalent for sub-dispatchers). | `syntax()` lists `<a\|b>` but `tabComplete()` only suggests `a`. Class without `override fun examples()`. Inline ad-hoc error string `"§cUsage: ..."`. | Extend `tabComplete()` to suggest both; add `override fun examples() = listOf("syntax" to "what it does")`; on bad arity, `player.sendMessage("${GDKMain.GDK_PREFIX_ERROR} ${syntax()}")`. Color: command name `AQUA`, required `WHITE`, optional `GRAY`. |
| 3.4 | **In-game chat rendering — 1.8.8 client.** Chat box ≈ 320 px @ scale 1.0; target ~296 px. Unicode arrows (`→`, `➡`) do NOT render reliably; use `»`. List items prefix with `·` or `-`. Trailing whitespace stripped from legacy `sendMessage(String)` — terminate strikethrough flanks before the line edge. | `${ChatColor.DARK_GRAY}→ ${role}`. List of auras with no leading marker. | `${ChatColor.DARK_GRAY}» ${role}`. Each aura line: `${ChatColor.DARK_GRAY}· ${ChatColor.WHITE}<aura>`. |
| 3.5 | **Scoreboard entries: 16 chars including color codes (2 chars each).** | A 12-char label with `§a§l` prefix → 16 chars exactly, but appending `…` overflows. | Substring-and-ellipsis with named constants for the cap; account for color codes. Source: Minecraft wiki, scoreboard objective entry length. |
| 3.6 | **Broadcast-style messaging uses `Bukkit.broadcastMessage(...)`.** | `Bukkit.getOnlinePlayers().forEach { it.sendMessage(text) }`. | `Bukkit.broadcastMessage(text)`. Reserve manual loops for filtered audiences (e.g. `gameManager.activePlayers()` for in-game-only). |
| 3.7 | **Game-state accessors.** `gdkGameManager.activePlayers()` for in-game logic (excludes spectators / eliminated). `Bukkit.getOnlinePlayers()` only for "everyone connected" semantics (lobby). `rolesManager.getEffectiveRole(uuid)` for gameplay decisions; `getActualRole(uuid)` only for identity checks. | A victory-check loop over `Bukkit.getOnlinePlayers()`. | `gameManager.activePlayers()`. |
| 3.8 | **Tests & mockability.** Wrap `Bukkit.*`-touching static fields in `by lazy`. Mock managers directly (`GDKGameRolesManager`, etc.) — avoid mocking `GDKMain` / `JavaPlugin`. Use `mockStatic(Bukkit::class.java).use { ... }` for static accesses. Tests must not require external `.env` / config files. | A `companion object`'s `val FOO = GDKItems.Builder(...).build()` that triggers `Bukkit.getItemFactory()` at class load. | `companion object { val FOO by lazy { GDKItems.Builder(...).build() } }`. |
| 3.9 | **OpenAPI specs (JungleWeb / UHC-API)** carry concrete examples and default values, not just types. Cached / complex object shapes get a named type, not anonymous inline. | A spec field declared `type: string` with no example. | `type: string\nexample: "v1.4.2"\ndefault: "latest"`. Inline anonymous types → declared `data class CachedFoo(...)`. |

## Output template

```markdown
### Code review — <branch / PR title>

<one-line direction summary: "Solid refactor; 2 blocking issues around Sorcière state, 5 nitpicks on Kotlin idioms, 1 todo on screenshots.">

**Blocking (N)**
1. **`path/File.kt:L12-L18`** — Title
   <what's wrong + why>
   ```kotlin
   // before
   ...
   // after
   ...
   ```
2. ...

**Nitpicks (N)**
- ...

**Todo (N)**
- ...

**Positives**
- <e.g. "Naming on the new `revivePlayer(...)` overload reads cleanly; no alias passthrough added.">

🤖 Generated with /alta-review
```

## When NOT to apply a finding

- The user's `CLAUDE.md` explicitly silences the rule (e.g. lint-disable comment, project-specific override).
- The line was not modified in this diff (pre-existing issues are out of scope unless severity is high enough to block merge regardless).
- A linter / type-checker / CI step already covers it (don't duplicate; trust the pipeline).
- The "fix" would balloon the PR's scope. Note as a `todo` instead.

## Tone

- Specific, grounded in the diff. No "this could be cleaner" without showing what cleaner is.
- Bilingual is fine — match the PR's language. Most JungleUHC reviews are in French; UHCGDK varies.
- Educational, not punitive. When the contributor is junior, link Kotlin docs and explain the *why*. Patient over multiple cycles.
- Surface positives. A review with only blockers is harder to action than one with positives + blockers.
- Never "AI co-author" the suggestions in commit messages — it's a project rule.

## Red flags — STOP and reconsider before posting

- A finding without a code excerpt → re-read the diff and quote the actual lines.
- A "do this instead" with `...` placeholders → finish the snippet; it must compile.
- More than ~10 findings on a single small PR → you're piling on; group + summarize.
- Flagging a pre-existing issue as blocking → unless it's a true severity, scope it as `todo`.
- Citing a rule the project's `CLAUDE.md` explicitly contradicts → defer to the project.
