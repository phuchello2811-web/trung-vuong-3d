// Kiểm thử tương tác nhấn E bằng phím thật: kéo bảng, tắt tivi, ném bóng rổ, pickleball, đàn piano, trống, cửa cuốn
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); s.end('<!doctype html>'+fs.readFileSync(process.argv[2]||'dist/index.html','utf8')); }).listen(0);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); await p.setViewport({width:1280,height:800}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://localhost:${srv.address().port}/`,{waitUntil:'load'}); await p.waitForFunction('window.__ready===true',{timeout:180000});
const W=ms=>new Promise(r=>setTimeout(r,ms));
// đứng cách vật 2 m (bảng, đàn) hoặc 4 m (rổ, lưới), nhìn thẳng vào nó
const face=(kind,dist)=>p.evaluate(([kind,dist])=>{ const a=window.__app,T=window.THREE,t=a.inter.targets.find(t=>t.label().includes(kind)); if(!t) return 'không có '+kind;
  const c=t.room?new T.Vector3(((t.room.Q0+t.room.Q1)/2-294)/9.42,0,(480-(t.room.P0+t.room.P1)/2)/9.42):t.pos.clone().add(new T.Vector3(dist,0,0));
  const dir=new T.Vector3(c.x-t.pos.x,0,c.z-t.pos.z).normalize(); const eye=t.pos.clone().addScaledVector(dir,dist); eye.y=t.room?[0,.02,4.2,8.1,12,15.9,19.8][t.room.L]+1.6:1.6;
  a.player.tween=null; a.player.mode='walk'; a.player.pos.copy(eye); a.player.vel.set(0,0,0); const d=t.pos.clone().sub(eye); a.player.yaw=Math.atan2(-d.x,-d.z); a.player.pitch=Math.atan2(d.y,Math.hypot(d.x,d.z)); a.camera.position.copy(eye); a.camera.quaternion.setFromEuler(new T.Euler(a.player.pitch,a.player.yaw,0,'YXZ')); return 'ok'; },[kind,dist]);
const prompt=()=>p.evaluate(()=>document.getElementById('tPrompt').hidden?null:document.getElementById('tPromptT').textContent);
const toast=()=>p.evaluate(()=>document.getElementById('toast').hidden?null:document.getElementById('toast').textContent);
const res={};
console.log(await face('Kéo bảng',2.2)); await W(400); res.board_prompt=await prompt();
const x0=await p.evaluate(()=>window.__app.inter.targets.find(t=>t.label().includes('Kéo bảng')).state.t);
await p.keyboard.press('KeyE'); await W(1600); res.board_after=[x0,await p.evaluate(()=>window.__app.inter.targets.find(t=>t.state&&t.label().includes('Kéo bảng')).state.t),await prompt()];
await p.screenshot({path:'tools/out/i_board_closed.png'});
await face('Tắt tivi',1.6); await W(400); res.tv_prompt=await prompt(); await p.keyboard.press('KeyE'); await W(300); res.tv_after=await prompt();
await face('Ném bóng',4.5); await W(400); res.hoop_prompt=await prompt(); await p.keyboard.press('KeyE'); await W(500); await p.screenshot({path:'tools/out/i_ball.png'}); await W(900); res.hoop_toast=await toast();
await face('pickleball',4); await W(400); res.pickle_prompt=await prompt(); await p.keyboard.press('KeyE'); await W(1200); await p.screenshot({path:'tools/out/i_pickle.png'});
await face('Chơi đàn',1.6); await W(400); res.piano_prompt=await prompt(); await p.keyboard.press('KeyE'); await W(500); res.piano=[await toast(),await p.evaluate(()=>{ const c=[...document.querySelectorAll('*')]; return typeof AudioContext; })];
await face('Đánh trống',1.6); await W(400); res.drum_prompt=await prompt();
await face('Cửa cuốn',1.8); await W(400); res.shutter_prompt=await prompt(); await p.keyboard.press('KeyE'); await W(300); res.shutter_toast=await toast();
// chế độ bay: không hiện gợi ý (phím E dùng để bay lên)
await p.evaluate(()=>{ window.__app.player.mode='fly'; }); await W(300); res.fly_prompt=await prompt();
console.log(JSON.stringify(res,null,1)); console.log('lỗi',errs); await b.close(); srv.close();
