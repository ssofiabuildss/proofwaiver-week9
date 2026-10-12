import './styles.css';
import {readDatabase} from './data/storage.js';
import {EmployerAgreement} from './views/EmployerAgreement.js';
import {AgreementReview} from './views/AgreementReview.js';
import {WaiverVerification} from './views/WaiverVerification.js';
import {AccountabilityDashboard} from './views/AccountabilityDashboard.js';
const routes={agreement:['Employer Agreement',EmployerAgreement],review:['Agreement Review',AgreementReview],waiver:['Waiver Verification',WaiverVerification],dashboard:['Accountability Dashboard',AccountabilityDashboard]};
const app=document.querySelector('#app');
function render(){
  const key=location.hash.slice(1)||'agreement';
  const active=Object.hasOwn(routes,key)?key:'agreement';
  const nav=Object.entries(routes).map(([slug,[title]])=>`<a href="#${slug}" ${slug===active?'aria-current="page"':''}>${title}</a>`).join('');
  let status='';
  try {const db=readDatabase();status=`Local fictional records: ${db.agreements.length} draft agreement(s).`;}
  catch(err){status=`Storage unavailable or invalid: ${err.message}. No records were modified.`;}
  app.innerHTML=`<header><strong>ProofWaiver</strong><div class="banner" role="status">FICTIONAL DEMO — NO REAL HIRING</div></header><div class="layout"><nav aria-label="Product screens">${nav}</nav><main><small>Increment 1 · Foundation only</small>${routes[active][1]()}<p class="status" id="storage-status"></p></main></div><footer>All records fictional · Browser-local storage is not tamper-proof or externally audited.</footer>`;
  document.querySelector('#storage-status').textContent=status;
}
addEventListener('hashchange',render);render();

