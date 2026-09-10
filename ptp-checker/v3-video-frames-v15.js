const VCHECK_VIDEO_FRAME_COUNT=12;
const VCHECK_VIDEO_FRAME_WIDTH=640;
const VCHECK_VIDEO_FRAME_QUALITY=0.64;

(function(){
  const frame=document.getElementById('app');
  if(!frame)return;

  let previewUrls=[];
  let runId=0;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

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

  const waitEvent=(target,name,timeout=6000)=>new Promise((resolve,reject)=>{
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
    timer=setTimeout(()=>{cleanup();reject(new Error(`Таймаут ${name}`));},timeout);
  });

  const waitVisible=()=>new Promise(resolve=>{
    if(document.visibilityState!=='hidden')return resolve();
    const onChange=()=>{
      if(document.visibilityState!=='hidden'){
        document.removeEventListener('visibilitychange',onChange);
        resolve();
      }
    };
    document.addEventListener('visibilitychange',onChange);
  });

  const waitVideoPaint=(video,timeout=1800)=>new Promise(resolve=>{
    let settled=false;
    const done=()=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve();
    };
    const timer=setTimeout(done,timeout);
    if(typeof video.requestVideoFrameCallback==='function'){
      try{video.requestVideoFrameCallback(done);return;}catch(_){ }
    }
    setTimeout(done,120);
  });

  async function seekTo(video,target){
    const duration=Number(video.duration)||0;
    const offsets=[0,-1.5,1.5,-3];
    let lastError=null;
    for(const offset of offsets){
      const safe=Math.min(Math.max((Number(target)||0)+offset,0.2),Math.max(0.2,duration-1.5));
      try{
        await waitVisible();
        if(Math.abs(video.currentTime-safe)>=0.04){
          const ready=waitEvent(video,'seeked',5000);
          video.currentTime=safe;
          await ready;
        }
        if(video.readyState<2)await waitEvent(video,'loadeddata',4000);
        await waitVideoPaint(video,1500);
        return safe;
      }catch(error){
        lastError=error;
      }
    }
    throw lastError||new Error('Не удалось перейти к нужному моменту видео.');
  }

  const canvasBlob=canvas=>new Promise((resolve,reject)=>{
    let settled=false;
    const timer=setTimeout(()=>{
      if(settled)return;
      settled=true;
      reject(new Error('Стоп-кадр создаётся слишком долго.'));
    },4000);
    try{
      canvas.toBlob(blob=>{
        if(settled)return;
        settled=true;
        clearTimeout(timer);
        blob?resolve(blob):reject(new Error('Не удалось создать стоп-кадр.'));
      },'image/jpeg',VCHECK_VIDEO_FRAME_QUALITY);
    }catch(error){
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      reject(error);
    }
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
      #vcheckVideoFrames .vf-failed{display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:11px;text-align:center;padding:8px}
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
    box.innerHTML='<h4>Кадры для визуальной проверки</h4><p class="vf-note">V-CHECK сам выберет стоп-кадры по всей длине ролика. Пока это диагностический предпросмотр.</p><div class="vf-status"></div><div class="vf-grid"></div>';
    materialBox.insertAdjacentElement('afterend',box);
    return box;
  }

  async function makeVideo(d,sourceUrl){
    const video=d.createElement('video');
    video.preload='auto';
    video.muted=true;
    video.playsInline=true;
    video.style.position='fixed';
    video.style.left='-99999px';
    video.style.width='2px';
    video.style.height='2px';
    d.body.appendChild(video);
    video.src=sourceUrl;
    video.load();
    if(video.readyState<1)await waitEvent(video,'loadedmetadata',10000);
    if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error('Не удалось определить длительность видео.');
    if(!video.videoWidth||!video.videoHeight){
      if(video.readyState<2)await waitEvent(video,'loadeddata',6000);
    }
    return video;
  }

  async function buildFrames(file,d){
    const myRun=++runId;
    revokePreviewUrls();
    window.__VCHECK_VIDEO_FRAMES__=[];
    window.__VCHECK_VIDEO_FRAMES_STATE__={running:true,target:VCHECK_VIDEO_FRAME_COUNT,done:0,failed:0};

    const box=ensureBox(d);
    if(!box)return;
    const status=box.querySelector('.vf-status');
    const grid=box.querySelector('.vf-grid');
    box.style.display='block';
    grid.innerHTML='';
    status.className='vf-status';
    status.textContent='Читаем видео и выбираем кадры…';

    const sourceUrl=URL.createObjectURL(file);
    let video=null;

    try{
      video=await makeVideo(d,sourceUrl);
      const duration=video.duration;
      const width=Math.min(VCHECK_VIDEO_FRAME_WIDTH,video.videoWidth||VCHECK_VIDEO_FRAME_WIDTH);
      const height=Math.max(1,Math.round(width*(video.videoHeight||360)/(video.videoWidth||640)));
      const canvas=d.createElement('canvas');
      canvas.width=width;
      canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)throw new Error('Браузер не смог подготовить анализ кадров.');

      const start=0.03;
      const end=0.94;
      const times=Array.from({length:VCHECK_VIDEO_FRAME_COUNT},(_,i)=>duration*(start+(end-start)*(i/(VCHECK_VIDEO_FRAME_COUNT-1))));
      const frames=[];
      let failed=0;

      for(let i=0;i<times.length;i++){
        if(myRun!==runId)return;
        await waitVisible();

        // Safari иногда начинает зависать после большого числа seek подряд.
        // В середине обработки пересоздаём декодер и продолжаем с того же Blob URL.
        if(i===6){
          try{video.remove();}catch(_){ }
          video=null;
          await sleep(80);
          video=await makeVideo(d,sourceUrl);
        }

        status.textContent=`Выбираем кадры: ${i+1} из ${times.length}…`;
        try{
          const actualTime=await seekTo(video,times[i]);
          ctx.drawImage(video,0,0,width,height);
          const blob=await canvasBlob(canvas);
          const url=URL.createObjectURL(blob);
          previewUrls.push(url);
          const item=d.createElement('div');
          item.className='vf-item';
          item.innerHTML=`<img alt="Кадр ${i+1}"><span class="vf-time">${formatTime(actualTime)}</span>`;
          item.querySelector('img').src=url;
          grid.appendChild(item);
          frames.push({index:i,timeSeconds:actualTime,blob,mimeType:'image/jpeg',width,height,size:blob.size});
          window.__VCHECK_VIDEO_FRAMES__=frames.slice();
        }catch(error){
          failed++;
          const item=d.createElement('div');
          item.className='vf-item vf-failed';
          item.innerHTML=`<span>Кадр ${i+1}<br>пропущен</span><span class="vf-time">${formatTime(times[i])}</span>`;
          grid.appendChild(item);
        }

        window.__VCHECK_VIDEO_FRAMES_STATE__={running:true,target:VCHECK_VIDEO_FRAME_COUNT,done:i+1,failed};
      }

      if(myRun!==runId)return;
      const avg=frames.length?Math.round(frames.reduce((sum,x)=>sum+x.size,0)/frames.length/1024):0;
      window.__VCHECK_VIDEO_FRAMES__=frames.slice();
      window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:VCHECK_VIDEO_FRAME_COUNT,done:VCHECK_VIDEO_FRAME_COUNT,failed};

      if(frames.length>=8){
        status.textContent=`Готово: ${frames.length} кадров${failed?` · пропущено: ${failed}`:''} · видео ${formatTime(duration)}${avg?` · средний кадр ≈ ${avg} КБ`:''}.`;
      }else{
        status.className='vf-status vf-error';
        status.textContent=`Удалось получить только ${frames.length} кадров. Попробуйте выбрать видео ещё раз.`;
      }
    }catch(error){
      if(myRun!==runId)return;
      window.__VCHECK_VIDEO_FRAMES__=[];
      window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:VCHECK_VIDEO_FRAME_COUNT,done:0,failed:VCHECK_VIDEO_FRAME_COUNT};
      grid.innerHTML='';
      status.className='vf-status vf-error';
      status.textContent=error?.message||'Не удалось получить стоп-кадры из этого видео.';
    }finally{
      try{video?.remove();}catch(_){ }
      try{URL.revokeObjectURL(sourceUrl);}catch(_){ }
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
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:VCHECK_VIDEO_FRAME_COUNT,done:0,failed:0};
        if(box)box.style.display='none';
        return;
      }
      const isVideo=String(file.type||'').startsWith('video/')||/\.(mp4|webm|mov|m4v)$/i.test(file.name||'');
      if(!isVideo){
        ++runId;
        revokePreviewUrls();
        window.__VCHECK_VIDEO_FRAMES__=[];
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:VCHECK_VIDEO_FRAME_COUNT,done:0,failed:0};
        if(box)box.style.display='none';
        return;
      }
      buildFrames(file,d);
    },true);
  }

  if(frame.contentDocument?.readyState==='complete')onLoad();
  frame.addEventListener('load',onLoad);
})();
