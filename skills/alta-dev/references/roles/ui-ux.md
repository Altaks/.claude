# UI et UX

**Obligatoire dès qu'un humain voit le résultat.** A screen, a form, a command output, a chat message,
an error string, a notification: all user-facing, and the experience is part of the specification,
decided in Phase 1, not patched in once the implementation works.

The rule this enforces: **a feature that works but that nobody can understand, find or recover from is
not finished.** Read alongside the surface's own document (`frontend`, `mobile`, `desktop-and-cli`,
`gameplay`, `minecraft-ui` for in-game surfaces, `backend` for client-facing wording).

**Preview before code.** For anything visual, the experience is shown before it is built: a web screen
or component as an **Artifact**, a multi-screen flow or several directions as a **Claude Design** canvas
(the `design` skill), an in-game surface as a text mockup per `minecraft-ui`. Design direction and the
anti-slop stance come from the `impeccable` skill when enabled, otherwise `frontend-design`.

## 1. Toute action se confirme visiblement

P9 applied to people. A silent return is a bug, whatever the code does afterwards.

- **Success and failure both produce something the user perceives.** Logs are secondary; users do not
  read them.
- The confirmation says what actually happened, in the domain's terms, not "the operation completed".
- A refusal says **why**, and what would make it work: the limit reached, the state required, the
  missing permission, when it reopens. "Action impossible" is not an error message.
- Never a stack trace, a bare error code, or an internal identifier as the whole message.
- Proportionate: inline for a small action, persistent for something destructive or asynchronous.

## 2. Les quatre états de toute surface

Design all four before building any. Three of them are where products fail.

| État | La question | L'échec courant |
|---|---|---|
| **Vide** | First use, no data. What does the user learn here? | A blank area that looks broken. The empty state is where a feature teaches itself. |
| **Chargement** | What is shown while waiting, and after how long? | A frozen screen, or a spinner flickering for 80 ms. |
| **Erreur** | What went wrong, and what can the user do now? | A silent failure, or a message written for the developer. |
| **Peuplé** | The normal case, including the long list, the long name, the missing optional field. | Designed for three items and one short name. |

## 3. Les mots sont l'interface

- The audience's language, correct grammar and accents. A typo in the product reads as carelessness in
  the product.
- **The domain's vocabulary, never the implementation's.** Say what happened to the user; internal
  concepts stay internal.
- **No blame**: avoid "you" in an error. The system reports a situation, it does not accuse.
- **No internal role vocabulary.** A word meaning one thing inside the team can mean something else to
  the reader. Name the team or role the reader knows.
- One term per concept everywhere: interface, documentation, errors, API. Two words for one thing is a
  bug report waiting to be filed.
- Typographic rules of the content language are part of correctness.

## 4. Accessibilité, pas une option

The floor is **WCAG 2.2 AA**, and it is a blocking category for user-facing work.

- **Contrast is measured, not eyeballed.** Check the ratio against WCAG 2.2 AA before shipping a colour
  pair and state it in the PR when you change one. Small or bold text on a tinted fill routinely lands
  below AA while looking fine on the designer's screen.
- **Semantic structure**: real landmarks, headings in order, lists, and buttons vs links by role, not a
  pile of styled `div`s. ARIA only to fill a genuine gap, never to paper over the wrong element.
- The layout survives the system text scale up to 200%, and the smallest supported viewport.
- Every interactive element has an accessible name, a visible focus state, a keyboard path, and a
  target big enough to hit.
- Colour is never the only carrier of meaning: add a shape, an icon or a label.
- Respect the reduced-motion preference.
- When the audience needs them, accessibility settings (contrast mode, font choice, text size) are
  **first-class application state**, beside the theme, not a hidden toggle.

## 5. Hiérarchie et charge cognitive

- One primary action per screen or step. If everything is emphasised, nothing is.
- Show the derived value; do not make the user compute it. A progress bar rather than "17/40", or both,
  never the raw pair alone when the ratio is the point.
- Progressive disclosure: the common path immediate, the advanced options one step away.
- Defaults are a design decision: most people ship with them, so choose them, and make them safe.
- Group by what the user is trying to do, not by what the system is made of.

## 6. Cohérence

- The same component for the same job. A bespoke variant 5% nicer costs every future reader and change.
- Colours, spacing, radii and type from the design tokens. A literal used twice becomes a token.
- Follow platform conventions before inventing: back gesture, safe areas, native controls, standard
  shortcuts, shell conventions for a terminal tool.
- Wording, iconography and ordering match what the product already does.

## 7. Les contraintes du support sont de vraies contraintes

Not details to discover in production: pixel widths, character caps and truncation rules of the target
surface; glyphs the client does not render and whitespace it strips; multi-line output that must arrive
as one message or another writer interleaves into it; safe areas, notches, keyboards covering the field,
small screens, dark and light; terminal width, colour availability when piped, and stdout possibly read
by a machine.

Measure the constraint, name the constant, respect it.

## 8. Actions destructrices et récupération

- A destructive action confirms, and the confirmation names **what** will be destroyed, not "are you
  sure?".
- Prefer undo to confirmation where the system can offer it.
- Never destroy silently as a side effect. A change with a side effect the user did not ask for is
  announced before it happens (P1 surfaced in the interface).
- After a failure the user retries without redoing the work: keep the input.

## 9. Performance perçue

- A latency budget per interaction, and a designed behaviour when it is exceeded.
- Preload what the next step needs: a first frame waiting on the network is a bug, not a slow device.
- Optimistic updates only where a rollback is possible and clearly shown.
- Perceived speed beats measured speed: a skeleton matching the final layout feels faster than a
  spinner, and an immediate acknowledgement beats a faster silent operation.

## 10. Découvrabilité

- A feature nobody finds does not exist. The entry point is part of the deliverable.
- For a command surface: syntax, examples and completion stay in sync, every accepted token appears in
  both completion and examples, and a bad invocation answers with the syntax.
- Help text and the empty state are the two places a feature explains itself. Write them.

## Checklist avant de dire que c'est fini

- [ ] Every action, success and failure, produces something the user perceives.
- [ ] Empty, loading, error and populated states all exist and were looked at.
- [ ] Every message is in the audience's language, in domain vocabulary, non-blaming, actionable.
- [ ] Contrast measured; layout holds at 200% text scale and at the smallest supported size.
- [ ] Keyboard path, focus states and accessible names present.
- [ ] Components and tokens reused; nothing bespoke without a reason.
- [ ] Medium constraints (widths, caps, glyphs, safe areas) respected with named constants.
- [ ] Destructive actions confirm or offer undo, and preserve input on failure.
- [ ] It was **run and looked at**, at every supported size, with before and after screenshots in the
      PR. For a game or terminal tool, in the real client, not a mock.
