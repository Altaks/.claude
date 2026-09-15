# Concurrence, ordonnancement et fiabilité

Everything here is about the same thing: **two events you did not order will happen in the order you
did not expect**, and the one you never tested will happen in production. Read with `systems.md`
(threads and locks), `networking.md` (retries and timeouts) and `data.md` (transactions).

## 1. Name the model, write it down

Every module states which of its functions may be called from where: any thread, the main loop only,
inside a transaction only, once at startup. This belongs in the module's documentation comment, not in
someone's memory.

- On a platform that is single-threaded by contract (a game loop, a UI thread), never touch its state
  from elsewhere. Off-thread work hops back through the platform's scheduler before it touches
  anything. Moving a call off that thread is never a "pure refactor": it is a behaviour change.
- Prefer message passing and ownership transfer to shared mutable state.
- When a lock is unavoidable: document what it protects, and fix an acquisition order. Deadlock is
  almost always two code paths taking two locks in opposite orders.
- Never hold a lock across an I/O call. A lock waiting on the network is an outage with a queue.

## 2. Check-then-act is a race

Any sequence of "read, decide, write" is wrong under concurrency, however small the window.

- Make it atomic instead: a conditional update, a compare-and-set, a unique constraint, an upsert, an
  atomic counter. Let the database or the platform enforce the invariant.
- A uniqueness rule enforced by "select then insert" **will** produce duplicates. It is a constraint,
  not a query.
- A read-then-write across a network is a lost update. Carry a version and reject a stale write, or
  merge deliberately.

## 3. L'ordre n'est pas garanti

Events arrive out of order, twice, or very late. Design for it rather than hoping:

- Carry a **sequence number or a version** on anything whose order matters, and ignore what is older
  than what you already applied.
- "Last write wins" is a decision, and it needs a timestamp **you** control, not the sender's clock.
- A late event about a deleted entity is normal traffic, not an error: decide whether it is dropped or
  parked, and say which.
- Do not rely on two machines agreeing on the time (see `time.md`).

## 4. At-least-once est la valeur par défaut

Every queue, every webhook, every retry, every restarted job can deliver the same thing twice.

- **Handlers are idempotent.** Applying the same message twice produces the same state as applying it
  once. This is a property of your handler, never of the transport, whatever the transport claims.
- Idempotency keys on anything a client can retry: the same key means the same result, not a second
  charge.
- Deduplicate on a stable business key, not on arrival order.
- A handler that cannot find its entity is usually corrupted state, not a race to swallow: let it
  throw rather than returning early (P9). Park it and alert if the system genuinely tolerates it.

## 5. Écrire et publier sont deux opérations

Saving a row and publishing the event about it are not atomic. Do them naively and you will get one
without the other, which is the hardest class of bug to find later.

- Write the event **in the same transaction** as the state change, into an outbox table, and publish
  from there. The publisher retries; the transaction is the source of truth.
- Or make the consumer able to reconstruct from the state, so a lost event is recoverable.
- Never publish before the commit. Never treat "the message was sent" as "the state changed".

## 6. Retries, timeouts, back-pressure

- **A timeout on every remote call**, at every layer. An unbounded wait is an outage waiting for a
  slow dependency.
- Retries with exponential backoff **and jitter** and a cap, only on idempotent operations. Without
  jitter, every client retries at the same instant and you have built a stampede.
- A circuit breaker so a failing dependency degrades instead of amplifying: a retry storm turns a slow
  dependency into a dead one.
- **Bounded queues and channels.** An unbounded one is a memory leak with a queue in front of it.
  Decide and document the policy when it is full: block, drop the oldest, or reject.
- Cancellation is designed in: a cancelled operation leaves a consistent state.

## 7. Tester la concurrence

- **A flaky test is a real bug until proven otherwise.** Ordering, shared state between tests, a real
  clock, an unawaited promise. Do not retry it away; that is disabling a smoke alarm.
- No fixed sleeps. Wait on a condition, a state or a message, with the timeout as a safety net only.
- Determinism is engineered: injected clock, seeded randomness, a controlled scheduler, and tests that
  do not share mutable fixtures.
- Test the concurrent path deliberately where it matters: two writers on the same row, the same
  message delivered twice, the event that arrives before the entity exists.
