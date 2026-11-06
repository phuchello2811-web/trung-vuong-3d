// Thả nhiều người chơi ảo đi ngẫu nhiên trên tầng 2–5 và sân thượng. Ai rơi tự do (vận tốc rơi > 5 m/s) là có lỗ hổng.
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); s.end('<!doctype html>'+fs.readFileSync(process.argv[2]||'dist/index.html','utf8')); }).listen(0);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu']});
const p=await b.newPage(); await p.setViewport({width:800,height:500}); p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(`http://localhost:${srv.address().port}/`,{waitUntil:'load'}); await p.waitForFunction('window.__ready===true',{timeout:180000});
const r=await p.evaluate((NA)=>{ window.__manual=true; const a=window.__app,P=a.player,Y=[0,.02,4.2,8.1,12,15.9,19.8]; const falls=[]; let agents=0; let seed=12345; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(const L of [2,3,4,5,6,1.5,2.5,3.5,4.5]) for(let k=0;k<NA;k++){
    const yl=Number.isInteger(L)?Y[L]:(Y[Math.floor(L)]+Y[Math.ceil(L)])/2, x=-28+rnd()*56, z=-38+rnd()*76, fy=P.floorAt(x,z,yl+1.2); if(fy===null||Math.abs(fy-yl)>.12) continue; { const q=new window.THREE.Vector3(x,fy+1.6,z),d=P.resolve(q); if(Math.hypot(d.x,d.z)>.02) continue; } agents++;
    P.mode='walk'; P.tween=null; P.frozen=false; P.pos.set(x,fy+1.6,z); P.vel.set(0,0,0); P.grounded=true;
    let yaw=rnd()*6.283;
    for(let t=0;t<900;t++){ if(t%90===0) yaw=rnd()*6.283; P.yaw=yaw; P.keys={KeyW:true}; const before=P.pos.clone(); P.update(1/60);
      if(P.vel.y<-5){ falls.push({L,start:[+x.toFixed(1),+z.toFixed(1)],at:[+before.x.toFixed(1),+before.y.toFixed(1),+before.z.toFixed(1)]}); break; } }
    P.keys={};
  }
  return {agents,falls,doorFixes:a.info.doorFixes}; },+(process.env.N||160));
console.log('người chơi ảo:',r.agents,'| số lần rơi:',r.falls.length); console.log(JSON.stringify(r.falls.slice(0,15))); console.log('cửa đã đổi thành cửa sổ:',r.doorFixes);
await b.close(); srv.close();
