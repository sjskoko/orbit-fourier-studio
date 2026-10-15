(function(){
'use strict';
const $=id=>document.getElementById(id),S=window.OrbitStudio,V=window.OrbitVideo;
let choices=[],state,controller,resultURL,resultFile,busy=false,resume;
function clearResult(){if(resultURL)URL.revokeObjectURL(resultURL);resultURL=null;resultFile=null;$('videoPlayback').pause();$('videoPlayback').removeAttribute('src');$('videoPlayback').load();$('videoResult').hidden=true;}
function hint(){const f=choices[+$('videoFormat').value];$('videoHint').textContent=f?.ext==='mp4'?'MP4 is supported here. Keep this page visible while recording. The video has no audio.':'This browser offers WebM. Instagram may require an MP4 conversion. Try Safari or a browser with MP4 recording support. Keep this page visible while recording.';}
function preview(){if(!state||busy)return;const d=V.dimensions($('videoLayout').value,'fast'),c=$('videoPreview');c.width=d.width/2;c.height=d.height/2;OrbitRender.draw(c.getContext('2d'),c.width,c.height,state,.72,$('videoLayout').value,$('videoBrand').checked);hint();}
function setBusy(value){busy=value;$('openVideo').disabled=value;$('videoConfig').inert=value;for(const e of $('videoConfig').querySelectorAll('input,select'))e.disabled=value;$('startVideo').disabled=value||!choices.length;$('cancelVideo').hidden=!value;$('videoProgress').hidden=!value;$('closeVideo').setAttribute('aria-label',value?'Cancel and close video export':'Close video export');}
$('openVideo').onclick=()=>{clearResult();state=S.snapshot();choices=V.available();$('videoFormat').replaceChildren();for(let i=0;i<choices.length;i++){const o=document.createElement('option');o.value=i;o.textContent=choices[i].label;$('videoFormat').append(o);}const supported=choices.length&&typeof HTMLCanvasElement.prototype.captureStream==='function';$('videoStatus').textContent=supported?'Ready. Export takes approximately the selected duration.':'Video recording is unavailable in this browser. Try a current Chrome, Edge or Safari browser.';setBusy(false);$('startVideo').disabled=!supported;preview();$('videoDialog').showModal();};
for(const id of ['videoLayout','videoQuality','videoDuration','videoFormat','videoBrand'])$(id).addEventListener('change',preview);
$('startVideo').onclick=async()=>{
 clearResult();controller=new AbortController();resume=S.pauseForExport();setBusy(true);$('videoProgress').value=0;$('videoStatus').textContent='Preparing video…';
 const layout=$('videoLayout').value,d=V.dimensions(layout,$('videoQuality').value),canvas=document.createElement('canvas');canvas.width=d.width;canvas.height=d.height;const c=canvas.getContext('2d'),duration=+$('videoDuration').value,brand=$('videoBrand').checked;
 try{const result=await V.record({canvas,draw:t=>OrbitRender.draw(c,d.width,d.height,state,t,layout,brand),duration,format:choices[+$('videoFormat').value],signal:controller.signal,onProgress:p=>{$('videoProgress').value=p;$('videoStatus').textContent='Recording '+Math.round(p*100)+'% · keep this page visible';const preview=$('videoPreview'),pc=preview.getContext('2d');pc.drawImage(canvas,0,0,preview.width,preview.height);}});
  resultFile=new File([result.blob],'orbit-'+layout+'.'+result.ext,{type:result.mime.split(';')[0]});resultURL=URL.createObjectURL(result.blob);$('videoPlayback').src=resultURL;$('downloadVideo').href=resultURL;$('downloadVideo').download=resultFile.name;$('videoResult').hidden=false;$('videoStatus').textContent='Ready · '+d.width+' × '+d.height+' · '+duration+' s · '+(result.blob.size/1048576).toFixed(1)+' MB';$('shareVideo').hidden=!(navigator.canShare&&navigator.canShare({files:[resultFile]}));
 }catch(e){$('videoStatus').textContent=e.message||'Export failed. Try 720p or another format.';}
 finally{controller=null;resume?.();resume=null;setBusy(false);}
};
$('cancelVideo').onclick=()=>controller?.abort();
function close(){controller?.abort();$('videoDialog').close();clearResult();}
$('closeVideo').onclick=close;$('videoDialog').addEventListener('cancel',e=>{e.preventDefault();close();});
$('shareVideo').onclick=async()=>{if(!resultFile)return;try{await navigator.share({files:[resultFile],title:'Orbit — Fourier Pattern Studio'});}catch(e){if(e.name!=='AbortError')S.toast('Use Download video to save this file.');}};
window.addEventListener('pagehide',()=>{controller?.abort();clearResult();});
})();
