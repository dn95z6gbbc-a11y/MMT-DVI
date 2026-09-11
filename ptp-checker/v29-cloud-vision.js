(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const VIDEO_IDS={
    'Стрит тест.mp4':'vplvturpy67z22dg7om4'
  };
  const MAX_CONCURRENCY=2;
  const TARGET_FRAMES=8;
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
    note.innerHTML='<b>Облачный визуальный анализ.</b><br>Видео не декодируется по кадрам в Safari. V-CHECK получает готовые стоп-кадры из Yandex Cloud Video и отправляет их Qwen через сервер.';
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
              expectedFrames:TARGET_FRAMES,
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
    window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:TARGET_FRAMES,done:TARGET_FRAMES,failed:TARGET_FRAMES};
    window.__VCHECK_VIDEO_FRAMES__=Array.from({length:TARGET_FRAMES},(_,index)=>({index,timeSeconds:null,cloud:true}));
    window.VCHECK_VIDEO_VISION={
      checked:'0',
      failed:TARGET_FRAMES,
      counts:{},
      person:0,
      lowerThird:0,
      subtitles:0,
      logo:0,
      locationText:0,
      frames:[],
      standupConfirmed:null
    };
    setNote(`<b>Облачный визуальный анализ пока недоступен.</b><br>${message} Проверка речи продолжит работать, а визуальные пункты должны остаться «не удалось определить».`);
  }

  function evenIndexes(count,target=TARGET_FRAMES){
    if(!Number.isFinite(count)||count<=0)return [];
    if(count<=target)return Array.from({length:count},(_,index)=>index);
    const chosen=new Set();
    for(let i=0;i<target;i++){
      chosen.add(Math.round(i*(count-1)/(target-1)));
    }
    return [...chosen].sort((a,b)=>a-b);
  }

  function strongStandup(analysis){
    const a=analysis||{};
    return (
      a.frameType==='standup' &&
      a.personOnCamera===true &&
      a.personCentered===true &&
      a.lookingAtCamera==='yes' &&
      a.lowerThirdVisible===true &&
      a.lowerThirdLooksLikeFullName==='yes' &&
      a.journalistLikelySpeakingToCamera==='yes'
    );
  }

  async function prepareCloudVision(file){
    const myRun=++runId;
    const videoId=VIDEO_IDS[file?.name||''];

    if(!videoId){
      fallbackVision('Для этого файла ещё не создана запись Cloud Video.');
      return;
    }

    window.__VCHECK_VIDEO_FRAMES_STATE__={running:true,target:TARGET_FRAMES,done:0,failed:0};
    window.__VCHECK_VIDEO_FRAMES__=[];
    window.VCHECK_VIDEO_VISION=null;
    setNote('<b>Облачный визуальный анализ.</b><br>Получаем список стоп-кадров из Yandex Cloud Video… Safari сам видео по кадрам не декодирует.');

    try{
      const probe=await api({action:'videoProbe',videoId});
      if(myRun!==runId)return;

      const screenshots=Array.isArray(probe.screenshots)?probe.screenshots:[];
      const indices=evenIndexes(screenshots.length,TARGET_FRAMES);
      if(!indices.length){
        throw new Error('Cloud Video пока не вернул готовые стоп-кадры.');
      }

      setNote(`<b>Облачный визуальный анализ.</b><br>Cloud Video подготовил ${screenshots.length} кадров. Qwen анализирует ${indices.length} равномерно выбранных кадров…`);

      const results=new Array(indices.length);
      let next=0;
      let done=0;

      async function worker(){
        while(true){
          const position=next++;
          if(position>=indices.length)return;
          const screenshotIndex=indices[position];
          try{
            const response=await api({
              action:'videoVision',
              videoId,
              screenshotIndex
            });
            results[position]={
              index:screenshotIndex,
              time:null,
              analysis:response.analysis||null,
              model:response.model||null,
              imageBytes:response.imageBytes||null
            };
          }catch(error){
            results[position]={
              index:screenshotIndex,
              time:null,
              error:error?.message||'Ошибка анализа кадра'
            };
          }finally{
            done++;
            if(myRun===runId){
              setNote(`<b>Облачный визуальный анализ.</b><br>Qwen обработал ${done} из ${indices.length} выбранных кадров… Safari остаётся свободным.`);
            }
          }
        }
      }

      await Promise.all(
        Array.from(
          {length:Math.min(MAX_CONCURRENCY,indices.length)},
          ()=>worker()
        )
      );

      if(myRun!==runId)return;

      const good=results.filter(item=>item&&!item.error&&item.analysis);
      const failed=results.length-good.length;
      const standupFrames=good.filter(item=>strongStandup(item.analysis));

      const vision={
        checked:String(good.length),
        failed,
        selectedScreenshots:indices.length,
        sourceScreenshots:screenshots.length,
        counts:{
          standup:good.filter(item=>item.analysis?.frameType==='standup').length,
          interview:good.filter(item=>item.analysis?.frameType==='interview').length,
          broll:good.filter(item=>item.analysis?.frameType==='broll').length,
          graphic:good.filter(item=>item.analysis?.frameType==='graphic').length
        },
        person:good.filter(item=>item.analysis?.personOnCamera===true).length,
        lowerThird:good.filter(item=>item.analysis?.lowerThirdVisible===true).length,
        subtitles:good.filter(item=>item.analysis?.subtitlesVisible===true||item.analysis?.otherTextVisible===true).length,
        logo:good.filter(item=>item.analysis?.logoVisible===true).length,
        locationText:good.filter(item=>item.analysis?.locationTextVisible===true).length,
        standupConfirmed:standupFrames.length>0?true:null,
        frames:results
      };

      window.VCHECK_VIDEO_VISION=vision;

      // Старый unified-report ждёт массив из минимум шести кадров. Передаём
      // только лёгкие метаданные-заглушки — без Blob и декодирования MP4.
      window.__VCHECK_VIDEO_FRAMES__=Array.from(
        {length:TARGET_FRAMES},
        (_,index)=>({index,timeSeconds:null,cloud:true})
      );
      window.__VCHECK_VIDEO_FRAMES_STATE__={
        running:false,
        target:TARGET_FRAMES,
        done:TARGET_FRAMES,
        failed
      };

      const standupText=vision.standupConfirmed===true
        ?' · найден сильный визуальный признак стендапа'
        :' · стендап не подтверждаем без сильных признаков';

      setNote(`<b>Облачный визуальный анализ готов.</b><br>Qwen обработал ${good.length} из ${indices.length} выбранных стоп-кадров${failed?` · ошибок: ${failed}`:''}${standupText}.`);

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
        window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:TARGET_FRAMES,done:0,failed:0};
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

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bind,{once:true});
  }else{
    bind();
  }
})();
