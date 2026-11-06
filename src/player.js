import * as THREE from 'three';
import { MeshBVH,ExtendedTriangle } from 'three-mesh-bvh';

export class Player {
  constructor(camera,colPositions){
    this.cam=camera; this.mode='orbit'; this.yaw=0; this.pitch=0; this.keys={}; this.pos=new THREE.Vector3(0,1.6,0); this.vel=new THREE.Vector3(); this.grounded=false; this.eye=1.6; this.speed=1.45;
    this.orbit={t:new THREE.Vector3(0,7,0),r:86,th:1.85,ph:1.12,auto:true}; this.tween=null; this.touch={x:0,y:0};
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(colPositions,3));
    this.bvh=new MeshBVH(g,{maxLeafTris:6}); this.geo=g; this.mesh=new THREE.Mesh(g); this.mesh.geometry.boundsTree=this.bvh;
    this.radius=.24; this.h=1.7; this.seg=new THREE.Line3(); this.box=new THREE.Box3(); this.tri=new THREE.Vector3(); this.cap=new THREE.Vector3();
    this.ray=new THREE.Raycaster();
  }
  setMode(m){ if(m===this.mode) return; const c=this.cam;
    if(m==='walk'||m==='fly'){ const d=new THREE.Vector3(); c.getWorldDirection(d); this.yaw=Math.atan2(-d.x,-d.z); this.pitch=Math.asin(Math.max(-1,Math.min(1,d.y))); if(this.mode==='orbit'){ this.pos.copy(c.position); } else this.pos.copy(c.position);
      if(m==='walk'){ const y=this.floorAt(this.pos.x,this.pos.z,this.pos.y); this.vel.set(0,0,0); if(y!==null) this.pos.y=y+this.eye; else this.pos.set(5.8,1.6,8); } }
    if(m==='orbit'){ const o=this.orbit; const d=c.position.clone().sub(o.t); o.r=Math.max(30,d.length()); o.th=Math.atan2(d.x,d.z); o.ph=Math.acos(Math.max(-1,Math.min(1,d.y/d.length()))); }
    this.mode=m; this.tween=null;
  }
  floorAt(x,z,fromY=60){ this.ray.set(new THREE.Vector3(x,fromY,z),new THREE.Vector3(0,-1,0)); this.ray.far=fromY+1; this.ray.firstHitOnly=true; const h=this.bvh.raycastFirst(this.ray.ray,THREE.DoubleSide,0,fromY+1); return h?h.point.y:null; }
  rayHit(origin,dir,far=300){ const r=new THREE.Ray(origin,dir); return this.bvh.raycastFirst(r,THREE.DoubleSide,0,far); }
  flyTo(pos,yaw,pitch,mode,dur=1.3){ this.tween={f:this.cam.position.clone(),t:new THREE.Vector3(...pos),q0:this.cam.quaternion.clone(),q1:new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ')),k:0,dur,yaw,pitch,mode}; }
  look(dx,dy){ if(this.mode==='orbit'){ const o=this.orbit; o.auto=false; o.th-=dx*.005; o.ph=Math.max(.12,Math.min(1.55,o.ph-dy*.005)); } else { this.yaw-=dx*.0023; this.pitch=Math.max(-1.45,Math.min(1.45,this.pitch-dy*.0023)); } }
  zoom(d){ if(this.mode==='orbit'){ this.orbit.auto=false; this.orbit.r=Math.max(18,Math.min(380,this.orbit.r*Math.exp(d*.001))); } else this.speed=Math.max(.8,Math.min(30,this.speed*Math.exp(-d*.001))); }
  moveVec(){ const k=this.keys; let f=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0)+this.touch.y,r=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0)+this.touch.x; return {f,r}; }
  update(dt){
    if(this.tween){ const t=this.tween; t.k=Math.min(1,t.k+dt/t.dur); const e=t.k*t.k*(3-2*t.k); this.cam.position.lerpVectors(t.f,t.t,e); this.cam.quaternion.slerpQuaternions(t.q0,t.q1,e);
      if(t.k>=1){ this.tween=null; this.pos.copy(t.t); this.yaw=t.yaw; this.pitch=t.pitch; if(t.mode){ this.mode=t.mode; if(t.mode==='walk'){ const y=this.floorAt(t.t.x,t.t.z,t.t.y+.2); if(y!==null) this.pos.y=y+this.eye; this.vel.set(0,0,0);} if(t.mode==='orbit'){ const o=this.orbit,d=this.cam.position.clone().sub(o.t); o.r=d.length(); o.th=Math.atan2(d.x,d.z); o.ph=Math.acos(d.y/d.length()); } } }
      return; }
    if(this.mode==='orbit'){ const o=this.orbit; if(o.auto) o.th+=dt*.035; const s=Math.sin(o.ph); this.cam.position.set(o.t.x+o.r*s*Math.sin(o.th),o.t.y+o.r*Math.cos(o.ph),o.t.z+o.r*s*Math.cos(o.th)); this.cam.lookAt(o.t); return; }
    const {f,r}=this.moveVec(),run=this.keys.ShiftLeft||this.keys.ShiftRight;
    if(this.mode==='fly'){ const sp=this.speed*4*(run?3:1); const fw=new THREE.Vector3(-Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch)),rt=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw)),up=(this.keys.KeyE||this.keys.Space?1:0)-(this.keys.KeyQ?1:0);
      this.pos.addScaledVector(fw,f*sp*dt).addScaledVector(rt,r*sp*dt); this.pos.y+=up*sp*dt; }
    else this.walk(dt,f,r,run);
    this.cam.position.copy(this.pos); this.cam.quaternion.setFromEuler(new THREE.Euler(this.pitch,this.yaw,0,'YXZ'));
  }
  walk(dt,f,r,run){
    const sp=(run?3.4:this.speed); const fw=new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),rt=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));
    const steps=3,h=dt/steps,mv=new THREE.Vector3().addScaledVector(fw,f).addScaledVector(rt,r); if(mv.lengthSq()>1) mv.normalize(); mv.multiplyScalar(sp*h);
    for(let i=0;i<steps;i++){
      if(this.grounded) this.vel.y=-1.2; else this.vel.y-=9.81*h;
      this.pos.addScaledVector(this.vel,h).add(mv);
      const R=this.radius,top=this.pos.clone(); top.y-=.08; const bot=this.pos.clone(); bot.y-=this.eye-R;
      this.seg.start.copy(top); this.seg.end.copy(bot); const s0=this.seg.end.clone();
      this.box.makeEmpty(); this.box.expandByPoint(this.seg.start); this.box.expandByPoint(this.seg.end); this.box.min.addScalar(-R); this.box.max.addScalar(R);
      const seg=this.seg,tp=this.tri,cp=this.cap,box=this.box;
      this.bvh.shapecast({intersectsBounds:b=>b.intersectsBox(box),intersectsTriangle:tri=>{ const d=tri.closestPointToSegment(seg,tp,cp); if(d<R){ const dep=R-d,dir=cp.clone().sub(tp).normalize(); seg.start.addScaledVector(dir,dep); seg.end.addScaledVector(dir,dep); } return false; }});
      const delta=seg.end.clone().sub(s0); this.grounded=delta.y>Math.abs(h*this.vel.y*.25)||delta.y>.0005;
      const off=Math.max(0,delta.length()-1e-5); if(off>0){ delta.normalize(); this.pos.addScaledVector(delta,off); if(!this.grounded) this.vel.addScaledVector(delta,-delta.dot(this.vel)); else this.vel.set(0,0,0); }
    }
    // an toàn nếu lọt khỏi bản đồ
    if(this.pos.y<-5){ this.pos.set(5.8,1.6,8); this.vel.set(0,0,0); }
    if(this.pos.lengthSq()>360000){ this.pos.set(28.8,1.55,12); this.vel.set(0,0,0); }
  }
}
