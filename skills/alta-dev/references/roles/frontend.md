# Frontend

Web UI. **Read `ui-ux.md` first**: it is mandatory for anything a human sees, and it decides what this
document then implements. Read also with `architecture.md` (state modelling) and `mobile.md` (the same
component discipline in a different runtime).

## Direction and preview (before any code)

- **Have a point of view; do not ship AI slop.** Load the design language first: the `impeccable` skill
  when it is enabled, otherwise `frontend-design`. Decide the mode, the one adjective the surface should
  feel, and the reference it is not. Distinctive typography, a deliberate colour system (not the
  framework defaults), decided spacing, one memorable detail. Avoid the tells: centered hero over three
  equal cards, untouched component-library styling, evenly grey everything, gradient on everything.
- **Preview before you build.** A single screen or component goes in an **Artifact** (live HTML,
  `artifact-design` for the pass, `dataviz` for charts); a multi-screen flow or several directions go in
  the **Claude Design** canvas (the `design` skill). The user signs off on the preview, then you code.
- Consistency is not monotony: build hierarchy by varying weight and scale, not by flattening everything.

## Component hierarchy: atomic design

Structure the view layer by composition level, not by page:

```
atoms/        one element, no business meaning: button, dot, chip, switch, text field
molecules/    a few atoms with one job: search field, progress bar, popup, header
organisms/    a meaningful block: card list, navbar, an activity, a form section
pages/        route-level composition, wiring organisms to state
```

Rules that make it work:
- An atom knows nothing about the domain. It takes props and emits events.
- A component at level N composes level N-1; it does not reach two levels down for layout.
- If a molecule needs domain data, it receives it. Data fetching lives at the organism or page level,
  or in the state layer, never in an atom.
- The folder tells you the blast radius of a change. Editing an atom is a design-system change and
  deserves that scrutiny.

## State

- One state holder per feature, with its own explicit state type. Not one global blob.
- Model states as a closed set (a discriminated union or an enum plus payload), not a pile of
  booleans that can encode impossible combinations (`isLoading && isError && data`).
- Derived values are computed from state, never stored beside it and synced by hand.
- Keep the state layer free of view types: it should be testable without rendering anything.

## Data access

- Through hooks or services, never an inline fetch in a view.
- The client is generated from the API contract where one exists, and the generated mocks feed the
  tests and the local sandbox. Hand-written duplicates of a generated client drift.
- Translate the transport shape into a view model at the seam. A component should not know the wire
  format.
- Every request has a loading state, an error state and an empty state, and all three are designed,
  not accidental.

## Styling

- Utility classes or the project's design system over bespoke CSS. Consistency beats local elegance.
- Extract a literal into a named token as soon as it is used twice, and put it where the design system
  lives, not next to the component.
- Do not invent a raw theme value in passing. If a shade is needed, name it, justify it, and check it
  does not read as something else (a `dark` shade is not a dark-mode variant).
- **Contrast is correctness.** Check the ratio against **WCAG 2.2 AA** before shipping a colour pair.
  Small or bold text on a tinted fill routinely lands below the AA threshold; measure rather than
  eyeball, and state the ratio in the PR when you change one.
- Story or sandbox-only utilities never leak into the production bundle.

## Budgets de performance

**A budget that is not enforced is a wish.** Declare the numbers, check them in CI, and fail the build
when they are exceeded. Otherwise every release adds a little and nobody is ever responsible.

- Budgets worth declaring: JavaScript shipped per route, total transferred weight for the first view,
  image weight, number of font files, and the field metrics for loading, interactivity and layout
  stability.
- **Measure what the user feels**, on a mid-range device and a throttled network, not on the developer
  machine. Laboratory numbers on a fast laptop are marketing.
- **Ship less before optimising what you ship.** Route-level code splitting, lazy loading below the
  fold, importing the function rather than the barrel that drags the whole library, and dropping the
  polyfills the supported browsers do not need.
- **Third-party scripts are the usual cause.** Each one is a decision with an owner and a measured
  cost, loaded deferred, and removed when its owner cannot justify it.
- Images: the right format, the right dimensions, explicit width and height so nothing shifts, and lazy
  loading outside the first view.
- Fonts: subset them, preload only what the first view needs, and pick a fallback that does not move
  the text when the real font arrives.
- Render cost: virtualise long lists, and memoize only where a profile showed the re-render. Memoizing
  everything is its own cost and it hides the real problem.
- A performance regression is a defect, reported like one, with the before and after numbers.

## Correctness and hygiene

- No `any`. Handlers are proper functions, not arrow properties on a class, where the framework
  distinguishes them.
- Never leave a component that silently renders nothing on failure: surface the error.
- Remove dead components without mercy; an unused variant is a maintenance tax and a design lie.
- Keys, focus order, labels and keyboard paths are part of the component, not a later pass.

## Verify by looking

A UI change is not verified until it has been run and looked at in a browser at the sizes the product
supports. Attach before / after screenshots to the PR, and say which viewport. An end-to-end smoke
test over the rendered pages catches the ones you did not open.
