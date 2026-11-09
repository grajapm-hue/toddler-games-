const assert=require('node:assert/strict');
const {core}=require('./docs/beta/picture-puzzle.js');
let checks=0;const check=(value,message)=>{assert(value,message);checks++;};
let seed=42;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
for(const size of [2,3,4,5])for(let trial=0;trial<80;trial++){
 const board=core.create(size,3+trial%24,random),original=board.tiles.slice(),trail=board.trail.slice();
 check(board.tiles.length===size*size&&new Set(board.tiles).size===size*size,'one of every tile including one gap');
 check(!core.solved(board)&&board.moves===0,'shuffle starts unsolved without counting shuffle moves');
 const blank=board.tiles.indexOf(0),illegal=board.tiles.findIndex((v,i)=>v&&!core.neighbours(blank,size).includes(i)),snapshot=JSON.stringify(board);
 if(illegal>=0){check(!core.slide(board,illegal),'non-neighbour cannot move');check(JSON.stringify(board)===snapshot,'invalid move preserves board');}
 for(const position of trail.reverse())check(core.slide(board,position),'reverse shuffle always provides a legal solution');
 check(core.solved(board)&&board.trail.length===0,'reversing the shuffle reconstructs the full picture');
 const playable={size,tiles:original,trail:board.trail.slice(),moves:0};
 for(let n=0;n<60;n++){const gap=playable.tiles.indexOf(0),from=core.neighbours(gap,size)[Math.floor(random()*core.neighbours(gap,size).length)],tile=playable.tiles[from],before=playable.tiles.slice();check(core.slide(playable,from),'adjacent tile moves');check(playable.tiles[gap]===tile&&playable.tiles[from]===0&&playable.tiles.every((v,i)=>i===gap||i===from||v===before[i]),'only tile and gap exchange');}
}
assert.throws(()=>core.create(1));assert.throws(()=>core.create(6));
console.log(JSON.stringify({checks:checks+2,failed:0}));
