# Temps, dates et fuseaux

A whole class of bugs that only appears in production, at a specific hour, in a specific region, twice
a year. All of it is avoidable with a few fixed rules. Read with `data.md` (storage) and `i18n.md`
(display).

## 1. Trois concepts, trois types

Most time bugs come from using one type for all three.

| Concept | Ce que c'est | Exemple |
|---|---|---|
| **Instant** | A point on the universal timeline. Absolute, zone-independent. | When the account was created, when the message was sent. |
| **Date ou heure locale** | A calendar concept with no instant attached until you pick a zone. | A birthday, an opening hour, a billing day, a game's daily reset. |
| **Durée** | A length of time, with no position. | A cooldown, a timeout, a session length. |

Model them with different types, and the compiler stops most of the mistakes. A birthday stored as an
instant shifts by a day for half the world; a cooldown stored as an instant expires at the wrong
moment after a restart.

## 2. Stocker en UTC, convertir au bord

- Instants are **stored and transported in UTC**, with the zone in the type, and converted only for
  display, at the very edge.
- A timestamp with no zone is a bug waiting for the next deployment region or the next developer's
  machine.
- When a local date genuinely matters (a legal deadline, a billing day, a business day), store the
  local date **and** the zone it is expressed in. You cannot recover the zone later.
- Keep one precision across the stack. Truncation between the database, the code and the wire produces
  comparisons that fail by a microsecond.

## 3. Deux horloges, deux usages

- **Wall clock** for "when did this happen": it is the one users recognise, and it jumps. Time
  synchronisation corrects it, daylight saving shifts it, an operator can set it.
- **Monotonic clock** for "how long did this take": elapsed time, timeouts, cooldowns, rate limits.
  Never subtract two wall-clock readings to measure a duration.
- **Inject the clock.** No direct call to "now" buried in the logic. It makes tests deterministic, it
  makes a simulated or accelerated clock possible, and it is the difference between a testable rule
  and a flaky one.
- When the domain has its own clock (a game that can be paused, sped up or warped), schedule against
  **that** clock, so everything scheduled moves with it.

## 4. Ne jamais faire d'arithmétique à la main

- No millisecond arithmetic for calendar operations. Months, years and days are not fixed lengths.
- "One day later" is not "plus 24 hours" on the two days a year daylight saving changes.
- Use the platform's date library for every add, subtract, difference and truncation.
- Beware the two daylight-saving hours: the one that does not exist, and the one that happens twice.
  Any recurring schedule eventually lands on both.
- February 29 exists. So does a year boundary in the middle of a week.

## 5. Frontières

- **"Today" depends on who is asking.** A daily report, a daily limit and a daily reset all need a
  declared reference zone, written down, not inherited from the server.
- A range is half-open by convention: inclusive start, exclusive end. State it once and apply it
  everywhere, or every boundary query will be off by one row.
- Expiry and time-to-live are stored as the **instant they expire**, never as the remaining duration:
  a remaining duration is wrong the moment the process restarts.

## 6. Systèmes distribués

- Never assume two machines agree on the time. Clock skew is real, and a comparison of two hosts'
  timestamps is not an ordering.
- When order matters, use a sequence number or a single authoritative clock, not the sender's
  timestamp (see `concurrency.md`).
- The timestamp a client sends is an input: validate it, and prefer your own for anything that
  matters.

## 7. Affichage

- Format through the locale, never with a hand-written pattern (see `i18n.md`).
- Show the zone when the value could be misread, and prefer the user's zone over the server's.
- Relative time ("3 minutes ago") is friendly but ambiguous past a day; pair it with the absolute value
  on hover or beside it.

## 8. Tests

- A fixed, injected clock in every test that touches time. A test that passes only outside daylight
  saving is a failing test that has not fired yet.
- Test the boundaries deliberately: the daylight-saving transitions, the year boundary, February 29,
  the exact expiry instant, and the instant one unit before and after.
