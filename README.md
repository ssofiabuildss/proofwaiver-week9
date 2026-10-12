# ProofWaiver — Increment 2

**FICTIONAL DEMO — NO REAL HIRING**

Simulation-only employer agreement workflow. No real employers, candidates, hiring, authentication or external audits. Browser-local `localStorage` is editable and is **not** a tamper-proof audit trail. Do not enter real personal information.

## Setup

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Run `npm test` and `npm run build` separately. Preserve the original locked `docs/PACKET.md` and mockup; they are not part of this increment's patch.

## Increment 2 demo

1. Open Employer Agreement, edit the fictional draft, and save.
2. Submit the draft. It remains PENDING_APPROVAL until human review.
3. Open Agreement Review, enter a rationale, and approve or reject.
4. If approved, return to Employer Agreement and change a material term; the new version returns to DRAFT, while the approved snapshot remains in the review history.
5. To check expiry behavior, use an agreement with a short future expiry and revisit after that date; expiry is processed on view render. Do not change system clock to claim a genuine time-based expiry test.
6. Reload and confirm records remain in this browser's local storage.

Only employer agreement and simulated approval controls are implemented. Waiver event eligibility, LLM advisory, waiver verification, and dashboard metrics remain reserved for later increments.

## Test status / boundaries

- T01: Agreement required fields, draft submission and activation gate now testable; verify manually too.
- T02: Pending vs. approved/rejected review with rationale now testable.
- T09: Expiry without events testable as a foundation; derived never-tested dashboard metric pending.
- T16/T21: Approved historical versions remain unchanged during proposed amendments; event linkage pending Increment 3.
- T23: Expired previously tested agreements pending Increment 3 and dashboard integration.
- T12: schema rejection portion only; LLM forwarding pending Increment 4.
- T17: responsive shell and agreement/review workflow can be inspected, full four-workflow mobile acceptance pending.

No acceptance test should be described as fully passed until its required manual/automated checks are completed and confirmed.

## Proposed second commit

`feat: add employer agreement and human approval workflow`
