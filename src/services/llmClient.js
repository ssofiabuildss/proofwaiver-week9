import {validateComparisonInput,validateAdvisory,FALLBACK,comparisonFromRecords} from './compareContract.js';
import {validateDatabase} from '../logic/validation.js';

export async function requestAdvisory(version,event,{fetcher=fetch}={}){
  let input;
  try {input=comparisonFromRecords(version,event);} catch {return {...FALLBACK};}
  try {
    const response=await fetcher('/api/compare',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(validateComparisonInput(input)),signal:AbortSignal.timeout(12000)
    });
    if(!response.ok)return {...FALLBACK};
    return validateAdvisory(await response.json());
  }catch{return {...FALLBACK};}
}

// Deterministic storage update. AI cannot change eligibility, activation, or economic outcome.
export function recordAdvisory(db,save,eventId,advisory){
  const event=db.waiver_events.find(e=>e.event_id===eventId);
  if(!event||event.eligibility_status!=='ELIGIBLE'||
      !['RECORDED','AI_FLAGGED'].includes(event.workflow_state)||event.human_outcome!==null)
    throw new Error('Only eligible, unfinalized fictional events can receive advisory output');
  if(!db.agreement_versions.some(v=>v.version_id===event.agreement_version_id))
    throw new Error('Approved agreement version missing');
  const safe=validateAdvisory(advisory);
  event.llm_flag=safe.flag;
  event.llm_rationale=safe.rationale;
  event.workflow_state='AI_FLAGGED';
  validateDatabase(db);save(db);
  return {...safe};
}
