(function(){
  const FRAME_COUNT=8;
  const FRAME_WIDTH=640;
  const FRAME_QUALITY=0.62;
  const frame=document.getElementById('app');
  if(!frame)return;

  let previewUrls=[];
  let runId=0;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function revokePreviewUrls(){
    for(const url of previewUrls){try{URL.revokeObjectURL(url);}catch(_){}}
    previewUrls=[];
  }

  function formatTime(seconds){
    const total=Math.max(0,Math.round(Number(seconds)||0));
    return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
  }

  function waitEvent(target,name,timeout=6000){
    return new Promise((resolve,reject)=>{
      let timer;
      const cleanup=()=>{
        target.removeEventListener(name,onOk);
        target.removeEventListener('error',onError);
        clearTimeout(timer);
      };
      const onOk=()=>{cleanup();resolve();};
      const onError=()=>{cleanup();reject(new Error('Браузер не смог прочитать видео.'));};
      target.addEventListener(name,onOk,{once:true});
      target.addEventListener('error',onError,{once:true});
      timer=setTimeout(()=>{cleanup();reject(new Error(`Таймаут ${name}`));},timeout);
    });
  }

  async function waitVisible(){
    if(document.visibilityState!=='hidden')return;
    await new Promise(resolve=>{
      const onChange=()=>{
        if(document.visibilityState!=='hidden'){
          document.removeEventListener('visibilitychange',onChange);
          resolve();
        }
      };
      document.addEventListener('visibilitychange',onChange);
    });
  }

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
      @media(max-width:680px){#vcheckVideoFrames .vf-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
    box.innerHTML='<h4>Кадры для визуальной проверки</h4><p class="vf-note">V-CHECK выбирает несколько стоп-кадров по всей длине ролика. Это диагностический предпросмотр.</p><div class="vf-status"></div><div class="vf-grid"></div>';
    materialBox.insertAdjacentElement('afterend',box);
    return box;
  }

  async function readMeta(d,sourceUrl){
    const video=d.createElement('video');
    video.preload='metadata';
    video.muted=true;
    video.playsInline=true;
    video.style.position='fixed';
    video.style.left='-99999px';
    d.body.appendChild(video);
    try{
      video.src=sourceUrl;
      video.load();
      if(video.readyState<1)await waitEvent(video,'loadedmetadata',10000);
      const duration=Number(video.duration)||0;
      if(!duration)throw new Error('Не удалось определить длительность видео.');
      return {duration,width:video.videoWidth||1280,height:video.videoHeight||720};
    }finally{
      try{video.remove();}catch(_){}
    }
  }

  function canvasBlob(canvas){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Стоп-кадр создаётся слишком долго.')),4000);
      try{
        canvas.toBlob(blob=>{
          clearTimeout(timer);
          blob?resolve(blob):reject(new Error('Не удалось создать стоп-кадр.'));
        },'image/jpeg',FRAME_QUALITY);
      }catch(error){clearTimeout(timer);reject(error);}
    });
  }

  async function captureOne(d,sourceUrl,target,width,height){
    const video=d.createElement('video');
    video.preload='auto';
    video.muted=true;
    video.playsInline=true;
    video.style.position='fixed';
    video.style.left='-99999px';
    video.style.width='2px';
    video.style.height='2px';
    d.body.appendChild(video);
    try{
      video.src=sourceUrl;
      video.load();
      if(video.readyState<1)await waitEvent(video,'loadedmetadata',8000);
      const duration=Number(video.duration)||0;
      const safe=Math.min(Math.max(target,0.25),Math.max(0.25,duration-1.5));
      const ready=waitEvent(video,'seeked',5500);
      video.currentTime=safe;
      await ready;
      if(video.readyState<2)await waitEvent(video,'loadeddata',3500);
      await sleep(120);
      const canvas=d.createElement('canvas');
      canvas.width=width;
      canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)throw new Error('Браузер не смог подготовить стоп-кадр.');
      ctx.drawImage(video,0,0,width,height);
      const blob=await canvasBlob(canvas);
      return {timeSeconds:safe,blob};
    }finally{
      try{video.pause();}catch(_){}
      try{video.removeAttribute('src');video.load();}catch(_){}
      try{video.remove();}catch(_){}
    }
  }

  async function buildFrames(file,d){
    const myRun=++runId;
    revokePreviewUrls();
    window.__VCHECK_VIDEO_FRAMES__=[];
    window.__VCHECK_VIDEO_FRAMES_STATE__={running:true,target:FRAME_COUNT,done:0,failed:0};

    const box=ensureBox(d);
    if(!box)return;
    const status=box.querySelector('.vf-status');
    const grid=box.querySelector('.vf-grid');
    box.style.display='block';
    grid.innerHTML='';
    status.className='vf-status';
    status.textContent='Читаем видео и выбираем кадры…';

    const sourceUrl=URL.createObjectURL(file);
    try{
      const meta=await readMeta(d,sourceUrl);
      const width=Math.min(FRAME_WIDTH,meta.width||FRAME_WIDTH);
      const height=Math.max(1,Math.round(width*(meta.height||360)/(meta.width||640)));
      const fractions=[0.04,0.17,0.30,0.43,0.56,0.69,0.82,0.95];
      const frames=[];
      let failed=0;

      for(let i=0;i<fractions.length;i++){
        if(myRun!==runId)return;
        await waitVisible();
        status.textContent=`Выбираем кадры: ${i+1} из ${FRAME_COUNT}…`;
        try{
          const target=meta.duration*fractions[i];
          const shot=await captureOne(d,sourceUrl,target,width,height);
          const url=URL.createObjectURL(shot.blob);
          previewUrls.push(url);
          const item=d.createElement('div');
          item.className='vf-item';
          item.innerHTML=`<img alt="Кадр ${i+1}"><span class="vf-time">${formatTime(shot.timeSeconds)}</span>`;
          item.querySelector('img').src=url;
          grid.appendChild(item);
          frames.push({index:i,timeSeconds:shot.timeSeconds,blob:shot.blob,mimeType:'image/jpeg',width,height,size:shot.blob.size});
          window.__VCHECK_VIDEO_FRAMES__=frames.slice();
        }catch(error){
          failed++;
          const item=d.createElement('div');
          item.className='vf-item vf-failed';
          item.innerHTML=`<span>Кадр ${i+1}<br>пропущен</span><span class="vf-time">${formatTime(meta.duration*fractions[i])}</span>`;
          grid.appendChild(item);
        }
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:true,target:FRAME_COUNT,done:i+1,failed};
        await sleep(80);
      }

      if(myRun!==runId)return;
      const avg=frames.length?Math.round(frames.reduce((sum,x)=>sum+x.size,0)/frames.length/1024):0;
      window.__VCHECK_VIDEO_FRAMES__=frames.slice();
      window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:FRAME_COUNT,done:FRAME_COUNT,failed};
      if(frames.length>=6){
        status.textContent=`Готово: ${frames.length} кадров${failed?` · пропущено: ${failed}`:''} · видео ${formatTime(meta.duration)}${avg?` · средний кадр ≈ ${avg} КБ`:''}.`;
      }else{
        status.className='vf-status vf-error';
        status.textContent=`Удалось получить только ${frames.length} кадров. Попробуйте выбрать видео ещё раз.`;
      }
    }catch(error){
      if(myRun!==runId)return;
      window.__VCHECK_VIDEO_FRAMES__=[];
      window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:FRAME_COUNT,done:0,failed:FRAME_COUNT};
      grid.innerHTML='';
      status.className='vf-status vf-error';
      status.textContent=error?.message||'Не удалось получить стоп-кадры из этого видео.';
    }finally{
      try{URL.revokeObjectURL(sourceUrl);}catch(_){}
    }
  }

  function onLoad(){
    const d=frame.contentDocument;
    if(!d)return;
    ensureStyles(d);
    ensureBox(d);
    if(d.documentElement.dataset.vcheckFrames17==='1')return;
    d.documentElement.dataset.vcheckFrames17='1';
    d.addEventListener('change',event=>{
      const input=event.target;
      if(input?.id!=='materialFile')return;
      const file=input.files?.[0];
      const box=ensureBox(d);
      if(!file){
        ++runId;revokePreviewUrls();window.__VCHECK_VIDEO_FRAMES__=[];
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:FRAME_COUNT,done:0,failed:0};
        if(box)box.style.display='none';
        return;
      }
      const isVideo=String(file.type||'').startsWith('video/')||/\.(mp4|webm|mov|m4v)$/i.test(file.name||'');
      if(!isVideo){
        ++runId;revokePreviewUrls();window.__VCHECK_VIDEO_FRAMES__=[];
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:FRAME_COUNT,done:0,failed:0};
        if(box)box.style.display='none';
        return;
      }
      buildFrames(file,d);
    },true);
  }

  frame.addEventListener('load',onLoad);
})();
