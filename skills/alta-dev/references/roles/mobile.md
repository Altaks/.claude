# Mobile

Flutter, Android, iOS. **Read `ui-ux.md` first**, it is mandatory for anything a human sees. Then
`frontend.md` (component discipline) and `architecture.md` (layering).

## Project layout

The split that works, whatever the framework:

```
logics/            everything testable without a screen
  model/           domain types and their enums (one enum per closed set)
  cubit|store/     one folder per feature: the state holder plus its state type
  services/        api client, storage, preloading, device access
  adapter/         translation between the transport shape and the domain model
  provider/        cross-cutting app state: theme, fonts, locale
views/             atoms / molecules / organisms / pages
themes/            typography, colours, the design tokens
```

- `logics/` never imports a widget. That is what makes it unit-testable, and it is the mobile form of
  the dependency rule.
- One state holder per feature (`answer`, `chat`, `course`, `puzzle`, `navbar`), each with its own
  state type. No shared mutable global.
- Enums live next to the model they qualify and are named for what they close over
  (`course-difficulty`, `answer-state-type`, `theme-color-type`).
- The API adapter is the anti-corruption layer: JSON in, domain model out. No widget ever sees a raw
  response map.

## Platform reality

- Assets are preloaded deliberately; a first frame that waits on the network is a bug, not a
  slow phone.
- Persisted preferences go through one service, not scattered key strings. Keys are constants.
- Offline and error paths are designed: every screen has a loading, an empty and a failure state.
- Respect the platform back gesture, safe areas, and the system text scale. A layout that breaks at
  200% text scale is broken.
- Accessibility settings (contrast mode, font choice) are first-class app state, not a hidden toggle,
  when the audience needs them.

## Fixtures and content

Content that changes without code (courses, dialogs, levels, copy) lives in data files or in the
backend, not in `if` chains. Ship a local fixture set so the app runs and tests run without a server.

## Quality gate

- The linter config is committed and the analysis passes with no ignored rules.
- Tests run headless: `flutter test` (or the platform equivalent) plus coverage, and the coverage
  report is generated and readable (`lcov` to HTML) rather than a number nobody looks at.
- Generated API documentation (`dart doc` or equivalent) is part of the deliverable and the README
  says how to produce it.
- A static analysis quality gate runs in CI and its status is visible from the README.
- A UI change is verified on a real device or emulator and screenshotted in the PR.
