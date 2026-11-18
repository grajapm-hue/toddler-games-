// Check raw crawler-visible metadata, without depending on page JavaScript.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'docs/beta'),base='https://grajapm-hue.github.io/toddler-games-/beta/';
let checks=0;
for(const name of ['index.html','play.html']){
 const html=fs.readFileSync(path.join(root,name),'utf8'),head=html.split('</head>')[0],meta=new Map();
 for(const match of head.matchAll(/<meta\b[^>]*>/g)){
  const attributes=new Map(Array.from(match[0].matchAll(/([\w:]+)="([^"]*)"/g),item=>[item[1],item[2]]));
  const key=attributes.get('property')||attributes.get('name');
  if(key)meta.set(key,attributes.get('content'));
 }
 assert.equal(meta.get('og:title'),'SaNa Little Hands Beta',name+': picture preview needs a SaNa title');checks++;
 assert.equal(meta.get('og:type'),'website');assert.equal(meta.get('og:url'),base+'index.html');checks++;
 assert((meta.get('description')||'').length>0);assert.equal(meta.get('og:description'),meta.get('description'));checks++;
 const image=meta.get('og:image');assert.equal(image,base+'icon-512.png');
 const bytes=fs.readFileSync(path.join(root,new URL(image).pathname.split('/').pop()));
 assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),Number(meta.get('og:image:width')));assert.equal(bytes.readUInt32BE(20),Number(meta.get('og:image:height')));checks++;
 assert.equal(meta.get('og:image:type'),'image/png');assert.match(meta.get('og:image:alt')||'',/SaNa/);checks++;
 assert.equal(meta.get('twitter:card'),'summary_large_image');assert.equal(meta.get('twitter:image'),image);checks++;
 assert(!/MathMatrix/i.test(Array.from(meta.values()).join(' ')));checks++;
 console.log('PASS '+name+': crawler-visible SaNa picture, title, description and image dimensions');
}
console.log('PASS '+checks+' share-preview checks');
