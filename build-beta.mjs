import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),out=resolve(root,'docs','beta');
await mkdir(out,{recursive:true});
const release=(await readFile(resolve(root,'beta-runtime','sw.js'),'utf8')).match(/const CACHE='([^']+)'/)?.[1];
if(!release)throw new Error('Beta worker must identify its release');
let welcome=await readFile(resolve(root,'welcome-preview.html'),'utf8');
welcome=welcome.replace('<title>SaNa Little Hands · Welcome preview</title>','<title>SaNa Little Hands Beta</title>')
  .replace('</head>','<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="icon-192.png">\n<link rel="stylesheet" href="share.css">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="SaNa Beta">\n</head>')
  .replace('</head>',`<meta name="sana-release" content="${release}">\n</head>`)
  .replace('Welcome preview · 01','Beta · v0.32')
  .replace('Little Hands preview','Beta v0.32')
  .replace(/(<span class="preview-tag">[^<]+<\/span>)/,'<div class="release-tools">$1<button class="update-button" id="update-app" type="button" aria-label="Update app" aria-busy="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7V3M20 7H16M20 7A8 8 0 1 0 21 14"/></svg><span data-update-label>Update app</span></button><button class="welcome-share" id="share-app" type="button" aria-label="Share app"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="4" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="20" r="3"/><path d="M9 10L15 6M9 14L15 18"/></svg></button></div>')
  .replace('href="SaNa-Little-Hands-Prototype.html"','href="play.html"')
  .replace('</svg>Install app</button>','</svg><span data-install-label>Install app</span></button>')
  .replace('Starting sets for ages 2–5 · Choose freely','Starting sets for ages 2–5 · Choose freely<br><span id="offline-status" role="status">Preparing offline play…</span>')
  .replace(/  document\.getElementById\('install'\)\.addEventListener[^\n]*\n/,'')
  .replace('<button class="about-button" type="button" id="about">About this project</button>', '<div class="footer-actions"><button class="about-button" type="button" id="about">About this project</button></div>')
  .replace('})();',"  window.sanaInstallDialog=(title,copy)=>show(title,copy,document.getElementById('install'));\n  window.sanaAppDialog=(title,copy,source)=>show(title,copy,source);\n})();")
  .replace('</body>','<script src="pwa.js"></script>\n<script src="share.js"></script>\n</body>');
if(welcome.includes('Installation will be available'))throw new Error('Preview install placeholder must not ship');
await writeFile(resolve(out,'index.html'),welcome);
let play=await readFile(resolve(root,'index.html'),'utf8');
play=play.replace('<title>SaNa · Little Hands</title>','<title>SaNa Little Hands Beta · Play</title>')
  .replace('</head>',`<meta name="sana-release" content="${release}">\n</head>`)
  .replace('<header class="topbar">','<header class="topbar has-app-update">')
  .replace('<div class="brand">','<a class="brand" href="index.html" aria-label="SaNa Beta welcome" style="color:inherit;text-decoration:none">')
  .replace('<small>little hands</small></div></div>','<small>little hands · beta</small></div></a><button class="app-update-button" id="update-app" type="button" aria-label="Update app" aria-busy="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7V3M20 7H16M20 7A8 8 0 1 0 21 14"/></svg><span data-update-label>Update</span></button>')
  .replace('<script src="app.js"></script>','<script src="app.js"></script>\n<script src="pwa.js"></script>');
await writeFile(resolve(out,'play.html'),play);
let game=await readFile(resolve(root,'app.js'),'utf8');
game=game.replace(/  if\(!document\.documentElement\.hasAttribute\('data-self-contained'\)[^\n]*\n/,'');
await writeFile(resolve(out,'app.js'),game);
for(const file of ['pwa.js','sw.js','manifest.webmanifest','share.js','share.css'])await copyFile(resolve(root,'beta-runtime',file),resolve(out,file));
await copyFile(resolve(root,'age-profiles.js'),resolve(out,'age-profiles.js'));
for(const file of ['icon.svg','icon-192.png','icon-512.png'])await copyFile(resolve(root,file),resolve(out,file));
await writeFile(resolve(root,'docs','.nojekyll'),'');
await writeFile(resolve(root,'docs','index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=beta/"><title>SaNa Little Hands Beta</title><p><a href="beta/">Open SaNa Little Hands Beta</a></p></html>\n');
console.log('Built installable Beta in docs/beta. Publish Pages from main /docs.');
