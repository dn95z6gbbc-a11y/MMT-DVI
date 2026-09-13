// V-CHECK report consistency v2: hard guards for story duration, sync evidence and unsupported recommendations.
(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS=new Set(['story_event','story_theme']);

  if(window.__VCHECK_REPORT_CONSISTENCY_V2__)return;
  window.__VCHECK_REPORT_CONSISTENCY_V2__='2.2';

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

  function fullCheckText(check){
    return [
      check?.id,
      check?.title,
      check?.finding,
      ...(Array.isArray(check?.evidence)?check.evidence:[])
    ].map(value=>String(value||'')).join(' ').toLowerCase();
  }

  function isSyncCountCheck(check){
    const text=textOf(check);
    return /синхрон|sync/.test(text)&&/колич|минимум|три|3|count|number/.test(text);
  }

  function isOpinionDiversityCheck(check){
    const text=textOf(check);
    return /разн.*позици|разнообраз.*мнен|разнообраз.*позици|different.*position|opinion.*divers/.test(text);
  }

  function isDurationCheck(check){
    const text=textOf(check);
    return /хронометраж|длитель|duration|timing/.test(text);
  }

  function isSignificanceCheck(check){
    const text=textOf(check);
    return /обществен.*значим|значимост|significance/.test(text);
  }

  function issueText(item){
    if(typeof item==='string')return item.split(/\s+[—–-]\s+/)[0].toLowerCase();
    if(item&&typeof item==='object'){
      return [item.issue,item.title,item.problem,item.name,item.why,item.how]
        .map(v=>String(v||''))
        .join(' ')
        .toLowerCase();
    }
    return '';
  }

  function dedupeStrings(items){
    const seen=new Set();
    return items.filter(item=>{
      const key=String(item||'').trim().toLowerCase()
        .replace(/^проверить\s+вручную:\s*/,'')
        .replace(/^проверить\s+/,'');
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

  function scrubUnsupportedSummary(analysis,{syncUnknown,durationProblem}){
    if(!analysis?.overall||typeof analysis.overall.summary!=='string')return;

    let parts=analysis.overall.summary
      .split(/(?<=[.!?])\s+/)
      .map(part=>part.trim())
      .filter(Boolean);

    if(syncUnknown){
      parts=parts.filter(part=>{
        const text=part.toLowerCase();
        return !(
          /синхрон/.test(text)&&
          /недостат|не хватает|мало|добавить|основн.*замечан/.test(text)
        );
      });
    }

    if(durationProblem&&!parts.some(part=>/хронометраж|длитель/.test(part.toLowerCase()))){
      parts.push('Подтверждено несоответствие обязательному хронометражу сюжета.');
    }

    analysis.overall.summary=parts.join(' ').trim();
  }

  function patchAnalysis(analysis,format,request){
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

    const durationSeconds=Number(request?.durationSeconds);
    const hasDuration=Number.isFinite(durationSeconds)&&durationSeconds>0;
    const minDuration=180;
    const maxDuration=300;
    const durationProblem=hasDuration&&(durationSeconds<minDuration||durationSeconds>maxDuration);

    let syncUnknown=false;
    let opinionUnknown=false;
    let significanceUnknown=false;

    for(const check of checks){
      if(isDurationCheck(check)&&hasDuration){
        if(durationSeconds<minDuration){
          check.status='problem';
          check.finding='Хронометраж не соответствует требованиям формата.';
          check.evidence=[`Длительность видео составляет ${Math.round(durationSeconds)} секунд, минимум — ${minDuration} секунд.`];
          check.recommendation=`Увеличить длительность сюжета минимум до ${minDuration} секунд.`;
        }else if(durationSeconds>maxDuration){
          check.status='problem';
          check.finding='Хронометраж не соответствует требованиям формата.';
          check.evidence=[`Длительность видео составляет ${Math.round(durationSeconds)} секунд, максимум — ${maxDuration} секунд.`];
          check.recommendation=`Сократить длительность сюжета до ${maxDuration} секунд или меньше.`;
        }else{
          check.status='ok';
          check.finding='Хронометраж соответствует требованиям формата.';
          check.evidence=[`Длительность видео составляет ${Math.round(durationSeconds)} секунд; допустимый диапазон — ${minDuration}–${maxDuration} секунд.`];
          check.recommendation='';
        }
      }

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

      if(isOpinionDiversityCheck(check)){
        // Если сама карта речи не подтверждает хотя бы двух разных
        // говорящих, нельзя делать вывод, что позиции одинаковые или разные.
        if(!reliableRoles||syncCount<2||differentSpeakers<2){
          opinionUnknown=true;
          check.status='unknown';
          check.evidence=[];
          check.finding='Недостаточно подтверждённых синхронов от разных спикеров для надёжной оценки разнообразия позиций.';
          check.recommendation='Проверить, представлены ли в готовом материале действительно различающиеся позиции спикеров.';
        }else if(check?.status==='unknown'){
          opinionUnknown=true;
          check.finding=String(check.finding||'Недостаточно данных для надёжной оценки разнообразия позиций.');
          check.recommendation='Проверить, представлены ли в готовом материале действительно различающиеся позиции спикеров.';
        }
      }

      if(isSignificanceCheck(check)&&check?.status==='ok'){
        const basis=fullCheckText(check);
        const broadBasis=/проблем|тенденц|последств|влияни|изменен|доступ|безопас|неравен|социальн|общественн.*явлен|значени.*за предел|опыт.*групп|городск.*сред|культурн.*политик/.test(basis);
        const weakBasis=/много людей|привлекает|праздничн|мероприят|концерт|фестивал|культурн.*событ|проходит в городе|городск.*событ/.test(basis);

        if(weakBasis&&!broadBasis){
          significanceUnknown=true;
          check.status='unknown';
          check.evidence=[];
          check.finding='Сам факт проведения городского культурного события и интерес аудитории ещё не доказывают общественную значимость сюжета.';
          check.recommendation='Проверить и сформулировать общественно значимый ракурс: какое более широкое явление, проблему или опыт показывает этот сюжет.';
        }
      }
    }

    if(Array.isArray(analysis.strengths)&&durationProblem){
      analysis.strengths=analysis.strengths.filter(item=>!/хронометраж|длитель/.test(String(item||'').toLowerCase()));
    }

    if(Array.isArray(analysis.priorityFixes)){
      analysis.priorityFixes=analysis.priorityFixes.filter(item=>{
        const issue=issueText(item);
        if(syncUnknown&&/синхрон|колич.*спикер|колич.*респондент/.test(issue))return false;
        if(opinionUnknown&&/разнообраз|позици|мнен/.test(issue))return false;
        if(significanceUnknown&&/значимост|обществен/.test(issue))return false;
        return true;
      });
    }

    analysis.checks=checks;
    scrubUnsupportedSummary(analysis,{syncUnknown,durationProblem});
    syncTeacherReviewWithUnknowns(analysis);
    rebuildFinalRecommendation(analysis);

    if(analysis.overall){
      const hasCriticalProblem=checks.some(check=>check?.critical===true&&check?.status==='problem');
      const hasProblem=checks.some(check=>check?.status==='problem');
      const hasConcern=checks.some(check=>['warning','unknown'].includes(check?.status));
      analysis.overall.status=hasCriticalProblem||hasProblem?'problem':(hasConcern?'warning':'ok');
    }

    return analysis;
  }

  function patchPayload(payload,format,request){
    if(!payload||typeof payload!=='object')return payload;

    if(typeof payload.body==='string'){
      try{
        const inner=JSON.parse(payload.body);
        if(inner?.analysis)inner.analysis=patchAnalysis(inner.analysis,format,request);
        return {...payload,body:JSON.stringify(inner)};
      }catch(_){
        return payload;
      }
    }

    if(payload?.analysis){
      return {...payload,analysis:patchAnalysis(payload.analysis,format,request)};
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
      const patched=patchPayload(raw,format,body);
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

  console.log('V-CHECK report consistency v2.2 loaded');
})();
