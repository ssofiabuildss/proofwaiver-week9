export const AgreementState = Object.freeze(['DRAFT','PENDING_APPROVAL','ACTIVE','CLOSED','EXPIRED']);
export const EventState = Object.freeze(['RECORDED','ELIGIBILITY_CHECK','AI_FLAGGED','HUMAN_REVIEW','FINALIZED']);
export const Eligibility = Object.freeze(['ELIGIBLE','INELIGIBLE']);
export const EconomicOutcome = Object.freeze(['VERIFIED_REMOVED','REPLACED','NOT_REMOVED','UNVERIFIED']);
export const LlmFlag = Object.freeze(['CLEAR','REVIEW','INSUFFICIENT']);
export const YesNoUnknown = Object.freeze(['YES','NO','UNKNOWN']);
export const InterviewFulfillment = Object.freeze(['FULFILLED','NOT_FULFILLED','UNVERIFIED']);
export const ReviewerDecision = Object.freeze(['APPROVED','REJECTED']);
export const ReviewKind = Object.freeze(['AGREEMENT','WAIVER']);

const str = {type:'string',min:1,max:240};
const note = {type:'string',min:1,max:1200};
const id = {type:'id'};
const date = {type:'date'};
const nullable = (spec) => ({...spec,nullable:true});
const en = (values) => ({type:'enum',values});

export const schemas = Object.freeze({
  agreements: {
    agreement_id:id,version_id:id,fictional_employer:str,vacancy_ref:str,role_title:str,
    baseline_capability:note,original_assessment_name:str,original_assessment_method:str,
    accepted_positive_proof_criterion:note,interview_commitment:note,state:en(AgreementState),
    created_at:date,approved_at:nullable(date),active_at:nullable(date),expires_at:date,
    closed_at:nullable(date),reviewer_decision:nullable(en(ReviewerDecision)),reviewer_rationale:nullable(note)
  },
  agreement_versions: {
    agreement_id:id,version_id:id,fictional_employer:str,vacancy_ref:str,role_title:str,
    baseline_capability:note,original_assessment_name:str,original_assessment_method:str,
    accepted_positive_proof_criterion:note,interview_commitment:note,state:en(AgreementState),
    created_at:date,approved_at:nullable(date),active_at:nullable(date),expires_at:date,
    closed_at:nullable(date),reviewer_decision:nullable(en(ReviewerDecision)),reviewer_rationale:nullable(note)
  },
  waiver_events: {
    event_id:id,agreement_version_id:id,fictional_candidate_ref:id,positive_proof_presented:{type:'boolean'},
    trigger_time:date,eligibility_status:nullable(en(Eligibility)),
    original_assessment_administered:en(YesNoUnknown),employer_outcome_description:note,
    replacement_assessment_name:nullable(str),replacement_method:nullable(str),replacement_capability:nullable(note),
    workflow_state:en(EventState),llm_flag:nullable(en(LlmFlag)),llm_rationale:nullable(note),
    human_outcome:nullable(en(EconomicOutcome)),human_rationale:nullable(note),reviewed_at:nullable(date),
    interview_fulfillment:en(InterviewFulfillment)
  },
  reviews: {
    review_id:id,kind:en(ReviewKind),record_id:id,agreement_version_id:id,
    decision:en([...ReviewerDecision,...EconomicOutcome]),rationale:note,reviewed_at:date
  }
});
export const collectionIds = Object.freeze({agreements:'agreement_id',agreement_versions:'version_id',waiver_events:'event_id',reviews:'review_id'});

