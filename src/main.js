import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three160/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { X,Z,M,S,Y,SITE,ROOMS,SLABS,locate,levelFromY,pqFromXZ,FLAG } from './plan.js';
import { Batch,frameM } from './builder.js';
import { makeMaterials,textTexture } from './textures.js';
import { buildSchool,DOOR_FIXES } from './school.js';
import { buildInteriors,classNumbers } from './interiors.js';
import { buildSite,buildGardens,buildStatue,buildBikes,buildScooters,HEDGE } from './site.js';
import { buildVegetation,windU } from './vegetation.js';
import { buildCity } from './city.js';
import { createSky,sunENU,sunDirSite } from './sky.js';
import { Player } from './player.js';
import { letterGeometry } from './letters.js';
const LOGO=document.getElementById('fav')?.href||'';   // logo trường: nhúng một lần trong thẻ favicon
import { createGame } from './game/game.js';

const $=id=>document.getElementById(id);
const tick=()=>new Promise(r=>setTimeout(r,0));
const prog=async(t,k)=>{ $('loadT').textContent=t; $('pg').firstElementChild.style.width=k+'%'; await tick(); };
const isTouch=matchMedia('(pointer:coarse)').matches;

// Hình in trong lớp học và phòng hội đồng: bảng phấn ghi ngày hôm nay, áp phích, bảng tin, đồng hồ, tivi, bảng tên phòng, bản đồ
async function classroomPrints(M4,mk){
  const F='"Be Vietnam Pro","Helvetica Neue",Arial,sans-serif', H='"Dancing Script",cursive';
  const cv=(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); return canvasTex(c); };
  const now=new Date(), thu=['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][now.getDay()];
  M4.chalkboard=mk(cv(1440,500,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,w,h); gr.addColorStop(0,'#24493b'); gr.addColorStop(1,'#1d3d31'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    for(let i=0;i<60;i++){ g.fillStyle=`rgba(255,255,255,${.012+Math.random()*.03})`; g.beginPath(); g.ellipse(Math.random()*w,Math.random()*h,40+Math.random()*160,10+Math.random()*40,Math.random()*3,0,6.3); g.fill(); }
    g.fillStyle='rgba(244,242,232,.92)'; g.textBaseline='alphabetic';
    g.font=`600 40px ${H}`; g.textAlign='right'; g.fillText(`${thu}, ngày ${now.getDate()} tháng ${now.getMonth()+1} năm ${now.getFullYear()}`,w-50,70);
    g.textAlign='center'; g.font=`700 64px ${H}`; g.fillText('Toán',w/2,150);
    g.textAlign='left'; g.font=`600 46px ${H}`; g.fillText('Bài tập: Giải phương trình',90,250); g.fillText('a) 2x − 6 = 0          b) 3(x + 1) = 2x + 5',130,330);
    g.fillText('Giải: a) 2x = 6  ⇒  x = 3',130,410); g.strokeStyle='rgba(244,242,232,.6)'; g.lineWidth=3; g.beginPath(); g.moveTo(90,170); g.lineTo(w-90,170); g.stroke(); }),{p:{roughness:.85}});
  M4.poster5=mk(cv(540,760,(g,w,h)=>{ g.fillStyle='#fff8e6'; g.fillRect(0,0,w,h); g.strokeStyle='#c4161c'; g.lineWidth=16; g.strokeRect(8,8,w-16,h-16);
    g.fillStyle='#c4161c'; g.fillRect(8,8,w-16,150); g.fillStyle='#ffde00'; g.textAlign='center'; g.font=`800 44px ${F}`; g.fillText('5 ĐIỀU BÁC HỒ DẠY',w/2,78); g.font=`700 28px ${F}`; g.fillText('THIẾU NIÊN, NHI ĐỒNG',w/2,128);
    const L=['Yêu Tổ quốc, yêu đồng bào.','Học tập tốt, lao động tốt.','Đoàn kết tốt, kỷ luật tốt.','Giữ gìn vệ sinh thật tốt.','Khiêm tốn, thật thà, dũng cảm.'];
    g.textAlign='left'; L.forEach((t,i)=>{ const y=230+i*104; g.fillStyle='#c4161c'; g.beginPath(); g.arc(62,y-12,26,0,6.3); g.fill(); g.fillStyle='#fff'; g.font=`800 30px ${F}`; g.textAlign='center'; g.fillText(String(i+1),62,y-2); g.textAlign='left'; g.fillStyle='#3a1a10'; g.font=`700 31px ${F}`; g.fillText(t,104,y); }); }),{p:{roughness:.7}});
  M4.rules=mk(cv(520,700,(g,w,h)=>{ g.fillStyle='#f4f8ff'; g.fillRect(0,0,w,h); g.fillStyle='#1c3f9c'; g.fillRect(0,0,w,120); g.fillStyle='#fff'; g.textAlign='center'; g.font=`800 42px ${F}`; g.fillText('NỘI QUY LỚP HỌC',w/2,78);
    const L=['Đi học đúng giờ, mặc đồng phục','Lễ phép với thầy cô, hoà nhã với bạn','Giữ trật tự, phát biểu phải xin phép','Học bài, làm bài đầy đủ','Giữ gìn vệ sinh, bảo vệ của công','Không dùng điện thoại trong giờ học'];
    g.textAlign='left'; g.fillStyle='#14234a'; g.font=`600 27px ${F}`; L.forEach((t,i)=>g.fillText(`${i+1}. ${t}`,36,190+i*84)); }),{p:{roughness:.7}});
  M4.notice=mk(cv(880,460,(g,w,h)=>{ g.fillStyle='#b98a57'; g.fillRect(0,0,w,h); for(let i=0;i<2400;i++){ g.fillStyle=`rgba(${80+Math.random()*60},${50+Math.random()*30},20,.25)`; g.fillRect(Math.random()*w,Math.random()*h,2,2); }
    g.fillStyle='#c4161c'; g.fillRect(250,18,380,64); g.fillStyle='#fff'; g.textAlign='center'; g.font=`800 38px ${F}`; g.fillText('BẢNG TIN LỚP',w/2,63);
    const P=[['#fff7c2','Thời khoá biểu'],['#d9f1ff','Kế hoạch tuần'],['#ffe1e1','Gương người tốt'],['#e4ffd9','Góc học tập'],['#ffffff','Sơ đồ chỗ ngồi']];
    P.forEach(([c,t],i)=>{ const x=40+i*166,y=110+(i%2)*30; g.save(); g.translate(x+70,y+130); g.rotate((i%2?.03:-.025)); g.fillStyle=c; g.fillRect(-70,-130,140,250); g.fillStyle='#222'; g.font=`700 18px ${F}`; g.textAlign='center'; g.fillText(t,0,-98); g.fillStyle='rgba(40,40,40,.45)'; for(let k=0;k<9;k++) g.fillRect(-56,-76+k*20,112-(k%3)*18,4); g.fillStyle='#d22'; g.beginPath(); g.arc(0,-122,7,0,6.3); g.fill(); g.restore(); }); }),{p:{roughness:.9}});
  M4.clockFace=mk(cv(256,256,(g,w,h)=>{ g.fillStyle='#fff'; g.beginPath(); g.arc(128,128,122,0,6.3); g.fill(); g.lineWidth=10; g.strokeStyle='#1d1d1d'; g.stroke(); g.fillStyle='#1d1d1d'; g.textAlign='center'; g.textBaseline='middle'; g.font=`700 30px ${F}`;
    for(let i=1;i<=12;i++){ const a=i/12*6.283-1.5708; g.fillText(String(i),128+Math.cos(a)*92,128+Math.sin(a)*92); }
    const hh=now.getHours()%12+now.getMinutes()/60, mm=now.getMinutes(); g.lineCap='round'; for(const [v,L,W] of [[hh/12,58,8],[mm/60,86,5]]){ const a=v*6.283-1.5708; g.lineWidth=W; g.beginPath(); g.moveTo(128,128); g.lineTo(128+Math.cos(a)*L,128+Math.sin(a)*L); g.stroke(); } }),{tr:true});
  M4.clockDigital=mk(cv(320,160,(g,w,h)=>{ g.fillStyle='#08090b'; g.fillRect(0,0,w,h); g.fillStyle='#ff3b30'; g.textAlign='center'; g.textBaseline='middle'; g.font=`700 76px "IBM Plex Mono",monospace`; g.fillText(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,w/2,66); g.fillStyle='#3ddc84'; g.font=`500 26px "IBM Plex Mono",monospace`; g.fillText(`${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`,w/2,130); }),{em:0xffffff,ei:.6});
  let logoIm=null; try{ logoIm=await loadImg(LOGO); }catch(e){}
  M4.tvScreen=mk(cv(800,450,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,w,h); gr.addColorStop(0,'#123a8a'); gr.addColorStop(1,'#0b1e46'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    if(logoIm){ const lh=230,lw=lh*logoIm.width/logoIm.height; g.drawImage(logoIm,w/2-lw/2,40,lw,lh); }
    g.fillStyle='#f4c63a'; g.textAlign='center'; g.font=`800 44px ${F}`; g.fillText('TRƯỜNG THCS TRƯNG VƯƠNG',w/2,330); g.fillStyle='#e8eefc'; g.font=`500 28px ${F}`; g.fillText('Chúc các em một ngày học tập vui vẻ',w/2,385); }),{em:0xffffff,ei:.55});
  M4.vnmap=mk(cv(600,800,(g,w,h)=>{ g.fillStyle='#bfe3f5'; g.fillRect(0,0,w,h); g.strokeStyle='#8b5a2b'; g.lineWidth=14; g.strokeRect(7,7,w-14,h-14);
    const lon0=101.2,lon1=115.5,lat0=7.4,lat1=24.2, px=l=>30+(l-lon0)/(lon1-lon0)*(w-60), py=l=>110+(lat1-l)/(lat1-lat0)*(h-140);
    const VN=[[102.1,22.4],[103,22.6],[104,22.8],[105.3,23.3],[106.5,22.9],[107.4,22.1],[108,21.5],[106.7,20.7],[106,19.9],[105.7,19],[106.2,18.2],[107,17.1],[108.2,16.1],[108.8,15.3],[109.2,13.8],[109.4,12.4],[109.2,11.5],[108,10.9],[106.8,10.4],[106.6,9.6],[105.2,8.6],[104.8,9],[104.5,10.4],[105.8,11.5],[106.9,12.1],[107.6,12.7],[107.5,14.7],[106.9,15.5],[106.6,16.3],[105.6,17.5],[104.8,18.3],[104.2,19.2],[104.1,19.8],[104.9,20.2],[103.9,20.6],[103,21],[102.1,22.4]];
    g.fillStyle='#eed9a6'; g.beginPath(); VN.forEach(([a,b],i)=>g[i?'lineTo':'moveTo'](px(a),py(b))); g.closePath(); g.fill(); g.strokeStyle='#c4161c'; g.lineWidth=2.5; g.stroke();
    g.fillStyle='#c4161c'; for(const [a,b] of [[111.6,16.5],[112.1,16.3],[112.4,16.6],[111.8,16.8]]){ g.beginPath(); g.arc(px(a),py(b),4,0,6.3); g.fill(); } for(const [a,b] of [[113.8,10.4],[114.3,9.8],[114.8,10.9],[115,8.9],[113.4,9.2]]){ g.beginPath(); g.arc(px(a),py(b),4,0,6.3); g.fill(); }
    g.fillStyle='#14234a'; g.font=`700 20px ${F}`; g.textAlign='center'; g.fillText('QĐ. Hoàng Sa',px(112),py(17.4)); g.fillText('QĐ. Trường Sa',px(114.2),py(11.6)); g.fillText('BIỂN ĐÔNG',px(111.6),py(13.6));
    g.beginPath(); g.arc(px(108.22),py(16.07),6,0,6.3); g.fill(); g.font=`600 18px ${F}`; g.textAlign='left'; g.fillText('Đà Nẵng',px(108.4),py(16.07)+6);
    g.fillStyle='#c4161c'; g.fillRect(14,14,w-28,74); g.fillStyle='#fff'; g.font=`800 30px ${F}`; g.textAlign='center'; g.fillText('BẢN ĐỒ VIỆT NAM',w/2,62); }),{p:{roughness:.6}});
  const nums=[...classNumbers().values()];
  for(const n of nums) M4['plate_'+n]=mk(cv(400,192,(g,w,h)=>{ g.fillStyle='#1c3f9c'; g.fillRect(0,0,w,h); g.strokeStyle='#f4c63a'; g.lineWidth=8; g.strokeRect(6,6,w-12,h-12); g.fillStyle='#fff'; g.textAlign='center'; g.font=`700 34px ${F}`; g.fillText('PHÒNG HỌC',w/2,66); g.font=`800 74px ${F}`; g.fillStyle='#f4c63a'; g.fillText(n,w/2,150); }));
}
function loadImg(src){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=src; }); }
function canvasTex(c){ const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }
function vnFlag(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.fillStyle='#da251d'; g.fillRect(0,0,w,h); g.fillStyle='#ffff00'; g.beginPath(); for(let i=0;i<5;i++){ const a=-Math.PI/2+i*4*Math.PI/5,r=h*.31; g[i?'lineTo':'moveTo'](w/2+Math.cos(a)*r,h/2+Math.sin(a)*r); } g.closePath(); g.fill(); return c; }
async function signMaterials(M4){
  const mk=(tex,o={})=>{ const m=new THREE.MeshStandardMaterial({map:tex,roughness:.5,transparent:!!o.tr,alphaTest:o.tr?.4:0,side:THREE.DoubleSide,emissive:o.em||0,emissiveMap:o.em?tex:null,emissiveIntensity:o.ei||0,...(o.p||{})}); m.userData={noCast:true,noAO:true}; return m; };
  M4.mainSign=mk(textTexture([{t:'TRƯỜNG THCS TRƯNG VƯƠNG',size:150,y:128,color:'#f2b90f',weight:700,stroke:'#14306f',sw:9}],{w:2048,h:256}),{tr:true,em:0xffffff,ei:.12});
  { // Bảng tên ở cổng, có logo thật của trường
    const c=document.createElement('canvas'); c.width=1024; c.height=360; const g=c.getContext('2d'); g.fillStyle='#1c3f9c'; g.fillRect(0,0,1024,360);
    try{ const im=await loadImg(LOGO); const h=290,w=h*im.width/im.height; g.drawImage(im,34,35,w,h); }catch(e){}
    g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; const F='"Be Vietnam Pro","Helvetica Neue",Arial,sans-serif';
    const x0=300,x1=996,cx=(x0+x1)/2, fit=(t,w,size,y,col)=>{ let s2=size; g.font=`700 ${s2}px ${F}`; while(g.measureText(t).width>x1-x0-24&&s2>12){ s2-=2; g.font=`700 ${s2}px ${F}`; } g.fillStyle=col; g.fillText(t,cx,y); };
    fit('TRƯỜNG TRUNG HỌC CƠ SỞ',0,54,92,'#ffffff'); fit('TRƯNG VƯƠNG',0,118,200,'#ffffff'); fit('88 Yên Bái, Hải Châu, Đà Nẵng',0,34,292,'#e4e9f4');
    M4.gateSign=mk(canvasTex(c));
  }
  ['#d7261e','#f5c518','#1f5fd1','#2e9e48','#f07c1e','#8a3fc0'].forEach((c,i)=>{ const m=new THREE.MeshStandardMaterial({color:c,roughness:.8,side:THREE.DoubleSide}); m.userData={noAO:true}; M4['flagC'+i]=m; });
  { // Chữ thư pháp khắc trên bia "Tôn Sư Trọng Đạo"
    const c=document.createElement('canvas'); c.width=256; c.height=720; const g=c.getContext('2d'); g.fillStyle='#3a3936'; g.textAlign='center'; g.textBaseline='middle';
    g.font='700 118px "Dancing Script", cursive'; ['Tôn','Sư','Trọng','Đạo'].forEach((t,i)=>g.fillText(t,128,100+i*170));
    M4.steleText=mk(canvasTex(c),{tr:true,p:{roughness:.7}}); M4.steleText.userData={noAO:true,noCast:true};
  }
  M4.slogan=mk(textTexture([{t:'DẠY TỐT – HỌC TỐT',size:88,y:64,color:'#c0241f'}],{w:1024,h:128,bg:'#f4f2ea'}));
  M4.motto=mk(textTexture([{t:'DÂN CHỦ – KỶ CƯƠNG – TÌNH THƯƠNG – TRÁCH NHIỆM',size:66,y:112,color:'#f4c63a',weight:700}],{w:2048,h:200,bg:'#b4201c'}),{em:0xffffff,ei:.1});
  M4.canteen=mk(textTexture([{t:'CĂN TIN',size:116,y:96,color:'#ffffff',weight:700},{t:'TRƯỜNG THCS TRƯNG VƯƠNG',size:42,y:176,color:'#d8f0e4',weight:600}],{w:1024,h:256,bg:'#0e7a4e'}));
  M4.vnmap=mk(textTexture([{t:'BẢN ĐỒ',size:46,y:200,color:'#1c3f9c',weight:600},{t:'VIỆT NAM',size:46,y:252,color:'#1c3f9c',weight:600}],{w:300,h:460,bg:'#eaf2fb'}));
  M4.engSign=mk(textTexture([{t:'TRUNG VUONG SECONDARY SCHOOL',size:82,y:64,color:'#556070',weight:600}],{w:2048,h:128}),{tr:true});
  const nums={2:'#c98e20',3:'#117e72',4:'#1e4c8f',5:'#6b3f7d'};
  for(const k of Object.keys(nums)) M4['num'+k]=mk(textTexture([{t:k,size:300,y:190,color:'#fff'}],{w:512,h:384,bg:nums[k]}));
  // Gáy sách
  const c=document.createElement('canvas'); c.width=512;c.height=128; const g=c.getContext('2d'); g.fillStyle='#2a221b'; g.fillRect(0,0,512,128); const hues=['#8a3b2c','#2c5d8a','#d9c9a0','#3a6b4a','#7a5a2b','#c7b48a','#44546a','#b04a3a','#e4dcc5','#26415f'];
  let x=0; while(x<512){ const w=4+Math.random()*9; g.fillStyle=hues[Math.floor(Math.random()*hues.length)]; g.fillRect(x,6+Math.random()*22,w,128); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+w-1,0,1,128); x+=w; }
  const bt=new THREE.CanvasTexture(c); bt.colorSpace=THREE.SRGBColorSpace; bt.wrapS=bt.wrapT=THREE.RepeatWrapping; bt.repeat.set(.8,3.2); M4.books=new THREE.MeshStandardMaterial({map:bt,roughness:.85});
  await classroomPrints(M4,mk);
  M4.flag=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.8}); M4.flag.userData={noAO:true,noCast:false};
}

function buildSigns(b){
  // Chữ nổi vàng kim gắn trên dải tường trắng phía trên mái che xanh (ảnh lối vào chính)
  b.boxPQ('white',520,632,170.2,171.2,3.7,4.86);
  { const {geo}=letterGeometry('main',.6,.05);
    const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(0,0,-1),new THREE.Vector3(0,1,0),new THREE.Vector3(1,0,0)).setPosition(X(171.22),3.92,Z(576));
    b.add('gold',geo,m); geo.dispose(); }
  // Cờ đỏ sao vàng cắm trên lan can tầng 2 (ảnh sân)
  [532,550,568,586,604,622].forEach((p,fi)=>{ const x=X(169.6),z=Z(p),y=Y[2]+.62,d=new THREE.Vector3(.45,.89,0).normalize(),L=1.9,n=new THREE.Vector3(.89,-.45,0);
    const top=[x+d.x*L,y+d.y*L,z]; b.rod('flagPole',[x,y,z],top,.014,5);
    const A=new THREE.Vector3(...top).addScaledVector(d,-.04),B=A.clone().addScaledVector(d,-.62),C=B.clone().addScaledVector(n,.9),D=A.clone().addScaledVector(n,.9);
    b.poly('flagC'+fi,[A.toArray(),D.toArray(),C.toArray(),B.toArray()],[0,0,1],[[0,1],[1,1],[1,0],[0,0]]); });
  // Số tầng màu lớn trên vách cầu thang đầu hồi khối Bắc, nhìn từ sân như ảnh
  for(const L of [2,3,4,5]){ const z=Z(714.5)+.01,a=X(484),c=X(510); b.poly('num'+L,[[a,Y[L]+.75,z],[c,Y[L]+.75,z],[c,Y[L]+3.2,z],[a,Y[L]+3.2,z]],[0,0,1],[[0,0],[1,0],[1,1],[0,1]]); }
  // Chữ tiếng Anh trên đỉnh khối xiên
  const f=frameM(363,433,-48,25,23,46),W=Math.hypot(48,25)/S,Ln=Math.hypot(23,46)/S; const s=b.m; b.setFrame(f);
  const zz=Ln+.5; b.box('plaster',-1.25,W+1.25,Y[6]-.65,Y[6]+.3,Ln+.1,zz-.01,{});
  { const {geo}=letterGeometry('eng',.36,.04); const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(-1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)).setPosition(W/2,Y[6]-.36,zz); b.add('inox',geo,m); geo.dispose(); }
  b.setFrame(s);
}

function runWalk(player,path){
  // Mô phỏng đi theo các điểm [P,Q]; trả về vị trí cuối mỗi chặng
  const out=[]; player.mode='walk'; player.tween=null;
  for(const [P,Q] of path){ const tx=X(Q),tz=Z(P); let n=0; for(;n<1500;n++){ const dx=tx-player.pos.x,dz=tz-player.pos.z; if(Math.hypot(dx,dz)<.35) break; player.yaw=Math.atan2(-dx,-dz); player.keys={KeyW:true}; player.update(1/60); } player.keys={}; out.push({P,Q,n,reached:n<1500,y:+player.pos.y.toFixed(2),x:+player.pos.x.toFixed(1),z:+player.pos.z.toFixed(1)}); }
  return out;
}

async function main(){
  const canvas=$('c');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',stencil:false});
  renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.7;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate=false;
  const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0xc5d6e4,.00105);
  const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.12,3000);
  const aniso=Math.min(renderer.capabilities.getMaxAnisotropy(),16);

  await prog('Vẽ vật liệu theo màu ảnh công trình',8);
  try{ await Promise.all([document.fonts.load('700 40px "Be Vietnam Pro"',"Trường"),document.fonts.load('700 40px "Dancing Script"',"Tôn Sư Trọng Đạo")]); }catch(e){}
  const MATS=makeMaterials(aniso); await signMaterials(MATS);
  await prog('Dựng khung sàn, tường và mái theo bản vẽ',24);
  const b=new Batch();
  buildSite(b); buildSchool(b); buildSigns(b);
  await prog('Bày bàn ghế, bảng và quạt trần',42);
  buildInteriors(b);
  await prog('Đặt tượng, sân vườn và bãi xe',52);
  const flagPos=buildStatue(b); const shrubs=buildGardens(b); buildBikes(b); buildScooters(b);
  await prog('Dựng phố xung quanh từ OpenStreetMap',62);
  const cityInfo=buildCity(b);
  await prog('Trồng cây và dây leo',72);
  buildVegetation(b,scene,shrubs.concat(HEDGE),aniso);
  await prog('Tính va chạm cho lối đi',82);
  const colArr=new Float32Array(b.col); b.col=null;
  const player=new Player(camera,colArr);
  const meshes=b.build(MATS,scene);
  // Cờ tung bay
  const flagG=new THREE.PlaneGeometry(2.4,1.6,24,8); flagG.translate(1.2,0,0);
  const fc=document.createElement('canvas'); fc.width=480; fc.height=320; const fg=fc.getContext('2d'); fg.fillStyle='#da251d'; fg.fillRect(0,0,480,320); fg.fillStyle='#ffff00'; fg.beginPath(); for(let i=0;i<5;i++){ const a=-Math.PI/2+i*4*Math.PI/5,r=100; fg[i?'lineTo':'moveTo'](240+Math.cos(a)*r,160+Math.sin(a)*r); } fg.closePath(); fg.fill();
  const ft=new THREE.CanvasTexture(fc); ft.colorSpace=THREE.SRGBColorSpace; MATS.flag.map=ft;
  const fu={uTime:windU.uTime};
  MATS.flag.onBeforeCompile=sh=>{ sh.uniforms.uTime=fu.uTime; sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat fw=position.x/2.4; transformed.z+=sin(position.x*3.2-uTime*5.)*.13*fw+sin(position.x*6.-uTime*7.+position.y*2.)*.05*fw; transformed.y+=-fw*fw*.14;'); };
  const flag=new THREE.Mesh(flagG,MATS.flag); flag.position.set(flagPos.fx,15,flagPos.fz); flag.castShadow=true; flag.userData.noAO=true; scene.add(flag);
  await prog('Tính bầu trời theo vị trí mặt trời ở Đà Nẵng',90);

  const sky=createSky(renderer); scene.add(sky.mesh);
  const sun=new THREE.DirectionalLight(0xffffff,3); sun.castShadow=true; scene.add(sun); scene.add(sun.target);
  const sc=sun.shadow.camera; sc.left=-82; sc.right=82; sc.top=82; sc.bottom=-82; sc.near=10; sc.far=520; sun.shadow.bias=-.00028; sun.shadow.normalBias=.035; sun.shadow.mapSize.set(4096,4096);
  const hemi=new THREE.HemisphereLight(0xcfe0ff,0x7d7568,.25); scene.add(hemi);

  // Hậu kỳ
  let composer,gtao,bloom,quality=isTouch?0:1;
  const hdr=(w,h,samples)=>new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples});
  function setupComposer(){
    const pr=[Math.min(devicePixelRatio,1),Math.min(devicePixelRatio,1.25),Math.min(devicePixelRatio,1.6)][quality],W=innerWidth,H=innerHeight;
    renderer.setPixelRatio(pr); renderer.setSize(W,H,false);
    if(composer){ composer.dispose(); composer=null; }
    if(gtao){ gtao.dispose(); gtao=null; }
    composer=new EffectComposer(renderer,hdr(W*pr,H*pr,quality>0?4:0)); composer.setPixelRatio(1); composer.setSize(W*pr,H*pr);
    composer.addPass(new RenderPass(scene,camera));
    if(quality>0){
      gtao=new GTAOPass(scene,camera,W*pr,H*pr);
      gtao.updateGtaoMaterial({radius:.85,distanceExponent:1.4,thickness:1.2,scale:1.05,samples:quality>1?16:10,distanceFallOff:1,screenSpaceRadius:false});
      gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,radiusExponent:1,rings:2.5,samples:quality>1?20:10});
      gtao.blendIntensity=.9;
      const vis=new Map();
      gtao.overrideVisibility=function(){ scene.traverse(o=>{ vis.set(o,o.visible); if(o.isPoints||o.isLine||o.userData.noAO) o.visible=false; }); };
      gtao.restoreVisibility=function(){ scene.traverse(o=>{ if(vis.has(o)) o.visible=vis.get(o); }); vis.clear(); };
      const baseRO=gtao.renderOverride.bind(gtao);
      gtao.renderOverride=function(rd,om,rt,cc,ca){ baseRO(rd,om,rt,cc,ca);
        if(om!==gtao.normalMaterial) return; const ac=rd.autoClear,ol=camera.layers.mask,bg=scene.background; rd.autoClear=false; rd.setRenderTarget(rt); camera.layers.set(1);
        const sw=[]; scene.traverse(o=>{ if(o.userData.aoMat){ sw.push([o,o.material,o.visible]); o.material=o.userData.aoMat; o.visible=true; } }); const f=scene.fog; scene.fog=null; rd.render(scene,camera); scene.fog=f; for(const [o,m,v] of sw){ o.material=m; o.visible=v; } camera.layers.mask=ol; rd.autoClear=ac; rd.setRenderTarget(null); };
      composer.addPass(gtao);
    }
    bloom=new UnrealBloomPass(new THREE.Vector2(W*pr/2,H*pr/2),.14,.55,1.0); composer.addPass(bloom);
    composer.addPass(new OutputPass());
    sun.shadow.mapSize.setScalar([2048,3072,4096][quality]); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; }
    renderer.shadowMap.needsUpdate=true; camera.aspect=W/H; camera.updateProjectionMatrix();
  }
  setupComposer();

  // Thời gian trong ngày
  const now=new Date(),doy=Math.floor((now-new Date(now.getFullYear(),0,0))/864e5);
  let hour=9,envT=0,sunChanged=true;
  const fogDay=new THREE.Color(0xc6d7e6),fogDusk=new THREE.Color(0xd0a483),fogNight=new THREE.Color(0x0e1524);
  function applySun(bake=true){
    const s=sunENU(doy,hour),d=sunDirSite(s); sky.uni.uSun.value.copy(d);
    const el=d.y,day=THREE.MathUtils.smoothstep(el,-.05,.18),low=1-THREE.MathUtils.smoothstep(el,.04,.34);
    const dir=el>-.02?d:new THREE.Vector3(.35,.8,.4).normalize();
    sun.position.copy(sun.target.position).addScaledVector(dir,280);
    sun.color.setRGB(1,1-.42*low,1-.72*low);
    sun.intensity=el>-.02?3.7*THREE.MathUtils.smoothstep(el,-.02,.16):.5;
    if(el<=-.02) sun.color.setRGB(.55,.65,1);
    hemi.intensity=.05+.4*day+(1-day)*.42; hemi.color.setRGB(.62+.31*day,.7+.25*day,1); hemi.groundColor.setRGB(.42+.4*day,.42+.38*day,.46+.31*day);
    MATS.glass.emissive.setRGB(1,.82,.55); MATS.glass.emissiveIntensity=(1-day)*.85;
    renderer.toneMappingExposure=.7+(1-day)*.55;
    const f=fogNight.clone().lerp(fogDay,day).lerp(fogDusk,low*day*.75); scene.fog.color.copy(f); scene.fog.density=.00095+.0005*(1-day);
    MATS.lamp.emissiveIntensity=day>.4?.5:THREE.MathUtils.lerp(4.2,.5,day/.4);
    MATS.streetLamp.emissiveIntensity=day>.3?.1:THREE.MathUtils.lerp(6,.1,day/.3);
    windU.uGlow.value=.02+.09*day;
    renderer.shadowMap.needsUpdate=true;
    if(bake){ const env=sky.bake(); scene.environment=env; for(const k in MATS){ MATS[k].envMapIntensity=(MATS[k].userData.envI||(k==='floor'?1.25:k==='glass'?1.15:k==='towerGlass'||k==='cityGlass'?1.6:1)); } }
    const h=Math.floor(hour),mi=Math.round((hour-h)*60)%60; $('clock').textContent=`${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;
    $('sunInfo').textContent=s.el>0?`Nắng cao ${s.el.toFixed(0)}°, hướng ${s.az.toFixed(0)}°`:'Mặt trời đã lặn';
  }
  applySun();

  if(matchMedia('(prefers-reduced-motion: reduce)').matches) player.orbit.auto=false;
  // Điểm nhìn: đều kiểm tra được bằng sơ đồ tầng
  const VIEWS=[
    {n:'Toàn cảnh',orbit:true},
    {n:'Cổng đường Yên Bái',p:[29.3,1.55,-6.6],y:Math.PI/2,x:.03,m:'walk'},
    {n:'Sân trường, tượng Hai Bà',p:[X(322),1.62,Z(590)],y:1.9,x:.12,m:'walk'},
    {n:'Dưới cầu xanh',p:[X(486),1.62,Z(452)],y:0,x:.34,m:'walk'},
    {n:'Trên cầu xanh',p:[X(474),Y[3]+1.6,Z(678)],y:Math.PI,x:-.04,m:'walk'},
    {n:'Sân đa năng',p:[X(290),1.62,Z(255)],y:-.05,x:.08,m:'walk'},
    {n:'Thư viện',p:[X(80),1.62,Z(395)],y:-.12,x:-.03,m:'walk'},
    {n:'Hành lang tầng 3',p:[X(140),Y[3]+1.6,Z(440)],y:0,x:0,m:'walk'},
    {n:'Phòng học tầng 3',p:[X(222),Y[3]+1.6,Z(740.5)],y:-Math.PI/2,x:-.06,m:'walk'},
    {n:'Giếng trời tầng 4',p:[X(318),Y[4]+1.6,Z(238)],y:-.5,x:.12,m:'walk'},
    {n:'Trên mái',p:[X(300),Y[6]+1.6,Z(705)],y:Math.PI-.15,x:-.05,m:'walk'},
  ];
  const vbox=$('views');
  VIEWS.forEach((v,i)=>{ const bt=document.createElement('button'); bt.textContent=v.n; bt.onclick=()=>goView(i); if(!i) bt.className='on'; vbox.appendChild(bt); });
  const setViewOn=i=>[...vbox.children].forEach((c,k)=>c.classList.toggle('on',k===i));
  function setMode(m){ player.setMode(m); [...$('modes').children].forEach(c=>c.classList.toggle('on',c.dataset.m===m)); showHint(); }
  function goView(i){ const v=VIEWS[i]; setViewOn(i);
    if(v.orbit){ const o=player.orbit; const pos=[o.t.x+86*Math.sin(1.12)*Math.sin(1.85),o.t.y+86*Math.cos(1.12),o.t.z+86*Math.sin(1.12)*Math.cos(1.85)]; const q=new THREE.Matrix4().lookAt(new THREE.Vector3(...pos),o.t,new THREE.Vector3(0,1,0)); const e=new THREE.Euler().setFromRotationMatrix(q,'YXZ'); player.flyTo(pos,e.y,e.x,'orbit',1.4); [...$('modes').children].forEach(c=>c.classList.toggle('on',c.dataset.m==='orbit')); showHint('orbit'); o.auto=!matchMedia('(prefers-reduced-motion: reduce)').matches; return; }
    player.flyTo(v.p,v.y,v.x,v.m,1.4); [...$('modes').children].forEach(c=>c.classList.toggle('on',c.dataset.m===v.m)); showHint(v.m); }
  $('modes').addEventListener('click',e=>{ const m=e.target.dataset.m; if(m) { setMode(m); setViewOn(-1); } });
  function showHint(mo){ const m=mo||player.mode,h=$('hint'); if(isTouch){ h.hidden=true; $('stick').hidden=m==='orbit'; return; }
    h.textContent=m==='orbit'?'Kéo chuột để xoay, lăn để phóng to':m==='walk'?'Bấm vào cảnh để điều khiển bằng chuột. W A S D đi, Shift chạy, Esc nhả chuột':'Bấm vào cảnh rồi dùng W A S D. E lên, Q xuống'; h.hidden=false; clearTimeout(showHint.t); showHint.t=setTimeout(()=>h.hidden=true,7000); $('cross').hidden=m==='orbit'; }
  showHint();

  // Điều khiển chuột và bàn phím
  let dragging=false,lx=0,ly=0,locked=false; const pid=new Set();
  canvas.addEventListener('pointerdown',e=>{ if(window.__panelOpen) return; canvas.focus({preventScroll:true}); if(measuring&&e.button===0&&!e.defaultPrevented){ measureClick(e); return; }
    if(player.mode!=='orbit'&&!isTouch&&e.pointerType==='mouse'&&!locked){ try{ const r=canvas.requestPointerLock&&canvas.requestPointerLock(); if(r&&r.catch) r.catch(()=>{}); }catch(err){} }
    dragging=true; lx=e.clientX; ly=e.clientY; try{ canvas.setPointerCapture(e.pointerId);}catch(err){} player.orbit.auto=false; });
  canvas.addEventListener('pointerup',e=>{ dragging=false; });
  canvas.addEventListener('pointercancel',()=>dragging=false);
  document.addEventListener('pointerlockchange',()=>{ locked=document.pointerLockElement===canvas; });
  addEventListener('pointermove',e=>{ if(locked){ player.look(e.movementX,e.movementY); return; } if(dragging){ player.look(e.clientX-lx,e.clientY-ly); lx=e.clientX; ly=e.clientY; } });
  canvas.addEventListener('wheel',e=>{ e.preventDefault(); player.zoom(e.deltaY); },{passive:false});
  addEventListener('keydown',e=>{ if(window.__panelOpen) return; if(e.target.tagName==='INPUT'&&e.target.type!=='range') return; if(document.body.classList.contains('mode-game')&&['KeyM','KeyV','KeyU'].includes(e.code)) return; if(e.code==='KeyM'){ toggleMeasure(); return; } if(e.code==='KeyU'){ document.body.classList.toggle('nohud'); return; } if(e.code==='KeyV'){ setMode(player.mode==='walk'?'fly':player.mode==='fly'?'orbit':'walk'); setViewOn(-1); return; }
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&e.target.tagName!=='INPUT'&&e.target.tagName!=='BUTTON') e.preventDefault(); if(e.target.type==='range'&&e.code.startsWith('Arrow')) return; player.keys[e.code]=true; });
  addEventListener('keyup',e=>{ player.keys[e.code]=false; });
  addEventListener('blur',()=>{ player.keys={}; dragging=false; });
  // Cần điều khiển trên điện thoại
  const st=$('stick'),kn=st.firstElementChild;
  st.addEventListener('pointerdown',e=>{ st.setPointerCapture(e.pointerId); st.dataset.a=1; });
  st.addEventListener('pointermove',e=>{ if(!st.dataset.a) return; const r=st.getBoundingClientRect(); let dx=(e.clientX-r.left-55)/45,dy=(e.clientY-r.top-55)/45; const l=Math.hypot(dx,dy); if(l>1){dx/=l;dy/=l;} player.touch.x=dx; player.touch.y=-dy; kn.style.transform=`translate(${dx*34}px,${dy*34}px)`; });
  const end=()=>{ delete st.dataset.a; player.touch.x=player.touch.y=0; kn.style.transform=''; }; st.addEventListener('pointerup',end); st.addEventListener('pointercancel',end);

  // Giờ
  let bakeTimer=0; $('time').addEventListener('input',e=>{ hour=+e.target.value; applySun(false); clearTimeout(bakeTimer); bakeTimer=setTimeout(()=>applySun(true),90); });
  // Chất lượng
  function setQ(q,toastIt){ quality=q; setupComposer(); [...$('qual').children].forEach(c=>c.classList.toggle('on',+c.dataset.q===q)); if(toastIt) toast(toastIt); }
  $('qual').addEventListener('click',e=>{ if(e.target.dataset.q!==undefined){ userQ=true; setQ(+e.target.dataset.q); } });
  [...$('qual').children].forEach(c=>c.classList.toggle('on',+c.dataset.q===quality));
  let userQ=false;
  // Thông số
  const info=$('info'),ib=$('infoBtn'); ib.onclick=()=>{ info.hidden=false; ib.hidden=true; ib.setAttribute('aria-expanded','true'); };
  const close=document.createElement('button'); close.className='ib'; close.style.cssText='float:right;margin:-4px -4px 0 8px'; close.textContent='Đóng'; close.onclick=()=>{ info.hidden=true; ib.hidden=false; ib.setAttribute('aria-expanded','false'); }; info.prepend(close);
  function toast(t){ const el=$('toast'); el.textContent=t; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,3200); }

  // Đo khoảng cách
  let measuring=false,mPts=[],mLine=null;
  const mBtn=$('measure'); mBtn.onclick=toggleMeasure;
  function toggleMeasure(){ measuring=!measuring; mBtn.classList.toggle('on',measuring); mPts=[]; if(mLine){ scene.remove(mLine); mLine=null; } $('mlabel').hidden=true; if(measuring){ if(document.pointerLockElement) document.exitPointerLock(); toast('Bấm hai điểm trên mô hình để đo khoảng cách'); } }
  function measureClick(e){ const r=canvas.getBoundingClientRect(),v=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),rc=new THREE.Raycaster(); rc.setFromCamera(v,camera);
    const h=player.bvh.raycastFirst(rc.ray,THREE.DoubleSide); if(!h){ toast('Không trúng bề mặt nào, thử điểm khác'); return; }
    if(mPts.length===2){ mPts=[]; if(mLine){ scene.remove(mLine); mLine=null; } }
    mPts.push(h.point.clone());
    if(mPts.length===2){ const g=new THREE.BufferGeometry().setFromPoints(mPts); mLine=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xf4c63a,depthTest:false,toneMapped:false})); mLine.renderOrder=9; scene.add(mLine); }
  }

  // Sơ đồ tầng
  const mapC=$('map'),mg=mapC.getContext('2d'); let mapLevel=1; const MW=mapC.width,MH=mapC.height,Qmin=30,Qmax=556,Pmin=120,Pmax=840,kk=Math.min(MW/(Qmax-Qmin),MH/(Pmax-Pmin));
  const mx=q=>(q-Qmin)*kk+(MW-(Qmax-Qmin)*kk)/2,my=p=>(Pmax-p)*kk+(MH-(Pmax-Pmin)*kk)/2;
  const off=document.createElement('canvas'); off.width=MW; off.height=MH;
  function drawMapBase(L){ const g=off.getContext('2d'); g.clearRect(0,0,MW,MH); g.lineWidth=1.5; g.strokeStyle='rgba(238,241,245,.55)'; g.beginPath(); SITE.forEach((p,i)=>g[i?'lineTo':'moveTo'](mx(p[1]),my(p[0]))); g.closePath(); g.stroke(); g.fillStyle='rgba(238,241,245,.05)'; g.fill();
    if(L>1&&SLABS[L]){ g.fillStyle='rgba(238,241,245,.2)'; for(const r of SLABS[L]) g.fillRect(mx(r[2]),my(r[1]),(r[3]-r[2])*kk,(r[1]-r[0])*kk); }
    else { g.fillStyle='rgba(120,170,90,.35)'; g.fillRect(mx(155),my(694),(425-155)*kk,(694-394)*kk); g.fillStyle='rgba(238,241,245,.2)'; g.fillRect(mx(127),my(695),(153-127)*kk,(695-303)*kk); g.fillRect(mx(205),my(394),(505-205)*kk,(394-142)*kk); g.fillRect(mx(155),my(800),(370-155)*kk,(800-695)*kk); }
    for(const r of ROOMS) if(r.L===L){ g.fillStyle=r.kind==='class'?'rgba(244,198,58,.5)':r.kind==='wc'?'rgba(120,160,220,.45)':'rgba(192,125,80,.62)'; g.fillRect(mx(r.Q0)+.8,my(r.P1)+.8,(r.Q1-r.Q0)*kk-1.6,(r.P1-r.P0)*kk-1.6); }
    // bắc
    g.fillStyle='#eef1f5'; g.font='600 20px "Be Vietnam Pro",Arial'; g.textAlign='left'; g.fillText('B',10,28); g.beginPath(); g.moveTo(17,36); g.lineTo(11,50); g.lineTo(23,50); g.closePath(); g.fill();
    // thước tỉ lệ 10 m
    const l10=10*S*kk; g.fillRect(10,MH-14,l10,2.5); g.font='400 16px "IBM Plex Mono",monospace'; g.fillText('10 m',10,MH-20);
  }
  drawMapBase(1);
  const fl=$('floors'); [['1',1],['2',2],['3',3],['4',4],['5',5],['Mái',6]].forEach(([t,v])=>{ const bt=document.createElement('button'); bt.textContent=t; bt.dataset.l=v; if(v===1) bt.className='on'; bt.onclick=()=>{ mapManual=performance.now(); selLevel=Math.min(v,5); drawMapBase(selLevel); [...fl.children].forEach(c=>c.classList.toggle('on',c===bt)); if(v===6){ goView(VIEWS.length-1); } }; fl.appendChild(bt); });
  let selLevel=1,mapManual=-1e9;
  mapC.addEventListener('pointerdown',e=>{ const r=mapC.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*MW,sy=(e.clientY-r.top)/r.height*MH,q=(sx-(MW-(Qmax-Qmin)*kk)/2)/kk+Qmin,p=Pmax-(sy-(MH-(Pmax-Pmin)*kk)/2)/kk,x=X(q),z=Z(p),L=selLevel,yy=Y[L]+1.7,fy=player.floorAt(x,z,yy);
    if(fy===null||fy<Y[L]-.5){ toast('Tầng này không có sàn ở vị trí đó'); return; }
    const d=new THREE.Vector3(); camera.getWorldDirection(d); player.flyTo([x,fy+player.eye,z],player.mode==='orbit'?Math.atan2(-d.x,-d.z):player.yaw,0,'walk',1.1); [...$('modes').children].forEach(c=>c.classList.toggle('on',c.dataset.m==='walk')); setViewOn(-1); showHint('walk'); });

  addEventListener('resize',()=>{ setupComposer(); });

  // Vòng lặp
  const clock=new THREE.Clock(); let t=0,fAcc=0,fN=0,slow=0,lastLoc='';
  function drawMap(){ mg.clearRect(0,0,MW,MH); mg.drawImage(off,0,0); const c=camera.position,[P,Q]=pqFromXZ(c.x,c.z); const d=new THREE.Vector3(); camera.getWorldDirection(d); const a=Math.atan2(d.x,-d.z),sx=mx(Q),sy=my(P);
    if(sx<-20||sy<-20||sx>MW+20||sy>MH+20) return; mg.save(); mg.translate(sx,sy); mg.rotate(a); mg.fillStyle='#f4c63a'; mg.strokeStyle='#0e1c38'; mg.lineWidth=2; mg.beginPath(); mg.moveTo(0,-12); mg.lineTo(8,9); mg.lineTo(0,5); mg.lineTo(-8,9); mg.closePath(); mg.fill(); mg.stroke(); mg.restore(); }
  function frame(){
    const dt=Math.min(clock.getDelta(),.05); t+=dt; windU.uTime.value=t; sky.uni.uTime.value=t;
    player.update(dt); game.update(dt);
    // Mức tầng và vị trí
    const c=camera.position,lv=player.mode==='orbit'?'':locate(c.x,c.y,c.z);
    let txt=player.mode==='orbit'?'Toàn cảnh':`${typeof lv.L==='number'?'Tầng '+lv.L:lv.L} · ${lv.name}`;
    if(txt!==lastLoc){ $('whereT').textContent=txt; lastLoc=txt; }
    if(player.mode!=='orbit'&&performance.now()-mapManual>6000){ const L=levelFromY(c.y); if(L!==selLevel){ selLevel=L; drawMapBase(L); [...fl.children].forEach(x=>x.classList.toggle('on',+x.dataset.l===L)); } }
    $('xyz').textContent=player.mode==='orbit'?'':`${c.x.toFixed(1)}, ${c.z.toFixed(1)} · cao ${c.y.toFixed(1)} m`;
    drawMap();
    if(mPts.length===2){ const a=mPts[0],bb=mPts[1],m=a.clone().add(bb).multiplyScalar(.5).project(camera),L=$('mlabel'); if(m.z<1){ L.hidden=false; L.style.left=(m.x*.5+.5)*innerWidth+'px'; L.style.top=(-m.y*.5+.5)*innerHeight+'px'; L.textContent=a.distanceTo(bb).toFixed(2).replace('.',',')+' m'; } else L.hidden=true; }
    composer.render();
    // Tự hạ chất lượng khi máy không kham nổi
    fAcc+=dt; fN++; if(fAcc>2.5){ const fps=fN/fAcc; fAcc=0; fN=0; if(!userQ&&fps<22&&quality>0&&!window.__noAuto){ if(++slow>=2){ slow=0; setQ(quality-1,'Đã giảm chất lượng hình để chạy mượt hơn'); } } else if(fps>=22) slow=0; }
    if(!window.__manual) requestAnimationFrame(frame);
  }
  // Game và menu khởi đầu
  const game=createGame({player,camera,scene,toast,
    setClock(h,bake){ hour=Math.max(5,Math.min(21,h)); $('time').value=hour; applySun(bake); },
    toMenu(){ player.tween=null; setMode('orbit'); setViewOn(0); const o=player.orbit; o.auto=!matchMedia('(prefers-reduced-motion: reduce)').matches; o.t.set(0,7,0); $('hint').hidden=true; $('cross').hidden=true; },
    toTour(){ goView(0); showHint('orbit'); },
    toGame(){ player.frozen=false; player.flyTo([X(498),1.6,Z(527)],Math.PI/2,.06,'walk',1.4); [...$('modes').children].forEach(c=>c.classList.toggle('on',c.dataset.m==='walk')); showHint('walk'); },
  });
  $('load').hidden=true;
  if(game.enabled===false){ showHint('orbit'); $('c').focus({preventScroll:true}); }
  else { $('menu').hidden=false; setTimeout(()=>$('btnGame').focus(),60); }
  // Giao tiếp để chụp thử nghiệm
  window.__app={game,player,camera,scene,renderer,info:{doorFixes:DOOR_FIXES,cityInfo,tris:meshes.reduce((a,m)=>a+m.geometry.index.count/3,0),meshes:meshes.length,col:colArr.length/9},setHour(h){ hour=h; applySun(true); },goto(p,y,x,m){ player.tween=null; player.mode=m||'fly'; player.pos.set(...p); player.yaw=y; player.pitch=x; player.vel.set(0,0,0); player.grounded=false; camera.position.set(...p); },step(n=1){ for(let i=0;i<n;i++) frame(); },setQ,VIEWS,hud(v){ document.body.classList.toggle('nohud',!v); $('hint').hidden=true; },walkTest(path){ return runWalk(player,path); },orbit(th,ph,r,tx,ty,tz){ const o=player.orbit; player.mode='orbit'; player.tween=null; o.auto=false; o.th=th;o.ph=ph;o.r=r; if(tx!==undefined) o.t.set(tx,ty,tz); }};
  window.__ready=true;
  renderer.compile(scene,camera);
  frame();
}
main().catch(err=>{ console.error(err); $('loadErr').hidden=false; $('loadErr').textContent='Không dựng được cảnh 3D: '+err.message+'. Trình duyệt cần hỗ trợ WebGL 2.'; });
