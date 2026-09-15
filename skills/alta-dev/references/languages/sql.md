# SQL et schéma

Read with `roles/data.md`, which covers repositories, migrations and pipelines. This file is the query
and schema language itself.

## Naming

- One convention per database, applied everywhere: table names, column names, constraint names, index
  names. Mixed conventions are how a join gets written wrong.
- Tables named for what a row is. Columns named for what the value is, without repeating the table
  name.
- Constraints and indexes named explicitly rather than left to the generator, so a migration diff is
  readable and a drop is unambiguous.
- Enum values are nouns or actors, and they match the application's enum exactly: same names, same
  order.

## Schema

- Declare the constraints the data actually has: not null, unique, foreign keys, checks. A constraint
  the application enforces alone is a constraint that will be violated by the next writer, a migration
  or a script.
- One column, one meaning. A column that encodes two things is two columns; a pair of booleans that can
  encode an impossible combination is one enum.
- Choose the narrowest correct type. Store timestamps with a time zone, money as an exact type, and
  identifiers as the type the application actually uses.
- Model derived values as derived. If one is stored for performance, write down why and how to rebuild
  it.
- Soft deletion changes the meaning of every existing query. Decide it deliberately, and make the
  default read path exclude the deleted rows.

## Queries

- Never `SELECT *` in application code: the query breaks silently when a column is added, and it fetches
  what you do not need.
- **Parameterised queries only.** String interpolation into SQL is not a style question.
- Filter and sort on indexed columns, and say in the PR which index a new query depends on. A function
  applied to a column usually defeats its index.
- Prefer one set-based statement over a loop of statements. A per-row round trip is the N+1 in its
  original form.
- Explicit join types, explicit join conditions, and a deliberate decision about the rows an outer join
  will produce.
- `ORDER BY` on any query whose result the application treats as ordered. Without it there is no order,
  only a habit.
- Read the query plan for anything on a hot path or over a large table, before merging.

## Transactions

- Keep them short and hold no external call inside one. A transaction waiting on an HTTP request is a
  lock waiting on the internet.
- Say what isolation the operation needs, and what it does under a concurrent writer.
- Make the write idempotent where a retry is possible: a conflict clause or a uniqueness constraint
  rather than a read-then-write race.

## Migrations

- Additive first: add, backfill, switch the readers, drop later. A single migration that renames and
  rewrites is an outage.
- Batch and make resumable any backfill over a large table, and keep it observable.
- Every migration is reviewed and reversible in intent, even when the reversal is documented rather
  than automated.
- Test the migration against a real database in CI, not against the ORM's opinion of it.
- Seed data is deterministic and runnable with one command, so a fresh clone has a usable database.
