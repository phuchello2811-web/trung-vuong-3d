import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); s.end(fs.readFileSync('dist/index.html','utf8')); }).listen(0);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu']});
const p=await b.newPage(); await p.setViewport({width:1000,height:620}); await p.goto(`http://localhost:${srv.address().port}/`,{waitUntil:'load'});
await p.waitForFunction('window.__ready===true',{timeout:120000}); await p.evaluate(()=>{ const l=document.getElementById('load'); l.hidden=false; document.getElementById('loadT').textContent='Dựng khung sàn, tường và mái theo bản vẽ'; document.querySelector('#pg i').style.width='46%'; });
await new Promise(r=>setTimeout(r,400)); await p.screenshot({path:'tools/out/load.png'}); await b.close(); srv.close();
