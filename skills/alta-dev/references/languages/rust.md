# Rust

## Workspace layout

One crate per responsibility, dependencies declared once and inherited:

```toml
[workspace]
resolver = "3"
members = ["libs/kernel", "libs/database", "libs/proto", "server/api", "_tools/seeder"]

[workspace.package]          # version, edition, rust-version, license, authors, repository
[workspace.dependencies]     # every third-party pin, plus path deps for member crates
```

- Group the members by role with a comment (tools, executables, libraries), so the tree is readable.
- Member crates depend on each other by path through the workspace dependency table, never by an
  inline path in one crate.
- Edition and `rust-version` pinned at the workspace level. A crate that needs a different one is
  suspicious.
- The core crate holds the logic and has **no UI, no framework, no runtime dependency it does not
  need**. The shell crate depends on it. This split is what makes the tests run without a display.
- Fill in the package metadata (description, repository, license, keywords, categories) even for a
  private crate: it is the cheapest documentation there is.

## Types

- Make invalid states unrepresentable. An enum with data beats a struct of optional fields plus a
  runtime check.
- Match exhaustively. Reach for a catch-all arm only when the set is genuinely open, because the
  compiler error on a new variant is the feature.
- Newtypes for domain primitives rather than passing `String` and `u64` around.
- Traits for the interchangeable backends (one implementation per protocol, provider or driver), with
  the interface expressed at the level of the caller's intent. Add a backend by adding a file, never a
  branch.
- Prefer `impl Trait` and generics over boxing on hot paths; box when the flexibility is the point.

## Errors

- Typed errors propagated with `?`. A library exposes an error enum; a binary can flatten to a report
  type at the top.
- `panic!`, `unwrap` and `expect` are for genuine invariant violations, and each one deserves a message
  saying which invariant. An `unwrap` on external input is a bug.
- Never swallow: an error that becomes an empty `Vec` looks like data.

## Ownership and performance

- Borrow on hot paths; clone in cold code rather than fighting lifetimes into unreadability. Clarity
  first, then measure.
- Pre-size collections when the final size is known. Prefer contiguous storage for iteration, a hash map
  for lookup, an ordered structure only when order is required.
- Iterators over manual index loops, but a plain loop is fine on a **measured** hot path.
- Leave a comment on any non-obvious optimisation saying what the profile showed.

## Async

- Do not pull a full async runtime into a crate that does not need one. The core library should compile
  and be testable without it where possible.
- Async traits at the interchangeable-backend boundary.
- Every long operation is cancellable and leaves a consistent state.
- Bound your channels. An unbounded channel is a memory leak with a queue in front of it.

## Tooling and gate

```
cargo check --workspace --tests
cargo clippy --all --all-targets --all-features
cargo fmt
cargo test --workspace
cargo test --workspace --all-features
```

- Clippy clean is part of the gate, not an optional pass. The formatter config is committed and
  applied.
- A task runner exposes each of those with a short alias, plus the targets that bring up the local
  services integration tests need. Integration tests **depend on** that target rather than being
  skipped when the service is absent.
- Dependency hygiene runs on its own scheduled workflow: an advisory audit and an outdated check, daily
  as well as on lockfile changes.
- Speed up the build honestly (a faster linker, a compiler cache) rather than by cutting checks.
- The lockfile is committed. Builds are reproducible or they are not verifiable.

## Tests

Unit tests next to the code for pure logic, integration tests in `tests/` for the crate's public
surface. Seed any randomness and report the seed. Same doctrine as everywhere: the test must go red
when the change is reverted.
