import * as THREE from 'three';

// Toàn bộ vật liệu được vẽ bằng thủ tục, màu lấy mẫu từ ảnh công trình.
let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return (seed&0xffffff)/0xffffff; };
const hash=(x,y,s=0)=>{ let h=(x*374761393+y*668265263+s*2147483647)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967295; };
function vnoise(x,y,per,s){ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,m=(a)=>((a%per)+per)%per,f=t=>t*t*(3-2*t);
  const a=hash(m(xi),m(yi),s),b=hash(m(xi+1),m(yi),s),c=hash(m(xi),m(yi+1),s),d=hash(m(xi+1),m(yi+1),s),u=f(xf),v=f(yf); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
export function fbm(x,y,per,oct=4,s=0){ let v=0,a=.5,t=0; for(let i=0;i<oct;i++){ v+=a*vnoise(x*(1<<i)*per,y*(1<<i)*per,per*(1<<i),s+i); t+=a; a*=.5; } return v/t; }

function makeCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h||w; return c; }
const hex=c=>[(c>>16)&255,(c>>8)&255,c&255];

// Sinh albedo + bump + độ nhám từ hàm height(u,v) -> {c:[r,g,b], h, r}
function genTex(size,fn,metres,opts={}){
  const col=makeCanvas(size),g=col.getContext('2d'),im=g.createImageData(size,size),hgt=new Float32Array(size*size),rgh=new Uint8ClampedArray(size*size);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){ const o=fn(x/size,y/size); const i=(y*size+x)*4; im.data[i]=o.c[0]; im.data[i+1]=o.c[1]; im.data[i+2]=o.c[2]; im.data[i+3]=255; hgt[y*size+x]=o.h||0; rgh[y*size+x]=(o.r===undefined?.8:o.r)*255; }
  g.putImageData(im,0,0);
  const out={map:tex(col,metres,true)};
  if(opts.normal!==0){ const nc=makeCanvas(size),ng=nc.getContext('2d'),ni=ng.createImageData(size,size),st=opts.normal||2;
    for(let y=0;y<size;y++) for(let x=0;x<size;x++){ const xp=(x+1)%size,xm=(x-1+size)%size,yp=(y+1)%size,ym=(y-1+size)%size;
      const dx=(hgt[y*size+xp]-hgt[y*size+xm])*st,dy=(hgt[yp*size+x]-hgt[ym*size+x])*st,l=Math.hypot(dx,dy,1),i=(y*size+x)*4;
      ni.data[i]=(-dx/l*.5+.5)*255; ni.data[i+1]=(dy/l*.5+.5)*255; ni.data[i+2]=(1/l*.5+.5)*255; ni.data[i+3]=255; }
    ng.putImageData(ni,0,0); out.normalMap=tex(nc,metres,false); }
  if(opts.rough){ const rc=makeCanvas(size),rg=rc.getContext('2d'),ri=rg.createImageData(size,size);
    for(let i=0;i<size*size;i++){ ri.data[i*4]=0; ri.data[i*4+1]=rgh[i]; ri.data[i*4+2]=0; ri.data[i*4+3]=255; } rg.putImageData(ri,0,0); out.roughnessMap=tex(rc,metres,false); }
  return out;
}
export let maxAniso=8;
export function setAniso(a){ maxAniso=a; }
function tex(c,metres,srgb){ const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1/metres,1/metres); t.anisotropy=maxAniso; if(srgb) t.colorSpace=THREE.SRGBColorSpace; t.generateMipmaps=true; t.minFilter=THREE.LinearMipmapLinearFilter; return t; }

function tilesFn(cols,rows,gw,base,grout,opts={}){
  return (u,v)=>{ let rowf=v*rows,row=Math.floor(rowf); const shift=(opts.bond&&row%2)?.5:0; let colf=u*cols+shift,col=Math.floor(colf); const fx=colf-col,fy=rowf-row,cc=((col%cols)+cols)%cols;
    const gx=gw*cols,gy=gw*rows,inG=fx<gx||fx>1-gx||fy<gy||fy>1-gy; const r=hash(cc,row,11),N=fbm(u,v,8,3,5);
    if(inG) return {c:grout,h:0,r:.9};
    const k=1+(r-.5)*(opts.vary||.08)+(N-.5)*(opts.grain||.08);
    let veins=0; if(opts.vein){ const w=fbm(u+r,v-r,3,4,9); veins=Math.pow(1-Math.abs(w*2-1),12)*opts.vein; }
    return {c:[base[0]*k-veins*40,base[1]*k-veins*40,base[2]*k-veins*38],h:1-(opts.bev?.3*Math.pow(Math.max(Math.abs(fx-.5),Math.abs(fy-.5))*2,8):0),r:(opts.rough||.5)+(N-.5)*.12};
  };
}

export function makeMaterials(aniso,envRef){
  setAniso(aniso);
  const std=(p,ud={})=>{ const m=new THREE.MeshStandardMaterial(p); m.userData=ud; return m; };
  const M={};
  // Tường trắng trát, có đường ron mảnh như ảnh mặt đứng
  const plaster=genTex(1024,(u,v)=>{ const N=fbm(u,v,6,5,1),n2=fbm(u,v,48,2,2),gv=Math.abs(((v*8)%1)-.5)>.492,gu=Math.abs(((u*4)%1)-.5)>.496; const j=gu||gv?.955:1,k=(.965+(N-.5)*.05+(n2-.5)*.025)*j; return {c:[222*k,219*k,210*k],h:n2*.25+(j<1?-.35:0),r:.88}; },2.4,{normal:1.1});
  M.plaster=std({...plaster,roughness:.92});
  const paint=genTex(512,(u,v)=>{ const N=fbm(u,v,5,4,3),k=.975+(N-.5)*.04; return {c:[226*k,224*k,216*k],h:fbm(u,v,64,2,4)*.2}; },2,{normal:.8});
  M.paint=std({...paint,roughness:.9}); M.ceil=std({...paint,roughness:.95,color:0xfbfbf7});
  // Khảm gốm cột tròn: viên 10 cm, ron sẫm (ảnh chi tiết cột)
  const mosaic=genTex(1024,tilesFn(20,20,.0055,[236,236,231],[176,176,171],{vary:.035,grain:.03,rough:.24,bev:1}),1,{normal:1.6,rough:1});
  M.mosaic=std({...mosaic,roughness:1});
  const darkTile=genTex(1024,tilesFn(6,12,.003,[92,94,98],[48,48,50],{bond:1,vary:.2,rough:.45,bev:1}),1.2,{normal:2,rough:1});
  M.darkTile=std({...darkTile,roughness:1});
  const dado=genTex(1024,tilesFn(3,6,.0028,[150,134,116],[85,76,66],{vary:.09,grain:.1,rough:.4}),1.8,{normal:1,rough:1});
  M.dado=std({...dado,roughness:1});
  const floorTile=genTex(1024,tilesFn(4,4,.0012,[202,194,176],[140,134,120],{vary:.04,grain:.07,rough:.2,vein:.14}),2.4,{normal:.5,rough:1});
  M.floor=std({...floorTile,roughness:1,envMapIntensity:1.35});
  const classFloor=genTex(1024,tilesFn(4,4,.0018,[222,214,196],[150,142,128],{vary:.04,grain:.06,rough:.26}),2,{normal:.5,rough:1});
  M.classFloor=std({...classFloor,roughness:1});
  const wcFloor=genTex(1024,tilesFn(4,4,.0018,[132,134,134],[86,86,86],{vary:.06,grain:.09,rough:.42}),2.4,{normal:.6,rough:1});
  M.wcFloor=std({...wcFloor,roughness:1});
  // Gạch lát sân: viên 30x15 xám, xen độ đậm nhạt
  const paver=genTex(1024,tilesFn(2,4,.0016,[170,168,162],[128,126,120],{bond:1,vary:.05,grain:.1,rough:.86,bev:1}),2.4,{normal:1.4,rough:1});
  M.paver=std({...paver,roughness:1});
  const concrete=genTex(1024,(u,v)=>{ const N=fbm(u,v,4,6,21),n=fbm(u,v,90,2,22),k=.95+(N-.5)*.1+(n-.5)*.08; return {c:[160*k,157*k,149*k],h:n*.3,r:.9}; },4,{normal:1.2});
  M.concrete=std({...concrete,roughness:.95});
  const asphalt=genTex(1024,(u,v)=>{ const N=fbm(u,v,5,4,31),s=hash(Math.floor(u*1024),Math.floor(v*1024),32),k=.8+(N-.5)*.4+(s>.8?.28:s<.15?-.14:0); return {c:[62*k,62*k,64*k],h:s*.5,r:.93}; },3,{normal:2});
  M.asphalt=std({...asphalt,roughness:.96});
  const sidewalk=genTex(1024,tilesFn(8,8,.0035,[176,162,146],[108,100,90],{vary:.2,grain:.15,rough:.86,bev:1}),3.2,{normal:2,rough:1});
  M.sidewalk=std({...sidewalk,roughness:1});
  const ground=genTex(512,(u,v)=>{ const N=fbm(u,v,3,5,41),k=.94+(N-.5)*.14; return {c:[150*k,146*k,136*k],h:N,r:.95}; },14,{normal:.7});
  M.ground=std({...ground,roughness:1});
  const earth=genTex(512,(u,v)=>{ const N=fbm(u,v,10,5,44),k=.85+(N-.5)*.6,G=fbm(u,v,4,4,45); const g=G>.52?1:.3; return {c:[(66-22*g)*k,(60+34*g)*k,(36-6*g)*k],h:N,r:.96}; },3,{normal:2});
  M.earth=std({...earth,roughness:1});
  const grass=genTex(1024,(u,v)=>{ const N=fbm(u,v,6,4,51),b=fbm(u,v,110,2,52),k=.72+(N-.5)*.6+(b-.5)*.55; return {c:[92*k,136*k,58*k],h:b,r:.9}; },3,{normal:2.4});
  M.grass=std({...grass,roughness:1});
  // Mặt sân thể thao acrylic xanh, tầng 1 (ảnh sân đa năng)
  const acrylic=genTex(512,(u,v)=>{ const n=fbm(u,v,70,2,61),k=1+(n-.5)*.1; return {c:[42*k,120*k,92*k],h:n*.2}; },2,{normal:.5});
  M.courtGreen=std({...acrylic,roughness:.72}); M.courtRed=std({color:0xa8352e,roughness:.7}); M.courtLine=std({color:0xf4f2ea,roughness:.7});
  M.yellowLine=std({color:0xe2b23a,roughness:.7});
  // Sàn cầu thang bậc khán đài: xám xanh
  const stepBlue=genTex(512,(u,v)=>{ const n=fbm(u,v,40,2,71),k=1+(n-.5)*.14; return {c:[104*k,122*k,140*k],h:n*.2}; },1.5,{normal:.6}); M.stepBlue=std({...stepBlue,roughness:.72});
  M.stepEdge=std({color:0x2c3136,roughness:.6});
  M.stair=std({...floorTile,roughness:1});
  // Gạch hoa gió đất nung
  const terra=genTex(512,(u,v)=>{ const n=fbm(u,v,14,4,81),b=fbm(u,v,2,3,83),k=.9+(n-.5)*.34+(b-.5)*.2; return {c:[172*k,112*k,78*k],h:n,r:.9}; },.6,{normal:1.6});
  M.terra=std({...terra,roughness:.95,side:THREE.DoubleSide});
  { // 1 m x 1 m: 8 cột x 6 hàng viên, mỗi viên một khe đứng, hàng so le nửa viên
    const N=512,c=makeCanvas(N),g=c.getContext('2d'),im=g.createImageData(N,N),hgt=new Float32Array(N*N);
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const row=Math.floor(y/N*6),fy=(y/N*6)%1,sh=row%2?.5:0,cx=(x/N*8+sh)%8,col=Math.floor(cx),fx=cx%1;
      const slot=fx>.36&&fx<.64&&fy>.14&&fy<.86, i=(y*N+x)*4, n=fbm(x/N,y/N,16,3,140), v=hash(col,row,141);
      const k=.9+(v-.5)*.12+(n-.5)*.14;
      im.data[i]=206*k; im.data[i+1]=172*k; im.data[i+2]=134*k; im.data[i+3]=slot?0:255;
      const e=Math.min(Math.abs(fx-.36),Math.abs(fx-.64),Math.abs(fy-.14),Math.abs(fy-.86)); hgt[y*N+x]=slot?0:Math.min(1,e*14); }
    g.putImageData(im,0,0);
    const nc=makeCanvas(N),ng=nc.getContext('2d'),ni=ng.createImageData(N,N);
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const xp=(x+1)%N,xm=(x-1+N)%N,yp=(y+1)%N,ym=(y-1+N)%N,dx=(hgt[y*N+xp]-hgt[y*N+xm])*2.2,dy=(hgt[yp*N+x]-hgt[ym*N+x])*2.2,l=Math.hypot(dx,dy,1),i=(y*N+x)*4; ni.data[i]=(-dx/l*.5+.5)*255; ni.data[i+1]=(dy/l*.5+.5)*255; ni.data[i+2]=(1/l*.5+.5)*255; ni.data[i+3]=255; }
    ng.putImageData(ni,0,0);
    M.breezeSlot=new THREE.MeshStandardMaterial({map:tex(c,1,true),normalMap:tex(nc,1,false),alphaTest:.5,side:THREE.DoubleSide,roughness:.9});
    M.breezeSlot.userData={};
  }
  // Đá granite xám cho bậc tam cấp lối vào chính
  const granite=genTex(512,(u,v)=>{ const n=hash(Math.floor(u*512),Math.floor(v*512),151),m=fbm(u,v,6,3,152),k=.82+(m-.5)*.16+(n>.86?.3:n<.1?-.32:0); return {c:[150*k,150*k,152*k],h:n*.3,r:.35}; },1.2,{normal:.8});
  M.granite=std({...granite,roughness:.42});
  M.gold=std({color:0xd8a73a,metalness:.78,roughness:.3});
  M.goldSide=std({color:0x9a7424,metalness:.7,roughness:.4});
  // Mái che vải xanh xếp nếp trên lối vào chính
  const val=genTex(512,(u,v)=>{ const w=Math.sin(u*Math.PI*2*24),k=.86+w*.12; return {c:[22*k,58*k,168*k],h:w*.5+.5,r:.7}; },2,{normal:3});
  M.valance=std({...val,roughness:.75,side:THREE.DoubleSide});
  M.stele=std({color:0xe9e6dd,roughness:.6});
  M.yellowPaint=std({color:0xf2c62a,roughness:.85}); M.stoolBlue=std({color:0x2f80d8,roughness:.5});
  M.blueSteel=std({color:0x1f5fc0,metalness:.4,roughness:.45});
  M.pinkFlower=std({color:0xd94b8f,roughness:.8});
  M.white=std({color:0xdcdad3,roughness:.72}); M.awning2=std({color:0x5d8ad6,roughness:.55,side:THREE.DoubleSide}); M.alu=std({color:0xe9e8e4,roughness:.42,metalness:.28}); M.steel=std({color:0x1d2124,roughness:.5,metalness:.55}); M.inox=std({color:0xa8aaac,roughness:.32,metalness:.92});
  M.blueFascia=std({color:0x1b3f97,roughness:.45}); M.awning=std({color:0x1d4aa8,roughness:.55,side:THREE.DoubleSide});
  M.glass=new THREE.MeshStandardMaterial({color:0x54646d,roughness:.05,metalness:.2,transparent:true,opacity:.3,envMapIntensity:1.9,depthWrite:false,side:THREE.DoubleSide}); M.glass.userData={noCast:true,noAO:true};
  M.cityGlass=std({color:0x40617f,roughness:.1,metalness:.92,envMapIntensity:1.5});
  const wood=genTex(512,(u,v)=>{ const w=fbm(u*.25,v*3,8,5,91),k=.86+(w-.5)*.55; return {c:[206*k,164*k,116*k],h:w*.2}; },.8,{normal:.6}); M.wood=std({...wood,roughness:.62});
  M.deskTop=std({...wood,roughness:.5,color:0xfff0dc}); M.deskFrame=std({color:0x4b5157,roughness:.5,metalness:.5});
  M.door=std({color:0xe6e2d8,roughness:.5});
  M.board=std({color:0x1e4d3c,roughness:.65}); M.boardFrame=std({color:0xc8c9c9,metalness:.7,roughness:.35});
  M.lamp=std({color:0xffffff,emissive:0xfff5e4,emissiveIntensity:.5,roughness:.4},{noCast:true});
  M.streetLamp=std({color:0xfff2d5,emissive:0xffd9a0,emissiveIntensity:.2},{noCast:true});
  M.fan=std({color:0xe8e8e2,roughness:.5,metalness:.15});
  M.plastic=std({color:0xd9d8d2,roughness:.55}); M.plasticDark=std({color:0x2b2d31,roughness:.5}); M.chairBlue=std({color:0x2a5da8,roughness:.5});
  M.seat=std({color:0x8b2c2c,roughness:.8}); M.screen=std({color:0x0e1216,emissive:0x1c3a5c,emissiveIntensity:.7,roughness:.2},{noCast:true});
  M.statue=std({color:0xcfccc4,roughness:.42});
  M.statueBase=std({color:0xbfbcb4,roughness:.6});
  const bark=genTex(512,(u,v)=>{ const n=fbm(u*5,v,10,4,121),m=fbm(u,v,5,3,122),k=.72+(n-.5)*1.1+(m-.5)*.3; return {c:[126*k,112*k,96*k],h:n,r:.95}; },1,{normal:4}); M.trunk=std({...bark,roughness:1}); M.flagPole=std({color:0xd8d8d8,metalness:.85,roughness:.28});
  const breeze=genTex(512,(u,v)=>{ return {c:[212,210,203],h:0}; },1,{normal:0}); M.breeze=std({...breeze,roughness:.8,side:THREE.DoubleSide});
  const roofSheet=genTex(512,(u,v)=>{ const w=Math.sin(u*Math.PI*2*10); const k=.92+fbm(u,v,4,3,95)*.1; return {c:[160*k,166*k,170*k],h:w*.5+.5,r:.5}; },2.5,{normal:5});
  M.roof=std({...roofSheet,roughness:.5,metalness:.55});
  M.stain=std({color:0x8d8b84,roughness:.95});
  M.gateBlue=std({color:0x20314f,roughness:.5,metalness:.55});
  M.tile2=std({color:0x6b7f96,roughness:.5});
  M.hedge=std({color:0x3f6d36,roughness:1});
  M.tyre=std({color:0x151515,roughness:.9}); M.bikeRed=std({color:0xb23a2f,metalness:.5,roughness:.42}); M.bikeBlue=std({color:0x2c4d8a,metalness:.5,roughness:.42}); M.bikeBlack=std({color:0x1a1c1e,metalness:.5,roughness:.42}); M.bikeSilver=std({color:0xa9aeb2,metalness:.8,roughness:.35});
  M.flagRed=std({color:0xd8201d,roughness:.75,side:THREE.DoubleSide},{noAO:true}); M.flagStar=std({color:0xffdd00,roughness:.75,side:THREE.DoubleSide},{noAO:true});
  M.pink=std({color:0xe9a39d,roughness:.85}); M.pinkTrim=std({color:0xf5ece2,roughness:.8}); M.roofTile=std({color:0x8f4e3a,roughness:.85});
  // Mặt tiền phố
  const fac=(wall,win,fr)=>{ const t=genTex(1024,(u,v)=>{ const c=u*3,r=v*3,fx=c%1,fy=r%1,inW=fx>.27&&fx<.73&&fy>.3&&fy<.74; const N=fbm(u,v,8,3,101),k=.9+(N-.5)*.25;
      if(inW){ const lit=hash(Math.floor(c),Math.floor(r),102); return {c:win.map(x=>x*(.75+lit*.5)),h:0,r:.12}; }
      if((fx>.24&&fx<.76&&fy>.27&&fy<.77)) return {c:fr,h:.6,r:.5}; return {c:wall.map(x=>x*k),h:1,r:.92}; },10,{normal:1.5,rough:1}); return std({...t,roughness:1,envMapIntensity:1.1}); };
  M.facA=fac([226,216,198],[84,92,98],[220,220,214]); M.facB=fac([214,216,212],[76,84,92],[240,240,236]); M.facC=fac([232,206,172],[82,90,96],[238,232,222]); M.facD=fac([204,204,186],[72,80,86],[226,226,220]); M.facE=fac([240,236,226],[88,98,108],[120,122,126]);
  M.towerBeige=fac([226,214,180],[62,74,86],[210,200,170]); for(const k of ['map','normalMap','roughnessMap']) if(M.towerBeige[k]) M.towerBeige[k].repeat.set(1/6.6,1/11.1);
  const tg=genTex(512,(u,v)=>{ const c=(u*8)%1,r=(v*4)%1,fr=c<.05||r<.04; const lit=hash(Math.floor(u*8),Math.floor(v*4),111); return fr?{c:[58,68,82],h:1,r:.4}:{c:[46+lit*12,86+lit*16,142+lit*20],h:0,r:.05}; },8,{normal:1,rough:1}); M.towerGlass=std({...tg,roughness:1,metalness:.6,envMapIntensity:1.5});
  M.roofTop=std({color:0x8f8d86,roughness:.95});
  return M;
}

// Thẻ lá kép lông chim (me tây, phượng) như ảnh sân trường: lá chét nhỏ, không gom thành mảng lớn
export function leafTexture(aniso){
  const size=1024,c=makeCanvas(size),g=c.getContext('2d'); const R=(a,b)=>a+Math.random()*(b-a);
  for(let k=0;k<105;k++){ const x=R(80,944),y=R(80,944),ang=R(0,Math.PI*2),len=R(120,300),sh=R(0,1);
    g.save(); g.translate(x,y); g.rotate(ang); const col=`rgb(${58+sh*46|0},${104+sh*50|0},${28+sh*20|0})`; g.fillStyle=col;
    for(let i=4;i<len;i+=7){ const w=(1-i/len)*20+9; for(const s of [-1,1]){ g.save(); g.translate(i,0); g.rotate(s*1.05); g.beginPath(); g.ellipse(w/2,0,w/2,3.2,0,0,Math.PI*2); g.fill(); g.restore(); } }
    g.strokeStyle='rgb(82,104,48)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,0); g.lineTo(len,0); g.stroke(); g.restore(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=Math.min(aniso,4); return t;
}
export function broadLeafTexture(aniso){
  const size=1024,c=makeCanvas(size),g=c.getContext('2d'); const R=(a,b)=>a+Math.random()*(b-a);
  for(let k=0;k<520;k++){ const x=R(40,984),y=R(40,984),a=R(0,6.28),l=R(26,52),w=l*R(.36,.5),sh=R(0,1);
    g.save(); g.translate(x,y); g.rotate(a); g.fillStyle=`rgb(${42+sh*46|0},${84+sh*56|0},${26+sh*16|0})`; g.beginPath(); g.moveTo(-l/2,0); g.quadraticCurveTo(0,-w,l/2,0); g.quadraticCurveTo(0,w,-l/2,0); g.fill(); g.strokeStyle='rgba(170,200,110,.42)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-l/2,0); g.lineTo(l/2,0); g.stroke(); g.restore(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=Math.min(aniso,4); return t;
}
// Hoa giấy hồng trong bồn trên cầu (ảnh cầu dây leo)
export function flowerTexture(aniso){
  const size=512,c=makeCanvas(size),g=c.getContext('2d'); const R=(a,b)=>a+Math.random()*(b-a);
  for(let k=0;k<90;k++){ const x=R(40,472),y=R(40,472),a=R(0,6.28),l=R(18,34),sh=R(0,1); g.save(); g.translate(x,y); g.rotate(a); g.fillStyle=`rgb(${60+sh*30|0},${110+sh*40|0},${36})`; g.beginPath(); g.ellipse(0,0,l/2,l/4,0,0,6.28); g.fill(); g.restore(); }
  for(let k=0;k<70;k++){ const x=R(50,462),y=R(50,462); for(let p=0;p<3;p++){ const a=p/3*6.28+R(-.3,.3),r=R(9,14),sh=R(0,1); g.fillStyle=`rgb(${210+sh*35|0},${50+sh*40|0},${120+sh*40|0})`; g.beginPath(); g.ellipse(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,r,r*.75,a,0,6.28); g.fill(); } g.fillStyle='#f6f0c8'; g.beginPath(); g.arc(x,y,2.5,0,6.28); g.fill(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=Math.min(aniso,4); return t;
}
// Dây leo rủ: sợi mảnh, lá nhỏ, có khoảng hở thấy xuyên qua
export function vineTexture(aniso){
  const W=256,H=1024,c=makeCanvas(W,H),g=c.getContext('2d'); const R=(a,b)=>a+Math.random()*(b-a);
  for(let s=0;s<6;s++){ const x=20+s*43+R(-14,14),sh=R(0,1),wob=R(0,6.28),amp=R(5,16); g.strokeStyle='rgba(112,120,58,.95)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x,0);
    const pts=[]; for(let y=0;y<=H;y+=8){ const nx=x+Math.sin(y/H*6.283*2+wob)*amp; pts.push([nx,y]); g.lineTo(nx,y);} g.stroke();
    for(const [px,py] of pts){ if(Math.random()<.9){ for(const sd of [-1,1]){ const l=R(16,30),w=l*.46,a=R(.7,1.55)*sd; g.save(); g.translate(px,py); g.rotate(a); const y=R(0,1)*sh; g.fillStyle=`rgb(${104+y*70|0},${146+y*48|0},${40+y*26|0})`; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(l*.5,-w,l,0); g.quadraticCurveTo(l*.5,w,0,0); g.fill(); g.restore(); } } }
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=Math.min(aniso,4); t.wrapT=THREE.RepeatWrapping; return t;
}

// Chữ dạng bảng hiệu, trả về texture có alpha
export function textTexture(lines,o={}){
  const w=o.w||2048,h=o.h||256,c=makeCanvas(w,h),g=c.getContext('2d'); if(o.bg){ g.fillStyle=o.bg; g.fillRect(0,0,w,h); }
  g.textAlign=o.align||'center'; g.textBaseline='middle';
  lines.forEach(l=>{ g.fillStyle=l.color||o.color||'#fff'; g.font=`${l.weight||o.weight||700} ${l.size}px "Be Vietnam Pro", "Helvetica Neue", Arial, sans-serif`; g.shadowColor='transparent'; if(l.stroke){ g.strokeStyle=l.stroke; g.lineWidth=l.sw||6; g.lineJoin='round'; g.strokeText(l.t,l.x===undefined?w/2:l.x,l.y); } g.fillText(l.t,l.x===undefined?w/2:l.x,l.y); });
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
