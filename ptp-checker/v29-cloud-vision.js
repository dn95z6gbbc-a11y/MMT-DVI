(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const VIDEO_IDS={
    'Стрит тест.mp4':'vplvturpy67z22dg7om4'
  };
  const MAX_CONCURRENCY=2;
  const TARGET_FRAMES=Number(window.__VCHECK_VIDEO_TARGET_FRAMES__||24);
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
    note.innerHTML=`<b>Облачный визуальный анализ.</b><br>Видео не декодируется по кадрам в Safari. V-CHECK вырезает ${TARGET_FRAMES} стоп-кадров на сервере через FFmpeg и отправляет их Qwen.`;
    materialBox.insertAdjacentElement('afterend',note);
    return note;
  }

  function setNote(html){
    const note=ensureNote();
    if(note)note.innerHTML=html;
  }

  function compactGlobalEvidence(globalVision){
    const g=globalVision||{};
    return {
      standupEvidence:Array.isArray(g.standupEvidence)?g.standupEvidence.slice(0,3):[],
      respondentEvidence:Array.isArray(g.respondentEvidence)?g.respondentEvidence.slice(0,12):[],
      cutawayEvidence:Array.isArray(g.cutawayEvidence)?g.cutawayEvidence.slice(0,6):[],
      sequenceNotes:Array.isArray(g.sequenceNotes)?g.sequenceNotes.slice(0,6):[],
      uncertain:Array.isArray(g.uncertain)?g.uncertain.slice(0,6):[]
    };
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
              confirmedRespondentCount:Number.isInteger(vision.confirmedRespondentCount)?vision.confirmedRespondentCount:null,
              cutawaysConfirmed:vision.cutawaysConfirmed===true?true:null,
              shotVariety:vision.shotVariety||'unknown',
              visualAlternationConfirmed:vision.visualAlternationConfirmed===true?true:null,
              globalVisionAvailable:Boolean(vision.globalVision),
              globalVisionEvidence:compactGlobalEvidence(vision.globalVision),
              visualSource:'server_ffmpeg_qwen_frames_global_sequence'
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
    window.__VCHECK_VIDEO_FRAMES__=Array.from({length:TARGET_FRAMES},(_,index)=>({index,timeSeconds:null,cloud:true,server:true}));
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
      standupConfirmed:null,
      confirmedRespondentCount:null,
      cutawaysConfirmed:null,
      shotVariety:'unknown',
      visualAlternationConfirmed:null,
      globalVision:null
    };
    setNote(`<b>Облачный визуальный анализ пока недоступен.</b><br>${message} Проверка речи продолжит работать, а визуальные пункты должны остаться «не удалось определить».`);
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
    setNote(`<b>Облачный визуальный анализ.</b><br>Сервер готовит ${TARGET_FRAMES} равномерных стоп-кадров через FFmpeg… Safari сам видео по кадрам не декодирует.`);

    try{
      const extracted=await api({
        action:'extractVideoFrames',
        videoId,
        count:TARGET_FRAMES,
        includeBase64:true
      });
      if(myRun!==runId)return;

      const sourceFrames=Array.isArray(extracted.frames)?extracted.frames:[];
      if(!sourceFrames.length){
        throw new Error('Сервер не вернул стоп-кадры видео.');
      }

      const extractionFailures=sourceFrames.filter(frame=>frame?.error||!frame?.imageBase64).length;
      setNote(`<b>Облачный визуальный анализ.</b><br>FFmpeg подготовил ${sourceFrames.length-extractionFailures} из ${sourceFrames.length} кадров. Qwen начинает визуальный анализ…`);

      const results=new Array(sourceFrames.length);
      let next=0;
      let done=0;

      async function worker(){
        while(true){
          const position=next++;
          if(position>=sourceFrames.length)return;
          const frame=sourceFrames[position]||{};

          try{
            if(frame.error||!frame.imageBase64){
              throw new Error(frame.error||'FFmpeg не вернул изображение кадра');
            }

            const response=await api({
              action:'videoVision',
              imageBase64:frame.imageBase64,
              mimeType:frame.mimeType||'image/jpeg'
            });

            results[position]={
              index:Number.isFinite(Number(frame.index))?Number(frame.index):position,
              time:Number.isFinite(Number(frame.timeSeconds))?Number(frame.timeSeconds):null,
              analysis:response.analysis||null,
              model:response.model||null,
              imageBytes:response.imageBytes||frame.bytes||null
            };
          }catch(error){
            results[position]={
              index:Number.isFinite(Number(frame.index))?Number(frame.index):position,
              time:Number.isFinite(Number(frame.timeSeconds))?Number(frame.timeSeconds):null,
              error:error?.message||'Ошибка анализа кадра'
            };
          }finally{
            done++;
            if(myRun===runId){
              setNote(`<b>Облачный визуальный анализ.</b><br>Qwen обработал ${done} из ${sourceFrames.length} серверных стоп-кадров… Safari остаётся свободным.`);
            }
          }
        }
      }

      await Promise.all(
        Array.from(
          {length:Math.min(MAX_CONCURRENCY,sourceFrames.length)},
          ()=>worker()
        )
      );

      if(myRun!==runId)return;

      const good=results.filter(item=>item&&!item.error&&item.analysis);
      const failed=results.length-good.length;
      const standupFrames=good.filter(item=>strongStandup(item.analysis));

      let globalVision=null;
      let globalVisionError='';

      const globalFrames=sourceFrames
        .filter(frame=>!frame?.error&&frame?.imageBase64)
        .map((frame,index)=>({
          index:Number.isFinite(Number(frame?.index))?Number(frame.index):index,
          timeSeconds:Number.isFinite(Number(frame?.timeSeconds))?Number(frame.timeSeconds):null,
          imageBase64:frame.imageBase64,
          mimeType:frame.mimeType||'image/jpeg'
        }));

      if(globalFrames.length>=2){
        setNote(`<b>Облачный визуальный анализ.</b><br>Qwen обработал ${good.length} отдельных кадров. Теперь сопоставляет ${globalFrames.length} кадров между собой: людей, стендап, перебивки и визуальную последовательность…`);

        try{
          const globalResponse=await api({
            action:'videoGlobalVision',
            frames:globalFrames
          });
          globalVision=globalResponse?.analysis||null;
        }catch(error){
          globalVisionError=error?.message||'Не удалось выполнить общий анализ последовательности.';
          console.warn('V-CHECK global vision failed:',error);
        }
      }

      if(myRun!==runId)return;

      const globalStandup=globalVision?.standupConfirmed===true?true:null;
      const globalCount=Number(globalVision?.confirmedRespondentCount);
      const confirmedRespondentCount=Number.isInteger(globalCount)&&globalCount>=8?globalCount:null;
      const cutawaysConfirmed=globalVision?.cutawaysConfirmed===true?true:null;
      const visualAlternationConfirmed=globalVision?.visualAlternationConfirmed===true?true:null;

      const vision={
        checked:String(good.length),
        failed,
        selectedFrames:sourceFrames.length,
        sourceFrames:sourceFrames.length,
        selectedScreenshots:sourceFrames.length,
        sourceScreenshots:sourceFrames.length,
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
        standupConfirmed:globalStandup===true||standupFrames.length>0?true:null,
        confirmedRespondentCount,
        cutawaysConfirmed,
        shotVariety:globalVision?.shotVariety||'unknown',
        visualAlternationConfirmed,
        globalVision,
        globalVisionError:globalVisionError||null,
        frames:results
      };

      window.VCHECK_VIDEO_VISION=vision;

      window.__VCHECK_VIDEO_FRAMES__=sourceFrames.map((frame,index)=>({
        index:Number.isFinite(Number(frame?.index))?Number(frame.index):index,
        timeSeconds:Number.isFinite(Number(frame?.timeSeconds))?Number(frame.timeSeconds):null,
        cloud:true,
        server:true
      }));
      window.__VCHECK_VIDEO_FRAMES_STATE__={
        running:false,
        target:TARGET_FRAMES,
        done:sourceFrames.length,
        failed
      };

      const standupText=vision.standupConfirmed===true
        ?' · стендап подтверждён визуальным анализом'
        :' · стендап не подтверждён без достаточных признаков';
      const countText=vision.confirmedRespondentCount
        ?` · подтверждено респондентов: ${vision.confirmedRespondentCount}`
        :' · число уникальных респондентов не подтверждено';
      const cutawayText=vision.cutawaysConfirmed===true
        ?' · перебивки подтверждены'
        :' · перебивки не подтверждены';
      const globalText=globalVision
        ?' · общий анализ последовательности готов'
        :` · общий анализ последовательности не завершён${globalVisionError?`: ${globalVisionError}`:''}`;

      setNote(`<b>Облачный визуальный анализ готов.</b><br>Qwen обработал ${good.length} из ${sourceFrames.length} серверных стоп-кадров${failed?` · ошибок: ${failed}`:''}${globalText}${standupText}${countText}${cutawayText}.`);

    }catch(error){
      if(myRun!==runId)return;
      fallbackVision(error?.message||'Не удалось получить серверные стоп-кадры.');
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
