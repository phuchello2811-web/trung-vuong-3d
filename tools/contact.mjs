// Ghép nhiều ảnh thành tờ ảnh thu nhỏ có đánh số: node tools/contact.mjs <thư mục> <ra> <cột> <tệp...>
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path';
const [,,dir,out,colsS,...files]=process.argv; const cols=+colsS||3, W=1500, cw=Math.floor(W/cols), ch=Math.floor(cw*0.75);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
const p=await b.newPage(); const rows=Math.ceil(files.length/cols); await p.setViewport({width:W,height:rows*ch});
const cells=files.map(f=>{ const ext=path.extname(f).slice(1).replace('jpg','jpeg'); return `<div style="position:relative;width:${cw}px;height:${ch}px;background:#222;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="data:image/${ext};base64,${fs.readFileSync(path.join(dir,f)).toString('base64')}" style="max-width:100%;max-height:100%"><b style="position:absolute;left:4px;top:4px;background:#ff0;color:#000;font:700 22px Arial;padding:1px 6px">${f}</b></div>`; }).join('');
await p.setContent(`<body style="margin:0;display:flex;flex-wrap:wrap;width:${W}px">${cells}</body>`,{waitUntil:'load'});
await p.screenshot({path:out,type:'jpeg',quality:82}); await b.close();
