// Sinh danh sách góc chụp cho mọi loại phòng: một lần nhìn về tường có cửa, một lần nhìn ngược lại
import { ROOMS, X, Z, Y } from '../src/plan.js';
import fs from 'fs';
const yawOf={Qmax:-Math.PI/2,Qmin:Math.PI/2,Pmax:0,Pmin:Math.PI};
const seen=new Set(), shots=[];
for(const r of ROOMS){
  const W=Math.round(r.P1-r.P0), D=Math.round(r.Q1-r.Q0), key=`${r.kind}|${r.name}|${W}x${D}|${r.door}`;
  if(seen.has(key)) continue; seen.add(key);
  const x=X((r.Q0+r.Q1)/2), z=Z((r.P0+r.P1)/2), y=Y[r.L]+1.55, yaw=yawOf[r.door], tag=`${r.L}_${r.kind}_${r.P0|0}_${r.Q0|0}`;
  shots.push({name:`room_${tag}_a`,p:[x,y,z],y:yaw,x:-.12,h:10});
  shots.push({name:`room_${tag}_b`,p:[x,y,z],y:yaw+Math.PI,x:-.12});
}
fs.writeFileSync('tools/out/roomshots.json',JSON.stringify(shots)); console.log(shots.length,'góc chụp');
