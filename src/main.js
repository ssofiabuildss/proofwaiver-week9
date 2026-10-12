import './styles.css';
import {readDatabase,transaction} from './data/storage.js';
import {expireAgreements} from './logic/agreements.js';
import {EmployerAgreement,bindEmployerAgreement} from './views/EmployerAgreement.js';
import {AgreementReview,bindAgreementReview} from './views/AgreementReview.js';
import {WaiverVerification} from './views/WaiverVerification.js';
import {AccountabilityDashboard} from './views/AccountabilityDashboard.js';
const routes={agreement:['Employer Agreement',EmployerAgreement,bindEmployerAgreement],review:['Agreement Review',AgreementReview,bindAgreementReview],waiver:['Waiver Verification',WaiverVerification],dashboard:['Accountability Dashboard',AccountabilityDashboard]};
const app=document.querySelector('#app');
function render(){
  const key=location.hash.slice(1).split('?')[0]||'agreement';
  const active=Object.hasOwn(routes,key)?key:'agreement';
  const nav=Object.entries(routes).map(([slug,[title]])=>`<a href="#${slug}" ${slug===active?'aria-current="page"':''}>${title}</a>`).join('');
  let status='',content='',ready=false;
  try{
    transaction((db,save)=>expireAgreements(db,save));
    const db=readDatabase();
    status=`Local fictional agreements: ${db.agreements.length}. Browser storage is not a tamper-proof audit trail.`;
    content=routes[active][1]();ready=true;
  }catch(err){
    status=`Storage unavailable or invalid: ${err.message}. No records were modified.`;
    content='<h2>Local storage error</h2><p>Application controls are disabled until the stored data is corrected.</p>';
  }
  app.innerHTML=`<header><strong>ProofWaiver</strong><div class="banner" role="status">FICTIONAL DEMO — NO REAL HIRING</div></header><div class="layout"><nav aria-label="Product screens">${nav}</nav><main><small>Increment 2 · Employer agreement workflow</small>${content}<p class="status" id="storage-status"></p></main></div><footer>All records fictional · Browser-local storage is not tamper-proof or externally audited.</footer>`;
  document.querySelector('#storage-status').textContent=status;
  if(ready && routes[active][2])routes[active][2](render);
}
addEventListener('hashchange',render);render();
