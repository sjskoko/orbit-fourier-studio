(function(root){
'use strict';
const TAU=Math.PI*2;
function path(c,arr,ox,oy,scale,color,width,limit=arr.length,closed=false){
 if(!arr.length)return;limit=Math.min(limit,arr.length);c.beginPath();
 for(let i=0;i<limit;i++){const p=arr[i];i?c.lineTo(ox+p.x*scale,oy+p.y*scale):c.moveTo(ox+p.x*scale,oy+p.y*scale);}
 if(closed)c.closePath();c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();
}
function chain(c,list,t,ox,oy,scale,color,circles=true,rot=0){
 let x=ox,y=oy;c.strokeStyle=color;
 for(const v of list){const r=v.amp*scale,a=v.phase+TAU*v.f*t+rot,nx=x+r*Math.cos(a),ny=y+r*Math.sin(a);
  if(circles&&r>.22){c.globalAlpha=.42;c.lineWidth=.85;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.globalAlpha=.65;c.beginPath();c.moveTo(x,y);c.lineTo(nx,ny);c.stroke();}x=nx;y=ny;}
 c.globalAlpha=1;c.fillStyle=color;c.beginPath();c.arc(x,y,3,0,TAU);c.fill();return{x,y};
}
function scene(c,w,h,s,t){
 t=Math.max(0,Math.min(1,t));c.save();const fit=Math.min(w/1000,h/780);c.translate((w-1000*fit)/2,(h-780*fit)/2);c.scale(fit,fit);
 c.fillStyle='#73827b';c.globalAlpha=.14;for(let x=35;x<1000;x+=30)for(let y=60;y<740;y+=30)c.fillRect(x,y,1.2,1.2);c.globalAlpha=1;
 const xy=s.mode==='xy',ox=xy?665:500,oy=xy?490:395,scale=xy?190:270;
 if(s.original)path(c,s.points,ox,oy,scale,'#a4afa629',xy?8:5,s.points.length,true);
 let target;
 if(xy){const a=chain(c,s.sx,t,ox,185,scale,'#95cabb',s.circles),b=chain(c,s.sy,t,185,oy,scale,'#e3bf75',s.circles,Math.PI/2);target={x:a.x,y:b.y};
  if(s.guides){c.setLineDash([7,9]);c.lineWidth=1;c.strokeStyle='#95cabb77';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(target.x,target.y);c.stroke();c.strokeStyle='#e3bf7577';c.beginPath();c.moveTo(b.x,b.y);c.lineTo(target.x,target.y);c.stroke();c.setLineDash([]);}
  c.font='11px Arial, sans-serif';c.fillStyle='#95cabb';c.fillText('X / REAL',ox-35,55);c.fillStyle='#e3bf75';c.fillText('Y / REAL',65,oy-230);
 }else target=chain(c,s.selected,t,ox,oy,scale,'#95cabb',s.circles);
 const count=Math.max(1,Math.floor(t*(s.recon.length-1))+1),col=s.trace;
 path(c,s.recon,ox,oy,scale,col,2.8,count);c.beginPath();c.moveTo(ox+s.recon[count-1].x*scale,oy+s.recon[count-1].y*scale);c.lineTo(target.x,target.y);c.strokeStyle=col;c.stroke();c.fillStyle=col;c.shadowColor=col;c.shadowBlur=13;c.beginPath();c.arc(target.x,target.y,4,0,TAU);c.fill();c.shadowBlur=0;
 c.fillStyle='#b6c2b6';c.font='italic 42px Georgia';c.fillText('N = '+s.n,65,695);c.font='16px monospace';c.fillStyle='#80908a';c.fillText('NRMSE '+s.error+'%',65,730);c.restore();return target;
}
function draw(c,w,h,s,t,layout='canvas',branded=true){
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.fillStyle=s.bg;c.fillRect(0,0,w,h);
 if(layout==='canvas'){scene(c,w,h,s,t);return;}
 c.save();c.scale(w/1080,w/1080);const H=h*1080/w,story=layout==='story';
 if(story){
  c.fillStyle='#95cabb';c.font='500 20px Arial, sans-serif';c.fillText('ORBIT / FOURIER PATTERN STUDIO',78,270);
  const headline=s.headline||['Every line begins','with a circle.'];
  c.fillStyle='#eceae3';c.font='500 62px Arial, sans-serif';c.fillText(headline[0],76,375);c.fillText(headline[1],76,451);
  c.fillStyle='#919b9b';c.font='23px Arial, sans-serif';c.fillText(s.subtitle||'Draw. Upload. Let the circles find it.',78,516);
  c.save();c.translate(10,610);scene(c,1060,827,s,t);c.restore();
  c.fillStyle='#eceae3';c.font='25px Arial, sans-serif';c.fillText(String(s.name).slice(0,38),78,1515);
  c.fillStyle='#919b9b';c.font='20px Arial, sans-serif';c.fillText('1–5,000 terms · Made from your own lines',78,1560);
  if(branded){c.fillStyle='#ff8469';c.font='500 23px Arial, sans-serif';c.fillText(s.cta||'MAKE YOUR OWN ↗',78,1640);}
 }else{
  c.fillStyle='#95cabb';c.font='20px Arial, sans-serif';c.fillText('ORBIT / '+String(s.name).slice(0,40),50,65);
  c.save();c.translate(0,100);scene(c,1080,H-190,s,t);c.restore();
  if(branded){c.fillStyle='#919b9b';c.font='20px Arial, sans-serif';c.fillText('Draw · Upload · Animate',50,H-45);}
 }
 c.restore();
}
const api={path,chain,scene,draw};if(typeof module!=='undefined')module.exports=api;else root.OrbitRender=api;
})(globalThis);
