// Optional production tool. Requires @napi-rs/canvas and FFmpeg, not used at runtime.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{once}=require('node:events');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas'),F=require('../dist/math.js'),R=require('../dist/render.js');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Arial');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf','Georgia');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf','monospace');
const dir=path.resolve(__dirname,'../dist/story');fs.mkdirSync(dir,{recursive:true});
const points=F.normalize(F.resample(F.preset('moore'))),co=F.dft(points),x=F.dft(points,'x'),y=F.dft(points,'y');
const headlines=[['This is made of','rotating circles.'],['A little math.','A lot of motion.'],['Your lines.','Your own orbit.']];
const states=[7,31,255].map((n,i)=>{const selected=F.select(co,n),sx=F.select(x,n),sy=F.select(y,n),recon=F.reconstruction(selected,sx,sy,8192,'xy'),error=F.rms(points,recon).toFixed(2);recon.push({...recon[0]});return{points,selected,sx,sy,recon,n,error,mode:'xy',name:'Moore curve · '+n+' Fourier terms',bg:'#111617',trace:'#ff8469',original:true,circles:true,guides:true,headline:headlines[i],subtitle:i===2?'Sketch a path. Upload a shape. Export a story.':'More frequencies. More of the original shape.',cta:i===2?'TRY IT YOURSELF · TAP THE LINK ↗':'ORBIT / AN INTERACTIVE EXPERIMENT'};});
async function main(){
 const canvas=createCanvas(1080,1920),c=canvas.getContext('2d');
 const review=path.resolve(__dirname,'../artifacts/video-review');fs.mkdirSync(review,{recursive:true});
 const out=path.join(dir,'orbit-story.mp4');
 const encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1080x1920','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart','-metadata','title=Orbit — Fourier Pattern Studio',out],{stdio:['pipe','inherit','inherit']});
 const completed=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('exit',code=>code===0?resolve():reject(Error('FFmpeg exited '+code)));});
 encoder.stdin.on('error',()=>{});
 for(let frame=0;frame<450;frame++){
  const section=Math.min(2,Math.floor(frame/150)),local=(frame%150)/30,t=Math.min(1,local/4.2);
  R.draw(c,1080,1920,states[section],t,'story',true);
  // Editorial section markers; all mathematical geometry uses the web renderer.
  c.fillStyle='#303638';c.fillRect(78,175,924,3);c.fillStyle='#ff8469';c.fillRect(78,175,924*(frame+1)/450,3);
  if(frame===390)fs.writeFileSync(path.join(dir,'poster.jpg'),canvas.toBuffer('image/jpeg',90));
  if(frame===90||frame===240||frame===420)fs.writeFileSync(path.join(review,'frame-'+frame+'.png'),canvas.toBuffer('image/png'));
  if(!encoder.stdin.write(c.getImageData(0,0,1080,1920).data))await once(encoder.stdin,'drain');
  if(frame%90===0)console.log('Rendered',frame,'/ 450');
 }
 encoder.stdin.end();await completed;console.log('Created '+out+' ('+fs.statSync(out).size+' bytes)');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
