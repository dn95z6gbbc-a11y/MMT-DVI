// V-CHECK video engine v5: any uploaded MP4 + server FFmpeg + SpeechKit + Qwen + YandexGPT.
(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const CONTROL_VIDEO_IDS={'Стрит тест.mp4':'vplvturpy67z22dg7om4'};
  const VIDEO_FORMATS=new Set(['story_event','story_theme','street','hot','live']);
  const TARGET_FRAMES=Number(window.__VCHECK_VIDEO_TARGET_FRAMES__||24);
  const MAX_CONCURRENCY=2;
  const TIMELINE_WINDOW_SECONDS=5;
  let running=false;
  let uploadCache=null;

  if(window.__VCHECK_VIDEO_ENGINE_V5__)return;
  window.__VCHECK_VIDEO_ENGINE_V5__='5.0';

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatKey=()=>String(document.getElementById('format')?.value||'');
  const isVideoFormat=()=>VIDEO_FORMATS.has(formatKey());
  const currentFile=()=>document.getElementById('materialFile')?.files?.[0]||null;
  const durationSeconds=()=>{try{return typeof material!=='undefined'&&Number.isFinite(material.duration)?Number(material.duration):null}catch(_){return null}};

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

  function progress(text,tone='normal'){
    const report=document.getElementById('report');
    const pdf=document.getElementById('pdfArea');
    if(!report)return;
    report.style.display='block';
    let box=document.getElementById('vcheckUnifiedVideoProgress');
    if(!box){
      box=document.createElement('div');
      box.id='vcheckUnifiedVideoProgress';
      box.style.cssText='margin:12px 0;padding:13px 15px;border:1px solid #dbe3ee;border-radius:14px;font-size:13px';
      (pdf||report).appendChild(box);
    }
    const palette={normal:['#f8fafc','#dbe3ee','#334155'],ok:['#f0fdf4','#bbf7d0','#166534'],bad:['#fff1f2','#fecdd3','#9f1239']}[tone]||['#f8fafc','#dbe3ee','#334155'];
    box.style.background=palette[0];
    box.style.borderColor=palette[1];
    box.style.color=palette[2];
    box.innerHTML=`<b>Видео: содержательная ИИ-проверка</b><br>${esc(text)}`;
  }

  function ensureVisionNote(){
    let note=document.getElementById('cloudVisionNote');
    if(note)return note;
    const materialBox=document.getElementById('materialBox');
    if(!materialBox)return null;
    note=document.createElement('div');
    note.id='cloudVisionNote';
    note.style.cssText='margin-top:14px;border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.45';
    materialBox.insertAdjacentElement('afterend',note);
    return note;
  }

  function setVisionNote(html){
    const note=ensureVisionNote();
    if(note)note.innerHTML=html;
  }

  function resetVideoState(){
    uploadCache=null;
    window.__VCHECK_VIDEO_SOURCE__=null;
    window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:TARGET_FRAMES,done:0,failed:0};
    window.__VCHECK_VIDEO_FRAMES__=[];
    window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__=[];
    window.__VCHECK_VIDEO_TIMELINE__=[];
    window.__VCHECK_ANSWER_DURATION__=null;
    window.VCHECK_VIDEO_VISION=null;
  }

  function fileSignature(file){
    if(!file)return '';
    return `${file.name}|${file.size}|${file.lastModified||0}`;
  }

  async function ensureUploadedSource(file){
    const controlVideoId=CONTROL_VIDEO_IDS[file?.name||''];
    if(controlVideoId){
      const source={
        kind:'cloudVideo',
        videoId:controlVideoId,
        fileName:file.name,
        contentType:file.type||'video/mp4',
        durationSeconds:durationSeconds()
      };
      window.__VCHECK_VIDEO_SOURCE__=source;
      return source;
    }

    const signature=fileSignature(file);
    if(uploadCache?.signature===signature&&uploadCache?.objectKey){
      window.__VCHECK_VIDEO_SOURCE__=uploadCache;
      return uploadCache;
    }

    const fullName=String(document.getElementById('name')?.value||'').trim();
    const group=String(document.getElementById('group')?.value||'').trim();
    if(fullName.length<4||!group){
      throw new Error('Сначала заполните имя, фамилию и группу — они нужны для загрузки видео на проверку.');
    }

    const contentType=file.type||'video/mp4';
    const reservation=await api({
      action:'createUpload',
      fullName,
      group,
      fileName:file.name,
      fileSize:file.size,
      contentType
    });

    try{
      const uploadResponse=await fetch(reservation.uploadUrl,{
        method:'PUT',
        headers:reservation.uploadHeaders||{'Content-Type':contentType},
        body:file
      });
      if(!uploadResponse.ok){
        throw new Error(`Не удалось загрузить видео во временное хранилище: HTTP ${uploadResponse.status}.`);
      }
    }catch(error){
      try{
        await api({
          action:'cancelUpload',
          fullName,
          group,
          reservationId:reservation.reservationId,
          quotaDate:reservation.quotaDate
        });
      }catch(_){}
      throw error;
    }

    uploadCache={
      signature,
      kind:'objectStorage',
      objectKey:reservation.objectKey,
      reservationId:reservation.reservationId,
      quotaDate:reservation.quotaDate,
      fileName:file.name,
      contentType,
      durationSeconds:durationSeconds()
    };
    window.__VCHECK_VIDEO_SOURCE__=uploadCache;
    return uploadCache;
  }

  function strongStandup(analysis){
    const a=analysis||{};
    return a.frameType==='standup'&&a.personOnCamera===true&&a.personCentered===true&&a.lookingAtCamera==='yes'&&a.lowerThirdVisible===true&&a.lowerThirdLooksLikeFullName==='yes'&&a.journalistLikelySpeakingToCamera==='yes';
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

  async function analyzeVision(source){
    window.__VCHECK_VIDEO_FRAMES_STATE__={running:true,target:TARGET_FRAMES,done:0,failed:0};
    window.__VCHECK_VIDEO_FRAMES__=[];
    window.VCHECK_VIDEO_VISION=null;
    setVisionNote(`<b>Серверный визуальный анализ.</b><br>FFmpeg готовит ${TARGET_FRAMES} стоп-кадров по всей длине видео…`);

    const request={
      action:'extractVideoFrames',
      count:TARGET_FRAMES,
      includeBase64:true
    };
    if(source.kind==='cloudVideo'){
      request.videoId=source.videoId;
    }else{
      request.objectKey=source.objectKey;
      if(Number.isFinite(Number(source.durationSeconds)))request.durationSeconds=Number(source.durationSeconds);
    }

    const extracted=await api(request);
    const sourceFrames=Array.isArray(extracted.frames)?extracted.frames:[];
    if(!sourceFrames.length)throw new Error('Сервер не вернул стоп-кадры видео.');

    const results=new Array(sourceFrames.length);
    let next=0;
    let done=0;

    setVisionNote(`<b>Серверный визуальный анализ.</b><br>FFmpeg подготовил ${sourceFrames.length} кадров. Qwen анализирует изображение…`);

    async function worker(){
      while(true){
        const position=next++;
        if(position>=sourceFrames.length)return;
        const frame=sourceFrames[position]||{};
        try{
          if(frame.error||!frame.imageBase64)throw new Error(frame.error||'FFmpeg не вернул изображение кадра');
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
          setVisionNote(`<b>Серверный визуальный анализ.</b><br>Qwen обработал ${done} из ${sourceFrames.length} стоп-кадров…`);
        }
      }
    }

    await Promise.all(Array.from({length:Math.min(MAX_CONCURRENCY,sourceFrames.length)},()=>worker()));

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
      setVisionNote(`<b>Серверный визуальный анализ.</b><br>Qwen сопоставляет ${globalFrames.length} кадров между собой: стендапы, синхроны, перебивки и последовательность…`);
      try{
        const globalResponse=await api({action:'videoGlobalVision',frames:globalFrames});
        globalVision=globalResponse?.analysis||null;
      }catch(error){
        globalVisionError=error?.message||'Не удалось выполнить общий анализ последовательности.';
        console.warn('V-CHECK global vision failed:',error);
      }
    }

    const globalCount=Number(globalVision?.confirmedRespondentCount);
    const vision={
      checked:String(good.length),
      failed,
      selectedFrames:sourceFrames.length,
      sourceFrames:sourceFrames.length,
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
      standupConfirmed:globalVision?.standupConfirmed===true||standupFrames.length>0?true:null,
      confirmedRespondentCount:Number.isInteger(globalCount)&&globalCount>=8?globalCount:null,
      cutawaysConfirmed:globalVision?.cutawaysConfirmed===true?true:null,
      shotVariety:globalVision?.shotVariety||'unknown',
      visualAlternationConfirmed:globalVision?.visualAlternationConfirmed===true?true:null,
      globalVision,
      globalVisionError:globalVisionError||null,
      frames:results
    };

    window.VCHECK_VIDEO_VISION=vision;
    window.__VCHECK_VIDEO_FRAMES__=sourceFrames.map((frame,index)=>({
      index:Number.isFinite(Number(frame?.index))?Number(frame.index):index,
      timeSeconds:Number.isFinite(Number(frame?.timeSeconds))?Number(frame.timeSeconds):null,
      server:true
    }));
    window.__VCHECK_VIDEO_FRAMES_STATE__={running:false,target:TARGET_FRAMES,done:sourceFrames.length,failed};

    const standupText=vision.standupConfirmed===true?' · стендап подтверждён':' · стендап не подтверждён без достаточных признаков';
    const cutawayText=vision.cutawaysConfirmed===true?' · перебивки подтверждены':' · перебивки не подтверждены';
    setVisionNote(`<b>Серверный визуальный анализ готов.</b><br>Qwen обработал ${good.length} из ${sourceFrames.length} стоп-кадров${failed?` · ошибок: ${failed}`:''}${standupText}${cutawayText}.`);
    return vision;
  }

  function normalizeSegments(value){
    if(!Array.isArray(value))return [];
    return value.map((item,index)=>{
      const startSeconds=Number(item?.startSeconds);
      const endSeconds=Number(item?.endSeconds);
      const text=String(item?.text||'').trim();
      if(!Number.isFinite(startSeconds)||!Number.isFinite(endSeconds)||endSeconds<startSeconds||!text)return null;
      return {index,startSeconds,endSeconds,text};
    }).filter(Boolean).sort((a,b)=>a.startSeconds-b.startSeconds);
  }

  async function transcriptFromCloudVideo(source){
    const started=Date.now();
    let attempt=0;
    while(Date.now()-started<180000){
      attempt++;
      const data=await api({action:'videoSubtitles',videoId:source.videoId});
      const transcript=String(data?.transcript||'').trim();
      if(transcript){
        return {
          transcript,
          segments:normalizeSegments(data?.segments),
          audioObservations:data?.audioObservations||null
        };
      }
      const elapsed=Math.round((Date.now()-started)/1000);
      progress(`Ждём готовую расшифровку речи… ${elapsed} сек. Не закрывайте вкладку.`);
      await sleep(attempt<3?2500:5000);
    }
    throw new Error('Не удалось получить расшифровку речи за 3 минуты.');
  }

  async function transcriptFromUploadedVideo(source){
    const prepared=await api({
      action:'prepareUploadedVideoAudio',
      objectKey:source.objectKey,
      fileName:source.fileName,
      contentType:source.contentType
    });

    const start=await api({
      action:'startTranscription',
      objectKey:prepared.audioObjectKey,
      fileName:prepared.audioFileName||'vcheck-audio.wav',
      contentType:prepared.audioContentType||'audio/wav'
    });

    const operationId=String(start?.operationId||'').trim();
    if(!operationId)throw new Error('SpeechKit не вернул идентификатор расшифровки.');

    const started=Date.now();
    while(Date.now()-started<240000){
      const data=await api({action:'getTranscription',operationId});
      if(data?.transcriptionReady===true&&String(data?.transcript||'').trim()){
        return {
          transcript:String(data.transcript).trim(),
          segments:normalizeSegments(data?.segments),
          audioObservations:data?.audioObservations||null
        };
      }
      const elapsed=Math.round((Date.now()-started)/1000);
      progress(`SpeechKit расшифровывает речь… ${elapsed} сек. Не закрывайте вкладку.`);
      await sleep(3500);
    }
    throw new Error('SpeechKit не успел завершить расшифровку за 4 минуты.');
  }

  async function getTranscript(source){
    return source.kind==='cloudVideo'
      ? transcriptFromCloudVideo(source)
      : transcriptFromUploadedVideo(source);
  }

  function speechAround(segments,timeSeconds){
    const time=Number(timeSeconds);
    if(!Number.isFinite(time))return [];
    const from=time-TIMELINE_WINDOW_SECONDS;
    const to=time+TIMELINE_WINDOW_SECONDS;
    return segments
      .filter(segment=>segment.endSeconds>=from&&segment.startSeconds<=to)
      .sort((a,b)=>{
        const da=a.startSeconds<=time&&a.endSeconds>=time?0:Math.min(Math.abs(a.startSeconds-time),Math.abs(a.endSeconds-time));
        const db=b.startSeconds<=time&&b.endSeconds>=time?0:Math.min(Math.abs(b.startSeconds-time),Math.abs(b.endSeconds-time));
        return da-db;
      })
      .slice(0,3)
      .map(segment=>({
        startSeconds:segment.startSeconds,
        endSeconds:segment.endSeconds,
        text:segment.text.slice(0,220),
        activeAtFrame:segment.startSeconds<=time&&segment.endSeconds>=time
      }));
  }

  function compactFrame(item){
    const a=item?.analysis||{};
    return {
      time:item?.time??null,
      frameType:a.frameType||'unknown',
      personOnCamera:a.personOnCamera===true,
      nameLowerThirdVisible:a.lowerThirdVisible===true,
      subtitlesVisible:a.subtitlesVisible===true,
      logoVisible:a.logoVisible===true,
      locationTextVisible:a.locationTextVisible===true,
      shotType:a.shotType||'unknown',
      journalistLikelySpeakingToCamera:a.journalistLikelySpeakingToCamera||'unknown',
      visualDescription:String(a.visualDescription||'').trim().slice(0,260),
      evidence:Array.isArray(a.evidence)?a.evidence.slice(0,2).map(value=>String(value||'').slice(0,180)):[]
    };
  }

  function buildObservations(vision,segments){
    const frames=(Array.isArray(vision?.frames)?vision.frames:[])
      .filter(item=>item?.analysis)
      .map(compactFrame);
    const timeline=frames
      .filter(frame=>Number.isFinite(Number(frame.time)))
      .map((frame,index)=>({
        index,
        timeSeconds:Number(frame.time),
        frameType:frame.frameType,
        shotType:frame.shotType,
        personOnCamera:frame.personOnCamera,
        nameLowerThirdVisible:frame.nameLowerThirdVisible,
        journalistLikelySpeakingToCamera:frame.journalistLikelySpeakingToCamera,
        visualDescription:frame.visualDescription,
        nearbySpeech:speechAround(segments,frame.time)
      }));

    window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__=segments;
    window.__VCHECK_VIDEO_TIMELINE__=timeline;

    return {
      sampling:`Выборка из ${TARGET_FRAMES} стоп-кадров по всей длине ролика. Отсутствие признака в выборке НЕ доказывает его отсутствие во всём видео.`,
      expectedFrames:TARGET_FRAMES,
      checkedFrames:Number(vision?.checked||0),
      processedFrames:Number(vision?.checked||0),
      failedFrames:Number(vision?.failed||0),
      counts:vision?.counts||{},
      peopleFrames:Number(vision?.person||0),
      nameLowerThirdFrames:Number(vision?.lowerThird||0),
      subtitleOrTextFrames:Number(vision?.subtitles||0),
      logoFrames:Number(vision?.logo||0),
      locationTextFrames:Number(vision?.locationText||0),
      standupConfirmed:vision?.standupConfirmed===true?true:null,
      confirmedRespondentCount:Number.isInteger(vision?.confirmedRespondentCount)?vision.confirmedRespondentCount:null,
      cutawaysConfirmed:vision?.cutawaysConfirmed===true?true:null,
      shotVariety:vision?.shotVariety||'unknown',
      visualAlternationConfirmed:vision?.visualAlternationConfirmed===true?true:null,
      globalVisionAvailable:Boolean(vision?.globalVision),
      globalVisionEvidence:compactGlobalEvidence(vision?.globalVision),
      transcriptSegmentsCount:segments.length,
      timelineWindowSeconds:TIMELINE_WINDOW_SECONDS,
      timelineAvailable:timeline.length>0,
      timeline,
      frames,
      visualSource:'uploaded_video_server_ffmpeg_qwen_sequence'
    };
  }

  function looksLikeQuestion(text){
    const source=String(text||'').trim().toLowerCase();
    if(!source)return false;
    if(/[?？]/.test(source))return true;
    return /^(как|что|кто|кого|где|куда|откуда|когда|почему|зачем|какой|какая|какие|какое|насколько|сколько|чем|считаете ли|думаете ли|нравится ли|ваш|ваша|ваше|ваши)\b/i.test(source);
  }

  function looksLikeTransition(text){
    const source=String(text||'').trim().toLowerCase().replace(/[.!?,:;]+$/g,'');
    return /^(спасибо|большое спасибо|понятно|ясно|хорошо|отлично, спасибо|идем дальше|идём дальше|поехали дальше)$/.test(source);
  }

  function buildAnswerEpisodes(segments){
    const episodes=[];
    for(let i=0;i<segments.length;i++){
      const question=segments[i];
      if(!looksLikeQuestion(question.text))continue;
      let first=null,last=null,firstIndex=-1;
      for(let j=i+1;j<Math.min(segments.length,i+7);j++){
        const part=segments[j];
        if(part.startSeconds-question.endSeconds>14)break;
        if(looksLikeQuestion(part.text))break;
        if(looksLikeTransition(part.text)&&!first)continue;
        if(!first){
          if(part.endSeconds-part.startSeconds<0.35&&part.text.length<7)continue;
          first=part;last=part;firstIndex=j;continue;
        }
        if(part.startSeconds-last.endSeconds>2.8)break;
        if(part.endSeconds-first.startSeconds>18)break;
        if(looksLikeTransition(part.text))break;
        last=part;
      }
      if(!first||!last)continue;
      episodes.push({
        startSeconds:Number(first.startSeconds.toFixed(2)),
        endSeconds:Number(last.endSeconds.toFixed(2)),
        durationSeconds:Number((last.endSeconds-first.startSeconds).toFixed(2)),
        questionText:question.text.slice(0,180),
        answerText:segments.slice(firstIndex,Math.min(segments.length,firstIndex+5)).filter(part=>part.startSeconds<=last.endSeconds).map(part=>part.text).join(' ').slice(0,320)
      });
    }
    const deduped=[];
    for(const episode of episodes.sort((a,b)=>a.startSeconds-b.startSeconds)){
      const previous=deduped[deduped.length-1];
      if(!previous||episode.startSeconds-previous.startSeconds>=4.5)deduped.push(episode);
    }
    return deduped.slice(0,24);
  }

  function analyzeAnswerDurations(segments){
    const episodes=buildAnswerEpisodes(segments);
    if(episodes.length<3)return {available:false,status:'unknown',episodes,count:episodes.length,inRangeCount:0,outliers:[]};
    const outliers=episodes.filter(item=>item.durationSeconds<7||item.durationSeconds>16);
    const durations=episodes.map(item=>item.durationSeconds).sort((a,b)=>a-b);
    const average=durations.reduce((sum,value)=>sum+value,0)/durations.length;
    return {
      available:true,
      status:outliers.length?'warning':'ok',
      count:episodes.length,
      inRangeCount:episodes.length-outliers.length,
      outliers,
      averageSeconds:Number(average.toFixed(1)),
      minSeconds:Number(durations[0].toFixed(1)),
      maxSeconds:Number(durations[durations.length-1].toFixed(1)),
      minAccepted:7,
      maxAccepted:16,
      episodes
    };
  }

  function ensureStyles(){
    if(document.getElementById('vcheckUnifiedVideoStyles'))return;
    const style=document.createElement('style');
    style.id='vcheckUnifiedVideoStyles';
    style.textContent=`
      #vcheckUnifiedVideoReport{margin-top:12px;border:1px solid #fed7aa;background:#fffaf5;border-radius:17px;padding:18px;color:#334155}
      #vcheckUnifiedVideoReport h3{margin:0 0 5px;color:#111827;font-size:20px}
      #vcheckUnifiedVideoReport .vr-sub{color:#64748b;font-size:13px;margin-bottom:12px}
      #vcheckUnifiedVideoReport .vr-overall,#vcheckUnifiedVideoReport .vr-block{border:1px solid #f1e5da;background:#fff;border-radius:13px;padding:13px;margin-top:12px}
      #vcheckUnifiedVideoReport .vr-check{border-top:1px solid #f1e5da;padding:12px 0}
      #vcheckUnifiedVideoReport .vr-title{font-weight:850;color:#1f2937}
      #vcheckUnifiedVideoReport .vr-pill{display:inline-block;margin:5px 0;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:850}
      #vcheckUnifiedVideoReport .ok{background:#dcfce7;color:#166534}.problem{background:#ffe4e6;color:#9f1239}.warning{background:#fef3c7;color:#92400e}.unknown{background:#e2e8f0;color:#475569}
      #vcheckUnifiedVideoReport .vr-evidence{font-size:12px;color:#64748b;margin-top:5px}
      #vcheckUnifiedVideoReport .vr-action{font-size:13px;color:#9a3412;margin-top:5px}
    `;
    document.head.appendChild(style);
  }

  const statusLabel=status=>({ok:'Соблюдено',problem:'Проблема',warning:'Нужно внимание',unknown:'Не удалось определить'})[status]||'Проверка';

  function render(payload,vision,source){
    ensureStyles();
    const analysis=payload?.analysis||{};
    const pdf=document.getElementById('pdfArea');
    const final=document.getElementById('final');
    if(!pdf)return;
    let root=document.getElementById('vcheckUnifiedVideoReport');
    if(!root){
      root=document.createElement('section');
      root.id='vcheckUnifiedVideoReport';
      final?pdf.insertBefore(root,final):pdf.appendChild(root);
    }
    const checks=Array.isArray(analysis.checks)?analysis.checks:[];
    const strengths=Array.isArray(analysis.strengths)?analysis.strengths:[];
    const fixes=Array.isArray(analysis.priorityFixes)?analysis.priorityFixes:[];
    const teacher=Array.isArray(analysis.teacherReview)?analysis.teacherReview:[];
    const frameLine=vision?.failed?`${Number(vision?.checked||0)} из ${TARGET_FRAMES} стоп-кадров Qwen (${Number(vision.failed)} с ошибкой)`:`${Number(vision?.checked||0)} стоп-кадров Qwen`;
    const transcriptLabel=source?.kind==='cloudVideo'?'расшифровка Cloud Video':'расшифровка SpeechKit';
    root.innerHTML=`
      <h3>Глубокий ИИ-анализ видео</h3>
      <div class="vr-sub">${esc(transcriptLabel)} + ${esc(frameLine)} · ИИ не заменяет преподавателя.</div>
      <div class="vr-overall"><b>Общий вывод</b><br>${esc(analysis?.overall?.summary||'ИИ-анализ выполнен.')}</div>
      ${checks.map(check=>`<div class="vr-check"><div class="vr-title">${esc(check.title||check.id||'Проверка')}</div><span class="vr-pill ${esc(check.status||'unknown')}">${esc(statusLabel(check.status))}</span><div>${esc(check.finding||'')}</div>${Array.isArray(check.evidence)&&check.evidence.length?`<div class="vr-evidence"><b>Основание:</b> ${check.evidence.slice(0,3).map(esc).join(' · ')}</div>`:''}${check.recommendation?`<div class="vr-action"><b>Что сделать:</b> ${esc(check.recommendation)}</div>`:''}</div>`).join('')}
      ${strengths.length?`<div class="vr-block"><b>Сильные стороны</b><ul>${strengths.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      ${fixes.length?`<div class="vr-block"><b>Что исправить в первую очередь</b><ol>${fixes.map(x=>`<li><b>${esc(x.problem||'')}</b>${x.how?` — ${esc(x.how)}`:''}</li>`).join('')}</ol></div>`:''}
      ${teacher.length?`<div class="vr-block"><b>Что должен проверить преподаватель</b><ul>${teacher.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      <div class="vr-block"><b>Рекомендация перед сдачей</b><br>${esc(analysis.finalRecommendation||'Сопоставьте выводы ИИ с исходным видео.')}</div>`;
    if(final&&analysis.finalRecommendation)final.textContent=analysis.finalRecommendation;
    try{
      if(typeof reportText!=='undefined'){
        reportText+=`\n\nГЛУБОКИЙ ИИ-АНАЛИЗ ВИДЕО\n${analysis?.overall?.summary||''}\n${checks.map(x=>`— ${x.title||x.id}: ${x.finding||''}`).join('\n')}\n\nРЕКОМЕНДАЦИЯ\n${analysis.finalRecommendation||''}`;
      }
    }catch(_){}
    root.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function loadScript(src,test){
    if(test())return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;
      s.onload=()=>test()?resolve():reject(new Error('library_not_ready'));
      s.onerror=()=>reject(new Error('library_load_failed'));
      document.head.appendChild(s);
    });
  }

  async function ensurePdfLibraries(){
    await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',()=>typeof window.html2canvas==='function');
    await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
  }

  function pdfChunks(area){
    const out=[];
    for(const child of Array.from(area.children)){
      if(child.id==='vcheckUnifiedVideoReport')out.push(...Array.from(child.children));
      else out.push(child);
    }
    return out.filter(el=>el&&el.offsetHeight>0&&el.id!=='vcheckUnifiedVideoProgress');
  }

  async function buildPdfBlob(){
    const area=document.getElementById('pdfArea');
    if(!area)throw new Error('pdf_area_missing');
    await ensurePdfLibraries();
    const details=Array.from(area.querySelectorAll('details'));
    const wasOpen=details.map(x=>x.open);
    details.forEach(x=>x.open=true);
    await sleep(80);
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
    const pageW=210,pageH=297,margin=9,usableW=pageW-margin*2,usableH=pageH-margin*2;
    let y=margin,used=false;
    try{
      const areaWidth=Math.max(1,area.getBoundingClientRect().width);
      for(const el of pdfChunks(area)){
        const canvas=await window.html2canvas(el,{scale:1.15,backgroundColor:'#ffffff',useCORS:true,logging:false,removeContainer:true});
        if(!canvas.width||!canvas.height)continue;
        const fraction=Math.min(1,Math.max(.18,el.getBoundingClientRect().width/areaWidth));
        const targetW=usableW*fraction;
        const mmPerPx=targetW/canvas.width;
        const maxSlicePx=Math.max(1,Math.floor(usableH/mmPerPx));
        let sy=0;
        while(sy<canvas.height){
          const sliceH=Math.min(maxSlicePx,canvas.height-sy);
          const slice=document.createElement('canvas');
          slice.width=canvas.width;slice.height=sliceH;
          const ctx=slice.getContext('2d',{alpha:false});
          ctx.fillStyle='#fff';ctx.fillRect(0,0,slice.width,slice.height);
          ctx.drawImage(canvas,0,sy,canvas.width,sliceH,0,0,canvas.width,sliceH);
          const hMm=sliceH*mmPerPx;
          if(used&&y+hMm>pageH-margin){pdf.addPage();y=margin;}
          pdf.addImage(slice.toDataURL('image/jpeg',.9),'JPEG',margin,y,targetW,hMm,undefined,'FAST');
          used=true;y+=hMm+2.5;sy+=sliceH;
          if(sy<canvas.height){pdf.addPage();y=margin;}
        }
      }
      if(!used)throw new Error('pdf_render_empty');
      return pdf.output('blob');
    }finally{
      details.forEach((x,i)=>x.open=wasOpen[i]);
    }
  }

  function installPdfFix(){
    const pdfBtn=document.getElementById('pdf');
    const shareBtn=document.getElementById('share');
    if(pdfBtn&&!pdfBtn.dataset.vcheckPdf50){
      pdfBtn.dataset.vcheckPdf50='1';
      pdfBtn.addEventListener('click',async event=>{
        event.preventDefault();event.stopImmediatePropagation();
        const old=pdfBtn.textContent;pdfBtn.disabled=true;pdfBtn.textContent='Готовим PDF…';
        try{
          const blob=await buildPdfBlob();
          const url=URL.createObjectURL(blob);
          const a=document.createElement('a');a.href=url;a.download='MMT-V-CHECK.pdf';document.body.appendChild(a);a.click();a.remove();
          setTimeout(()=>URL.revokeObjectURL(url),15000);
        }catch(error){console.error('V-CHECK PDF failed',error);alert('Не удалось собрать PDF. Попробуйте ещё раз.');}
        finally{pdfBtn.disabled=false;pdfBtn.textContent=old;}
      },true);
    }
    if(shareBtn&&!shareBtn.dataset.vcheckPdf50){
      shareBtn.dataset.vcheckPdf50='1';
      shareBtn.addEventListener('click',async event=>{
        event.preventDefault();event.stopImmediatePropagation();
        try{
          const blob=await buildPdfBlob();
          const file=new File([blob],'MMT-V-CHECK.pdf',{type:'application/pdf'});
          if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({title:'MMT V-CHECK',text:'Результат проверки материала',files:[file]});
          else if(navigator.share)await navigator.share({title:'MMT V-CHECK',text:typeof reportText!=='undefined'?reportText:'Результат проверки материала'});
          else{await navigator.clipboard.writeText(typeof reportText!=='undefined'?reportText:'Результат проверки материала');alert('Отчёт скопирован. Его можно вставить в Telegram.');}
        }catch(error){if(error?.name!=='AbortError')console.error('V-CHECK share failed',error);}
      },true);
    }
  }

  async function run(){
    if(running||!isVideoFormat())return;
    const file=currentFile();
    if(!file)return;
    running=true;
    const button=document.querySelector('#form button[type="submit"]');
    const oldLabel=button?.textContent||'Проверить материал';
    if(button){button.disabled=true;button.textContent='Проверяем видео…';}

    try{
      document.getElementById('vcheckUnifiedVideoReport')?.remove();
      progress(CONTROL_VIDEO_IDS[file.name]?'Подключаем контрольное видео…':'Загружаем видео во временное хранилище…');
      const source=await ensureUploadedSource(file);

      progress(`Готовим ${TARGET_FRAMES} серверных стоп-кадров…`);
      const vision=await analyzeVision(source);

      progress(source.kind==='cloudVideo'?'Получаем расшифровку речи…':'Извлекаем аудиодорожку и запускаем SpeechKit…');
      const speech=await getTranscript(source);
      const segments=normalizeSegments(speech.segments);

      if(formatKey()==='street'){
        window.__VCHECK_ANSWER_DURATION__=analyzeAnswerDurations(segments);
      }else{
        window.__VCHECK_ANSWER_DURATION__=null;
      }

      const observations=buildObservations(vision,segments);
      progress('YandexGPT объединяет речь, визуальные признаки и требования выбранного формата…');
      const payload=await api({
        action:'analyzeMaterial',
        format:formatKey(),
        transcript:speech.transcript,
        annotation:document.getElementById('annotation')?.value||'',
        significance:document.getElementById('significance')?.value||'',
        aiElement:document.getElementById('aiElement')?.value||'',
        aiPlace:document.getElementById('aiPlace')?.value||'',
        durationSeconds:durationSeconds(),
        mediaObservations:observations,
        videoObservations:observations,
        audioObservations:speech.audioObservations||null,
        sourceNote:`Доступна таймкодированная расшифровка речи и выборка из ${TARGET_FRAMES} стоп-кадров, сопоставленных по времени. Не утверждай отсутствие визуального элемента только потому, что он не попал в выборку. Не делай выводов о возрасте, социальном статусе или иных характеристиках людей по внешности. Не делай выводов о качестве звука без прямых данных. Если данных недостаточно, ставь unknown, а не warning/problem.`
      });
      if(!payload?.ai||!payload?.analysis)throw new Error('YandexGPT не вернул структурированный видеоотчёт.');
      render(payload,vision,source);
      installPdfFix();
      progress(`Единый отчёт готов: расшифровка + ${Number(vision.checked||0)} облачных стоп-кадров Qwen + YandexGPT.`,'ok');
    }catch(error){
      console.error('V-CHECK video engine v5 failed',error);
      const message=error?.message||'Не удалось выполнить содержательную проверку видео.';
      if(/unknown_action|prepareUploadedVideoAudio|objectKey|video_id_required/i.test(message)){
        progress('Для обычных загруженных видео серверная часть ещё не обновлена до универсального режима.','bad');
      }else{
        progress(message,'bad');
      }
    }finally{
      running=false;
      if(button){button.disabled=false;button.textContent=oldLabel;}
    }
  }

  function bind(){
    const form=document.getElementById('form');
    if(!form||form.dataset.vcheckVideoEngineV5==='1')return;
    form.dataset.vcheckVideoEngineV5='1';

    document.addEventListener('change',event=>{
      if(event.target?.id!=='materialFile')return;
      resetVideoState();
      const file=event.target.files?.[0];
      if(!file)return;
      const isVideo=String(file.type||'').startsWith('video/')||/\.(mp4|mov|m4v|webm)$/i.test(file.name||'');
      if(isVideo){
        setVisionNote(`<b>Серверный визуальный анализ готов к запуску.</b><br>После нажатия «Проверить материал» V-CHECK загрузит файл во временное хранилище, вырежет ${TARGET_FRAMES} стоп-кадров через FFmpeg и сопоставит их с расшифровкой речи.`);
      }
    },true);

    document.getElementById('format')?.addEventListener('change',()=>{
      resetVideoState();
      document.getElementById('cloudVisionNote')?.remove();
    });

    form.addEventListener('submit',()=>{
      if(isVideoFormat())setTimeout(run,80);
    });

    form.addEventListener('reset',()=>setTimeout(()=>{
      resetVideoState();
      document.getElementById('vcheckUnifiedVideoReport')?.remove();
      document.getElementById('vcheckUnifiedVideoProgress')?.remove();
      document.getElementById('cloudVisionNote')?.remove();
    },0));

    installPdfFix();
    console.log('V-CHECK universal video engine v5 loaded');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();