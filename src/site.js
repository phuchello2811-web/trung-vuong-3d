import * as THREE from 'three';
import { X,Z,M,S,Y,SITE,GARDENS,ROUND_BEDS,STATUE,FLAG } from './plan.js';

// Bàn cào surface nets: tạo mặt cong liền mạch cho tượng
function surfaceNets(fn,min,max,res){
  const nx=Math.ceil((max[0]-min[0])/res),ny=Math.ceil((max[1]-min[1])/res),nz=Math.ceil((max[2]-min[2])/res);
  const v=new Float32Array((nx+1)*(ny+1)*(nz+1)),id=(i,j,k)=>i+(nx+1)*(j+(ny+1)*k);
  for(let k=0;k<=nz;k++) for(let j=0;j<=ny;j++) for(let i=0;i<=nx;i++) v[id(i,j,k)]=fn(min[0]+i*res,min[1]+j*res,min[2]+k*res);
  const pos=[],nor=[],idx=[],vid=new Int32Array((nx+1)*(ny+1)*(nz+1)).fill(-1);
  const corners=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]],edges=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){
    const vals=corners.map(c=>v[id(i+c[0],j+c[1],k+c[2])]); let c=0,sx=0,sy=0,sz=0;
    for(const e of edges){ const a=vals[e[0]],bb=vals[e[1]]; if((a<0)!==(bb<0)){ const t=a/(a-bb),p=corners[e[0]],q=corners[e[1]]; sx+=p[0]+(q[0]-p[0])*t; sy+=p[1]+(q[1]-p[1])*t; sz+=p[2]+(q[2]-p[2])*t; c++; } }
    if(!c) continue; vid[id(i,j,k)]=pos.length/3; const px=min[0]+(i+sx/c)*res,py=min[1]+(j+sy/c)*res,pz=min[2]+(k+sz/c)*res; pos.push(px,py,pz);
    const d=res*.5,gx=fn(px+d,py,pz)-fn(px-d,py,pz),gy=fn(px,py+d,pz)-fn(px,py-d,pz),gz=fn(px,py,pz+d)-fn(px,py,pz-d),l=Math.hypot(gx,gy,gz)||1; nor.push(gx/l,gy/l,gz/l);
  }
  const quad=(a,b,c,d,fl)=>{ if(a<0||b<0||c<0||d<0) return; if(fl) idx.push(a,c,b,a,d,c); else idx.push(a,b,c,a,c,d); };
  for(let k=1;k<nz;k++) for(let j=1;j<ny;j++) for(let i=1;i<nx;i++){
    const s=v[id(i,j,k)]<0;
    if(s!==(v[id(i+1,j,k)]<0)) quad(vid[id(i,j-1,k-1)],vid[id(i,j,k-1)],vid[id(i,j,k)],vid[id(i,j-1,k)],!s);
    if(s!==(v[id(i,j+1,k)]<0)) quad(vid[id(i-1,j,k-1)],vid[id(i,j,k-1)],vid[id(i,j,k)],vid[id(i-1,j,k)],s);
    if(s!==(v[id(i,j,k+1)]<0)) quad(vid[id(i-1,j-1,k)],vid[id(i,j-1,k)],vid[id(i,j,k)],vid[id(i-1,j,k)],!s);
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(pos.length/3*2),2)); g.setIndex(idx); return g;
}
const smin=(a,b,k)=>{ const h=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-h*h*k*.25; };
const capsule=(px,py,pz,a,b,r0,r1=r0)=>{ const bax=b[0]-a[0],bay=b[1]-a[1],baz=b[2]-a[2],pax=px-a[0],pay=py-a[1],paz=pz-a[2]; const h=Math.max(0,Math.min(1,(pax*bax+pay*bay+paz*baz)/(bax*bax+bay*bay+baz*baz))); return Math.hypot(pax-bax*h,pay-bay*h,paz-baz*h)-(r0+(r1-r0)*h); };
const ell=(px,py,pz,c,r)=>{ const dx=(px-c[0])/r[0],dy=(py-c[1])/r[1],dz=(pz-c[2])/r[2]; const k=Math.hypot(dx,dy,dz); return (k-1)*Math.min(r[0],r[1],r[2]); };
// Tượng Hai Bà Trưng cưỡi voi, đầu voi quay về phía Đông. Dựng theo ảnh, hình khối gần đúng.
function statueSDF(x,y,z){
  // voi
  let d=ell(x,y,z,[0,1.28,0],[.92,.72,.6]);
  d=smin(d,ell(x,y,z,[.92,1.5,0],[.42,.46,.42]),.2);
  d=smin(d,capsule(x,y,z,[1.2,1.5,0],[1.46,1.0,0],.14,.09),.1);
  d=smin(d,capsule(x,y,z,[1.46,1.0,0],[1.42,.5,0],.09,.06),.08);
  d=smin(d,capsule(x,y,z,[1.42,.5,0],[1.56,.28,0],.06,.04),.05);
  for(const s of [-1,1]){
    d=smin(d,ell(x,y,z,[.82,1.55,s*.5],[.3,.42,.07]),.05);
    d=smin(d,capsule(x,y,z,[1.12,1.22,s*.22],[1.45,1.1,s*.3],.05,.018),.04);
    for(const a of [-.52,.52]) d=smin(d,capsule(x,y,z,[a,1.0,s*.34],[a,.12,s*.36],.2,.17),.1);
  }
  d=smin(d,capsule(x,y,z,[-.9,1.25,0],[-1.02,.65,0],.04,.03),.04);
  // yên và tấm phủ lưng
  d=smin(d,ell(x,y,z,[-.05,1.88,0],[.55,.22,.5]),.06);
  // tấm phủ lưng chạm hoa văn và mũ đầu voi
  d=smin(d,Math.max(ell(x,y,z,[-.05,1.6,0],[.64,.52,.66]),1.1-y),.05);
  d=smin(d,ell(x,y,z,[1.02,1.78,0],[.2,.14,.34]),.06);
  // Hai Bà đứng trên lưng voi (ảnh tượng): áo dài xoè tà, khăn vấn; bà trước chỉ tay về phía trước, bà sau cầm cờ
  const fig=(ox,oz,kind)=>{
    let f=capsule(x,y,z,[ox,1.98,oz],[ox,2.78,oz],.37,.2);
    f=smin(f,capsule(x,y,z,[ox,2.78,oz],[ox,3.28,oz],.2,.165),.08);
    f=smin(f,ell(x,y,z,[ox+.04,3.18,oz],[.13,.11,.18]),.04);
    f=smin(f,capsule(x,y,z,[ox,3.3,oz],[ox,3.43,oz],.068,.06),.03);
    f=smin(f,ell(x,y,z,[ox+.01,3.57,oz],[.115,.148,.115]),.04);
    f=smin(f,ell(x,y,z,[ox-.01,3.67,oz],[.152,.068,.152]),.03);
    f=smin(f,ell(x,y,z,[ox-.01,3.745,oz],[.09,.045,.09]),.02);
    if(kind==='point'){
      f=smin(f,capsule(x,y,z,[ox,3.24,oz-.2],[ox+.42,3.42,oz-.34],.056,.046),.04);
      f=smin(f,capsule(x,y,z,[ox+.42,3.42,oz-.34],[ox+.8,3.52,oz-.42],.046,.034),.03);
      f=smin(f,capsule(x,y,z,[ox,3.22,oz+.2],[ox+.2,2.88,oz+.3],.056,.045),.04);
    } else {
      f=smin(f,capsule(x,y,z,[ox,3.24,oz-.2],[ox+.02,3.62,oz-.32],.056,.045),.04);
      f=smin(f,capsule(x,y,z,[ox,3.22,oz+.2],[ox+.2,2.92,oz+.26],.056,.045),.04);
    }
    return f; };
  d=Math.min(d,fig(.32,.08,'point'));
  d=Math.min(d,fig(-.34,-.08,'flag'));
  d=Math.min(d,capsule(x,y,z,[.05,2.88,.38],[.98,2.94,.34],.019,.012));      // thanh kiếm
  d=Math.min(d,capsule(x,y,z,[-.32,2.4,-.4],[-.32,5.05,-.4],.026));          // cán cờ
  const flagS=Math.max(Math.abs(y-4.68)-.36,Math.abs(x-(-.82))-.5,Math.abs(z+.4-Math.sin(x*3.2)*.09)-.03);
  d=Math.min(d,flagS);
  return d;
}

export function buildStatue(b){
  const cx=X(STATUE[1]),cz=Z(STATUE[0]);
  const g=surfaceNets(statueSDF,[-1.42,.0,-1.05],[1.95,5.2,1.05],.03);
  // bệ
  const y0=0;
  b.prism('statueBase',ellipse(cx,cz+.8,1.75,3.2,36),y0,.18,{collide:true});
  b.prism('statueBase',ellipse(cx,cz+.8,1.4,2.85,36),.18,.36,{collide:true});
  b.box('statueBase',cx-1.2,cx+1.2,.36,.76,cz-1.2,cz+1.2,{collide:true});
  b.box('statueBase',cx-.92,cx+.92,.76,1.7,cz-.92,cz+.92,{collide:true});
  b.box('statueBase',cx-1.02,cx+1.02,1.7,1.84,cz-1.02,cz+1.02);
  const m=new THREE.Matrix4().compose(new THREE.Vector3(cx,1.84-.08,cz),new THREE.Quaternion(),new THREE.Vector3(1.12,1.12,1.12));
  b.add('statue',g,m);
  // Cột cờ trong vòng bệ
  const fx=X(FLAG[1]),fz=Z(FLAG[0]);
  b.prism('statueBase',ellipse(fx,fz,.8,.8,24),.0,.3,{collide:true});
  b.cyl('flagPole',fx,fz,.3,16,.07,{r1:.035,seg:16,collide:true});
  b.cyl('flagPole',fx,fz,16,16.12,.07,{seg:12});
  // Chậu cây cảnh cạnh tượng
  b.cyl('statueBase',cx-.2,cz+2.5,.36,.72,.3,{r1:.42,seg:18});
  // Bia đá trắng "Tôn Sư Trọng Đạo" trong bãi cỏ trước khối Tây (ảnh sân)
  { const sx=X(200),sz=Z(505),w=.36,h=1.75,sh=new THREE.Shape();
    sh.moveTo(-w,0); sh.lineTo(w,0); sh.lineTo(w*.92,h-.3); sh.quadraticCurveTo(w*.6,h+.05,0,h); sh.quadraticCurveTo(-w*.7,h+.02,-w*.95,h-.35); sh.lineTo(-w,0);
    const g2=new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.04,bevelSize:.035,bevelSegments:3,curveSegments:10}); g2.translate(0,0,-.15);
    b.add('stele',g2,new THREE.Matrix4().makeRotationY(Math.PI/2).setPosition(sx,.2,sz)); g2.dispose();
    b.poly('steleText',[[sx+.2,.45,sz+.2],[sx+.2,.45,sz-.2],[sx+.2,1.75,sz-.2],[sx+.2,1.75,sz+.2]],[1,0,0],[[0,0],[1,0],[1,1],[0,1]]);
    b.box('statueBase',sx-.34,sx+.34,0,.2,sz-.52,sz+.52,{collide:true}); b.solid(sx-.22,sx+.22,0,2.1,sz-.42,sz+.42); }
  return {fx,fz};
}
function ellipse(cx,cz,rx,rz,n){ const p=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; p.push([cx+Math.cos(a)*rx,cz+Math.sin(a)*rz]); } return p; }

function catmull(pts,sub=6){ const out=[],n=pts.length; for(let i=0;i<n;i++){ const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n]; for(let k=0;k<sub;k++){ const t=k/sub,t2=t*t,t3=t2*t; out.push([.5*(2*p1[0]+(p2[0]-p0[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(3*p1[0]-p0[0]-3*p2[0]+p3[0])*t3),.5*(2*p1[1]+(p2[1]-p0[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(3*p1[1]-p0[1]-3*p2[1]+p3[1])*t3)]); } } return out; }

export const STELE_PQ=[505,200];
export function buildGardens(b){
  const shrubs=[];
  const placeIn=(pts,den)=>{ // rải bụi trong đa giác (x,z)
    let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9; for(const p of pts){ minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);minz=Math.min(minz,p[1]);maxz=Math.max(maxz,p[1]); }
    const inside=(x,z)=>{ let c=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ if((pts[i][1]>z)!==(pts[j][1]>z)&&x<(pts[j][0]-pts[i][0])*(z-pts[i][1])/(pts[j][1]-pts[i][1])+pts[i][0]) c=!c; } return c; };
    for(let x=minx;x<maxx;x+=den) for(let z=minz;z<maxz;z+=den){ const xx=x+Math.random()*den,zz=z+Math.random()*den; if(inside(xx,zz)) shrubs.push([xx,.22,zz]); }
  };
  for(const g of GARDENS){ const s=catmull(g.map(p=>[X(p[1]),Z(p[0])]),5);
    b.prism('concrete',s,0,.2,{noBottom:true,noTop:true,collide:true});
    b.prism('grass',s,.0,.17,{noBottom:true,noSide:true});
    placeIn(s,.62);
  }
  for(const [p,q,r] of ROUND_BEDS){ const R=M(r),c=ellipse(X(q),Z(p),R,R,28); b.prism('concrete',c,0,.3,{noBottom:true,noTop:true,collide:true}); b.prism('grass',c,0,.28,{noBottom:true,noSide:true}); placeIn(c,.42); }
  const sx=X(STELE_PQ[1]),sz=Z(STELE_PQ[0]);
  return shrubs.filter(p=>Math.hypot(p[0]-sx,p[2]-sz)>.9);
}

function pier(b,p,q,h=2.6){ const x=X(q),z=Z(p); b.box('plaster',x-.22,x+.22,0,h,z-.22,z+.22,{collide:true}); b.box('white',x-.27,x+.27,h,h+.07,z-.27,z+.27); }

export const HEDGE=[];
function fence(b,A,B,o={}){
  const ax=X(A[1]),az=Z(A[0]),bx=X(B[1]),bz=Z(B[0]),L=Math.hypot(bx-ax,bz-az),dx=(bx-ax)/L,dz=(bz-az)/L;
  const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(dx,0,dz),new THREE.Vector3(0,1,0),new THREE.Vector3(-dz,0,dx)).setPosition(ax,0,az);
  const s=b.m; b.setFrame(m);
  if(o.solid){ b.box('plaster',0,L,-.15,o.h||3,-.1,.1,{collide:true}); b.box('white',0,L,o.h||3,(o.h||3)+.06,-.14,.14); }
  else { b.box('plaster',0,L,-.15,.5,-.12,.12,{collide:true}); const n=Math.round(L/.14);
    for(let i=0;i<=n;i++){ const t=i/n*L; b.box('gateBlue',t-.012,t+.012,.5,2.35,-.012,.012,{faces:'xXzZ'}); }
    b.box('gateBlue',0,L,2.3,2.36,-.025,.025); b.box('gateBlue',0,L,.56,.6,-.025,.025);
    b.solid(0,L,0,2.4,-.05,.05);
    const np=Math.max(1,Math.round(L/4)); for(let i=0;i<=np;i++){ const t=i/np*L; b.box('plaster',t-.17,t+.17,-.15,2.55,-.17,.17,{collide:true}); b.box('white',t-.21,t+.21,2.55,2.6,-.21,.21); }
    if(o.hedge) { for(let t=.3;t<L-.3;t+=.4){ const v=m.clone(); const q=new THREE.Vector3(t,0,o.hedge).applyMatrix4(v); HEDGE.push([q.x+(Math.random()-.5)*.25,.1+Math.random()*.55,q.z+(Math.random()-.5)*.25]); HEDGE.push([q.x+(Math.random()-.5)*.25,.1+Math.random()*.2,q.z+(Math.random()-.5)*.25]); } b.box('hedge',.2,L-.2,0,.6,o.hedge-.22,o.hedge+.22); } }
  b.setFrame(s);
}

export function buildSite(b){
  // Nền đất toàn khu
  b.prism('paver',SITE.map(p=>[X(p[1]),Z(p[0])]),-.4,0,{noBottom:true,collide:true});
  // Hàng rào, tường bao
  fence(b,[292,45],[790,45],{solid:true,h:3}); fence(b,[293,205],[292,45],{solid:true,h:3}); fence(b,[135,208],[293,205],{solid:true,h:3}); fence(b,[142,543],[135,208],{solid:true,h:3});
  fence(b,[790,45],[808,250]); fence(b,[808,322],[825,530]);
  fence(b,[825,530],[557,538],{hedge:-.6}); fence(b,[497,539],[142,543],{hedge:.6});
  // Cổng chính: trụ, cửa trượt đang mở, biển tên
  const q=539.5,x=X(q),z0=Z(557),z1=Z(497);
  for(const p of [497,557]){ b.box('plaster',X(q)-.42,X(q)+.42,0,3,Z(p)-.42,Z(p)+.42,{collide:true}); b.box('white',X(q)-.5,X(q)+.5,3,3.14,Z(p)-.5,Z(p)+.5); }
  for(let p=470;p<497;p+=1.3) b.box('steel',x+.1-.015,x+.1+.015,.05,2.2,Z(p)-.015,Z(p)+.015,{faces:'xXzZ'});
  b.box('steel',x+.1-.03,x+.1+.03,2.15,2.22,Z(497),Z(470)); b.box('steel',x+.1-.03,x+.1+.03,.05,.12,Z(497),Z(470));
  b.box('steel',x+.05,x+.14,0,.03,z1,z0);
  // Bệ biển tên trường, đặt cạnh cổng về phía nam như ảnh
  b.box('plaster',x-.4,x+.25,0,2.6,Z(490),Z(460),{collide:true});
  const nx=x+.26; b.poly('gateSign',[[nx,.5,Z(460)+.0],[nx,.5,Z(490)],[nx,2.45,Z(490)],[nx,2.45,Z(460)]],[1,0,0],[[1,0],[0,0],[0,1],[1,1]].map(u=>[1-u[0],u[1]]));
  // Cổng phụ đường Phạm Hồng Thái
  for(const q2 of [250,322]) pier(b,808,q2,3);
  // Giá xe
  for(const [q0,q1,p,sg] of [[160,365,720,1],[160,365,785,-1]]){ b.boxPQ('steel',p-.5,p+.5,q0,q1,.32,.36); }
}

// Xe đạp học sinh xếp hàng trong bãi. Khối hình đơn giản nhưng đủ chi tiết nan khung.
export function buildBikes(b){
  const tor=new THREE.TorusGeometry(.33,.016,5,18),hub=new THREE.CylinderGeometry(.03,.03,.04,6); const cols=['bikeBlue','bikeRed','bikeBlack','bikeSilver','bikeBlack','bikeRed','bikeBlue','bikeBlack'];
  let idx=0;
  const one=(x,z,ry)=>{ const c=cols[(idx++)%cols.length];
    const f=new THREE.Matrix4().makeRotationY(ry).setPosition(x,0,z); const s=b.m; b.setFrame(f);
    const R1=new THREE.Matrix4().makeTranslation(-.52,.34,0),R2=new THREE.Matrix4().makeTranslation(.52,.34,0);
    b.add('tyre',tor,R1); b.add('tyre',tor,R2);
    const P={rw:[-.52,.34,0],fw:[.52,.34,0],bb:[-.04,.33,0],st:[-.14,.82,0],hd:[.34,.86,0],hl:[.32,1.02,0]};
    for(const [a,bb] of [[P.rw,P.bb],[P.rw,P.st],[P.bb,P.st],[P.bb,P.hd],[P.st,P.hd],[P.fw,P.hl]]) b.rod(c,a,bb,.014,5);
    b.rod('bikeSilver',P.hl,[.3,1.03,.26],.011,4); b.rod('bikeSilver',P.hl,[.3,1.03,-.26],.011,4);
    b.box('plasticDark',-.25,-.03,.86,.9,-.06,.06);
    b.rod('bikeSilver',[-.14,.82,0],[-.14,.86,0],.012,4);
    b.setFrame(s);
  };
  for(const [p,dir] of [[730,.0],[748,.0],[762,.0],[775,.0]]) for(let q=162;q<362;q+=4.9){ if((q>270&&q<287)) continue; if(Math.random()<.14) continue; one(X(q),Z(p),Math.PI/2+dir+(Math.random()-.5)*.1); }
  // Bãi phía đông nam
  for(let p=145;p<265;p+=4.9){ if(Math.random()<.2) continue; one(X(505),Z(p),1.45+Math.random()*.1); }
}

// Xe máy kiểu tay ga đậu dọc vỉa hè và trước phòng bảo vệ
export function buildScooters(b){
  const wheel=new THREE.TorusGeometry(.2,.055,6,14),body=new THREE.SphereGeometry(1,10,8); const cols=['bikeRed','bikeBlack','bikeSilver','bikeBlue','white','bikeBlack'];
  const one=(x,z,ry,c)=>{ const s=b.m; b.setFrame(new THREE.Matrix4().makeRotationY(ry).setPosition(x,0,z));
    b.add('tyre',wheel,new THREE.Matrix4().makeTranslation(-.62,.25,0)); b.add('tyre',wheel,new THREE.Matrix4().makeTranslation(.62,.25,0));
    b.add(c,body,new THREE.Matrix4().compose(new THREE.Vector3(-.28,.56,0),new THREE.Quaternion(),new THREE.Vector3(.5,.25,.17)));
    b.add(c,body,new THREE.Matrix4().compose(new THREE.Vector3(.5,.62,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,.4)),new THREE.Vector3(.09,.4,.17)));
    b.add('plasticDark',body,new THREE.Matrix4().compose(new THREE.Vector3(-.28,.8,0),new THREE.Quaternion(),new THREE.Vector3(.42,.075,.14)));
    b.box('plasticDark',.05,.42,.32,.36,-.14,.14); b.rod('bikeSilver',[.6,.28,0],[.47,.98,0],.022,5); b.rod('plasticDark',[.46,1,-.3],[.46,1,.3],.016,5);
    b.add(c,body,new THREE.Matrix4().compose(new THREE.Vector3(.48,.98,0),new THREE.Quaternion(),new THREE.Vector3(.09,.08,.12)));
    b.setFrame(s); };
  let i=0; for(let z=-34;z<34;z+=1.05){ if(Math.random()<.45) continue; if(z>-9&&z<-2) continue; one(27.8+Math.random()*.15,z,Math.PI*.04+(Math.random()-.5)*.14,cols[(i++)%cols.length]); }
  for(let z=-70;z<70;z+=1.1){ if(Math.random()<.68) continue; one(42.3+Math.random()*.2,z,Math.PI+(Math.random()-.5)*.14,cols[(i++)%cols.length]); }
  for(let p=700;p<790;p+=9.6){ if(Math.random()<.2) continue; one(X(395)+Math.random()*.05,Z(p)+.3,Math.PI/2+(Math.random()-.5)*.1,cols[(i++)%cols.length]); }
}

export { surfaceNets };
