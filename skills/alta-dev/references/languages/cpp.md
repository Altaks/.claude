# C++

Read `c.md` for the module and header discipline: it applies unchanged. This file covers what C++ adds.

## Express ownership in the type

- RAII for everything: files, sockets, locks, textures, allocations. If a destructor can release it, no
  manual release call should exist.
- `unique_ptr` by default, `shared_ptr` only when ownership is genuinely shared and you can name the
  owners. A raw pointer means "observing, not owning", and never appears in a signature that transfers
  responsibility.
- Rule of zero: write no destructor, copy or move operations unless the class manages a resource
  directly. If you write one, write them all.
- Pass by `const&` for anything non-trivial; by value only when you intend to take a copy.
- Containers and `string` over raw arrays and buffers. `string_view` and `span` for non-owning views,
  with their lifetime documented.

## Types and modelling

- `enum class` for closed sets, never a bare enum or an int constant.
- A base class with virtual behaviour for a family of variants, so adding a variant is a new file, not
  another branch. Mark the overrides `override`, and the leaf classes `final`.
- `constexpr` constants in a dedicated header rather than macros. Reserve macros for what only the
  preprocessor can do.
- `auto` where the type is obvious from the right-hand side, spelled out where it is not.
- `std::optional` for absence, a typed error or an exception for failure. Do not overload a sentinel
  value.
- The standard algorithms over hand-written loops when they say what you mean.

## Structure in a framework project

- Separate the model from the rendering, whatever the toolkit. A game object knows its state and its
  rules; the widget or scene item draws it. That split is what lets the logic be tested without a
  window.
- Content out of code: levels, layouts, dialogue and thresholds live in data files loaded at startup.
  A level defined by a JSON file is a level a designer can change; a level defined by a constructor is
  not.
- One class per file, matching names, headers declaring only what callers need.
- Resource loading goes through one loader rather than being scattered, so paths and caching live in
  one place.
- Follow the framework's own idioms for signals, ownership and the main loop rather than inventing a
  parallel mechanism next to them.

## Performance

Measure before touching anything. Then, in order of payoff: algorithmic complexity, the right container
for the access pattern, allocation in hot loops, memory layout. Reserve capacity when the size is
known. Watch for copies hiding in range-based loops (`for (auto x : v)` copies) and in lambda captures.
Leave a comment on any non-obvious optimisation saying what the profile showed.

## Build and gate

- One build definition a stranger can run from the README, listing the modules explicitly.
- Warnings on and treated as errors once clean. Sanitizers in development and in CI.
- A formatter configuration committed and applied.
- Unit-test the logic that does not need the framework; that is most of it once the model is separated.
