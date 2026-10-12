import {fictionalFixtures} from './demoFixtures.js';
import {validateDatabase,validateRecord} from '../logic/validation.js';
import {collectionIds} from './schema.js';
const KEY='proofwaiver-fictional-v1';
const clone=(value)=>structuredClone(value);
export function initializeStorage() {
  const raw=localStorage.getItem(KEY);
  if(raw!==null) {const db=JSON.parse(raw);validateDatabase(db);return clone(db);}
  validateDatabase(fictionalFixtures);
  localStorage.setItem(KEY,JSON.stringify(fictionalFixtures));
  return clone(fictionalFixtures);
}
export function readDatabase(){return initializeStorage();}
export function createRecord(collection,record){
  validateRecord(collection,record);
  const db=readDatabase(), key=collectionIds[collection];
  if(db[collection].some(item=>item[key]===record[key])) throw new Error('Duplicate record ID');
  db[collection].push(clone(record));validateDatabase(db);
  localStorage.setItem(KEY,JSON.stringify(db));return clone(record);
}

