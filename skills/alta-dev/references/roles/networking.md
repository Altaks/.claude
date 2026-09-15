# Réseau et protocoles

Anything that crosses a wire: HTTP, gRPC, sockets, proxies, gateways, streaming. Read with
`security.md` (TLS, authentication) and `backend.md` (API semantics).

## Contract first

Two sides that must agree get a committed contract and generated stubs on both ends. Hand-written
clients drift, and the drift is silent.

- Additive changes only to a shipped message. Never reuse a field number, never change a shipped
  field's type.
- Method and field names must match the contract exactly where the mapping is positional.
- Regenerate every consumer before committing, and keep enums aligned with the database schema.
- Version the contract explicitly when a breaking change is unavoidable, and keep the old version
  serving until the last client is migrated.

## Boundaries and ports

- One port, one protocol, one purpose, documented (an HTTP port, a gRPC port, an artefact port).
  Do not multiplex unrelated concerns onto one listener because it is convenient.
- Cross-cutting concerns (request id, tracing context, authentication, tenant resolution) live in
  **interceptors or middlewares**, not copied into each handler. Their key names are constants, never
  inline strings repeated at both ends.
- A gateway or reverse proxy in front of the service owns routing, rate limiting and TLS termination.
  Keep the per-environment proxy configuration in the repository, one file per environment, so the
  difference between environments is reviewable.

## Failure is the normal case

Design the unhappy path first. Every remote call has:

- a **timeout**, always, at every layer. An unbounded call is an outage waiting for a slow dependency.
- a **retry policy** with backoff and a cap, applied only to idempotent operations. Retrying a
  non-idempotent write is how duplicates are created.
- an **idempotency key** where the operation can be replayed.
- a **typed error** at the boundary that distinguishes "not found", "refused", "conflict" and
  "the remote is broken", so callers can react differently.
- **structured logging** with enough context to correlate: request id, target, duration, outcome.

Fail loud: a network error that gets swallowed into an empty result is the worst possible outcome,
because it looks like data.

## Streams and long-lived connections

- Every subscription has an explicit lifecycle: opened, kept, closed. Register it, and unregister it
  on disconnect.
- Never accumulate per-message state for the life of a connection: retaining every id seen until the
  socket closes is a memory leak, and it is the kind that only shows in production.
- Back-pressure is part of the design. A producer faster than its consumer needs a bounded buffer and
  a documented drop or block policy.
- Heartbeats and reconnection with backoff on the client side; a stale connection must be detectable.

## Serialization

- One serialization format per boundary, declared. Do not accept three shapes "to be nice".
- Validate at the edge with a schema, then trust internally.
- Beware the transport type leaking inward: a generated message is a DTO, not a domain type. Map it.
- Binary formats and compact encodings are worth it on hot paths; measure rather than assume.

## Shading and dependency isolation

When shipping a library or a plugin into a host you do not control, relocate the networking stack you
bundle so it cannot collide with the host's own outdated copy. Consumers then import the relocated
namespace, and that relocation map is part of the contract. Do not forget the service-provider files:
a shaded jar that leaves them unrelocated fails at runtime, not at build time.

## Local development

- A compose file brings up every dependency the service talks to, with deterministic credentials.
- A tunnel is documented for anything that receives third-party webhooks.
- Integration tests depend on the task that starts those services, rather than being skipped when they
  are absent.
