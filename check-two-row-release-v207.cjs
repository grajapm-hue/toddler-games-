const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const beta=path.join(__dirname,'docs/beta'),release='sana-little-hands-beta-v207-two-row-tools';
let checks=0;const check=(msg,ok)=>{assert(ok,msg);checks++;};
for(const f of ['manifest.webmanifest','sana-puppy-v199-192.png','sana-puppy-v199-512.png','sana-puppy-welcome-circle-v199.png','icon.svg','icon-192.png','icon-512.png'])check('Preserve '+f,fs.readFileSync(path.join(beta,f)).equals(execFileSync('git',['show','9657e25467bb12d9912c3fdb813b8e17053794d1:docs/beta/'+f],{cwd:__dirname})));
for(const f of ['index.html','play.html']){const html=fs.readFileSync(path.join(beta,f),'utf8');check(f+' release',html.includes(`name="sana-release" content="${release}"`));check(f+' version label',html.includes('data-release-version>v2.07<'));}
const worker=fs.readFileSync(path.join(beta,'sw.js'),'utf8'),assets=JSON.parse(worker.match(/const ASSETS=(\[[^;]+\]);/)[1]);
check('Correct cache namespace',worker.includes(`const CACHE='${release}'`));check('All robot images cached',assets.filter(a=>a.includes('/v200/robots/')).length===34);check('Legacy machine cartoons excluded',!assets.some(a=>a.includes('/v198/machines/')));
check('Prior recovery routes remain cached',assets.includes('./v2.03.html')&&assets.includes('./v2.04.html'));
for(const f of ['robot-catalogue.js','robot-viewport.js','robot-machines.js','robot-machines.css','v2.07.html'])check(f+' cached',assets.includes('./'+f));
for(const f of fs.readdirSync(path.join(__dirname,'docs')).filter(f=>/^update-beta-.*\.html$/.test(f))){const html=fs.readFileSync(path.join(__dirname,'docs',f),'utf8');check(f+' targets current release',html.includes(release));check(f+' Chrome entry exists',html.includes("new URL('update-beta-v2.07.html',location.href)"));}
const app=fs.readFileSync(path.join(beta,'app.js'),'utf8');check('Dedicated Machines controller',app.includes("if(state.activity==='machines'){scene.replaceChildren();robots.start(state.age);}"));check('Blocks controller retained',app.includes("glossy.start(state.age,state.level,'blocks')"));
console.log(`Robot release: ${checks} checks passed.`);

const normalize=(name,text)=>{text=text.replace(/\r\n/g,'\n');if(name==='robot-machines.js')return text.replace(/room\.innerHTML=[\s\S]*?;\s*scene\.after\(room\);/,'ROOM_TEMPLATE;scene.after(room);');if(name==='parent-guide.js')return text.split('\n').filter(line=>!line.includes("'4. Move and zoom'")&&!line.includes("'5. Make your own design'")).join('\n');return text;};
for(const name of fs.readdirSync(beta).filter(n=>n.endsWith('.js')&&n!=='sw.js'))check('Controller logic unchanged: '+name,normalize(name,fs.readFileSync(path.join(beta,name),'utf8'))===normalize(name,execFileSync('git',['show','9bf84b7376202e9148d35cd2e7532858cee0cdbe:docs/beta/'+name],{cwd:__dirname,maxBuffer:8*1024*1024,encoding:'utf8'})));
check('Compact stylesheet precached',assets.includes('./compact-controls.css'));
check('Compact stylesheet is final style layer',/robot-machines\.css[\s\S]*compact-controls\.css/.test(fs.readFileSync(path.join(beta,'play.html'),'utf8')));
console.log(`Two-row release: ${checks} checks passed.`);
