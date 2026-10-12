import {validateRecord, validateDatabase} from './validation.js';

export const MATERIAL_FIELDS = Object.freeze([
  'fictional_employer','vacancy_ref','role_title','baseline_capability',
  'original_assessment_name','original_assessment_method',
  'accepted_positive_proof_criterion','interview_commitment','expires_at'
]);
const ISO = () => new Date().toISOString();
const uid = prefix => `${prefix}_${crypto.randomUUID().replaceAll('-','')}`;
const copy = value => structuredClone(value);
const persist = (db,save) => {validateDatabase(db);save(db);return db;};
const findAgreement=(db,id)=>{
  const agreement=db.agreements.find(a=>a.agreement_id===id);
  if(!agreement)throw new Error('Agreement not found');
  return agreement;
};
const versionHasEvents=(db,versionId)=>db.waiver_events.some(e=>e.agreement_version_id===versionId);
const requireDraft=a=>{if(a.state!=='DRAFT')throw new Error('Only a DRAFT may be edited or submitted');};
function fields(input){
  const permitted=new Set(MATERIAL_FIELDS);
  if(!input || typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!permitted.has(k)))throw new Error('Unsupported agreement form fields');
  for(const k of MATERIAL_FIELDS)if(!Object.hasOwn(input,k))throw new Error(`Missing field: ${k}`);
  return Object.fromEntries(MATERIAL_FIELDS.map(k=>[k,input[k]]));
}
function ensureDates(a,now,minimum=null){
  if(Date.parse(a.expires_at)<=Date.parse(now))throw new Error('Expiry must be in the future');
  if(minimum && Date.parse(a.expires_at)<=Date.parse(minimum))throw new Error('Expiry must follow activation');
}
function assertVersionUnused(db,id){if(db.agreement_versions.some(v=>v.version_id===id)||db.agreements.some(a=>a.version_id===id))throw new Error('Duplicate version ID');}
export function saveDraft(db,save,input,agreementId=null,now=ISO()){
  const draftFields=fields(input);
  if(agreementId){
    const a=findAgreement(db,agreementId);requireDraft(a);
    const updated={...a,...draftFields};validateRecord('agreements',updated);ensureDates(updated,now);
    const index=db.agreements.indexOf(a);db.agreements[index]=updated;
    persist(db,save);return copy(updated);
  }
  const result={agreement_id:uid('AGR'),version_id:uid('VER'),...draftFields,state:'DRAFT',created_at:now,approved_at:null,active_at:null,closed_at:null,reviewer_decision:null,reviewer_rationale:null};
  validateRecord('agreements',result);ensureDates(result,now);
  db.agreements.push(result);persist(db,save);return copy(result);
}
export function submitAgreement(db,save,id,now=ISO()){
  const a=findAgreement(db,id);requireDraft(a);validateRecord('agreements',a);ensureDates(a,now);
  a.state='PENDING_APPROVAL';a.reviewer_decision=null;a.reviewer_rationale=null;
  persist(db,save);return copy(a);
}
export function decideAgreement(db,save,id,decision,rationale,now=ISO()){
  const a=findAgreement(db,id);
  if(a.state!=='PENDING_APPROVAL')throw new Error('Agreement is not pending approval');
  if(!['APPROVED','REJECTED'].includes(decision))throw new Error('Invalid human review decision');
  const review={review_id:uid('REV'),kind:'AGREEMENT',record_id:a.agreement_id,agreement_version_id:a.version_id,decision,rationale,reviewed_at:now};
  validateRecord('reviews',review);
  if(decision==='APPROVED'){
    ensureDates(a,now);
    if(db.agreement_versions.some(v=>v.version_id===a.version_id))throw new Error('Approved version already exists');
    a.state='ACTIVE';a.approved_at=now;a.active_at=now;a.closed_at=null;
    a.reviewer_decision='APPROVED';a.reviewer_rationale=rationale;
    // Approved version is a historical snapshot; never edited or deleted by workflow functions.
    db.agreement_versions.push(copy(a));
  } else {
    a.state='DRAFT';a.reviewer_decision='REJECTED';a.reviewer_rationale=rationale;
  }
  db.reviews.push(review);persist(db,save);return copy(a);
}
export function proposeAmendment(db,save,id,input,now=ISO()){
  const a=findAgreement(db,id);
  if(a.state!=='ACTIVE')throw new Error('Only an ACTIVE agreement can be amended');
  if(!db.agreement_versions.some(v=>v.version_id===a.version_id))throw new Error('Missing approved version');
  const changes=fields(input);
  if(MATERIAL_FIELDS.every(k=>changes[k]===a[k]))throw new Error('No material change to submit');
  const proposed={...a,...changes,version_id:uid('VER'),state:'DRAFT',created_at:now,approved_at:null,active_at:null,closed_at:null,reviewer_decision:null,reviewer_rationale:null};
  validateRecord('agreements',proposed);ensureDates(proposed,now);
  assertVersionUnused(db,proposed.version_id);
  db.agreements[db.agreements.indexOf(a)]=proposed;
  persist(db,save);return copy(proposed);
}
export function closeAgreement(db,save,id,now=ISO()){
  const a=findAgreement(db,id);
  if(a.state!=='ACTIVE')throw new Error('Only an ACTIVE agreement can close');
  a.state=Date.parse(now)>=Date.parse(a.expires_at)?'EXPIRED':'CLOSED';a.closed_at=now;
  // Historical approved snapshot remains ACTIVE with original dates and terms.
  persist(db,save);return copy(a);
}
export function expireAgreements(db,save,now=ISO()){
  let changed=0;
  for(const a of db.agreements){
    if(a.state==='ACTIVE' && Date.parse(now)>=Date.parse(a.expires_at)){
      a.state='EXPIRED';a.closed_at=now;changed++;
    }
  }
  if(changed)persist(db,save);
  return changed;
}
export function approvedVersions(db,id){return copy(db.agreement_versions.filter(v=>v.agreement_id===id));}
