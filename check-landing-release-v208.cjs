const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const beta=path.join(__dirname,'docs/beta'),release='sana-little-hands-beta-v208-stores-size-controls';
let checks=0;const check=(msg,ok)=>{assert(ok,msg);checks++;};
for(const f of ['manifest.webmanifest','sana-puppy-v199-192.png','sana-puppy-v199-512.png','sana-puppy-welcome-circle-v199.png','icon.svg','icon-192.png','icon-512.png'])check('Preserve '+f,fs.readFileSync(path.join(beta,f)).equals(execFileSync('git',['show','32605b0e58670441c8822fb83127ec289bd9bbdc:docs/beta/'+f],{cwd:__dirname})));
for(const f of ['index.html','play.html']){const html=fs.readFileSync(path.join(beta,f),'utf8');check(f+' release',html.includes(`name="sana-release" content="${release}"`));check(f+' version label',html.includes('data-release-version>v2.08<'));}
const worker=fs.readFileSync(path.join(beta,'sw.js'),'utf8'),assets=JSON.parse(worker.match(/const ASSETS=(\[[^;]+\]);/)[1]);
check('Correct cache namespace',worker.includes(`const CACHE='${release}'`));check('All robot images cached',assets.filter(a=>a.includes('/v200/robots/')).length===34);check('Legacy machine cartoons excluded',!assets.some(a=>a.includes('/v198/machines/')));
check('Prior recovery routes remain cached',assets.includes('./v2.03.html')&&assets.includes('./v2.04.html'));
for(const f of ['robot-catalogue.js','robot-viewport.js','robot-machines.js','robot-machines.css','v2.08.html'])check(f+' cached',assets.includes('./'+f));
for(const f of fs.readdirSync(path.join(__dirname,'docs')).filter(f=>/^update-beta-.*\.html$/.test(f))){const html=fs.readFileSync(path.join(__dirname,'docs',f),'utf8');check(f+' targets current release',html.includes(release));check(f+' Chrome entry exists',html.includes("new URL('update-beta-v2.08.html',location.href)"));}
const app=fs.readFileSync(path.join(beta,'app.js'),'utf8');check('Dedicated Machines controller',app.includes("if(state.activity==='machines'){scene.replaceChildren();robots.start(state.age);}"));check('Blocks controller retained',app.includes("glossy.start(state.age,state.level,'blocks')"));
console.log(`Robot release: ${checks} checks passed.`);

const normalize=text=>text.replace(/\r\n/g,'\n');
for(const name of fs.readdirSync(beta).filter(n=>n.endsWith('.js')&&!['sw.js','robot-machines.js','parent-guide.js'].includes(n)))check('Unrelated controller unchanged: '+name,normalize(fs.readFileSync(path.join(beta,name),'utf8'))===normalize(execFileSync('git',['show','32605b0e58670441c8822fb83127ec289bd9bbdc'+':docs/beta/'+name],{cwd:__dirname,maxBuffer:8*1024*1024,encoding:'utf8'})));
const priorRobot=normalize(execFileSync('git',['show','32605b0e58670441c8822fb83127ec289bd9bbdc'+':docs/beta/robot-machines.js'],{cwd:__dirname,encoding:'utf8'})).replace('.5*Math.min(width/part.width,height/part.height)/canvasScale','Math.min(width/part.width,height/part.height)/canvasScale').replace('pendingScale=.5*pendingStoreScale/base','pendingScale=pendingStoreScale/base');
check('Only initial landing factors change in the robot controller',priorRobot===normalize(fs.readFileSync(path.join(beta,'robot-machines.js'),'utf8')));
check('Compact stylesheet precached',assets.includes('./compact-controls.css'));
check('Compact stylesheet is final style layer',/robot-machines\.css[\s\S]*compact-controls\.css/.test(fs.readFileSync(path.join(beta,'play.html'),'utf8')));
console.log(`Two-row release: ${checks} checks passed.`);
