import assert from 'node:assert/strict';
import {readFile, stat, readdir} from 'node:fs/promises';
import {dirname, resolve, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=dirname(fileURLToPath(import.meta.url));
const docs=resolve(root,'docs'), beta=resolve(docs,'beta');
const base=new URL('https://example.test/toddler-games-/beta/');
let checked=0;
async function asset(reference, from=base){
  const url=new URL(reference,from);
  assert.equal(url.origin,base.origin,`External deployment asset: ${reference}`);
  assert(url.pathname.startsWith('/toddler-games-/'),`Asset escapes project path: ${reference}`);
  const file=resolve(docs,decodeURIComponent(url.pathname.slice('/toddler-games-/'.length)));
  assert(file.startsWith(docs+sep),`Asset escapes docs: ${reference}`);
  const info=await stat(file);
  assert(info.isFile()&&info.size>0,`Missing or empty asset: ${reference}`);
  checked++;
}
const worker=await readFile(resolve(beta,'sw.js'),'utf8');
const assets=JSON.parse(worker.match(/const ASSETS=(\[[^;]+\]);/)?.[1]||'null');
assert(Array.isArray(assets)&&assets.length>0,'Worker must declare offline assets');
for(const entry of assets) await asset(entry);
const manifest=JSON.parse(await readFile(resolve(beta,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.scope,'./');
assert.equal(manifest.orientation,'any');
await asset(manifest.start_url);
for(const icon of manifest.icons) await asset(icon.src);
for(const name of ['index.html','play.html']){
  const html=await readFile(resolve(beta,name),'utf8');
  for(const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g)){
    if(/^(?:data:|https?:|#)/.test(match[1])) continue;
    await asset(match[1]);
  }
}
async function syntax(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const file=resolve(directory,entry.name);
    if(entry.isDirectory()) await syntax(file);
    else if(entry.name.endsWith('.js')){
      const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
      assert.equal(result.status,0,`${relative(root,file)}: ${result.stderr}`);
    }
  }
}
await syntax(beta);
await stat(resolve(docs,'.nojekyll'));
assert((await readFile(resolve(docs,'index.html'),'utf8')).includes('beta/'));
console.log(`Deployment checks passed: ${checked} asset references; Beta JavaScript syntax valid.`);
