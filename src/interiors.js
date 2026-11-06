import * as THREE from 'three';
import { X,Z,M,S,Y,ROOMS } from './plan.js';
import { frameM } from './builder.js';

function roomFrame(r,side){
  const y=Y[r.L]+.008;
  if(side==='Qmax') return {m:frameM(r.P0,r.Q1,1,0,0,-1,y),W:M(r.P1-r.P0),D:M(r.Q1-r.Q0)};
  if(side==='Qmin') return {m:frameM(r.P0,r.Q0,1,0,0,1,y),W:M(r.P1-r.P0),D:M(r.Q1-r.Q0)};
  if(side==='Pmax') return {m:frameM(r.P1,r.Q0,0,1,-1,0,y),W:M(r.Q1-r.Q0),D:M(r.P1-r.P0)};
  return {m:frameM(r.P0,r.Q0,0,1,1,0,y),W:M(r.Q1-r.Q0),D:M(r.P1-r.P0)};
}
const fan=(b,x,y,z)=>{ b.box('steel',x-.015,x+.015,y-.35,y,z-.015,z+.015); b.cyl('fan',x,z,y-.46,y-.34,.09,{seg:10});
  for(let k=0;k<3;k++){ const a=k/3*6.283+x,c=Math.cos(a),s=Math.sin(a); const m=new THREE.Matrix4().makeRotationY(-a).setPosition(x,y-.42,z); const sv=b.m; b.setFrame(sv?sv.clone().multiply(m):m); b.box('fan',.08,.72,-.008,.008,-.055,.055); b.setFrame(sv);} };
const tube=(b,x,y,z,alongX=true)=>{ if(alongX){ b.box('alu',x-.64,x+.64,y-.07,y,z-.05,z+.05); b.box('lamp',x-.6,x+.6,y-.1,y-.07,z-.018,z+.018); } else { b.box('alu',x-.05,x+.05,y-.07,y,z-.64,z+.64); b.box('lamp',x-.018,x+.018,y-.1,y-.07,z-.6,z+.6); } };
function desk(b,x,z,w=1.2,d=.45,h=.74,col=true){
  b.box('deskTop',x-w/2,x+w/2,h-.025,h,z-d/2,z+d/2);
  b.box('deskFrame',x-w/2+.03,x-w/2+.06,0,h-.025,z-d/2+.03,z+d/2-.03,{faces:'xXzZ'}); b.box('deskFrame',x+w/2-.06,x+w/2-.03,0,h-.025,z-d/2+.03,z+d/2-.03,{faces:'xXzZ'});
  b.box('deskTop',x-w/2+.06,x+w/2-.06,h-.3,h-.025,z-d/2+.01,z-d/2+.03);
  b.box('deskTop',x-w/2+.06,x+w/2-.06,h-.17,h-.15,z-d/2+.03,z+d/2-.06,{faces:'Yy'});
  if(col) b.solid(x-w/2,x+w/2,0,h,z-d/2,z+d/2);
}
function stool(b,x,z,back=true,sgn=1,mat='deskTop'){
  const s=.17; b.box(mat,x-s,x+s,.43,.455,z-s,z+s,{faces:'xXYyzZ'});
  for(const dx of [-1,1]) for(const dz of [-1,1]) b.box('deskFrame',x+dx*(s-.03)-.012,x+dx*(s-.03)+.012,0,.43,z+dz*(s-.03)-.012,z+dz*(s-.03)+.012,{faces:'xXzZ'});
  if(back){ const zb=z+sgn*s; b.box(mat,x-s+.02,x+s-.02,.68,.82,zb-.012,zb+.012); b.box('deskFrame',x-s+.03,x-s+.055,.43,.7,zb-.01,zb+.01,{faces:'xXzZ'}); b.box('deskFrame',x+s-.055,x+s-.03,.43,.7,zb-.01,zb+.01,{faces:'xXzZ'}); }
}
function boardWall(b,W,H,labelMat){
  const x=W/2; b.box('board',x-1.9,x+1.9,.95,2.25,.1,.13); b.box('boardFrame',x-1.95,x+1.95,2.25,2.29,.1,.14); b.box('boardFrame',x-1.95,x+1.95,.91,.95,.1,.19); b.box('boardFrame',x-1.95,x-1.9,.95,2.25,.1,.14); b.box('boardFrame',x+1.9,x+1.95,.95,2.25,.1,.14);
  // khẩu hiệu
  b.poly(labelMat,[[x-1.5,2.46,.105],[x+1.5,2.46,.105],[x+1.5,2.86,.105],[x-1.5,2.86,.105]],[0,0,1],b.flip?[[1,0],[0,0],[0,1],[1,1]]:[[0,0],[1,0],[1,1],[0,1]]);
}
// Tấm phẳng dán trên tường (áp phích, bảng tên), mặt quay theo pháp tuyến (nx,nz) trong khung phòng.
// Tự đảo chiều chữ khi khung phòng bị lật, để chữ luôn đọc từ trái sang phải.
function wallQuad(b,mat,cx,cz,nx,nz,yc,w,h){
  const rx=nz,rz=-nx,hw=w/2,hh=h/2;
  const P=[[cx-rx*hw,yc-hh,cz-rz*hw],[cx+rx*hw,yc-hh,cz+rz*hw],[cx+rx*hw,yc+hh,cz+rz*hw],[cx-rx*hw,yc+hh,cz-rz*hw]];
  b.poly(mat,P,[nx,0,nz],b.flip?[[1,0],[0,0],[0,1],[1,1]]:[[0,0],[1,0],[1,1],[0,1]]);
}
// Toạ độ trong khung phòng của một bức tường: at(t) là điểm cách đầu tường t mét, n là pháp tuyến hướng vào phòng
function wallOf(r,side,m){
  const inv=m.clone().invert(), isP=side[0]==='P', fix=r[side==='Pmin'?'P0':side==='Pmax'?'P1':side==='Qmin'?'Q0':'Q1'];
  const w2l=(P,Q)=>new THREE.Vector3(X(Q),0,Z(P)).applyMatrix4(inv);
  const a=isP?w2l(fix,r.Q0):w2l(r.P0,fix), c=isP?w2l(fix,r.Q1):w2l(r.P1,fix), mid=w2l((r.P0+r.P1)/2,(r.Q0+r.Q1)/2);
  const len=a.distanceTo(c), d=c.clone().sub(a).normalize(); let n=new THREE.Vector3(-d.z,0,d.x);
  if(n.dot(mid.clone().sub(a))<0) n.negate();
  return {len,n,at:t=>a.clone().addScaledVector(d,t)};
}
// Số phòng học theo tầng: 201, 202… (tạm đặt, chưa có danh sách phòng thật của trường)
export function classNumbers(){ const cnt={},out=new Map(); for(const r of ROOMS) if(r.kind==='class'){ cnt[r.L]=(cnt[r.L]||0)+1; out.set(r,`${r.L}${String(cnt[r.L]).padStart(2,'0')}`); } return out; }
const NUM=classNumbers();
// Rèm cửa hai bên mỗi cửa sổ trên tường ngoài (cùng công thức đặt cửa sổ với school.js)
function curtains(b,r,m){
  const w=wallOf(r,r.outer,m), n=Math.max(1,Math.round(w.len/2.9)), ww=w.len/n, y1=r.L===1?3.12:3.12, y0=r.L===1?.95:.85;
  for(let i=0;i<n;i++){ const s0=i*ww+.42,e0=(i+1)*ww-.42;
    for(const [t0,t1] of [[s0-.18,s0+.32],[e0-.32,e0+.18]]){ const p=w.at((t0+t1)/2), half=(t1-t0)/2, rx=w.n.z, rz=-w.n.x, o=.13;
      const x0=p.x+w.n.x*o-rx*half, x1=p.x+w.n.x*o+rx*half, z0=p.z+w.n.z*o-rz*half, z1=p.z+w.n.z*o+rz*half;
      b.box('curtain',Math.min(x0,x1)-.025*Math.abs(w.n.x),Math.max(x0,x1)+.025*Math.abs(w.n.x),y0,y1,Math.min(z0,z1)-.025*Math.abs(w.n.z),Math.max(z0,z1)+.025*Math.abs(w.n.z)); }
    const a=w.at(s0-.25),c=w.at(e0+.25); b.rod('inox',[a.x+w.n.x*.13,y1+.04,a.z+w.n.z*.13],[c.x+w.n.x*.13,y1+.04,c.z+w.n.z*.13],.012,5); }
}
function shelf(b,x0,x1,z0,z1,h,mat='wood',books=true){
  b.box(mat,x0,x0+.03,0,h,z0,z1); b.box(mat,x1-.03,x1,0,h,z0,z1); b.box(mat,x0,x1,h-.03,h,z0,z1); b.box(mat,x0+.03,x1-.03,0,h,z0,z0+.015);
  const n=Math.max(2,Math.floor(h/.36));
  for(let i=0;i<n;i++){ const y=i*h/n; b.box(mat,x0,x1,y,y+.025,z0,z1);
    if(books) b.box('books',x0+.03,x1-.03,y+.025,y+.31,z0+.02,z1-.04,{}); }
  b.solid(x0,x1,0,h,z0,z1);
}

// Lớp học THCS: bục giảng, bảng xanh có chữ phấn, khẩu hiệu, 5 điều Bác Hồ dạy, nội quy, tivi, bảng tin, rèm cửa,
// 4 dãy bàn đôi có hộc và ghế tựa. Bố trí theo chuẩn lớp học ở Đà Nẵng; chưa có ảnh lớp học thật của trường.
function classroom(b,r){
  const {m,W,D}=roomFrame(r,r.board||'Qmax'); const h=Y[r.L+1]-.18-Y[r.L];
  const s=b.m; b.setFrame(m);
  const cx=W/2, py=.18, pd=1.9;
  // bục giảng ốp gỗ, mép bo nhôm
  b.box('platform',.5,W-.5,0,py,.1,pd,{collide:true}); b.box('alu',.5,W-.5,py-.03,py+.005,pd-.03,pd+.005);
  // bảng xanh 3,6 × 1,25 m, khung nhôm, máng phấn
  const bx0=cx-1.8,bx1=cx+1.8,by0=1.0,by1=2.25;
  b.box('boardFrame',bx0-.05,bx1+.05,by0-.05,by1+.05,.1,.13);
  wallQuad(b,'chalkboard',cx,.132,0,1,(by0+by1)/2,bx1-bx0,by1-by0);
  b.box('boardFrame',bx0,bx1,by0-.07,by0-.04,.1,.2); b.box('chalk',bx0+.3,bx0+.38,by0-.04,by0-.02,.15,.17); b.box('chalk',bx0+.5,bx0+.56,by0-.04,by0-.02,.16,.18); b.box('plasticDark',bx1-.5,bx1-.32,by0-.04,by0+.02,.13,.19);
  // khẩu hiệu trên bảng
  wallQuad(b,'slogan',cx,.106,0,1,2.62,3.0,.4);
  // 5 điều Bác Hồ dạy bên trái, nội quy lớp học bên phải tivi
  if(cx-1.8-.4-.7>.3) wallQuad(b,'poster5',cx-2.62,.106,0,1,1.75,.78,1.08);
  b.box('plasticDark',cx+2.0,cx+3.42,1.18,2.0,.1,.15); wallQuad(b,'tvScreen',cx+2.71,.152,0,1,1.59,1.36,.76);
  if(cx+3.42+.9<W-.2) wallQuad(b,'rules',cx+3.95,.106,0,1,1.7,.72,.98);
  // bàn giáo viên trên bục, ghế, máy tính xách tay, lọ hoa
  const tz=1.05, ty=py; b.box('wood',cx-.75,cx+.75,ty+.72,ty+.76,tz-.35,tz+.35,{collide:true});
  b.box('wood',cx-.73,cx-.69,ty,ty+.72,tz-.33,tz+.33); b.box('wood',cx+.69,cx+.73,ty,ty+.72,tz-.33,tz+.33); b.box('wood',cx-.69,cx+.69,ty+.25,ty+.72,tz+.3,tz+.33);
  b.solid(cx-.75,cx+.75,ty,ty+.76,tz-.35,tz+.35);
  b.box('plasticDark',cx+.05,cx+.4,ty+.76,ty+.775,tz-.12,tz+.12); b.box('screen',cx+.06,cx+.39,ty+.775,ty+.98,tz-.135,tz-.12);
  b.cyl('glass',cx-.45,tz,ty+.76,ty+.95,.05,{seg:10}); b.box('pinkFlower',cx-.5,cx-.4,ty+.95,ty+1.02,tz-.05,tz+.05);
  b.box('books',cx-.2,cx+.0,ty+.76,ty+.83,tz-.1,tz+.15);
  const tch=(x,z)=>{ b.box('leather',x-.21,x+.21,ty+.45,ty+.5,z-.2,z+.2); b.box('leather',x-.21,x+.21,ty+.5,ty+.98,z-.26,z-.2); for(const dx of [-.17,.17]) for(const dz of [-.16,.16]) b.box('deskFrame',x+dx-.015,x+dx+.015,ty,ty+.45,z+dz-.015,z+dz+.015,{faces:'xXzZ'}); };
  tch(cx,tz-.62);
  // bàn học sinh: 4 dãy bàn đôi khi phòng đủ rộng
  const cols=W>=8.2?4:3, aisle=.62, dw=1.2, tot=cols*dw+(cols-1)*aisle, x0=(W-tot)/2+dw/2;
  const nRow=Math.max(3,Math.floor((D-pd-1.6)/.92));
  for(let c=0;c<cols;c++) for(let k=0;k<nRow;k++){ const x=x0+c*(dw+aisle), z=pd+.95+k*.92; desk(b,x,z,dw,.45); stool(b,x-.3,z+.42,true,1,'chairWood'); stool(b,x+.3,z+.42,true,1,'chairWood');
    if((c*7+k*3)%5===0) b.box('bagBlue',x-.48,x-.16,.46,.78,z+.52,z+.64); }
  // cuối lớp: bảng tin, tủ, thùng rác, chổi
  wallQuad(b,'notice',cx,D-.11,0,-1,1.75,2.2,1.15); b.box('wood',cx-1.15,cx+1.15,1.12,1.18,D-.16,D-.1); b.box('wood',cx-1.15,cx+1.15,2.32,2.38,D-.16,D-.1);
  b.box('wood',.3,1.5,0,1.8,D-.48,D-.1,{collide:true}); b.box('plastic',.32,1.48,.04,1.76,D-.5,D-.48);
  b.cyl('bin',W-.45,D-.4,0,.5,.18,{r1:.21,seg:14,collide:true}); b.rod('wood',[W-.2,0,D-.75],[W-.16,1.15,D-.15],.012,4); b.box('broom',W-.26,W-.12,0,.24,D-.8,D-.7);
  // đồng hồ treo tường phía trên bảng tin
  wallQuad(b,'clockFace',cx,D-.105,0,-1,2.75,.34,.34);
  // quạt trần, đèn tuýp
  for(const a of [.3,.7]) for(const f of [.35,.72]) fan(b,W*a,h,D*f);
  for(const a of [.2,.5,.8]) for(const f of [.22,.52,.82]) tube(b,W*a,h,D*f);
  b.setFrame(s);
  // rèm cửa sổ tường ngoài, bảng tên phòng ngoài hành lang
  b.setFrame(m); curtains(b,r,m);
  const dw2=wallOf(r,r.door,m), pt=dw2.at(.45+1.25+.35), o=-.13;
  wallQuad(b,'plate_'+NUM.get(r),pt.x+dw2.n.x*o,pt.z+dw2.n.z*o,-dw2.n.x,-dw2.n.z,2.15,.5,.24);
  b.setFrame(s);
}
function lab(b,r,slogan){
  const {m,W,D}=roomFrame(r,r.board||'Qmax'); const h=(r.L<5?Y[r.L+1]:Y[6])-.18-Y[r.L];
  const s=b.m; b.setFrame(m); boardWall(b,W,D,slogan);
  b.box('wood',W/2-1,W/2+1,.72,.76,1.1,1.8,{}); b.box('wood',W/2-.98,W/2+.98,0,.72,1.12,1.78); b.solid(W/2-1,W/2+1,0,.76,1.1,1.8);
  const nx=2,nz=Math.max(2,Math.floor((D-3.4)/2.1));
  for(let i=0;i<nx;i++) for(let k=0;k<nz;k++){ const x=W*(i+.5)/nx,z=3+k*(D-4.2)/Math.max(1,nz-1);
    b.box('white',x-.9,x+.9,.8,.84,z-.45,z+.45); b.box('wood',x-.86,x+.86,0,.8,z-.4,z+.4); b.solid(x-.9,x+.9,0,.84,z-.45,z+.45); b.box('inox',x-.14,x+.14,.84,.86,z-.1,z+.1); b.rod('inox',[x,.86,z],[x,1.08,z],.012);
    for(const dx of [-.6,0,.6]) for(const sg of [-1,1]) stool(b,x+dx,z+sg*.72,false); }
  shelf(b,.3,2.0,D-.5,D-.1,2,'wood',false);
  for(const a of [.3,.7]) for(const f of [.25,.75]) fan(b,W*a,h,D*f);
  for(const a of [.2,.5,.8]) for(const f of [.2,.5,.8]) tube(b,W*a,h,D*f);
  b.setFrame(s);
}
function computer(b,r,slogan){
  const {m,W,D}=roomFrame(r,r.board||'Qmax'); const h=(r.L<5?Y[r.L+1]:Y[6])-.18-Y[r.L];
  const s=b.m; b.setFrame(m); boardWall(b,W,D,slogan);
  const n=Math.floor((D-2.6)/1.05);
  for(const xc of [W*.27,W*.73]) for(let k=0;k<n;k++){ const z=2.2+k*1.05;
    b.box('deskTop',xc-1.5,xc+1.5,.72,.75,z-.3,z+.3); b.box('deskFrame',xc-1.46,xc-1.42,0,.72,z-.27,z+.27); b.box('deskFrame',xc+1.42,xc+1.46,0,.72,z-.27,z+.27); b.solid(xc-1.5,xc+1.5,0,.75,z-.3,z+.3);
    for(const dx of [-1.05,-.35,.35,1.05]){ const x=xc+dx; b.box('plasticDark',x-.24,x+.24,.87,1.18,z-.21,z-.18); b.box('screen',x-.225,x+.225,.885,1.165,z-.179,z-.176,{faces:'Z'}); b.box('plasticDark',x-.03,x+.03,.75,.87,z-.2,z-.18); b.box('plasticDark',x-.1,x+.1,.75,.76,z-.24,z-.12); b.box('plasticDark',x-.2,x+.2,.75,.77,z-.08,z+.07); stool(b,x,z+.45,true,1,'chairBlue'); } }
  for(const a of [.2,.5,.8]) for(const f of [.2,.5,.8]) tube(b,W*a,h,D*f);
  b.setFrame(s);
}
function office(b,r){
  const {m,W,D}=roomFrame(r,r.outer||'Qmin'); const h=(r.L<5?Y[r.L+1]:Y[6])-.18-Y[r.L];
  const s=b.m; b.setFrame(m);
  const n=Math.max(1,Math.floor(W/3.4));
  for(let i=0;i<n;i++){ const x=W*(i+.5)/n,z=Math.min(1.5,D*.3); b.box('wood',x-.8,x+.8,.72,.76,z-.4,z+.4); b.box('wood',x-.78,x-.72,0,.72,z-.38,z+.38); b.box('wood',x+.72,x+.78,0,.72,z-.38,z+.38); b.box('wood',x-.72,x+.72,.2,.72,z-.38,z-.35); b.solid(x-.8,x+.8,0,.76,z-.4,z+.4); stool(b,x,z+.7,true,1,'plasticDark'); b.box('plasticDark',x-.2,x+.2,.84,1.12,z-.2,z-.18); b.box('screen',x-.185,x+.185,.855,1.105,z-.179,z-.176,{faces:'Z'}); b.box('plasticDark',x-.03,x+.03,.76,.84,z-.2,z-.18); }
  if(W>2) shelf(b,.2,Math.min(1.8,W-.2),D-.48,D-.1,2,'wood',true);
  tube(b,W*.5,h,D*.3); tube(b,W*.5,h,D*.7);
  if(D>5) fan(b,W*.5,h,D*.5);
  b.setFrame(s);
}
function store(b,r){ const {m,W,D}=roomFrame(r,r.outer||'Qmin'); const h=(r.L<5?Y[r.L+1]:Y[6])-.18-Y[r.L]; const s=b.m; b.setFrame(m);
  for(let x=.3;x<W-1.2;x+=1.6) shelf(b,x,x+1.3,.15,.6,2.1,'alu',false); tube(b,W/2,h,D/2); b.setFrame(s); }
function wc(b,r){
  const {m,W,D}=roomFrame(r,r.outer||'Qmin'); const h=(r.L<5?Y[r.L+1]:Y[6])-.18-Y[r.L]; const s=b.m; b.setFrame(m);
  // Ốp trần gỗ thanh vàng, vách xám, cửa buồng trắng: ảnh khu vệ sinh
  for(let z=.2;z<D-.1;z+=.16) b.box('wood',.05,W-.05,h-.18,h-.1,z,z+.09,{faces:'yxXzZ'});
  const n=Math.floor((W-1)/1.1);
  for(let i=0;i<=n;i++){ const x=.5+i*1.1; b.box('stain',x-.022,x+.022,.1,2.1,.1,1.7,{collide:true}); if(i<n){ b.box('white',x+.03,x+1.07,.1,2.1,1.68,1.72,{collide:true}); const xc=x+.55; b.box('white',xc-.18,xc+.18,0,.42,.35,.95); b.box('white',xc-.22,xc+.22,.42,.46,.3,.98); b.box('door',x+.04,x+.05,.1,2.1,0,0); } }
  // Dãy bồn rửa và gương đặt trên tường bên (z = D là tường có cửa ra vào, z = 0 là tường ngoài)
  const z0=2.3,z1=D-1.3;
  if(z1-z0>=.9){ const xa=W-.6,xb=W-.06;
    b.box('granite',xa,xb,.8,.86,z0,z1,{collide:true}); b.box('white',xa+.04,xb,0,.8,z0+.02,z0+.06); b.box('white',xa+.04,xb,0,.8,z1-.06,z1-.02);
    const n=Math.max(1,Math.floor((z1-z0)/.95));
    for(let i=0;i<n;i++){ const z=z0+(i+.5)*(z1-z0)/n; b.cyl('white',W-.34,z,.86,.93,.2,{seg:16}); b.rod('inox',[W-.08,.9,z],[W-.08,1.1,z],.014); b.rod('inox',[W-.08,1.1,z],[W-.22,1.06,z],.012); }
    b.box('mirror',W-.075,W-.06,1.2,2.15,z0+.05,z1-.05); }
  tube(b,W/2,h-.15,D*.3); tube(b,W/2,h-.15,D*.7);
  b.setFrame(s);
}
function library(b,r){
  const {m,W,D}=roomFrame(r,'Pmax'); const h=Y[r.L+1]-.18-Y[r.L]; const s=b.m; b.setFrame(m);
  const cols=5; for(let c=0;c<3;c++) for(let z=1;z<D*.46;z+=1.7){ const x=W*(c+.5)/3; shelf(b,x-.9,x+.9,z,z+.42,2.1,'wood',true); }
  for(let c=0;c<3;c++) for(let z=D*.58;z<D-1.2;z+=2.8){ const x=W*(c+.5)/3; b.box('deskTop',x-.8,x+.8,.72,.76,z-.5,z+.5); b.box('deskFrame',x-.7,x-.65,0,.72,z-.4,z+.4); b.box('deskFrame',x+.65,x+.7,0,.72,z-.4,z+.4); b.solid(x-.8,x+.8,0,.76,z-.5,z+.5); for(const dz of [-1,1]) for(const dx of [-.42,.42]) stool(b,x+dx,z+dz*.74,true,dz); }
  for(const a of [.18,.5,.82]) for(let f=.12;f<1;f+=.19) tube(b,W*a,h,D*f);
  b.setFrame(s);
}
// Phòng hội đồng theo ảnh: người dự ngồi theo dãy bàn gỗ màu mật ong, ghế lưng cao bọc da đen, quay về phía bàn chủ toạ
// phủ khăn trắng ở đầu phòng; băng rôn đỏ ở tường cuối; cột tròn trắng; máy lạnh âm trần, đèn LED dài, đèn âm trần,
// quạt trần ba cánh; gờ trần hắt đèn tím; loa, quạt treo tường, đồng hồ điện tử, bản đồ Việt Nam; cửa sổ song ngang kính xanh.
function hall(b,r){
  const {m,W,D}=roomFrame(r,'Qmin'); const h=Y[r.L+1]-.18-Y[r.L]; const s=b.m; b.setFrame(m);
  const cx=W/2;
  // băng rôn khẩu hiệu ở tường cuối (z = D)
  b.box('boardFrame',W*.12,W*.88,h-1.05,h-.38,D-.14,D-.1);
  wallQuad(b,'motto',cx,D-.145,0,-1,h-.715,W*.74,.6);
  // bản đồ Việt Nam và đồng hồ điện tử trên tường trái gần cuối phòng, loa đen hai góc
  b.box('boardFrame',.1,.14,1.55,2.75,D-3.4,D-2.5); wallQuad(b,'vnmap',.142,D-2.95,1,0,2.15,.86,1.16);
  b.box('plasticDark',.1,.15,2.55,2.83,D-5.2,D-4.7); wallQuad(b,'clockDigital',.152,D-4.95,1,0,2.69,.46,.24);
  for(const x of [.35,W-.35]){ b.box('plasticDark',x-.17,x+.17,2.45,2.95,D-.42,D-.12); b.box('steel',x-.2,x+.2,2.42,2.45,D-.42,D-.12); }
  // quạt treo tường giữa các cửa sổ
  for(const z of [D*.3,D*.62]){ b.box('white',W-.18,W-.1,2.5,2.9,z-.2,z+.2); b.cyl('steel',W-.2,z,2.52,2.88,.16,{seg:12}); }
  // bàn chủ toạ phủ khăn trắng, hoa, chai nước, ly
  for(const [x0,x1] of [[W*.14,W*.46],[W*.54,W*.86]]){ const z0=1.6,z1=2.3;
    b.box('woodHoney',x0+.08,x0+.14,0,.74,z0+.1,z1-.1); b.box('woodHoney',x1-.14,x1-.08,0,.74,z0+.1,z1-.1);
    b.box('cloth',x0,x1,.74,.77,z0-.04,z1+.04,{collide:true}); b.box('cloth',x0,x1,.16,.77,z1+.02,z1+.04); b.box('cloth',x0-.02,x0,.16,.77,z0-.04,z1+.04); b.box('cloth',x1,x1+.02,.16,.77,z0-.04,z1+.04);
    b.solid(x0,x1,0,.77,z0,z1);
    const fx=(x0+x1)/2; b.cyl('glass',fx,(z0+z1)/2,.77,.92,.07,{seg:12}); for(let k=0;k<7;k++){ const a=k/7*6.283; b.box(k%2?'pinkFlower':'yellowFlower',fx+Math.cos(a)*.13-.05,fx+Math.cos(a)*.13+.05,.92,1.02,(z0+z1)/2+Math.sin(a)*.1-.05,(z0+z1)/2+Math.sin(a)*.1+.05); }
    b.box('hedge',fx-.22,fx+.22,.9,.98,(z0+z1)/2-.12,(z0+z1)/2+.12);
    for(let x=x0+.3;x<x1-.2;x+=.55){ b.cyl('glass',x,z0+.2,.77,.99,.033,{seg:8}); b.cyl('bottleCap',x,z0+.2,.99,1.01,.016,{seg:6}); b.cyl('glass',x+.15,z0+.25,.77,.86,.035,{seg:8}); }
    for(let x=x0+.4;x<x1-.2;x+=.75) hallChair(b,x,z0-.55,-1); }
  // hai bục gỗ đặt hoa ở góc đầu phòng
  for(const z of [1.1,2.4]){ const x=W-.8; b.box('woodHoney',x-.45,x+.45,0,.98,z-.3,z+.3,{collide:true}); b.box('woodHoneyDark',x-.43,x+.43,.06,.92,z-.31,z-.3); b.box('woodHoney',x-.5,x+.5,.98,1.02,z-.34,z+.34);
    b.box('yellowFlower',x-.14,x+.14,1.02,1.16,z-.1,z+.1); b.box('hedge',x-.2,x+.2,1.02,1.08,z-.14,z+.14); }
  // cột tròn trắng
  const cols=[[W*.5,D*.47],[W*.5,D*.8]];
  for(const [x,z] of cols) b.cyl('paint',x,z,0,h,.36,{seg:28,collide:true,caps:false});
  // dãy bàn người dự: bàn gỗ mật ong có tấm che phía trước, ghế lưng cao da đen phía sau
  const dw=1.5, aisle=1.1, sideGap=.55, perSide=Math.max(2,Math.floor((W/2-aisle/2-sideGap)/dw));
  for(let z=3.9;z<D-1.4;z+=1.15) for(const sgn of [-1,1]) for(let k=0;k<perSide;k++){
    const x=cx+sgn*(aisle/2+dw/2+k*dw);
    if(cols.some(([qx,qz])=>Math.abs(qx-x)<dw/2+.45&&Math.abs(qz-z)<.85)) continue;
    meetDesk(b,x,z,dw); for(const dx of [-.36,.36]) hallChair(b,x+dx,z+.52,1);
  }
  // trần: máy lạnh âm trần bốn hướng, đèn LED dài, đèn âm trần tròn, quạt trần ba cánh, gờ trần hắt đèn tím
  for(const a of [.27,.73]) for(const f of [.22,.5,.78]){ const x=W*a,z=D*f; b.box('white',x-.44,x+.44,h-.07,h,z-.44,z+.44,{faces:'y'}); b.box('acGrille',x-.3,x+.3,h-.075,h-.07,z-.3,z+.3,{faces:'y'});
    for(const [dx,dz,ww,dd] of [[0,-.37,.6,.06],[0,.37,.6,.06],[-.37,0,.06,.6],[.37,0,.06,.6]]) b.box('plasticDark',x+dx-ww/2,x+dx+ww/2,h-.078,h-.07,z+dz-dd/2,z+dz+dd/2,{faces:'y'}); }
  for(const a of [.15,.4,.6,.85]) for(let f=.1;f<.96;f+=.2){ const x=W*a,z=D*f; b.box('alu',x-.04,x+.04,h-.025,h,z-.9,z+.9,{faces:'y'}); b.box('lamp',x-.025,x+.025,h-.03,h-.025,z-.88,z+.88,{faces:'y'}); }
  for(let a=.1;a<.95;a+=.2) for(let f=.06;f<.98;f+=.11){ const x=W*a,z=D*f; b.cyl('lamp',x,z,h-.012,h-.005,.07,{seg:12}); }
  for(const a of [.2,.8]) for(const f of [.32,.58,.86]) fan3(b,W*a,h,D*f);
  b.box('paint',W-.7,W-.1,h-.32,h,.1,D-.1,{faces:'xy'}); b.box('cove',W-.71,W-.7,h-.34,h-.3,.2,D-.2,{faces:'x'});
  b.setFrame(s);
}
function hallChair(b,x,z,sg){   // sg = 1: lưng ghế ở phía +z (người ngồi quay về -z)
  const zb=z+sg*.2;
  b.box('woodHoney',x-.22,x+.22,.42,.46,z-.21,z+.21); b.box('leather',x-.2,x+.2,.46,.52,z-.19,z+.19,{faces:'xXYzZ'});
  b.box('woodHoney',x-.22,x-.18,.46,1.0,zb-.03,zb+.03); b.box('woodHoney',x+.18,x+.22,.46,1.0,zb-.03,zb+.03); b.box('woodHoney',x-.22,x+.22,.96,1.02,zb-.03,zb+.03);
  b.box('leather',x-.18,x+.18,.56,.95,zb-.025,zb+.025);
  for(const dx of [-.19,.19]) for(const dz of [-.18,.18]) b.box('woodHoney',x+dx-.022,x+dx+.022,0,.42,z+dz-.022,z+dz+.022,{faces:'xXzZ'});
  b.solid(x-.22,x+.22,0,1.02,z-.21,z+.21);
}
function meetDesk(b,x,z,w){   // bàn hội nghị: mặt quay về -z có tấm che kín xuống sát sàn
  const d=.5,y=.75;
  b.box('woodHoney',x-w/2,x+w/2,y-.035,y,z-d/2,z+d/2,{collide:true});
  b.box('woodHoney',x-w/2,x+w/2,.08,y-.035,z-d/2,z-d/2+.022); b.box('woodHoneyDark',x-w/2+.06,x+w/2-.06,.14,y-.09,z-d/2-.003,z-d/2);
  b.box('woodHoney',x-w/2,x-w/2+.03,0,y-.035,z-d/2,z+d/2-.04); b.box('woodHoney',x+w/2-.03,x+w/2,0,y-.035,z-d/2,z+d/2-.04);
  b.box('woodHoney',x-w/2+.03,x+w/2-.03,y-.2,y-.18,z-d/2+.03,z+d/2-.06,{faces:'Yy'});
  b.solid(x-w/2,x+w/2,0,y,z-d/2,z+d/2);
}
function fan3(b,x,y,z){ b.box('white',x-.015,x+.015,y-.32,y,z-.015,z+.015); b.cyl('white',x,z,y-.42,y-.31,.11,{seg:14});
  for(let k=0;k<3;k++){ const a=k/3*6.283+.4, m=new THREE.Matrix4().makeRotationY(-a).setPosition(x,y-.38,z); const sv=b.m; b.setFrame(sv?sv.clone().multiply(m):m); b.box('white',.1,.68,-.006,.006,-.06,.06); b.box('white',.68,.72,-.006,.006,-.05,.05); b.setFrame(sv); } }
// Phòng Công nghệ – STEM (ảnh): tường vàng, kệ tổ ong trắng, bàn hình thang ghép lục giác, ghế đôn xanh
function stem(b,r){
  const {m,W,D}=roomFrame(r,r.board||'Qmax'); const h=(r.L<5?Y[r.L+1]:Y[6])-.18-Y[r.L]; const s=b.m; b.setFrame(m);
  b.box('yellowPaint',.1,W-.1,0,h,.1,.115,{faces:'Z'});
  const hex=(cx,cy,R)=>{ for(let k=0;k<6;k++){ const a0=k/6*Math.PI*2,a1=(k+1)/6*Math.PI*2,x0=cx+Math.cos(a0)*R,y0=cy+Math.sin(a0)*R,x1=cx+Math.cos(a1)*R,y1=cy+Math.sin(a1)*R,L=Math.hypot(x1-x0,y1-y0),an=Math.atan2(y1-y0,x1-x0);
    const sv=b.m; b.setFrame(sv.clone().multiply(new THREE.Matrix4().makeRotationZ(an).setPosition((x0+x1)/2,(y0+y1)/2,.12))); b.box('white',-L/2-.012,L/2+.012,-.014,.014,0,.24); b.setFrame(sv); } };
  const hr=.28,hw=hr*Math.sqrt(3);
  for(const [i,j] of [[0,0],[1,0],[2,0],[3,0],[.5,1],[1.5,1],[2.5,1],[1,2],[2,2],[1.5,-1]]) hex(W*.5-1.6+i*hw*1.0+ (j%2?0:0),h-.75-j*hr*1.5,hr);
  b.box('white',W*.08,W*.08+.3,1.1,2.6,.12,.42); for(let y=1.1;y<2.7;y+=.37) b.box('white',W*.08,W*.08+.3,y,y+.02,.12,.42);
  const tbl=(x,z,flip)=>{ const sv=b.m; b.setFrame(sv.clone().multiply(new THREE.Matrix4().makeRotationY(flip?Math.PI:0).setPosition(x,0,z)));
    b.prism('white',[[-.62,0],[.62,0],[.31,.54],[-.31,.54]],.715,.745,{collide:true});
    for(const [lx,lz] of [[-.55,.03],[.55,.03],[-.26,.5],[.26,.5]]) b.box('deskFrame',lx-.018,lx+.018,0,.715,lz-.018,lz+.018,{faces:'xXzZ'});
    b.setFrame(sv); };
  const stool=(x,z)=>{ b.cyl('stoolBlue',x,z,.44,.47,.17,{seg:14}); for(let k=0;k<4;k++){ const a=k*Math.PI/2+.6; b.rod('deskFrame',[x+Math.cos(a)*.1,.44,z+Math.sin(a)*.1],[x+Math.cos(a)*.17,0,z+Math.sin(a)*.17],.011,4); } b.solid(x-.18,x+.18,0,.47,z-.18,z+.18); };
  for(const [cx,cz] of [[W*.3,D*.36],[W*.7,D*.36],[W*.3,D*.68],[W*.7,D*.68]]){ tbl(cx,cz,false); tbl(cx,cz,true);
    for(let k=0;k<6;k++){ const a=k/6*Math.PI*2+Math.PI/6; stool(cx+Math.cos(a)*.95,cz+Math.sin(a)*.95); } }
  // bàn thao tác sát tường sau: máy in 3D, hộp linh kiện, kệ vật liệu
  b.box('wood',.3,W-.3,.86,.9,D-.85,D-.15,{collide:true}); b.box('deskFrame',.3,W-.3,0,.86,D-.8,D-.2);
  b.box('white',W*.2-.25,W*.2+.25,.9,1.42,D-.7,D-.25); b.box('screen',W*.2-.2,W*.2+.2,1.0,1.36,D-.701,D-.7,{faces:'z'});
  for(let i=0;i<6;i++){ const x=W*.4+i*.42; b.box(i%2?'stoolBlue':'courtRed',x-.17,x+.17,.9,1.04,D-.6,D-.32); }
  shelf(b,W-1.9,W-.3,D-.14-.45,D-.14,2.1,'alu',false);
  for(const a of [.25,.5,.75]) for(const f of [.2,.5,.8]) tube(b,W*a,h,D*f);
  b.setFrame(s);
}
export { roomFrame };

export function buildInteriors(b){
  for(const r of ROOMS){
    if(r.kind==='class') classroom(b,r);
    else if(r.kind==='lab') lab(b,r,'slogan');
    else if(r.kind==='comp') computer(b,r,'slogan');
    else if(r.kind==='office') office(b,r);
    else if(r.kind==='store') store(b,r);
    else if(r.kind==='wc') wc(b,r);
    else if(r.kind==='lib') library(b,r);
    else if(r.kind==='hall') hall(b,r,'slogan');
    else if(r.kind==='stem') stem(b,r);
  }
  // Đèn trần hành lang
  for(const L of [1,2,3,4,5]){ const h=(L<5?Y[L+1]:Y[6])-.18;
    for(let p=340;p<695;p+=43) tube(b,X(140),h,Z(p),true);
    if(L>1) for(let q=170;q<500;q+=43) tube(b,X(q),h,Z(706),false);
  }
}
