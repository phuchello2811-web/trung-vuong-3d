import * as THREE from 'three';
import OSM from './osm_data.js';
import { X,Z,SITE } from './plan.js';

const mats=['facA','facB','facC','facD','facE'];
let sd=97; const R=(a=1,b)=>{ sd=(sd*16807)%2147483647; const r=(sd&0xfffff)/0xfffff; return b===undefined?r*a:a+r*(b-a); };
const area=p=>{ let a=0; for(let i=0;i<p.length;i++){ const q=p[(i+1)%p.length]; a+=p[i][0]*q[1]-q[0]*p[i][1]; } return Math.abs(a)/2; };
const roadW=k=>({primary:15,secondary:14,tertiary:12,unclassified:8,residential:8,living_street:4.5,service:3.6,trunk:18}[k]||6);

const tank=(b,x,y,z)=>{ b.box('roofTop',x-.5,x+.5,y,y+.5,z-.5,z+.5,{faces:'xXYzZ'}); b.cyl('inox',x,z,y+.5,y+1.5,.5,{seg:12}); };
function tower(b,e){
  const P=e.p; const ew=[]; for(let i=0;i<P.length;i++){ const a=P[i],c=P[(i+1)%P.length]; if(Math.abs(c[0]-a[0])>Math.abs(c[1]-a[1])) ew.push([a,c]); }
  ew.sort((m,n)=>(m[0][1]+m[1][1])-(n[0][1]+n[1][1]));
  const ord=s=>s[0][0]<s[1][0]?s:[s[1],s[0]]; const N=ord(ew[0]),So=ord(ew[1]);
  const mix=(u,v,t)=>[u[0]+(v[0]-u[0])*t,u[1]+(v[1]-u[1])*t],Nm=mix(N[0],N[1],.48),Sm=mix(So[0],So[1],.48),h=107;
  b.prism('towerBeige',[N[0],Nm,Sm,So[0]],-.3,h,{topMat:'roofTop',collide:true});
  b.prism('towerGlass',[Nm,N[1],So[1],Sm],-.3,h-6,{topMat:'roofTop',collide:true});
  // Bệ thấp và mái kỹ thuật
  const c=[(N[0][0]+So[1][0])/2,(N[0][1]+So[1][1])/2]; b.box('roofTop',c[0]-7,c[0]+7,h,h+4.5,c[1]-6,c[1]+6);
}

function cathedral(b,e){
  // Nhà thờ Con Gà: thân giữa dài theo trục Đông-Tây, tháp chuông phía Đông. Theo ranh OSM, chi tiết phỏng dựng.
  const P=e.p; let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9; for(const q of P){ minx=Math.min(minx,q[0]);maxx=Math.max(maxx,q[0]);minz=Math.min(minz,q[1]);maxz=Math.max(maxz,q[1]); }
  const zm=(minz+maxz)/2,W=maxz-minz,hw=W/2;
  b.box('pink',minx,maxx-8,-.2,8,minz,maxz,{collide:true});
  const ri=(x0,x1,z0,z1,yb,yt,mat='roofTile')=>{ const zc=(z0+z1)/2,l=Math.hypot(zc-z0,yt-yb),ny=(zc-z0)/l,nz=(yt-yb)/l;
    b.poly(mat,[[x0,yb,z1],[x1,yb,z1],[x1,yt,zc],[x0,yt,zc]],[0,ny,nz],[[0,0],[1,0],[1,1],[0,1]]);
    b.poly(mat,[[x1,yb,z0],[x0,yb,z0],[x0,yt,zc],[x1,yt,zc]],[0,ny,-nz],[[0,0],[1,0],[1,1],[0,1]]);
    b.poly('pink',[[x1,yb,z1],[x1,yb,z0],[x1,yt,zc]],[1,0,0],[[0,0],[1,0],[.5,1]]);
    b.poly('pink',[[x0,yb,z0],[x0,yb,z1],[x0,yt,zc]],[-1,0,0],[[0,0],[1,0],[.5,1]]); };
  b.box('pink',minx+2,maxx-8,8,17,zm-hw*.58,zm+hw*.58); ri(minx+2,maxx-8,zm-hw*.6,zm+hw*.6,17,23);
  for(const z of [minz,maxz]) ri(minx,maxx-8,z===minz?z-1:z-hw*.42,z===minz?z+hw*.42:z+1,8,12);
  // Cột bổ trụ, cửa nhọn
  for(let x=minx+3;x<maxx-10;x+=4.8){ for(const z of [minz,maxz]){ b.box('pinkTrim',x-.3,x+.3,-.2,9,z-.35,z+.35); b.box('tile2',x+1.1,x+2.9,2,6.5,z-.06,z+.06); } for(const z of [zm-hw*.58,zm+hw*.58]) b.box('tile2',x+1,x+3,10,15,z-.05,z+.05); }
  // Tháp chuông
  const tx=maxx-4,t=4.5; b.box('pink',tx-t,tx+t,-.2,38,zm-t,zm+t,{collide:true}); b.box('pinkTrim',tx-t-.2,tx+t+.2,16,16.5,zm-t-.2,zm+t+.2); b.box('pinkTrim',tx-t-.2,tx+t+.2,28,28.5,zm-t-.2,zm+t+.2); b.box('pinkTrim',tx-t-.3,tx+t+.3,37.6,38.3,zm-t-.3,zm+t+.3);
  for(const y of [20,30.5]) { b.box('tile2',tx+t,tx+t+.05,y,y+6,zm-1.3,zm+1.3); b.box('tile2',tx-1.3,tx+1.3,y,y+6,zm-t-.05,zm-t); b.box('tile2',tx-1.3,tx+1.3,y,y+6,zm+t,zm+t+.05); }
  b.box('tile2',tx+t,tx+t+.05,1,8,zm-1.8,zm+1.8);
  const cone=new THREE.ConeGeometry(4.5*1.414,22,4,1,true); const m=new THREE.Matrix4().compose(new THREE.Vector3(tx,49.2,zm),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI/4,0)),new THREE.Vector3(1,1,1)); b.add('pink',cone,m);
  b.rod('steel',[tx,60,zm],[tx,67,zm],.1,6); b.rod('steel',[tx,65,zm-.9],[tx,65,zm+.9],.06,5);
  const rg=new THREE.SphereGeometry(.45,8,6); const m2=new THREE.Matrix4().makeTranslation(tx,67.4,zm); b.add('bikeBlack',rg,m2);
}

export function buildCity(b){
  // Ô phủ 2 m để tránh đặt nhà lấp lên đường
  const G=2,N=480,occ=new Uint8Array(N*N),mark=(x,z)=>{ const i=Math.floor(x/G)+N/2,j=Math.floor(z/G)+N/2; if(i>=0&&j>=0&&i<N&&j<N) occ[i+j*N]=1; };
  const fillPoly=p=>{ let a=1e9,c=-1e9,d=1e9,e=-1e9; for(const q of p){ a=Math.min(a,q[0]);c=Math.max(c,q[0]);d=Math.min(d,q[1]);e=Math.max(e,q[1]); }
    for(let x=a;x<=c;x+=G) for(let z=d;z<=e;z+=G){ let ins=false; for(let i=0,j=p.length-1;i<p.length;j=i++){ if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0]) ins=!ins; } if(ins) mark(x,z); } };
  // Nền đất, mặt đường
  b.box('ground',-700,700,-.5,-.26,-700,700,{faces:'Y'}); 
  b.colQuad([-700,-.15,-700],[700,-.15,-700],[700,-.15,700],[-700,-.15,700]);
  const roads=OSM.r.map(r=>({...r,w:roadW(r.k)*(r.k==='residential'&&/Kiệt|Hẻm/.test(r.n||'')?.45:1)}));
  // Khoảng cách tới đường khác
  const segs=[]; for(const r of roads) for(let i=0;i<r.p.length-1;i++) segs.push([r.p[i],r.p[i+1],r]);
  const nearRoad=(x,z,self,pad)=>{ for(const s of segs){ if(s[2]===self) continue; const a=s[0],c=s[1],dx=c[0]-a[0],dz=c[1]-a[1],l=dx*dx+dz*dz; if(l<1e-6) continue; let t=((x-a[0])*dx+(z-a[1])*dz)/l; t=Math.max(0,Math.min(1,t)); const ex=a[0]+dx*t-x,ez=a[1]+dz*t-z; if(ex*ex+ez*ez<(s[2].w/2+pad)*(s[2].w/2+pad)) return true; } return false; };
  for(const r of roads){ const w=r.w/2;
    for(let i=0;i<r.p.length-1;i++){ const a=r.p[i],c=r.p[i+1],dx=c[0]-a[0],dz=c[1]-a[1],L=Math.hypot(dx,dz); if(L<.2) continue; const nx=-dz/L,nz=dx/L;
      b.poly('asphalt',[[a[0]+nx*w,-.15,a[1]+nz*w],[c[0]+nx*w,-.15,c[1]+nz*w],[c[0]-nx*w,-.15,c[1]-nz*w],[a[0]-nx*w,-.15,a[1]-nz*w]],[0,1,0],[[a[0],-a[1]],[c[0],-c[1]],[c[0],-c[1]],[a[0],-a[1]]].map((u,k)=>k<2?[u[0]+nx*w,u[1]-nz*w]:[u[0]-nx*w,u[1]+nz*w]));
      // Khoanh tròn đầu nút đường để không hở khe
      const seg=8; for(let k=0;k<seg;k++){ const t0=k/seg*6.283,t1=(k+1)/seg*6.283; b.poly('asphalt',[[c[0],-.15,c[1]],[c[0]+Math.cos(t1)*w,-.15,c[1]+Math.sin(t1)*w],[c[0]+Math.cos(t0)*w,-.15,c[1]+Math.sin(t0)*w]],[0,1,0],[[c[0],-c[1]],[c[0]+Math.cos(t1)*w,-c[1]-Math.sin(t1)*w],[c[0]+Math.cos(t0)*w,-c[1]-Math.sin(t0)*w]]); }
      for(let t=0;t<=L;t+=G*.7){ const x=a[0]+dx*t/L,z=a[1]+dz*t/L; for(let o=-w-3;o<=w+3;o+=G*.7) mark(x+nx*o,z+nz*o); }
      // Vạch giữa đường lớn
      if(r.w>=10){ for(let t=1;t<L;t+=6){ const t2=Math.min(t+3,L); const u=[a[0]+dx*t/L,a[1]+dz*t/L],v=[a[0]+dx*t2/L,a[1]+dz*t2/L]; b.poly('courtLine',[[u[0]+nx*.06,-.145,u[1]+nz*.06],[v[0]+nx*.06,-.145,v[1]+nz*.06],[v[0]-nx*.06,-.145,v[1]-nz*.06],[u[0]-nx*.06,-.145,u[1]-nz*.06]],[0,1,0],[[0,0],[1,0],[1,1],[0,1]]); } }
      // Vỉa hè hai bên
      if(r.w>=6) for(const sd2 of [1,-1]){ const sw=r.w>=10?5:4,oIn=w,oOut=w+sw;
        for(let t=0;t<L;t+=2){ const t2=Math.min(t+2,L),m=(t+t2)/2,mx=a[0]+dx*m/L,mz=a[1]+dz*m/L,ox=mx+nx*sd2*(oIn+sw/2),oz=mz+nz*sd2*(oIn+sw/2);
          if(Math.abs(ox)>440||Math.abs(oz)>440) continue; if(nearRoad(ox,oz,r,1.4)) continue;
          const u=[a[0]+dx*t/L,a[1]+dz*t/L],v=[a[0]+dx*t2/L,a[1]+dz*t2/L];
          const A=[u[0]+nx*sd2*oIn,0,u[1]+nz*sd2*oIn],B=[v[0]+nx*sd2*oIn,0,v[1]+nz*sd2*oIn],C=[v[0]+nx*sd2*oOut,0,v[1]+nz*sd2*oOut],D=[u[0]+nx*sd2*oOut,0,u[1]+nz*sd2*oOut];
          const pts=sd2>0?[A,D,C,B]:[A,B,C,D]; const orient=(()=>{ const e1=[pts[1][0]-pts[0][0],pts[1][2]-pts[0][2]],e2=[pts[2][0]-pts[0][0],pts[2][2]-pts[0][2]]; return e1[0]*e2[1]-e1[1]*e2[0]; })();
          const Q=orient<0?pts:[...pts].reverse();
          b.poly('sidewalk',Q,[0,1,0],Q.map(q=>[q[0],-q[2]]));
          // gờ vỉa
          const lo=-.27; const cA=[A[0],lo,A[2]],cB=[B[0],lo,B[2]],cA2=[A[0],0,A[2]],cB2=[B[0],0,B[2]]; const fn=[-nx*sd2,0,-nz*sd2];
          const ord=sd2>0?[cB,cA,cA2,cB2]:[cA,cB,cB2,cA2];
          b.poly('concrete',ord,fn,[[0,lo],[2,lo],[2,0],[0,0]]);
          b.colQuad(A,B,C,D); b.colQuad(cA,cB,cB2,cA2);
        } }
    } }
  // Khu đất trường
  fillPoly(SITE.map(p=>[X(p[1]),Z(p[0])]));
  // Khuôn viên nhà thờ không phủ nhà điền
  fillPoly([[45,-35],[150,-35],[150,62],[45,62]]);
  // Nhà từ OSM
  for(const e of OSM.b){
    if(e.n&&/VietinBank/.test(e.n)){ tower(b,e); fillPoly(e.p); continue; }
    if(e.n&&/Nhà thờ/.test(e.n)){ cathedral(b,e); fillPoly(e.p); continue; }
    const A=area(e.p); if(A<8) continue; const key=e.id%5;
    const h=e.h>3?e.h:(A>1500?R(9,15):A>400?R(9,20):R(7,17));
    const n=Math.round(h/3.4)*3.4; const mat=mats[key];
    b.prism(mat,e.p,-.3,n,{topMat:'roofTop',collide:true}); fillPoly(e.p); const c=e.p.reduce((a,q)=>[a[0]+q[0]/e.p.length,a[1]+q[1]/e.p.length],[0,0]); tank(b,c[0],n,c[1]);
  }
  // Nhà ống lấp kín các ô phố còn trống (minh hoạ, không có trong dữ liệu)
  let cnt=0;
  const lot=(x,z,w,d,axis)=>{ const x0=x,x1=x+w,z0=z,z1=z+d; for(let a=x0;a<x1;a+=G) for(let c=z0;c<z1;c+=G){ const i=Math.floor(a/G)+N/2,j=Math.floor(c/G)+N/2; if(i<0||j<0||i>=N||j>=N||occ[i+j*N]) return false; }
    const h=Math.round(R(2,6))*3.4+R(.2,1.1),mat=mats[(cnt*7+Math.floor(x+z))%5]; b.box(mat,x0,x1,-.3,h,z0,z1,{collide:Math.hypot(x,z)<220});
    b.box('plaster',x0,x1,h,h+.7,z0,z0+.12,{faces:'xXYzZ'}); b.box('plaster',x0,x1,h,h+.7,z1-.12,z1,{faces:'xXYzZ'}); b.box('plaster',x0,x0+.12,h,h+.7,z0,z1,{faces:'xXYzZ'}); b.box('plaster',x1-.12,x1,h,h+.7,z0,z1,{faces:'xXYzZ'}); if(R()<.55) tank(b,(x0+x1)/2,h,(z0+z1)/2);
    for(let a=x0;a<x1;a+=G) for(let c=z0;c<z1;c+=G){ const i=Math.floor(a/G)+N/2,j=Math.floor(c/G)+N/2; occ[i+j*N]=1; }
    cnt++; return true; };
  for(let z=-440;z<440;z+=4) for(let x=-440;x<440;x+=4){ if(Math.hypot(x,z)>430) continue; if(R()<.55) continue; const w=R(4,5.8),d=R(11,18); if(R()<.5) lot(x,z,w,d); else lot(x,z,d,w); }
  // Cột điện, cáp trên Yên Bái và Phạm Hồng Thái
  const poles=[]; for(let z=-90;z<90;z+=29) poles.push([28.7,z]);
  for(const [x,z] of poles){ b.cyl('concrete',x,z,0,8.5,.13,{r1:.08,seg:8,collide:true}); b.box('steel',x-.7,x+.7,8,8.08,z-.04,z+.04); b.rod('steel',[x,6.8,z],[x+1.4,7.6,z],.03,5); b.box('streetLamp',x+1.3,x+1.72,7.5,7.62,z-.09,z+.09); }
  for(let i=0;i<poles.length-1;i++){ const [x,z]=poles[i],[x2,z2]=poles[i+1]; for(const dz of [-.5,0,.5]){ let pv=[x+dz,8.08,z]; for(let k=1;k<=8;k++){ const t=k/8,nv=[x+dz+(x2-x)*t,8.08-Math.sin(t*Math.PI)*.45,z+(z2-z)*t]; b.rod('steel',pv,nv,.012,3); pv=nv; } } }
  return {filler:cnt};
}
