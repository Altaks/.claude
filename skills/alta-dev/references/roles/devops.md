# DevOps, CI/CD, plateforme et observabilité

Pipelines, containers, infrastructure, releases, telemetry. Read with `security.md` (scanning,
secrets) and `delivery.md` (branching and PR flow).

## CI is a gate, not a notification

- Every check a reviewer relies on runs in CI, and the same commands are runnable locally. "Works on
  my machine" is a pipeline design failure.
- **Path filters must cover every input that changes the output.** Filtering on source directories
  alone means a dependency bump (which only touches the version catalog) silently skips the build. List
  the source dirs, the build scripts, the lockfile or version catalog, the toolchain config, the
  packaging rules, and the workflow file itself.
- **Prefer failing loud over silently skipping.** An allowlist that errors when a new package appears
  beats a denylist that quietly stops linting it. If a glob can express the selection, use the glob so
  there is nothing to keep in sync.
- Concurrency groups cancel superseded runs on the same ref.
- Jobs that share expensive inputs stay in one job. Splitting them means restoring, re-resolving and
  recompiling the same thing twice; say so in a comment so nobody "cleans it up".
- Cache aggressively, and never let a cache failure fail a deployment: the cache is an accelerator, so
  a cache export may degrade to "no cache", while the build correctness never depends on it. Say this
  in a comment, because it looks like a swallowed error otherwise.
- Scheduled runs for anything time-sensitive (dependency audits, index rebuilds, data syncs), not only
  push-triggered.
- Grant the minimum token permissions per job, explicitly, and comment why each one is needed.

## Containers and images

- Multi-stage builds: a shared base layer for the toolchain, a thin runtime layer for the artefact.
  A slim base image unless something genuinely needs the full one.
- One Dockerfile per component, plus per-environment proxy or web-server configuration files so the
  differences between environments are visible in a diff.
- Never hardcode a runtime version in several Dockerfiles. Source it from one versions file.
- A `compose.yml` brings the whole stack up locally with deterministic credentials, and it is the same
  topology as production in shape, if not in scale.
- Comment each section of a Dockerfile with **why**, not what.

## Infrastructure as code

- Environments are separate directories (`dev/`, `prod/`), not a branch or a manual toggle. The diff
  between them is the review.
- Modules are single-responsibility, versioned, and consumed by a pinned reference. Every configurable
  attribute is a documented variable with a type and a sensible default; no account-specific ids or
  credentials in defaults.
- The authoritative gate is one command (`make precommit` or equivalent) that runs format check, lint,
  validate and a security scan, in that order, with failures fatal.
- The PR carries the intended version bump as a label and a real changelog entry. CI fails without
  them.
- Never commit state, lock files that are environment-specific, or anything generated.

## Releases

- Versioning is derived from the commit history or from a PR label, never hand-edited.
- Releases are produced by a dispatched workflow, from a tag, with the artefact built by CI and not
  from a laptop.
- Stale build artefacts are pruned; a registry that only grows is an incident waiting to happen.
- A rollback path exists and has been thought through before the first deploy, not after.

## Environments and data

- Separate configuration per environment, committed as templates, with the real values injected at
  deploy time.
- Migrations are reviewed with extra care and flagged automatically on the PR when the diff touches
  them.
- Restoring a lower environment from production data is a documented, automated job, and it scrubs
  what must be scrubbed.

## Observability, wired from day one

The developer-side discipline (what to log, at which level, what never to log, metric cardinality,
trace propagation) lives in **`observability.md`**. From the platform side:

- A telemetry pipeline with resource attributes (service, version, environment) so a dashboard can
  slice by deployment and attribute a regression to a release.
- An error tracker wired at the boundary, whose own failure can never take the application down.
- **Dashboards live in the repository** next to the code that emits the signals, so they evolve
  together instead of rotting in a console.
- Retention and sampling set deliberately per signal: telemetry is a product with a bill.
- When the artefact is obfuscated or minified, verify the telemetry names survive the transform, or the
  traces are unreadable exactly when you need them.

## Incidents et post-mortem

Running something in production is a role, not a side effect of deploying.

**Pendant l'incident**
- **Restore service first, diagnose after.** Roll back, flip the kill switch, or degrade the feature.
  Understanding the root cause is the next hour's job, not this one's.
- One person coordinates and one channel carries the truth. Everything else is noise.
- Announce to the people affected before they discover it, and say what you know, what you do not, and
  when the next update comes.
- Write down what you do as you do it, with timestamps. Nobody reconstructs this accurately afterwards.
- Never run a destructive experiment on production to test a hypothesis. Reproduce in a lower
  environment; if you truly cannot, read-only first, announced.

**Après**
- A postmortem for anything user-visible, written within days while the detail is still available.
- **Blameless, and specific.** The question is what made the failure possible and what made it hard to
  see, not who typed it. "Someone should be more careful" is not an action item.
- The structure: what happened, the timeline, the user impact, the root cause, what made detection or
  recovery slow, and the actions.
- **Every action item is an issue with an owner**, or the postmortem is a document nobody reads twice.
- The most valuable output is usually not the fix: it is the missing alert, the missing test layer, or
  the missing guardrail that would have caught a whole class of this.
- A recurring incident means the previous postmortem's actions were never done. That is the finding.

**Avant**
- Alert on symptoms the user feels, not on every metric. An alert nobody acts on trains everyone to
  ignore all of them.
- The rollback path is decided before the first deploy (see `evolution.md`).
- Anything unattended has a way to be observed, stopped and restarted safely.

## Toolchain

A version manager file pins every tool. A task runner (`just`, `make`, or the workspace orchestrator)
is the human entry point, with one target per thing a human does. The underlying build tool is driven
through the orchestrator when the project has one, so caching and affected-project detection actually
work.
