const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const beta=path.join(__dirname,'docs/beta'),release='sana-little-hands-beta-v204-reference-scale-tools';
let checks=0;const check=(msg,ok)=>{assert(ok,msg);checks++;};
for(const f of ['manifest.webmanifest','sana-puppy-v199-192.png','sana-puppy-v199-512.png','sana-puppy-welcome-circle-v199.png','icon.svg','icon-192.png','icon-512.png'])check('Preserve '+f,fs.readFileSync(path.join(beta,f)).equals(execFileSync('git',['show','9657e25467bb12d9912c3fdb813b8e17053794d1:docs/beta/'+f],{cwd:__dirname})));
for(const f of ['index.html','play.html']){const html=fs.readFileSync(path.join(beta,f),'utf8');check(f+' release',html.includes(`name="sana-release" content="${release}"`));check(f+' version label',html.includes('data-release-version>v2.04<'));}
const worker=fs.readFileSync(path.join(beta,'sw.js'),'utf8'),assets=JSON.parse(worker.match(/const ASSETS=(\[[^;]+\]);/)[1]);
check('Correct cache namespace',worker.includes(`const CACHE='${release}'`));check('All robot images cached',assets.filter(a=>a.includes('/v200/robots/')).length===34);check('Legacy machine cartoons excluded',!assets.some(a=>a.includes('/v198/machines/')));
for(const f of ['robot-catalogue.js','robot-viewport.js','robot-machines.js','robot-machines.css','v2.04.html'])check(f+' cached',assets.includes('./'+f));
for(const f of fs.readdirSync(path.join(__dirname,'docs')).filter(f=>/^update-beta-.*\.html$/.test(f))){const html=fs.readFileSync(path.join(__dirname,'docs',f),'utf8');check(f+' targets current release',html.includes(release));check(f+' Chrome entry exists',html.includes("new URL('update-beta-v2.04.html',location.href)"));}
const app=fs.readFileSync(path.join(beta,'app.js'),'utf8');check('Dedicated Machines controller',app.includes("if(state.activity==='machines'){scene.replaceChildren();robots.start(state.age);}"));check('Blocks controller retained',app.includes("glossy.start(state.age,state.level,'blocks')"));
console.log(`Robot release: ${checks} checks passed.`);
