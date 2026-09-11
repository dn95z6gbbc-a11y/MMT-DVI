(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';

  if(window.__VCHECK_REPORT_CONSISTENCY_V1__)return;
  window.__VCHECK_REPORT_CONSISTENCY_V1__='1.0';

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

  function patchAnalysis(analysis){
    if(!analysis||typeof analysis!=='object')return analysis;

    const vision=window.VCHECK_VIDEO_VISION||{};
    const targeted=window.__VCHECK_RESPONDENT_TARGETING__||{};
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

  console.log('V-CHECK report consistency v1.0 loaded');
})();
