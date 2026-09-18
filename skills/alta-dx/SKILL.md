---
name: alta-dx
description: Audit the UHCGDK framework boundary to find where a game-mode developer is forced to bricoler instead of declaring, and to find the framework notions that are still half-built. Hunts incomplete concepts, missing abstractions, leaky escape hatches, copy-pasted boilerplate, clumsy syntax, and runtime CPU/memory waste, then files each finding into AUDIT-DX.md and (on approval) GitHub issues labelled on the Project v2 board. Use on "/alta-dx", or whenever the topic is developer experience, DX, an API or syntax that is not developer-friendly, boilerplate a consumer must repeat, a concept a module had to invent for itself, or making the GDK more declarative and reusable across game modes. Read-only: it never edits production code, it hands the work off to alta-refactor.
---

# Hunting DX friction in the GDK

## The doctrine you are auditing against

The GDK is a framework, not a library of helpers. Its promise: **a game-mode developer declares, and never invents.** They declare a role, a camp, a victory condition, an effect that bears on a role or a team, a condition under which it applies, the game itself. Everything else is the framework's job.

Judge every line of a consumer module (`consumers/LoupGarouUHC`, `SlaveMarketUHC`, `MysteryTeamUHC`) against that promise. Three questions, in order:

1. **Did the consumer have to invent a concept the GDK should own?** A bespoke victory resolver, a hand-rolled targeting helper, a private announcement formatter, a module-local symbol builder. If a second game mode would need the same thing, it belongs in the GDK.
2. **Did the consumer have to escape the framework to get something done?** A raw `Bukkit.*` call, a hand-registered listener, a `BukkitRunnable` scheduled around `gdkScheduler`, an event fired by hand. Every escape hatch is a hole in the declarative surface, and it is load-bearing evidence: the developer did not take it for fun, they took it because nothing declarative was on offer.
3. **Is the concept finished?** This is the deepest question, and the one that pays. A GDK notion that only fits the one shape its first consumer needed is half-built, and the next game mode will bricoler around it. See *Completing a notion* below.

Then, on the same pass, look at cost and craft: **syntax** that could be lighter (the language almost always has a better way to say it), **CPU** on the hot paths, **memory** in the data structures. Best developer experience and best runtime are not in tension here; both come from the framework owning the concept once, properly.

## Completing a notion

The project is young. Duplication has not had time to pile up, so **you cannot wait for three copy-pasted sites to prove a gap**: by the time a shape appears in twenty files, the design mistake is years old. A notion can be provably incomplete with a *single* consumer, or with none at all.

The test is not "how often is this repeated", it is **"which axes of this concept does the framework refuse to express?"**

The reference case, already fixed, is the potion effect. It began as a vanilla effect you posed on a player. That notion was incomplete: it could not say *how much* (a magnitude that is not vanilla's fixed levels), nor *how long* (permanent versus a TTL), nor *on whom, and when* (scoped to a role, a team, a condition, an interaction). Those axes are now expressible, and the notion is complete. Every other GDK notion deserves the same interrogation.

So for each notion the GDK owns (an effect, a victory condition, a role, a camp, an announcement, a target selection, a timer, a day/night phase, a power state), build its **completeness grid**: list the axes a game mode could plausibly need to vary, and mark which ones the API can express today. The unexpressible axes are the finding.

**Then bring the grid to the user, do not fill it alone.** Which axes matter is a product decision about what game modes you intend to support, and it is not derivable from the code. Run the interrogation the way `grill-me` prescribes: one question at a time, with a recommended answer for each, and go read the code to settle anything the code can settle. Ask what the notion must be able to say, not how to implement it. The answers become the target API in the report.

## The loop

1. **Scope it.** Whole boundary, one subsystem (effects, victory, commands, announcements, day/night), or one consumer module? Ask if unclear; do not audit 70 role files when the user meant the effects API.
2. **Census the escape hatches.** Run `scripts/sweep.sh` (from the repo root). It counts raw `Bukkit.*` reach-throughs, hand-rolled schedulers, hand-fired events, `@EventHandler` clusters and repeated code shapes across the consumer modules. Numbers, not vibes: a shape repeated in 22 role files is a stronger finding than a smell you disliked.
3. **Read the frontier.** The GDK side: `module/UHCGameModule.kt`, `module/role/UHCGameRole.kt`, `UHCGameTeam.kt`, `module/GDKGameContext.kt`, `attributes/GDKPlayerAttributeManager.kt`, `command/`. The consumer side: what the modules actually do with it.
4. **Grid every notion in scope.** For each one, which axes can the API express, which does it refuse? An escape hatch in the census is usually the symptom; the unexpressible axis is the disease. Chase the symptom back to the notion.
5. **Turn each hit into a finding**, using the catalogue in [HEURISTICS.md](HEURISTICS.md). A finding is not "this is ugly": it names the friction, the evidence (`file:line`, and how many sites), the axis the framework cannot express, the declarative API that should replace it, and what it costs to build.
6. **Interrogate the user on the incomplete notions** before writing the target API. What must the concept be able to say? Which variants do you intend to support? One question at a time, each with a recommendation. Their answers are what makes a proposed API right rather than merely plausible.
7. **Rank by leverage**, not by irritation: a notion that every future game mode will hit outranks a shape repeated in twenty files today.
8. **Report.** Write `AUDIT-DX.md` per [REPORTING.md](REPORTING.md). Always. Then ask before filing issues.
9. **Hand off.** You do not fix anything here. Once a finding is agreed, hand it to **`alta-refactor`** (scope, evidence, target API, constraints) and let that skill run its own grill + safety-net + atomic-slices loop.

## Guardrails

- **Read-only.** No production code is edited under this skill. The output is a report and a backlog. If the user wants a fix now, hand off to `alta-refactor` explicitly rather than drifting into editing.
- **Evidence or silence.** Every finding carries `file:line` pointers and a site count. No finding rests on a hunch.
- **Perf claims need a mechanism.** "This allocates per tick, on `GameTimerManager`'s 20 Hz path, N times per player" is a finding. "This feels slow" is not. Say what you measured or what you can prove by reading; if it needs a profile, say that the profile is the next step.
- **No Rule of Three here.** It is the right rule for `alta-refactor` (do not abstract until duplication proves the shape) and the wrong one for a young framework: a notion can be provably incomplete on its first consumer. Judge a notion by the axes it cannot express, not by how many times someone has already worked around it. A single site is enough if the axis is real.
- **But YAGNI still bites, so ask instead of guessing.** The counterweight to dropping the Rule of Three is the user, not your imagination. An axis is real because a game mode you intend to build needs it, and only the user knows that. Never propose an API built on axes you invented: put the grid in front of them and let them cut it down. Speculative generality is still the failure mode; the interrogation is the guard against it.
- **The public API is a commitment.** Anything you propose promoting to `public` is forever, and must pass `verifyPublicApiClosure` (no third-party types in public GDK signatures). Prefer a new declarative hook with a sane default over exposing an internal manager.
- **Do not confuse this with `alta-refactor`.** That skill improves code where it stands, behaviour-preserving, one file at a time. This one asks whether the *framework boundary* is in the right place, and produces a backlog. Read `alta-refactor`'s smell catalogue rather than duplicating it here.
- **No em dashes** anywhere you write (code, report, issue bodies, commit messages). Repo rule.

## Output

`AUDIT-DX.md` at the repo root, in French, one section per finding, severity-graded (HAUTE / MOYENNE / BASSE) like the game-mode audits in `audits/`. Then, on the user's green light only, one GitHub issue per retained finding via `scripts/file-finding.sh`, which opens the issue, puts it on the `Minecraft・UHC GDK` Project v2 board and sets its Priority, Size and Status fields. See [REPORTING.md](REPORTING.md) for the format, the label map and the severity-to-field mapping.
