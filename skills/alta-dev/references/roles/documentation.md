# Documentation technique

READMEs, architecture documents, API references, user-facing documentation sites.

## In-code documentation

- **Comments add what the code cannot say.** Delete anything that paraphrases the line below it. Fix
  anything that is wrong: a wrong comment is worse than none, and it is a blocking finding.
- Document the **why**: the constraint, the invariant, the surprising behaviour, what the profile
  showed, why the obvious alternative does not work.
- Use the language's documentation-comment syntax on a symbol (a function, a type, an exported value),
  and reserve line comments for a short note on a specific non-obvious line.
- A file whose purpose is not obvious from its name gets a header explaining what it does and how. "This
  file lacks explanations" is a real review finding on interceptors, decorators, middlewares and other
  indirection.
- Keep it in English in the code, concise, and skip the metadata tags (author, since) that version
  control already answers.
- Mark intentional gaps with the conventional markers so the editor surfaces them.

## The README

The entry point for someone who has never seen the project. Not a template dump: replace the
boilerplate the forge generated. It answers, in order:

1. What this is, in two sentences, and who it is for.
2. How to run it: prerequisites, install, the one command that starts it.
3. How to test it, and how to produce the coverage or documentation artefacts.
4. How it is structured: the directory map with one line each.
5. How to contribute: branch naming, commit convention, the gate to pass.
6. Where the deeper documents live.

Badges that carry live information (quality gate, build status) earn their place; decorative ones do
not.

## The architecture document

One document describing the system as it is meant to be, kept as the target rather than a snapshot.

- A diagram of the components and the direction of every dependency.
- The layering rule, written as a rule, so a violation is arguable.
- Where each kind of thing lives, as a table: contract, schema, entry point, wiring, configuration,
  CI, ownership.
- The reasoning behind the choices, so the next person can tell an intentional decision from an
  accident.
- When it diverges from the code, new code converges toward the document, and the PR says which
  elements it realised and which deviations it made, with reasons.

Per-component documents live next to the component and are linked from the root, so they are read by
whoever is working in that directory.

## Les décisions : ADR

An architecture decision record is a short, numbered, immutable note explaining **why** something was
decided. It is the artefact that stops the same debate being reopened every six months, and it is what
lets a newcomer tell an intentional choice from an accident.

**Write one when** the decision is expensive to reverse, when it will surprise a newcomer, when it was
contested, or when it constrains everything built afterwards: a layering rule, a persistence choice, a
protocol, a threading model, a licence-affecting dependency, an environment boundary. **Not** for every
choice, or nobody will read any of them.

The shape, one page at most:

```markdown
# ADR-0007: <the decision, as a statement>

Status: accepted | superseded by ADR-0012 | proposed
Date: <YYYY-MM-DD>

## Contexte
What forced a decision. The constraints, the numbers, the deadline.

## Options envisagées
Each one with its cost, honestly. This is the section that has the value.

## Décision
What was chosen, and the reason it beat the others.

## Conséquences
What this makes easy, what it makes hard, and what will have to change if it is reversed.
```

- **Numbered and immutable.** A decision that changes is not edited: a new record supersedes it, and
  the old one is marked with a link to its replacement. The history is the point.
- Lives in the repository, next to the code, in a decisions folder, so it is versioned with what it
  governs.
- **The rejected options are the value.** "We considered X and rejected it because Y" is what prevents
  the rediscussion.
- The PR that implements the decision links to the record, and the architecture document points at the
  set.

## Generated documentation

Where the ecosystem has a documentation generator, wire it and commit the command. The README says how
to produce it and where the output lands. Generated output is not committed; the generator is.

## User-facing documentation sites

- Content in the audience's language, with correct grammar and accents.
- One page per subject, with the frontmatter, heading shape and component usage the site expects. The
  structure conventions are as binding as code conventions.
- Site-wide values (links, addresses, socials) live in one central configuration file, never hardcoded
  in a page.
- The lint gate is part of done: markdown lint, formatter check, and the grammar pass, in CI. Only real
  mistakes count, not typographic preferences.
- Smoke tests over the rendered pages so a broken build is caught before a reader finds it.

## Style

- Say the thing, then stop. No padding, no restating the diff, no filler transitions.
- Concrete over abstract: a command, a path, a real example rather than a description of one.
- Tables for anything with more than three parallel items.
- No em dash anywhere.
- Never attribute the work to an AI, in a document, a commit or a PR body.
