// Đóng gói src/ thành một file dist/index.html duy nhất (three.js tải từ CDN).
import { build } from 'esbuild'; import fs from 'fs'; import { fileURLToPath } from 'url';
const shim={name:'three-global',setup(b){ b.onResolve({filter:/^three$/},()=>({path:'three',namespace:'three-global'})); b.onLoad({filter:/.*/,namespace:'three-global'},()=>({contents:'module.exports=window.THREE;',loader:'js'})); }};
export async function buildHtml({min=false,extraScript='',pages=false}={}){
  const r=await build({entryPoints:['src/main.js'],bundle:true,format:'iife',write:false,minify:min,sourcemap:min?false:'inline',target:'es2020',plugins:[shim],logLevel:'warning',charset:'utf8'});
  const js=r.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
  const logo=fs.readFileSync('src/logo_data.js','utf8').match(/"(data:image[^"]+)"/)[1];
  let html=fs.readFileSync('src/index.template.html','utf8').replaceAll('__LOGO__',logo)
    .replace('<!--__FIREBASE_CONFIG__-->',pages?'<script src="firebase-config.js"></script>':''); const k='/*__BUNDLE__*/',i=html.indexOf(k);
  return html.slice(0,i)+js+html.slice(i+k.length)+extraScript;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const min=process.argv.includes('--min');
  // dist/: một file để đăng artifact (không có Firebase). docs/: bản GitHub Pages, đọc docs/firebase-config.js
  const html=await buildHtml({min}); fs.mkdirSync('dist',{recursive:true}); fs.writeFileSync('dist/index.html',html); console.log('dist/index.html',(html.length/1024).toFixed(0)+' KB');
  const page='<!doctype html>\n<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="description" content="Mô hình 3D tỉ lệ 1:1 và game học tập tại Trường THCS Trưng Vương, 88 Yên Bái, Đà Nẵng.">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style></head><body>\n'+await buildHtml({min,pages:true})+'\n</body></html>\n';
  fs.mkdirSync('docs',{recursive:true}); fs.writeFileSync('docs/index.html',page); console.log('docs/index.html',(page.length/1024).toFixed(0)+' KB');
  if(!fs.existsSync('docs/firebase-config.js')) fs.copyFileSync('docs/firebase-config.example.js','docs/firebase-config.js');
}
