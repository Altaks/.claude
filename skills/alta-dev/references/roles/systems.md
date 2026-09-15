# Systèmes, bas niveau et performance

C, C++, Rust, anything with manual resource management or a measured hot path. Read with
`architecture.md` (module boundaries) and `iot-and-embedded.md` (the constrained variant).

## Modules without a module system

In C and C++ the directory and the header **are** the module system. Use them deliberately:

- One directory per concern (`network/`, `network/dialog/`, `logging/`, `files/`, `util/`), nested when
  a concern has sub-parts.
- Each unit is a `.c` / `.h` pair. The header is the public interface: only what callers need. Anything
  else stays `static` in the implementation file.
- One shared types header for the vocabulary types, included by everyone, owning nothing else.
- Include guards or `#pragma once` everywhere; no header depends on being included after another.
- No global mutable state unless the platform forces it. When it does (interrupt-driven code), isolate
  it in one place with a documented access discipline.
- The build file lists the modules explicitly, so the dependency graph is visible in one place.

## Resources

- Every acquisition has exactly one owner and one release path. In C, the function that allocates
  documents who frees. In C++ and Rust, express it in the type (RAII, ownership) so it cannot be
  forgotten.
- Check every fallible call. An unchecked allocation, read or system call is where the crash comes
  from.
- Bound every buffer and every loop that consumes input. Length before content, always.
- Close what you open, on the error path too. That is what makes early returns safe.

## Rust specifics

- Workspace with one crate per responsibility; dependencies declared once at the workspace level and
  inherited. The core crate has no UI or framework dependency.
- Clippy clean with all targets and all features is part of the gate, not an optional pass. Formatter
  config committed and applied.
- Model the closed sets as enums and match exhaustively. Make invalid states unrepresentable rather
  than validated at runtime.
- Errors are typed and propagated; reserve panics for genuine invariant violations, never for expected
  failure.
- Prefer borrowing over cloning on hot paths, but reach for a clone rather than a lifetime puzzle in
  cold code. Clarity first, then measure.
- Do not pull in a heavyweight runtime for a layer that does not need one.

## Performance: measure, then change

The cardinal rule mirrors the safety net: **profile first**. Optimising on a hunch trades readability
for nothing. Confine optimisation to the paths that actually matter (the tick loop, the packet path,
the per-request middleware, the inner transform) and leave cold code readable.

In order of payoff:

1. **Algorithmic complexity.** Usually a data-structure problem in disguise. A repeated linear scan
   that should be a hash lookup beats every micro-optimisation. Hunt nested loops over the same
   collection and derived data rebuilt from scratch on each call.
2. **The right structure for the access pattern.** Contiguous storage for iteration, a deque for a
   queue, a hash map for lookup, an ordered structure only when order is genuinely needed, a
   specialised map when the keys are a small closed set. Pre-size when the final size is known.
3. **Allocation in hot loops.** Per-iteration allocations feed the collector or the allocator. Watch
   capturing closures, iterator and stream machinery on tiny collections, boxing of primitives, string
   concatenation in a loop. Hoist loop-invariant work out; memoize what is recomputed.
4. **Memory layout.** For very many small objects, header and pointer overhead dominates: flatten,
   prefer primitives, and in extreme cases lay out as arrays of fields rather than an array of objects.
5. **Leaks.** References parked in a long-lived map or tied to a connection lifetime and never evicted.

Watch for observable side effects when swapping a structure: if any caller relied on iteration order,
that is a behaviour change, not an optimisation. Leave a short comment on any non-obvious optimisation
saying what the profile showed, so the next reader does not simplify it away.

## Concurrency

- Name the threading model in the module's documentation: which functions may be called from where.
- Where a platform is single-threaded by contract (a game main thread, a UI thread), off-thread work
  hops back through the platform's scheduler before touching shared state. Moving a call off that
  thread is never a pure refactor.
- Prefer message passing and ownership transfer to shared mutable state with a lock. When a lock is
  needed, document what it protects and the acquisition order.
- Anything long-running is cancellable and leaves a consistent state when cancelled.
