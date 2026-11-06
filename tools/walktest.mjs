import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); s.end('<!doctype html>'+fs.readFileSync('dist/index.html','utf8')); }).listen(0); const port=srv.address().port;
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const p=await b.newPage(); await p.setViewport({width:1280,height:800}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://localhost:${port}/`,{waitUntil:'load'}); await p.waitForFunction('window.__ready===true',{timeout:120000});
const res=await p.evaluate(()=>{ window.__manual=true; window.__noAuto=true; const a=window.__app,X=q=>(q-294)/9.42,Z=z=>(480-z)/9.42,out={};
  const start=(P,Q,y)=>{ a.player.pos.set(X(Q),y+1.6,Z(P)); a.player.vel.set(0,0,0); a.player.grounded=false; a.player.mode='walk'; a.player.tween=null; for(let i=0;i<30;i++) a.player.update(1/60); };
  // S1: lên từ tầng 1 tới mái
  start(550,140,0); out.S1=a.walkTest([[551,105],[551,90],[595,90],[595,105],[595,140],[551,140],[551,90],[595,90],[595,140],[551,140],[551,90],[595,90],[595,140],[551,140],[551,90],[595,90],[595,140],[551,140]]);
  out.S1shutter=a.walkTest([[551,100],[551,90]]);   // tầng 5: cửa cuốn chặn, phải đứng yên ở cao độ 17,5
  // S2 tầng 1 -> 2
  start(705,478,0); out.S2=a.walkTest([[752,478],[762,478],[762,501],[712,501],[704,501],[704,478],[752,478],[762,478],[762,501],[704,501]]);
  // S3 chéo tầng 1 -> 2
  start(340,430,0); const u=[-48/54.1,25/54.1],v=[23/51.4,46/51.4],at=(lx,lz)=>[363+u[0]*lx*9.42+v[0]*lz*9.42,433+u[1]*lx*9.42+v[1]*lz*9.42]; out.S3=a.walkTest([at(1.2,.6),at(1.2,3.9),at(1.2,4.7),at(4.5,4.7),at(4.5,1.3),at(4.5,.6),[300,450]]);
  // S4 khán đài
  start(342,340,0); out.S4=a.walkTest([[342,352],[342,430],[300,428],[250,428],[250,300]]);
  // Đi qua cửa vào phòng: bắc tầng 3, tây tầng 4, nam tầng 3, khối giữa tầng 4
  start(705,134,8.1); out.door1=a.walkTest([[720,134]]); start(440,140,12); out.door2=a.walkTest([[375,140],[375,118]]); start(235,262,8.1); out.door3=a.walkTest([[210,262]]); start(315,178,12); out.door4=a.walkTest([[335,178]]);
  // Điểm nhìn: rơi xuống đúng sàn và đi được
  out.views=a.VIEWS.filter(v=>v.p).map(v=>{ a.player.pos.set(...v.p); a.player.vel.set(0,0,0); a.player.grounded=false; a.player.mode='walk'; a.player.tween=null; for(let i=0;i<40;i++) a.player.update(1/60); const y=a.player.pos.y; a.player.yaw=v.y; a.player.keys={KeyW:true}; const x0=a.player.pos.clone(); for(let i=0;i<60;i++) a.player.update(1/60); a.player.keys={}; return {n:v.n,y:+y.toFixed(2),target:v.p[1],moved:+a.player.pos.distanceTo(x0).toFixed(2)}; });
  return out; });
for(const k of ['S1','S1shutter','S2','S3','S4','door1','door2','door3','door4']) console.log(k,res[k].map(r=>`${r.reached?'':'✗'}y=${r.y}`).join(' '));
console.table(res.views); console.log('errs',errs); await b.close(); srv.close();
