// Kiểm thử game bằng thao tác thật trên giao diện
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const file=process.argv[2]||'dist/index.html';
const srv=http.createServer((q,s)=>{ s.setHeader('Content-Type','text/html;charset=utf-8'); const h=fs.readFileSync(file,'utf8'); s.end(h.startsWith('<!doctype')?h:'<!doctype html>'+h); }).listen(0);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const p=await b.newPage(); await p.setViewport({width:1400,height:860}); const errs=[]; p.on('pageerror',e=>errs.push('ERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,300)); });
await p.goto(`http://localhost:${srv.address().port}/`,{waitUntil:'load'}); await p.waitForFunction('window.__ready===true',{timeout:180000});
const W=ms=>new Promise(r=>setTimeout(r,ms)), shot=n=>p.screenshot({path:`tools/out/g_${n}.png`});
const st=()=>p.evaluate(()=>{ const s=window.__app.game.state; return {mode:window.__app.game.mode,coins:s.coins,energy:Math.round(s.energy),xp:s.xp,inv:s.inv,crafted:s.crafted,reactions:Object.keys(s.reactions),quests:s.quests,prompt:document.getElementById('gPrompt').hidden?null:document.getElementById('gPromptT').textContent,panel:document.getElementById('gPanel').hidden?null:document.getElementById('gPanelT').textContent}; });
const go=(P,Q,y)=>p.evaluate(([P,Q,y])=>{ const a=window.__app; a.player.tween=null; a.player.mode='walk'; a.player.pos.set((Q-294)/9.42,y+1.6,(480-P)/9.42); a.player.vel.set(0,0,0); a.step(3); },[P,Q,y]);
const clickText=async(sel,txt)=>{ const ok=await p.evaluate(([sel,txt])=>{ const e=[...document.querySelectorAll(sel)].find(x=>x.textContent.includes(txt)&&!x.disabled); if(e){ e.click(); return true;} return false; },[sel,txt]); if(!ok) errs.push(`không bấm được "${txt}"`); await W(250); };
await p.evaluate(()=>{ try{localStorage.clear()}catch(e){} });
await W(800); await shot('1_menu'); console.log('menu hiện:',await p.evaluate(()=>!document.getElementById('menu').hidden));
await p.click('#btnGame'); await W(1700); await shot('2_intro'); console.log('sau bấm chơi',await st());
await clickText('#gPanelB button','Vào trường'); await W(300);
await p.evaluate(()=>{ window.__manual=true; window.__noAuto=true; });
// Căn tin
await go(180,270,0); console.log('ở căn tin',await st());
if((await st()).prompt!=='Mua đồ ở căn tin') await p.evaluate(()=>window.__app.game.openCanteen()); else await p.keyboard.press('KeyE'); await W(300); await shot('3_canteen');
await clickText('#gPanelB button','Mua và ăn'); console.log('mua',await st());
await p.keyboard.press('Escape'); await W(200);
// Phòng KHTN tầng 5
await go(190,320,15.9); console.log('ở KHTN',await st());
await p.keyboard.press('KeyE'); await W(300);
await p.evaluate(()=>document.querySelectorAll('#gPanelB input[type=checkbox]').forEach(c=>{ c.click(); }));
await clickText('#gPanelB button','Vào bàn thí nghiệm'); await W(300);
await clickText('.reag','CuSO₄'); await clickText('.reag','NaOH loãng'); await W(1800); await shot('4_lab');
console.log('thí nghiệm',await st(), await p.evaluate(()=>document.querySelector('.res').innerText.slice(0,160)));
await clickText('#gPanelB button','Rửa ống'); await clickText('.reag','Giấm ăn'); await clickText('.reag','Baking soda'); await W(1400); await shot('4b_lab_soda');
await p.keyboard.press('Escape'); await W(200);
// STEM
await go(752,406,15.9); await p.keyboard.press('KeyE'); await W(300);
await p.evaluate(()=>{ window.__app.game.state.coins+=60; });
await clickText('.tab','Mua vật liệu'); for(const m of ['Pin AA','Bóng LED','Bóng LED','Dây điện','Dây điện','Dây điện']) await p.evaluate(m=>{ const it=[...document.querySelectorAll('.item')].find(x=>x.querySelector('b').textContent===m); it.querySelector('button').click(); },m);
await clickText('.tab','Chế tạo'); await W(200); await shot('5_stem');
await p.evaluate(()=>{ const it=[...document.querySelectorAll('.item')].find(x=>x.querySelector('b').textContent==='Mạch điện đơn giản'); it.querySelector('button.gb:not(.ghost)').click(); }); await W(1200);
console.log('chế tạo',(await st()).crafted);
await clickText('.tab','Trưng bày'); await clickText('#gPanelB button','Trưng bày, nhận'); console.log('sau trưng bày',(await st()).coins);
await p.keyboard.press('Escape'); await W(200);
// Lớp học tầng 3
await go(752,168,8.1); console.log('ở lớp',(await st()).prompt); await p.keyboard.press('KeyE'); await W(300); await shot('6_quiz');
for(let k=0;k<3;k++){ await p.evaluate(()=>{ const t=document.querySelector('#gPanelB .big').textContent; const all=Object.values(window.__app.game.QUESTIONS).flat(); const q=all.find(x=>x.q===t); document.querySelectorAll('.choice')[q.a].click(); }); await W(150); if(k===0) await shot('6b_quiz_answer'); await p.evaluate(()=>{ const b=[...document.querySelectorAll('#gPanelB button')].find(x=>/Câu tiếp|Xem kết quả/.test(x.textContent)&&!x.hidden); b&&b.click(); }); await W(150); }
console.log('sau giờ học',(await st()).quests);
await p.keyboard.press('Escape'); await W(200);
// Phòng Tin tầng 5
await go(360,230,15.9); console.log('ở phòng Tin',(await st()).prompt); await p.keyboard.press('KeyE'); await W(300); await shot('7_computer');
await clickText('.app','Gõ phím'); await W(300);
for(let i=0;i<6;i++){ const w=await p.evaluate(()=>document.querySelector('.tw .cur').textContent.trim()); await p.type('#typeIn',w+' ',{delay:5}); }
await shot('7b_typing'); await clickText('#gPanelB button','Về màn hình chính'); await clickText('.app','Rắn'); await W(800); await shot('7c_snake');
await p.keyboard.press('Escape'); await W(200);
// Nhặt rác
const t=await p.evaluate(()=>{ const a=window.__app; return null; });
const tr=await p.evaluate(()=>{ const a=window.__app; const s=a.scene.children.filter(o=>o.isInstancedMesh&&o.count>0&&o.count<=12)[0]; if(!s) return null; const m=new (window.THREE.Matrix4)(); s.getMatrixAt(0,m); const v=new (window.THREE.Vector3)().setFromMatrixPosition(m); return [v.x,v.z]; });
if(tr){ await p.evaluate(([x,z])=>{ const a=window.__app; a.player.tween=null; a.player.pos.set(x+.6,1.6,z); a.player.vel.set(0,0,0); a.step(3); },tr); console.log('gần rác',(await st()).prompt); await p.keyboard.press('KeyE'); await W(200); }
await p.evaluate(()=>{ window.__manual=false; window.__noAuto=true; requestAnimationFrame(()=>{}); window.__app.step(2); }); await shot('8_hud');
console.log('cuối',await st()); console.log('lỗi',errs); await b.close(); srv.close();
