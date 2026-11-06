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
function shelf(b,x0,x1,z0,z1,h,mat='wood',books=true){
  b.box(mat,x0,x0+.03,0,h,z0,z1); b.box(mat,x1-.03,x1,0,h,z0,z1); b.box(mat,x0,x1,h-.03,h,z0,z1); b.box(mat,x0+.03,x1-.03,0,h,z0,z0+.015);
  const n=Math.max(2,Math.floor(h/.36));
  for(let i=0;i<n;i++){ const y=i*h/n; b.box(mat,x0,x1,y,y+.025,z0,z1);
    if(books) b.box('books',x0+.03,x1-.03,y+.025,y+.31,z0+.02,z1-.04,{}); }
  b.solid(x0,x1,0,h,z0,z1);
}

function classroom(b,r,slogan){
  const {m,W,D}=roomFrame(r,r.board||'Qmax'); const h=Y[r.L+1]-.18-Y[r.L];
  const s=b.m; b.setFrame(m); boardWall(b,W,D,slogan);
  // bàn giáo viên
  b.box('wood',W/2-.7,W/2+.7,.72,.76,1.2,1.85); b.box('wood',W/2-.68,W/2-.62,0,.72,1.22,1.83); b.box('wood',W/2+.62,W/2+.68,0,.72,1.22,1.83); b.box('wood',W/2-.62,W/2+.62,.2,.72,1.22,1.25); b.solid(W/2-.7,W/2+.7,0,.76,1.2,1.85);
  stool(b,W/2,.85,true,-1);
  const cols=3,cx=i=>W*(i+.5)/cols; const nRow=Math.floor((D-3)/.96);
  for(let c=0;c<cols;c++) for(let k=0;k<nRow;k++){ const z=2.75+k*.96; desk(b,cx(c),z); stool(b,cx(c)-.3,z+.42,true,1,'deskTop'); stool(b,cx(c)+.3,z+.42,true,1,'deskTop'); }
  // tủ cuối lớp
  b.box('wood',.3,1.5,0,1.8,D-.48,D-.1,{collide:true}); b.box('plastic',.32,1.48,.04,1.76,D-.5,D-.48);
  // quạt trần và đèn
  for(const a of [.3,.7]) for(const f of [.32,.72]) fan(b,W*a,h,D*f);
  for(const a of [.2,.5,.8]) for(const f of [.2,.52,.84]) tube(b,W*a,h,D*f);
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
  if(D>3.2){ b.box('white',.5,W-.5,.8,.86,D-.62,D-.1,{collide:true}); for(let x=.9;x<W-.7;x+=.95){ b.cyl('white',x,D-.37,.86,.92,.2,{seg:12}); b.rod('inox',[x,.9,D-.12],[x,1.05,D-.25],.012); }
    b.box('inox',.5,W-.5,1.2,2.2,D-.1,D-.09); }
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
function hall(b,r){
  const {m,W,D}=roomFrame(r,'Qmin'); const h=Y[r.L+1]-.18-Y[r.L]; const s=b.m; b.setFrame(m);
  // Phòng hội đồng: phòng họp mở, dãy ghế gỗ hướng về bàn chủ toạ, băng rôn khẩu hiệu đỏ trên tường trước
  b.box('boardFrame',W*.12,W*.88,h-1.22,h-.4,.1,.14);
  b.poly('motto',[[W*.13,h-1.16,.146],[W*.87,h-1.16,.146],[W*.87,h-.46,.146],[W*.13,h-.46,.146]],[0,0,1],[[0,0],[1,0],[1,1],[0,1]]);
  // bản đồ Việt Nam khung gỗ trên tường bên
  b.box('boardFrame',W*.035,W*.035+.07,1.3,2.56,.04,.92);
  b.poly('vnmap',[[W*.035+.05,1.36,.1],[W*.035+.05,1.36,.86],[W*.035+.05,2.5,.86],[W*.035+.05,2.5,.1]],[1,0,0],[[0,0],[1,0],[1,1],[0,1]]);
  // Bàn chủ toạ phủ khăn trắng chạm sàn
  for(const zt of [1.4,2.35]){ b.box('white',W*.22,W*.78,0,.74,zt-.3,zt+.3,{collide:true}); b.box('white',W*.22,W*.78,.74,.77,zt-.34,zt+.34); }
  // Ghế gỗ đệm sẫm, lưng tựa ở phía +z nên người ngồi quay về bàn chủ toạ
  const chair=(x,z)=>{
    b.box('wood',x-.21,x+.21,.42,.45,z-.2,z+.2); b.box('plasticDark',x-.185,x+.185,.45,.49,z-.17,z+.17,{faces:'Y'});
    b.box('wood',x-.21,x+.21,.49,.92,z+.145,z+.2); b.box('plasticDark',x-.185,x+.185,.54,.88,z+.152,z+.178,{faces:'xXYz'});
    for(const dx of [-1,1]) for(const dz of [-1,1]) b.box('wood',x+dx*.18-.022,x+dx*.18+.022,0,.42,z+dz*.17-.022,z+dz*.17+.022,{faces:'xXzZ'});
    b.solid(x-.21,x+.21,0,.92,z-.2,z+.22);
  };
  for(const x of [W*.32,W*.5,W*.68]) chair(x,.95);
  const ax=W*.5;
  for(let z=3.7;z<D-.85;z+=1.05) for(let x=.85;x<W-.6;x+=.78){ if(Math.abs(x-ax)<.52) continue; chair(x,z); }
  // Đèn tuýp, máy lạnh cassette âm trần, quạt trần như ảnh
  for(const a of [.22,.5,.78]) for(let f=.1;f<1;f+=.16) tube(b,W*a,h,D*f);
  for(const a of [.3,.7]) for(let f=.2;f<1;f+=.27){ const cx=W*a,cz=D*f; b.box('white',cx-.42,cx+.42,h-.09,h,cz-.42,cz+.42,{faces:'y'}); b.box('alu',cx-.44,cx+.44,h-.12,h-.09,cz-.44,cz+.44,{faces:'xXyzZ'}); b.box('plasticDark',cx-.13,cx+.13,h-.1,h-.08,cz-.13,cz+.13,{faces:'y'}); }
  for(const a of [.2,.8]) for(const f of [.3,.66]) fan(b,W*a,h,D*f);
  b.setFrame(s);
}

export function buildInteriors(b){
  for(const r of ROOMS){
    if(r.kind==='class') classroom(b,r,'slogan');
    else if(r.kind==='lab') lab(b,r,'slogan');
    else if(r.kind==='comp') computer(b,r,'slogan');
    else if(r.kind==='office') office(b,r);
    else if(r.kind==='store') store(b,r);
    else if(r.kind==='wc') wc(b,r);
    else if(r.kind==='lib') library(b,r);
    else if(r.kind==='hall') hall(b,r,'slogan');
  }
  // Đèn trần hành lang
  for(const L of [1,2,3,4,5]){ const h=(L<5?Y[L+1]:Y[6])-.18;
    for(let p=340;p<695;p+=43) tube(b,X(140),h,Z(p),true);
    if(L>1) for(let q=170;q<500;q+=43) tube(b,X(q),h,Z(706),false);
  }
}
