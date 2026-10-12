import test from 'node:test';
import assert from 'node:assert/strict';
import {POST,GET} from '../api/compare.js';
import {validateComparisonInput,validateAdvisory,FALLBACK,comparisonFromRecords} from '../src/services/compareContract.js';
import {requestAdvisory,recordAdvisory} from '../src/services/llmClient.js';
import {fictionalFixtures} from '../src/data/demoFixtures.js';
import {validateDatabase} from '../src/logic/validation.js';
const input={
 original_assessment_name:'Fictional spreadsheet test',original_assessment_method:'Timed exercise',
 baseline_capability:'Spreadsheet analysis',employer_outcome_description:'Step removed in demo',
 replacement_assessment_name:null,replacement_method:null,replacement_capability:null
};
const post=body=>new Request('http://localhost/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('allowlist accepts only seven comparison fields and rejects candidate IDs, proof flags, scores',()=>{
 assert.deepEqual(validateComparisonInput(input),input);
 for(const field of ['fictional_candidate_ref','positive_proof_presented','candidate_score','failed_attempts','resume','interview_fulfillment']){
  assert.throws(()=>validateComparisonInput({...input,[field]:'private'}),/allowlist/);
 }
 assert.throws(()=>validateComparisonInput({...input,original_assessment_name:123}),/Invalid/);
 assert.throws(()=>validateComparisonInput({...input,baseline_capability:'contact person@example.com'}),/Contact/);
});
test('unknown, malformed or overlong advisory converts to INSUFFICIENT',()=>{
 for(const value of [{flag:'APPROVED',rationale:'OK'},{flag:'CLEAR',rationale:''},{flag:'CLEAR',rationale:'x'.repeat(401)},{flag:'CLEAR',rationale:'OK',outcome:'VERIFIED_REMOVED'},null]){
  assert.deepEqual(validateAdvisory(value),FALLBACK);
 }
 assert.deepEqual(validateAdvisory({flag:'REVIEW',rationale:'Possible equivalent task'}),{flag:'REVIEW',rationale:'Possible equivalent task'});
});
test('server rejects extra fields before calling model',async()=>{
 const response=await POST(post({...input,fictional_candidate_ref:'CAND_DEMO_007'}));
 assert.equal(response.status,400);
});
test('GET is not permitted',async()=>{assert.equal((await GET()).status,405);});
test('missing server key/model returns INSUFFICIENT with HTTP 200',async()=>{
 const oldKey=process.env.OPENAI_API_KEY,oldModel=process.env.OPENAI_MODEL;
 delete process.env.OPENAI_API_KEY;delete process.env.OPENAI_MODEL;
 try{const response=await POST(post(input));assert.equal(response.status,200);assert.deepEqual(await response.json(),FALLBACK);}
 finally{if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
 if(oldModel===undefined)delete process.env.OPENAI_MODEL;else process.env.OPENAI_MODEL=oldModel;}
});
test('client sends only seven fields and CLEAR stays advisory',async()=>{
 let sent;
 const event={...fictionalFixtures.waiver_events[0],...input};
 const version={...input};
 const result=await requestAdvisory(version,event,{fetcher:async(_url,opts)=>{
  sent=JSON.parse(opts.body);return {ok:true,json:async()=>({flag:'CLEAR',rationale:'No reported substitute'})};
 }});
 assert.deepEqual(Object.keys(sent).sort(),Object.keys(input).sort());
 assert.equal(result.flag,'CLEAR');
 assert.equal(Object.hasOwn(sent,'fictional_candidate_ref'),false);
});
test('client provider error and malformed response become INSUFFICIENT',async()=>{
 const args=[{...input},{...input}];
 const unavailable=await requestAdvisory(...args,{fetcher:async()=>{throw new Error('offline');}});
 const bad=await requestAdvisory(...args,{fetcher:async()=>({ok:true,json:async()=>({flag:'SUCCESS',rationale:'bad'})})});
 assert.equal(unavailable.flag,'INSUFFICIENT');assert.equal(bad.flag,'INSUFFICIENT');
});
test('recordAdvisory changes advisory fields only, never final outcome or eligibility',()=>{
 const db=structuredClone(fictionalFixtures);
 const version={...db.agreements[0],state:'ACTIVE',reviewer_decision:'APPROVED',approved_at:'2026-10-02T00:00:00.000Z',active_at:'2026-10-02T00:00:00.000Z'};
 db.agreement_versions=[version];
 const event={event_id:'EVT_TEST_01',agreement_version_id:version.version_id,fictional_candidate_ref:'CAND_DEMO_TEST',positive_proof_presented:true,
  trigger_time:'2026-10-03T00:00:00.000Z',eligibility_status:'ELIGIBLE',original_assessment_administered:'NO',employer_outcome_description:'Assessment omitted in fictional flow',
  replacement_assessment_name:null,replacement_method:null,replacement_capability:null,workflow_state:'RECORDED',llm_flag:null,llm_rationale:null,
  human_outcome:null,human_rationale:null,reviewed_at:null,interview_fulfillment:'UNVERIFIED'};
 db.waiver_events=[event];
 let saved=0;
 recordAdvisory(db,()=>saved++,event.event_id,{flag:'CLEAR',rationale:'No apparent substitute'});
 assert.equal(saved,1);validateDatabase(db);
 assert.equal(event.workflow_state,'AI_FLAGGED');assert.equal(event.llm_flag,'CLEAR');
 assert.equal(event.human_outcome,null);assert.equal(event.eligibility_status,'ELIGIBLE');
 assert.equal(db.agreement_versions[0].state,'ACTIVE');
 event.eligibility_status='INELIGIBLE';assert.throws(()=>recordAdvisory(db,()=>{},event.event_id,FALLBACK),/Only eligible/);
});

test('provider receives only seven comparison values, no identifiers or interview records',async()=>{
 const originalFetch=globalThis.fetch, oldKey=process.env.OPENAI_API_KEY,oldModel=process.env.OPENAI_MODEL;
 let sent;
 process.env.OPENAI_API_KEY='FICTIONAL_TEST_KEY';process.env.OPENAI_MODEL='gpt-4o-mini';
 globalThis.fetch=async(_url,opts)=>{
   assert.equal(_url,'https://api.openai.com/v1/chat/completions');
   sent=JSON.parse(opts.body);
   return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({flag:'REVIEW',rationale:'Potential equivalence'})}}]})};
 };
 try{
   const response=await POST(post(input));
   assert.equal(response.status,200);
   assert.equal((await response.json()).flag,'REVIEW');
   assert.deepEqual(Object.keys(JSON.parse(sent.messages[1].content)).sort(),Object.keys(input).sort());
   assert.equal(sent.messages[1].content.includes('CAND_DEMO_'),false);
 }finally{
   globalThis.fetch=originalFetch;
   if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
   if(oldModel===undefined)delete process.env.OPENAI_MODEL;else process.env.OPENAI_MODEL=oldModel;
 }
});
test('provider invalid JSON and refusals degrade to INSUFFICIENT',async()=>{
 const originalFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY,oldModel=process.env.OPENAI_MODEL;
 process.env.OPENAI_API_KEY='FICTIONAL_TEST_KEY';process.env.OPENAI_MODEL='gpt-4o-mini';
 try{
  for(const message of [{content:'not-json'},{refusal:'Cannot answer',content:null}]){
   globalThis.fetch=async()=>({ok:true,json:async()=>({choices:[{message}]})});
   const response=await POST(post(input));assert.deepEqual(await response.json(),FALLBACK);
  }
 }finally{
  globalThis.fetch=originalFetch;
  if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
  if(oldModel===undefined)delete process.env.OPENAI_MODEL;else process.env.OPENAI_MODEL=oldModel;
 }
});
