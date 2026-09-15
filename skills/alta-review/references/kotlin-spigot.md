# Stack layer: Kotlin / Spigot / Minecraft

Loaded by `alta-review` when the diff is a Kotlin/Spigot plugin (the user's UHCGDK / JungleUHC work and
any similar project). Applies **on top of** the generic Layers 0-2 in `SKILL.md`. Names like
`GDKGameManager`, `GDK_PREFIX_*`, `rolesManager` are examples from the user's codebase; the project's own
`CLAUDE.md` is authoritative when it differs. For the in-game UI/UX design language and the client
rendering constraints, the source of truth is `alta-dev`'s `references/roles/minecraft-ui.md` (and
`languages/kotlin.md` for Kotlin idioms) when that skill is present.

## Kotlin idioms (detail behind Layer 1)

| # | Rule | Smell | Do instead |
|---|---|---|---|
| K.1 | **Zero `!!`.** (Layer 1.2, Kotlin form.) | `event.player.itemInHand!!`, `Bukkit.getPlayer(uuid)!!`. | `val item = event.player.itemInHand ?: return`. At trusted boundaries `require(player.isOnline) { "player offline" }`. Java-interop `T!` is nullable; never trust the `!`. |
| K.2 | **Idiomatic stdlib.** (Layer 1.6.) | `for (s in services) sum += s.players`; `list.filter { it != null }.map { it!! }`; chained `else if`. | `services.sumOf { it.players }`; `list.filterNotNull()`; `when {}`. Also `buildList {}`, `buildString {}`, `.unzip()`, `hashMapOf()` over `HashMap<K,V>()`. |
| K.3 | **`const val` for compile-time primitives.** | `val SLOT = 8` at file scope. | `private const val NAV_TOOL_SLOT = 8` so the compiler inlines it. |
| K.4 | **`private` by default, widen with justification.** (Layer 1.7.) | `internal` on a manager method only the same module calls. | Start `private`; `internal` when another class in the module needs it; `public` only for a consumer plugin/module. |

## Spigot / framework rules

| # | Rule | Smell | Do instead |
|---|---|---|---|
| S.1 | **Use the project's constants and builders.** No re-invented ticks, item stacks, or material sets. | `private const val PVP_TICKS = 6000L`; `ItemStack(Material.X).apply { val m = itemMeta; m.setDisplayName(..); itemMeta = m }`. | `GDKConstants.Time.minutesToTicks(5)`; `GDKItems.Builder(Material.NETHER_STAR, 1, name).addLore(..).build()`; `MaterialSets.ORES`. |
| S.2 | **Symbol / shared items are `companion object` `by lazy`, not instance `var`.** | `class FooScenario { private var symbol = buildSymbol(...) }`. | `companion object { val SYMBOL by lazy { buildSymbol(...) } }`. |
| S.3 | **`syntax()` / `examples()` / `tabComplete()` stay in sync; `examples()` is not optional.** | `syntax()` lists `<a\|b>` but `tabComplete()` suggests only `a`; a sub-command with no `examples()`; an inline `"§cUsage: ..."`. | Suggest every accepted token; add `override fun examples()`; on bad arity reply `${GDK_PREFIX_ERROR} ${syntax()}`. Color: command `AQUA`, required `WHITE`, optional `GRAY`. |
| S.4 | **Broadcast uses `Bukkit.broadcastMessage(...)`.** | `Bukkit.getOnlinePlayers().forEach { it.sendMessage(text) }`. | `Bukkit.broadcastMessage(text)`. Reserve manual loops for filtered audiences. |
| S.5 | **Right game-state accessor.** | A victory check looping over `Bukkit.getOnlinePlayers()`. | `gameManager.activePlayers()` for in-game logic (excludes spectators / eliminated); `Bukkit.getOnlinePlayers()` only for "everyone connected". `getEffectiveRole(uuid)` for gameplay, `getActualRole(uuid)` only for identity. |
| S.6 | **Registry is the single source of truth.** (Layer 2.3, Spigot form.) | `class LgRoleSubCommand(private val sorciere: SorciereRole)`; `role === sorciereInstance`. | Inject the registry; `rolesManager.getById("lguhc:sorciere")`; compare through the registry handle. |
| S.7 | **Lifecycle via custom events, not direct module→role calls.** (Layer 2.4, Spigot form.) | `module.onGameStart { sorciere.activate(); chasseur.activate() }`. | Roles are `Listener`s on `UHCGameStartEvent` etc.; the module fires the event, roles react. |

## In-game UI constraints (client rendering)

Full design language: `alta-dev` `references/roles/minecraft-ui.md`. The review checks:

| # | Rule | Smell | Do instead |
|---|---|---|---|
| U.1 | **1.8.8 chat width.** ~320 px at scale 1.0; target ~296 px. | A line that wraps mid-token in the real client. | Budget the width with a named cap; test in the real client. |
| U.2 | **Glyphs that render.** Unicode arrows (`→` `➡`) are unreliable. | `${ChatColor.DARK_GRAY}→ ${role}`. | `»` / `«`; list markers `·` or `-`. |
| U.3 | **Whitespace stripping.** Legacy `sendMessage(String)` strips trailing whitespace. | A strikethrough/underline run open at the line edge. | Close the formatting run before the edge. |
| U.4 | **Scoreboard entry cap.** Per-version length limit (color codes count, 2 chars each). | A label that overflows once `…` is appended. | Substring-and-ellipsis with a named cap that accounts for color codes. |
| U.5 | **Colour is a role, not the only signal.** | Meaning carried by `§c` vs `§a` alone. | A consistent prefix system (`GDK_PREFIX_*`), colour paired with a symbol or word. |

## Tests and mockability

| # | Rule | Smell | Do instead |
|---|---|---|---|
| T.1 | **Wrap `Bukkit.*`-touching static state in `by lazy`.** | `companion object { val FOO = GDKItems.Builder(...).build() }` triggering `Bukkit.getItemFactory()` at class load. | `val FOO by lazy { GDKItems.Builder(...).build() }`. |
| T.2 | **Mock managers directly; static access via `mockStatic`.** | Mocking `GDKMain` / `JavaPlugin`; a wrapper inserted only so a test can stub it. | Mock `GDKGameRolesManager` etc.; `mockStatic(Bukkit::class.java).use { ... }`. Tests need no external `.env` / config. |

## Adjacent specs

- **OpenAPI (JungleWeb / UHC-API)**: fields carry concrete `example` and `default`, not just `type`. Cached / complex shapes get a named `data class`, not an anonymous inline type.
