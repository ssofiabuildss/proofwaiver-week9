// Exact LLM comparison boundary. Shared by the browser and server relay.
export const COMPARISON_FIELDS = Object.freeze([
  'original_assessment_name',
  'original_assessment_method',
  'baseline_capability',
  'employer_outcome_description',
  'replacement_assessment_name',
  'replacement_method',
  'replacement_capability'
]);
const OPTIONAL = new Set(['replacement_assessment_name', 'replacement_method', 'replacement_capability']);
const MAX = Object.freeze({
  original_assessment_name: 240, original_assessment_method: 240,
  baseline_capability: 1200, employer_outcome_description: 1200,
  replacement_assessment_name: 240, replacement_method: 240,
  replacement_capability: 1200
});
export const FALLBACK = Object.freeze({flag:'INSUFFICIENT',rationale:'AI comparison unavailable or invalid; simulated human review is still required.'});
const plain = o => o !== null && typeof o === 'object' && !Array.isArray(o) && Object.getPrototypeOf(o) === Object.prototype;
export function validateComparisonInput(input) {
  if (!plain(input) || Object.keys(input).length !== COMPARISON_FIELDS.length ||
      Object.keys(input).some(k => !COMPARISON_FIELDS.includes(k))) throw new Error('Comparison fields must match the strict allowlist');
  const out = {};
  for (const key of COMPARISON_FIELDS) {
    const value = input[key];
    if (OPTIONAL.has(key) && value === null) { out[key] = null; continue; }
    if (typeof value !== 'string' || value !== value.trim() || !value.trim() ||
        value.length > MAX[key] || /[<>\u0000-\u001f]/.test(value)) throw new Error(`Invalid comparison field: ${key}`);
    // Obvious contact strings are blocked, but free-text screening is not proof of anonymity.
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)) throw new Error('Contact information is not permitted in comparison fields');
    out[key] = value;
  }
  return out;
}
export function validateAdvisory(output) {
  if (!plain(output) || Object.keys(output).length !== 2 ||
      !Object.hasOwn(output,'flag') || !Object.hasOwn(output,'rationale') ||
      !['CLEAR','REVIEW','INSUFFICIENT'].includes(output.flag) ||
      typeof output.rationale !== 'string' || output.rationale !== output.rationale.trim() ||
      output.rationale.length < 1 || output.rationale.length > 400 ||
      /[<>\u0000-\u001f]/.test(output.rationale)) return {...FALLBACK};
  return {flag:output.flag,rationale:output.rationale};
}
export function comparisonFromRecords(version,event) {
  return validateComparisonInput({
    original_assessment_name:version.original_assessment_name,
    original_assessment_method:version.original_assessment_method,
    baseline_capability:version.baseline_capability,
    employer_outcome_description:event.employer_outcome_description,
    replacement_assessment_name:event.replacement_assessment_name,
    replacement_method:event.replacement_method,
    replacement_capability:event.replacement_capability
  });
}
