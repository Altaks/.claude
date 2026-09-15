# HCL (Terraform / OpenTofu)

## Module anatomy

Every published module ships the same files, and the list is not negotiable:

```
main.tf        the resources
variables.tf   every knob, with a description, a type and a sensible default
outputs.tf     what consumers may read, with descriptions
providers.tf   required_providers
versions.tf    the pinned versions
README.md      what it does, plus a usage example per meaningful configuration
```

Optional but common: `locals.tf`, `data.tf`, `moved.tf` (for refactors that must not destroy),
`scripts/`, and a workaround file when a provider bug forces one. Put the workaround in its own file
with a comment linking the upstream issue, so it can be deleted when fixed.

- **Single responsibility per module**: one resource type, or one well-defined pattern. A module that
  provisions a service and its database and its DNS is three modules.
- Module names kebab-case (`ecs-fargate-service`, `rds-aurora-postgresql`).
- Composed modules live in one directory, atomic building blocks in another, and the composition is
  explicit.

## Variables and outputs

- Every configurable attribute is exposed. A consumer forced to fork the module is a design failure.
- Description and type on every variable, always. `any` is the HCL equivalent of untyped.
- Sensible defaults, but **never a credential, an account identifier or an environment-specific value in
  a default**.
- `sensitive = true` on anything secret, and check it does not end up in an output or a plan comment.
- Validation blocks for the constraints the type system cannot express, with a message that says what
  is allowed.

## Environments

- Environments are directories (`dev/`, `prod/`), never a branch or a manual flag. The diff between
  them is the review, and it should be small and obvious.
- The live repository consumes catalog modules by a pinned source reference. Floating references make a
  plan non-reproducible.
- Remote state with locking, one state per environment and per component. State is never committed, and
  neither is the provider lock file when the project excludes it.

## Change discipline

- **Read every plan before applying.** A destroy in a plan is a stop-and-think, not a scroll-past.
- Use `moved` blocks to refactor addresses without destroying resources.
- `prevent_destroy` on anything stateful you cannot rebuild.
- Never apply from a laptop what the pipeline is supposed to apply.

## Gate

One authoritative command runs the whole chain, failures fatal:

```
clean -> fmt -check -> lint -> validate -> security scan
```

A pre-commit hook is not sufficient; the task-runner target is the gate. The PR carries the intended
version bump as a label and a real changelog entry, and CI fails without them.

## Style

- Resource names describe the role, not the type (`primary`, `readonly`, `ingest`), since the type is
  already in the address.
- Tag everything with the owning service, the environment and the cost centre, from a shared local so
  the set cannot drift.
- Locals for anything computed twice; a naked repeated expression is the HCL magic value.
- Comment the why: the provider limitation, the ordering requirement, the reason a resource is
  duplicated per zone.
