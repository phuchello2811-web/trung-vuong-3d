import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http'; import path from 'path';
// Chụp các góc bằng GPU thật qua Chrome
const shots=JSON.parse(fs.readFileSync(process.argv[2]||'tools/shots.json','utf8')); const W=+process.env.W||1400,H=+process.env.H||860;
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); s.end('<!doctype html>'+fs.readFileSync('dist/index.html','utf8')); }).listen(0);
const port=srv.address().port;
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--enable-unsafe-swiftshader',`--window-size=${W},${H}`]});
const p=await b.newPage(); await p.setViewport({width:W,height:H});
const logs=[]; p.on('console',m=>{ const t=m.text(); if(m.type()==='error'||m.type()==='warning'||t.startsWith('[')) logs.push(m.type()+': '+t.slice(0,400)); }); p.on('pageerror',e=>logs.push('PAGEERR '+e.message));
const t0=Date.now();
await p.goto(`http://localhost:${port}/`,{waitUntil:'load',timeout:120000});
await p.waitForFunction('window.__ready===true||!document.getElementById("loadErr").hidden',{timeout:240000}).catch(e=>logs.push('timeout '+e.message));
console.log('load ms',Date.now()-t0);
const info=await p.evaluate(()=>{ if(!window.__app) return document.getElementById('loadErr').textContent; window.__manual=true; window.__noAuto=true; const a=window.__app; const gl=a.renderer.getContext(); const ext=gl.getExtension('WEBGL_debug_renderer_info'); return {...a.info,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'',calls:a.renderer.info.render.calls}; });
console.log(JSON.stringify(info));
for(const s of shots){ const r=await p.evaluate(async s=>{ const a=window.__app; if(s.h!==undefined) a.setHour(s.h); a.hud(!!s.hud); if(s.orbit) a.orbit(...s.orbit); else if(s.view!==undefined){ const v=a.VIEWS[s.view]; a.goto(v.p,v.y,v.x,s.mode||'fly'); } else a.goto(s.p,s.y||0,s.x||0,s.mode||'fly'); const t=performance.now(); a.step(s.steps||2); return {ms:performance.now()-t,pos:a.camera.position.toArray().map(v=>+v.toFixed(2))}; },s);
  await new Promise(r=>setTimeout(r,120));
  await p.screenshot({path:`tools/out/${s.name}.png`}); console.log(s.name,JSON.stringify(r)); }
console.log(logs.slice(0,25).join('\n')); await b.close(); srv.close();
