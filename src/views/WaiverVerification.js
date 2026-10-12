import {readDatabase,transaction} from '../data/storage.js';
import {recordWaiverEvent} from '../logic/eligibility.js';
import {requestAdvisory,recordAdvisory} from '../services/llmClient.js';
import {finalizeWaiver} from '../logic/review.js';
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
 const records=db.waiver_events.map(e=>`<tr><td>${esc(e.event_id)}</td><td>${esc(e.agreement_version_id)}</td><td>${esc(e.eligibility_status)}</td><td>${esc(e.workflow_state)}</td><td>${e.llm_flag?`<strong>${esc(e.llm_flag)}</strong><small class="advisory-note">${esc(e.llm_rationale)}</small>`:'Not requested'}<small class="advisory-note">Advisory/demo only — not a removal decision</small></td><td>${e.eligibility_status==='ELIGIBLE'&&['RECORDED','AI_FLAGGED'].includes(e.workflow_state)?`<button type="button" data-compare="${esc(e.event_id)}">Compare assessments</button>`:'No comparison'} ${e.eligibility_status==='ELIGIBLE'&&e.workflow_state!=='FINALIZED'?`<button type="button" data-review="${esc(e.event_id)}">Human review</button>`:''}${e.workflow_state==='FINALIZED'?esc(e.human_outcome==='VERIFIED_REMOVED'?'Confirmed removed — demo review':e.human_outcome):''}</td></tr>`).join('');
 return `<h2>Waiver Verification</h2><p>Fictional event intake, AI advisory, and mandatory simulated human waiver review. This is not real employer verification.</p>
 <section class="panel"><h3>Record fictional hiring event</h3><p class="hint">Use only fictional CAND_DEMO_ references. Positive proof is a previously accepted simulated trigger, not a score.</p>
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
 <p id="event-feedback" role="status" aria-live="polite"></p></section>
 <section class="panel"><h3>Recorded fictional events</h3><p class="hint">Only ELIGIBLE events may request an advisory. The endpoint receives only seven assessment-comparison fields — never candidate reference, proof boolean or interview data.</p>
 <div class="table-scroll"><table><thead><tr><th>Event ID</th><th>Approved version</th><th>Eligibility</th><th>State</th><th>AI advisory (demo only)</th><th>Action</th></tr></thead><tbody>${records||'<tr><td colspan="6">No events recorded yet.</td></tr>'}</tbody></table></div><p id="compare-feedback" role="status" aria-live="polite"></p><p class="hint">CLEAR is not proof of removal. AI unavailable or invalid → INSUFFICIENT. Only a reasoned simulated human review can finalize an outcome.</p></section> <section class="panel" id="human-review-panel"><h3>Simulated human waiver review</h3><p class="hint">Human decision is independent of AI. Inaccurate or incomplete descriptions must never receive confirmed-removal credit. Six evidence gates are mandatory for confirmed removal.</p>
 <div id="human-review-content"><p>Select Human review on an eligible, unfinalized event.</p></div><p id="human-review-feedback" role="status" aria-live="polite"></p></section>`;
}
export function bindWaiverVerification(refresh){
 const form=document.querySelector('#waiver-event-form');
 if(form)form.addEventListener('submit',e=>{
  e.preventDefault();
  try{
   const data=Object.fromEntries(new FormData(form).entries());
   data.positive_proof_presented=data.positive_proof_presented==='true';
   data.trigger_time=new Date(data.trigger_time+'Z').toISOString();
   for(const key of ['replacement_assessment_name','replacement_method','replacement_capability'])data[key]=data[key].trim()||null;
   const outcome=transaction((db,save)=>recordWaiverEvent(db,save,data));refresh();
   document.querySelector('#event-feedback').textContent=`Event ${outcome.event_id} recorded as ${outcome.eligibility_status}. No removal credit assigned.`;
  }catch(err){const target=document.querySelector('#event-feedback');target.className='error';target.textContent=err.message;}
 });
 document.querySelectorAll('button[data-review]').forEach(button=>button.addEventListener('click',()=>{
   const db=readDatabase();const event=db.waiver_events.find(e=>e.event_id===button.dataset.review);
   const version=db.agreement_versions.find(v=>v.version_id===event?.agreement_version_id);
   if(!event||!version)return;
   document.querySelector('#human-review-content').innerHTML=reviewForm(event,version);
   document.querySelector('#human-final-form').addEventListener('submit',e=>{
     e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form).entries());
     const request={event_id:event.event_id,agreement_version_id:version.version_id,outcome:data.outcome,rationale:data.rationale,interview_fulfillment:data.interview_fulfillment,attestations:Array.from({length:6},(_,i)=>form.elements[`gate${i}`].checked)};
     try{transaction((fresh,save)=>finalizeWaiver(fresh,save,request));refresh();document.querySelector('#human-review-feedback').textContent='Simulated human decision recorded. This is not externally audited.';}
     catch(err){const el=document.querySelector('#human-review-feedback');el.className='error';el.textContent=err.message;}
   });
 }));
 document.querySelectorAll('button[data-compare]').forEach(button=>button.addEventListener('click',async()=>{
  const feedback=document.querySelector('#compare-feedback');
  button.disabled=true;feedback.textContent='Requesting assessment-only advisory…';
  try{
    const db=readDatabase();const event=db.waiver_events.find(e=>e.event_id===button.dataset.compare);
    const version=db.agreement_versions.find(v=>v.version_id===event?.agreement_version_id);
    if(!event||!version||event.eligibility_status!=='ELIGIBLE')throw new Error('Eligible event or approved version missing');
    const result=await requestAdvisory(version,event);
    transaction((fresh,save)=>recordAdvisory(fresh,save,event.event_id,result));
    refresh();document.querySelector('#compare-feedback').textContent=`${event.event_id}: ${result.flag} — AI advisory only. Simulated human review still required.`;
  }catch(err){button.disabled=false;feedback.className='error';feedback.textContent=err.message;}
 }));
}

function reviewForm(event,version){
 const gateLabels=['Approved obligation applicable at event time','Original named test was not administered','No equivalent, renamed, or interview-embedded replacement','Detailed, consistent employer description','Human reviewer has a rationale and timestamp','Exact unique event and approved version association'];
 return `<form id="human-final-form"><h4>Original approved obligation</h4><p><strong>${esc(version.original_assessment_name)}</strong> (${esc(version.original_assessment_method)}) — ${esc(version.baseline_capability)}</p><p>Interview commitment: ${esc(version.interview_commitment)}</p><h4>Employer-reported activity</h4><p>${esc(event.employer_outcome_description)}</p><p>Original test administered: <strong>${esc(event.original_assessment_administered)}</strong></p><p>Replacement: ${esc([event.replacement_assessment_name,event.replacement_method,event.replacement_capability].filter(Boolean).join(' / ')||'Not reported')}</p><h4>AI advisory — demo only</h4><p>${esc(event.llm_flag||'Not available')} — ${esc(event.llm_rationale||'Human review can proceed without AI.')}</p><p><strong>Event:</strong> ${esc(event.event_id)} · <strong>Approved version:</strong> ${esc(version.version_id)}</p>
 <label class="field"><span>Human economic outcome</span><select name="outcome"><option>UNVERIFIED</option><option>REPLACED</option><option>NOT_REMOVED</option><option>VERIFIED_REMOVED</option></select></label>
 <fieldset><legend>Six evidence gates — all required to confirm removal</legend>${gateLabels.map((label,i)=>`<label class="gate"><input type="checkbox" name="gate${i}"> ${esc(label)}</label>`).join('')}</fieldset>
 <label class="field"><span>Human reviewer rationale (minimum 15 characters)</span><textarea name="rationale" required minlength="15" maxlength="1200" rows="3"></textarea></label>
 <label class="field"><span>Interview fulfillment — separate outcome</span><select name="interview_fulfillment"><option>UNVERIFIED</option><option>FULFILLED</option><option>NOT_FULFILLED</option></select></label>
 <button type="submit">Finalize simulated human decision</button></form>`;
}
