import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=dirname(fileURLToPath(import.meta.url));
export const isTextAsset=name=>/\.(?:html?|js|css|svg|json|webmanifest)$/i.test(name.split('?')[0]);
export function assetDigest(bytes,name){
  const content=isTextAsset(name)?Buffer.from(bytes.toString('utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n')):bytes;
  return createHash('sha256').update(content).digest('hex');
}
export async function expectedDigests(worker){
  const assets=JSON.parse(worker.match(/const ASSETS=(\[[^;]+\]);/)[1]),digests={};
  for(const asset of assets){
    const name=asset.split('?')[0];
    if(!digests[name])digests[name]=assetDigest(await readFile(resolve(root,'docs/beta',name)),name);
  }
  return Object.fromEntries(Object.entries(digests).sort(([a],[b])=>a.localeCompare(b)));
}
export async function checkIntegrity(worker){
  const actual=JSON.parse(worker.match(/const ASSET_DIGESTS=(\{[^;]+\});/)?.[1]||'null');
  assert.deepEqual(actual,await expectedDigests(worker),'Run node build-offline-integrity.mjs after changing offline assets');
}
if(resolve(process.argv[1]||'')===fileURLToPath(import.meta.url)){
  const file=resolve(root,'docs/beta/sw.js'),worker=await readFile(file,'utf8');
  if(process.argv.includes('--check'))await checkIntegrity(worker);
  else{
    const block='// BEGIN GENERATED OFFLINE DIGESTS\nconst ASSET_DIGESTS='+JSON.stringify(await expectedDigests(worker))+';\n// END GENERATED OFFLINE DIGESTS';
    assert(/\/\/ BEGIN GENERATED OFFLINE DIGESTS[\s\S]*?\/\/ END GENERATED OFFLINE DIGESTS/.test(worker));
    await writeFile(file,worker.replace(/\/\/ BEGIN GENERATED OFFLINE DIGESTS[\s\S]*?\/\/ END GENERATED OFFLINE DIGESTS/,block));
  }
  console.log('Offline asset digests '+(process.argv.includes('--check')?'verified':'generated')+'.');
}
