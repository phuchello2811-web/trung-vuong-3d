import * as THREE from 'three';
import { X,Z,M,Y,COURT_TREES,EAST_TREES,PERGOLA_Q } from './plan.js';
import { leafTexture,broadLeafTexture,vineTexture } from './textures.js';

export const windU={uTime:{value:0},uGlow:{value:.1}};

function foliageMaterial(map,o={}){
  const m=new THREE.MeshStandardMaterial({map,alphaTest:o.alpha||.22,side:THREE.DoubleSide,roughness:.72,metalness:0});
  m.userData={noAO:true};
  m.onBeforeCompile=sh=>{ sh.uniforms.uTime=windU.uTime; sh.uniforms.uGlow=windU.uGlow;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aN; uniform float uTime;')
      .replace('#include <beginnormal_vertex>','vec3 objectNormal=aN;')
      .replace('#include <defaultnormal_vertex>','vec3 transformedNormal=normalMatrix*objectNormal;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        float wp=instanceMatrix[3][0]*1.3+instanceMatrix[3][2]*.9;
        ${o.vine?'transformed.x+=sin(uTime*1.25+wp*3.+position.y*3.)*.05*(-position.y+.1);':'transformed.xy+=vec2(sin(uTime*1.5+wp),cos(uTime*1.1+wp*1.3))*.022;'}`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uGlow;')
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*uGlow;');
  };
  return m;
}

function aoMaterial(map,alpha){
  return new THREE.ShaderMaterial({uniforms:{map:{value:map},alpha:{value:alpha}},side:THREE.DoubleSide,
    vertexShader:'attribute vec3 aN; varying vec2 vU; varying vec3 vN; void main(){ vU=uv; vN=normalMatrix*aN; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.); }',
    fragmentShader:'uniform sampler2D map; uniform float alpha; varying vec2 vU; varying vec3 vN; void main(){ if(texture2D(map,vU).a<alpha) discard; vec3 n=normalize(vN); if(n.z<.15){ n.z=.15; n=normalize(n); } gl_FragColor=vec4(n*.5+.5,1.); }'});
}

function instanced(geo,mat,list,scene){
  const n=list.length; if(!n) return null;
  const g=geo.clone(); const im=new THREE.InstancedMesh(g,mat,n); const aN=new Float32Array(n*3); const col=new THREE.Color();
  const d=new THREE.Object3D();
  for(let i=0;i<n;i++){ const c=list[i]; d.position.set(c.p[0],c.p[1],c.p[2]); d.quaternion.copy(c.q); d.scale.set(c.sx,c.sy,1); d.updateMatrix(); im.setMatrixAt(i,d.matrix);
    col.setRGB(c.c[0],c.c[1],c.c[2]); im.setColorAt(i,col); aN[i*3]=c.n[0]; aN[i*3+1]=c.n[1]; aN[i*3+2]=c.n[2]; }
  g.setAttribute('aN',new THREE.InstancedBufferAttribute(aN,3));
  im.instanceMatrix.needsUpdate=true; im.instanceColor.needsUpdate=true; im.castShadow=true; im.receiveShadow=true; im.frustumCulled=false; im.userData.noAO=true; im.layers.enable(1); im.userData.aoMat=aoMaterial(mat.map,mat.alphaTest);
  scene.add(im); return im;
}

let sd=31; const R=(a=1,b)=>{ sd=(sd*16807)%2147483647; const r=(sd&0xfffff)/0xfffff; return b===undefined?r*a:a+r*(b-a); };

function limb(b,a,c,r0,r1){ const A=new THREE.Vector3(...a),C=new THREE.Vector3(...c),d=C.clone().sub(A),l=d.length(); const g=new THREE.CylinderGeometry(r1,r0,l,7,1,true); const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()); const m=new THREE.Matrix4().compose(A.clone().addScaledVector(d,.5),q,new THREE.Vector3(1,1,1)); b.add('trunk',g,m); g.dispose(); }

function tree(b,cards,x,z,h,o={}){
  const center=new THREE.Vector3(x,h*.68,z);
  const crownW=(o.w||.75)*h,leafS=o.s||1;
  const tip=(p,scale)=>{ const n=o.nCard||9; for(let i=0;i<n;i++){
      const pp=[p.x+R(-.75,.75)*scale,p.y+R(-.4,.55)*scale,p.z+R(-.75,.75)*scale];
      const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(R(-1.4,1.4),R(0,6.28),R(0,6.28)));
      const N=new THREE.Vector3(pp[0]-center.x,(pp[1]-center.y)*1.6+1.4,pp[2]-center.z).normalize();
      const k=R(.82,1.2),t=R(0,1),s=R(.85,1.3)*leafS;
      cards.push({p:pp,q,sx:s,sy:s,c:[k*(.95+t*.15),k,k*(.8+t*.2)],n:[N.x,N.y,N.z]}); } };
  const branch=(a,dir,len,rad,depth)=>{
    const c=a.clone().addScaledVector(dir,len);
    limb(b,[a.x,a.y,a.z],[c.x,c.y,c.z],rad,rad*.72);
    if(depth===0){ tip(c,1); return; }
    const n=depth===3?4:3;
    for(let i=0;i<n;i++){ const az=i/n*6.283+R(-.5,.5),spread=depth===3?R(.6,.95):R(.35,.8);
      const nd=dir.clone().multiplyScalar(.55).add(new THREE.Vector3(Math.cos(az)*spread,R(.18,.6),Math.sin(az)*spread)).normalize();
      branch(c,nd,len*R(.62,.82),rad*.62,depth-1); }
    if(depth<=1) tip(c,.8);
  };
  const t0=new THREE.Vector3(x,0,z),th=h*.3;
  const lean=new THREE.Vector3(R(-.08,.08),1,R(-.08,.08)).normalize();
  const mid=t0.clone().addScaledVector(lean,th);
  limb(b,[x,0,z],[mid.x,mid.y,mid.z],.03*h*.5+.07,.022*h*.5+.045);
  b.cyl('trunk',x,z,0,.04,.11,{seg:8});
  branch(mid,lean,h*.15,.022*h*.5+.045,3);
  b.solid(x-.18,x+.18,0,2.2,z-.18,z+.18);
}

export function buildVegetation(b,scene,shrubsXYZ,aniso){
  const leaf=[],bleaf=[],vines=[];
  for(const [p,q,h] of COURT_TREES) tree(b,leaf,X(q),Z(p),h,{w:.8});
  for(const [p,q,h] of EAST_TREES) tree(b,bleaf,X(q),Z(p),h,{w:.7,s:.95,nCard:10});
  // Cây vỉa hè Yên Bái, Phạm Hồng Thái (giãn cách thực tế 8-11 m)
  for(let z=-96;z<92;z+=R(8,11.5)){ if(z>-52&&z<-37) continue; tree(b,bleaf,28.2+R(-.2,.2),z,R(7.5,11),{w:.72,s:1,nCard:8}); tree(b,bleaf,41.6+R(-.2,.2),z+R(-2,2),R(7,10),{w:.72,nCard:7}); }
  for(let x=-90;x<26;x+=R(8,12)){ tree(b,leaf,x,-39.2,R(7.5,10),{w:.8,nCard:7}); }
  const qu=(yaw,tilt=0)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt,yaw,0,'YXZ'));
  // Sợi dây leo rủ: mỗi sợi là chuỗi thẻ, hướng ra ngoài
  const strand=(x,y,z,len,face)=>{ // face: yaw hướng pháp tuyến
    let yy=y; const W=R(.46,.74),seg=R(1.25,1.55),t=R(0,1),y0=R(-.7,.7),base=R(.68,1.02);
    while(yy>y-len){ const k=base*R(.92,1.08); const yaw=face+y0+R(-.3,.3),N=new THREE.Vector3(Math.sin(face+y0*.6),.3,Math.cos(face+y0*.6)).normalize();
      vines.push({p:[x+R(-.05,.05),yy,z+R(-.05,.05)],q:qu(yaw),sx:W,sy:seg,c:[k*(.96+t*.2),k*(1+t*.05),k*.82],n:[N.x,N.y,N.z]}); yy-=seg*.86; }
  };
  const clump=(p,seed)=>{ const a=Math.sin(p*.081+seed)+.6*Math.sin(p*.233+seed*2.1)+.35*Math.sin(p*.61+seed*.7); return (a+1.95)/3.9; };   // 0..1, tạo mảng dày mảng thưa
  const bead=(P0,P1,q,y,lenA,lenB,face,step=2.1,skip)=>{ for(let p=P0;p<P1;p+=step*R(.7,1.3)){ if(skip&&p>skip[0]&&p<skip[1]) continue; const c=clump(p,q*.13); if(R()>.42+c*.8) continue; strand(X(q)+R(-.1,.1),y,Z(p),lenA+(lenB-lenA)*Math.pow(c,1.2)*R(.55,1.1),face); } };
  // Dàn hoa phía Đông: thả hai bên dầm
  for(const q of PERGOLA_Q){ bead(396,697,q+3.8,Y[3]+.4,1.9,5,Math.PI/2,1.15); bead(396,697,q-3.8,Y[3]+.4,1.6,4.6,-Math.PI/2,1.15); }
  // Bồn tầng 2 khối Tây, rủ xuống sân; chừa khoảng trước sảnh và bảng tên trường
  bead(418,695,170.8,Y[2]+.62,1.5,4.3,Math.PI/2,1.0,[516,636]);
  // Dây bám lam đứng và lan can tầng 3-5
  const bays=[417,453.6,496,538,572,607,650,695];
  for(const p of bays) for(const dx of [-3.5,3.5]) { for(let k=0;k<3;k++) strand(X(165.5)+R(-.05,.05),Y[6]-.4,Z(p+dx+R(-1.6,1.6)),R(6,11.6),Math.PI/2); strand(X(165.5),Y[5]-.2,Z(p+dx*2.4),6+R(-1,1),Math.PI/2); }
  // Giếng trời khối Nam và bồn hành lang
  for(const L of [3,4]){ const yy=Y[L]+.35; b.boxPQ('plaster',248,252,257,422,Y[L]-.35,yy,{collide:false}); b.boxPQ('earth',248.5,251.5,257,422,yy-.04,yy+.002,{faces:'Y'});
    for(let q=258;q<422;q+=1.7) strand(X(q),yy,Z(252.6),R(2,3.6),0); }
  for(const L of [2,5]){ const yy=Y[L]+.3; b.boxPQ('plaster',246,302,468.2,471,Y[L]-.35,yy,{collide:false}); for(let p=248;p<301;p+=1.8) strand(X(471.2),yy,Z(p),R(1.8,3.2),Math.PI/2); }
  // Bụi ở sân vườn và mặt dàn
  for(const s of shrubsXYZ){ for(let k=0;k<2;k++){ const S=R(.6,1.05),yaw=R(0,6.28),t=R(0,1),l=R(.75,1.1); bleaf.push({p:[s[0],s[1]+S*.42,s[2]],q:qu(yaw,R(-.25,.25)),sx:S,sy:S*.9,c:[l,l*(1+t*.1),l*.75],n:[R(-.5,.5),1,R(-.5,.5)]}); } }
  for(const q of PERGOLA_Q) for(let p=398;p<695;p+=2.6){ const s=R(.8,1.5),l=R(.8,1.1); for(let k=0;k<2;k++) leaf.push({p:[X(q)+R(-.15,.15),Y[3]+.5+s*.35,Z(p)],q:qu(R(0,6.28),R(-.2,.2)),sx:s,sy:s,c:[l,l,l*.8],n:[R(-.5,.5),1,R(-.5,.5)]}); }
  // Dây phủ lên giàn giữa hai dầm
  for(let k=0;k<420;k++){ const p=R(398,694),q=R(442,506),sc=R(.9,1.6),l=R(.75,1.05); leaf.push({p:[X(q),Y[3]-.02+R(0,.12),Z(p)],q:qu(R(0,6.28),-1.45+R(-.15,.15)),sx:sc,sy:sc,c:[l,l,l*.82],n:[R(-.4,.4),1,R(-.4,.4)]}); }
  for(let p=420;p<694;p+=2.4){ const s=R(.7,1.25),l=R(.8,1.1); bleaf.push({p:[X(162+R(-6,7)),Y[2]+.68+s*.35,Z(p)],q:qu(R(0,6.28)),sx:s,sy:s,c:[l,l,l*.8],n:[R(-.5,.5),1,R(-.5,.5)]}); }
  const plane=new THREE.PlaneGeometry(1,1); const vPlane=new THREE.PlaneGeometry(1,1); vPlane.translate(0,-.5,0);
  const lm=foliageMaterial(leafTexture(aniso)),bm=foliageMaterial(broadLeafTexture(aniso)),vm=foliageMaterial(vineTexture(aniso),{vine:true,alpha:.2});
  instanced(plane,lm,leaf,scene); instanced(plane,bm,bleaf,scene); instanced(vPlane,vm,vines,scene);
  return {counts:{leaf:leaf.length,bleaf:bleaf.length,vines:vines.length}};
}
