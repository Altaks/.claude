# Faire évoluer ce qui est déjà livré

Once something has a consumer you do not control, changing it is a **migration**, not an edit. This
document is the method for changing a public surface without breaking anyone.

Applies to: a library or plugin consumed by other projects, a wire contract, a published
infrastructure module, an HTTP or gRPC API, a database schema, a configuration format, a CLI, and any
persisted data shape.

## 1. Know your surface before you touch it

- What is actually public? Least visibility means the answer should be small. If it is not, that is
  the first finding.
- Who consumes it, and how would you find out? A build that compiles the known consumers is the cheap
  answer; a released artefact needs a version policy instead.
- What is the cost of being wrong: a compile error at the consumer (loud, fine) or a silent behaviour
  change (the dangerous one)?

## 2. Expand and contract, never edit in place

The only safe shape for changing a live surface, in three separate changes:

1. **Expand.** Add the new field, method, column, endpoint or value **alongside** the old one. Both
   work. Nothing breaks. This ships on its own.
2. **Migrate.** Move every consumer you own to the new one. Backfill the data. Dual-write and read
   from the new path while the old one still exists. This ships on its own.
3. **Contract.** Remove the old one, once nothing uses it. This ships on its own, and only after the
   deprecation window has actually elapsed.

Compressing these into one change is how an outage happens, and it is also how a diff becomes
unreviewable. The same shape applies to a schema (add column, backfill, switch reads, drop) and to a
wire contract (add field, migrate clients, stop writing the old one).

## 3. Règles dures des contrats

- **Additive only** on anything already shipped. Never reuse a field number, never change a shipped
  field's type, never repurpose an existing value to mean something new.
- Adding a value to an enum is a breaking change for any consumer that matches exhaustively. Say so,
  and give them a version.
- Widening what you accept is safe. Narrowing it is breaking. Widening what you return is breaking for
  a strict consumer.
- Renaming is never free: it is an expand-and-contract like everything else.

## 4. Dépréciation

- Mark it with the language's deprecation mechanism so consumers see it at compile time, not at
  runtime.
- **Say what to use instead**, in the message. A deprecation without a replacement is a complaint.
- Give a window, state it, and keep the old path fully working for its duration. A deprecated path
  that silently degrades is worse than a removed one.
- Log or warn once per process, not per call: a deprecation warning in a loop gets muted, and then
  everything else does too.
- Track the removal as an issue with a date, or it will never happen.

## 5. Feature flags

A flag is a temporary branch running in production. It is a tool, and it is debt from the moment it
exists.

- **Default off**, and the off path is the current behaviour.
- One flag, one decision, named for the behaviour and not for the ticket. Never nest flags: two
  booleans are four states, and you will only ever test two.
- A flag is a **kill switch** for anything risky: it must be flippable without a deploy.
- **Removal is planned when the flag is created**: an owner, a date, and its own PR that deletes the
  flag, the dead branch and the test that covered it. A flag that survives its rollout has become
  permanent business logic wearing a disguise.
- A flag is not a substitute for a decision. If both branches are meant to live forever, that is a
  configuration option, and it is designed and documented as one.

## 6. Déploiement progressif

- Decide the rollback path **before** deploying, not while the alert is firing.
- Dark launch (run the new path, do not use the result) to compare behaviour under real load.
- Then a percentage or a canary, with the metric that tells you it is going wrong named in advance.
- Migrations and code deploy in an order that works in both directions: the old code must survive the
  new schema, because the rollback runs it.

## 7. Retirer une fonctionnalité

The reverse of building one, and it is a real piece of work:

1. Find out whether anyone uses it. Guessing is how a removal becomes an incident.
2. Deprecate and announce, with the window.
3. Remove the code, then its tests, its configuration, its data, its documentation, its translations,
   and its feature flags. A removal that leaves the config key behind is half done.
4. Say in the PR what was removed and what replaced it, so the archaeology works later.

## 8. Versionner honnêtement

- The version is derived from the history or from a label, never hand-edited.
- A breaking change is **announced**, not discovered by a consumer's failing build. It carries a
  changelog entry saying what breaks and how to migrate.
- The consumers you own are compiled by the gate. That is the cheapest early warning there is, and it
  is why the gate runs on the whole workspace and not on one module.
