const VCHECK_VIDEO_FRAME_COUNT=12;
const VCHECK_VIDEO_FRAME_WIDTH=720;
const VCHECK_VIDEO_FRAME_QUALITY=0.72;

(function(){
  const frame=document.getElementById('app');
  if(!frame)return;

  let previewUrls=[];
  let runId=0;

  const revokePreviewUrls=()=>{
    for(const url of previewUrls){
      try{URL.revokeObjectURL(url);}catch(_){ }
    }
    previewUrls=[];
  };

  const formatTime=seconds=>{
    const total=Math.max(0,Math.round(Number(seconds)||0));
    const m=Math.floor(total/60);
    const s=String(total%60).padStart(2,'0');
    return `${m}:${s}`;
  };

  const waitEvent=(target,name,timeout=15000)=>new Promise((resolve,reject)=>{
    let timer=null;
    const cleanup=()=>{
      target.removeEventListener(name,onOk);
      target.removeEventListener('error',onError);
      if(timer)clearTimeout(timer);
    };
    const onOk=()=>{cleanup();resolve();};
    const onError=()=>{cleanup();reject(new Error('Браузер не смог прочитать видео.'));};
    target.addEventListener(name,onOk,{once:true});
    target.addEventListener('error',onError,{once:true});
    timer=setTimeout(()=>{cleanup();reject(new Error('Видео читается слишком долго.'));},timeout);
  });

  const seekTo=async(video,time)=>{
    const duration=Number(video.duration)||0;
    const safe=Math.min(Math.max(Number(time)||0,0.05),Math.max(0.05,duration-0.05));
    if(Math.abs(video.currentTime-safe)<0.03&&video.readyState>=2)return;
    const ready=waitEvent(video,'seeked',12000);
    video.currentTime=safe;
    await ready;
    if(video.readyState<2)await waitEvent(video,'loadeddata',12000);
  };

  const canvasBlob=canvas=>new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Не удалось создать стоп-кадр.')),'image/jpeg',VCHECK_VIDEO_FRAME_QUALITY);
  });

  function ensureStyles(d){
    if(d.getElementById('vcheck-video-frame-style'))return;
    const style=d.createElement('style');
    style.id='vcheck-video-frame-style';
    style.textContent=`
      #vcheckVideoFrames{margin-top:14px;border:1px solid #dbe3ee;background:#f8fafc;border-radius:16px;padding:14px}
      #vcheckVideoFrames h4{margin:0 0 4px;font-size:14px}
      #vcheckVideoFrames .vf-note{margin:0;color:#64748b;font-size:12px}
      #vcheckVideoFrames .vf-status{margin-top:10px;font-size:13px;font-weight:750;color:#334155}
      #vcheckVideoFrames .vf-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}
      #vcheckVideoFrames .vf-item{position:relative;overflow:hidden;border-radius:10px;background:#0f172a;aspect-ratio:16/9}
      #vcheckVideoFrames .vf-item img{display:block;width:100%;height:100%;object-fit:cover}
      #vcheckVideoFrames .vf-time{position:absolute;left:6px;bottom:6px;background:rgba(15,23,42,.82);color:#fff;border-radius:999px;padding:3px 6px;font-size:10px;font-weight:800}
      #vcheckVideoFrames .vf-error{color:#9f1239}
      @media(max-width:680px){#vcheckVideoFrames .vf-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    `;
    d.head.appendChild(style);
  }

  function ensureBox(d){
    let box=d.getElementById('vcheckVideoFrames');
    if(box)return box;
    const materialBox=d.getElementById('materialBox');
    if(!materialBox)return null;
    box=d.createElement('div');
    box.id='vcheckVideoFrames';
    box.style.display='none';
    box.innerHTML='<h4>Кадры для визуальной проверки</h4><p class="vf-note">V-CHECK сам выберет стоп-кадры по всей длине ролика. Пока это диагностический предпросмотр — кадры никуда не отправляются.</p><div class="vf-status"></div><div class="vf-grid"></div>';
    materialBox.insertAdjacentElement('afterend',box);
    return box;
  }

  async function buildFrames(file,d){
    const myRun=++runId;
    revokePreviewUrls();
    window.__VCHECK_VIDEO_FRAMES__=[];

    const box=ensureBox(d);
    if(!box)return;
    const status=box.querySelector('.vf-status');
    const grid=box.querySelector('.vf-grid');
    box.style.display='block';
    grid.innerHTML='';
    status.className='vf-status';
    status.textContent='Читаем видео и выбираем 12 кадров…';

    const sourceUrl=URL.createObjectURL(file);
    const video=d.createElement('video');
    video.preload='auto';
    video.muted=true;
    video.playsInline=true;
    video.style.position='fixed';
    video.style.left='-99999px';
    video.style.width='1px';
    video.style.height='1px';
    d.body.appendChild(video);

    try{
      video.src=sourceUrl;
      video.load();
      if(video.readyState<1)await waitEvent(video,'loadedmetadata',20000);
      if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error('Не удалось определить длительность видео.');
      if(!video.videoWidth||!video.videoHeight){
        if(video.readyState<2)await waitEvent(video,'loadeddata',12000);
      }
      const width=Math.min(VCHECK_VIDEO_FRAME_WIDTH,video.videoWidth||VCHECK_VIDEO_FRAME_WIDTH);
      const height=Math.max(1,Math.round(width*(video.videoHeight||405)/(video.videoWidth||720)));
      const canvas=d.createElement('canvas');
      canvas.width=width;
      canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)throw new Error('Браузер не смог подготовить анализ кадров.');

      const duration=video.duration;
      const times=Array.from({length:VCHECK_VIDEO_FRAME_COUNT},(_,i)=>{
        const fraction=(i+0.5)/VCHECK_VIDEO_FRAME_COUNT;
        return Math.min(Math.max(duration*fraction,0.05),Math.max(0.05,duration-0.05));
      });

      const frames=[];
      for(let i=0;i<times.length;i++){
        if(myRun!==runId)return;
        status.textContent=`Выбираем кадры: ${i+1} из ${times.length}…`;
        await seekTo(video,times[i]);
        ctx.drawImage(video,0,0,width,height);
        const blob=await canvasBlob(canvas);
        const url=URL.createObjectURL(blob);
        previewUrls.push(url);
        const item=d.createElement('div');
        item.className='vf-item';
        item.innerHTML=`<img alt="Кадр ${i+1}"><span class="vf-time">${formatTime(times[i])}</span>`;
        item.querySelector('img').src=url;
        grid.appendChild(item);
        frames.push({index:i,timeSeconds:times[i],blob,mimeType:'image/jpeg',width,height,size:blob.size});
      }

      if(myRun!==runId)return;
      window.__VCHECK_VIDEO_FRAMES__=frames;
      const avg=Math.round(frames.reduce((sum,x)=>sum+x.size,0)/Math.max(1,frames.length)/1024);
      status.textContent=`Готово: ${frames.length} кадров · видео ${formatTime(duration)} · средний кадр ≈ ${avg} КБ.`;
    }catch(error){
      if(myRun!==runId)return;
      window.__VCHECK_VIDEO_FRAMES__=[];
      grid.innerHTML='';
      status.className='vf-status vf-error';
      status.textContent=error?.message||'Не удалось получить стоп-кадры из этого видео.';
    }finally{
      try{URL.revokeObjectURL(sourceUrl);}catch(_){ }
      try{video.remove();}catch(_){ }
    }
  }

  function onLoad(){
    const d=frame.contentDocument;
    if(!d)return;
    ensureStyles(d);
    ensureBox(d);

    d.addEventListener('change',event=>{
      const input=event.target;
      if(!(input instanceof frame.contentWindow.HTMLInputElement))return;
      if(input.id!=='materialFile')return;
      const file=input.files?.[0];
      const box=ensureBox(d);
      if(!file){
        ++runId;
        revokePreviewUrls();
        window.__VCHECK_VIDEO_FRAMES__=[];
        if(box)box.style.display='none';
        return;
      }
      const isVideo=String(file.type||'').startsWith('video/')||/\.(mp4|webm|mov|m4v)$/i.test(file.name||'');
      if(!isVideo){
        ++runId;
        revokePreviewUrls();
        window.__VCHECK_VIDEO_FRAMES__=[];
        if(box)box.style.display='none';
        return;
      }
      buildFrames(file,d);
    },true);
  }

  frame.addEventListener('load',onLoad);
})();
