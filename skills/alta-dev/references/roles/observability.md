# Observabilité : logs, métriques, traces

Instrumentation is written **with** the code, not after the first incident. A component nobody can see
into cannot be operated, and the moment you need the signal is the moment it is too late to add it.

Read with `devops.md` (the pipeline and the dashboards) and `privacy.md` (what must never be logged).

## Les trois signaux répondent à trois questions

| Signal | Répond à | Coût |
|---|---|---|
| **Logs** | What happened in this one case, in detail. | High per event. Sparse and deliberate. |
| **Métriques** | How often, how long, how much, aggregated over everything. | Low, but cardinality is the trap. |
| **Traces** | Where the time went, across components, for one request. | Sampled. |

Reaching for a log when you needed a metric produces a file nobody can aggregate. Reaching for a
metric when you needed a trace produces a number nobody can explain.

## Logs

**Structure.** The message is static, the values are fields. Never interpolate a value into the
message string: it destroys grouping, searching and aggregation.

```
logger.error('Failed to send the submission', { submissionId, attempt, error })
```

- **One logger per class or module**, named after it, all hanging off one namespace so they can be
  filtered as a group.
- Never a raw print where a logger exists. Never a logger passed in from another class.
- **Log the decision, not only the entry and exit.** "refused: limit reached, 5 of 5 spent" is the line
  that saves an hour; "entering probe()" is not.
- An error is logged **once**, at the boundary that handles it. Logging and rethrowing at every level
  produces five entries for one failure and hides the real one.
- Bound anything inside a loop: rate-limit or sample a repeated message, or one bad input floods the
  file and everything useful scrolls away.
- Correlation identifier on every line crossing a boundary, propagated through the interceptor or
  middleware, so one request can be reassembled across components.

**Les niveaux, avec la règle de décision**

| Niveau | Quand | Le test |
|---|---|---|
| `ERROR` | Something failed and a human must look. | If nobody acts on it, it was not an error. |
| `WARN` | Recovered from something unexpected, or approaching a limit. | If it never leads to action, it is `INFO`. |
| `INFO` | A business event worth reconstructing later. Sparse. | Would you want this line during an incident six months from now? |
| `DEBUG` | Developer detail. Off in production by default. | Would a stranger understand it without the code open? |
| `TRACE` | Firehose, enabled for one session. | Never on by default anywhere. |

An `ERROR` nobody acts on trains everyone to ignore all of them, which is how a real one gets missed.

**Ce qui ne se logue jamais**: a secret, a token, a password, a full authentication header, a complete
payload containing personal data, a card number. Scrub at the point of logging, not in a later
pipeline. See `privacy.md`.

## Métriques

- **Measure what the user feels first**: latency, error rate, saturation, throughput. Internal counters
  come after.
- **Cardinality is the trap.** A label carrying a user identifier, a request identifier or a free-text
  value multiplies the series until it becomes a bill and then an outage. Labels are low-cardinality
  dimensions: endpoint, status class, region, version.
- The right instrument: a counter for events, a histogram for durations and sizes, a gauge for a
  level. Do not compute an average in the application and publish it as a gauge.
- Name consistently, with the unit in the name, under one namespace per component.
- **Business metrics live beside technical ones.** "How many submissions were refused today" is an
  operational signal as much as a product one.

## Traces

- Span the flows that matter: startup, the main transaction, the path that gets blamed. Not every
  function.
- **Resource attributes on everything**: service, version, environment, so a dashboard can slice by
  deployment and a regression can be attributed to a release.
- Propagate the context across every boundary. A trace broken in the middle is worse than no trace,
  because it looks complete and it is not.
- When the shipped artefact is obfuscated, minified or relocated, **verify the span and attribute names
  survive the transform**, or the traces become unreadable exactly when you need them.

## Rapport d'erreurs

- An error tracker wired at the boundary, with the release version attached so a spike maps to a
  deploy.
- **The reporting path itself must be failure-proof.** A telemetry handler that throws, blocks, or
  retries forever must never take the application down. Degrade to silence, never to a crash.
- Group deliberately: an error type that fires for a hundred distinct reasons is a group nobody can
  action.

## Alerting

- Alert on **symptoms the user feels**, not on every metric that moved. An alert nobody acts on trains
  everyone to ignore all of them.
- Every alert has an owner and one line saying what to do first. An alert with no runbook line is a
  notification.
- Page for what needs a human now; everything else is a dashboard or a ticket.

## Coût et rétention

Telemetry is a product with a bill. Sample traces, set retention per signal deliberately, and drop the
debug volume that nobody has queried in a year. Dashboards live in the repository next to the code
that emits the signals, so they evolve with it instead of rotting in a console.

## Tester l'instrumentation

Do not assert on log text everywhere: it makes every wording change a failing test. Do assert the
signals that are part of the contract, such as an audit event, a security-relevant log, or a metric a
dashboard depends on.
