// Retain the original illustrations; create lighter full-resolution runtime copies.
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require(process.env.MM_SHARP||'C:/Users/jeyan/Projects/DotMd/node_modules/sharp');
const files=[...['apple-tree','basket','carrot-garden','rabbit','apple','carrot'].map(n=>'count-art/'+n),...['locomotive-colour-v126','carriage-turquoise-v126','carriage-yellow-v126','carriage-coral-v126','carriage-violet-v126','farm-sky-v126'].map(n=>'train-art/'+n)];
(async()=>{
 const results=[];
 for(const name of files){
  const source=path.join(__dirname,'docs/beta',name+'.png'),target=path.join(__dirname,'docs/beta',name+'.webp');
  const original=await fs.readFile(source),encoded=await sharp(original).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
  const a=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(encoded).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(a.info.width!==b.info.width||a.info.height!==b.info.height)throw Error('Changed dimensions: '+name);
  let squared=0,visible=0;
  for(let i=0;i<a.data.length;i+=4){if(a.data[i+3]!==b.data[i+3])throw Error('Changed transparency: '+name);if(a.data[i+3]>128){visible+=3;for(let c=0;c<3;c++)squared+=(a.data[i+c]-b.data[i+c])**2;}}
  await fs.writeFile(target,encoded);results.push({file:name,width:a.info.width,height:a.info.height,sourceBytes:original.length,runtimeBytes:encoded.length,alphaExact:true,visibleRgbRmse:Math.sqrt(squared/visible)});
 }
 const out=process.env.ART_EVIDENCE||path.join(__dirname,'artifacts/game-art');await fs.mkdir(out,{recursive:true});
 await fs.writeFile(path.join(out,'optimization.json'),JSON.stringify({quality:90,alphaQuality:100,results},null,2));
 const before=results.reduce((n,r)=>n+r.sourceBytes,0),after=results.reduce((n,r)=>n+r.runtimeBytes,0);console.log(JSON.stringify({files:results.length,before,after,reduction:1-after/before}));
})().catch(error=>{console.error(error);process.exitCode=1;});
