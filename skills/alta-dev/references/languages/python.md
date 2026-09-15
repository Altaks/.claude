# Python

Services, pipelines, orchestration, scripts, and the exploratory work that feeds them.

## Typing is not optional

- Type hints on every function signature and every dataclass field. A module without them is a module
  nobody can refactor safely.
- Run the type checker in CI, not as a local courtesy.
- `dataclass` (frozen where it can be) or a validation model for structured data, never a bare `dict`
  passed between layers. A `dict[str, Any]` crossing a module boundary is the same defect as `any` in
  TypeScript.
- `Enum` for closed sets, `Literal` for a small closed set of values, `Protocol` for a port you want to
  substitute in tests.
- `Optional` means the absence is meaningful; do not use `None` as a silent error channel.

## Idioms

- Comprehensions and generator expressions over accumulate-in-a-loop, but a loop when the comprehension
  stops being readable.
- `pathlib` over string path manipulation. `enumerate`, `zip`, `itertools` rather than index
  arithmetic.
- Context managers for anything that must be released; write your own with `contextmanager` rather than
  a try/finally repeated at five call sites.
- **Never a mutable default argument.** `None` plus a body default.
- f-strings for formatting, except in log calls, where the message stays static and the values go as
  arguments or structured fields.
- Prefer the standard library before adding a dependency: `datetime`, `pathlib`, `itertools`,
  `functools`, `collections`, `concurrent.futures` cover a lot.

## Structure

- One package per concern, mirroring the feature split rather than a technical one. No `utils.py` that
  becomes a landfill.
- Pure logic separated from I/O, so it is testable without a database, a network or a scheduler.
- The entry point does argument parsing, configuration loading and wiring, then calls into the library.
  Logic in `__main__` is logic nobody can test.
- Configuration parsed once into a typed object and validated there. Secrets from the environment,
  never from a committed file.

## Errors and logging

- Catch the specific exception, never a bare `except`. Never swallow: log with context and re-raise or
  handle deliberately.
- The `logging` module with a per-module logger, never `print` in library code. Values go as structured
  extras rather than concatenated into the message.
- Fail loud on an unexpected state: a pipeline that quietly produces an empty result is worse than one
  that stops.

## Data work and pipelines

- Notebooks are for exploration. Anything scheduled, reused or load-bearing graduates into reviewed,
  tested modules; the notebook then imports it instead of duplicating it.
- Transformations are pure functions of their inputs where possible, so a run can be replayed.
- Tasks are idempotent and restartable: a partial failure must not double-count.
- Validate the shape on ingest and fail loud, because an upstream schema change is silent otherwise.
- Migrations are versioned and reviewed, never applied by hand.

## Tooling and gate

- Dependencies pinned in a lockfile, in a virtual environment. The project states one way to install and
  one way to run.
- Formatter and linter committed and part of the gate, no ignored rules without a written reason.
- `pytest` with parameterised cases over loops, fixtures for setup, and no test that depends on another
  test's leftovers. Seed any randomness and report the seed.
- Same doctrine as everywhere: assert the exact value, prove the test bites by reverting the change,
  never mock the thing under test.
