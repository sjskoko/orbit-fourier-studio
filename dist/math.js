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
function preset(name){if(name==='moore')return moore(3);return Array.from({length:600},(_,i)=>{const t=2*Math.PI*i/600;if(name==='heart')return{x:16*Math.sin(t)**3,y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))};if(name==='flower'){const r=.65+.3*Math.cos(5*t);return{x:r*Math.cos(t),y:r*Math.sin(t)};}if(name==='star'){const a=Math.floor(i/60),f=i/60-a,r=a%2?.42:1,r2=a%2?1:.42;return{x:r*Math.cos(a*Math.PI/5-Math.PI/2)*(1-f)+r2*Math.cos((a+1)*Math.PI/5-Math.PI/2)*f,y:r*Math.sin(a*Math.PI/5-Math.PI/2)*(1-f)+r2*Math.sin((a+1)*Math.PI/5-Math.PI/2)*f};}return{x:Math.cos(t),y:Math.sin(t)};});}
// Directed pixel-cell boundary edges: stitch closed outer and inner contours.
function contours(data,w,h,threshold=128,invert=false){const on=new Uint8Array(w*h);for(let i=0;i<on.length;i++){const a=data[i*4+3]/255,g=(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2])*a+255*(1-a);on[i]=invert?g>threshold:g<threshold;}
 const edges=new Map(),key=(x,y)=>y*(w+1)+x,add=(x,y,xx,yy)=>{const k=key(x,y);if(!edges.has(k))edges.set(k,[]);edges.get(k).push(key(xx,yy));};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(on[y*w+x]){if(y===0||!on[(y-1)*w+x])add(x,y,x+1,y);if(x===w-1||!on[y*w+x+1])add(x+1,y,x+1,y+1);if(y===h-1||!on[(y+1)*w+x])add(x+1,y+1,x,y+1);if(x===0||!on[y*w+x-1])add(x,y+1,x,y);}
 const out=[];while(edges.size){const start=edges.keys().next().value;let k=start,p=[],guard=0;do{p.push({x:k%(w+1),y:Math.floor(k/(w+1))});const next=edges.get(k);if(!next)break;const q=next.pop();if(!next.length)edges.delete(k);k=q;}while(k!==start&&guard++<w*h*8);if(k===start&&p.length>12)out.push(p);}
 return out.sort((a,b)=>b.length-a.length).slice(0,40);
}
const api={resample,normalize,fft,dft,select,at,error,rms,reconstruct,reconstruction,preset,contours};if(typeof module!=='undefined')module.exports=api;else root.Fourier=api;
})(globalThis);
