# PHP (Symfony)

## Layout

`src/` splits by building block, and each block does one thing:

```
src/
  Entity/         the model, carrying its invariants
  Enum/           one enum per closed set, never a string constant
  Repository/     the queries, one per aggregate root
  Factory/        object construction for fixtures and tests
  DataFixtures/   a runnable seed that makes a fresh database usable
  Controller/     thin transport adapters
  ApiResource/    the exposed contract when the project publishes one
```

- Entities carry the business rules. A rule enforced in a controller is a rule that will be bypassed by
  the next caller.
- Repositories own the queries. No query builder in a controller, no repository returning a raw driver
  result.
- Controllers are adapters: validate, delegate, map to a response. Nothing else.
- Configuration split per package under `config/packages/`, with per-environment overrides where they
  genuinely differ.

## Types

- `declare(strict_types=1)` everywhere. Typed properties, typed parameters, typed returns.
- Backed enums for every closed set (difficulty, category, state). A string constant is a magic value
  waiting to be misspelled.
- Value objects for domain primitives that carry rules (an identifier, a duration, a code).
- Readonly properties and constructor promotion for anything immutable.
- Never return `null` to mean an error; throw a typed exception the transport layer maps.

## Doctrine and persistence

- Migrations are generated, reviewed and committed. Never a manual statement on an environment.
- Mind the lazy loading: an N+1 in a list endpoint is the default outcome unless you fetch-join
  deliberately.
- Index what you filter and sort on, and say so in the PR when a new query depends on it.
- Fixtures built from factories, with generated values rather than hardcoded ones, so a test cannot
  depend on a magic identifier.

## Boundaries

- Validate at the edge with the framework's constraints or a schema, once, then trust internally.
- Serialization groups (or an explicit resource class) decide what leaves the application. Never expose
  an entity directly, never expose a secret, never leak an internal identifier that reveals another
  tenant.
- Security voters or attributes carry the authorization rule, declared next to the operation rather
  than scattered through the code. A route with no authorization declaration is a finding.
- Parameterised queries only.

## Tooling and gate

- The coding-standard configuration and the test configuration are committed and are the gate, not a
  suggestion.
- Composer scripts (or the project's task runner) expose the gate as one command.
- Static analysis at the highest level the codebase can hold, raised deliberately rather than left at
  the default.
- Tests through the framework's test client for anything crossing HTTP, and plain unit tests for the
  domain. Refetch from the database to prove persistence actually happened.
- Environment templates committed with every key documented; the real environment file never is.
