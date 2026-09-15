# Données et persistance

Schema, migrations, repositories, fixtures, and the analytics side. Read with `backend.md` (use cases)
and `architecture.md` (the anti-corruption layer).

## The schema is a contract

- The database schema, the wire contract and the domain types tell **one story**. Same concepts, same
  names, aligned enums (same values, same order). When the language changes, rename across all three
  in the same change.
- Enum values are nouns or actors, not past participles or states of a workflow that will grow.
- A column that encodes two things is two columns. A boolean pair that can encode an impossible
  combination is one enum.
- Model derived values as derived: compute them, or store them deliberately with the reason written
  down and a way to rebuild them.

## Repositories

- A repository loads and saves **whole aggregates**, never half of one.
- It never leaks infrastructure types upward: no cursor, no driver id, no query builder in a return
  type. The mapping to the domain happens inside it.
- Targeted read methods are legitimate and preferred when a use case needs one field. Loading an
  aggregate to read its id is a finding.
- The client stays private to the persistence library; consumers inject the wrapper.

## Migrations

- Every schema change ships as a reviewed migration, never a manual statement on an environment.
- Additive first: add the column, backfill, switch the reads, then drop the old one in a later change.
  A single migration that renames and rewrites is an outage.
- Backfills are batched, resumable and observable on a large table.
- A destructive migration is called out explicitly in the PR, and the pipeline flags PRs that touch
  migrations so nobody merges one by reflex.
- Test the migration against a real database in CI, not only the ORM's opinion of it.

## Queries and performance

- N+1 is a defect. Fetch in one query or batch explicitly.
- Index what you filter and sort on, and say so in the PR when adding a query that depends on an index.
- Query on a computed, named status rather than reimplementing a raw combination of fields at each
  call site: the combination will drift.
- Check the right source of truth. When two tables can diverge after an update, read the one the
  business rule is about.
- Independent reads run in parallel.

## Fixtures and seeds

- A factory per entity, producing valid objects with sensible defaults; tests override only the fields
  the test is about.
- Generated values over hardcoded literals, so a test cannot accidentally depend on a magic id. Fall
  back to a literal only for a deliberately invalid input.
- Seed data lives in code, is deterministic, and is runnable with one command so a fresh clone has a
  usable database.
- Seed the random generator per run and report the seed, so a flaky failure is reproducible.

## Data pipelines and analytics

- A transformation is a pure function of its inputs where possible: same input, same output, so it can
  be replayed.
- Pipelines are idempotent and restartable. A partial failure must not double-count.
- Late and duplicate data are normal: dedupe on a stable key rather than on arrival order.
- Schema changes upstream break pipelines silently. Validate the shape on ingest and fail loud.
- Keep notebooks for exploration and move anything scheduled into reviewed, tested code.
- Personal data has its own document: `privacy.md`. The short version, which is binding here: collect
  the minimum, document the retention per dataset with an automated deletion job, make deletion cascade
  to derived tables, indexes, caches, exports and logs, and never move a production dump into a lower
  environment without scrubbing it.
