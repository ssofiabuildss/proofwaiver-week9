import {readDatabase} from '../data/storage.js';
import {accountability} from '../logic/accounting.js';
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const card=(name,value)=>`<div class="metric"><span>${esc(name)}</span><strong>${esc(value)}</strong></div>`;
export function AccountabilityDashboard(){
 const db=readDatabase(),m=accountability(db);
 const agreementCards=[['Created',m.agreements.created],['Activated',m.agreements.activated],['Active',m.agreements.active],['Expired / Closed',m.agreements.expiredClosed],['Never Tested',m.agreements.neverTested]];
 const eventCards=[['Eligible',m.events.eligible],['Confirmed removed — demo review',m.events.removed],['Replaced',m.events.replaced],['Not removed',m.events.notRemoved],['Unverified',m.events.unverified],['Pending',m.events.pending]];
 return `<h2>Accountability Dashboard</h2><p>FICTIONAL DEMO — NO REAL HIRING. Calculated from browser-local fictional records, not independently audited.</p>
 <section class="panel"><h3>Agreement-level accountability</h3><div class="metrics">${agreementCards.map(([n,v])=>card(n,v)).join('')}</div><p class="hint">Activated counts distinct agreements with approved versions. Never Tested is derived for closed/expired agreements with zero eligible events across versions.</p></section>
 <section class="panel"><h3>Event-level accountability</h3><div class="metrics">${eventCards.map(([n,v])=>card(n,v)).join('')}</div><h3>Waiver rate: ${m.waiverRate===null?'N/A':`${(m.waiverRate*100).toFixed(1)}%`}</h3><p>${m.events.removed} confirmed removed / ${m.events.eligible} eligible events</p><p class="hint">Eligible = confirmed removed + replaced + not removed + unverified + pending. Unfavorable and pending eligible events remain in the denominator.</p></section>
 <section class="panel"><h3>Interview fulfillment — separate from waiver outcome</h3><div class="metrics">${[['Fulfilled',m.interviews.fulfilled],['Not fulfilled',m.interviews.notFulfilled],['Unverified',m.interviews.unverified]].map(([n,v])=>card(n,v)).join('')}</div></section>
 <section class="panel"><h3>Event history</h3><div class="table-scroll"><table><thead><tr><th>Event</th><th>Approved version</th><th>Eligibility at trigger</th><th>Economic result</th><th>Interview</th></tr></thead><tbody>${db.waiver_events.map(e=>`<tr><td>${esc(e.event_id)}</td><td>${esc(e.agreement_version_id)}</td><td>${esc(e.eligibility_status)}</td><td>${esc(e.eligibility_status!=='ELIGIBLE'?'Excluded':e.human_outcome==='VERIFIED_REMOVED'?'Confirmed removed — demo review':e.human_outcome||'PENDING')}</td><td>${esc(e.interview_fulfillment)}</td></tr>`).join('')||'<tr><td colspan="5">No fictional events recorded</td></tr>'}</tbody></table></div></section>`;
}
