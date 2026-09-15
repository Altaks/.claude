# Backend

Services, APIs, use cases. Read with `architecture.md` (the layering) and `data.md` (the persistence
side). Every error message and every field name a client reads is user-facing: `ui-ux.md` governs the
wording.

## Module shape

One module per bounded context, named after the domain (`players`, `profiles`, `sanctions`,
`artifacts`), each holding `domain/` `application/` `infrastructure/`. Never a module grouping by
mechanism.

- **domain/**: entities, value objects, aggregates, domain services, and the ports as abstract
  classes. Pure language, no framework import.
- **application/**: one use case per intent. It depends on ports only, orchestrates the domain, and
  never touches I/O itself.
- **infrastructure/**: repositories, transport controllers, external clients, mappers.

Bind the port to its adapter in the module file. Application code injects the port token, never the
concrete class. Follow the project's DI style: framework constructor injection where that is the
convention, module-level imports where it is not. Do not mix the two in one repository.

## Use cases

- One use case answers one intent. If it needs an "and" in its name, split it.
- **Business invariants live in the aggregate**, not in the use case and never in the route. The use
  case loads the aggregate, calls a method on it, saves it.
- **Domain events are emitted by the domain**, not by the use case that triggered it. Every event
  extends one shared base type.
- Repositories load and save **whole aggregates**, never half of one.
- Fetch only what the use case needs. Do not pass more data than required, and do not load a full
  aggregate to read one field.
- **CQS**: a command does not return the updated entity. The caller re-fetches when it needs to.

## Errors

The error taxonomy is the first thing to check in review, and getting it wrong is usually blocking.
Four distinct situations, four distinct classes:

| Situation | Class |
|---|---|
| Caller lacks permission | the forbidden / unauthorized error |
| A business rule forbids it in the current state | the invalid-operation error |
| Already in the target state, idempotency | the conflict error |
| The requested resource does not exist | the not-found error |

Corrupted or missing internal data is **not** not-found: that is an unexpected error and it must be
loud. Error classes never carry a transport status code; the middleware maps them.

Never swallow: every catch logs through the project logger with structured context. Never silently
no-op: throw explicitly for an already-in-state condition. A missing permission check on a use case is
blocking.

## API surface

- Never return a raw domain object. Map to a DTO / resource in the transport layer.
- Separate read types from write types (resource versus create / edit payloads).
- All fields present on a resource, `null` rather than absent, so clients stop guessing.
- Do not prefix fields inside a nested object (`name` inside `candidates[]`, not `candidateName`).
- Never expose a secret, a key or an internal id that leaks another tenant's existence.
- Validate at the boundary with a schema, inside the transport adapter, before crossing into the
  application layer.
- HTTP semantics: `POST` / `PUT` for actions, `201` only when something was created, `204` for a
  mutation with nothing to return, do not pass `200` explicitly.
- Transport method names match the contract exactly when the mapping is positional; a typo breaks the
  wire silently.

## Performance is a design decision

- Flag N+1 as a defect, not an optimisation opportunity. A targeted query beats loading an aggregate
  to read one field.
- Independent async operations run in parallel, not sequentially.
- Per-request overhead is scrutinised: fetching a full user and account on every request where an
  indexed boolean would do is a finding.
- Cache at construction. Re-reading configuration per request, per item or per click is blocking.
- Watch for unbounded in-memory collections tied to a connection lifetime: that is a leak, not a
  cache.

## Client-facing language

Error messages and UI copy are part of the API.

- Avoid "you": it reads as blaming.
- Avoid internal vocabulary that means something else to the reader (a word like "admin" often means
  something different to a customer than to the team). Name the team or the role the reader knows.
- Match the product's language, with correct grammar and accents.
- No space before a colon in English.

## Definition of done

Run what CI runs, for every package touched: the type check, the lint, the tests. Do not rely on the
pre-commit hook. Then review your own diff before asking anyone else to.
