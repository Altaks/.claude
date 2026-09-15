# Cybersécurité

Applies to every role: security is a property of the design, not a review stage. Read with
`networking.md` (transport) and `devops.md` (pipeline and secrets).

## Règle zéro : whitelist, jamais blacklist

**Everything is denied until it is explicitly allowed, and the smallest possible set is allowed.** A
denylist is a list of the attacks you already thought of; the next one is not on it, and neither is the
resource someone adds next month.

This is the default everywhere, with no exception unless it is written down and justified:

| Surface | La whitelist | Le piège de la blacklist |
|---|---|---|
| Authorization | Enumerate who may run each operation. A route, command, job or subscription starts closed. | "Everyone except guests" silently grants the role created later. |
| Input validation | Accept a declared shape and reject everything else. Allowed values, allowed types, allowed ranges. | Stripping "dangerous" characters always misses an encoding. |
| CI and automation tokens | Grant the exact scopes a job needs, per job, with a comment saying why. | A broad default token because "it was easier". |
| Cloud, database and container identities | One identity per workload, with exactly the actions it performs. | A shared role with a wildcard action. |
| Network | Ingress and egress rules that name the ports and the sources. Declared CORS origins. | Open egress "to be able to debug". |
| Files and secrets | Name the paths a process may read. Deny env and secret files outright. | A deny rule listing today's secret file names. |
| Dependencies | Pin versions, and allow the registries you trust. | Blocking known-bad packages only. |
| Agent and tool permissions | Allow the specific read-only commands the work needs; ask before anything destructive or outward-facing. | A blanket allow with a few dangerous commands excluded. |

**Every grant is justified.** A permission wider than the minimum carries a comment saying who needs
it, why, and what would have to change for it to shrink. An exception with no written reason is a
finding, and the reason has a date to revisit.

**Prefer the failure that is loud.** When a whitelist means someone must update a list to add a new
component, that is the point: a build that stops on an unlisted package beats one that silently stops
protecting it. The same shape appears in the pipeline (`devops.md`) and in the workflow filters
(`languages/yaml.md`): enumerate what is included, and fail when something new is not.

## Authorization is part of the use case

- **Every use case states who may run it.** A use case with no permission check is a blocking finding,
  and "the caller already checked" is not an answer: the check belongs where the invariant lives.
- Do not assume a privileged role bypasses business rules. Staff use the same applications as
  customers; a rule that only holds for non-staff is a hole.
- Authorization decisions use the server's view of the caller, never a field the client sent.
- Deny by default. A new route, a new command, a new subscription starts closed and is opened
  deliberately.
- Distinguish "forbidden" from "not found" on purpose: leaking existence through the error code is an
  information disclosure decision, so make it consciously.

## Input is hostile until validated

- Validate at the boundary with a schema, once, then trust internally.
- Parameterised queries only. String-built queries are not a style question.
- Escape on output according to the sink (HTML, shell, SQL, log). Encoding at the wrong layer is the
  classic source of injection.
- Bound everything that comes from outside: payload size, page size, upload size, recursion depth,
  regex complexity. An unbounded input is a denial of service.
- Never reflect raw user input into a log message; pass it as a structured field so it cannot forge a
  log line.

## Secrets

- **Never read, print or commit an env or secret file.** Agents included: the deny rule exists because
  the risk is real.
- A template is committed with every key documented and no value. The real file stays out of the
  repository and out of the image.
- Secrets reach the runtime through the platform's secret mechanism, never through a build argument
  baked into a layer.
- Rotate on exposure, and treat a leaked credential as compromised even if the repository is private.
- No secret in a DTO, a log, an error message, a trace attribute or a client bundle.

## Dependencies and supply chain

- A dependency bot per ecosystem, and its PRs are kept green rather than ignored.
- A scheduled audit job (daily, not only on push) running the ecosystem's vulnerability scanner, on its
  own workflow file so a failing security run is not buried in the build.
- Transitive vulnerabilities are pinned through the workspace's override mechanism. Know where that
  mechanism lives: some package managers honour exactly one overrides source, so adding a second one
  silently replaces the first and reinstates every vulnerability it had fixed.
- An explicitly ignored advisory carries a comment with the reason and a date to revisit.
- When bundling a library into a host you do not control, relocate it so the host's outdated copy
  cannot be used at runtime instead.
- Lockfiles are committed. Builds are reproducible or they are not verifiable.

## Static analysis

- Security scanning in CI on infrastructure and application code, failing the pipeline rather than
  reporting into the void.
- A quality gate whose status is visible from the README, so a regression is noticed without opening
  the dashboard.
- Fix the finding or record the exception with a justification. A permanently ignored rule is a rule
  that should be disabled explicitly, with the reason next to it.

## Runtime posture

- Least privilege everywhere: the CI token, the container user, the database role, the cloud role.
  Grant per job, per service, explicitly.
- TLS terminated at a known place, with the internal hop's expectations documented.
- Rate limiting and abuse controls at the gateway, before the application.
- Do not leave debug endpoints, verbose profilers or temporary logging in a shipped build. "Not so
  temporary debugging" is a real review finding.
- Audit-relevant actions (a sanction, a permission change, a deletion) leave a durable, attributable
  trace.

## Defensive engineering habits

- Fail closed on an unexpected state; do not guess your way past a check.
- A destructive or outward-facing action (a push, a force operation, a merge, a deployment) needs
  explicit human authorization. Automations must ask, not assume.
- Threat-model the feature during the grilling phase: who can call this, with what, and what is the
  worst thing they can make it do.
