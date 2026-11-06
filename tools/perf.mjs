import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); s.end('<!doctype html>'+fs.readFileSync('dist/index.html','utf8')); }).listen(0); const port=srv.address().port;
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-frame-rate-limit','--disable-gpu-vsync']});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:2}); await p.goto(`http://localhost:${port}/`,{waitUntil:'load'}); await p.waitForFunction('window.__ready===true',{timeout:120000});
await new Promise(r=>setTimeout(r,1500));
const m=await p.evaluate(async()=>{ window.__noAuto=true; const a=window.__app; const out={}; const fps=()=>new Promise(res=>{ let n=0; const t=performance.now(); const f=()=>{ n++; if(performance.now()-t>4000) res(+(n/(performance.now()-t)*1000).toFixed(1)); else requestAnimationFrame(f); }; f(); });
 for(const [name,q] of [['cao',2],['vua',1],['nhe',0]]){ a.setQ(q); a.orbit(1.85,1.12,86); await new Promise(r=>setTimeout(r,800)); out[name+'_toan_canh']=await fps(); a.goto([8.5,1.6,-22],2.3,.2,'fly'); await new Promise(r=>setTimeout(r,300)); out[name+'_trong_san']=await fps(); }
 return out; }); console.log(m); await b.close(); srv.close();
