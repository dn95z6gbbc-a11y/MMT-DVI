// V-CHECK report consistency v2: hard guard for story sync counts and unsupported recommendations.
(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS=new Set(['story_event','story_theme']);

  if(window.__VCHECK_REPORT_CONSISTENCY_V2__)return;
  window.__VCHECK_REPORT_CONSISTENCY_V2__='2.1';

  const nativeFetch=window.fetch.bind(window);

  function parseEnvelope(value){
    if(value&&typeof value.body==='string'){
      try{return JSON.parse(value.body)}catch(_){}
    }
    return value||{};
  }

  function requestBody(input,init){
    try{
      const url=typeof input==='string'?input:String(input?.url||'');
      if(url!==API_URL||!init?.body)return null;
      const body=JSON.parse(String(init.body));
      return body?.action==='analyzeMaterial'?body:null;
    }catch(_){
      return null;
    }
  }

  function textOf(check){
    return `${String(check?.id||'')} ${String(check?.title||'')}`.toLowerCase();
  }

  function isSyncCountCheck(check){
    const text=textOf(check);
    return /синхрон|sync/.test(text)&&/колич|минимум|три|3|count|number/.test(text);
  }

  function isOpinionDiversityCheck(check){
    const text=textOf(check);
    return /разн.*позици|разнообраз.*мнен|разнообраз.*позици|different.*position|opinion.*divers/.test(text);
  }

  function issueText(item){
    if(typeof item==='string')return item.split(/\s+[—–-]\s+/)[0].toLowerCase();
    if(item&&typeof item==='object'){
      return [item.issue,item.title,item.problem,item.name].map(v=>String(v||'')).join(' ').toLowerCase();
    }
    return '';
  }

  function dedupeStrings(items){
    const seen=new Set();
    return items.filter(item=>{
      const key=String(item||'').trim().toLowerCase().replace(/^проверить\s+вручную:\s*/,'').replace(/^проверить\s+/,'');
      if(!key)return false;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }

  function rebuildFinalRecommendation(analysis){
    const checks=Array.isArray(analysis?.checks)?analysis.checks:[];
    const confirmed=checks
      .filter(check=>['problem','warning'].includes(check?.status)&&String(check?.recommendation||'').trim())
      .map(check=>String(check.recommendation).trim())
      .filter((value,index,list)=>list.indexOf(value)===index)
      .slice(0,3);

    if(confirmed.length){
      analysis.finalRecommendation=confirmed.join(' ');
      return;
    }

    if(checks.some(check=>check?.status==='unknown')){
      analysis.finalRecommendation='Перед сдачей проверьте вручную пункты, которые V-CHECK не смог определить автоматически.';
    }
  }

  function syncTeacherReviewWithUnknowns(analysis){
    const checks=Array.isArray(analysis?.checks)?analysis.checks:[];
    const current=Array.isArray(analysis?.teacherReview)?analysis.teacherReview:[];
    const additions=checks
      .filter(check=>check?.status==='unknown')
      .map(check=>`Проверить вручную: ${String(check?.title||check?.id||'критерий')}`);

    analysis.teacherReview=dedupeStrings([...current,...additions]);
  }

  function patchAnalysis(analysis,format){
    if(!analysis||typeof analysis!=='object'||!STORY_FORMATS.has(format))return analysis;

    const checks=Array.isArray(analysis.checks)?analysis.checks:[];
    const roles=window.__VCHECK_SPEECH_ROLE_ANALYSIS__||null;
    const syncCount=Number(roles?.syncCount);
    const differentSpeakers=Number(roles?.confirmedDifferentSyncSpeakers);
    const classifiedSegments=Number(roles?.classifiedSegments);
    const reliableRoles=
      !!roles&&
      Number.isFinite(syncCount)&&
      Number.isFinite(differentSpeakers)&&
      Number.isFinite(classifiedSegments)&&
      classifiedSegments>0;

    let syncUnknown=false;
    let opinionUnknown=false;

    for(const check of checks){
      if(isSyncCountCheck(check)){
        if(reliableRoles&&syncCount>=3&&differentSpeakers>=3){
          check.status='ok';
          check.finding='Подтверждены минимум три синхрона от разных спикеров.';
          check.evidence=[
            `Карта ролей речи выделила синхронов: ${syncCount}.`,
            `Подтверждено разных групп спикеров: ${differentSpeakers}.`
          ];
          check.recommendation='';
        }else{
          syncUnknown=true;
          check.status='unknown';
          check.finding='Недостаточно структурированных данных, чтобы надёжно подтвердить минимум три синхрона от разных спикеров.';
          check.evidence=reliableRoles?[
            `Автоматически выделено синхронов: ${syncCount}.`,
            `Разных подтверждённых групп спикеров: ${differentSpeakers}.`
          ]:[];
          check.recommendation='Проверить количество синхронов и число разных спикеров по готовому материалу.';
        }
      }

      if(isOpinionDiversityCheck(check)&&check?.status==='unknown'){
        opinionUnknown=true;
        check.finding=String(check.finding||'Недостаточно данных для надёжной оценки разнообразия позиций.');
        check.recommendation='Проверить, представлены ли в готовом материале действительно различающиеся позиции спикеров.';
      }
    }

    if(Array.isArray(analysis.priorityFixes)){
      analysis.priorityFixes=analysis.priorityFixes.filter(item=>{
        const issue=issueText(item);
        if(syncUnknown&&/синхрон|колич.*спикер|колич.*респондент/.test(issue))return false;
        if(opinionUnknown&&/разнообраз|позици|мнен/.test(issue))return false;
        return true;
      });
    }

    analysis.checks=checks;
    syncTeacherReviewWithUnknowns(analysis);
    rebuildFinalRecommendation(analysis);
    return analysis;
  }

  function patchPayload(payload,format){
    if(!payload||typeof payload!=='object')return payload;

    if(typeof payload.body==='string'){
      try{
        const inner=JSON.parse(payload.body);
        if(inner?.analysis)inner.analysis=patchAnalysis(inner.analysis,format);
        return {...payload,body:JSON.stringify(inner)};
      }catch(_){
        return payload;
      }
    }

    if(payload?.analysis){
      return {...payload,analysis:patchAnalysis(payload.analysis,format)};
    }

    return payload;
  }

  window.fetch=async function(input,init){
    const body=requestBody(input,init);
    const response=await nativeFetch(input,init);
    if(!body)return response;

    try{
      const raw=await response.clone().json();
      const format=String(body.format||document.getElementById('format')?.value||'');
      const patched=patchPayload(raw,format);
      return new Response(JSON.stringify(patched),{
        status:response.status,
        statusText:response.statusText,
        headers:new Headers(response.headers)
      });
    }catch(error){
      console.warn('V-CHECK report consistency v2 skipped:',error);
      return response;
    }
  };

  console.log('V-CHECK report consistency v2.1 loaded');
})();
