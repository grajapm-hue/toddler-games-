/* Camera transforms never change a robot part's world coordinates. */
((root,factory)=>{if(typeof module==='object'&&module.exports)module.exports=factory();else root.SaNaRobotViewport=factory();})(typeof window==='object'?window:globalThis,()=>{
 'use strict';
 const scale=v=>Math.min(v.width/v.basis.width,v.height/v.basis.height)*v.zoom;
 const rect=v=>{const s=scale(v),width=v.width/s,height=v.height/s;return{x:v.centerX-width/2,y:v.centerY-height/2,width,height};};
 function fit(v,bounds){v.basis={...bounds};v.centerX=bounds.x+bounds.width/2;v.centerY=bounds.y+bounds.height/2;v.zoom=1;v.manual=false;return v;}
 function create(bounds,width,height){return fit({width,height},bounds);}
 function resize(v,width,height){if(width>0&&height>0){v.width=width;v.height=height;}return v;}
 function zoomAt(v,factor,anchor={x:v.width/2,y:v.height/2}){
  const before=rect(v),x=before.x+anchor.x/v.width*before.width,y=before.y+anchor.y/v.height*before.height;
  v.zoom=Math.max(.5,Math.min(8,v.zoom*factor));const after=rect(v);
  v.centerX=x+(.5-anchor.x/v.width)*after.width;v.centerY=y+(.5-anchor.y/v.height)*after.height;v.manual=true;return v;
 }
 function pan(v,dx,dy){const s=scale(v);v.centerX-=dx/s;v.centerY-=dy/s;v.manual=true;return v;}
 return {create,fit,resize,zoomAt,pan,rect,scale};
});
