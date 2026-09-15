# YAML : pipelines, manifestes, compose

YAML is where a lot of production behaviour actually lives. Review it like code, because it is.

## General

- Two-space indent, no tabs, one document per file unless the format requires otherwise.
- Quote anything ambiguous. Unquoted `yes`, `no`, `on`, `off` become booleans; an unquoted version like
  `1.10` becomes a float and loses the trailing zero; a leading zero can become octal. Version numbers
  and identifiers are strings.
- Comment the **why**, not the what. A YAML file with no comments is a file nobody can safely change.
- Anchors and aliases only where they genuinely remove duplication and stay readable. Beyond that, use
  the format's own reuse mechanism (a reusable workflow, a composite action, a base manifest).
- No secret in a committed file. Ever. References to a secret store only.

## CI workflows

- **Path filters must cover every input that changes the output**: the sources, the build scripts, the
  lockfile or version catalog, the toolchain configuration, the packaging rules, and the workflow file
  itself. Filtering on source directories alone means a dependency bump silently skips the build.
- **Prefer failing loud over silently skipping**: an allowlist that errors on a new package beats a
  denylist that quietly stops testing it. Same rule as `roles/security.md` (whitelist over blacklist).
- A concurrency group per workflow and ref, cancelling superseded runs.
- Minimum token permissions, declared per job, with a comment saying why each one is needed.
- Pin actions to a version deliberately, and let the dependency bot move them.
- Jobs that share expensive inputs stay in one job. Splitting them re-resolves and recompiles the same
  thing twice; write that reason in a comment so nobody "cleans it up".
- Cache aggressively, and never let a cache failure fail a deployment. A cache export may degrade to
  "no cache"; the build's correctness never depends on it. Say this in a comment, because it looks like
  a swallowed error otherwise.
- Scheduled runs for anything time-sensitive (audits, index rebuilds, data syncs), not only on push.
- Reusable workflows and composite actions for anything repeated across pipelines, parameterised rather
  than copied.
- Every command in a workflow must be runnable locally. A gate nobody can reproduce is a gate nobody
  can fix.

## Compose

- One file that brings the whole stack up locally, with deterministic credentials from the toolchain
  configuration, and a topology that matches production in shape.
- Named volumes, explicit networks, health checks on anything other services wait for, and dependency
  conditions rather than a sleep.
- No published port that does not need to be published.

## Kubernetes and deployment manifests

- One directory per environment, so the difference between them is a reviewable diff rather than a
  runtime flag.
- Resource requests and limits on every workload. A pod with no limit is a noisy neighbour by design.
- Liveness and readiness probes distinguished on purpose: readiness gates traffic, liveness restarts.
- Configuration from config maps, secrets from the secret store, never baked into an image.
- Labels and selectors from one convention; a mismatched selector fails silently by matching nothing.

## Gate

Lint the YAML, and validate it against the schema the tool provides (workflow schema, manifest
validation, compose config). A syntactically valid file that the platform rejects at deploy time is the
failure mode this catches.
