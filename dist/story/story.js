'use strict';
const video=document.getElementById('storyVideo'),status=document.getElementById('status'),url=document.getElementById('storyURL').value;
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)video.play().catch(()=>{});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
document.getElementById('copyLink').onclick=async()=>{try{await navigator.clipboard.writeText(url);status.textContent='Link copied. Paste it into an Instagram Story Link sticker.';}catch{document.getElementById('storyURL').select();status.textContent='Select and copy the URL below.';}};
document.getElementById('shareLink').onclick=async()=>{if(navigator.share){try{await navigator.share({title:'Orbit — Make your own motion',text:'Draw a path. Watch the circles find it.',url});}catch(e){if(e.name!=='AbortError')status.textContent='Use Copy story link to share this page.';}}else document.getElementById('copyLink').click();};
const button=document.getElementById('shareFile');let shareFile;
// Prepare the small public demo file so the share sheet opens within the user's tap.
if(navigator.canShare&&navigator.share){fetch('orbit-story.mp4').then(r=>{if(!r.ok)throw Error();return r.blob();}).then(blob=>{shareFile=new File([blob],'orbit-instagram-story.mp4',{type:'video/mp4'});button.hidden=!navigator.canShare({files:[shareFile]});}).catch(()=>{});}
button.onclick=async()=>{if(!shareFile)return;try{await navigator.share({files:[shareFile],title:'Orbit'});}catch(e){if(e.name!=='AbortError')status.textContent='Use Download MP4, then choose the video in Instagram.';}};
