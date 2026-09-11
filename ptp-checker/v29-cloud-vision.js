(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const VIDEO_IDS={
    'Стрит тест.mp4':'vplvturpy67z22dg7om4'
  };
  let runId=0;

  function parseEnvelope(value){
    if(value&&typeof value.body==='string'){
      try{return JSON.parse(value.body)}catch(_){}
    }
    return value||{};
  }

  async function api(body){
    const response=await fetch(API_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body),
      cache:'no-store'
    });
    let raw={};
    try{raw=await response.json()}catch(_){throw new Error('Сервер вернул непонятный ответ.');}
    const data=parseEnvelope(raw);
    if(!response.ok||data?.ok===false){
      const error=new Error(data?.message||data?.error||`HTTP ${response.status}`);
      error.payload=data;
      throw error;
    }
    return data;
  }

  function ensureNote(){
    let note=document.getElementById('cloudVisionNote');
    if(note)return note;
    const materialBox=document.getElementById('materialBox');
    if(!materialBox)return null;
    note=document.createElement('div');
    note.id='cloudVisionNote';
    note.style.cssText='margin-top:14px;border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.45';
    note.innerHTML='<b>Облачный визуальный анализ.</b><br>Видео не декодируется по кадрам в Safari. V-CHECK берёт готовые стоп-кадры из Yandex Cloud Video и отправляет их Qwen на сервере.';
    materialBox.insertAdjacentElement('afterend',note);
    return note;
  }

  function setNote(html){
    const note=ensureNote();
    if(note)note.innerHTML=html;
  }

  function installAnalyzeMaterialBridge(){
    if(window.__VCHECK_V29_FETCH_BRIDGE__)return;
    window.__VCHECK_V29_FETCH_BRIDGE__=true;
    const nativeFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      try{
        const url=typeof input==='string'?input:String(input?.url||'');
        if(url===API_URL&&init?.body&&window.VCHECK_VIDEO_VISION){
          const body=JSON.parse(String(init.body));
          if(body?.action==='analyzeMaterial'){
            const vision=window.VCHECK_VIDEO_VISION||{};
            const enrich=observations=>({
              ...(observations||{}),
              expectedFrames:8,
              processedFrames:Number(vision.checked||0),
              failedFrames:Number(vision.failed||0),
              standupConfirmed:vision.standupConfirmed===true?true:null,
              visualSource:'yandex_cloud_video_screenshots'
            });
            body.mediaObservations=enrich(body.mediaObservations);
            body.videoObservations=enrich(body.videoObservations);
            init={...init,body:JSON.stringify(body)};
          }
        }
      }catch(_){}
      return nativeFetch(input,init);
    };
  }

  function fallbackVision(message){
    window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:8,done:8,failed:8};
    window.__VCHECK_VIDEO_FRAMES__=Array.from({length:8},(_,index)=>({index,timeSeconds:null}));
    window.VCHECK_VIDEO_VISION={
      checked:'0',failed:8,counts:{},person:0,lowerThird:0,subtitles:0,logo:0,locationText:0,frames:[],standupConfirmed:null
    };
    setNote(`<b>Облачный визуальный анализ пока недоступен.</b><br>${message} Проверка речи продолжит работать, а визуальные пункты должны остаться «не удалось определить».`);
  }

  async function prepareCloudVision(file){
    const myRun=++runId;
    const videoId=VIDEO_IDS[file?.name||''];
    if(!videoId){
      fallbackVision('Для этого файла ещё не создана запись Cloud Video.');
      return;
    }

    window.__VCHECK_VIDEO_FRAMES_STATE__={running:true,target:8,done:0,failed:0};
    window.__VCHECK_VIDEO_FRAMES__=[];
    window.VCHECK_VIDEO_VISION=null;
    setNote('<b>Облачный визуальный анализ.</b><br>Получаем готовые стоп-кадры из Yandex Cloud Video и анализируем их Qwen. Safari сам видео по кадрам не декодирует.');

    try{
      const data=await api({action:'videoCloudVision',videoId});
      if(myRun!==runId)return;
      const checked=Number(data.checked||0);
      const failed=Number(data.failed||0);
      window.VCHECK_VIDEO_VISION={
        ...data,
        checked:String(checked),
        failed,
        frames:Array.isArray(data.frames)?data.frames:[]
      };
      // Старый unified-report ждёт локальный массив кадров. Даём ему только
      // лёгкие метаданные-заглушки: никаких Blob и декодирования видео.
      window.__VCHECK_VIDEO_FRAMES__=Array.from({length:8},(_,index)=>({index,timeSeconds:null,cloud:true}));
      window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:8,done:8,failed};
      const standup=data.standupConfirmed===true?' · стендап визуально подтверждён':' · стендап не подтверждаем без сильных признаков';
      setNote(`<b>Облачный визуальный анализ готов.</b><br>Qwen обработал ${checked} из ${Number(data.selectedScreenshots||8)} выбранных стоп-кадров${failed?` · ошибок: ${failed}`:''}${standup}.`);
    }catch(error){
      if(myRun!==runId)return;
      fallbackVision(error?.message||'Не удалось получить облачные стоп-кадры.');
    }
  }

  function bind(){
    ensureNote();
    installAnalyzeMaterialBridge();
    if(document.documentElement.dataset.vcheckCloudVision29==='1')return;
    document.documentElement.dataset.vcheckCloudVision29='1';
    document.addEventListener('change',event=>{
      const input=event.target;
      if(input?.id!=='materialFile')return;
      const file=input.files?.[0];
      if(!file){
        ++runId;
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:8,done:0,failed:0};
        window.__VCHECK_VIDEO_FRAMES__=[];
        window.VCHECK_VIDEO_VISION=null;
        return;
      }
      const isVideo=String(file.type||'').startsWith('video/')||/\.(mp4|mov|m4v|webm)$/i.test(file.name||'');
      if(isVideo)prepareCloudVision(file);
    },true);

    const current=document.getElementById('materialFile')?.files?.[0];
    if(current)prepareCloudVision(current);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
