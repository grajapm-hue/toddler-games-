const assert=require('node:assert/strict'),fs=require('node:fs');
const file='./docs/beta/glossy-blocks.js';
assert(fs.existsSync(file),'Glossy Blocks game module must be available');
const {core}=require(file);let checks=0;
function check(value,words){assert(value,words);checks++;}
for(const category of core.categories){let previous=0;for(const age of [2,3,4,5]){
  const items=core.items(category.id,age);check(items.length>previous,category.id+' grows at age '+age);previous=items.length;
  check(new Set(items.map(i=>i.id)).size===items.length,'unique item identities');
  check(items.every(i=>i.name&&/^#[0-9a-f]{6}$/i.test(i.color)),'named coloured items');
}}
check(core.categories.length===9,'nine categories');
check(core.items('numbers',5).map(i=>i.name).join(',')===Array.from({length:20},(_,i)=>i+1).join(','),'all numbers 1–20');
check(core.items('letters',5).map(i=>i.name).join('')==='ABCDEFGHIJKLMNOPQRSTUVWXYZ','complete alphabet');
for(const age of [2,3,4,5])check(core.patterns(age,1).length>=4,'age pattern collection');
const board=core.create(),red=core.items('plain',2)[0];
check(core.place(board,red,20,20),'first block');
const saved=JSON.stringify(board);check(!core.place(board,red,30,30)&&JSON.stringify(board)===saved,'overlap rejected without mutation');
check(!core.place(board,red,NaN,20)&&JSON.stringify(board)===saved,'invalid coordinates rejected');
check(!core.place(board,{...red,color:'"><svg onload="bad()"/>'},500,20)&&JSON.stringify(board)===saved,'invalid colour cannot enter a construction');
check(core.place(board,red,-500,900),'outside drop clamps safely');
check(board.blocks.every(b=>b.x>=0&&b.y>=0&&b.x<=820&&b.y<=420),'all blocks within board');
check(core.place(board,red,400,20,0),'move block');
check(board.blocks.length===2,'moving does not duplicate');
check(!core.remove(board,50),'invalid removal ignored');check(core.remove(board,0)&&board.blocks.length===1,'selected block removed');
check(core.ink('#ffffff')==='#173e35'&&core.ink('#000000')==='#ffffff','readable contrasting labels');
function luminance(hex){const c=[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
for(const color of [...core.items('colors',5).map(i=>i.color),'#777777','#888888','#405f76','#ffffff','#000000']){const a=luminance(color),b=luminance(core.ink(color));check((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'labels contrast at least 4.5:1 on '+color);}
console.log(checks+' Glossy Blocks core checks passed');
