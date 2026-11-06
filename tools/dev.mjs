// Máy chủ dev: http://localhost:5173 — sửa file trong src/ là tự build lại và tải lại trang.
import http from 'http'; import fs from 'fs'; import { buildHtml } from './build.mjs';
const PORT=+process.env.PORT||5173, clients=new Set();
const reload=`<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`;
let html='',err='';
async function rebuild(){ const t=Date.now(); try{ html='<!doctype html>'+await buildHtml({extraScript:reload}); err=''; console.log(`build ${Date.now()-t} ms`); }catch(e){ err=e.message; console.error(e.message); } for(const c of clients) c.write('data: r\n\n'); }
await rebuild();
let timer; fs.watch('src',{recursive:true},()=>{ clearTimeout(timer); timer=setTimeout(rebuild,120); });
http.createServer((q,s)=>{
  if(q.url==='/__reload'){ s.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive'}); s.write('\n'); clients.add(s); q.on('close',()=>clients.delete(s)); return; }
  s.setHeader('Content-Type','text/html;charset=utf-8');
  s.end(err?`<!doctype html><pre style="padding:20px;color:#b00">Lỗi build:\n${err.replace(/</g,'&lt;')}</pre>${reload}`:html);
}).listen(PORT,()=>console.log(`Mở http://localhost:${PORT}`));
