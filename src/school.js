import * as THREE from 'three';
import { X,Z,M,S,Y,ROOMS,SLABS,RAILS,COLS,WEST_COLS,PERGOLA_P,PERGOLA_Q,ROOF_RECTS,ROOF_MID,SKYLIGHT } from './plan.js';
import { frameM } from './builder.js';

const LV=[1,2,3,4,5];

// Ô gạch hoa gió thật có chiều sâu: nhìn gần thấy lỗ thoáng, nắng lọt qua thành vệt bóng
export function lattice(b,mat,w,h,d,cw=.2,ch=.25,ins=.022){
  const nx=Math.max(1,Math.round(w/cw)),ny=Math.max(1,Math.round(h/ch)),W=w/nx,H=h/ny;
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){
    const x0=i*W,y0=j*H,x1=x0+W,y1=y0+H,cx=x0+W/2,cy=y0+H/2,hw=W/2-ins,hh=H/2-ins;
    const dm=[[cx-hw,cy],[cx,cy-hh],[cx+hw,cy],[cx,cy+hh]];   // lỗ hình thoi
    const o=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
    const s=(p,zz)=>[p[0],p[1],zz], t=p=>[p[0],p[1]];
    const pairs=[[o[0],dm[1],dm[0]],[o[0],o[1],dm[1]],[o[1],dm[2],dm[1]],[o[1],o[2],dm[2]],[o[2],dm[3],dm[2]],[o[2],o[3],dm[3]],[o[3],dm[0],dm[3]],[o[3],o[0],dm[0]]];
    for(const q of pairs){ b.poly(mat,[s(q[0],d),s(q[1],d),s(q[2],d)],[0,0,1],q.map(t)); b.poly(mat,[s(q[0],0),s(q[2],0),s(q[1],0)],[0,0,-1],[t(q[0]),t(q[2]),t(q[1])]); }
    for(let k=0;k<4;k++){ const A=dm[k],B=dm[(k+1)%4],nx2=-(B[1]-A[1]),ny2=(B[0]-A[0]),l=Math.hypot(nx2,ny2);
      b.poly(mat,[s(A,0),s(B,0),s(B,d),s(A,d)],[nx2/l,ny2/l,0],[[A[0],0],[B[0],0],[B[0],d],[A[0],d]]); }
  }
}
function framedPanel(b,M4,w,h,d=.12){
  const save=b.m; const m=save?save.clone().multiply(M4):M4; b.setFrame(m);
  lattice(b,'terra',w,h,d);
  const f=.045; b.box('white',-f,w+f,-f,0,-.02,d+.02); b.box('white',-f,w+f,h,h+f,-.02,d+.02); b.box('white',-f,0,0,h,-.02,d+.02); b.box('white',w,w+f,0,h,-.02,d+.02);
  b.setFrame(save);
}

function winFn(kind='win'){
  return (b,s,e,y0,y1,c,alongX,t)=>{
    const F=.05,W=e-s,n=Math.max(1,Math.round(W/1.05));
    const bx=(a0,a1,yy0,yy1,tt)=>{ if(alongX) b.box('alu',a0,a1,yy0,yy1,c-tt,c+tt); else b.box('alu',c-tt,c+tt,yy0,yy1,a0,a1); };
    bx(s,e,y0,y0+F,.05); bx(s,e,y1-F,y1,.05); bx(s,s+F,y0,y1,.05); bx(e-F,e,y0,y1,.05);
    for(let i=1;i<n;i++){ const a=s+i*W/n; bx(a-.022,a+.022,y0,y1,.04); }
    if(y1-y0>1.5) bx(s,e,y1-.56,y1-.52,.04);
    if(alongX){ b.box('glass',s,e,y0,y1,c-.006,c+.006); b.solid(s,e,y0,y1,c-.05,c+.05); } else { b.box('glass',c-.006,c+.006,y0,y1,s,e); b.solid(c-.05,c+.05,y0,y1,s,e); }
  };
}
function doorFn(sign){
  return (b,s,e,y0,y1,c,alongX,t)=>{
    const F=.07,off=sign*(t/2+.045),L=e-s-2*F;
    const bx=(a0,a1,yy0,yy1)=>{ if(alongX) b.box('alu',a0,a1,yy0,yy1,c-t/2-.012,c+t/2+.012); else b.box('alu',c-t/2-.012,c+t/2+.012,yy0,yy1,a0,a1); };
    bx(s,s+F,y0,y1); bx(e-F,e,y0,y1); bx(s,e,y1-F,y1);
    // cánh cửa mở sát tường hành lang, phần trên lắp kính như ảnh
    const lf=(a0,a1,yy0,yy1,mat)=>{ if(alongX) b.box(mat,a0,a1,yy0,yy1,c+off-.018,c+off+.018); else b.box(mat,c+off-.018,c+off+.018,yy0,yy1,a0,a1); };
    lf(e,e+L,y0+.01,y0+.95,'door'); lf(e,e+L,y1-.25,y1-.1,'door'); lf(e,e+.08,y0+.95,y1-.25,'door'); lf(e+L-.08,e+L,y0+.95,y1-.25,'door'); lf(e+.08,e+L-.08,y0+.95,y1-.25,'glass');
    lf(e+L-.14,e+L-.05,y0+.92,y0+1.05,'inox');
  };
}
function breezeFn(){
  return (b,s,e,y0,y1,c,alongX,t)=>{
    const save=b.m; const m=new THREE.Matrix4();
    if(alongX){ m.makeTranslation(s,y0,c-.07); }
    else { m.makeBasis(new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0),new THREE.Vector3(-1,0,0)); m.setPosition(c+.07,y0,s); }
    b.setFrame(m); lattice(b,'breeze',e-s,y1-y0,.14,.2,.2,.03); b.setFrame(save);
    if(alongX) b.solid(s,e,y0,y1,c-.07,c+.07); else b.solid(c-.07,c+.07,y0,y1,s,e);
  };
}

function roomOpenings(r,side,len){
  const O=[]; const dsign={Qmax:1,Qmin:-1,Pmax:-1,Pmin:1}[side];
  if(side===r.door){
    const big=['class','lab','comp','lib','hall'].includes(r.kind);
    if(r.kind==='wc'){ const cx=Math.min(1.1,len/2-.8); O.push({s:cx,e:cx+1.5,h0:0,h1:2.45,fn:doorFn(dsign)});
      if(len>4) O.push({s:cx+2.4,e:len-.8,h0:1.5,h1:3.0,fn:breezeFn()}); }
    else if(big){ const dw=r.kind==='lib'||r.kind==='hall'?1.8:1.25; O.push({s:.45,e:.45+dw,h0:0,h1:2.45,fn:doorFn(dsign)}); O.push({s:len-.45-dw,e:len-.45,h0:0,h1:2.45,fn:doorFn(dsign)});
      const a=.45+dw+.5,bb=len-.45-dw-.5,n=Math.max(1,Math.floor((bb-a)/2.3));
      for(let i=0;i<n;i++){ const w=(bb-a)/n; O.push({s:a+i*w+.12,e:a+(i+1)*w-.12,h0:1.05,h1:2.8,fn:winFn()}); } }
    else { O.push({s:.45,e:1.65,h0:0,h1:2.45,fn:doorFn(dsign)}); if(len>3.3) O.push({s:2.1,e:len-.45,h0:1.05,h1:2.75,fn:winFn()}); }
  }
  if(side===r.outer){
    if(r.kind==='wc'){ O.push({s:.8,e:len-.8,h0:1.4,h1:3.1,fn:breezeFn()}); }
    else { const n=Math.max(1,Math.round(len/2.9)),w=len/n; for(let i=0;i<n;i++) O.push({s:i*w+.42,e:(i+1)*w-.42,h0:r.L===1?1.0:.9,h1:3.05,fn:winFn()}); }
  }
  return O;
}

function buildRoomWalls(b){
  const seen=new Set();
  for(const r of ROOMS){
    const y0=Y[r.L],y1=Y[r.L+1]-.18;
    // sàn phòng
    const fm=r.kind==='wc'?'wcFloor':(r.kind==='lib'||r.kind==='hall'||r.kind==='office')?'floor':'classFloor';
    b.boxPQ(fm,r.P0,r.P1,r.Q0,r.Q1,y0+.002,y0+.008,{faces:'Y'});
    for(const side of ['Pmin','Pmax','Qmin','Qmax']){
      const isP=side[0]==='P',fix=r[side==='Pmin'?'P0':side==='Pmax'?'P1':side==='Qmin'?'Q0':'Q1'];
      const a=isP?r.Q0:r.P0,bb=isP?r.Q1:r.P1,key=`${r.L}|${side[0]}|${fix}|${a}|${bb}`;
      const len=M(bb-a),ops=roomOpenings(r,side,len);
      if(seen.has(key)&&!ops.length) continue; seen.add(key);
      const dado=side===r.door?{Qmax:1,Qmin:-1,Pmax:-1,Pmin:1}[side]:0;
      const opt={dado,dadoMat:'dado'};
      if(isP){ b.wall('plaster',X(a),Z(fix),X(bb),Z(fix),y0,y1,.2,ops,opt); }
      else { b.wall('plaster',X(fix),Z(bb),X(fix),Z(a),y0,y1,.2,ops,opt); }
      // cột ốp đầu tường
      if(side===r.door){ for(const p of [a,bb]){ if(isP){ b.box('plaster',X(p)-.22,X(p)+.22,y0,y1,Z(fix)-.17,Z(fix)+.17,{collide:true}); } else { b.box('plaster',X(fix)-.17,X(fix)+.17,y0,y1,Z(p)-.22,Z(p)+.22,{collide:true}); } } }
    }
  }
}

function buildOuterWalls(b){
  for(const L of [2,3,4,5]){ const y0=Y[L],y1=(L<5?Y[L+1]:Y[6])-.18,Ps=L===2?237:224;
    b.wall('plaster',X(127),Z(303),X(212),Z(303),y0,y1,.3,[{s:2.4,e:M(85)-2.4,h0:1.2,h1:3,fn:breezeFn()}]);
    b.wall('plaster',X(212),Z(303),X(212),Z(303),y0,y1,.3);
    b.boxPQ('plaster',Ps,303,210.5,213.5,y0,y1,{collide:true});
  }
}

function slab(b,P0,P1,Q0,Q1,y,topMat='floor'){
  b.boxPQ('ceil',P0,P1,Q0,Q1,y-.18,y-.012,{faces:'xXyzZ'});
  b.boxPQ(topMat,P0,P1,Q0,Q1,y-.012,y,{faces:'xXYzZ'});
  b.boxPQ('ceil',P0,P1,Q0,Q1,y-.18,y-.17,{faces:'y'});
  b.solid(X(Q0),X(Q1),y-.18,y,Z(P1),Z(P0));
}

function buildSlabs(b){
  for(const L of [2,3,4,5]){
    for(const r of SLABS[L]) slab(b,r[0],r[1],r[2],r[3],Y[L]);
    const Ps=L===2?237:224;
    const poly=[[Ps,433],[363,433],[315,458],[302,467],[Ps,467]].map(p=>[X(p[1]),Z(p[0])]);
    b.prism('ceil',poly,Y[L]-.18,Y[L]-.012,{topMat:'ceil',noTop:true});
    b.prism('floor',poly,Y[L]-.012,Y[L],{noBottom:true,collide:true});
    b.prism('plaster',poly,Y[L]-.18,Y[L]-.01,{noTop:true,noBottom:true,collide:false});
  }
}

// Lan can thép đen song đứng
function railing(b,A,B,y,o={}){
  const ax=X(A[1]),az=Z(A[0]),bx=X(B[1]),bz=Z(B[0]),L=Math.hypot(bx-ax,bz-az); if(L<.05) return;
  const h=o.h||1.1,n=Math.round(L/.12),dx=(bx-ax)/L,dz=(bz-az)/L,nx=-dz,nz=dx;
  const quad=(mat,t0,t1,y0,y1,w)=>{ const p=[[ax+dx*t0,az+dz*t0],[ax+dx*t1,az+dz*t1]];
    const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(dx,0,dz),new THREE.Vector3(0,1,0),new THREE.Vector3(nx,0,nz)).setPosition(ax,0,az);
    const s=b.m; b.setFrame(m); b.box(mat,t0,t1,y0,y1,-w,w); b.setFrame(s); };
  quad('steel',0,L,y+h-.05,y+h,.03); quad('steel',0,L,y+.1,y+.14,.018);
  for(let i=0;i<=n;i++){ const t=i/n*L; b.box('steel',ax+dx*t-.009,ax+dx*t+.009,y+.1,y+h-.04,az+dz*t-.009,az+dz*t+.009,{faces:'xXzZ'}); }
  // mép sàn dầm cao
  if(o.fascia!==false){ const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(dx,0,dz),new THREE.Vector3(0,1,0),new THREE.Vector3(nx,0,nz)).setPosition(ax,0,az); const s=b.m; b.setFrame(m); b.box('plaster',-.1,L+.1,y-.62,y+.08,-.11,.11); b.setFrame(s); }
  // tường va chạm vô hình, giữ người đi không rơi
  const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(dx,0,dz),new THREE.Vector3(0,1,0),new THREE.Vector3(nx,0,nz)).setPosition(ax,0,az);
  const s=b.m; b.setFrame(m); b.solid(-.05,L+.05,y,y+2.6,-.06,.06); b.setFrame(s);
}

function buildRails(b){
  for(const L of [2,3,4,5]) for(const [A,B] of RAILS[L]) railing(b,A,B,Y[L]);
  const y2=Y[2];
  railing(b,[237,467],[302,467],y2); railing(b,[237,433],[237,467],y2,{fascia:false});
  for(const L of [3,4,5]){ railing(b,[245,467],[302,467],Y[L]); b.solid(X(458),X(467),Y[L],Y[L]+2.6,Z(315),Z(302)); }
  b.solid(X(458),X(467),Y[2],Y[2]+2.6,Z(315),Z(302));
}

// Cầu thang chữ U trong frame cục bộ: x là rộng, z là dài. Có đường dốc va chạm vô hình.
function uStair(b,frame,o){
  const {W,fw,zL,zF,ld,levels,yOf,back=true,sides=true}=o;       // zL: hết chiếu nghỉ tầng, zF: hết bản thang
  const save=b.m; b.setFrame(frame);
  const stepsFor=(y0,y1,z0,z1,xa,xb)=>{ const n=Math.max(6,Math.round((y1-y0)/.165)),rz=(z1-z0)/n,ry=(y1-y0)/n;
    for(let i=0;i<n;i++){ const zz=z0+i*rz; b.box('stair',xa,xb,y0+i*ry,y0+(i+1)*ry,Math.min(zz,zz+rz),Math.max(zz,zz+rz)); b.box('ceil',xa,xb,y0+i*ry-.22,y0+i*ry,Math.min(zz,zz+rz),Math.max(zz,zz+rz),{faces:'xXy'}); }
    b.colQuad([xa,y0,z0],[xb,y0,z0],[xb,y1,z1],[xa,y1,z1]); b.colQuad([xa,y0-.05,z0],[xb,y0-.05,z0],[xb,y1-.05,z1],[xa,y1-.05,z1]);
  };
  for(const l of levels){
    const y0=yOf(l),y1=yOf(l+1),ym=(y0+y1)/2;
    if(zL>0.01&&l>1) {} 
    stepsFor(y0,ym,zL,zF,0,fw);                      // nhánh A đi lên
    b.box('stair',0,W,ym-.012,ym,zF,zF+ld,{collide:false,faces:'xXYzZ'}); b.box('ceil',0,W,ym-.18,ym-.012,zF,zF+ld,{faces:'xXyzZ'}); b.solid(0,W,ym-.18,ym,zF,zF+ld);
    stepsFor(ym,y1,zF,zL,W-fw,W);                    // nhánh B quay về
    // lan can giữa hai nhánh
    const mx=fw+.11,nx=W-fw-.11;
    for(const xx of [mx,nx]){ const aY=xx===mx?y0:y1,bY=ym; const n=Math.round((zF-zL)/.12);
      for(let i=0;i<=n;i++){ const t=i/n,zz=zL+(zF-zL)*t,yy=aY+(bY-aY)*t; b.box('steel',xx-.009,xx+.009,yy+.02,yy+1.02,zz-.009,zz+.009,{faces:'xXzZ'}); }
      b.rod('steel',[xx,aY+1.03,zL],[xx,bY+1.03,zF],.022,6);
      b.solid(xx-.04,xx+.04,Math.min(aY,bY),Math.max(aY,bY)+2.2,zL,zF);
    }
    // tấm chắn giữa hai nhánh
    if(o.mid) b.box('plaster',fw+.03,W-fw-.03,y0,y1-.18,zL,zF-.02,{collide:true});
    // chiếu nghỉ tầng
    if(zL>.01){ const yt=yOf(l+1); b.box('floor',0,W,yt-.012,yt,0,zL,{faces:'xXYzZ'}); b.box('ceil',0,W,yt-.18,yt-.012,0,zL,{faces:'xXyzZ'}); b.solid(0,W,yt-.18,yt,0,zL); }
  }
  if(zL>.01){ const yt=yOf(levels[0]); if(yt>.5){ b.box('floor',0,W,yt-.012,yt,0,zL,{faces:'xXYzZ'}); } }
  b.setFrame(save);
}

function buildStairs(b,extras){
  const yOf=l=>Y[l];
  // S1: cầu thang chính khối Tây, ôm quanh thang máy
  const f1=frameM(540,127,1,0,0,-1);
  uStair(b,f1,{W:M(66),fw:M(22),zL:0,zF:2.8,ld:M(47)-2.8,levels:[1,2,3,4,5],yOf,mid:false});
  // thang máy
  b.boxPQ('darkTile',562.5,583.5,127-M(0)-27,127,0,Y[6]+2.6,{collide:true});
  for(const L of LV){ b.boxPQ('inox',567,579,127,127.25,Y[L],Y[L]+2.2); }
  // tường sau và buồng thang mái
  for(const L of LV) b.wall('plaster',X(80),Z(606),X(80),Z(540),Y[L],Y[L+1]-.18,.2,[{s:1.8,e:M(66)-1.8,h0:1.3,h1:3.1,fn:breezeFn()}]);
  b.boxPQ('plaster',534,540,57,127,Y[6]-.2,Y[6]+2.9,{collide:true});
  b.boxPQ('plaster',606,612,57,127,Y[6]-.2,Y[6]+2.9,{collide:true});
  b.boxPQ('plaster',534,612,75,80,Y[6]-.2,Y[6]+2.9,{collide:true});
  b.boxPQ('roofTop',530,616,71,131,Y[6]+2.9,Y[6]+3.1,{collide:true});
  // lối ra mái
  b.boxPQ('stain',540,606,127,128,Y[6]+2.5,Y[6]+2.9);
  // S2: cầu thang đầu khối Bắc
  const f2=frameM(716.5,467,1,0,0,1);
  uStair(b,f2,{W:M(71.5),fw:M(31),zL:M(13),zF:M(13)+2.75,ld:M(51)-M(13)-2.75,levels:[1,2,3,4],yOf,mid:false});
  for(const L of LV){ const y0=Y[L],y1=L<5?Y[L+1]-.18:Y[6]-.18;
    b.boxPQ('plaster',788-2,788,467,519,y0,y1,{collide:true});
    b.boxPQ('plaster',716.5-2,716.5,480,519,y0,y1,{collide:true});
    b.wall('plaster',X(519),Z(788),X(519),Z(716.5),y0,y1,.2,[{s:1.4,e:M(71.5)-1.4,h0:1.2,h1:3.2,fn:breezeFn()}]);
  }
  // S3: cầu thang chéo cạnh thang máy, khối giữa
  const f3=frameM(363,433,-48,25,23,46);
  const f3W=Math.hypot(48,25)/S,f3L=Math.hypot(23,46)/S;
  uStair(b,f3,{W:f3W,fw:2.4,zL:1.2,zF:3.95,ld:f3L-3.95,levels:[1,2,3,4],yOf,mid:false});
  const s=b.m; b.setFrame(f3);
  for(const L of LV){ const y0=Y[L],y1=L<5?Y[L+1]-.18:Y[6]-.18;
    b.box('plaster',-.2,0,y0,y1,.0,f3L,{collide:L>1||L==1,faces:'xXYyzZ'});
    if(L>1) b.box('plaster',f3W,f3W+.2,y0,y1,1.2,f3L,{collide:true});
    if(L>1) b.box('plaster',-.2,f3W+.2,y0,y1,f3L,f3L+.2,{collide:true});
  }
  // thang máy chéo
  b.box('darkTile',f3W+.1,f3W+2.6,0,Y[6]+2.2,.2,2.8,{collide:true});
  for(const L of LV){ b.box('inox',f3W+.75,f3W+1.95,Y[L],Y[L]+2.2,.17,.2); }
  // lõi cột dưới
  b.setFrame(s);
  // khối đặc phía nam đầu đường chéo, tầng 2 trở lên
  const mass=[[363,433],[397,433],[399.5,471.8],[386,479]].map(p=>[X(p[1]),Z(p[0])]);
  b.prism('plaster',mass,Y[2]-.5,Y[6],{collide:true});
  // S4: cầu thang khán đài sân đa năng, từ sân lên tầng 2
  const Qa=358,Qb=424,Pa=325,Pb=397; const nS=24,ry=(Y[2])/nS,rq=(Qb-Qa)/nS;
  for(let i=0;i<nS;i++){ const q0=Qa+i*rq,yy=i*ry; const mat=(i%3===2)?'stepBlue':'stepBlue';
    b.boxPQ(mat,Pa,Pb,q0,q0+rq,0,yy+ry,{faces:'xXYz'}); b.boxPQ('stepEdge',Pa,Pb,q0-.25,q0+.05,yy+ry-.05,yy+ry+.002,{faces:'Yz'}); }
  b.boxPQ('stepBlue',Pa,Pb,Qb-.1,Qb,0,Y[2]-.18,{faces:'Z'});
  b.colQuad([X(Qa),0,Z(Pa)],[X(Qb),Y[2],Z(Pa)],[X(Qb),Y[2],Z(Pb)],[X(Qa),0,Z(Pb)]);
  b.solid(X(Qa),X(Qb),0,Y[2]+.5,Z(Pa)+.02,Z(Pa)+.02+.2);
  b.solid(X(Qa),X(Qb),0,Y[2]+.5,Z(Pb)-.2,Z(Pb));
  for(const Pp of [Pa,Pb]){ const nB=Math.round(M(Qb-Qa)/.12); for(let i=0;i<=nB;i++){ const t=i/nB,qq=Qa+(Qb-Qa)*t,yy=t*Y[2]; b.box('steel',X(qq)-.009,X(qq)+.009,yy,yy+1.05,Z(Pp)-.009,Z(Pp)+.009,{faces:'xXzZ'}); }
    b.rod('steel',[X(Qa),1.07,Z(Pp)],[X(Qb),Y[2]+1.07,Z(Pp)],.024,6); }
  // bệ cắt trục bên dưới bậc
}

function buildCols(b){
  for(const [p,q,r] of COLS){ const top=(p>=700)?Y[2]-.18:((p>=303&&p<=400)?Y[3]-.18:Y[2]-.18);
    b.cyl(r<.3?'plaster':'mosaic',X(q),Z(p),0,top,r,{collide:true,seg:24,caps:false}); }
  for(const p of WEST_COLS){ for(const L of [1,2,3,4,5]){ const y0=Y[L],y1=(L<5?Y[L+1]:Y[6])-.18;
      if(L<=2) b.cyl('mosaic',X(151),Z(p),y0,y1,.3,{collide:true,seg:24,caps:false}); else b.box('plaster',X(151)-.14,X(151)+.14,y0,y1,Z(p)-.14,Z(p)+.14,{collide:true});
      b.boxPQ('ceil',p-1.5,p+1.5,127,153,y1-.52,y1,{}); } }
  // Dầm và cột hàng hiên khối Bắc, khối giữa, khối Nam
  const cross=(P0,P1,Qs,Ls,col)=>{ for(const q of Qs) for(const L of Ls){ const y1=(L<5?Y[L+1]:Y[6])-.18; b.boxPQ('ceil',P0,P1,q-1.5,q+1.5,y1-.5,y1);
      if(col!==undefined) b.box('plaster',X(q)-.15,X(q)+.15,Y[L],y1,Z(col)-.17,Z(col)+.17,{collide:true}); } };
  cross(695,716.5,[153,210,253,296,339,381,424,467,510],[2,3,4,5],695);
  cross(303,325,[168,211,254,297,340,382,424],[3,4,5],303);
  cross(397,417,[168,211,254,297,340,382],[3,4,5],417);
  cross(224,247,[255,297,340,382,424],[3,4,5],247);
  cross(237,264,[255,297,340,382,424],[2],264);
  for(const L of [2,3,4,5]){ const y1=(L<5?Y[L+1]:Y[6])-.18; b.boxPQ('plaster',788,800,127,128.5,Y[L],y1); b.boxPQ('plaster',788,800,465.5,467,Y[L],y1); }
}

// Hai dầm dàn hoa ở phía đường Yên Bái, cao bằng sàn tầng 3
function buildPergola(b){
  const y=Y[3];
  for(const q of PERGOLA_Q){
    const beamQ=[q-3,q+3];
    b.boxPQ('plaster',396,697,beamQ[0],beamQ[1],y-.95,y-.1,{});
    b.boxPQ('plaster',396,697,beamQ[0]-1.2,beamQ[1]+1.2,y-.1,y+.42,{faces:'xXyzZ'});
    b.boxPQ('earth',396,697,beamQ[0]-.9,beamQ[1]+.9,y+.3,y+.42,{faces:'Y'});
    for(const p of PERGOLA_P) b.cyl('mosaic',X(q),Z(p),0,y-.95,.24,{collide:true,seg:20,caps:false});
    b.cyl('mosaic',X(q),Z(393),0,y-.95,.24,{collide:true,seg:20,caps:false});
    railing(b,[396,q],[697,q],y+.42,{fascia:false,h:.8});
  }
  for(const p of [396,...PERGOLA_P]){ b.boxPQ('plaster',p-2,p+2,433,515,y-.75,y-.1); }
  // lam ngang thưa nối hai dầm
  for(let p=412;p<694;p+=16) b.boxPQ('plaster',p-.7,p+.7,439,509,y-.36,y-.1);
  // Dải bồn cây tầng 2 khối Tây
  const yp=Y[2];
  b.boxPQ('plaster',418,695,153,170,yp-.45,yp+.65,{faces:'xXyzZ',collide:false});
  b.boxPQ('earth',418,695,154,169,yp+.55,yp+.66,{faces:'Y'});
}

function buildLatticeFacades(b){
  // Mặt tiền khối Tây quay ra sân, tầng 3-5: panel lệch tầng so le, kẹp giữa các lam đứng
  const bays=[417,453.6,496,538,572,607,650,695];
  for(const L of [3,4,5]) for(let i=0;i<bays.length-1;i++){
    const p0=bays[i],p1=bays[i+1],w=M(p1-p0),pw=w/2-.26,h=3.0;
    for(const k of [0,1]){
      const dy=((i+k+L)%2)?.28:.55;
      const ps=p0+M(0)+(k?(p0+p1)/2-p0:0)+1.2;
      const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(0,0,-1),new THREE.Vector3(0,1,0),new THREE.Vector3(1,0,0)).setPosition(X(160),Y[L]+dy,Z(ps));
      framedPanel(b,m,pw,h);
    }
  }
  for(const p of bays) b.boxPQ('plaster',p-1.2,p+1.2,153,164,Y[3]-.2,Y[6],{collide:false});
  // Mặt sau khối Tây
  for(const L of [3,4,5]) for(let p=372;p<680;p+=44){ if(p>530&&p<606) continue;
    const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(0,0,-1),new THREE.Vector3(0,1,0),new THREE.Vector3(1,0,0)).setPosition(X(50),Y[L]+(((p+L)%2)?.3:.55),Z(p));
    framedPanel(b,m,2.1,3.0); }
  // Đầu hồi cong phía Yên Bái: khối Nam và khối Bắc, 4 hàng 4 cột
  const bow=(Pc,hw,Q0,sag,Ls)=>{
    const seg=4;
    for(const L of Ls) for(let c=0;c<seg;c++){
      const a0=c/seg,a1=(c+1)/seg,pa=Pc-hw+2*hw*a0,pb=Pc-hw+2*hw*a1,s=t=>sag*(1-Math.pow(2*t-1,2)),qa=Q0+s(a0)*S,qb=Q0+s(a1)*S;
      const dir=new THREE.Vector3(X(qb)-X(qa),0,Z(pb)-Z(pa)),len=dir.length()-.34; dir.normalize();
      const nor=new THREE.Vector3(-dir.z,0,dir.x); if(nor.x<0) nor.negate();
      const m=new THREE.Matrix4().makeBasis(dir,new THREE.Vector3(0,1,0),nor).setPosition(X(qa)+dir.x*.17,Y[L]+(((c+L)%2)?.2:.5),Z(pa)+dir.z*.17);
      framedPanel(b,m,len,3.0);
    }
    for(const L of Ls.concat([Ls[Ls.length-1]+1])){ const pts=[]; for(let i=0;i<=10;i++){ const t=i/10; pts.push([X(Q0+(sag+.25)*S*(1-Math.pow(2*t-1,2))+.25*S),Z(Pc-hw+2*hw*t)]); } pts.push([X(Q0-1),Z(Pc+hw)]); pts.push([X(Q0-1),Z(Pc-hw)]);
      b.prism('plaster',pts,Y[L]-.5,Y[L]+.04,{}); }
  };
  bow(190,50,516,.55,[2,3,4,5]);
  bow(751,41,523,.55,[2,3,4,5]);
  // Khối xiên đón cổng chính: hàng gạch hoa gió tầng 3-5
  const f3=frameM(363,433,-48,25,23,46),f3W=Math.hypot(48,25)/S,f3L=Math.hypot(23,46)/S;
  const s=b.m;
  const base=new THREE.Matrix4().multiplyMatrices(f3,new THREE.Matrix4().makeTranslation(0,0,f3L+.32));
  b.setFrame(base);
  const nC=3; for(const L of [3,4,5]) for(let c=0;c<nC;c++){ const w=(f3W+2.2)/nC; const m=new THREE.Matrix4().makeTranslation(-1.1+c*w+.1,Y[L]+((c+L)%2?.25:.55),0); framedPanel(b,m,w-.22,3.0); }
  // cột tường bo khung
  b.box('plaster',-1.25,-1.05,Y[3]-.3,Y[6]+.2,-.34,.2); b.box('plaster',f3W+1.05,f3W+1.25,Y[3]-.3,Y[6]+.2,-.34,.2);
  b.setFrame(s);
}

function gable(b,P0,P1,Q0,Q1,alongQ){
  const ye=Y[6]+.1,yr=Y[6]+.66;
  const x0=X(Q0),x1=X(Q1),z1=Z(P0),z0=Z(P1);
  if(alongQ){ const zm=(z0+z1)/2; const l=Math.hypot(zm-z0,yr-ye),ny=(zm-z0)/l,nz=(yr-ye)/l;
    b.poly('roof',[[x0,ye,z1],[x1,ye,z1],[x1,yr,zm],[x0,yr,zm]],[0,ny,nz],[[0,x0],[0,x1],[l,x1],[l,x0]].map(p=>[p[1],p[0]]));
    b.poly('roof',[[x1,ye,z0],[x0,ye,z0],[x0,yr,zm],[x1,yr,zm]],[0,ny,-nz],[[x1,0],[x0,0],[x0,l],[x1,l]]);
    b.poly('plaster',[[x1,ye,z1],[x1,ye,z0],[x1,yr,zm]],[1,0,0],[[0,0],[1,0],[.5,1]]);
    b.poly('plaster',[[x0,ye,z0],[x0,ye,z1],[x0,yr,zm]],[-1,0,0],[[0,0],[1,0],[.5,1]]);
    b.solid(x0,x1,Y[6],Y[6]+1.4,z0,z1);
  } else { const xm=(x0+x1)/2; const l=Math.hypot(xm-x0,yr-ye),ny=(xm-x0)/l,nx=(yr-ye)/l;
    b.poly('roof',[[x0,ye,z1],[xm,yr,z1],[xm,yr,z0],[x0,ye,z0]].reverse(),[-nx,ny,0],[[0,z0],[l,z0],[l,z1],[0,z1]].map(p=>[p[1],p[0]]));
    b.poly('roof',[[x1,ye,z0],[xm,yr,z0],[xm,yr,z1],[x1,ye,z1]],[nx,ny,0],[[z0,0],[z0,l],[z1,l],[z1,0]].reverse());
    b.poly('plaster',[[x0,ye,z1],[x1,ye,z1],[xm,yr,z1]],[0,0,1],[[0,0],[1,0],[.5,1]]);
    b.poly('plaster',[[x1,ye,z0],[x0,ye,z0],[xm,yr,z0]],[0,0,-1],[[0,0],[1,0],[.5,1]]);
    b.solid(x0,x1,Y[6],Y[6]+1.4,z0,z1);
  }
}

function parapetRect(b,P0,P1,Q0,Q1,gaps=[]){
  const y0=Y[6]-.6,y1=Y[6]+.9,t=2.4;
  b.boxPQ('plaster',P0,P1,Q0,Q0+t,y0,y1,{collide:true});
  b.boxPQ('plaster',P0,P1,Q1-t,Q1,y0,y1,{collide:true});
  b.boxPQ('plaster',P0,P0+t,Q0,Q1,y0,y1,{collide:true});
  b.boxPQ('plaster',P1-t,P1,Q0,Q1,y0,y1,{collide:true});
}

function buildRoof(b){
  const y=Y[6];
  const pieces=[[292,540,45,155],[540,606,45,80],[540,606,127,155],[606,694,45,155],[694,800,45,517],[137,243,205,517]];
  for(const r of pieces){ b.boxPQ('ceil',r[0],r[1],r[2],r[3],y-.18,y-.02,{faces:'y'}); b.boxPQ('roofTop',r[0],r[1],r[2],r[3],y-.04,y,{faces:'Y'}); b.solid(X(r[2]),X(r[3]),y-.18,y,Z(r[1]),Z(r[0])); }
  const wallP=(P0,P1,Q0,Q1)=>b.boxPQ('plaster',P0,P1,Q0,Q1,y-.6,y+.9,{collide:true});
  wallP(292,800,45,47.4); wallP(292,694,152.6,155); wallP(292,294.4,45,155);
  wallP(797.6,800,45,517); wallP(694,696.4,155,517); wallP(694,800,514.6,517);
  parapetRect(b,137,243,205,517);
  gable(b,296,533,50,122,false); gable(b,613,690,50,122,false);
  gable(b,716,796,48,512,true);
  gable(b,144,237,210,512,true);
  // Mái khối giữa, có giếng trời
  const contour=ROOF_MID.map(p=>new THREE.Vector2(X(p[1]),-Z(p[0])));
  const a=SKYLIGHT; const hole=[[a[0],a[2]],[a[1],a[2]],[a[1],a[3]],[a[0],a[3]]].map(p=>new THREE.Vector2(X(p[1]),-Z(p[0])));
  const all=[...contour,...hole],tris=THREE.ShapeUtils.triangulateShape(contour,[hole]);
  for(const t of tris){ let A=all[t[0]],B=all[t[1]],C=all[t[2]]; if((B.x-A.x)*(C.y-A.y)-(B.y-A.y)*(C.x-A.x)<0){ const k=B;B=C;C=k; }
    b.poly('roofTop',[[A.x,y,-A.y],[B.x,y,-B.y],[C.x,y,-C.y]],[0,1,0],[[A.x,A.y],[B.x,B.y],[C.x,C.y]]);
    b.poly('ceil',[[A.x,y-.18,-A.y],[C.x,y-.18,-C.y],[B.x,y-.18,-B.y]],[0,-1,0],[[A.x,A.y],[C.x,C.y],[B.x,B.y]]);
    b.addColTri([A.x,y,-A.y],[B.x,y,-B.y],[C.x,y,-C.y]); }
  for(let i=0;i<contour.length;i++){ const A=contour[i],Bb=contour[(i+1)%contour.length],dx=Bb.x-A.x,dz=-(Bb.y-A.y),L=Math.hypot(dx,dz),m=new THREE.Matrix4().makeBasis(new THREE.Vector3(dx/L,0,dz/L),new THREE.Vector3(0,1,0),new THREE.Vector3(-dz/L,0,dx/L)).setPosition(A.x,0,-A.y); const s=b.m; b.setFrame(m); b.box('plaster',-.14,L+.14,y-.6,y+.9,-.13,.13,{collide:true}); b.setFrame(s); }
  gable(b,322,398,155,425,true);
  // Giếng trời: khung thép và kính
  const yk=y+.85;
  b.boxPQ('plaster',a[0]-1.5,a[1]+1.5,a[2]-1.5,a[2],y-.3,yk,{collide:true}); b.boxPQ('plaster',a[0]-1.5,a[1]+1.5,a[3],a[3]+1.5,y-.3,yk,{collide:true}); b.boxPQ('plaster',a[0]-1.5,a[0],a[2],a[3],y-.3,yk,{collide:true}); b.boxPQ('plaster',a[1],a[1]+1.5,a[2],a[3],y-.3,yk,{collide:true});
  for(let p=a[0];p<=a[1];p+=9.4) b.boxPQ('steel',p-.3,p+.3,a[2],a[3],yk-.04,yk+.04);
  for(let q=a[2];q<=a[3];q+=14) b.boxPQ('steel',a[0],a[1],q-.3,q+.3,yk-.04,yk+.04);
  b.boxPQ('glass',a[0],a[1],a[2],a[3],yk-.01,yk+.01);
  // bờ mái bo mặt tiền Yên Bái (dốc lên như ảnh góc phố)
  b.boxPQ('plaster',137,243,515,519,y-.2,y+.9); b.boxPQ('plaster',694,800,515,519,y-.2,y+.9);
}

function buildWestExterior(b){
  // Bệ thềm và mái che sảnh giữa khối Tây, ảnh sân trường
  b.boxPQ('floor',520,632,153,176,0,.1,{collide:true}); b.boxPQ('floor',514,638,176,184,0,.05,{collide:true});
  // nền hành lang tầng 1
  b.boxPQ('floor',303,716,127,153,.0,.02,{faces:'Y'});
  b.boxPQ('blueFascia',522,630,170,171.4,3.32,3.78);
  for(const p of [526,574,626]){ b.boxPQ('white',p-.5,p+.5,171,182,2.72,2.84); }
  for(const p of [526,626]) b.cyl('alu',X(181),Z(p),0,2.76,.05,{seg:10,collide:true});
  // mái che xanh dốc
  const x0=X(171),x1=X(182),y0=3.34,y1=2.8,z0=Z(632),z1=Z(520),l=Math.hypot(x1-x0,y1-y0),nx=(y0-y1)/l,ny=(x1-x0)/l;
  for(let i=0;i<34;i++){ const a=z0+(z1-z0)*i/34,c=z0+(z1-z0)*(i+.46)/34; b.poly('awning',[[x0,y0,c],[x1,y1,c],[x1,y1,a],[x0,y0,a]],[nx,ny,0],[[0,0],[1,0],[1,1],[0,1]]); const c2=z0+(z1-z0)*(i+1)/34; b.poly('awning2',[[x0,y0,c2],[x1,y1,c2],[x1,y1,c],[x0,y0,c]],[nx,ny,0],[[0,0],[1,0],[1,1],[0,1]]); }
  // nền bóng sàn đa năng và đường vàng
  b.prism('concrete',[[142,207],[293,207],[293,155],[394,155],[394,425],[397,505],[142,505]].map(p=>[X(p[1]),Z(p[0])]),0,.012,{noBottom:true,noSide:true});
  // Sân cầu lông
  const P0=331,P1=390,Q0=191,Q1=318,y=.016;
  b.boxPQ('courtRed',P0-14,P1+14,Q0-14,Q1+14,0,y,{faces:'Y'}); b.boxPQ('courtGreen',P0-5,P1+5,Q0-5,Q1+5,0,y+.002,{faces:'Y'});
  const line=(a,bb,c,dd)=>b.boxPQ('courtLine',a,bb,c,dd,0,y+.004,{faces:'Y'});
  const w=.5; line(P0-w,P0+w,Q0,Q1); line(P1-w,P1+w,Q0,Q1); line(P0,P1,Q0-w,Q0+w); line(P0,P1,Q1-w,Q1+w); line(P0,P1,(Q0+Q1)/2-.9,(Q0+Q1)/2+.9);
  line(P0+M(0)+4.3-w,P0+4.3+w,Q0,Q1); line(P1-4.3-w,P1-4.3+w,Q0,Q1); line((P0+P1)/2-w,(P0+P1)/2+w,Q0,Q0+47); line((P0+P1)/2-w,(P0+P1)/2+w,Q1-47,Q1);
  line(P0,P1,Q0+7-w,Q0+7+w); line(P0,P1,Q1-7-w,Q1-7+w); line(P0,P1,Q0+45-w,Q0+45+w); line(P0,P1,Q1-45-w,Q1-45+w);
  const qm=(Q0+Q1)/2; for(const p of [P0-2,P1+2]) b.cyl('steel',X(qm),Z(p),0,1.55,.035,{seg:10,caps:false});
  b.boxPQ('white',P0-2,P1+2,qm-.02,qm+.02,1.47,1.52); b.boxPQ('plasticDark',P0-2,P1+2,qm-.012,qm+.012,.82,.84); for(let y=.9;y<1.47;y+=.08) b.boxPQ('plasticDark',P0-2,P1+2,qm-.004,qm+.004,y,y+.006); for(let p=P0-2;p<P1+2;p+=.8) b.boxPQ('plasticDark',p,p+.05,qm-.004,qm+.004,.82,1.48);
  const beamQ=[168,254,340,425],beamP=[262,326,394];
  for(const q of beamQ){ const y1=Y[3]-.18; b.boxPQ('plaster',303,396,q-2.2,q+2.2,y1-.62,y1); }
  for(const p of [326,394]){ const y1=Y[3]-.18; b.boxPQ('plaster',p-2.2,p+2.2,168,425,y1-.62,y1); }
  for(const q of [214,254,340,425]){ const y1=Y[2]-.18; b.boxPQ('plaster',155,262,q-2.2,q+2.2,y1-.55,y1); }
  for(let q=180;q<420;q+=24) for(let p=340;p<390;p+=24){ b.cyl('alu',X(q),Z(p),Y[3]-.2,Y[3]-.18,.11,{seg:12,caps:false}); b.cyl('lamp',X(q),Z(p),Y[3]-.205,Y[3]-.2,.09,{seg:12}); }
  for(let q=345;q<500;q+=24) for(let p=165;p<255;p+=26){ b.cyl('alu',X(q),Z(p),Y[2]-.2,Y[2]-.18,.11,{seg:12,caps:false}); b.cyl('lamp',X(q),Z(p),Y[2]-.205,Y[2]-.2,.09,{seg:12}); }
  // Đường vàng phân khu sân, ảnh chi tiết
  b.boxPQ('yellowLine',306,396,186,187,0,.02,{faces:'Y'}); b.boxPQ('yellowLine',306,307,186,323,0,.02,{faces:'Y'}); b.boxPQ('yellowLine',306,396,322,323,0,.02,{faces:'Y'});
  // Bảng rổ gắn cao hai đầu sân, nhìn ra giữa sân
  const hoop=(P,Q,f)=>{
    b.boxPQ('white',P-.06,P+.06,Q-.9,Q+.9,2.95,3.95,{});
    b.boxPQ('bikeRed',P-.055,P+.055,Q-.36,Q+.36,3.05,3.62,{faces:f>0?'Z':'z'});
    const zf=Z(P)+f*.26;
    b.cyl('bikeRed',X(Q),zf,2.62,2.65,.23,{seg:14,caps:false});
    b.boxPQ('steel',Math.min(P,P-f*.3),Math.max(P,P-f*.3),Q-.04,Q+.04,2.62,3.0);
    for(let a=0;a<8;a++){ const an=a/8*6.283; b.rod('white',[X(Q)+Math.cos(an)*.22,2.62,zf+Math.sin(an)*.22],[X(Q)+Math.cos(an)*.12,2.26,zf+Math.sin(an)*.12],.008,4); }
    b.boxPQ('steel',P-.08,P+.08,Q-.08,Q+.08,0,2.95,{collide:true});
  };
  hoop(392,254,1); hoop(330,254,-1);
  // Ghế nhựa đỏ xếp trong sân
  for(let i=0;i<5;i++) for(let j=0;j<4;j++){ const x=X(360+j*8.5),z=Z(346+i*8.5); b.cyl('courtRed',x,z,0,.29,.135,{seg:10,r1:.115,collide:true}); b.cyl('courtRed',x,z,.29,.315,.145,{seg:10}); }
  // Bảng CĂN TIN trên tường kho ở góc sân có mái che, quay vào sân
  const xc=X(255)+.13; b.poly('canteen',[[xc,2.9,Z(150)],[xc,2.9,Z(218)],[xc,3.78,Z(218)],[xc,3.78,Z(150)]],[1,0,0],[[0,0],[1,0],[1,1],[0,1]]);
  b.boxPQ('blueFascia',148,220,255.1,256.4,2.84,2.92);
  // Bãi xe, nền bê tông
  b.boxPQ('concrete',695,800,155,370,0,.012,{faces:'Y'}); b.boxPQ('concrete',694,790,367,512,0,.02,{faces:'Y'});
  // Viền khu đất sát thang máy
  for(const [p,q] of [[396,421],[397,424]]) {}
}

export function buildSchool(b){
  buildSlabs(b); buildRoomWalls(b); buildOuterWalls(b); buildRails(b); buildStairs(b); buildCols(b); buildPergola(b); buildLatticeFacades(b); buildRoof(b); buildWestExterior(b);
}
