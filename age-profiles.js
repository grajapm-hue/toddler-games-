(() => {
  'use strict';
  const key='sanaLittleHandsAgeV1',ages=[2,3,4,5];
  const valid=value=>ages.includes(Number(value))?Number(value):null;
  let selected=null;
  try{selected=valid(JSON.parse(localStorage.getItem(key)||'null')?.age);}catch{/* Family choices also work without storage. */}
  const queryAge=valid(new URL(location.href).searchParams.get('age'));
  if(queryAge!==null)selected=queryAge;
  // Future games can add preset fields here; the activity registry creates their cards.
  const profiles={
    common:{shapeCount:[2,4,6],snapDistance:[128,96,73],sliderCount:[1,2,3],bubbleCount:[4,6,9],bubbleSpeed:['slow','medium','fast'],bubbleSize:['large','medium','small'],brushSize:['large','medium','small'],picture:[1,2,3],paintTarget:[.5,.65,.8],dirtHealth:[1,2.5,4],numberCount:[20,20,20],letterCount:[26,26,26],shapeTokens:[6,6,6],bubbleMode:'plain',abacusGoal:[3,5,10]},
    2:{shapeCount:[2,3,4],snapDistance:[150,140,128],sliderCount:[1,1,2],bubbleCount:[3,4,5],bubbleSpeed:['slow','slow','medium'],bubbleSize:['large','large','large'],brushSize:['large','large','large'],picture:[1,1,2],paintTarget:[.3,.4,.5],dirtHealth:[.7,1,1.5],numberCount:[3,4,5],letterCount:[3,4,5],shapeTokens:[2,3,3],bubbleMode:'plain',abacusGoal:[1,2,3]},
    3:{shapeCount:[2,3,4],snapDistance:[140,128,110],sliderCount:[1,2,2],bubbleCount:[4,5,6],bubbleSpeed:['slow','slow','medium'],bubbleSize:['large','large','medium'],brushSize:['large','large','medium'],picture:[1,2,2],paintTarget:[.4,.5,.65],dirtHealth:[1,1.5,2.5],numberCount:[5,8,10],letterCount:[5,8,13],shapeTokens:[3,4,5],bubbleMode:'numbers',abacusGoal:[2,3,5]},
    4:{shapeCount:[3,4,6],snapDistance:[128,110,96],sliderCount:[1,2,3],bubbleCount:[5,6,8],bubbleSpeed:['slow','medium','medium'],bubbleSize:['large','medium','medium'],brushSize:['large','medium','medium'],picture:[1,2,3],paintTarget:[.5,.65,.75],dirtHealth:[1,2.5,3.5],numberCount:[5,10,15],letterCount:[8,13,20],shapeTokens:[4,5,6],bubbleMode:'numbers',abacusGoal:[3,5,8]},
    5:{shapeCount:[4,5,6],snapDistance:[128,110,96],sliderCount:[2,3,3],bubbleCount:[6,8,9],bubbleSpeed:['medium','medium','fast'],bubbleSize:['large','medium','medium'],brushSize:['large','medium','medium'],picture:[2,3,3],paintTarget:[.5,.65,.8],dirtHealth:[2,3,4],numberCount:[10,15,20],letterCount:[13,20,26],shapeTokens:[5,6,6],bubbleMode:'numbers',abacusGoal:[5,8,10]}
  };
  function select(value){
    selected=valid(value);
    try{if(selected===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify({age:selected}));}catch{/* Keep the choice in memory and in navigation links. */}
  }
  function preset(level){const index=Math.max(0,Math.min(2,Number(level)-1||0));return Object.fromEntries(Object.entries(profiles[selected??'common']).map(([name,value])=>[name,Array.isArray(value)?value[index]:value]));}
  function navigation(path){const url=new URL(path,location.href);if(selected===null&&!url.searchParams.has('age'))return path;if(selected!==null)url.searchParams.set('age',selected);else url.searchParams.delete('age');return url.pathname+url.search+url.hash;}
  window.SaNaProfiles={getAge:()=>selected,select,preset,navigation};
})();
