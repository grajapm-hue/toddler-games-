const assert=require('node:assert/strict'),{core}=require('./docs/beta/picture-puzzle.js');
let seed=42,checks=0;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),check=(pass,name)=>{assert(pass,name);checks++;};
for(const size of [2,3,4,5])for(let trial=0;trial<60;trial++){
 const board=core.create(size,random),all=Array.from({length:size*size},(_,i)=>i+1);
 check(board.tiles.length===size*size&&all.every(v=>board.tiles.includes(v))&&!board.tiles.includes(0),'every picture piece is available, with no missing fragment');
 check(board.placed.length===size*size&&board.placed.every(v=>!v)&&!core.solved(board),'right grid starts empty');
 check(board.tiles.some((v,i)=>v!==i+1),'source starts scrambled');
 for(const invalid of [0,-1,size*size+1,1.5,NaN]){const before=JSON.stringify(board);check(!core.place(board,invalid)&&JSON.stringify(board)===before,'invalid values never alter a picture');}
 for(const value of board.tiles){const before=board.placed.filter(Boolean).length;check(core.place(board,value),'any remaining source piece can be placed');check(board.placed[value-1]&&board.placed.filter(Boolean).length===before+1,'piece lands in its own position exactly once');check(!core.place(board,value),'a placed piece cannot be duplicated');}
 check(core.solved(board)&&board.placed.every(Boolean),'all pieces reconstruct the whole picture');
}
assert.throws(()=>core.create(1));assert.throws(()=>core.create(6));console.log(JSON.stringify({checks:checks+2,failed:0}));
