// V-CHECK story semantic guards v1: conservative opinion diversity/significance + clean recommendations.
(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS=new Set(['story_event','story_theme']);

  if(window.__VCHECK_STORY_SEMANTIC_GUARDS_V1__)return;
  window.__VCHECK_STORY_SEMANTIC_GUARDS_V1__='1.0';

  const nativeFetch=window.fetch.bind(window);

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

  function isOpinionDiversityCheck(check){
    const text=textOf(check);
    return /разн.*позици|разнообраз.*мнен|разнообраз.*позици|different.*position|opinion.*divers/.test(text);
  }

  function isSignificanceCheck(check){
    return /significance|обществен.*значим|значимост/.test(textOf(check));
  }

  function evidenceItems(check){
    return Array.isArray(check?.evidence)
      ? check.evidence.map(value=>String(value||'').trim()).filter(Boolean)
      : [];
  }

  function opinionEvidenceIsConcrete(check){
    const items=evidenceItems(check);
    if(items.length>=2)return true;

    // Один пункт считаем достаточным только если в нём явно сопоставлены
    // две конкретные позиции/реплики, а не дана общая оценка модели.
    const text=items.join(' ');
    const hasQuotes=(text.match(/[«“"]/g)||[]).length>=4;
    const hasExplicitContrast=/\b(один|первый|часть|одни)\b[\s\S]{0,180}\b(другой|второй|другая|другие)\b/i.test(text);
    return hasQuotes||hasExplicitContrast;
  }

  function significanceIsActuallySupported(check){
    const basis=[check?.finding,...evidenceItems(check)]
      .map(value=>String(value||''))
      .join(' ')
      .toLowerCase();

    const shallow=/широк.*аудитор|интерес.*аудитор|интересен.*широк|популяр|много.*люд|массов.*интерес|городск.*мероприят|культурн.*мероприят|празднич.*настроен/.test(basis);
    const broader=/проблем|тенденц|последств|доступ|безопас|неравен|социальн|общественн.*явлен|влияни|опыт.*групп|значени.*за предел|изменен|конфликт|дефицит|потребност|городск.*сред|культурн.*полит/.test(basis);

    if(shallow&&!broader)return false;
    return broader;
  }

  function touchesOpinion(value){
    return /разнообраз.*мнен|разн.*позици|контраст.*мнен|позици.*спикер/i.test(String(value||''));
  }

  function touchesSignificance(value){
    return /обществен.*значим|значимост|широк.*аудитор/i.test(String(value||''));
  }

  function ensureSentence(value){
    const text=String(value||'').trim();
    if(!text)return '';
    return /[.!?…]$/.test(text)?text:`${text}.`;
  }

  function rebuildFinalRecommendation(analysis){
    const checks=Array.isArray(analysis?.checks)?analysis.checks:[];
    const confirmed=checks
      .filter(check=>['problem','warning'].includes(check?.status)&&String(check?.recommendation||'').trim())
      .map(check=>ensureSentence(check.recommendation))
      .filter(Boolean)
      .filter((value,index,list)=>list.indexOf(value)===index)
      .slice(0,3);

    if(confirmed.length){
      analysis.finalRecommendation=confirmed.join(' ');
    }else if(checks.some(check=>check?.status==='unknown')){
      analysis.finalRecommendation='Перед сдачей проверьте вручную пункты, которые V-CHECK не смог определить автоматически.';
    }
  }

  function syncOverallStatus(analysis){
    if(!analysis?.overall||!Array.isArray(analysis?.checks))return;
    const hasCriticalProblem=analysis.checks.some(check=>check?.critical===true&&check?.status==='problem');
    const hasConcern=analysis.checks.some(check=>['problem','warning','unknown'].includes(check?.status));
    analysis.overall.status=hasCriticalProblem?'problem':(hasConcern?'warning':'ok');
  }

  function patchAnalysis(analysis,format){
    if(!analysis||typeof analysis!=='object'||!STORY_FORMATS.has(format))return analysis;

    const checks=Array.isArray(analysis.checks)?analysis.checks:[];
    let opinionUnknown=false;
    let significanceUnknown=false;

    for(const check of checks){
      if(
        isOpinionDiversityCheck(check)&&
        ['ok','warning'].includes(check?.status)&&
        !opinionEvidenceIsConcrete(check)
      ){
        opinionUnknown=true;
        check.status='unknown';
        check.evidence=[];
        check.finding='Недостаточно конкретных доказательств, чтобы надёжно оценить различие позиций спикеров.';
        check.recommendation='Проверить по готовому материалу, представлены ли действительно различающиеся позиции спикеров.';
      }

      if(
        isSignificanceCheck(check)&&
        check?.status==='ok'&&
        !significanceIsActuallySupported(check)
      ){
        significanceUnknown=true;
        check.status='unknown';
        check.evidence=[];
        check.finding='Интерес широкой аудитории или сам факт городского культурного события ещё не доказывают общественную значимость сюжета.';
        check.recommendation='Проверить и сформулировать общественно значимый ракурс: какое более широкое явление, проблему, тенденцию или опыт группы людей показывает сюжет.';
      }
    }

    if(Array.isArray(analysis.priorityFixes)){
      analysis.priorityFixes=analysis.priorityFixes.filter(item=>{
        const text=`${item?.problem||''} ${item?.why||''} ${item?.how||''}`;
        if(opinionUnknown&&touchesOpinion(text))return false;
        if(significanceUnknown&&touchesSignificance(text))return false;
        return true;
      });
    }

    if(Array.isArray(analysis.strengths)){
      analysis.strengths=analysis.strengths.filter(item=>{
        if(opinionUnknown&&touchesOpinion(item))return false;
        if(significanceUnknown&&touchesSignificance(item))return false;
        return true;
      });
    }

    if(typeof analysis?.overall?.summary==='string'){
      const cleaned=analysis.overall.summary
        .split(/(?<=[.!?])\s+/)
        .filter(sentence=>!(opinionUnknown&&touchesOpinion(sentence)))
        .filter(sentence=>!(significanceUnknown&&touchesSignificance(sentence)))
        .join(' ')
        .trim();
      if(cleaned)analysis.overall.summary=cleaned;
    }

    const review=Array.isArray(analysis.teacherReview)?analysis.teacherReview:[];
    for(const check of checks){
      if(check?.status!=='unknown')continue;
      const item=`Проверить вручную: ${String(check?.title||check?.id||'критерий')}`;
      if(!review.includes(item))review.push(item);
    }
    analysis.teacherReview=review;

    rebuildFinalRecommendation(analysis);
    syncOverallStatus(analysis);
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
      console.warn('V-CHECK story semantic guards skipped:',error);
      return response;
    }
  };

  console.log('V-CHECK story semantic guards v1.0 loaded');
})();
