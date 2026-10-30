import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
let html=await readFile(resolve(root,'index.html'),'utf8');
const script=await readFile(resolve(root,'app.js'),'utf8');
const profiles=await readFile(resolve(root,'age-profiles.js'),'utf8');
const icon=await readFile(resolve(root,'icon.svg'),'utf8');
const appleIcon=await readFile(resolve(root,'icon-192.png'));
html=html.replace('<html lang="en">','<html lang="en" data-self-contained>')
  .replace('<link rel="manifest" href="manifest.webmanifest">','')
  .replace('href="icon.svg"',`href="data:image/svg+xml,${encodeURIComponent(icon)}"`)
  .replace('href="icon-192.png"',`href="data:image/png;base64,${appleIcon.toString('base64')}"`)
  .replace('<script src="age-profiles.js"></script>',()=>`<script>\n${profiles.replace(/<\/script/gi,'<\\/script')}\n</script>`)
  .replace('<script src="app.js"></script>',()=>`<script>\n${script.replace(/<\/script/gi,'<\\/script')}\n</script>`);
const output=resolve(root,'SaNa-Little-Hands-Prototype.html');
await writeFile(output,html);
console.log(`Self-contained HTML ready: ${output}`);
