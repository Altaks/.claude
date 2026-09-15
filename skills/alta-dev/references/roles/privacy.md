# Vie privée et données personnelles

Personal data is a liability you are borrowing, not an asset you own. The rules below are engineering
rules, and they are decided in Phase 1 with the spec, because retrofitting deletion, consent or
minimisation into a shipped feature is a rewrite.

Read with `data.md` (storage), `security.md` (access), `observability.md` (what never reaches a log).

## 1. Ce qui compte comme donnée personnelle

Broader than a name and an email. Also: account and device identifiers, IP addresses, precise
location, behavioural traces, anything a user typed into a free-text field (which will eventually
contain everything), and **combinations that re-identify** even when each part looks anonymous.

Special categories (health, biometrics, political or religious views, sexual orientation, criminal
records) carry stricter obligations, and a free-text field can collect them by accident.

## 2. Minimisation, à la conception

At spec time, four questions per field, answered in the ticket:

- **What** exactly is collected?
- **Why**, in terms of the feature that needs it? "It might be useful later" is not a purpose.
- **For how long**, precisely?
- **Who** can read it, and how is that enforced?

A field that cannot answer all four does not get collected. This is the cheapest privacy control there
is, because data you never stored needs no protection, no deletion and no breach notification.

**Purpose limitation.** Data collected for one purpose is not reused for another without a deliberate
decision. Feeding an existing dataset into a new analytics tool, a new model or a new vendor is a new
purpose, not a technical detail.

## 3. Consentement, quand il s'applique

- Granular, per purpose. One checkbox covering everything is not consent.
- **Revocable**, and revoking it actually stops the processing and triggers the deletion.
- Recorded: what was accepted, when, and against which version of the wording.
- **The product works when it is refused.** A feature that breaks without consent is a dark pattern
  wearing an engineering excuse.
- Pre-ticked boxes and consent bundled into terms acceptance do not count.

## 4. Rétention et suppression

- **Every dataset has a documented retention**, and an automated job that enforces it. "Forever" is a
  decision that gets written down and justified, not a default.
- Deletion is a **feature**, designed and tested, not a manual query someone runs on request.
- **Deletion cascades**, and this is where implementations fail. The checklist:
  primary store, derived tables and aggregates, search indexes, caches, queues in flight, exports and
  reports, logs and traces, error reports, analytics, backups (policy and delay stated), and every
  third party you sent it to.
- Anything you cannot delete immediately (an immutable backup, an append-only ledger) has a stated
  policy: how long until it ages out, and what protects it meanwhile.

## 5. Droits des personnes

Access, export, rectification, deletion, objection. Each one is a feature with an owner and a
deadline, not an ad-hoc script.

- The export is machine-readable and complete, including the derived data about the person.
- The identity of the requester is verified before anything is returned or deleted.
- The request is traceable: who asked, when, what was done.

## 6. Pseudonymisation n'est pas anonymisation

- **Pseudonymised data is still personal data.** Replacing the name with an identifier changes nothing
  legally if the mapping exists anywhere.
- True anonymisation is irreversible and harder than it looks: a small number of quasi-identifiers
  re-identifies most people. Do not claim it lightly.
- Hashing an email is not anonymisation: the input space is small enough to enumerate.

## 7. Environnements et logs

- **Never a raw production dump in a lower environment.** Scrub deterministically, or generate
  realistic synthetic data. The scrubbing job is code, reviewed and tested like any other.
- Logs, traces and error reports are data stores. No personal data in them by default: scrub payloads
  at the point of emission, and never log a full request body containing user input.
- Screenshots, fixtures and test data committed to the repository must not contain real people.

## 8. Tiers

Every processor is a decision: a hosting provider, an analytics tool, an email sender, a model
provider, a support tool. Each one needs a documented purpose, a contract, and an entry in the record
of what goes where. Sending data to a new vendor is a data transfer even when it is one line of
configuration.

Cross-border transfers are a legal decision, not an infrastructure detail. Ask before choosing a
region.

## 9. Accès

Least privilege on the data itself, not only on the application (see `security.md`). Sensitive records
carry an audit trail of who read them, and a broad export capability is itself a risk that deserves a
control.

## 10. Violation de données

A plan exists before it is needed: how it is detected, who is told, in what order, and within what
deadline. The clock is short, and it starts at awareness, not at confirmation. Handle it through the
incident process in `devops.md`, with the legal path attached.

## En review

Flag as blocking: a new field capturing personal data with no stated purpose or retention; a log line
or an error report carrying an email, a token or a payload; an export returning more columns than the
use case needs; a deletion path that stops at the primary table; a new third party added without a
purpose written down.
