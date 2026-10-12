# ProofWaiver — implementation decisions

## Increment 1 — proposed; awaiting local verification

- Lightweight Vite + vanilla JavaScript; no database or authentication.
- Exactly four product views, switched by hash navigation.
- Persistent fictional-demo banner in the common shell.
- Browser localStorage with strict allowlisted schema validation; malformed stored data is rejected rather than silently repaired.
- Fixture data consists of one fictional draft agreement and no approved versions or waiver events. This prevents implying that unimplemented approval/eligibility controls have run.
- No candidate profiles, scores, failed attempts, or real personal information.
- Local storage is not tamper-proof and is not externally audited.
- No LLM or dashboard accounting in Increment 1.

## Evidence log

- Local execution: NOT YET REPORTED.
- Tests: NOT YET REPORTED.
- Commit: NOT YET CREATED.
- Deployment: NOT YET CREATED.


## Increment 1 test mapping correction

- **T01:** Validation foundation only; the complete agreement activation test remains pending Increment 2.
- **T12:** Schema allowlists and forbidden-field rejection only; testing that disallowed information is not forwarded to the LLM remains pending Increment 4.
- **T17:** Responsive shell check only; full mobile usability of all four workflows remains pending their implementation.
- No acceptance test is marked fully passed on the basis of Increment 1 alone.
- Documentation correction only; no application code or product scope changed.

**Proposed first commit:** `chore: initialize ProofWaiver demo structure` (not yet created).
