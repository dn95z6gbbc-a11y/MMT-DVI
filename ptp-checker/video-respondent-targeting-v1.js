(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const VIDEO_IDS={
    'Стрит тест.mp4':'vplvturpy67z22dg7om4'
  };
  const MAX_TARGETS=20;

  if(window.__VCHECK_RESPONDENT_TARGETING_V1__)return;
  window.__VCHECK_RESPONDENT_TARGETING_V1__='1.0';

  const nativeFetch=window.fetch.bind(window);
  let targetedResult=null;
  let targetedPromise=null;
  let lastSignature='';

  function parseEnvelope(value){
    if(value&&typeof value.body==='string'){
      try{return JSON.parse(value.body)}catch(_){}
    }
    return value||{};
  }

  async function api(body){
    const response=await nativeFetch(API_URL,{
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

  function currentFormat(){
    return String(document.getElementById('format')?.value||'');
  }

  function currentFile(){
    return document.getElementById('materialFile')?.files?.[0]||null;
  }

  function normalizeSegments(value){
    if(!Array.isArray(value))return [];
    return value
      .map((item,index)=>{
        const startSeconds=Number(item?.startSeconds);
        const endSeconds=Number(item?.endSeconds);
        const text=String(item?.text||'').trim();
        if(!Number.isFinite(startSeconds)||!Number.isFinite(endSeconds)||endSeconds<startSeconds||!text)return null;
        return {index,startSeconds,endSeconds,text};
      })
      .filter(Boolean)
      .sort((a,b)=>a.startSeconds-b.startSeconds);
  }

  function looksLikeQuestion(text){
    const source=String(text||'').trim().toLowerCase();
    if(!source)return false;
    if(/[?？]/.test(source))return true;
    return /^(как|что|кто|кого|где|куда|откуда|когда|почему|зачем|какой|какая|какие|какое|насколько|сколько|чем|считаете ли|думаете ли|нравится ли|ваш|ваша|ваше|ваши)\b/i.test(source);
  }

  function looksLikeTransition(text){
    const source=String(text||'').trim().toLowerCase().replace(/[.!?,:;]+$/g,'');
    return /^(спасибо|большое спасибо|понятно|ясно|хорошо|отлично, спасибо|идем дальше|поехали дальше)$/.test(source);
  }

  function midpoint(segment){
    return Number(((segment.startSeconds+segment.endSeconds)/2).toFixed(2));
  }

  function dedupeBySpacing(items,minSpacing=4){
    const out=[];
    for(const item of items){
      if(!out.length||item.timeSeconds-out[out.length-1].timeSeconds>=minSpacing){
        out.push(item);
      }
    }
    return out;
  }

  function pickEvenly(items,limit){
    if(items.length<=limit)return items.slice();
    const selected=[];
    const used=new Set();
    for(let i=0;i<limit;i++){
      const index=Math.round(i*(items.length-1)/(limit-1));
      if(!used.has(index)){
        used.add(index);
        selected.push(items[index]);
      }
    }
    return selected;
  }

  function respondentMoments(segments){
    const candidates=[];

    for(let i=0;i<segments.length;i++){
      const question=segments[i];
      if(!looksLikeQuestion(question.text))continue;

      for(let j=i+1;j<Math.min(segments.length,i+5);j++){
        const answer=segments[j];
        const gap=answer.startSeconds-question.endSeconds;
        if(gap>12)break;
        if(looksLikeQuestion(answer.text))break;
        if(looksLikeTransition(answer.text))continue;
        if(answer.endSeconds-answer.startSeconds<0.45&&answer.text.length<8)continue;

        candidates.push({
          timeSeconds:midpoint(answer),
          questionIndex:question.index,
          answerIndex:answer.index,
          questionText:question.text.slice(0,180),
          answerText:answer.text.slice(0,220)
        });
        break;
      }
    }

    let moments=dedupeBySpacing(candidates,4);

    // Если вопросов распознано мало, добавляем длинные речевые сегменты,
    // но только как дополнительные точки съёмки — не как доказательство
    // количества респондентов.
    if(moments.length<8){
      const supplements=segments
        .filter(segment=>
          !looksLikeQuestion(segment.text)&&
          !looksLikeTransition(segment.text)&&
          segment.endSeconds-segment.startSeconds>=1.4
        )
        .map(segment=>({
          timeSeconds:midpoint(segment),
          questionIndex:null,
          answerIndex:segment.index,
          questionText:'',
          answerText:segment.text.slice(0,220),
          supplemental:true
        }));

      const merged=[...moments,...supplements]
        .sort((a,b)=>a.timeSeconds-b.timeSeconds);
      moments=dedupeBySpacing(merged,6);
    }

    return pickEvenly(moments,MAX_TARGETS);
  }

  function setCloudNote(html){
    const note=document.getElementById('cloudVisionNote');
    if(note)note.innerHTML=html;
  }

  function setUnifiedProgress(text){
    const box=document.getElementById('vcheckUnifiedVideoProgress');
    if(!box)return;
    box.innerHTML=`<b>Видео: содержательная ИИ-проверка</b><br>${String(text||'')}`;
  }

  function compactTargeted(result){
    const analysis=result?.analysis||{};
    return {
      candidateMoments:Number(result?.candidateMoments||0),
      extractedFrames:Number(result?.extractedFrames||0),
      confirmedRespondentCount:Number.isInteger(result?.confirmedRespondentCount)
        ?result.confirmedRespondentCount
        :null,
      respondentCountConfidence:String(analysis?.respondentCountConfidence||'unknown'),
      respondentEvidence:Array.isArray(analysis?.respondentEvidence)
        ?analysis.respondentEvidence.slice(0,12)
        :[],
      uncertain:Array.isArray(analysis?.uncertain)
        ?analysis.uncertain.slice(0,6)
        :[]
    };
  }

  async function runTargetedRespondentAnalysis(videoId,segments){
    const moments=respondentMoments(segments);
    if(moments.length<2){
      return {
        ok:false,
        reason:'not_enough_candidate_moments',
        candidateMoments:moments.length,
        confirmedRespondentCount:null,
        analysis:null
      };
    }

    setCloudNote(
      `<b>Дополнительный анализ респондентов.</b><br>`+
      `По таймкодам речи выбрано ${moments.length} моментов вероятных ответов. `+
      `FFmpeg готовит кадры именно в этих точках…`
    );
    setUnifiedProgress(`Выбираем кадры по таймкодам ответов респондентов: ${moments.length} точек…`);

    const extracted=await api({
      action:'extractVideoFrames',
      videoId,
      timesSeconds:moments.map(item=>item.timeSeconds),
      includeBase64:true
    });

    const frames=(Array.isArray(extracted?.frames)?extracted.frames:[])
      .filter(frame=>frame?.imageBase64&&!frame?.error)
      .map((frame,index)=>({
        index,
        timeSeconds:Number(frame?.timeSeconds),
        imageBase64:frame.imageBase64,
        mimeType:frame.mimeType||'image/jpeg'
      }));

    if(frames.length<2){
      return {
        ok:false,
        reason:'target_frames_missing',
        candidateMoments:moments.length,
        extractedFrames:frames.length,
        confirmedRespondentCount:null,
        analysis:null
      };
    }

    setCloudNote(
      `<b>Дополнительный анализ респондентов.</b><br>`+
      `Получено ${frames.length} кадров в моменты ответов. `+
      `Qwen сопоставляет людей между этими кадрами и не считает реплики вместо людей…`
    );
    setUnifiedProgress(`Qwen сопоставляет людей на ${frames.length} кадрах, выбранных по таймкодам ответов…`);

    const global=await api({
      action:'videoGlobalVision',
      frames
    });

    const analysis=global?.analysis||null;
    const count=Number(analysis?.confirmedRespondentCount);
    const confirmedRespondentCount=Number.isInteger(count)&&count>=8?count:null;

    if(window.VCHECK_VIDEO_VISION&&typeof window.VCHECK_VIDEO_VISION==='object'){
      if(confirmedRespondentCount){
        window.VCHECK_VIDEO_VISION.confirmedRespondentCount=confirmedRespondentCount;
      }
      window.VCHECK_VIDEO_VISION.respondentTargetedVision=analysis;
      window.VCHECK_VIDEO_VISION.respondentTargetedMoments=moments.map(item=>item.timeSeconds);
      window.VCHECK_VIDEO_VISION.respondentTargetedFrames=frames.length;
    }

    const result={
      ok:true,
      candidateMoments:moments.length,
      extractedFrames:frames.length,
      confirmedRespondentCount,
      analysis,
      moments
    };

    window.__VCHECK_RESPONDENT_TARGETING__=result;

    const countText=confirmedRespondentCount
      ?`подтверждено визуально разных респондентов: ${confirmedRespondentCount}`
      :'минимум 8 разных респондентов пока не удалось подтвердить с достаточной уверенностью';

    setCloudNote(
      `<b>Облачный визуальный анализ готов.</b><br>`+
      `24 равномерных кадра + ${frames.length} кадров по таймкодам ответов · ${countText}.`
    );

    return result;
  }

  function enrichBody(body){
    if(!targetedResult)return body;
    const targeted=compactTargeted(targetedResult);
    const count=targeted.confirmedRespondentCount;

    const enrich=observations=>({
      ...(observations||{}),
      ...(Number.isInteger(count)?{confirmedRespondentCount:count}:{}),
      respondentTargetedAnalysis:targeted,
      respondentTargetedSource:'subtitle_question_answer_timestamps_plus_ffmpeg_qwen'
    });

    body.mediaObservations=enrich(body.mediaObservations);
    body.videoObservations=enrich(body.videoObservations);
    return body;
  }

  window.fetch=async function(input,init){
    let url='';
    let action='';
    let requestBody=null;
    let nextInit=init;

    try{
      url=typeof input==='string'?input:String(input?.url||'');
      if(url===API_URL&&init?.body){
        requestBody=JSON.parse(String(init.body));
        action=String(requestBody?.action||'');

        if(action==='analyzeMaterial'&&targetedResult){
          requestBody=enrichBody(requestBody);
          nextInit={...init,body:JSON.stringify(requestBody)};
        }
      }
    }catch(_){}

    const response=await nativeFetch(input,nextInit);

    if(url===API_URL&&action==='videoSubtitles'&&currentFormat()==='street'){
      try{
        const raw=await response.clone().json();
        const data=parseEnvelope(raw);
        const segments=normalizeSegments(data?.segments);
        const file=currentFile();
        const videoId=VIDEO_IDS[file?.name||'']||String(requestBody?.videoId||'');
        const signature=`${videoId}|${segments.length}|${segments[0]?.startSeconds||0}|${segments[segments.length-1]?.endSeconds||0}`;

        if(videoId&&segments.length&&signature!==lastSignature){
          lastSignature=signature;
          targetedResult=null;
          targetedPromise=runTargetedRespondentAnalysis(videoId,segments)
            .then(result=>{
              targetedResult=result;
              return result;
            })
            .catch(error=>{
              console.warn('V-CHECK respondent-targeted analysis failed:',error);
              const result={
                ok:false,
                reason:error?.message||'respondent_targeting_failed',
                confirmedRespondentCount:null,
                analysis:null
              };
              targetedResult=result;
              window.__VCHECK_RESPONDENT_TARGETING__=result;
              return result;
            });
        }

        if(targetedPromise){
          await targetedPromise;
        }
      }catch(error){
        console.warn('V-CHECK respondent targeting skipped:',error);
      }
    }

    return response;
  };

  console.log('V-CHECK respondent targeting v1.0 loaded');
})();
