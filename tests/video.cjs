'use strict';
const assert=require('node:assert/strict'),V=require('../dist/video.js'),F=require('../dist/math.js'),R=require('../dist/render.js');
assert.deepEqual(V.dimensions('story','hd'),{width:1080,height:1920});assert.deepEqual(V.dimensions('square','fast'),{width:720,height:720});assert.deepEqual(V.dimensions('landscape','hd'),{width:1920,height:1080});
assert.equal(V.progress(14000,15000),1);assert.equal(V.progress(15000,15000),1);assert.equal(V.progress(-1,15000),0);
assert.equal(V.available({isTypeSupported:m=>m.includes('webm')})[0].ext,'webm');assert.equal(V.available({isTypeSupported:()=>true})[0].ext,'mp4');assert.equal(V.available(null).length,0);
// Shared renderer endpoints agree with the Fourier model, including even N=5,000.
const points=F.normalize(F.resample(F.preset('moore'))),ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
for(const mode of ['xy','complex']){const selected=F.select(F.dft(points),5000),sx=F.select(F.dft(points,'x'),5000),sy=F.select(F.dft(points,'y'),5000),recon=F.reconstruction(selected,sx,sy,8192,mode);recon.push({...recon[0]});const state={points,selected,sx,sy,recon,n:5000,error:'0',mode,trace:'#ff8469',bg:'#111617',original:true,circles:true,guides:true};for(const t of [0,.25,.75,1]){const tip=R.scene(ctx,1000,780,state,t);const value=mode==='xy'?{x:F.at(sx,t).x,y:F.at(sy,t).x}:F.at(selected,t),scale=mode==='xy'?190:270;assert(Math.abs(tip.x-((mode==='xy'?665:500)+value.x*scale))<1e-8);assert(Math.abs(tip.y-((mode==='xy'?490:395)+value.y*scale))<1e-8);}for(const layout of ['story','square','landscape']){const {width,height}=V.dimensions(layout,'hd');R.draw(ctx,width,height,state,1,layout);}}
class FakeDoc extends EventTarget {hidden=false;}
function harness({failure=false,empty=false}={}){
 let callback,elapsed=0,stopped=0,draws=[];const doc=new FakeDoc(),signal=new AbortController();
 class Recorder {state='inactive';mimeType='video/mp4';constructor(){if(failure)throw Error('encoder unavailable');}start(){this.state='recording';}stop(){this.state='inactive';queueMicrotask(()=>{if(!empty)this.ondataavailable({data:new Blob(['frame'])});this.onstop();});}}
 const promise=V.record({canvas:{width:1080,height:1920,captureStream:()=>({getTracks:()=>[{stop(){stopped++;}}]})},draw:t=>draws.push(t),duration:6,format:{mime:'video/mp4'},Recorder,raf:cb=>{callback=cb;return 1;},caf:()=>{callback=null;},now:()=>elapsed,doc,signal:signal.signal});
 return{promise,signal,doc,draws,stopped:()=>stopped,step(ms){elapsed=ms;callback?.();}};
}
async function main(){
 let h=harness();h.step(5000);h.step(6000);const r=await h.promise;assert.equal(r.ext,'mp4');assert.equal(r.blob.size,5);assert.equal(h.draws.at(-1),1);assert.equal(h.stopped(),1);
 h=harness();h.signal.abort();await assert.rejects(h.promise,/cancelled/);assert.equal(h.stopped(),1);
 h=harness();h.doc.hidden=true;h.doc.dispatchEvent(new Event('visibilitychange'));await assert.rejects(h.promise,/hidden/);assert.equal(h.stopped(),1);
 h=harness({failure:true});await assert.rejects(h.promise,/encoder unavailable/);assert.equal(h.stopped(),1);
 h=harness({empty:true});h.step(6000);await assert.rejects(h.promise,/empty video/);assert.equal(h.stopped(),1);
 const fs=require('node:fs'),html=fs.readFileSync('dist/index.html','utf8'),js=fs.readFileSync('dist/video-ui.js','utf8');for(const m of js.matchAll(/\$\('([^']+)'\)/g))assert(html.includes('id="'+m[1]+'"'),'Export DOM target '+m[1]);
 console.log('PASS: export dimensions, codec fallback, complete-loop timing, render/model agreement at 5,000 terms, cancellation, visibility abort, encoder failure, empty output and resource cleanup.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
