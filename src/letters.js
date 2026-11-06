import * as THREE from 'three';
import DATA from './letters_data.js';

// Chữ nổi 3D: đùn khối từ đường nét font thật, có vát cạnh như chữ inox mạ.
// Trả về geometry trong hệ: x dọc dòng chữ (căn giữa), y lên, mặt chữ hướng +z, đáy chữ hoa ở y=0.
export function letterGeometry(key,capH,depth=.05){
  const d=DATA[key], sp=new THREE.ShapePath(), c=d.cmds;
  for(let i=0;i<c.length;){ const t=c[i++];
    if(t==='M') sp.moveTo(c[i++],c[i++]);
    else if(t==='L') sp.lineTo(c[i++],c[i++]);
    else if(t==='Q') sp.quadraticCurveTo(c[i++],c[i++],c[i++],c[i++]);
    else if(t==='C') sp.bezierCurveTo(c[i++],c[i++],c[i++],c[i++],c[i++],c[i++]);
    else if(t==='Z'){ /* đóng nét: ShapePath tự đóng khi tạo shape */ }
  }
  const shapes=sp.toShapes(false);
  const geo=new THREE.ExtrudeGeometry(shapes,{depth:depth/capH,bevelEnabled:true,bevelThickness:.016,bevelSize:.011,bevelSegments:2,curveSegments:7});
  geo.translate(-(d.x0+d.w/2),0,0); geo.scale(capH,capH,capH);
  geo.computeVertexNormals();
  return {geo,width:d.w*capH};
}
