import {validateRecord,validateDatabase} from './validation.js';

const clone=value=>structuredClone(value);
const uid=prefix=>`${prefix}_${crypto.randomUUID().replaceAll('-','')}`;
const utc=()=>new Date().toISOString();
const text=(value,label,max=1200)=>{
  if(typeof value!=='string'||!value.trim()||value!==value.trim()||value.length>max||/[<>]/.test(value))throw new Error(`Invalid ${label}`);
  return value;
};
const iso=(value,label)=>{
  if(typeof value!=='string'||Number.isNaN(Date.parse(value))||new Date(value).toISOString()!==value)throw new Error(`Invalid ${label}`);
  return value;
};

// Historical snapshot is authoritative for activation, obligation and expiration.
// Current agreement is consulted only to prevent new events under a superseded version
// and to honor early closure of the same current version.
export function eventEligibility(db,versionId,positiveProof,triggerTime,now=utc()){
  if(typeof positiveProof!=='boolean')throw new Error('Positive-proof trigger must be a boolean');
  iso(triggerTime,'trigger time');iso(now,'current time');
  const version=db.agreement_versions.find(v=>v.version_id===versionId);
  if(!version||version.state!=='ACTIVE'||version.reviewer_decision!=='APPROVED'||!version.active_at||!version.approved_at)return 'INELIGIBLE';
  const current=db.agreements.find(a=>a.agreement_id===version.agreement_id);
  if(!current||current.version_id!==versionId)return 'INELIGIBLE';
  const t=Date.parse(triggerTime);
  if(!positiveProof||t<Date.parse(version.active_at)||t>=Date.parse(version.expires_at)||t>Date.parse(now))return 'INELIGIBLE';
  if(current.state==='DRAFT'||current.state==='PENDING_APPROVAL')return 'INELIGIBLE';
  if(current.state==='CLOSED'&&current.closed_at&&t>=Date.parse(current.closed_at))return 'INELIGIBLE';
  if(current.state==='EXPIRED'&&current.closed_at&&Date.parse(current.closed_at)<Date.parse(version.expires_at)&&t>=Date.parse(current.closed_at))return 'INELIGIBLE';
  return 'ELIGIBLE';
}

const FIELDS=Object.freeze(['event_id','agreement_version_id','fictional_candidate_ref','positive_proof_presented','trigger_time','original_assessment_administered','employer_outcome_description','replacement_assessment_name','replacement_method','replacement_capability','interview_fulfillment']);

export function recordWaiverEvent(db,save,input,now=utc()){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!FIELDS.includes(k)))throw new Error('Unsupported event field');
  for(const k of FIELDS)if(!Object.hasOwn(input,k))throw new Error(`Missing event field: ${k}`);
  // IDs are supplied by the fictional operator so a repeated source event remains identifiable.
  text(input.event_id,'event ID',80);text(input.agreement_version_id,'version ID',80);
  text(input.fictional_candidate_ref,'fictional candidate reference',80);
  if(!/^EVT_[A-Za-z0-9_-]{2,75}$/.test(input.event_id))throw new Error('Event ID must begin EVT_');
  if(!/^CAND_DEMO_[A-Za-z0-9_-]{2,68}$/.test(input.fictional_candidate_ref))throw new Error('Use a fictional CAND_DEMO_ reference, not a real candidate identity');
  if(db.waiver_events.some(e=>e.event_id===input.event_id))throw new Error('Duplicate event ID');
  // We permit at most one event per agreement version and fictional candidate reference.
  if(db.waiver_events.some(e=>e.agreement_version_id===input.agreement_version_id&&e.fictional_candidate_ref===input.fictional_candidate_ref))throw new Error('Duplicate fictional hiring event for version and candidate reference');
  if(typeof input.positive_proof_presented!=='boolean')throw new Error('Positive proof must be true or false');
  const version=db.agreement_versions.find(v=>v.version_id===input.agreement_version_id);
  if(!version)throw new Error('Select an existing approved agreement version');
  const eligibility=eventEligibility(db,input.agreement_version_id,input.positive_proof_presented,input.trigger_time,now);
  const event={...input,eligibility_status:eligibility,workflow_state:'RECORDED',llm_flag:null,llm_rationale:null,human_outcome:null,human_rationale:null,reviewed_at:null};
  validateRecord('waiver_events',event);
  db.waiver_events.push(clone(event));validateDatabase(db);save(db);
  return clone(event);
}

// Derived foundations only; final rates and dashboard totals belong to Increment 6.
export function eligibleEventCount(db){return db.waiver_events.filter(e=>e.eligibility_status==='ELIGIBLE').length;}
export function neverTestedStatus(db,agreementId){
  const versions=db.agreement_versions.filter(v=>v.agreement_id===agreementId);
  const current=db.agreements.find(a=>a.agreement_id===agreementId);
  if(!current||!['CLOSED','EXPIRED'].includes(current.state)||versions.length===0)return false;
  const ids=new Set(versions.map(v=>v.version_id));
  return !db.waiver_events.some(e=>ids.has(e.agreement_version_id)&&e.eligibility_status==='ELIGIBLE');
}
