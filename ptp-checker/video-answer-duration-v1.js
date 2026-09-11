(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';

  if(window.__VCHECK_ANSWER_DURATION_V1__)return;
  window.__VCHECK_ANSWER_DURATION_V1__='1.0';

  const nativeFetch=window.fetch.bind(window);

  function parseEnvelope(value){
    if(value&&typeof value.body==='string'){
      try{return JSON.parse(value.body)}catch(_){}
    }
    return value||{};
  }

  function currentFormat(){
    return String(document.getElementById('format')?.value||'');
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
        answerText:segments
          .slice(firstIndex,Math.min(segments.length,firstIndex+5))
          .filter(part=>part.startSeconds<=last.endSeconds)
          .map(part=>part.text)
          .join(' ')
          .slice(0,320)
      });
    }

    const deduped=[];
    for(const episode of episodes.sort((a,b)=>a.startSeconds-b.startSeconds)){
      const previous=deduped[deduped.length-1];
      if(!previous||episode.startSeconds-previous.startSeconds>=4.5){
        deduped.push(episode);
      }
    }

    return deduped.slice(0,24);
  }

  function formatTime(seconds){
    const total=Math.max(0,Number(seconds)||0);
    const minutes=Math.floor(total/60);
    const secs=Math.floor(total-minutes*60);
    return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function analyzeDurations(episodes){
    if(!Array.isArray(episodes)||episodes.length<3){
      return {
        available:false,
        status:'unknown',
        episodes:Array.isArray(episodes)?episodes:[],
        count:Array.isArray(episodes)?episodes.length:0,
        inRangeCount:0,
        outliers:[]
      };
    }

    // Требование сформулировано как «примерно 8–15 секунд»,
    // поэтому даём техническую погрешность ±1 с по таймкодам субтитров.
    const minAccepted=7;
    const maxAccepted=16;
    const outliers=episodes.filter(item=>
      item.durationSeconds<minAccepted||item.durationSeconds>maxAccepted
    );

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
      minAccepted,
      maxAccepted,
      episodes
    };
  }

  function removeManualDurationItem(){
    const items=[...document.querySelectorAll('li')];
    for(const item of items){
      const text=String(item.textContent||'').toLowerCase();
      if(/ответ/.test(text)&&/8/.test(text)&&/15/.test(text)&&/сек/.test(text)){
        item.remove();
      }
    }
  }

  window.fetch=async function(input,init){
    let url='';
    let action='';

    try{
      url=typeof input==='string'?input:String(input?.url||'');
      if(url===API_URL&&init?.body){
        const body=JSON.parse(String(init.body));
        action=String(body?.action||'');
      }
    }catch(_){}

    const response=await nativeFetch(input,init);

    if(url===API_URL&&action==='videoSubtitles'&&currentFormat()==='street'){
      try{
        const raw=await response.clone().json();
        const data=parseEnvelope(raw);
        const segments=normalizeSegments(data?.segments);
        const episodes=buildAnswerEpisodes(segments);
        const analysis=analyzeDurations(episodes);

        window.__VCHECK_ANSWER_DURATION__=analysis;
        removeManualDurationItem();

        console.info(
          `V-CHECK answer duration: ${analysis.count||0} ответов; `+
          `${analysis.inRangeCount||0} в диапазоне примерно 8–15 секунд.`
        );
      }catch(error){
        console.warn('V-CHECK answer duration analysis skipped:',error);
      }
    }

    return response;
  };

  window.__VCHECK_FORMAT_ANSWER_TIME__=formatTime;
  console.log('V-CHECK answer duration v1.0 loaded');
})();
