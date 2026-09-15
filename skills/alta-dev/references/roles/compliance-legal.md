# Compliance and legal

The laws, licences and standards a piece of software must satisfy to be shipped. Decided in Phase 1
(which regimes apply), built to, and gated in Phase 3. Read with `privacy.md` (personal data),
`security.md` (controls) and `dependencies.md` (licences of what you pull in).

**You are not counsel.** Surface the applicable regime and its concrete obligations, implement the
technical controls, and state your assumptions. Where a decision needs a lawyer, a DPO or a
certification body, say so and stop; never present a legal conclusion as authoritative.

## Phase 1: which regimes apply

Decide before designing, because the answer shapes the architecture (consent flows, data location,
audit logs, kill switches):

- **Personal data** -> GDPR (EU), CCPA / CPRA (California) and local equivalents: lawful basis,
  minimisation, retention, subject rights, cross-border transfer. Detail in `privacy.md`.
- **AI or automated decisions** -> the EU AI Act (risk tier, transparency, human oversight), ISO 42001.
- **A product placed on the EU market** -> the Cyber Resilience Act: secure by default, vulnerability
  handling, an SBOM, a stated support lifetime.
- **Sector rules**: health -> HIPAA; card payments -> PCI-DSS; finance and critical infra -> DORA, NIS2;
  public sector and consumer web -> accessibility law (ADA, EU EAA), which makes WCAG 2.2 AA a **legal**
  floor, not just a quality one (`ui-ux.md`).
- **Export controls and sanctions** on cryptography and on who may receive the software.
- **Data residency** rules that pin where data may be stored and processed.

Name the regimes that apply in the orientation note; "none apply" is a decision, stated, not a default.

## Open-source licences and IP (every dependency, every snippet)

- **Read the licence before you add the dependency**, and record it. Attribution mechanics: `dependencies.md`.
- **Copyleft is a design decision.** GPL / AGPL / LGPL obligations propagate; understand the contamination
  and the distribution trigger before pulling one into a proprietary or differently-licensed product.
- **Ship the obligations**: bundled licence texts, a NOTICE / attribution file, and a source offer where
  copyleft requires it. An SBOM (SPDX or CycloneDX) is increasingly a legal deliverable, not just ops.
- **Your project's own licence is chosen deliberately**, compatible with everything it depends on.
- **No code of unknown provenance.** Decompiled, copied or AI-suggested code carries the source's licence
  and its risk; cite the source (the provenance rule) and confirm the licence permits the use.

## Restrictions (what the software may not do)

Third-party terms of service and API limits; scraping and rate rules; secrets never committed or logged;
PII minimised, encrypted and deleted on schedule; cross-border transfer only on a lawful mechanism;
telemetry disclosed and consented. Each restriction is a named constraint, respected like any other.

## The gate (Phase 3)

- [ ] The regimes named in Phase 1 are met by the design, in their concrete obligations.
- [ ] Every dependency's licence is recorded, compatible, and its attribution shipped; SBOM produced if owed.
- [ ] Personal data has a lawful basis, minimisation, retention and subject-rights paths (`privacy.md`).
- [ ] Accessibility meets the legal floor where one applies (WCAG 2.2 AA, `ui-ux.md`).
- [ ] Secrets, telemetry, cross-border transfers and export constraints handled and disclosed.
- [ ] Anything needing a qualified human (legal, DPO, certification) is flagged, not assumed.

An unmet legal or normative obligation is a **blocking** finding, like any correctness defect.

## Depth on demand

The opt-in `cybersec` plugin implements many of these operationally: `implementing-gdpr-data-protection-controls`,
`implementing-iso-27001-information-security-management`, `implementing-pci-dss-compliance-controls`,
`performing-soc2-type2-audit-preparation`, `performing-nist-csf-maturity-assessment`,
`performing-privacy-impact-assessment`, `analyzing-sbom-for-supply-chain-vulnerabilities`,
`grc-compliance-privacy-program`. Enable it for compliance-heavy work.
