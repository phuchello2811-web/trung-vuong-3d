import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); s.end(fs.readFileSync('dist/index.html','utf8')); }).listen(0); const port=srv.address().port;
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const p=await b.newPage(); await p.setViewport({width:1440,height:860}); const errs=[]; p.on('pageerror',e=>errs.push('ERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,200)); });
await p.goto(`http://localhost:${port}/`,{waitUntil:'load'}); await p.waitForFunction('window.__ready===true',{timeout:120000});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); await wait(800); if(await p.evaluate(()=>!document.getElementById('menu').hidden)){ await p.click('#btnTour'); await wait(1600); }
const st=()=>p.evaluate(()=>{ const a=window.__app,c=a.camera.position; return {mode:a.player.mode,x:+c.x.toFixed(2),y:+c.y.toFixed(2),z:+c.z.toFixed(2),where:document.getElementById('whereT').textContent,floor:document.querySelector('#floors .on')?.textContent,load:document.getElementById('load').hidden}; });
console.log('start',await st());
const click=async t=>{ await p.evaluate(t=>{ [...document.querySelectorAll('#views button')].find(b=>b.textContent===t).click(); },t); await wait(1900); };
await click('Hành lang tầng 3'); console.log('view',await st());
await p.keyboard.down('KeyW'); await wait(1600); await p.keyboard.up('KeyW'); console.log('W 1.6s',await st());
await click('Phòng học tầng 3'); console.log('view',await st());
await click('Trên mái'); console.log('roof',await st());
await click('Sân đa năng'); console.log('multi',await st());
// Đo trên mặt sàn cầu lông
await p.click('#measure'); await wait(200);
const pt=async(P,Q)=>p.evaluate(([P,Q])=>{ const a=window.__app,T=window.THREE,v=new T.Vector3((Q-294)/9.42,0.02,(480-P)/9.42).project(a.camera); return [(v.x*.5+.5)*innerWidth,(-v.y*.5+.5)*innerHeight]; },[P,Q]);
let A=await pt(331,255),B=await pt(390,255); console.log('pts',A,B); await p.mouse.click(A[0],A[1]); await wait(150); await p.mouse.click(B[0],B[1]); await wait(400);
console.log('do chieu rong san cau long (ky vong ~6,1-6,3 m):',await p.evaluate(()=>{const l=document.getElementById('mlabel'); return [l.hidden,l.textContent]}));
await p.screenshot({path:'tools/out/ui_measure.png'});
await p.click('#measure');
// Bấm bản đồ tầng 3: hành lang khối Bắc
await p.evaluate(()=>[...document.querySelectorAll('#floors button')].find(b=>b.textContent==='3').click()); await wait(200);
const r=await p.evaluate(()=>{ const m=document.getElementById('map').getBoundingClientRect(); const MW=352,MH=472,Qmin=30,Qmax=556,Pmin=120,Pmax=840,k=Math.min(MW/(Qmax-Qmin),MH/(Pmax-Pmin)); const sx=(300-Qmin)*k+(MW-(Qmax-Qmin)*k)/2,sy=(Pmax-706)*k+(MH-(Pmax-Pmin)*k)/2; return [m.left+sx/MW*m.width,m.top+sy/MH*m.height]; });
await p.mouse.click(r[0],r[1]); await wait(1600); console.log('map click',await st());
// Giờ
await p.evaluate(()=>{ const t=document.getElementById('time'); t.value=17.2; t.dispatchEvent(new Event('input',{bubbles:true})); }); await wait(500); console.log('clock',await p.evaluate(()=>[document.getElementById('clock').textContent,document.getElementById('sunInfo').textContent]));
await p.evaluate(()=>{ const t=document.getElementById('time'); t.value=9; t.dispatchEvent(new Event('input',{bubbles:true})); }); await wait(300);
await p.click('#infoBtn'); await wait(300); await p.screenshot({path:'tools/out/ui_info.png'}); console.log('errs',errs);
await b.close(); srv.close();
