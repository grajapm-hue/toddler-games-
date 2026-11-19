const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
assert(fs.existsSync(path.join(__dirname,'docs/beta/robot-viewport.js')),'Robot canvas needs independent zoom/pan controls');
const camera=require('./docs/beta/robot-viewport.js'),{core,catalogue}=require('./docs/beta/robot-machines.js');let checks=0;
const check=(name,pass)=>{assert(pass,name);checks++;};
for(const poseId of ['standing','waving'])for(const age of [4,5]){
 const state=core.create(poseId,age),head=catalogue.poses[poseId].parts.find(p=>p.id==='head');core.drop(state,'head',head.x+head.width/2,head.y+head.height/2);
 core.drop(state,'head',head.x+head.width/2+45,head.y+head.height/2,{snap:false});check('Intentional short move leaves its dropped position',!state.placed.head.fitted&&state.placed.head.x===head.x+45);
 core.drop(state,'head',head.x+head.width/2,head.y+head.height/2);check('Next deliberate placement can refit',state.placed.head.fitted);
 core.drop(state,'head',-500,800,{free:true,snap:false});check('Free dragging is not bounced back by old canvas bounds',state.placed.head.x===-500-head.width/2);
 const before=JSON.stringify(state),v=camera.create({x:-300,y:0,width:1448,height:1264},360,300),r=camera.rect(v),anchor={x:77,y:96},point={x:r.x+anchor.x*r.width/v.width,y:r.y+anchor.y*r.height/v.height};
 camera.zoomAt(v,2,anchor);const z=camera.rect(v);check('Zoom anchors the pointed world position',Math.abs(z.x+anchor.x*z.width/v.width-point.x)<.001&&Math.abs(z.y+anchor.y*z.height/v.height-point.y)<.001);
 for(const [dx,dy]of[[100,0],[-200,0],[0,150],[0,-300]]){const b=camera.rect(v);camera.pan(v,dx,dy);const a=camera.rect(v);check('Panning moves the view in each direction',dx?a.x!==b.x:a.y!==b.y);}
 camera.resize(v,900,600);check('View changes do not move robot parts',JSON.stringify(state)===before);camera.fit(v,{x:0,y:0,width:848,height:1264});check('Fit resets view zoom',v.zoom===1);
 camera.zoomAt(v,100);check('Zoom maximum is bounded',v.zoom===8);camera.zoomAt(v,.001);check('Zoom minimum is bounded',v.zoom===.5);
}
console.log(`Robot precision/view model: ${checks} checks passed.`);
