const assert=require('node:assert/strict');
const {core,catalogue}=require('./docs/beta/robot-machines.js');
assert.equal(typeof core.resizeCanvas,'function','Robot placement must use the full visible canvas');
let checks=0;const check=(name,pass)=>{assert(pass,name);checks++;};
for(const poseId of ['standing','waving'])for(const age of [4,5]){
 const state=core.create(poseId,age),pose=catalogue.poses[poseId];core.resizeCanvas(state,1200,400);
 check('Wide canvas includes both side areas',state.bounds.x<0&&state.bounds.width>pose.width);
 for(const part of pose.parts){
  for(const [horizontal,vertical] of [[0,0],[1,0],[1,1],[0,1]]){
   const b=state.bounds,x=b.x+horizontal*(b.width-part.width)+part.width/2,y=b.y+vertical*(b.height-part.height)+part.height/2;
   core.drop(state,part.id,x,y);const at=state.placed[part.id];
   check(`${poseId}/${age}/${part.id}: full-canvas corner is reachable`,Math.abs(at.x-(x-part.width/2))<.001&&Math.abs(at.y-(y-part.height/2))<.001);
  }
  core.drop(state,part.id,part.x+part.width/2,part.y+part.height/2);
  check(`${poseId}/${age}/${part.id}: reference fitting remains exact`,state.placed[part.id].fitted&&state.placed[part.id].x===part.x&&state.placed[part.id].y===part.y);
 }
 check('Completed assembly still fits',core.isComplete(state));core.resizeCanvas(state,400,1100);
 check('Tall canvas includes top and bottom areas',state.bounds.y<0&&state.bounds.height>pose.height);
 check('Resizing retains all fitted coordinates',core.isComplete(state)&&pose.parts.every(p=>state.placed[p.id].x===p.x&&state.placed[p.id].y===p.y));
 for(const p of pose.parts)core.drop(state,p.id,state.bounds.x+p.width/2,state.bounds.y+p.height/2);
 for(const [w,h] of [[1400,400],[400,900],[900,800],[800,300]]){
  core.resizeCanvas(state,w,h);const b=state.bounds;
  check('All loose parts remain within the resized canvas',pose.parts.every(p=>{const at=state.placed[p.id];return at.x>=b.x-.001&&at.y>=b.y-.001&&at.x+p.width<=b.x+b.width+.001&&at.y+p.height<=b.y+b.height+.001;}));
 }
 const before=JSON.stringify(state);check('Invalid canvas dimensions are rejected',core.resizeCanvas(state,0,200)===false&&JSON.stringify(state)===before);
}
console.log(`Full robot canvas model: ${checks} checks passed.`);
