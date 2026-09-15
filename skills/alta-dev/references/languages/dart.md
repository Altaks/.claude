# Dart et Flutter

## The boundary that matters

`logics/` never imports a widget. That single rule is what makes the application testable without a
device, and it is the mobile form of the dependency rule.

```
lib/
  logics/
    model/       domain types, one enum per closed set, named for the set they close
    cubit/       one folder per feature: the state holder plus its own state type
    services/    api client, storage, preloading, device access
    adapter/     transport shape in, domain model out. The anti-corruption layer.
    provider/    cross-cutting app state: theme, fonts, locale
  views/
    atoms/       one element, no domain knowledge
    molecules/   a few atoms with one job
    organismes/  a meaningful block
    pages/       route-level composition
  themes/        typography, colours, tokens
  assets/constants/
```

## State

- One state holder per feature, each with its own explicit state type. No global mutable blob.
- Model the state as a closed set (a sealed hierarchy or an enum plus payload), not a pile of booleans
  that can encode `isLoading && isError && hasData`.
- Derived values are computed from the state, never stored beside it and synced by hand.
- Emit a new immutable state rather than mutating; `copyWith` on a value class.

## Types and idioms

- Sound null safety used deliberately: no `!` to silence the analyzer. Early-return on null, or model
  the value as non-null.
- `final` by default, `const` constructors wherever the widget allows it (it is a real rebuild
  optimisation, not a style point).
- Enums for closed sets, with the enhanced-enum members when a variant carries data or behaviour.
- Named parameters with `required` for anything with more than two arguments. A positional boolean is
  unreadable at the call site.
- `sealed` classes plus exhaustive switch expressions for state and result types.
- Prefer the collection methods and collection-if / collection-for over building a list imperatively.

## Widgets

- Compose small widget classes rather than helper methods returning widgets: a class gets its own
  element, its own `const`, and its own rebuild scope.
- An atom takes parameters and emits callbacks, and knows nothing about the domain. Data fetching lives
  at the organism or page level, or in the state layer.
- Every screen designs its loading, empty and failure states. A screen that renders nothing on failure
  is a bug.
- Respect the platform: safe areas, back gesture, and the system text scale. A layout that breaks at
  200% text scale is broken.

## Services and data

- One service per external concern (API, persisted preferences, asset preloading). Keys are constants
  in one place, never scattered string literals.
- The adapter maps the transport shape to the model. No widget ever sees a raw response map.
- Ship a local fixture set so the application runs and the tests run without a server.
- Content that changes without code (courses, dialogues, copy) lives in data files or the backend.

## Gate

- `analysis_options.yaml` committed, analysis clean, no ignored rules without a written reason.
- `dart format` applied.
- `flutter test` plus `--coverage`, with the report generated into readable HTML rather than a number
  nobody opens. The README says how.
- `dart doc` wired, and the README says how to produce and open the documentation.
- A static analysis quality gate in CI whose status is visible from the README.
- A UI change is verified on a device or emulator and screenshotted in the PR.
