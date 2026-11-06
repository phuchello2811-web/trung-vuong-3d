import * as THREE from 'three';
import { X, Z } from './plan.js';

// Gộp mọi hình học theo vật liệu để giảm draw call. UV tính theo mét nên vật liệu luôn đúng tỉ lệ thật.
export class Batch {
  constructor(){ this.g=new Map(); this.col=[]; this.m=null; this.flip=false; this.n3=null; }
  group(mat){ let g=this.g.get(mat); if(!g){ g={p:[],n:[],u:[],i:[]}; this.g.set(mat,g);} return g; }
  setFrame(m){ this.m=m; if(m){ this.flip=m.determinant()<0; this.n3=new THREE.Matrix3().getNormalMatrix(m);} else {this.flip=false; this.n3=null;} }
  _pt(x,y,z){ if(!this.m) return [x,y,z]; const e=this.m.elements; return [e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]]; }
  _nm(x,y,z){ if(!this.n3) return [x,y,z]; const e=this.n3.elements; let a=e[0]*x+e[3]*y+e[6]*z,b=e[1]*x+e[4]*y+e[7]*z,c=e[2]*x+e[5]*y+e[8]*z; const l=Math.hypot(a,b,c)||1; return [a/l,b/l,c/l]; }
  // đa giác lồi hướng theo pháp tuyến n (các đỉnh ngược chiều kim đồng hồ khi nhìn từ phía n)
  poly(mat,pts,n,uvs){
    const g=this.group(mat), s=g.p.length/3, N=this._nm(n[0],n[1],n[2]);
    for(let k=0;k<pts.length;k++){ const q=this._pt(pts[k][0],pts[k][1],pts[k][2]); g.p.push(q[0],q[1],q[2]); g.n.push(N[0],N[1],N[2]); g.u.push(uvs[k][0],uvs[k][1]); }
    for(let k=1;k<pts.length-1;k++){ if(this.flip) g.i.push(s,s+k+1,s+k); else g.i.push(s,s+k,s+k+1); }
  }
  addColTri(a,b,c){ const A=this._pt(...a),B=this._pt(...b),C=this._pt(...c); this.col.push(...A,...B,...C); }
  colQuad(a,b,c,d){ this.addColTri(a,b,c); this.addColTri(a,c,d); }
  solid(x0,x1,y0,y1,z0,z1){
    const a=[x0,y0,z0],b=[x1,y0,z0],c=[x1,y1,z0],d=[x0,y1,z0],e=[x0,y0,z1],f=[x1,y0,z1],g=[x1,y1,z1],h=[x0,y1,z1];
    this.colQuad(a,b,c,d);this.colQuad(e,f,g,h);this.colQuad(a,e,h,d);this.colQuad(b,f,g,c);this.colQuad(d,c,g,h);this.colQuad(a,b,f,e);
  }
  // Khối hộp thẳng trục; faces lọc mặt: 'xXyYzZ'
  box(mat,x0,x1,y0,y1,z0,z1,o={}){
    if(x0>x1)[x0,x1]=[x1,x0]; if(y0>y1)[y0,y1]=[y1,y0]; if(z0>z1)[z0,z1]=[z1,z0];
    if(x1-x0<1e-5||y1-y0<1e-5||z1-z0<1e-5) return;
    const f=o.faces||'xXyYzZ';
    if(f.includes('X')) this.poly(mat,[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],[1,0,0],[[-z1,y0],[-z0,y0],[-z0,y1],[-z1,y1]]);
    if(f.includes('x')) this.poly(mat,[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],[-1,0,0],[[z0,y0],[z1,y0],[z1,y1],[z0,y1]]);
    if(f.includes('Y')) this.poly(mat,[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],[0,1,0],[[x0,-z1],[x1,-z1],[x1,-z0],[x0,-z0]]);
    if(f.includes('y')) this.poly(mat,[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0],[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]);
    if(f.includes('Z')) this.poly(mat,[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1],[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]);
    if(f.includes('z')) this.poly(mat,[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],[0,0,-1],[[-x1,y0],[-x0,y0],[-x0,y1],[-x1,y1]]);
    if(o.collide) this.solid(x0,x1,y0,y1,z0,z1);
  }
  // Hộp theo toạ độ bản vẽ
  boxPQ(mat,P0,P1,Q0,Q1,y0,y1,o){ this.box(mat,X(Q0),X(Q1),y0,y1,Z(P1),Z(P0),o); }
  // Khối lăng trụ từ đa giác (x,z), chiều bất kỳ
  prism(mat,pts,y0,y1,o={}){
    const a=THREE.ShapeUtils.area(pts.map(p=>new THREE.Vector2(p[0],-p[1])));
    const P=a<0?[...pts].reverse():pts;           // chuẩn hoá ngược chiều kim đồng hồ khi nhìn từ trên
    const tris=THREE.ShapeUtils.triangulateShape(P.map(p=>new THREE.Vector2(p[0],-p[1])),[]);
    for(const t of tris){ let A=P[t[0]],B=P[t[1]],C=P[t[2]];
      if((B[1]-A[1])*(C[0]-A[0])-(B[0]-A[0])*(C[1]-A[1])<0){ const k=B;B=C;C=k; }   // pháp tuyến hướng lên
      if(!o.noTop){ this.poly(o.topMat||mat,[[A[0],y1,A[1]],[B[0],y1,B[1]],[C[0],y1,C[1]]],[0,1,0],[[A[0],-A[1]],[B[0],-B[1]],[C[0],-C[1]]]);
        if(o.collide) this.addColTri([A[0],y1,A[1]],[B[0],y1,B[1]],[C[0],y1,C[1]]); }
      if(!o.noBottom) this.poly(mat,[[A[0],y0,A[1]],[C[0],y0,C[1]],[B[0],y0,B[1]]],[0,-1,0],[[A[0],A[1]],[C[0],C[1]],[B[0],B[1]]]);
    }
    let run=0;
    for(let i=0;i<P.length;i++){ const A=P[i],B=P[(i+1)%P.length]; const dx=B[0]-A[0],dz=B[1]-A[1],l=Math.hypot(dx,dz); if(l<1e-4) continue;
      if(!o.noSide) this.poly(mat,[[A[0],y0,A[1]],[B[0],y0,B[1]],[B[0],y1,B[1]],[A[0],y1,A[1]]],[-dz/l,0,dx/l],[[run,y0],[run+l,y0],[run+l,y1],[run,y1]]);
      if(o.collide) this.colQuad([A[0],y0,A[1]],[B[0],y0,B[1]],[B[0],y1,B[1]],[A[0],y1,A[1]]);
      run+=l; }
  }
  // Trụ tròn đứng
  cyl(mat,x,z,y0,y1,r,o={}){
    const seg=o.seg||20,r1=o.r1===undefined?r:o.r1;
    for(let i=0;i<seg;i++){ const a=i/seg*Math.PI*2,c=(i+1)/seg*Math.PI*2;
      const ca=Math.cos(a),sa=Math.sin(a),cc=Math.cos(c),sc=Math.sin(c);
      const g=this.group(mat),s=g.p.length/3;
      const P=[[x+ca*r,y0,z+sa*r],[x+cc*r,y0,z+sc*r],[x+cc*r1,y1,z+sc*r1],[x+ca*r1,y1,z+sa*r1]];
      const Ns=[[ca,0,sa],[cc,0,sc],[cc,0,sc],[ca,0,sa]],U=[[a*r,y0],[c*r,y0],[c*r,y1],[a*r,y1]];
      for(let k=0;k<4;k++){ const q=this._pt(...P[k]),n=this._nm(...Ns[k]); g.p.push(...q); g.n.push(...n); g.u.push(...U[k]); }
      if(this.flip) g.i.push(s,s+1,s+2,s,s+2,s+3); else g.i.push(s,s+2,s+1,s,s+3,s+2);
      if(o.caps!==false){ this.poly(mat,[[x,y1,z],[P[2][0],y1,P[2][2]],[P[3][0],y1,P[3][2]]],[0,1,0],[[x,z],[P[2][0],P[2][2]],[P[3][0],P[3][2]]]); }
    }
    if(o.collide){ const n=8; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2,c=(i+1)/n*Math.PI*2,R=Math.max(r,r1);
      this.colQuad([x+Math.cos(a)*R,y0,z+Math.sin(a)*R],[x+Math.cos(c)*R,y0,z+Math.sin(c)*R],[x+Math.cos(c)*R,y1,z+Math.sin(c)*R],[x+Math.cos(a)*R,y1,z+Math.sin(a)*R]); } }
  }
  // Thanh tròn giữa hai điểm bất kỳ
  rod(mat,a,b,r,seg=6){
    const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),up=Math.abs(d.y/d.length())>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0);
    const u=new THREE.Vector3().crossVectors(d,up).normalize(),v=new THREE.Vector3().crossVectors(d,u).normalize();
    const g=this.group(mat);
    for(let i=0;i<seg;i++){ const t0=i/seg*Math.PI*2,t1=(i+1)/seg*Math.PI*2;
      const n0=u.clone().multiplyScalar(Math.cos(t0)).addScaledVector(v,Math.sin(t0)),n1=u.clone().multiplyScalar(Math.cos(t1)).addScaledVector(v,Math.sin(t1));
      const s=g.p.length/3,L=d.length();
      const ps=[A.clone().addScaledVector(n0,r),A.clone().addScaledVector(n1,r),B.clone().addScaledVector(n1,r),B.clone().addScaledVector(n0,r)],ns=[n0,n1,n1,n0];
      for(let k=0;k<4;k++){ const q=this._pt(ps[k].x,ps[k].y,ps[k].z),n=this._nm(ns[k].x,ns[k].y,ns[k].z); g.p.push(...q); g.n.push(...n); g.u.push(k==1||k==2?t1*r:t0*r,k>1?L:0); }
      if(this.flip) g.i.push(s,s+2,s+1,s,s+3,s+2); else g.i.push(s,s+1,s+2,s,s+2,s+3);
    }
  }
  // Thêm geometry có sẵn
  add(mat,geo,matrix){
    const g=this.group(mat),s=g.p.length/3,p=geo.attributes.position,n=geo.attributes.normal,u=geo.attributes.uv;
    const v=new THREE.Vector3(),w=new THREE.Vector3(),nm=matrix?new THREE.Matrix3().getNormalMatrix(matrix):null;
    for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); if(matrix) v.applyMatrix4(matrix); const q=this._pt(v.x,v.y,v.z); g.p.push(q[0],q[1],q[2]);
      w.fromBufferAttribute(n,i); if(nm) w.applyMatrix3(nm).normalize(); const r=this._nm(w.x,w.y,w.z); g.n.push(r[0],r[1],r[2]); if(u) g.u.push(u.getX(i),u.getY(i)); else g.u.push(0,0); }
    const flip=(matrix&&matrix.determinant()<0)!==this.flip;
    if(geo.index){ const ix=geo.index; for(let i=0;i<ix.count;i+=3){ if(flip) g.i.push(s+ix.getX(i),s+ix.getX(i+2),s+ix.getX(i+1)); else g.i.push(s+ix.getX(i),s+ix.getX(i+1),s+ix.getX(i+2)); } }
    else for(let i=0;i<p.count;i+=3){ if(flip) g.i.push(s+i,s+i+2,s+i+1); else g.i.push(s+i,s+i+1,s+i+2); }
  }
  // Tường có lỗ mở. Chạy dọc X hoặc Z. side=+1/-1 chọn mặt có len tường (phía hành lang).
  wall(mat,x0,z0,x1,z1,y0,y1,t,ops=[],o={}){
    const alongX=Math.abs(x1-x0)>Math.abs(z1-z0);
    const a0=alongX?Math.min(x0,x1):Math.min(z0,z1), a1=alongX?Math.max(x0,x1):Math.max(z0,z1), c=alongX?z0:x0;
    const seg=(a,b,yy0,yy1,col=true)=>{ if(b-a<1e-3||yy1-yy0<1e-3) return;
      if(alongX) this.box(mat,a,b,yy0,yy1,c-t/2,c+t/2,{collide:col}); else this.box(mat,c-t/2,c+t/2,yy0,yy1,a,b,{collide:col});
      if(o.dado&&yy0<y0+1.25){ const dt=Math.min(yy1,y0+1.25), s=o.dado>0?1:-1, off=t/2+.012;
        if(alongX) this.box(o.dadoMat,a,b,yy0,dt,c+s*off-.012,c+s*off+.012); else this.box(o.dadoMat,c+s*off-.012,c+s*off+.012,yy0,dt,a,b); }
    };
    const O=[...ops].filter(q=>q.e>q.s).sort((p,q)=>p.s-q.s);
    let cur=a0;
    for(const q of O){ const s=Math.max(a0,a0+q.s),e=Math.min(a1,a0+q.e); if(e<=s) continue; seg(cur,s,y0,y1);
      seg(s,e,y0,y0+q.h0); seg(s,e,y0+q.h1,y1);
      if(q.fn) q.fn(this,s,e,y0+q.h0,y0+q.h1,c,alongX,t);
      cur=e; }
    seg(cur,a1,y0,y1);
  }
  build(mats,scene,opts={}){
    const out=[];
    for(const [key,g] of this.g){ if(!g.i.length) continue;
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));
      geo.setAttribute('normal',new THREE.Float32BufferAttribute(g.n,3));
      geo.setAttribute('uv',new THREE.Float32BufferAttribute(g.u,2));
      geo.setIndex(g.p.length/3>65000?new THREE.Uint32BufferAttribute(g.i,1):new THREE.Uint16BufferAttribute(g.i,1));
      const mat=mats[key]; if(!mat){ console.warn('Thiếu vật liệu',key); continue; }
      const mesh=new THREE.Mesh(geo,mat); mesh.frustumCulled=false;
      mesh.castShadow=!mat.userData.noCast; mesh.receiveShadow=!mat.userData.noReceive; mesh.userData.noAO=!!mat.userData.noAO; mesh.name=key;
      scene.add(mesh); out.push(mesh);
      g.p=g.n=g.u=g.i=null;
    }
    this.g.clear();
    return out;
  }
}

// Frame cục bộ: trục u,v trên mặt bằng (đơn vị P,Q) đặt tại gốc (P,Q)
export function frameM(P,Q,uP,uQ,vP,vQ,y=0){
  const ux=new THREE.Vector3(uQ,0,-uP).normalize(), vz=new THREE.Vector3(vQ,0,-vP).normalize();
  const m=new THREE.Matrix4().makeBasis(ux,new THREE.Vector3(0,1,0),vz); m.setPosition(X(Q),y,Z(P)); return m;
}
