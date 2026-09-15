# Debug et diagnostic

**Find the cause, do not pattern-match a fix.** A change that makes the symptom disappear without an
explanation is a coincidence, and a coincidence does not survive the next release. If you cannot say
*why* the bug happened, you have not fixed it.

Invoke `superpowers:systematic-debugging` for the full loop. This document is the method, and the
archaeology that goes with it.

## 1. Reproduce deterministically, first

Nothing else is worth doing until the bug happens on demand.

- Narrow to the smallest input and the smallest state that still reproduces it. Each element you
  remove without losing the failure is an element that was not the cause.
- If it only happens sometimes, that is information, not an obstacle: it points at ordering, shared
  state, time, or an uninitialised value. See `concurrency.md`.
- **The reproduction becomes the failing test** (P10). Write it now, watch it fail for the right
  reason, and keep it: it is both your feedback loop and the regression guard you owe.
- If you genuinely cannot reproduce it, say so explicitly and describe what you tried. A fix shipped
  against a bug you never reproduced is a guess.

## 2. Read the actual evidence

Most wasted debugging time is spent reasoning about what the code *should* do.

- Read the real error, the real stack, the real log line, the real payload, the real row. Not the one
  you expect to be there.
- Read the code that runs, not the code you remember. Open the file. Check the actual signature, the
  actual default, the actual order of the parameters.
- Raise the log level, print the value at the point you are unsure about, inspect the state. Evidence
  beats deduction, and it is faster.
- Check your assumptions about the environment too: which version, which branch, which build, which
  configuration is actually loaded.

## 3. One hypothesis at a time

- **Write the hypothesis down before testing it**, in a form that can be proven wrong: "the value is
  already null when it enters this function".
- Test it with one change you can undo. Two changes at once and a passing result teaches you nothing.
- Record what each test eliminated. The list of things it is *not* is what converges.

## 4. Binary search, everywhere

The fastest tool in debugging is halving the search space.

- **Over the change set**: `git bisect` between a known-good and a known-bad revision. Automate the
  check when the reproduction is scriptable.
- **Over the pipeline**: find the point where the value is still correct and the point where it is
  already wrong, then look in the middle. Instrument at the midpoint, not everywhere.
- **Over the data**: halve the input, halve the configuration, disable half the plugins or half the
  features.

## 5. Archaeology: when did this start, and why

This is what turns "weird bug" into "copy-paste from the neighbour", and it is worth doing before
writing the fix.

```
git log -S '<symbol or literal>' -- <path>    # when did this token appear or disappear
git log -L <start>,<end>:<file>               # the history of one region
git blame -w -C <file>                        # who last touched each line, ignoring moves
git show <sha>                                # the commit, its message and its siblings
gh pr list --search <sha>                     # the PR and its review thread
```

Then read the introducing commit **and its review thread**. Very often the reason is written there,
and the bug turns out to be an intent that was never completed rather than a mistake.

State it in the thread: which commit introduced it, why it stayed invisible, and where it is fixed.
"It came in with `<sha>`, it looked like a copy of the neighbouring line, and optional chaining an
index on a non-array silently yields nothing instead of throwing" is a report that ends the
discussion.

## 6. Root cause, not symptom

Keep asking why until you reach something whose fix prevents a **class** of bugs.

- The null check that stops the crash is almost never the fix. The reason the value was null is.
- The retry that hides the timeout is not the fix. The reason it was slow is.
- The cast that silences the compiler is not the fix. The wrong type is.

When the true root cause is out of scope for this change, fix the instance, **and say in the PR what
the real cause is** so it becomes its own issue rather than folklore.

## 7. Look for the siblings

The same mistake almost always exists in two other places. Grep for the pattern before closing: the
same copy-pasted line, the same missing guard, the same wrong accessor. Fixing one of three is how a
bug gets reported again next month.

## 8. Close it properly

- The failing test from step 1 stays, labelled with the issue or PR number.
- Prove it bites: revert the fix, watch it go red, restore (P10).
- The PR explains the **cause**, not only the change.
- If the bug was possible because of a missing invariant, a missing type or a missing test layer, say
  so: that is the finding worth more than the fix.

## Ce qu'il ne faut pas faire

- Change several things and see what happens. You lose the information from every one of them.
- Sprinkle defensive checks until the crash stops. That converts a loud bug into a silent one (P9).
- Say "it works now" without an explanation.
- Blame the framework, the compiler or the platform before reading your own code. It is almost never
  them, and when it is, you will need the evidence anyway.
- Disable, skip or loosen the failing test. That is the one move that turns a bug into a permanent
  one.
- Debug directly in production when a lower environment can reproduce it. When you must, read-only
  first, never a destructive experiment, and announce it.

## Timebox et blocage

Set a limit before starting. When you hit it, stop and report: what you reproduced, what you
eliminated, the current best hypothesis, and what you need (an access, an answer, a log, a decision).
A precise blocked report is worth more than another hour of the same approach.
