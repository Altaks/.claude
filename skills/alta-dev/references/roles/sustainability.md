# Sustainability (eco-design)

Building a digital service that does its job for the least energy, data, and hardware. Decided in
Phase 1 (the highest-leverage choices are early), built to, and gated in Phase 3. The performance
budgets in `frontend.md` are the same lever: ship less; here the reason is also carbon and device
longevity, not only speed.

## Two anchors

- **RGESN** (Référentiel général d'écoconception de services numériques, ARCEP / Arcom 2024): 78 criteria
  across nine families spanning strategy, specifications, architecture, UX/UI, content, frontend,
  backend, hosting, and algorithms. Mandatory for public bodies (REEN law), recommended under CSRD/ESG.
  The authoritative criteria list: https://ecoresponsable.numerique.gouv.fr/publications/referentiel-general-ecoconception/
- **Green Software Foundation**: three principles, **energy efficiency** (do the work with fewer joules),
  **carbon awareness** (do it when and where the grid is cleaner), **hardware efficiency** (make old
  devices last), measured by the SCI (Software Carbon Intensity).

**You are not an auditor.** Apply the practices and hold the budget; a formal RGESN declaration needs the
official evaluation sheet and a proper audit. Flag that; do not claim conformance you did not measure.

## Phase 1: the choices that dominate

- **The greenest feature is the one not built** (YAGNI, as sustainability). Question necessity first;
  every screen, asset, and background job has a lifetime cost.
- **Target the low end**: support old devices and slow networks, so the service does not force hardware
  renewal. This is a design constraint, not a nice-to-have.
- **Minimise data**: collect, transfer, and store the least (this meets `privacy.md` at the same time).
- **Set an eco-budget** now: page weight and request count for the first view, query count per action,
  and where possible an energy or SCI estimate. A budget that is not enforced in CI is a wish
  (`frontend.md`).
- **Choose hosting deliberately**: an efficient provider and a lower-carbon region; scale-to-zero or
  sleep for idle workloads; right-size rather than over-provision.

## Build practices

- **Frontend**: the `frontend.md` performance budgets, in full. Ship less JS, lazy-load below the fold,
  right-format and right-size images, cache aggressively, avoid needless polling, animation loops, and
  autoplay. A byte not sent costs no energy anywhere.
- **Backend and algorithms**: efficient queries (no N+1), pagination over full scans, do work once and
  cache it, batch instead of chatter, pick an algorithm by its measured cost on real inputs
  (`systems.md`). Idle services should idle, not spin.
- **Content and UX**: durable over disposable; a low-data mode when the audience needs it; no dark
  pattern that manufactures engagement (infinite scroll, autoplay) and burns energy for it.
- **Lifecycle**: remove dead features and their data; an unused endpoint or asset is pure waste.

## The gate (Phase 3)

- [ ] The eco-budget set in Phase 1 holds: first-view weight, request count, queries per action, measured.
- [ ] The service runs on the low-end target device and network that was chosen.
- [ ] Data collected, transferred, and stored is minimised; nothing dead is shipped.
- [ ] Hosting choice (efficiency, region, idle behaviour) is deliberate and stated.
- [ ] For a formal RGESN context, the applicable criteria were reviewed and gaps flagged for audit.

A busted eco-budget is a performance regression by another name: reported with before/after numbers.

## Depth on demand

The full RGESN criteria and the Green Software Foundation patterns (SCI, carbon-aware scheduling) are the
references to open when a service must formally conform or when optimising a measured hot path.
