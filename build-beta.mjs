import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),out=resolve(root,'docs','beta');
await mkdir(out,{recursive:true});
let welcome=await readFile(resolve(root,'welcome-preview.html'),'utf8');
welcome=welcome.replace('<title>SaNa Little Hands · Welcome preview</title>','<title>SaNa Little Hands Beta</title>')
  .replace('</head>','<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="icon-192.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="SaNa Beta">\n</head>')
  .replace('Welcome preview · 01','Beta · v0.1')
  .replace('href="SaNa-Little-Hands-Prototype.html"','href="play.html"')
  .replace('</svg>Install app</button>','</svg><span data-install-label>Install app</span></button>')
  .replace('Made for ages 2–4 · Three playful levels','Made for ages 2–4 · Three playful levels<br><span id="offline-status" role="status">Preparing offline play…</span>')
  .replace(/  document\.getElementById\('install'\)\.addEventListener[^\n]*\n/,'')
  .replace('})();',"  window.sanaInstallDialog=(title,copy)=>show(title,copy,document.getElementById('install'));\n})();")
  .replace('</body>','<script src="pwa.js"></script>\n</body>');
if(welcome.includes('Installation will be available'))throw new Error('Preview install placeholder must not ship');
await writeFile(resolve(out,'index.html'),welcome);
let play=await readFile(resolve(root,'index.html'),'utf8');
play=play.replace('<title>SaNa · Little Hands</title>','<title>SaNa Little Hands Beta · Play</title>')
  .replace('<div class="brand">','<a class="brand" href="index.html" aria-label="SaNa Beta welcome" style="color:inherit;text-decoration:none">')
  .replace('<small>little hands</small></div></div>','<small>little hands · beta</small></div></a>')
  .replace('<script src="app.js"></script>','<script src="app.js"></script>\n<script src="pwa.js"></script>');
await writeFile(resolve(out,'play.html'),play);
let game=await readFile(resolve(root,'app.js'),'utf8');
game=game.replace(/  if\(!document\.documentElement\.hasAttribute\('data-self-contained'\)[^\n]*\n/,'');
await writeFile(resolve(out,'app.js'),game);
for(const file of ['pwa.js','sw.js','manifest.webmanifest'])await copyFile(resolve(root,'beta-runtime',file),resolve(out,file));
for(const file of ['icon.svg','icon-192.png','icon-512.png'])await copyFile(resolve(root,file),resolve(out,file));
await writeFile(resolve(root,'docs','.nojekyll'),'');
await writeFile(resolve(root,'docs','index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=beta/"><title>SaNa Little Hands Beta</title><p><a href="beta/">Open SaNa Little Hands Beta</a></p></html>\n');
console.log('Built installable Beta in docs/beta. Publish Pages from main /docs.');
