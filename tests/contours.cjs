const assert=require('node:assert/strict');const C=require('../dist/contours.js');
function image(w,h,fn){const a=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=fn(x,y);a.set(p.length===4?p:[p[0],p[0],p[0],255],(y*w+x)*4);}return a;}
const basic={denoise:0,cleanup:'none',minArea:0,simplify:0,smooth:0,ignoreFrame:false};
const solid=image(64,64,(x,y)=>[x>=10&&x<54&&y>=12&&y<52?0:255]);
let r=C.process(solid,64,64,{...basic,method:'auto'});assert.equal(r.paths.length,1);assert.equal(r.paths[0].area,44*40);assert.equal(r.stats.polarity,'dark');assert.equal(r.paths[0].hole,false);
const light=image(64,64,(x,y)=>[x>=10&&x<54&&y>=12&&y<52?255:0]);r=C.process(light,64,64,{...basic,method:'auto'});assert.equal(r.paths.length,1);assert.equal(r.stats.polarity,'light');
const alpha=image(64,64,(x,y)=>[255,255,255,(x-32)**2+(y-32)**2<400?255:0]);r=C.process(alpha,64,64,{...basic,method:'auto'});assert.equal(r.stats.method,'alpha');assert.equal(r.paths.length,1);assert(r.paths[0].area>1200);
const ring=image(80,80,(x,y)=>{const r=(x-40)**2+(y-40)**2;return[r<900&&r>144?0:255];});r=C.process(ring,80,80,{...basic,method:'otsu'});assert.equal(r.paths.length,2);assert.equal(r.paths.filter(p=>p.hole).length,1);assert.equal(C.process(ring,80,80,{...basic,includeHoles:false}).paths.length,1);
const noisy=image(64,64,(x,y)=>[(x>=10&&x<45&&y>=10&&y<45)||(x===55&&y===55)?0:255]);r=C.process(noisy,64,64,{...basic,minArea:8});assert.equal(r.paths.length,1);assert.equal(r.stats.removed,1);
const diagonal=new Uint8Array([1,0,0,1]);const loops=C.trace(diagonal,2,2);assert.equal(loops.length,2);assert.deepEqual(loops.map(C.area),[1,1]);
for(const value of [0,255])assert.equal(C.process(image(64,64,()=>[value]),64,64).paths.length,0);
const sloped=image(100,80,(x,y)=>[Math.max(0,Math.round(120+x*1.2-(x>25&&x<75&&y>20&&y<60?70:0)))]);r=C.process(sloped,100,80,{...basic,method:'adaptive',polarity:'dark',minArea:8});assert(r.paths.length>0,'Adaptive threshold detects an object on a gradient');
r=C.process(solid,64,64,{...basic,method:'edges',threshold:80,minArea:2});assert(r.paths.length>0,'Hysteresis edges detect rectangle');
const raw=C.process(solid,64,64,basic),simple=C.process(solid,64,64,{...basic,simplify:1});assert.equal(simple.paths[0].points.length,4);assert(simple.paths[0].points.length<raw.paths[0].points.length);assert.equal(C.process(solid,64,64,{...basic,simplify:1,smooth:2}).paths[0].points.length,16);
const source=new Uint8ClampedArray(solid);C.process(solid,64,64);assert.deepEqual(solid,source,'Input pixels remain unchanged');
console.log('PASS: automatic polarity, alpha masks, inner contours, speck removal, diagonal topology, blank images, adaptive thresholds, edges, simplification, smoothing, immutable input.');
