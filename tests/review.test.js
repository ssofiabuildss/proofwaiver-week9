import test from 'node:test';import assert from 'node:assert/strict';
import {finalizeWaiver,removalGateErrors} from '../src/logic/review.js';
import {fictionalFixtures} from '../src/data/demoFixtures.js';
const now='2026-10-11T12:00:00.000Z';
function dbFor(description='The named baseline test was not administered and no evaluation was required in the fictional event.'){
 const db=structuredClone(fictionalFixtures);
 const v=structuredClone(db.agreements[0]);v.state='ACTIVE';v.reviewer_decision='APPROVED';v.approved_at='2026-10-01T00:00:00.000Z';v.active_at=v.approved_at;v.expires_at='2026-11-01T00:00:00.000Z';
 db.agreements[0]=structuredClone(v);db.agreement_versions.push(v);
 db.waiver_events.push({event_id:'EVT_TEST1',agreement_version_id:v.version_id,fictional_candidate_ref:'CAND_DEMO_TEST1',positive_proof_presented:true,trigger_time:now,eligibility_status:'ELIGIBLE',original_assessment_administered:'NO',employer_outcome_description:description,replacement_assessment_name:null,replacement_method:null,replacement_capability:null,workflow_state:'AI_FLAGGED',llm_flag:'CLEAR',llm_rationale:'No apparent match',human_outcome:null,human_rationale:null,reviewed_at:null,interview_fulfillment:'UNVERIFIED'});
 return db;
}
const request=(db,outcome='VERIFIED_REMOVED')=>({event_id:'EVT_TEST1',agreement_version_id:db.agreement_versions[0].version_id,outcome,rationale:'The fictional reviewer assessed the original and reported activity.',attestations:Array(6).fill(true),interview_fulfillment:'NOT_FULFILLED'});
test('six consistent gates allow human verified removal; interview independent',()=>{const db=dbFor();const event=finalizeWaiver(db,()=>{},request(db),now);assert.equal(event.human_outcome,'VERIFIED_REMOVED');assert.equal(event.interview_fulfillment,'NOT_FULFILLED');assert.equal(db.reviews[0].kind,'WAIVER');});
test('unchecked gate blocks removal',()=>{const db=dbFor();const r=request(db);r.attestations[3]=false;assert.throws(()=>finalizeWaiver(db,()=>{},r,now),/Six human evidence/);assert.equal(db.waiver_events[0].human_outcome,null);});
test('renamed equivalent blocks despite CLEAR',()=>{const db=dbFor('The named test was removed but renamed as a skills exercise in interview.');assert.throws(()=>finalizeWaiver(db,()=>{},request(db),now),/Gate 3/);});
test('replacement fields block positive credit',()=>{const db=dbFor();db.waiver_events[0].replacement_capability='Same spreadsheet capability';assert.throws(()=>finalizeWaiver(db,()=>{},request(db),now),/Gate 3/);});
test('retained named assessment cannot count as removed',()=>{const db=dbFor();db.waiver_events[0].original_assessment_administered='YES';assert.throws(()=>finalizeWaiver(db,()=>{},request(db),now),/Gate 2/);});
test('vague evidence cannot confirm removal',()=>{const db=dbFor('Done.');assert.throws(()=>finalizeWaiver(db,()=>{},request(db),now),/Gate 4/);});
test('AI missing does not prevent human UNVERIFIED',()=>{const db=dbFor();db.waiver_events[0].llm_flag=null;db.waiver_events[0].workflow_state='RECORDED';const result=finalizeWaiver(db,()=>{},request(db,'UNVERIFIED'),now);assert.equal(result.human_outcome,'UNVERIFIED');});
test('same event cannot be finalized twice',()=>{const db=dbFor();finalizeWaiver(db,()=>{},request(db),now);assert.throws(()=>finalizeWaiver(db,()=>{},request(db),now),/already finalized/);});
test('mismatched approved version rejected',()=>{const db=dbFor();const r=request(db);r.agreement_version_id='VER_WRONG';assert.throws(()=>finalizeWaiver(db,()=>{},r,now),/exact version/);});
test('clear advisory cannot bypass inconsistent original administered flag',()=>{const db=dbFor();db.waiver_events[0].original_assessment_administered='YES';const r=request(db,'REPLACED');assert.throws(()=>finalizeWaiver(db,()=>{},r,now),/NOT_REMOVED/);});
