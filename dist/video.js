(function(root){
'use strict';
const formats=[
 {mime:'video/mp4;codecs=avc1.424028',ext:'mp4',label:'MP4 / H.264'},
 {mime:'video/mp4',ext:'mp4',label:'MP4'},
 {mime:'video/webm;codecs=vp9',ext:'webm',label:'WebM / VP9'},
 {mime:'video/webm;codecs=vp8',ext:'webm',label:'WebM / VP8'},
 {mime:'video/webm',ext:'webm',label:'WebM'}
];
function available(Recorder=root.MediaRecorder){return Recorder&&typeof Recorder.isTypeSupported==='function'?formats.filter(f=>Recorder.isTypeSupported(f.mime)):[];}
function dimensions(layout,quality){const width=quality==='hd'?1080:720;return layout==='story'?{width,height:width*16/9}:layout==='square'?{width,height:width}:{width:width*16/9,height:width};}
function progress(elapsed,duration){return Math.min(1,Math.max(0,elapsed/Math.max(1,duration-1000)));}
// Record one complete path, holding the completed drawing during the final second.
function record({canvas,draw,duration=15,format,onProgress=()=>{},signal,Recorder=root.MediaRecorder,raf=root.requestAnimationFrame.bind(root),caf=root.cancelAnimationFrame.bind(root),now=()=>performance.now(),doc=root.document}){
 return new Promise((resolve,reject)=>{
  let stream,recorder,id=0,timer,finished=false,stopping=false,reason=null,start,chunks=[],lastDraw=-Infinity;
  function cleanup(){caf(id);clearTimeout(timer);signal?.removeEventListener('abort',abort);doc?.removeEventListener('visibilitychange',visibility);stream?.getTracks().forEach(t=>t.stop());}
  function finish(error){if(finished)return;finished=true;cleanup();if(error)return reject(error);const mime=recorder.mimeType||format.mime;const blob=new Blob(chunks,{type:mime});if(!blob.size)return reject(Error('The browser produced an empty video. Try another format or quality.'));resolve({blob,ext:mime.includes('mp4')?'mp4':'webm',mime});}
  function stop(error){if(finished)return;if(stopping){reason=error||reason;return;}stopping=true;reason=error||null;caf(id);clearTimeout(timer);if(recorder&&recorder.state!=='inactive'){try{recorder.stop();timer=setTimeout(()=>finish(reason||Error('Video finalization timed out. Please try again.')),15000);}catch(e){finish(reason||e);}}else finish(reason);}
  function abort(){stop(Error('Export cancelled.'));}
  function visibility(){if(doc.hidden)stop(Error('Export cancelled because the page was hidden. Keep this tab visible while recording.'));}
  function tick(){if(finished||stopping||recorder.state!=='recording')return;try{const elapsed=now()-start;if(elapsed-lastDraw>=1000/30||elapsed>=duration*1000){lastDraw=elapsed;draw(progress(elapsed,duration*1000));onProgress(Math.min(1,elapsed/(duration*1000)));}if(elapsed>=duration*1000){stop();return;}id=raf(tick);}catch(e){stop(e);}}
  try{
   if(signal?.aborted)throw Error('Export cancelled.');if(doc?.hidden)throw Error('Keep this tab visible while recording.');
   draw(0);stream=canvas.captureStream(30);recorder=new Recorder(stream,{mimeType:format.mime,videoBitsPerSecond:canvas.width*canvas.height>1e6?8000000:4500000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=e=>stop(e.error||Error('Video encoding failed. Try another format or quality.'));
   recorder.onstop=()=>finish(reason);signal?.addEventListener('abort',abort,{once:true});doc?.addEventListener('visibilitychange',visibility);
   recorder.start(250);start=now();timer=setTimeout(()=>stop(Error('Export timed out. Try 720p quality or fewer terms.')),duration*1000+30000);id=raf(tick);
  }catch(e){finish(e);}
 });
}
const api={available,dimensions,progress,record};if(typeof module!=='undefined')module.exports=api;else root.OrbitVideo=api;
})(globalThis);
