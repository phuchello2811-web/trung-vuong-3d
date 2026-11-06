// Kiểm tra bản GitHub Pages: có cấu hình Firebase (giả) thì hiện nút đăng nhập, không lỗi
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import http from 'http';
const fake=`window.FIREBASE_CONFIG={apiKey:"AIzaSyFakeKeyForLocalTest0000000000000",authDomain:"demo-tv.firebaseapp.com",projectId:"demo-tv",appId:"1:1:web:1"};`;
const srv=http.createServer((q,s)=>{ if(q.url.startsWith('/firebase-config.js')){ s.setHeader('Content-Type','text/javascript'); s.end(fake); return; } s.setHeader('Content-Type','text/html;charset=utf-8'); s.end(fs.readFileSync('docs/index.html','utf8')); }).listen(0);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--use-angle=metal','--enable-gpu']});
for(const [name,vp] of [['pc',{width:1400,height:860}],['phone',{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}]]){
  const p=await b.newPage(); await p.setViewport(vp); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/`,{waitUntil:'load'}); await p.waitForFunction('window.__ready===true',{timeout:180000}); await new Promise(r=>setTimeout(r,1500));
  const r=await p.evaluate(()=>({auth:window.__app.game.auth.enabled,btns:[...document.querySelectorAll('#acct button')].map(b=>b.textContent),scrollW:document.documentElement.scrollWidth,w:innerWidth}));
  await p.screenshot({path:`tools/out/pages_${name}_menu.png`});
  // thử tạo tài khoản với mật khẩu ngắn: phải báo lỗi tiếng Việt
  await p.evaluate(()=>{ document.getElementById('auEmail').value='a@b.vn'; document.getElementById('auPw').value='123'; [...document.querySelectorAll('#acct button')].find(b=>b.textContent==='Tạo tài khoản').click(); });
  await new Promise(r=>setTimeout(r,2500)); r.err=await p.evaluate(()=>document.querySelector('#acct .err').textContent);
  await p.click('#btnGame'); await new Promise(r=>setTimeout(r,1800)); await p.screenshot({path:`tools/out/pages_${name}_game.png`});
  console.log(name,JSON.stringify(r),'lỗi',errs); await p.close();
}
await b.close(); srv.close();
