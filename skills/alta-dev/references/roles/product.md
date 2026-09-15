# Produit, specs et tickets

Turning a request into something buildable. This is Phase 1 of the loop, written out.

## Grill before you build

Never guess (P1). Interview until both sides share one picture, one question at a time, recommending
an answer for each, and exploring the codebase to answer anything you can rather than asking it. Every
branch of the decision tree gets resolved before implementation starts.

Ask about the things a feature request always hides:

- **Silent side effects.** The obvious implementation often changes something nobody mentioned: an
  adjacent counter, an XP drop, a notification, a cache, the feel of an interaction. Name them and get
  a decision.
- **Configurability.** Fixed, or tunable? If tunable, through what surface, and what is the default?
- **The unhappy path.** What happens on refusal, on missing data, on a duplicate, on a second attempt,
  on the wrong state. Each of those becomes a test.
- **Boundaries.** Limits, ranges, expiry, who may do it.
- **Visibility.** What exactly does the user see, in which words, in which language.
- **Consumers.** Does this change a public surface someone else depends on?
- **Existing plan.** Was this capability already envisioned in the architecture document? Build it
  under the planned name rather than beside it.

The output is a short spec, three to six lines, that the user has explicitly confirmed. If you cannot
reach a human, stop and return the open questions rather than picking a reading.

## Writing a user story

```
As a <role>, I want <action>, so that <reason>.
```

Plus concrete examples, acceptance criteria, and the resources needed. A story without examples is a
story that will be built wrong.

## Acceptance criteria describe behaviour, not implementation

Each criterion is something a person could verify without reading the code.

| Good | Bad |
|---|---|
| "An admin can approve an AI-sourced profile, which submits it to the client" | "`approveAiSubmission()` sets the admin review and calls `completeDraft()`" |
| "Duplicate candidates are detected and skipped during intake" | "The use case runs duplicate checks" |
| "Before 40 minutes, the vote command is refused with an explanation" | "`closedReason()` returns `NOT_STARTED`" |

Implementation details belong in the description or the sub-tasks. The criteria answer "how do we know
this is done?" from the outside. They are also the first draft of the test list.

## Bug reports

Reproduction steps, expected versus actual, environment, severity, frequency, and a workaround if one
exists. Screenshots or a recording when the symptom is visual.

A bug report is also the proof that a scenario was missing from the test suite, so the first action on
picking it up is writing the failing test, not the fix.

## Splitting work

- One concern per ticket, and one ticket per PR wherever possible.
- When a request bundles several concerns, split it into an ordered list before writing any code, and
  say which ones depend on which. That ordering becomes the PR stack.
- A ticket that cannot be verified from the outside is either too small to be a ticket or too vague to
  be started.

### Découper en tranches verticales

**Slice through the layers, never along them.** A slice that delivers "the database table" or "the API
layer" is worth nothing on its own: it cannot be demonstrated, cannot be tested end to end, and cannot
be shipped or reverted independently.

- **Walking skeleton first.** The thinnest possible path that goes all the way through: one input, one
  storage write, one response, one thing visible to the user. Ugly is fine, incomplete is fine. It
  proves the wiring, the deployment and the test harness, which is where the surprises actually live.
- Every subsequent slice adds one behaviour through the same full depth, and each one is demonstrable
  on its own.
- If a slice cannot be demonstrated to the person who asked for it, it is not a slice, it is a chunk
  of implementation.
- Slice by rule, by case, or by state, not by component: "the refusal when the limit is reached" is a
  slice; "the validation layer" is not.
- A slice that cannot be finished in one PR-sized change is still too big. Cut it again.

### Le spike

When the uncertainty is technical rather than functional (does this API do what we need, is this
approach fast enough, does this library work in this runtime), the honest move is a **spike**: a
timeboxed experiment whose only deliverable is an answer.

- Set the timebox and the question **before** starting, and write both down.
- The output is the answer, plus what you learned, plus a recommendation. Not a feature.
- **Spike code is deleted, never promoted.** It skipped the spec, the tests, the review and the
  principles, so it is not a head start, it is a liability wearing the shape of one. Rebuild the real
  thing with what you learned.
- If the spike answers "no", that is a successful spike. Say so, and say what to do instead.
- Never let a spike silently become the implementation because it happened to work. That is how every
  rule in this skill gets bypassed at once.

## Scope discipline

Deliver what was asked. Do not quietly widen the scope with an abstraction nobody requested, and do not
quietly narrow it because a part is inconvenient. If part of it turns out to be a bad idea, say so in
a sentence, then build the rest in full and state explicitly what you left out and why.
