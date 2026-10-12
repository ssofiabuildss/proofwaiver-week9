# ProofWaiver — implementation decisions

## Increment 1 — accepted (user-reported evidence)

- Lightweight Vite + vanilla JavaScript; no database or authentication.
- Exactly four product views, switched by hash navigation.
- Persistent fictional-demo banner in the common shell.
- Browser localStorage with strict allowlisted schema validation; malformed stored data is rejected rather than silently repaired.
- One fictional draft agreement and no preapproved version or waiver event.
- No candidate profiles, failed scores, or real personal information.
- Local storage is not tamper-proof and is not externally audited.
- No LLM or dashboard accounting in Increment 1.

## Increment 1 evidence — reported by user

- Vite dev server started; fictional banner, four navigation sections, and draft visible.
- Unit tests: 3 passed, 0 failed.
- `npm run build` completed successfully.
- Commit 1: `chore: initialize ProofWaiver demo structure`.
- T01 remains partial; T12 remains partial (LLM forwarding pending); T17 remains shell-only (complete mobile workflows pending).
- No deployment evidence reported.

## Increment 2 — implemented locally; user verification pending

- Browser-local employer agreement drafts can be edited and submitted for simulated human review.
- `PENDING_APPROVAL` never auto-activates; reviewer rationale is mandatory for approval/rejection.
- Approved version stored as a separate historical snapshot that application workflow never edits; current agreement is the lifecycle head.
- Amendments to ACTIVE obligations create a fresh DRAFT version requiring renewed approval. Earlier approved snapshots remain unchanged.
- Expiry runs deterministically when screens render; closing only applies to ACTIVE agreements.
- Historical review decisions are distinct records, not externally audited or authenticated.
- No waiver-event eligibility, LLM client, final review or dashboard metrics implemented.
- T01/T02 supported by agreement workflow; T09/T16/T21 partial until event and dashboard behavior exist. T23 pending event-history behavior. T12/T17 still partial.

## Increment 2 evidence log

- User local execution: PENDING.
- User local automated tests: PENDING.
- Manual browser checks: PENDING.
- Commit 2: NOT YET CREATED.
- Deployment: NOT YET CREATED.
