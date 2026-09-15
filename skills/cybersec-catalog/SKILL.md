---
name: cybersec-catalog
description: Use for any AUTHORIZED offensive or defensive security task — red team, pentest, bug bounty, exploit/CVE work, malware analysis, DFIR, incident response, threat hunting, detection engineering, SIEM/YARA/Sigma, cloud/mobile/IoT/OT security, or CTF. A large security skill library (872 skills) is installed but kept disabled to save context; this skill tells you it exists and how to switch it on.
---

# cybersec-catalog — gateway to the opt-in security library

A vendored library of **872 offensive + defensive security skills** (`cybersec` plugin) is present
in this configuration but **disabled by default** so it costs ~0 context tokens in normal projects.
It is invisible to you until enabled — that is intentional.

**Coverage:** red team, exploit dev, web/API appsec, active directory, wireless, cloud (AWS/Azure/GCP),
mobile, IoT/OT, supply chain, C2 — and the defensive side: DFIR, memory/disk forensics, detection
engineering (Sigma/YARA/Splunk SPL), incident response, threat hunting, SIEM, hardening. MITRE ATT&CK-mapped.

## When this skill triggers

The task is a real, **authorized** security engagement or exercise (see coverage above) and you would
benefit from specialist tradecraft that isn't currently loaded.

## What to do

1. **Confirm authorization + scope** in one line (engagement, lab, CTF, own systems). If the task is
   clearly unauthorized (attacking third parties without permission), decline instead of enabling.
2. **Tell the user** the library exists and is currently off, and name the sub-area you'd draw on.
3. **Offer to enable it.** With the user's OK, run:

   ```bash
   # One-time, if the marketplace isn't registered yet:
   claude plugin marketplace add /path/to/this/.claude   # the repo root that holds .claude-plugin/marketplace.json

   # Enable the plugin (choose scope: project keeps it local to this repo):
   claude plugin enable cybersec@altaks-claude --scope project
   ```

4. **Tell the user to restart the session.** Enabled plugin skills load at session start, so the 872
   skills become available in the **next** session, not the current one. Do not claim they are usable now.
5. Never enable it silently or globally without asking; a project-scoped enable is the safe default.

## Notes

- To turn it back off: `claude plugin disable cybersec@altaks-claude` (context cost returns to ~0).
- Attribution, licensing, coverage detail and update procedure: `plugins/cybersec/ORIGIN.md` and
  `plugins/cybersec/UPDATING.md`.
- Authorized use only: red/blue team engagements, bug bounty, CTF, research, training.
