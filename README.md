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

## Increment 3 — fictional event intake

The Waiver Verification navigation now contains an **event intake form only**. Approve a fictional agreement in Agreement Review, open Waiver Verification, select the approved version, enter an event ID beginning `EVT_`, a fictional reference beginning `CAND_DEMO_`, a UTC trigger timestamp, and the permitted controlled inputs. Form timestamps are treated as UTC; do not enter your local timezone as if it were UTC. Each submitted event is assigned `ELIGIBLE` or `INELIGIBLE` using approved-version terms and event time. Duplicate event IDs and a duplicate reference within the same agreement version are rejected.

To test a false trigger, choose **No — false**; the event is recorded but is not eligible. To test persistence, refresh and confirm the same records remain. To test expiry historically, run the deterministic unit tests rather than modifying your real clock. Existing approved snapshots and event records remain intact after expiry or a proposed material amendment.

No LLM, final reviewer classification or dashboard aggregation is included. `eligibleEventCount` and `neverTestedStatus` are foundational deterministic helpers only. Their outputs are not yet presented as dashboard metrics. The event form is fictional; no real candidate identifiers are allowed.

**Targeted acceptance coverage:** T09/T10/T14/T20 event eligibility; T16/T21 version history; T23 expired with earlier eligible event; T11/T24 denominator and never-tested foundations. Full dashboard review and other final test requirements remain later increments. These are test targets, not claims of locally confirmed acceptance.

**Proposed Commit 3:** `feat: enforce waiver eligibility and versioning`
