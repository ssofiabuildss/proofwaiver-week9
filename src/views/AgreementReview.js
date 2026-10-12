import {readDatabase,transaction} from '../data/storage.js';
import {decideAgreement,approvedVersions} from '../logic/agreements.js';
const escape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function AgreementReview(){
 const db=readDatabase();const pending=db.agreements.filter(a=>a.state==='PENDING_APPROVAL');
 const pendingHtml=pending.map(a=>`<article class="panel"><h3>${escape(a.vacancy_ref)} — ${escape(a.role_title)}</h3>
 <p><strong>Employer:</strong> ${escape(a.fictional_employer)}<br><strong>Capability:</strong> ${escape(a.baseline_capability)}<br><strong>Named assessment:</strong> ${escape(a.original_assessment_name)} (${escape(a.original_assessment_method)})<br><strong>Accepted proof:</strong> ${escape(a.accepted_positive_proof_criterion)}<br><strong>Interview promise:</strong> ${escape(a.interview_commitment)}<br><strong>Expires:</strong> ${escape(a.expires_at)}</p>
 <form class="review-form" data-id="${escape(a.agreement_id)}"><label class="field"><span>Human reviewer rationale (required)</span><textarea name="rationale" required minlength="1" maxlength="1200"></textarea></label><div class="actions"><button type="submit" name="decision" value="APPROVED">Approve and activate</button><button class="secondary" type="submit" name="decision" value="REJECTED">Reject to draft</button></div></form></article>`).join('');
 const history=db.agreement_versions.map(v=>`<li>${escape(v.agreement_id)} · ${escape(v.version_id)} · ${escape(v.original_assessment_name)} · approved ${escape(v.approved_at)} — preserved approved snapshot</li>`).join('');
 const reviews=db.reviews.filter(r=>r.kind==='AGREEMENT').map(r=>`<li>${escape(r.decision)} · ${escape(r.agreement_version_id)} · ${escape(r.rationale)} · ${escape(r.reviewed_at)}</li>`).join('');
 return `<h2>Agreement Review</h2><p>Simulated human review only. No authenticated reviewer or external audit.</p><h3>Pending approval</h3>${pendingHtml||'<p>No agreements pending review.</p>'}
 <h3>Approved version history</h3><ul>${history||'<li>None yet.</li>'}</ul><h3>Simulated review decisions</h3><ul>${reviews||'<li>No review decisions yet.</li>'}</ul><p id="review-feedback" role="alert"></p>`;
}
export function bindAgreementReview(refresh){
 document.querySelectorAll('.review-form').forEach(form=>form.addEventListener('submit',e=>{
   e.preventDefault();const decision=e.submitter?.value;
   try{
     const rationale=new FormData(form).get('rationale');
     transaction((db,save)=>decideAgreement(db,save,form.dataset.id,decision,rationale));
     refresh();document.querySelector('#review-feedback').textContent=`Simulated human decision recorded: ${decision}.`;
   }catch(err){const f=document.querySelector('#review-feedback');f.textContent=err.message;f.className='error';}
 }));
}
