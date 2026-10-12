import {readDatabase,transaction} from '../data/storage.js';
import {saveDraft,submitAgreement,proposeAmendment,closeAgreement} from '../logic/agreements.js';

const FIELDS=[
 ['fictional_employer','Fictional employer'],['vacancy_ref','Fictional vacancy reference'],
 ['role_title','Role title'],['baseline_capability','Baseline capability'],
 ['original_assessment_name','Named original assessment'],['original_assessment_method','Original assessment method'],
 ['accepted_positive_proof_criterion','Accepted positive-proof criterion'],
 ['interview_commitment','Interview commitment']
];
const MULTI=new Set(['baseline_capability','accepted_positive_proof_criterion','interview_commitment']);
const escape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const inputVal=(a,k)=>escape(a?.[k]||'');
function form(a,mode){
  const labels=FIELDS.map(([k,label])=>`<label class="field"><span>${label}</span>${MULTI.has(k)?`<textarea name="${k}" required maxlength="1200" rows="2">${inputVal(a,k)}</textarea>`:`<input name="${k}" required maxlength="240" value="${inputVal(a,k)}">`}</label>`).join('');
  const date=a?.expires_at?a.expires_at.slice(0,10):'';
  return `<form id="agreement-form" data-mode="${mode}" data-id="${escape(a?.agreement_id||'')}"><div class="form-grid">${labels}<label class="field"><span>Expiry date (UTC, end of day)</span><input required type="date" name="expiry_day" value="${date}"></label></div><button type="submit">${mode==='amend'?'Create new draft version':'Save fictional draft'}</button><p class="hint">Saving a draft does not approve or activate an obligation.</p></form>`;
}
export function EmployerAgreement(){
  const db=readDatabase();const selected=new URLSearchParams(location.hash.split('?')[1]||'').get('id');
  const a=selected==='new'?null:(db.agreements.find(x=>x.agreement_id===selected)||db.agreements[0]);
  const list=`<option value="new" ${selected==='new'?'selected':''}>+ New fictional agreement</option>`+db.agreements.map(x=>`<option value="${escape(x.agreement_id)}" ${x===a?'selected':''}>${escape(x.vacancy_ref)} · ${escape(x.state)}</option>`).join('');
  const edit=a?.state==='DRAFT';const amend=a?.state==='ACTIVE';const fresh=!a;
  return `<h2>Employer Agreement</h2><p>Record a named assessment-removal obligation for a specific fictional vacancy. No real hiring.</p>
  <label class="field"><span>Agreement</span><select id="agreement-select">${list}</select></label>
  ${a?`<p><strong>Current:</strong> ${escape(a.agreement_id)} · ${escape(a.version_id)} · <strong>${escape(a.state)}</strong></p>`:''}
  ${fresh?form(null,'new'):edit?form(a,'edit'):amend?`<p>To change approved terms, propose a new version. The prior approved version will remain stored.</p>${form(a,'amend')}`:`<p>This record is awaiting human review or is closed/expired. Existing terms are read-only here.</p>`}
  ${edit?`<button id="submit-agreement" data-id="${escape(a.agreement_id)}">Submit for simulated human review</button>`:''}
  ${amend?`<button id="close-agreement" class="secondary" data-id="${escape(a.agreement_id)}">Close active agreement</button>`:''}
  <p id="agreement-feedback" role="alert"></p>`;
}
export function bindEmployerAgreement(refresh){
  const feedback=document.querySelector('#agreement-feedback');
  const report=e=>{feedback.textContent=e.message;feedback.className='error';};
  document.querySelector('#agreement-select')?.addEventListener('change',e=>{location.hash='#agreement?id='+encodeURIComponent(e.target.value);refresh();});
  document.querySelector('#agreement-form')?.addEventListener('submit',e=>{
    e.preventDefault();try{
      const f=e.currentTarget,values=Object.fromEntries(new FormData(f));
      const expiry=values.expiry_day;delete values.expiry_day;
      values.expires_at=`${expiry}T23:59:59.000Z`;
      const a=transaction((db,save)=>f.dataset.mode==='amend'?proposeAmendment(db,save,f.dataset.id,values):saveDraft(db,save,values,f.dataset.mode==='new'?null:f.dataset.id));
      location.hash='#agreement?id='+a.agreement_id;refresh();
      document.querySelector('#agreement-feedback').textContent='Fictional draft saved. No approval or activation occurred.';
    }catch(err){report(err);}
  });
  document.querySelector('#submit-agreement')?.addEventListener('click',e=>{
    try{transaction((db,save)=>submitAgreement(db,save,e.currentTarget.dataset.id));refresh();document.querySelector('#agreement-feedback').textContent='Submitted. Human approval is still required.';}catch(err){report(err);}
  });
  document.querySelector('#close-agreement')?.addEventListener('click',e=>{
    try{transaction((db,save)=>closeAgreement(db,save,e.currentTarget.dataset.id));refresh();document.querySelector('#agreement-feedback').textContent='Agreement closed. Approved version preserved.';}catch(err){report(err);}
  });
}
