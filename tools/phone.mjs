import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); s.end('<!doctype html><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'+fs.readFileSync('dist/index.html','utf8')); }).listen(0); const port=srv.address().port;
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const p=await b.newPage(); await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}); await p.goto(`http://localhost:${port}/`,{waitUntil:'load'}); await p.waitForFunction('window.__ready===true',{timeout:120000});
await new Promise(r=>setTimeout(r,2500)); await p.evaluate(()=>{ document.querySelector('#modes [data-m=walk]').click(); window.__app.goto([8.5,1.6,-22],2.3,.1,'walk'); }); await new Promise(r=>setTimeout(r,1500)); await p.screenshot({path:'tools/out/phone.png'});
const w=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]); console.log(w);
await p.click('#infoBtn'); await new Promise(r=>setTimeout(r,500)); await p.screenshot({path:'tools/out/phone_info.png'}); await b.close(); srv.close();
