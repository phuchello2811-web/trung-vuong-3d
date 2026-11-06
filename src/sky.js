import * as THREE from 'three';

// Vị trí mặt trời thực theo thuật toán NOAA rút gọn, tại toạ độ trường (16,067°B, 108,222°Đ, UTC+7).
const LAT=16.067*Math.PI/180,LON=108.222;
export function sunENU(dayOfYear,hour){
  const g=2*Math.PI/365*(dayOfYear-1+(hour-12)/24);
  const eq=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
  const dec=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
  const tst=hour*60+eq+4*LON-7*60,ha=(tst/4-180)*Math.PI/180;
  const sinEl=Math.sin(LAT)*Math.sin(dec)+Math.cos(LAT)*Math.cos(dec)*Math.cos(ha),el=Math.asin(sinEl);
  const e=-Math.cos(dec)*Math.sin(ha),n=Math.sin(dec)*Math.cos(LAT)-Math.cos(dec)*Math.sin(LAT)*Math.cos(ha);
  return {e,n,u:sinEl,el:el*180/Math.PI,az:(Math.atan2(e,n)*180/Math.PI+360)%360};
}
const TH=5.58*Math.PI/180;
export function sunDirSite(s){ const x=s.e*Math.cos(TH)-s.n*Math.sin(TH),nn=s.e*Math.sin(TH)+s.n*Math.cos(TH); return new THREE.Vector3(x,s.u,-nn).normalize(); }

const skyFrag=`
varying vec3 vDir; uniform vec3 uSun; uniform float uTime; uniform float uEnv;
float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.03+vec2(11.7,3.1); a*=.5; } return v; }
void main(){
  vec3 d=normalize(vDir); float yy=max(d.y,0.); float sy=uSun.y; float day=smoothstep(-.12,.22,sy), low=smoothstep(.34,.02,sy)*smoothstep(-.2,.03,sy);
  vec3 zen=mix(vec3(.006,.01,.03),vec3(.055,.2,.66),day), hor=mix(vec3(.018,.025,.05),vec3(.56,.74,1.0),day);
  vec3 col=mix(hor,zen,pow(yy,.42));
  float sd=max(dot(d,uSun),0.);
  float az=max(dot(normalize(vec3(d.x,0.,d.z)),normalize(vec3(uSun.x,0.,uSun.z))),0.);
  col=mix(col,vec3(1.25,.56,.24),low*pow(1.-yy,6.)*(.25+.75*pow(az,1.5)));
  col+=vec3(1.,.8,.55)*pow(sd,18.)*(.16+low*.7)*day;
  col+=vec3(1.,.93,.82)*pow(sd,180.)*.7*day;
  if(uEnv<.5) col+=vec3(1.,.93,.8)*smoothstep(.99955,.99985,sd)*60.*smoothstep(-.03,.03,sy);
  if(day<.5&&uEnv<.5){ vec2 st=floor(d.xz/(abs(d.y)+.4)*230.); float s=step(.9972,h21(st)); col+=s*vec3(.9,.95,1.)*(1.-day*2.)*.9*smoothstep(0.,.25,d.y); }
  if(d.y>.005){ vec2 uv=d.xz/(d.y+.16)*1.25+vec2(uTime*.0035,uTime*.0012);
    float c=fbm(uv*1.6+fbm(uv*.8)*1.1); float cov=smoothstep(.47,.74,c)*smoothstep(.01,.2,d.y);
    float lit=smoothstep(.52,.9,fbm(uv*1.6+.12*uSun.xz+fbm(uv*.8)*1.1));
    vec3 cc=mix(vec3(1.22,1.22,1.2),vec3(.56,.62,.74),lit);
    cc=mix(cc,vec3(1.3,.72,.46),low*.75); cc*=mix(.03,1.,day);
    col=mix(col,cc,cov*.92);
  }
  vec3 gnd=mix(vec3(.01),vec3(.5,.49,.47),day); col=mix(col,gnd,smoothstep(.0,-.05,d.y));
  if(uEnv>.5){ float l=dot(col,vec3(.3,.55,.15)); col=mix(vec3(l),col,.34)*1.05; }
  gl_FragColor=vec4(col,1.);
}`;

export function createSky(renderer){
  const uni={uSun:{value:new THREE.Vector3(0,1,0)},uTime:{value:0},uEnv:{value:0}};
  const mat=new THREE.ShaderMaterial({uniforms:uni,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:true,
    vertexShader:'varying vec3 vDir; void main(){ vDir=position; vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; gl_Position.z=gl_Position.w*.99999; }',fragmentShader:skyFrag});
  const geo=new THREE.SphereGeometry(1400,48,24),mesh=new THREE.Mesh(geo,mat); mesh.frustumCulled=false; mesh.userData.noAO=true; mesh.renderOrder=-1;
  const envScene=new THREE.Scene(),envMesh=new THREE.Mesh(geo,mat); envScene.add(envMesh);
  const pm=new THREE.PMREMGenerator(renderer); let rt=null;
  const bake=()=>{ uni.uEnv.value=1; const n=pm.fromScene(envScene,0,1,3000); uni.uEnv.value=0; if(rt) rt.dispose(); rt=n; return n.texture; };
  return {mesh,uni,bake};
}
