// Đóng gói src/ thành một file dist/index.html duy nhất (three.js tải từ CDN).
import { build } from 'esbuild'; import fs from 'fs'; import { fileURLToPath } from 'url';
const shim={name:'three-global',setup(b){ b.onResolve({filter:/^three$/},()=>({path:'three',namespace:'three-global'})); b.onLoad({filter:/.*/,namespace:'three-global'},()=>({contents:'module.exports=window.THREE;',loader:'js'})); }};
export async function buildHtml({min=false,extraScript=''}={}){
  const r=await build({entryPoints:['src/main.js'],bundle:true,format:'iife',write:false,minify:min,sourcemap:min?false:'inline',target:'es2020',plugins:[shim],logLevel:'warning',charset:'utf8'});
  const js=r.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
  let html=fs.readFileSync('src/index.template.html','utf8'); const k='/*__BUNDLE__*/',i=html.indexOf(k);
  return html.slice(0,i)+js+html.slice(i+k.length)+extraScript;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const html=await buildHtml({min:process.argv.includes('--min')});
  fs.mkdirSync('dist',{recursive:true}); fs.writeFileSync('dist/index.html',html); console.log('dist/index.html',(html.length/1024).toFixed(0)+' KB');
}
