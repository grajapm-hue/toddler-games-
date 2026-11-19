const assert=require('node:assert/strict');
const {core,catalogue}=require('./docs/beta/robot-machines.js');
let checks=0;const check=(name,pass)=>{assert(pass,name);checks++;console.log('PASS '+name);};
for(const poseId of ['standing','waving'])for(const age of [4,5]){
  const state=core.create(poseId,age),hip=catalogue.poses[poseId].parts.find(p=>p.id==='hip');
  const x=hip.x+hip.width/2,y=hip.y+hip.height/2;
  core.drop(state,hip.id,x,y);check(`${poseId}/${age}: hips fit initially`,state.placed.hip.fitted&&core.fittedCount(state)===1);
  core.drop(state,hip.id,x+230,y+230);
  check(`${poseId}/${age}: fitted hips can move away`,!state.placed.hip.fitted&&state.placed.hip.x!==hip.x&&state.placed.hip.y!==hip.y);
  check(`${poseId}/${age}: moved piece is no longer counted as fitted`,core.fittedCount(state)===0&&Object.keys(state.placed).length===1);
  core.drop(state,hip.id,x,y);check(`${poseId}/${age}: moved hips can snap back`,state.placed.hip.fitted&&core.fittedCount(state)===1);
  for(const part of catalogue.poses[poseId].parts)core.drop(state,part.id,part.x+part.width/2,part.y+part.height/2);
  check(`${poseId}/${age}: all fitted pieces allow completion`,core.isComplete(state));
  core.drop(state,hip.id,x+230,y+230);check(`${poseId}/${age}: moving one piece clears completion`,!core.isComplete(state)&&core.fittedCount(state)===15);
  core.drop(state,hip.id,x,y);check(`${poseId}/${age}: refitting restores completion`,core.isComplete(state)&&core.fittedCount(state)===16);
}
console.log(`Robot movement model: ${checks} checks passed.`);
