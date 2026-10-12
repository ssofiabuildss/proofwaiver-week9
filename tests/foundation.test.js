import test from 'node:test';
import assert from 'node:assert/strict';
import {fictionalFixtures} from '../src/data/demoFixtures.js';
import {validateDatabase,validateRecord} from '../src/logic/validation.js';

test('fictional fixture passes strict validation',()=>assert.equal(validateDatabase(fictionalFixtures),true));
test('unsupported fields and invalid enums are rejected',()=>{
  const original=fictionalFixtures.agreements[0];
  assert.throws(()=>validateRecord('agreements',{...original,candidate_score:98}),/Unsupported field/);
  assert.throws(()=>validateRecord('agreements',{...original,state:'AUTO_APPROVED'}),/Invalid enum/);
  assert.throws(()=>validateRecord('agreements',{...original,agreement_id:'bad id'}),/Invalid ID/);
  assert.throws(()=>validateRecord('agreements',{...original,expires_at:42}),/Invalid string/);
});
test('duplicate IDs rejected',()=>assert.throws(()=>validateDatabase({...fictionalFixtures,agreements:[...fictionalFixtures.agreements,...fictionalFixtures.agreements]}),/Duplicate ID/));

