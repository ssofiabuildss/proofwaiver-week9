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

## Increment 3 — fictional waiver-event eligibility (proposed; await local acceptance)

- New fictional events link to the exact approved `agreement_version_id`; the immutable approved snapshot governs activation and expiry. Current agreement linkage prevents new submissions against superseded versions. Previously recorded records and eligibility values are not rewritten on later expiry or amendment.
- Fictional operator-supplied `EVT_` identifiers are required for meaningful retry/duplicate detection; uniqueness is additionally restricted by agreement version and fictional `CAND_DEMO_` reference. No real candidate identities, profiles or scores are collected.
- Accepted positive proof is a strict boolean, never scored. False triggers, out-of-window times, future triggers and unapproved/superseded versions are ineligible. A trigger exactly at `expires_at` is ineligible. Historical valid events retain their original eligibility when an agreement later expires.
- Both eligible and ineligible fictional events are retained for transparency. `eligibleEventCount` counts only `ELIGIBLE`; `neverTestedStatus` is a derived boolean for CLOSED/EXPIRED agreements with no eligible events across approved versions. Neither function is connected to the final dashboard in Increment 3.
- Reported assessment and interview fields are collected as fictional event inputs for later steps, but no LLM, human waiver decisions, verified-removal outcome, rates or finished dashboard is implemented here.
- Local browser storage is editable, not an external audit log. All tests and deployment claims remain subject to the user's actual local run.


## Deployment 1 — user-reported real evidence

- Vercel project: `proofwaiver-week9`.
- URL: `https://proofwaiver-week9-cat258jsb-ssofia1.vercel.app`.
- Commit: `cfac086` (Increment 3).
- User visually confirmed permanent fictional banner and four approved sections, plus foundation, human agreement approval/versioning and deterministic fictional event intake/eligibility.
- This is a working intermediate demo, not completed waiver verification, market validation, a secure audit, or real hiring evidence.

## Increment 4 — bounded LLM comparison implementation (local verification pending)

- Added a single server-side Vercel Function at `/api/compare`, using server-only `OPENAI_API_KEY` and `OPENAI_MODEL`. No browser key, database, login, or additional product screens.
- Both browser and server share a strict seven-field comparison allowlist, typed limits, and optional null replacement fields. The user-supplied description is explicitly framed as untrusted data in the model instruction. Obvious email addresses are blocked; no claim of flawless free-text PII detection.
- Request body capped at 4096 bytes. Model request capped at 160 completion tokens, 8-second provider timeout. A 12-per-minute in-memory, per-function-instance throttle is a demonstration-only limit and not guaranteed across Vercel instances; do not present it as production-grade abuse protection.
- Model uses strict JSON schema for `CLEAR`, `REVIEW`, `INSUFFICIENT` and rationale; responses are revalidated server-side and client-side. Missing key, provider failure, timeout, malformed response, unexpected values or refusal produce `INSUFFICIENT` plus a safe rationale.
- Only eligible, non-finalized fictional events can request/persist an advisory. Results are stored as `llm_flag`, `llm_rationale`, and `AI_FLAGGED`; approved snapshots, positive-proof eligibility, final economic outcomes and numerator are not changed. CLEAR means apparent absence of replacement, never verified removal.
- The record remains available for later simulated human review. Final human confirmation and dashboard accounting remain excluded until Increment 5 and 6.
- Tests T04/T05/T06/T08/T13/T18/T22 are only partially covered by AI-boundary and advisory behavior; the final human/economic outcomes cannot be tested in Increment 4. T12 forwarding boundaries can now be tested at the endpoint, while manual real-provider and mobile tests remain pending.
- No new deployment has been performed. Local and user acceptance still pending. Proposed commit 4: `feat: add bounded AI equivalence advisory`.

## Increment 5 — human verification
- Six locked removal gates checked by deterministic logic; simulated human attestation is necessary but cannot override contradictory structured evidence.
- Missing AI is permitted for human review; AI never decides outcomes.
- One FINALIZED event has one linked WAIVER review decision. Interview fulfillment remains independent.
- Simulation cannot detect every semantic equivalence from arbitrary descriptions; this limitation must be tested explicitly.

## Increment 6 — deterministic accounting
- Agreement-level and event-level metrics derived from validated stored records, not saved as fabricated totals.
- E = R + P + N + U + H; zero E displays N/A. Pending and unfavorable events remain in E.
- Interview fulfillment is a separate eligible-event count and cannot imply removal.
- Full mobile, security and adversarial acceptance evidence remains pending user verification.
