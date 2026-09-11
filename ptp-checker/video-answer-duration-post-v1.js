(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';

  if(window.__VCHECK_ANSWER_DURATION_POST_V1__)return;
  window.__VCHECK_ANSWER_DURATION_POST_V1__='1.0';

  const nativeFetch=window.fetch.bind(window);

  function isAnalyzeMaterial(input,init){
    try{
      const url=typeof input==='string'?input:String(input?.url||'');
      if(url!==API_URL||!init?.body)return false;
      const body=JSON.parse(String(init.body));
      return body?.action==='analyzeMaterial';
    }catch(_){
      return false;
    }
  }

  function formatTime(seconds){
    const total=Math.max(0,Number(seconds)||0);
    const minutes=Math.floor(total/60);
    const secs=Math.floor(total-minutes*60);
    return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function makeCheck(data){
    const episodes=Array.isArray(data?.episodes)?data.episodes:[];

    if(!data?.available||episodes.length<3){
      return {
        id:'answerDuration',
        title:'Ответы примерно по 8–15 секунд',
        status:'unknown',
        finding:'Недостаточно надёжных таймкодированных эпизодов ответов для автоматической оценки.',
        evidence:[],
        recommendation:'Проверить длительность ответов вручную по готовому материалу.'
      };
    }

    const outliers=Array.isArray(data.outliers)?data.outliers:[];
    const evidence=[
      `По таймкодам расшифровки найдено ${data.count} эпизодов ответов; ${data.inRangeCount} укладываются примерно в диапазон 8–15 секунд.`,
      `Средняя длительность — ${data.averageSeconds} с; минимум — ${data.minSeconds} с; максимум — ${data.maxSeconds} с.`
    ];

    if(!outliers.length){
      return {
        id:'answerDuration',
        title:'Ответы примерно по 8–15 секунд',
        status:'ok',
        finding:'Длительность найденных ответов соответствует ориентиру 8–15 секунд.',
        evidence,
        recommendation:''
      };
    }

    const examples=outliers.slice(0,5).map(item=>
      `${formatTime(item.startSeconds)} — ${Number(item.durationSeconds).toFixed(1)} с`
    );

    return {
      id:'answerDuration',
      title:'Ответы примерно по 8–15 секунд',
      status:'warning',
      finding:`Из ${data.count} найденных ответов ${outliers.length} заметно выходят за ориентир 8–15 секунд.`,
      evidence:[...evidence,`Примеры: ${examples.join(', ')}.`],
      recommendation:'На монтаже сократить слишком длинные ответы; слишком короткие — при возможности заменить более содержательной репликой.'
    };
  }

  function patchAnalysis(analysis){
    const duration=window.__VCHECK_ANSWER_DURATION__;
    if(!analysis||typeof analysis!=='object'||!duration)return analysis;

    const checks=Array.isArray(analysis.checks)?analysis.checks:[];
    const durationCheck=makeCheck(duration);
    const index=checks.findIndex(check=>{
      const text=`${String(check?.id||'')} ${String(check?.title||'')}`.toLowerCase();
      return /8\s*[–—-]?\s*15/.test(text)||(/ответ/.test(text)&&/секунд|seconds|duration/.test(text));
    });

    if(index>=0){
      checks[index]={...checks[index],...durationCheck};
    }else{
      checks.push(durationCheck);
    }

    analysis.checks=checks;

    if(Array.isArray(analysis.teacherReview)&&duration.available){
      analysis.teacherReview=analysis.teacherReview.filter(item=>{
        const text=String(item||'').toLowerCase();
        return !(/ответ/.test(text)&&(/8\s*[–—-]?\s*15/.test(text)||/длитель.*ответ|ответ.*секунд/.test(text)));
      });
    }

    return analysis;
  }

  function patchPayload(payload){
    if(!payload||typeof payload!=='object')return payload;

    if(typeof payload.body==='string'){
      try{
        const inner=JSON.parse(payload.body);
        if(inner?.analysis)inner.analysis=patchAnalysis(inner.analysis);
        return {...payload,body:JSON.stringify(inner)};
      }catch(_){
        return payload;
      }
    }

    if(payload?.analysis){
      return {...payload,analysis:patchAnalysis(payload.analysis)};
    }

    return payload;
  }

  window.fetch=async function(input,init){
    const shouldPatch=isAnalyzeMaterial(input,init);
    const response=await nativeFetch(input,init);

    if(!shouldPatch)return response;

    try{
      const raw=await response.clone().json();
      const patched=patchPayload(raw);
      return new Response(JSON.stringify(patched),{
        status:response.status,
        statusText:response.statusText,
        headers:new Headers(response.headers)
      });
    }catch(error){
      console.warn('V-CHECK answer-duration post patch skipped:',error);
      return response;
    }
  };

  console.log('V-CHECK answer-duration post v1.0 loaded');
})();
