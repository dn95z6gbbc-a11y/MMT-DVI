(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const VIDEO_IDS={
    'Стрит тест.mp4':'vplvturpy67z22dg7om4'
  };
  const MAX_EPISODES=12;
  const MAX_SAMPLES=24;

  if(window.__VCHECK_RESPONDENT_TARGETING_V2__)return;
  window.__VCHECK_RESPONDENT_TARGETING_V2__='2.0';

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
    return /^(спасибо|большое спасибо|понятно|ясно|хорошо|отлично, спасибо|идем дальше|идём дальше|поехали дальше)$/.test(source);
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

  function dedupeEpisodes(items,minSpacing=5){
    const out=[];
    for(const item of items.sort((a,b)=>a.startSeconds-b.startSeconds)){
      const previous=out[out.length-1];
      if(!previous||item.startSeconds-previous.startSeconds>=minSpacing){
        out.push(item);
      }
    }
    return out;
  }

  function buildAnswerEpisodes(segments){
    const episodes=[];

    for(let i=0;i<segments.length;i++){
      const question=segments[i];
      if(!looksLikeQuestion(question.text))continue;

      let first=null;
      let last=null;
      let firstIndex=-1;

      for(let j=i+1;j<Math.min(segments.length,i+7);j++){
        const part=segments[j];
        if(part.startSeconds-question.endSeconds>14)break;
        if(looksLikeQuestion(part.text))break;
        if(looksLikeTransition(part.text)&&!first)continue;
        if(!first){
          if(part.endSeconds-part.startSeconds<0.35&&part.text.length<7)continue;
          first=part;
          last=part;
          firstIndex=j;
          continue;
        }
        if(part.startSeconds-last.endSeconds>2.8)break;
        if(part.endSeconds-first.startSeconds>13)break;
        if(looksLikeTransition(part.text))break;
        last=part;
      }

      if(!first||!last)continue;

      episodes.push({
        startSeconds:first.startSeconds,
        endSeconds:last.endSeconds,
        questionIndex:question.index,
        answerIndex:first.index,
        questionText:question.text.slice(0,180),
        answerText:segments
          .slice(firstIndex,Math.min(segments.length,firstIndex+4))
          .filter(part=>part.startSeconds<=last.endSeconds)
          .map(part=>part.text)
          .join(' ')
          .slice(0,320),
        supplemental:false
      });
    }

    let result=dedupeEpisodes(episodes,5);

    if(result.length<8){
      const supplements=segments
        .filter(segment=>
          !looksLikeQuestion(segment.text)&&
          !looksLikeTransition(segment.text)&&
          segment.endSeconds-segment.startSeconds>=1.5
        )
        .map(segment=>({
          startSeconds:segment.startSeconds,
          endSeconds:segment.endSeconds,
          questionIndex:null,
          answerIndex:segment.index,
          questionText:'',
          answerText:segment.text.slice(0,260),
          supplemental:true
        }));

      result=dedupeEpisodes([...result,...supplements],6);
    }

    return pickEvenly(result,MAX_EPISODES);
  }

  function sampleTimesForEpisodes(episodes){
    const samples=[];

    for(let episodeIndex=0;episodeIndex<episodes.length;episodeIndex++){
      const episode=episodes[episodeIndex];
      const start=Number(episode.startSeconds);
      const end=Number(episode.endSeconds);
      if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)continue;

      const duration=end-start;
      const first=Math.min(end-0.12,start+Math.min(0.65,Math.max(0.3,duration*0.18)));
      samples.push({
        episodeIndex,
        timeSeconds:Number(Math.max(start,first).toFixed(2)),
        position:'early'
      });

      if(duration>=1.45&&samples.length<MAX_SAMPLES){
        const second=Math.min(end-0.15,start+Math.min(2.4,Math.max(1.05,duration*0.58)));
        if(second-first>=0.55){
          samples.push({
            episodeIndex,
            timeSeconds:Number(second.toFixed(2)),
            position:'middle'
          });
        }
      }

      if(samples.length>=MAX_SAMPLES)break;
    }

    return samples.slice(0,MAX_SAMPLES);
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
      candidateEpisodes:Number(result?.candidateEpisodes||0),
      sampledFrames:Number(result?.sampledFrames||0),
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
    const episodes=buildAnswerEpisodes(segments);
    const samples=sampleTimesForEpisodes(episodes);

    if(episodes.length<2||samples.length<2){
      return {
        ok:false,
        reason:'not_enough_candidate_episodes',
        candidateEpisodes:episodes.length,
        sampledFrames:samples.length,
        confirmedRespondentCount:null,
        analysis:null
      };
    }

    setCloudNote(
      `<b>Дополнительный анализ респондентов.</b><br>`+
      `По расшифровке найдено ${episodes.length} эпизодов вероятных ответов. `+
      `FFmpeg берёт ${samples.length} кадров в начале и середине ответов…`
    );
    setUnifiedProgress(`Ищем респондентов по таймкодам: ${episodes.length} эпизодов, ${samples.length} кадров…`);

    const extracted=await api({
      action:'extractVideoFrames',
      videoId,
      timesSeconds:samples.map(item=>item.timeSeconds),
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
        candidateEpisodes:episodes.length,
        sampledFrames:samples.length,
        extractedFrames:frames.length,
        confirmedRespondentCount:null,
        analysis:null
      };
    }

    setCloudNote(
      `<b>Дополнительный анализ респондентов.</b><br>`+
      `Получено ${frames.length} целевых кадров из ${episodes.length} эпизодов ответов. `+
      `Qwen сравнивает лица и интервью-сцены между собой…`
    );
    setUnifiedProgress(`Qwen сопоставляет людей на ${frames.length} целевых кадрах из ${episodes.length} эпизодов ответов…`);

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
      window.VCHECK_VIDEO_VISION.respondentTargetedEpisodes=episodes;
      window.VCHECK_VIDEO_VISION.respondentTargetedSamples=samples;
      window.VCHECK_VIDEO_VISION.respondentTargetedFrames=frames.length;
    }

    const result={
      ok:true,
      candidateEpisodes:episodes.length,
      sampledFrames:samples.length,
      extractedFrames:frames.length,
      confirmedRespondentCount,
      analysis,
      episodes,
      samples
    };

    window.__VCHECK_RESPONDENT_TARGETING__=result;

    const countText=confirmedRespondentCount
      ?`подтверждено визуально разных респондентов: ${confirmedRespondentCount}`
      :'минимум 8 разных респондентов пока не удалось подтвердить с достаточной уверенностью';

    setCloudNote(
      `<b>Облачный визуальный анализ готов.</b><br>`+
      `24 равномерных кадра + ${frames.length} целевых кадров из ${episodes.length} эпизодов ответов · ${countText}.`
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
      respondentTargetedSource:'subtitle_question_answer_episodes_plus_two_ffmpeg_samples_qwen'
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
              setCloudNote(
                `<b>Облачный визуальный анализ готов.</b><br>`+
                `Дополнительный подсчёт респондентов не завершён: ${String(result.reason)}.`
              );
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

  console.log('V-CHECK respondent targeting v2.0 loaded');
})();
