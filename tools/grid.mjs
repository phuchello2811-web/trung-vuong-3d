import puppeteer from 'puppeteer-core';
const [,, dir, out] = process.argv;
const b = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
const p = await b.newPage();
await p.setViewport({width:1560,height:1090});
for (const [name,x0,y0,x1,y1] of JSON.parse(process.argv[4])) {
  const k = Math.min(1560/(x1-x0),1090/(y1-y0));
  await p.setContent(`<body style="margin:0;background:#fff"><canvas id=c></canvas></body>`);
  const data = (await import('fs')).readFileSync(`${dir}/${name}.jpg`).toString('base64');
  await p.evaluate(async (data,x0,y0,x1,y1,k)=>{
    const im=new Image();im.src='data:image/jpeg;base64,'+data;await im.decode();
    const c=document.getElementById('c');c.width=(x1-x0)*k;c.height=(y1-y0)*k;const g=c.getContext('2d');
    const f=im.width/1000; g.imageSmoothingQuality='high';
    g.drawImage(im,x0*f,y0*f,(x1-x0)*f,(y1-y0)*f,0,0,c.width,c.height);
    g.font='bold 12px monospace';
    for(let x=Math.ceil(x0/10)*10;x<=x1;x+=10){const M=x%50==0;g.strokeStyle=M?'rgba(255,0,0,.75)':'rgba(255,0,0,.2)';g.lineWidth=M?1.2:.6;g.beginPath();g.moveTo((x-x0)*k,0);g.lineTo((x-x0)*k,c.height);g.stroke();if(M){g.fillStyle='#d00';g.fillText(x,(x-x0)*k+2,12);}}
    for(let y=Math.ceil(y0/10)*10;y<=y1;y+=10){const M=y%50==0;g.strokeStyle=M?'rgba(0,0,255,.75)':'rgba(0,0,255,.2)';g.lineWidth=M?1.2:.6;g.beginPath();g.moveTo(0,(y-y0)*k);g.lineTo(c.width,(y-y0)*k);g.stroke();if(M){g.fillStyle='#00d';g.fillText(y,2,(y-y0)*k-2);}}
  },data,x0,y0,x1,y1,k);
  const el=await p.$('#c'); await el.screenshot({path:`${out}/${name}_g.png`});
}
await b.close();
