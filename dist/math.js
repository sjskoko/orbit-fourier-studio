(function(root){
'use strict';
function resample(points,n=8192){
 const p=points.filter((v,i)=>!i||Math.hypot(v.x-points[i-1].x,v.y-points[i-1].y)>1e-7).map(p=>({...p}));
 if(p.length<3)throw Error('Draw a path containing at least three points.');
 p.push({...p[0]}); const d=[0];for(let i=1;i<p.length;i++)d.push(d[i-1]+Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y));
 if(d.at(-1)<1e-6)throw Error('Please draw a longer path.');
 let j=1;return Array.from({length:n},(_,i)=>{let t=i*d.at(-1)/n;while(d[j]<t)j++;let f=(t-d[j-1])/(d[j]-d[j-1]||1);return{x:p[j-1].x*(1-f)+p[j].x*f,y:p[j-1].y*(1-f)+p[j].y*f};});
}
function normalize(p){const xs=p.map(v=>v.x),ys=p.map(v=>v.y),cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2,s=2/Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),1e-6);return p.map(v=>({x:(v.x-cx)*s,y:(v.y-cy)*s}));}
function fft(re,im,inverse=false){
 const n=re.length;if(n<1||(n&(n-1)))throw Error('FFT requires power-of-two samples');
 for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
 for(let len=2;len<=n;len*=2){const angle=(inverse?2:-2)*Math.PI/len,wr=Math.cos(angle),wi=Math.sin(angle);for(let base=0;base<n;base+=len){let ur=1,ui=0;for(let k=0;k<len/2;k++){const i=base+k,j=i+len/2,vr=re[j]*ur-im[j]*ui,vi=re[j]*ui+im[j]*ur;re[j]=re[i]-vr;im[j]=im[i]-vi;re[i]+=vr;im[i]+=vi;const next=ur*wr-ui*wi;ui=ur*wi+ui*wr;ur=next;}}}
 if(inverse)for(let i=0;i<n;i++){re[i]/=n;im[i]/=n;}return{re,im};
}
function dft(p,kind='complex'){const n=p.length,re=Float64Array.from(p,v=>kind==='y'?v.y:v.x),im=Float64Array.from(p,v=>kind==='complex'?v.y:0);fft(re,im);return Array.from({length:n},(_,i)=>{const r=re[i]/n,m=im[i]/n;return{f:i<n/2?i:i-n,re:r,im:m,amp:Math.hypot(r,m),phase:Math.atan2(m,r)};});}
// Keep exactly N signed-frequency terms, from DC to increasing |frequency|.
function select(c,n){return [...c].sort((a,b)=>Math.abs(a.f)-Math.abs(b.f)||b.f-a.f).slice(0,n).sort((a,b)=>b.amp-a.amp);}
function reconstruct(c,n=8192){const re=new Float64Array(n),im=new Float64Array(n);for(const v of c){const i=(v.f+n)%n;re[i]=v.re*n;im[i]=v.im*n;}fft(re,im,true);return Array.from({length:n},(_,i)=>({x:re[i],y:im[i]}));}
function reconstruction(c,x,y,n=8192,mode='complex'){if(mode==='complex')return reconstruct(c,n);const xx=reconstruct(x,n),yy=reconstruct(y,n);return xx.map((p,i)=>({x:p.x,y:yy[i].x}));}
function rms(p,q){let e=0,b=0,mx=p.reduce((s,v)=>s+v.x,0)/p.length,my=p.reduce((s,v)=>s+v.y,0)/p.length;for(let i=0;i<p.length;i++){e+=(q[i].x-p[i].x)**2+(q[i].y-p[i].y)**2;b+=(p[i].x-mx)**2+(p[i].y-my)**2;}return Math.sqrt(e/Math.max(b,1e-12))*100;}
function at(c,t){let x=0,y=0;for(const v of c){const a=v.phase+2*Math.PI*v.f*t;x+=v.amp*Math.cos(a);y+=v.amp*Math.sin(a);}return{x,y};}
function error(p,c){return rms(p,reconstruct(c,p.length));}
function moore(order=3){let s='LFL+F+LFL';for(let i=0;i<order;i++)s=[...s].map(c=>c==='L'?'-RF+LFL+FR-':c==='R'?'+LF-RFR-FL+':c).join('');let x=0,y=0,a=0,p=[{x,y}];for(const c of s){if(c==='+')a+=Math.PI/2;else if(c==='-')a-=Math.PI/2;else if(c==='F'){x+=Math.cos(a);y+=Math.sin(a);p.push({x,y});}}return p;}
const presetCatalog=[
 {id:'moore',label:'Moore curve',category:'fractals',description:'A continuous space-filling loop. More terms reveal its tight corners.'},
 {id:'heart',label:'Heart',category:'petals',description:'A classic heart made from a small set of trigonometric harmonics.'},
 {id:'flower',label:'Five-petal flower',category:'petals',description:'Five rounded petals on a softly modulated circle.'},
 {id:'star',label:'Star',category:'geometry',description:'A five-point star with alternating inner and outer corners.'},
 {id:'circle',label:'Circle',category:'geometry',description:'The simplest orbit: a single circular path.'},
 {id:'triangle',label:'Triangle',category:'geometry',description:'An equilateral triangle. Increase the terms to sharpen its vertices.'},
 {id:'square',label:'Square',category:'geometry',description:'Four equal sides, four right-angle corners.'},
 {id:'hexagon',label:'Hexagon',category:'geometry',description:'A regular six-sided polygon.'},
 {id:'octagon',label:'Octagon',category:'geometry',description:'A regular eight-sided polygon.'},
 {id:'pentagram',label:'Pentagram',category:'geometry',description:'Five crossing diagonals traced as one continuous star polygon.'},
 {id:'rounded-square',label:'Rounded square',category:'geometry',description:'A smooth superellipse between a circle and a square.'},
 {id:'rose-5',label:'Five-petal rose',category:'petals',description:'A polar rose whose five loops pass through the center.'},
 {id:'rose-8',label:'Eight-petal rose',category:'petals',description:'Eight radial loops woven into a single rose curve.'},
 {id:'infinity',label:'Infinity',category:'waves',description:'A flowing figure-eight loop with a crossing at the center.'},
 {id:'lissajous-32',label:'Lissajous 3:2',category:'waves',description:'Horizontal and vertical oscillations meet in a 3:2 frequency ratio.'},
 {id:'lissajous-45',label:'Lissajous 4:5',category:'waves',description:'A woven lattice from two perpendicular oscillations.'},
 {id:'lissajous-57',label:'Lissajous 5:7',category:'waves',description:'A denser oscillating knot with five and seven cycles.'},
 {id:'spiral',label:'Spiral ribbon',category:'waves',description:'A three-turn spiral with a return edge, forming one closed ribbon.'},
 {id:'astroid',label:'Astroid',category:'spirographs',description:'A four-cusp curve with gently concave sides.'},
 {id:'deltoid',label:'Deltoid',category:'spirographs',description:'A rounded triangular curve with three cusps.'},
 {id:'cardioid',label:'Cardioid',category:'spirographs',description:'A rolling-circle curve with one inward cusp.'},
 {id:'epitrochoid',label:'Outer spirograph',category:'spirographs',description:'A point on a circle rolling around the outside of another circle.'},
 {id:'hypotrochoid',label:'Inner spirograph',category:'spirographs',description:'An intricate looping path from a circle rolling inside another circle.'},
 {id:'koch',label:'Koch snowflake',category:'fractals',description:'Three iterations of triangular detail along a closed snowflake.'}
];
function polygon(n,step=1,angle=-Math.PI/2){return Array.from({length:n},(_,i)=>({x:Math.cos(angle+2*Math.PI*i*step/n),y:Math.sin(angle+2*Math.PI*i*step/n)}));}
function koch(){let p=polygon(3);for(let level=0;level<3;level++){const out=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=(b.x-a.x)/3,dy=(b.y-a.y)/3,u={x:a.x+dx,y:a.y+dy};out.push(a,u,{x:u.x+dx/2+dy*Math.sqrt(3)/2,y:u.y-dx*Math.sqrt(3)/2+dy/2},{x:a.x+2*dx,y:a.y+2*dy});}p=out;}return p;}
function preset(name){
 if(name==='moore')return moore(3);if(name==='koch')return koch();
 const sides={triangle:3,square:4,hexagon:6,octagon:8,pentagram:5};if(sides[name])return polygon(sides[name],name==='pentagram'?2:1,name==='square'?-Math.PI/4:-Math.PI/2);
 if(name==='star')return Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,r=i%2?.42:1;return{x:r*Math.cos(a),y:r*Math.sin(a)};});
 if(name==='spiral'){const p=[];for(const side of [1,-1])for(let j=0;j<720;j++){const u=(side===1?j:719-j)/719,t=6*Math.PI*u,r=.14+.78*u+side*.035;p.push({x:r*Math.cos(t),y:r*Math.sin(t)});}return p;}
 return Array.from({length:1200},(_,i)=>{const t=2*Math.PI*i/1200;
  if(name==='heart')return{x:16*Math.sin(t)**3,y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))};
  if(name==='flower'){const r=.65+.3*Math.cos(5*t);return{x:r*Math.cos(t),y:r*Math.sin(t)};}
  if(name==='rounded-square'){const c=Math.cos(t),s=Math.sin(t);return{x:Math.sign(c)*Math.abs(c)**.5,y:Math.sign(s)*Math.abs(s)**.5};}
  if(name==='rose-5'||name==='rose-8'){const a=name==='rose-5'?t/2:t,k=name==='rose-5'?5:4,r=Math.cos(k*a);return{x:r*Math.cos(a),y:r*Math.sin(a)};}
  if(name==='infinity')return{x:Math.cos(t),y:.5*Math.sin(2*t)};
  if(name.startsWith('lissajous-')){const pair={'lissajous-32':[3,2],'lissajous-45':[4,5],'lissajous-57':[5,7]}[name];if(pair)return{x:Math.sin(pair[0]*t+(name==='lissajous-45'?Math.PI/4:Math.PI/2)),y:Math.sin(pair[1]*t)};}
  if(name==='astroid')return{x:Math.cos(t)**3,y:Math.sin(t)**3};
  if(name==='deltoid')return{x:2*Math.cos(t)+Math.cos(2*t),y:2*Math.sin(t)-Math.sin(2*t)};
  if(name==='cardioid')return{x:2*Math.cos(t)-Math.cos(2*t),y:2*Math.sin(t)-Math.sin(2*t)};
  if(name==='epitrochoid')return{x:4*Math.cos(t)-1.7*Math.cos(4*t),y:4*Math.sin(t)-1.7*Math.sin(4*t)};
  if(name==='hypotrochoid'){const a=t*3;return{x:2*Math.cos(a)+3.5*Math.cos(2*a/3),y:2*Math.sin(a)-3.5*Math.sin(2*a/3)};}
  return{x:Math.cos(t),y:Math.sin(t)};
 });
}
// Directed pixel-cell boundary edges: stitch closed outer and inner contours.
function contours(data,w,h,threshold=128,invert=false){const on=new Uint8Array(w*h);for(let i=0;i<on.length;i++){const a=data[i*4+3]/255,g=(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2])*a+255*(1-a);on[i]=invert?g>threshold:g<threshold;}
 const edges=new Map(),key=(x,y)=>y*(w+1)+x,add=(x,y,xx,yy)=>{const k=key(x,y);if(!edges.has(k))edges.set(k,[]);edges.get(k).push(key(xx,yy));};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(on[y*w+x]){if(y===0||!on[(y-1)*w+x])add(x,y,x+1,y);if(x===w-1||!on[y*w+x+1])add(x+1,y,x+1,y+1);if(y===h-1||!on[(y+1)*w+x])add(x+1,y+1,x,y+1);if(x===0||!on[y*w+x-1])add(x,y+1,x,y);}
 const out=[];while(edges.size){const start=edges.keys().next().value;let k=start,p=[],guard=0;do{p.push({x:k%(w+1),y:Math.floor(k/(w+1))});const next=edges.get(k);if(!next)break;const q=next.pop();if(!next.length)edges.delete(k);k=q;}while(k!==start&&guard++<w*h*8);if(k===start&&p.length>12)out.push(p);}
 return out.sort((a,b)=>b.length-a.length).slice(0,40);
}
const api={resample,normalize,fft,dft,select,at,error,rms,reconstruct,reconstruction,preset,presetCatalog,contours};if(typeof module!=='undefined')module.exports=api;else root.Fourier=api;
})(globalThis);
