import {readDatabase,transaction} from '../data/storage.js';
import {recordWaiverEvent,eventEligibility} from '../logic/eligibility.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const isoNow=()=>new Date().toISOString();
function choices(db){
 const usable=db.agreement_versions.filter(v=>{
  const a=db.agreements.find(a=>a.agreement_id===v.agreement_id);
  return a&&a.version_id===v.version_id&&['ACTIVE','CLOSED','EXPIRED'].includes(a.state);
 });
 return usable.map(v=>`<option value="${esc(v.version_id)}">${esc(v.vacancy_ref)} — ${esc(v.original_assessment_name)} (${esc(v.version_id)})</option>`).join('');
}
export function WaiverVerification(){
 const db=readDatabase();const options=choices(db);
 const records=db.waiver_events.map(e=>`<tr><td>${esc(e.event_id)}</td><td>${esc(e.agreement_version_id)}</td><td>${esc(e.eligibility_status)}</td><td>${esc(e.workflow_state)}</td></tr>`).join('');
 return `<h2>Waiver Verification</h2><p>Increment 3: fictional event intake and deterministic eligibility only. LLM advisory and final human verification are not active.</p>
 <section class="panel"><h3>Record fictional hiring event</h3><p class="hint">Use only fictional CAND_DEMO_ references. The positive-proof boolean represents a previously accepted simulated trigger, not a score.</p>
 ${options?`<form id="waiver-event-form">
 <label class="field"><span>Approved agreement version</span><select name="agreement_version_id" required>${options}</select></label>
 <div class="form-grid"><label class="field"><span>Unique fictional event ID (EVT_...)</span><input name="event_id" required maxlength="80" value="EVT_DEMO_002"></label>
 <label class="field"><span>Fictional candidate reference (CAND_DEMO_...)</span><input name="fictional_candidate_ref" required maxlength="80" value="CAND_DEMO_002"></label></div>
 <label class="field"><span>Accepted positive proof presented?</span><select name="positive_proof_presented" required><option value="true">Yes — true</option><option value="false">No — false</option></select></label>
 <label class="field"><span>Event trigger (UTC)</span><input name="trigger_time" required type="datetime-local" step="1" value="${esc(isoNow().slice(0,19))}"><small>Time is entered as UTC for deterministic simulation.</small></label>
 <label class="field"><span>Original assessment administered?</span><select name="original_assessment_administered"><option>UNKNOWN</option><option>YES</option><option>NO</option></select></label>
 <label class="field"><span>Employer-reported activity</span><textarea name="employer_outcome_description" required maxlength="1200" rows="2">Fictional employer reports the baseline evaluation was removed; review pending.</textarea></label>
 <div class="form-grid"><label class="field"><span>Replacement assessment name (optional)</span><input name="replacement_assessment_name" maxlength="240"></label><label class="field"><span>Replacement method (optional)</span><input name="replacement_method" maxlength="240"></label></div>
 <label class="field"><span>Replacement capability (optional)</span><textarea name="replacement_capability" maxlength="1200" rows="2"></textarea></label>
 <label class="field"><span>Interview fulfillment (separate)</span><select name="interview_fulfillment"><option>UNVERIFIED</option><option>FULFILLED</option><option>NOT_FULFILLED</option></select></label>
 <button type="submit">Record fictional event</button></form>`:'<p>No approved agreement versions are available. Approve an agreement first in Agreement Review.</p>'}
 <p id="event-feedback" role="status"></p></section>
 <section class="panel"><h3>Recorded fictional events</h3><div class="table-scroll"><table><thead><tr><th>Event ID</th><th>Approved version</th><th>Eligibility</th><th>State</th></tr></thead><tbody>${records||'<tr><td colspan="4">No events recorded yet.</td></tr>'}</tbody></table></div><p class="hint">This is an intake list, not a dashboard metric or removal decision. No removal is confirmed.</p></section>`;
}
export function bindWaiverVerification(refresh){
 const form=document.querySelector('#waiver-event-form');if(!form)return;
 form.addEventListener('submit',e=>{
  e.preventDefault();
  try{
   const data=Object.fromEntries(new FormData(form).entries());
   data.positive_proof_presented=data.positive_proof_presented==='true';
   // datetime-local string is interpreted explicitly as UTC, never by the browser timezone.
   data.trigger_time=new Date(data.trigger_time+'Z').toISOString();
   for(const key of ['replacement_assessment_name','replacement_method','replacement_capability'])data[key]=data[key].trim()||null;
   const outcome=transaction((db,save)=>recordWaiverEvent(db,save,data));refresh();
   document.querySelector('#event-feedback').textContent=`Event ${outcome.event_id} recorded as ${outcome.eligibility_status}. No removal credit assigned.`;
  }catch(err){const target=document.querySelector('#event-feedback');target.className='error';target.textContent=err.message;}
 });
}
