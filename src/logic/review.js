import {validateDatabase,validateRecord} from './validation.js';

const clone=value=>structuredClone(value);
const uid=()=>`REV_${crypto.randomUUID().replaceAll('-','')}`;
const ISO=()=>new Date().toISOString();
const forbiddenPattern=/\b(?:renam(?:e|ed|ing)|equivalent|same (?:skill|capability|test)|embedded|in[ -]?interview (?:exercise|test|task)|moved (?:to|into) (?:the )?interview|replac(?:e|ed|ement)|still (?:administered|required)|retained)\b/i;
const evidencePattern=/\b(?:removed|waived|omitted|not administered|not required|eliminated|skipped|did not administer)\b/i;

// These are recorded simulated human attestations, not independently verified facts.
// Contradictory structured fields or explicit descriptions always block positive credit.
export function removalGateErrors(db,event,review,now=ISO()){
 const errors=[];
 const version=db.agreement_versions.find(v=>v.version_id===event.agreement_version_id);
 if(event.eligibility_status!=='ELIGIBLE'||!version||version.state!=='ACTIVE'||version.reviewer_decision!=='APPROVED'||!version.interview_commitment||!version.original_assessment_name||!version.baseline_capability||Date.parse(event.trigger_time)<Date.parse(version.active_at)||Date.parse(event.trigger_time)>=Date.parse(version.expires_at))errors.push('Gate 1: approved, applicable obligation at event time');
 if(event.original_assessment_administered!=='NO')errors.push('Gate 2: named assessment explicitly not administered');
 const replacement=[event.replacement_assessment_name,event.replacement_method,event.replacement_capability].some(v=>v!==null);
 const description=event.employer_outcome_description;
 if(replacement||forbiddenPattern.test(description))errors.push('Gate 3: replacement, equivalence, renaming, or interview-embedded activity cannot receive removal credit');
 if(description.length<30||!evidencePattern.test(description)||forbiddenPattern.test(description))errors.push('Gate 4: sufficiently specific, consistent removal description required');
 if(!review||typeof review.rationale!=='string'||review.rationale.trim().length<15||!Number.isFinite(Date.parse(now)))errors.push('Gate 5: meaningful simulated human rationale and timestamp required');
 if(!review||review.event_id!==event.event_id||review.agreement_version_id!==event.agreement_version_id||db.waiver_events.filter(e=>e.event_id===event.event_id).length!==1)errors.push('Gate 6: unique event and exact approved version linkage');
 if(!review||!Array.isArray(review.attestations)||review.attestations.length!==6||review.attestations.some(v=>v!==true))errors.push('Six human evidence gates must all be explicitly checked');
 return errors;
}

export function finalizeWaiver(db,save,request,now=ISO()){
 const permitted=['event_id','agreement_version_id','outcome','rationale','attestations','interview_fulfillment'];
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!permitted.includes(k)))throw new Error('Unsupported review field');
 const event=db.waiver_events.find(e=>e.event_id===request.event_id);
 if(!event||event.agreement_version_id!==request.agreement_version_id||event.eligibility_status!=='ELIGIBLE')throw new Error('Eligible event and exact version required');
 if(event.workflow_state==='FINALIZED'||event.human_outcome!==null)throw new Error('Review already finalized');
 if(!['RECORDED','AI_FLAGGED','HUMAN_REVIEW'].includes(event.workflow_state))throw new Error('Invalid review state');
 if(!['VERIFIED_REMOVED','REPLACED','NOT_REMOVED','UNVERIFIED'].includes(request.outcome))throw new Error('Invalid outcome');
 if(typeof request.rationale!=='string'||request.rationale.trim()!==request.rationale||request.rationale.length<15||request.rationale.length>1200||/[<>]/.test(request.rationale))throw new Error('Reviewer rationale must be 15–1200 safe characters');
 if(!['FULFILLED','NOT_FULFILLED','UNVERIFIED'].includes(request.interview_fulfillment))throw new Error('Interview fulfillment must be recorded separately');
 if(!Array.isArray(request.attestations)||request.attestations.length!==6||request.attestations.some(x=>typeof x!=='boolean'))throw new Error('Six boolean gate attestations required');
 if(request.outcome==='VERIFIED_REMOVED'){
  const failures=removalGateErrors(db,event,request,now);
  if(failures.length)throw new Error(failures.join('; '));
 }
 // Strong consistency rules for unfavorable cases too.
 if(event.original_assessment_administered==='YES'&&request.outcome!=='NOT_REMOVED')throw new Error('Retained original assessment must be NOT_REMOVED');
 if(event.original_assessment_administered==='UNKNOWN'&&request.outcome==='VERIFIED_REMOVED')throw new Error('Original administration is unknown');
 const review={review_id:uid(),kind:'WAIVER',record_id:event.event_id,agreement_version_id:event.agreement_version_id,decision:request.outcome,rationale:request.rationale,reviewed_at:now};
 validateRecord('reviews',review);
 event.workflow_state='FINALIZED';event.human_outcome=request.outcome;event.human_rationale=request.rationale;event.reviewed_at=now;event.interview_fulfillment=request.interview_fulfillment;
 db.reviews.push(review);validateDatabase(db);save(db);return clone(event);
}
