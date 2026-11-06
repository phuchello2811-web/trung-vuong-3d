// Lấy đường nét chữ từ font thật để dựng chữ nổi 3D: node tools/make_letters.mjs
import opentype from 'opentype.js'; import fs from 'fs';
const font=opentype.loadSync('tools/fonts/BarlowCondensed-Bold.ttf');
const TEXTS={ main:'TRƯỜNG THCS TRƯNG VƯƠNG', eng:'TRUNG VUONG SECONDARY SCHOOL' };
const out={};
for(const [k,t] of Object.entries(TEXTS)){
  const size=1000, path=font.getPath(t,0,0,size,{kerning:true}), bb=path.getBoundingBox();
  const cap=font.charToGlyph('H').getBoundingBox().y2*size/font.unitsPerEm;   // chiều cao chữ hoa = 1 đơn vị
  const f=v=>Math.round(v/cap*1000)/1000, cmds=[];
  for(const c of path.commands){            // lật trục y về hướng lên
    if(c.type==='M'||c.type==='L') cmds.push(c.type,f(c.x),f(-c.y));
    else if(c.type==='Q') cmds.push('Q',f(c.x1),f(-c.y1),f(c.x),f(-c.y));
    else if(c.type==='C') cmds.push('C',f(c.x1),f(-c.y1),f(c.x2),f(-c.y2),f(c.x),f(-c.y));
    else if(c.type==='Z') cmds.push('Z');
  }
  out[k]={w:f(bb.x2-bb.x1),x0:f(bb.x1),top:f(-bb.y1),bottom:f(-bb.y2),cmds};
  console.log(k,t,'rộng',out[k].w,'cao từ',out[k].bottom,'đến',out[k].top,cmds.length);
}
fs.writeFileSync('src/letters_data.js','// Sinh bởi tools/make_letters.mjs từ Barlow Condensed Bold (SIL OFL)\nexport default '+JSON.stringify(out)+';\n');
