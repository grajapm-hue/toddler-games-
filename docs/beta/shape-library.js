/* Shared silhouettes and age collections for Drag Shapes, Bubbles and Blocks. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SaNaShapes=api;})(typeof window==='object'?window:globalThis,()=>{
  'use strict';
  const shapes=[
    {id:'circle',color:'#fa6b6b'},
    {id:'square',color:'#72bdf1'},
    {id:'triangle',color:'#ffca52'},
    {id:'rectangle',color:'#a5d67b'},
    {id:'heart',color:'#f28fbc'},
    {id:'oval',color:'#bd86f3'},
    {id:'diamond',color:'#f4a35d'},
    {id:'star',color:'#ffd05d'},
    {id:'pentagon',color:'#f9ad61'},
    {id:'hexagon',color:'#b89bea'},
    {id:'octagon',color:'#69cbd1'},
    {id:'trapezoid',color:'#f07d85'},
    {id:'parallelogram',color:'#a0ce77'},
    {id:'crescent',color:'#71b7f4'},
    {id:'cross',color:'#ffd04d'},
    {id:'semicircle',color:'#d18cf3'},
    {id:'cone',color:'#f48cad'},
    {id:'cylinder',color:'#ac7be7'},
    {id:'cube',color:'#72b9f0'},
    {id:'arrow',color:'#8dd083'}
  ];
  const ageLimits={2:4,3:12,4:16,5:20};
  function primitive(id,fill,stroke='#34534a'){
    const common=`fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"`;
    const polygon=(n,r=58,rotation=-90)=>`<polygon points="${Array.from({length:n},(_,i)=>{const a=(rotation+i*360/n)*Math.PI/180;return `${Math.cos(a)*r},${Math.sin(a)*r}`;}).join(' ')}" ${common}/>`;
    const path=d=>`<path d="${d}" ${common}/>`;
    switch(id){
      case 'circle':return `<circle r="55" ${common}/>`;
      case 'oval':return `<ellipse rx="60" ry="43" ${common}/>`;
      case 'square':return `<rect x="-53" y="-53" width="106" height="106" rx="13" ${common}/>`;
      case 'rectangle':return `<rect x="-61" y="-43" width="122" height="86" rx="9" ${common}/>`;
      case 'triangle':return polygon(3);
      case 'diamond':return polygon(4);
      case 'pentagon':return polygon(5);
      case 'hexagon':return polygon(6);
      case 'octagon':return polygon(8);
      case 'trapezoid':return path('M-35-48H35L63 49H-63Z');
      case 'parallelogram':return path('M-32-48H61L32 48H-61Z');
      case 'heart':return path('M0 54C-15 37-62 9-58-25C-55-62-13-65 0-34C18-66 58-60 59-26C62 11 17 39 0 54Z');
      case 'crescent':return path('M27-59A61 61 0 1 0 27 59A48 48 0 0 1 27-59Z');
      case 'cross':return path('M-19-59H19V-19H59V19H19V59H-19V19H-59V-19H-19Z');
      case 'semicircle':return path('M-59 45A59 59 0 0 1 59 45Z');
      case 'cone':return path('M0-60L56 49Q0 70-56 49Z');
      case 'cylinder':return `<rect x="-48" y="-45" width="96" height="93" ${common}/><ellipse cy="-45" rx="48" ry="16" ${common}/><path d="M-48 48A48 16 0 0 0 48 48" fill="none" stroke="${stroke}" stroke-width="4"/>`;
      case 'cube':return `<path d="M0-60L54-33V33L0 61L-54 33V-33Z" ${common}/><path d="M-54-33L0-4L54-33M0-4V61" fill="none" stroke="${stroke}" stroke-width="4"/>`;
      case 'arrow':return path('M-60-22H8V-55L62 0L8 55V22H-60Z');
      case 'star':return `<polygon points="${Array.from({length:10},(_,i)=>{const a=(i*36-90)*Math.PI/180,r=i%2?27:59;return `${Math.cos(a)*r},${Math.sin(a)*r}`;}).join(' ')}" ${common}/>`;
      default:return polygon(6);
    }
  }
  return {shapes,ageLimits,primitive};
});
