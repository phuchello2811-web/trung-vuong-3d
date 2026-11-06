import fs from 'fs';
const q=`[out:json][timeout:60];(way["building"](around:420,16.0669965,108.2222309);way["highway"](around:460,16.0669965,108.2222309););out geom tags;`;
let d;
for (const u of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']) {
  for (let i=0;i<3&&!d;i++){ try{ const r=await fetch(u,{method:'POST',headers:{'User-Agent':'school-model-research/1.0','Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)}); const t=await r.text(); if(t.startsWith('{')) d=JSON.parse(t); else await new Promise(s=>setTimeout(s,4000)); }catch(e){} }
  if(d)break;
}
const lat0=16.0669965,lon0=108.2222309,mx=111320*Math.cos(lat0*Math.PI/180),my=110574,th=5.58*Math.PI/180;
const f=n=>{const E=(n.lon-lon0)*mx,N=(n.lat-lat0)*my;const e=E*Math.cos(th)-N*Math.sin(th),nn=E*Math.sin(th)+N*Math.cos(th);return [+(e+0.55).toFixed(1),+(-nn).toFixed(1)]};
const out={b:[],r:[]};
for(const e of d.elements){const t=e.tags||{};if(!e.geometry)continue;
 if(t.building){ if(e.id==1126018393)continue; let h=+t.height||(t['building:levels']?t['building:levels']*3.5:0); out.b.push({p:e.geometry.slice(0,-1).map(f),h,n:t.name||undefined,id:e.id}); }
 else if(t.highway&&!['footway','steps','path','cycleway','pedestrian'].includes(t.highway)){ out.r.push({p:e.geometry.map(f),k:t.highway,n:t.name||undefined}); }
}
console.log('buildings',out.b.length,'roads',out.r.length, 'named', out.b.filter(b=>b.n).map(b=>b.n+':'+b.h));
console.log('roads named',[...new Set(out.r.map(r=>r.n))]);
fs.writeFileSync('src/osm_data.js','export default '+JSON.stringify(out)+';\n');
