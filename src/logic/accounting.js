import {neverTestedStatus} from './eligibility.js';
export function accountability(db){
 const a=db.agreements,events=db.waiver_events;
 const eligible=events.filter(e=>e.eligibility_status==='ELIGIBLE');
 const n=outcome=>eligible.filter(e=>e.workflow_state==='FINALIZED'&&e.human_outcome===outcome).length;
 const removed=n('VERIFIED_REMOVED'),replaced=n('REPLACED'),notRemoved=n('NOT_REMOVED'),unverified=n('UNVERIFIED');
 const pending=eligible.length-removed-replaced-notRemoved-unverified;
 if(pending<0||removed+replaced+notRemoved+unverified+pending!==eligible.length)throw new Error('Event accounting invariant failed');
 return {
  agreements:{created:a.length,activated:new Set(db.agreement_versions.map(v=>v.agreement_id)).size,active:a.filter(v=>v.state==='ACTIVE').length,expiredClosed:a.filter(v=>['EXPIRED','CLOSED'].includes(v.state)).length,neverTested:a.filter(v=>neverTestedStatus(db,v.agreement_id)).length},
  events:{eligible:eligible.length,removed,replaced,notRemoved,unverified,pending},
  interviews:{fulfilled:eligible.filter(e=>e.interview_fulfillment==='FULFILLED').length,notFulfilled:eligible.filter(e=>e.interview_fulfillment==='NOT_FULFILLED').length,unverified:eligible.filter(e=>e.interview_fulfillment==='UNVERIFIED').length},
  waiverRate:eligible.length?removed/eligible.length:null
 };
}
