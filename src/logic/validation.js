import {schemas,collectionIds} from '../data/schema.js';

export function validateRecord(collection,record) {
  const schema=schemas[collection];
  if (!schema) throw new Error('Unknown collection');
  if (!record || typeof record!=='object' || Array.isArray(record)) throw new Error('Record must be an object');
  const actual=Object.keys(record), expected=Object.keys(schema);
  for (const key of actual) if (!Object.hasOwn(schema,key)) throw new Error(`Unsupported field: ${key}`);
  for (const key of expected) {
    if (!Object.hasOwn(record,key)) throw new Error(`Missing field: ${key}`);
    const value=record[key], rule=schema[key];
    if (value===null && rule.nullable) continue;
    if (rule.type==='boolean') {if(typeof value!=='boolean') throw new Error(`Invalid boolean: ${key}`);continue;}
    if (typeof value!=='string') throw new Error(`Invalid string: ${key}`);
    if (rule.type==='enum') {if(!rule.values.includes(value)) throw new Error(`Invalid enum: ${key}`);continue;}
    if (rule.type==='id') {if(!/^[A-Za-z0-9][A-Za-z0-9_-]{1,79}$/.test(value)) throw new Error(`Invalid ID: ${key}`);continue;}
    if (rule.type==='date') {if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString()!==value) throw new Error(`Invalid timestamp: ${key}`);continue;}
    if(value.trim()!==value||value.length<rule.min||value.length>rule.max||/[<>]/.test(value)) throw new Error(`Invalid text: ${key}`);
  }
  return true;
}
export function validateDatabase(db) {
  if(!db||typeof db!=='object'||Array.isArray(db)||Object.keys(db).sort().join('|')!==Object.keys(schemas).sort().join('|')) throw new Error('Invalid database collections');
  for(const collection of Object.keys(schemas)) {
    if(!Array.isArray(db[collection])) throw new Error(`Invalid collection: ${collection}`);
    const seen=new Set();
    for(const record of db[collection]) {
      validateRecord(collection,record);
      const key=record[collectionIds[collection]];
      if(seen.has(key)) throw new Error(`Duplicate ID: ${key}`);
      seen.add(key);
    }
  }
  return true;
}

