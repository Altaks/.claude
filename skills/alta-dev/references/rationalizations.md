# Table complète des rationalisations

Every excuse below was actually made, and corrected, in these codebases. The ten most frequent are kept
inline in `SKILL.md`; this is the full set.

**Quand la lire**: the moment a sentence starting with "it is fine because", "close enough", "I'll just",
"surely", or "later" forms. And systematically before claiming anything is done (Phase 3), because that
is where most of them fire.

## P1, ne pas deviner

| Excuse | Réalité |
|---|---|
| "I'll assume the sensible default and note it." | Assuming is guessing. Ask; if unreachable, stop and return the question. |
| "I read the issue title, that is enough." | Read it, its comments, its links and the spec it cites. The doc-versus-code gap is often the bug. |
| "Behaviour is obvious from the request." | Surface the silent side effects and confirm them. Obvious to you is a guess to them. |

## P2, P3, P4, P5 : ce qu'on écrit

| Excuse | Réalité |
|---|---|
| "It is a tiny helper, it reads better." | "REMEMBER THAT I DON'T WANT THIS KIND OF SMALL HELPER FUNCTIONS SINCE THEY ONLY ALIAS ONE METHOD CALL." Delete it. (P2) |
| "The wrapper is a test seam, not production logic." | It is in production code, so it is production complexity. Mock the API. (P3) |
| "It is all framework calls, so I added an interface to test it." | Complexity for tests only is forbidden in production code. Extract only if it simplifies; otherwise cover it end to end. (P3) |
| "I wrote a small util for this." | Check the utils first. It exists. (P4) |
| "The builder was overkill for one item." | The builder exists precisely for that. (P4) |
| "I wrote a fresh implementation, it came out cleaner." | Find the exemplar and copy its shape. Consistency beats local elegance. (P4) |
| "It is only used once, a literal is clearer." | Magic string again. Name it. (P5) |
| "That method surely exists, the name is obvious." | Read the declaration. A plausible signature is fabricated until verified. |

## Structure et architecture

| Excuse | Réalité |
|---|---|
| "I added an abstraction for the future case." | YAGNI. "Is this needed?" and the answer is usually no. |
| "I'll structure it properly once it grows." | A structure decided after the fact is one nobody chose. Name the boundary first. |
| "Three layers is overkill here." | The count is negotiable, the direction is not. Two layers one way is fine; a domain importing an adapter is not. |
| "Grouping the controllers together is tidier." | It scatters one feature across the tree. Split by feature, never by mechanism. |
| "I'll build the data layer first, the UI after." | Slice vertically. A layer nobody can demonstrate is not a deliverable. |
| "The spike works, I'll clean it up later." | Spike code is deleted, not promoted. Rebuild with what you learned. |
| "The reason for that choice is in the PR somewhere." | Not findable in two years. An expensive-to-reverse decision gets an ADR with the rejected options. |

## Coût et robustesse

| Excuse | Réalité |
|---|---|
| "Reading config on click keeps it live-editable." | "Re-reading from the configuration on EVERY click ???" Cache at construction. (P8) |
| "I early-returned so it cannot crash." | A subscriber that cannot find its entity is corrupted state. Let it throw. (P9) |
| "I added a null check and the crash stopped." | That turned a loud bug into a silent one (P9). Why was the value null? |
| "The bundle grew a bit, it is fine." | A budget nobody enforces is a wish. Declare the number, fail the build. |
| "It is a small breaking change, consumers will adapt." | Expand, migrate, contract, as three changes. Discovery via a failing build is the failure. |
| "I stored the timestamp, the zone is obvious." | Until the next region, machine or daylight-saving change. |
| "It is one string, I'll hardcode it for now." | A user-facing literal makes the second language a rewrite instead of a file. |

## Vérification

| Excuse | Réalité |
|---|---|
| "The test asserts the handler was called." | It does not check *which* event. Assert the exact signal. (P10) |
| "The E2E is green." | Green *because* of your change? Revert, watch it go red, restore. (P10) |
| "That test is slow and needs Docker." | Duration is not a criterion. Boot it and watch it pass. (P10) |
| "`:module:check` passed." | Run the root gate. Consumers must compile too. |
| "I could not run the gate, so I described what it would do." | Not run is not passed. Say it up front. |
| "The test is flaky, I'll retry it." | A flaky test is a real concurrency bug until proven otherwise. Retrying disables the alarm. |
| "The symptom is gone, the bug is fixed." | If you cannot say why it happened, it is a coincidence. Root cause, then the test. |
| "No natural pure unit, so I skipped verification." | The end-to-end test is mandatory regardless. Never leave a behaviour unverified. (P10) |

## Livraison et boucle

| Excuse | Réalité |
|---|---|
| "Review only left nitpicks, close enough." | Nitpicks are in scope. Loop until clean. |
| "I bundled the tasks, the diff is coherent." | Stack the PRs. Linear review is the point. |
| "3 of the 5 tasks are done, the run is complete." | It is not. State the score and what is left. |
| "I'll check whether the tests can run once the code is written." | Preflight first. An unverifiable change is not shippable. |
| "The user corrected me, I fixed that line." | Fix every occurrence, then persist the rule in memory, project rules and skill. |

## Données et vie privée

| Excuse | Réalité |
|---|---|
| "I'll collect the field now, we might need it." | No purpose, no collection. Data never stored needs no protection, deletion or breach notice. |
| "Deletion removes the row, that is enough." | Deletion cascades: derived tables, indexes, caches, exports, logs, analytics, third parties. |
| "I logged the payload so we can debug it." | That payload is a data store, probably holding personal data. Log the decision and the identifiers. |
