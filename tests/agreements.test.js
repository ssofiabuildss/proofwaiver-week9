import test from 'node:test';
import assert from 'node:assert/strict';
import {fictionalFixtures} from '../src/data/demoFixtures.js';
import {saveDraft,submitAgreement,decideAgreement,proposeAmendment,closeAgreement,expireAgreements,approvedVersions} from '../src/logic/agreements.js';
import {validateDatabase} from '../src/logic/validation.js';
const now='2026-10-11T12:00:00.000Z';
const newDate='2026-11-15T23:59:59.000Z';
const setup=()=>{const db=structuredClone(fictionalFixtures);let saves=0;const save=x=>{validateDatabase(x);saves++;};return {db,save,count:()=>saves};};
const fields=a=>Object.fromEntries(['fictional_employer','vacancy_ref','role_title','baseline_capability','original_assessment_name','original_assessment_method','accepted_positive_proof_criterion','interview_commitment','expires_at'].map(k=>[k,k==='expires_at'?newDate:a[k]]));
test('T01: incomplete agreement cannot be submitted or approved',()=>{
 const {db,save}=setup();const a=db.agreements[0];
 assert.throws(()=>saveDraft(db,save,{...fields(a),original_assessment_name:''},a.agreement_id,now),/Invalid text/);
 assert.throws(()=>decideAgreement(db,save,a.agreement_id,'APPROVED','Approved',now),/not pending/);
 assert.equal(db.agreement_versions.length,0);
});
test('T02: submission does not activate; simulated human approval requires rationale',()=>{
 const {db,save}=setup();const a=db.agreements[0];
 submitAgreement(db,save,a.agreement_id,now);
 assert.equal(a.state,'PENDING_APPROVAL');assert.equal(db.agreement_versions.length,0);
 assert.throws(()=>decideAgreement(db,save,a.agreement_id,'APPROVED','',now),/Invalid text/);
 assert.equal(a.state,'PENDING_APPROVAL');
 decideAgreement(db,save,a.agreement_id,'APPROVED','Fictional reviewer verified named obligation',now);
 assert.equal(a.state,'ACTIVE');assert.equal(db.agreement_versions.length,1);
 assert.equal(db.reviews[0].agreement_version_id,a.version_id);
});
test('Rejection returns to DRAFT and preserves review rationale',()=>{
 const {db,save}=setup();const a=db.agreements[0];
 submitAgreement(db,save,a.agreement_id,now);
 decideAgreement(db,save,a.agreement_id,'REJECTED','Incomplete explanation',now);
 assert.equal(a.state,'DRAFT');assert.equal(db.agreement_versions.length,0);
 assert.equal(db.reviews[0].decision,'REJECTED');
});
test('T16/T21: amendment creates new version and preserves old approval snapshot',()=>{
 const {db,save}=setup();const a=db.agreements[0];
 submitAgreement(db,save,a.agreement_id,now);
 decideAgreement(db,save,a.agreement_id,'APPROVED','Approved original',now);
 const old=structuredClone(db.agreement_versions[0]);
 const amended=proposeAmendment(db,save,a.agreement_id,{...fields(a),original_assessment_name:'New named task'},now);
 assert.equal(amended.state,'DRAFT');assert.notEqual(amended.version_id,old.version_id);
 assert.deepEqual(db.agreement_versions[0],old);
 submitAgreement(db,save,a.agreement_id,now);
 assert.equal(db.agreement_versions.length,1);
 decideAgreement(db,save,a.agreement_id,'APPROVED','Reviewed amendment',now);
 assert.equal(db.agreement_versions.length,2);
 assert.deepEqual(db.agreement_versions[0],old);
 assert.equal(approvedVersions(db,a.agreement_id).length,2);
});
test('T09 foundation: approved agreement expires without creating an event',()=>{
 const {db,save}=setup();const a=db.agreements[0];submitAgreement(db,save,a.agreement_id,now);
 decideAgreement(db,save,a.agreement_id,'APPROVED','Approved',now);
 assert.equal(expireAgreements(db,save,'2027-01-01T00:00:00.000Z'),1);
 assert.equal(a.state,'EXPIRED');assert.equal(db.waiver_events.length,0);
 assert.equal(db.agreement_versions[0].state,'ACTIVE');
});
test('ACTIVE can close and cannot be re-approved without new version',()=>{
 const {db,save}=setup();const a=db.agreements[0];submitAgreement(db,save,a.agreement_id,now);decideAgreement(db,save,a.agreement_id,'APPROVED','Approved',now);
 closeAgreement(db,save,a.agreement_id,now);
 assert.equal(a.state,'CLOSED');assert.throws(()=>submitAgreement(db,save,a.agreement_id,now),/Only a DRAFT/);
});
