# Dépendances : choisir, isoler, retirer

**The default answer is no.** The standard library first, then what the platform already provides,
then a dependency. Every dependency is code you did not write, cannot review in full, must keep
updated, and will one day have to remove. Read with `security.md` (supply chain) and
`architecture.md` (isolation).

## 1. Critères avant d'ajouter

Answer these in the PR description, briefly, when you add one:

| Question | Ce qu'on refuse |
|---|---|
| Does it do the one thing we need? | A framework pulled in for one helper function. |
| Is it maintained? Last release, open issues, number of maintainers. | A package with one maintainer and no release in two years, at the centre of the product. |
| What does it drag in? Transitive count and weight. | Fifty transitive packages for a date helper. |
| What does it cost to remove? | A type that leaks into every signature in the codebase. |
| Is the licence compatible with how we ship? | Copyleft inside a distributed artefact, decided by accident. |
| Does it match the runtime target? | A library requiring a newer runtime than the deployment target. |
| Has it had security incidents, and how were they handled? | A history of silent breaking releases or unpatched advisories. |

**The cost of removal is the real question.** A dependency used behind your own interface can be
swapped in an afternoon. One whose types appear in every signature cannot be removed at all, so it has
become part of your architecture whether you decided that or not.

## 2. Isoler

- Wrap the third-party types at the boundary (the anti-corruption layer). The domain speaks its own
  types; the adapter speaks the library's.
- Depend on your own interface, not on the library's, wherever a replacement is plausible: storage,
  transport, serialization, external providers.
- Where a library is genuinely foundational (the language runtime, the web framework, the ORM),
  wrapping it is theatre. Accept it as part of the platform, and say so.

## 3. Une seule par métier

Two date libraries, two HTTP clients, two validation libraries or two state managers is a bug
generator: two behaviours, two sets of quirks, and a reader who has to know which is used where.
Choose one, migrate the other out, and write the choice down.

## 4. Poids livré

What you ship matters, and it is not the same as what you develop with.

- In a browser bundle, a plugin artefact or a shaded jar, every dependency is real weight and one more
  possible conflict. Prefer what the platform already provides.
- A development-only dependency belongs in the development scope, and the build must prove it does not
  end up in the artefact.
- When you bundle a library into a host you do not control, relocate it so the host's outdated copy
  cannot win at runtime.

## 5. Licences et attribution

- Check the licence against how the project is distributed **before** adding, not at the audit.
  Copyleft in a shipped artefact is a decision that needs to be made deliberately.
- Record the licence of every dependency, and keep the notices required by them.
- When you **vendor or adapt** third-party code into the repository, keep its notice, and say in the
  file header and in the README where it came from, under which licence, and what you changed. Adapted
  code that loses its origin is both a legal and a maintenance problem.
- The project's own licence file is present and accurate, and the package metadata matches it.

## 6. Tenir à jour

- A dependency bot per ecosystem, and its pull requests are kept green rather than accumulating. A
  stale bot queue is an unpatched product.
- A scheduled vulnerability audit, on its own pipeline, so a failing security run is not buried under
  a build.
- Transitive vulnerabilities pinned through the workspace's override mechanism. Know where that
  mechanism lives, because some package managers honour exactly one source of overrides and a second
  one silently replaces the first.
- An explicitly ignored advisory carries the reason and a date to revisit.
- Lockfiles committed. A build that is not reproducible is not verifiable.

## 7. Retirer

When the last consumer of a dependency goes, remove the dependency **in the same change**. An unused
dependency is still a maintenance surface, still an update to review, and still a vulnerability
report to triage.
