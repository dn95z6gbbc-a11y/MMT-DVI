(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';

  if(window.__VCHECK_REPORT_CONSISTENCY_V1__)return;
  window.__VCHECK_REPORT_CONSISTENCY_V1__='1.1';

  const nativeFetch=window.fetch.bind(window);

  function isAnalyzeMaterialRequest(input,init){
    try{
      const url=typeof input==='string'?input:String(input?.url||'');
      if(url!==API_URL||!init?.body)return false;
      const body=JSON.parse(String(init.body));
      return body?.action==='analyzeMaterial';
    }catch(_){
      return false;
    }
  }

  function textOfCheck(check){
    return `${String(check?.id||'')} ${String(check?.title||'')}`.toLowerCase();
  }

  function addEvidence(check,text){
    if(!text)return;
    const current=Array.isArray(check.evidence)?check.evidence:[];
    if(!current.some(item=>String(item||'').trim()===text)){
      check.evidence=[...current,text].slice(0,4);
    }
  }

  function formatTime(seconds){
    const total=Math.max(0,Number(seconds)||0);
    const minutes=Math.floor(total/60);
    const secs=Math.floor(total-minutes*60);
    return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function answerDurationCheck(durationAnalysis){
    const data=durationAnalysis||{};
    const episodes=Array.isArray(data.episodes)?data.episodes:[];

    if(!data.available||episodes.length<3){
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
    if(!analysis||typeof analysis!=='object')return analysis;

    const vision=window.VCHECK_VIDEO_VISION||{};
    const targeted=window.__VCHECK_RESPONDENT_TARGETING__||{};
    const durationAnalysis=window.__VCHECK_ANSWER_DURATION__||null;
    const checks=Array.isArray(analysis.checks)?analysis.checks:[];
    const respondentCount=
      Number.isInteger(targeted?.confirmedRespondentCount)
        ?targeted.confirmedRespondentCount
        :(Number.isInteger(vision?.confirmedRespondentCount)?vision.confirmedRespondentCount:null);

    for(const check of checks){
      const identity=textOfCheck(check);

      if(vision?.standupConfirmed===true && /стендап|standup/.test(identity)){
        check.status='ok';
        check.finding='Стендап подтверждён визуальным анализом.';
        check.recommendation='';
        addEvidence(check,'Общий визуальный анализ последовательности подтвердил наличие стендапа.');
      }

      if(vision?.cutawaysConfirmed===true && /перебив|cutaway|b[- ]?roll/.test(identity)){
        check.status='ok';
        check.finding='Перебивки присутствуют.';
        check.recommendation='';
        addEvidence(check,'Общий визуальный анализ последовательности подтвердил наличие перебивок.');
      }

      if(
        Number.isInteger(respondentCount) &&
        respondentCount>=8 &&
        /респондент|respondent/.test(identity) &&
        /колич|минимум|восем|8|count|number/.test(identity)
      ){
        check.status='ok';
        check.finding=`Визуально подтверждено минимум ${respondentCount} разных респондентов.`;
        check.recommendation='';
        addEvidence(check,`Целевой анализ эпизодов ответов подтвердил ${respondentCount} разных респондентов.`);
      }

      if(
        vision?.visualAlternationConfirmed===true &&
        /монтаж|сопостав|разговор между|alternation/.test(identity)
      ){
        check.status='ok';
        check.recommendation='';
        addEvidence(check,'Общий визуальный анализ подтвердил чередование интервью и дополнительных планов.');
      }
    }

    if(durationAnalysis){
      const durationPatch=answerDurationCheck(durationAnalysis);
      const durationIndex=checks.findIndex(check=>{
        const identity=textOfCheck(check);
        return /8\s*[–—-]?\s*15/.test(identity)||(/ответ/.test(identity)&&/секунд|seconds|duration/.test(identity));
      });

      if(durationIndex>=0){
        checks[durationIndex]={...checks[durationIndex],...durationPatch};
      }else{
        checks.push(durationPatch);
      }
    }

    analysis.checks=checks;

    const significanceNotOk=checks.some(check=>{
      const identity=textOfCheck(check);
      return /обществен.*значим|social.*signific/.test(identity) && check?.status!=='ok';
    });

    if(significanceNotOk && Array.isArray(analysis.strengths)){
      analysis.strengths=analysis.strengths.filter(item=>
        !/значим|обществен.*значим/i.test(String(item||''))
      );
    }

    if(Array.isArray(analysis.teacherReview)){
      analysis.teacherReview=analysis.teacherReview.filter(item=>{
        const text=String(item||'');
        if(vision?.standupConfirmed===true && /стендап/i.test(text))return false;
        if(vision?.cutawaysConfirmed===true && /перебив/i.test(text))return false;
        if(Number.isInteger(respondentCount)&&respondentCount>=8&&/респондент/i.test(text)&&/(колич|минимум|восем|8)/i.test(text))return false;
        if(durationAnalysis?.available&&/ответ/i.test(text)&&(/8\s*[–—-]?\s*15/.test(text)||/длитель.*ответ|ответ.*секунд/i.test(text)))return false;
        return true;
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
      payload={...payload,analysis:patchAnalysis(payload.analysis)};
    }
    return payload;
  }

  window.fetch=async function(input,init){
    const shouldPatch=isAnalyzeMaterialRequest(input,init);
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
      console.warn('V-CHECK report consistency patch skipped:',error);
      return response;
    }
  };

  console.log('V-CHECK report consistency v1.1 loaded');
})();
