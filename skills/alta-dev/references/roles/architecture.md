# Architecture logicielle

Read before creating a component, module, service or project, and before any change adding a layer, a
boundary or an extension point.

The goal is not "a diagram exists": it is that a stranger can find where a thing belongs, change one
behaviour without touching five files, and add a variant without editing a conditional.

## 1. Partir de la frontière, pas du code

Before the first file: what is the **unit of change**? Name the concern in one sentence. If it needs an
"and", that is two components.

Then decide the three things that outlive the implementation:

1. **The contract**: what enters, what leaves, in which types. Others depend on it, so it is what you
   get to change least often.
2. **The dependencies**: what this may import. Write the rule down; it is the only thing keeping
   layering honest once the codebase is big.
3. **The failure modes**: what it refuses, what it throws, what it never does silently.

## 2. Modules profonds, interfaces étroites

A small, intention-revealing surface hiding substantial behaviour. Shallow modules (much surface,
little behind) multiply complexity: each is another thing to learn that buys nothing.

Good sign: the caller writes one line and does not know how many collaborators were involved. Bad sign:
the caller must call three methods in order, or pass a flag that changes the meaning of the return.

This is the real argument behind P2: a forwarding method widens the surface without deepening the
module, strictly worse than no method at all.

## 3. Les couches et la règle de dépendance

```
infrastructure  ->  application  ->  domain
(adapters, I/O)     (use cases)      (pure model)
```

- **domain**: business types, value objects, invariants, and the *ports* (abstract classes or traits)
  describing what it needs from outside. Pure: no framework, ORM, transport or HTTP client.
- **application**: use cases orchestrating the domain through those ports. No I/O of its own.
- **infrastructure**: the adapters implementing the ports, plus the controllers calling in.

The arrow points one way, always. A domain file importing an adapter is a blocking finding: the model
stopped being portable and became a database schema in disguise.

**Wiring lives at the edge.** The composition root (module file, `main`, the plugin's enable hook) is
the only place knowing both the port and its implementation. Everything else injects the port.

**Not every project needs three layers.** A CLI tool, a game plugin or a firmware often has two: a pure
core and the adapters around it. What survives is the direction, not the count.

## 4. Découper par feature, pas par mécanisme

One folder per bounded context / feature / entity, each holding its own layers. Never `controllers/`,
`services/`, `repositories/` at the top level: that scatters one feature across the tree and makes every
change a five-directory diff.

| Domaine | Découpe |
|---|---|
| Backend service | one module per context, each with `domain/` `application/` `infrastructure/` |
| Mobile app | `logics/{model,cubit,services,adapter,provider}` beside `views/{atoms,molecules,organisms,pages}` |
| C server, no module system | one directory per concern (`network/`, `network/dialog/`, `logging/`, `files/`, `util/`), each file paired with its header as the interface |
| Embedded firmware | `HARD/` (registers, GPIO, timers, display) strictly separate from the app logic, which never touches a register |
| Desktop app | a `*_core` crate with the logic and zero UI dependency, plus a thin UI crate depending on it |
| Acquisition node | one module per peripheral (sensors, network, server, storage, display), each with its own header |

Common thread: **what can be swapped sits behind an interface, and what changes together lives
together.**

## 5. Anti-corruption à chaque couture

Every foreign shape is translated at the edge: persistence rows, generated transport messages,
third-party responses, another context's published model. The adapter owns the mapping both ways;
nothing above it knows the foreign type exists.

Skipping it ("I will just pass the row through") is the single most common way a domain rots, because
the foreign shape then dictates your model forever. A dedicated adapter file (`api-adapter`,
`*Repository.toDomain`, a mapper module) is the visible form of the rule.

## 6. Points d'extension, pas conditionnelles

New behaviour arrives as a **new registered type** or a **new subscriber**, never another branch. The
recurring pattern: a **registry** holding every variant keyed by a stable id, enumerated once; a **base
type or trait** each variant implements; **events** the framework fires and variants subscribe to.

Adding a variant then touches one new file plus one registration line. A conditional growing by one
branch per variant is the failure mode: when a function "gets heavier over time", invert it into a
subscription.

**Add the extension point when the first real consumer needs it** (YAGNI), and generalise only on
demonstrated repetition: first case specific, second noticed, third extracted. Two things that look
alike but change for different reasons stay apart.

## 7. Modéliser l'état explicitement

Where there is a lifecycle, name it. An enum of states plus the allowed transitions beats booleans that
can encode impossible combinations.

- Closed sets (sealed types, enums with behaviour) matched exhaustively, so adding a state is a compile
  error at every site that must handle it.
- One state holder per feature with its own state type, not a global mutable blob.
- Derived values computed from the state, never stored beside it and synced by hand.

## 8. Les données hors du code

Content, levels, layouts, thresholds and copy belong in data files, not in `if` chains. A level
described by a JSON file, a config panel driven by a typed config object, a course described by
fixtures: each lets the thing change without a rebuild and makes the code a generic interpreter instead
of a special case per instance.

Typed configuration at the boundary: parse once into a typed model, validate there, and let the rest of
the system assume it is valid.

## 9. Contrat d'abord, quand deux côtés doivent s'accorder

When a client and a server, or a plugin and a backend, must stay aligned, the contract is a committed
artefact (a `.proto`, an OpenAPI spec, a shared schema) and both sides are **generated** from it.

Rules that follow: additive changes only, never reuse a field number, never change a shipped field's
type, keep enums aligned with the database schema, regenerate every consumer before committing.
Generating the client and its mocks removes a whole class of drift.

## 10. Câbler l'opérabilité dès le départ

A component that cannot be observed cannot be operated: a per-class logger with structured context and
never a print; errors surfaced through a typed taxonomy rather than a string; metrics and traces on the
paths that matter with an error reporter at the boundary; an environment template committed with the
secrets out of the repository; a health or status surface for anything long-running. Detail in
`observability.md`.

## 11. Documenter l'intention, et la garder comme cible

Keep one document describing the system as it is *meant* to be, and treat it as the source of truth for
new capabilities. When a feature needs a primitive the document already plans, build that primitive
under the planned name and shape rather than a parallel side structure. Note in the PR which elements
you realised and any deliberate deviation with its reason. An aspirational architecture document is not
a lie as long as new code converges toward it.

Alongside it, record the **decisions** as ADRs (see `documentation.md`): numbered, immutable, one per
expensive-to-reverse choice, whose value is the rejected options and why. The architecture document
says what the system is; the records say why it is not something else.

## Checklist de conception

Before the first file, and again before the PR:

- [ ] Can I name what this owns in one sentence, with no "and"?
- [ ] Is the dependency direction one way, and does the domain import nothing foreign?
- [ ] Is every foreign shape translated at the seam?
- [ ] Does adding the next variant mean a new file, or editing a conditional?
- [ ] Is the public surface the smallest that works?
- [ ] Are the states explicit, closed and exhaustively handled?
- [ ] Is the content that changes without code in a data file?
- [ ] If two sides must agree, is there one generated contract?
- [ ] Is failure loud, typed and observable?
- [ ] Does the layout let a stranger guess where a new file goes?
