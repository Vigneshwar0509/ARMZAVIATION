import{c as r}from"./index-BovtSPGR.js";import{c,p as b,b as t}from"./vendor-state-CSx1OcAf.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]],i=r("bookmark",J),m=c()(b((s,e)=>({savedJobIds:[],saveJob:o=>{const{savedJobIds:a}=e();a.includes(o)||s({savedJobIds:[...a,o]})},removeJob:o=>{const{savedJobIds:a}=e();s({savedJobIds:a.filter(d=>d!==o)})},setSavedJobs:o=>s({savedJobIds:o}),clearSavedJobs:()=>s({savedJobIds:[]}),isJobSaved:o=>e().savedJobIds.includes(o)}),{name:"job-storage",storage:t(()=>localStorage)}));export{i as B,m as u};
