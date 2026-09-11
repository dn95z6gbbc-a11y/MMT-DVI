(function(){
  const FRAME_COUNT=8;
  const FRAME_WIDTH=480;
  const FRAME_QUALITY=0.50;
  const frame=document.getElementById('app');
  if(!frame)return;

  let previewUrls=[];
  let runId=0;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function revokePreviewUrls(){
    for(const url of previewUrls){try{URL.revokeObjectURL(url);}catch(_){}}
    previewUrls=[];
  }

  function formatTime(seconds){
    const total=Math.max(0,Math.round(Number(seconds)||0));
    return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
  }

  function waitEvent(target,name,timeout=8000){
    return new Promise((resolve,reject)=>{
      let timer;
      const cleanup=()=>{
        target.removeEventListener(name,onOk);
        target.removeEventListener('error',onError);
        clearTimeout(timer);
      };
      const onOk=()=>{cleanup();resolve();};
      const onError=()=>{cleanup();reject(new Error('Safari не смог прочитать видео.'));};
      target.addEventListener(name,onOk,{once:true});
      target.addEventListener('error',onError,{once:true});
      timer=setTimeout(()=>{cleanup();reject(new Error(`Таймаут ${name}`));},timeout);
    });
  }

  function canvasBlob(canvas){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Стоп-кадр создаётся слишком долго.')),5000);
      try{
        canvas.toBlob(blob=>{
          clearTimeout(timer);
          blob?resolve(blob):reject(new Error('Не удалось создать стоп-кадр.'));
        },'image/jpeg',FRAME_QUALITY);
      }catch(error){clearTimeout(timer);reject(error);}
    });
  }

  async function waitForRenderedFrame(video){
    if(typeof video.requestVideoFrameCallback==='function'){
      await new Promise(resolve=>{
        let done=false;
        const timer=setTimeout(()=>{if(done)return;done=true;resolve();},700);
        try{
          video.requestVideoFrameCallback(()=>{
            if(done)return;
            done=true;
            clearTimeout(timer);
            resolve();
          });
        }catch(_){
          clearTimeout(timer);
          resolve();
        }
      });
    }else{
      await sleep(120);
    }
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
    box.innerHTML='<h4>Кадры для визуальной проверки</h4><p class="vf-note">V-CHECK выбирает 8 стоп-кадров по всей длине ролика. В Safari используется облегчённый режим: один видеодекодер на весь файл.</p><div class="vf-status"></div><div class="vf-grid"></div>';
    materialBox.insertAdjacentElement('afterend',box);
    return box;
  }

  async function seekVideo(video,time){
    const duration=Number(video.duration)||0;
    const safe=Math.min(Math.max(time,0.25),Math.max(0.25,duration-1.25));
    if(Math.abs((Number(video.currentTime)||0)-safe)<0.06){
      await waitForRenderedFrame(video);
      return safe;
    }
    const wait=waitEvent(video,'seeked',9000);
    video.currentTime=safe;
    await wait;
    if(video.readyState<2){
      try{await waitEvent(video,'loadeddata',3000);}catch(_){ }
    }
    await waitForRenderedFrame(video);
    return safe;
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
    status.textContent='Открываем видео один раз и готовим 8 кадров…';

    const sourceUrl=URL.createObjectURL(file);
    const video=d.createElement('video');
    video.preload='auto';
    video.muted=true;
    video.playsInline=true;
    video.style.position='fixed';
    video.style.left='-99999px';
    video.style.top='0';
    video.style.width='2px';
    video.style.height='2px';
    d.body.appendChild(video);

    try{
      video.src=sourceUrl;
      video.load();
      if(video.readyState<1)await waitEvent(video,'loadedmetadata',10000);
      const duration=Number(video.duration)||0;
      if(!duration)throw new Error('Не удалось определить длительность видео.');

      const sourceWidth=video.videoWidth||1280;
      const sourceHeight=video.videoHeight||720;
      const width=Math.min(FRAME_WIDTH,sourceWidth);
      const height=Math.max(1,Math.round(width*sourceHeight/sourceWidth));
      const canvas=d.createElement('canvas');
      canvas.width=width;
      canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)throw new Error('Safari не смог подготовить холст для кадров.');

      const fractions=[0.04,0.17,0.30,0.43,0.56,0.69,0.82,0.95];
      const frames=[];
      let failed=0;

      for(let i=0;i<fractions.length;i++){
        if(myRun!==runId)return;
        status.textContent=`Выбираем кадры: ${i+1} из ${FRAME_COUNT}…`;
        const target=duration*fractions[i];
        try{
          const actual=await seekVideo(video,target);
          ctx.drawImage(video,0,0,width,height);
          const blob=await canvasBlob(canvas);
          const url=URL.createObjectURL(blob);
          previewUrls.push(url);

          const item=d.createElement('div');
          item.className='vf-item';
          item.innerHTML=`<img alt="Кадр ${i+1}"><span class="vf-time">${formatTime(actual)}</span>`;
          item.querySelector('img').src=url;
          grid.appendChild(item);

          frames.push({index:i,timeSeconds:actual,blob,mimeType:'image/jpeg',width,height,size:blob.size});
          window.__VCHECK_VIDEO_FRAMES__=frames.slice();
        }catch(error){
          failed++;
          const item=d.createElement('div');
          item.className='vf-item vf-failed';
          item.innerHTML=`<span>Кадр ${i+1}<br>пропущен</span><span class="vf-time">${formatTime(target)}</span>`;
          grid.appendChild(item);
        }

        window.__VCHECK_VIDEO_FRAMES_STATE__={running:true,target:FRAME_COUNT,done:i+1,failed};

        // Ключевая защита для Safari: отдаём управление браузеру между seek.
        await sleep(320);
      }

      if(myRun!==runId)return;
      window.__VCHECK_VIDEO_FRAMES__=frames.slice();
      window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:FRAME_COUNT,done:FRAME_COUNT,failed};

      if(frames.length===FRAME_COUNT){
        status.textContent=`Готово: все ${FRAME_COUNT} кадров выбраны · видео ${formatTime(duration)}.`;
      }else{
        status.className='vf-status vf-error';
        status.textContent=`Получено ${frames.length} из ${FRAME_COUNT} кадров. Пропущено: ${failed}.`;
      }
    }catch(error){
      if(myRun!==runId)return;
      window.__VCHECK_VIDEO_FRAMES__=[];
      window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:FRAME_COUNT,done:0,failed:FRAME_COUNT};
      grid.innerHTML='';
      status.className='vf-status vf-error';
      status.textContent=error?.message||'Не удалось получить стоп-кадры из этого видео.';
    }finally{
      try{video.pause();}catch(_){}
      try{video.removeAttribute('src');video.load();}catch(_){}
      try{video.remove();}catch(_){}
      try{URL.revokeObjectURL(sourceUrl);}catch(_){}
    }
  }

  function onLoad(){
    const d=frame.contentDocument;
    if(!d)return;
    ensureStyles(d);
    ensureBox(d);
    if(d.documentElement.dataset.vcheckFrames18==='1')return;
    d.documentElement.dataset.vcheckFrames18='1';

    d.addEventListener('change',event=>{
      const input=event.target;
      if(input?.id!=='materialFile')return;
      const file=input.files?.[0];
      const box=ensureBox(d);

      if(!file){
        ++runId;
        revokePreviewUrls();
        window.__VCHECK_VIDEO_FRAMES__=[];
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:FRAME_COUNT,done:0,failed:0};
        if(box)box.style.display='none';
        return;
      }

      const isVideo=String(file.type||'').startsWith('video/')||/\.(mp4|webm|mov|m4v)$/i.test(file.name||'');
      if(!isVideo){
        ++runId;
        revokePreviewUrls();
        window.__VCHECK_VIDEO_FRAMES__=[];
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:FRAME_COUNT,done:0,failed:0};
        if(box)box.style.display='none';
        return;
      }

      // Даем Safari закончить собственную обработку file input, затем стартуем.
      setTimeout(()=>buildFrames(file,d),500);
    },true);
  }

  frame.addEventListener('load',onLoad);
})();
