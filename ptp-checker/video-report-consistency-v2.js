// V-CHECK report consistency v2: hard guards for story checks and unsupported recommendations.
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

  function isSyncCountCheck(check){
    const text=textOf(check);
    return /синхрон|sync/.test(text)&&/колич|минимум|три|3|count|number/.test(text);
  }

  function isOpinionDiversityCheck(check){
    const text=textOf(check);
    return /разн.*позици|разнообраз.*мнен|разнообраз.*позици|different.*position|opinion.*divers/.test(text);
  }

  function isDurationCheck(check){
    return /хронометраж|duration/.test(textOf(check));
  }

  function isVoiceoverWordsCheck(check){
    const text=textOf(check);
    return /250.*330|закадр.*слов|слов.*закадр|voiceover.*word/.test(text);
  }

  function issueText(item){
    if(typeof item==='string')return item.split(/\s+[—–-]\s+/)[0].toLowerCase();
    if(item&&typeof item==='object'){
      return [item.issue,item.title,item.problem,item.name].map(v=>String(v||'')).join(' ').toLowerCase();
    }
    return '';
  }

  function normalizeReviewKey(value){
    const text=String(value||'').toLowerCase().replace(/ё/g,'е');
    if(/синхрон/.test(text)&&/(три|3|колич|разн.*спик)/.test(text))return 'sync_count';
    if(/разн.*позици|разнообраз.*мнен/.test(text))return 'opinion_diversity';
    if(/обществен.*значим|значимост/.test(text))return 'significance';
    if(/закадр.*слов|слов.*закадр|250.*330/.test(text))return 'voiceover_words';
    if(/хронометраж|duration/.test(text))return 'duration';
    return text
      .replace(/^необходимо\s+/,'')
      .replace(/^проверить\s+вручную:\s*/,'')
      .replace(/^проверить\s+/,'')
      .replace(/[«»"'`.,:;!?()—–-]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function dedupeStrings(items){
    const seen=new Set();
    return items.filter(item=>{
      const key=normalizeReviewKey(item);
      if(!key||seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }

  function ensureDurationCheck(analysis,format,body){
    if(!STORY_FORMATS.has(format))return;
    const duration=Number(body?.durationSeconds);
    if(!Number.isFinite(duration)||duration<=0)return;

    const checks=Array.isArray(analysis.checks)?analysis.checks:(analysis.checks=[]);
    let check=checks.find(isDurationCheck);
    if(!check){
      check={
        id:'duration',
        title:'Хронометраж',
        status:'unknown',
        critical:true,
        finding:'',
        evidence:[],
        recommendation:'',
        scope:'metadata'
      };
      checks.push(check);
    }

    const min=180;
    const max=300;
    const rounded=Math.round(duration);

    if(duration<min){
      check.status='problem';
      check.critical=true;
      check.finding=`Хронометраж ниже обязательного минимума: ${rounded} сек. при требовании ${min}–${max} сек.`;
      check.evidence=[`Фактическая длительность видео: ${rounded} секунд.`];
      check.recommendation=`Увеличить сюжет минимум до ${min} секунд содержательным материалом, не растягивая эпизоды искусственно.`;
    }else if(duration>max){
      check.status='problem';
      check.critical=true;
      check.finding=`Хронометраж выше допустимого максимума: ${rounded} сек. при требовании ${min}–${max} сек.`;
      check.evidence=[`Фактическая длительность видео: ${rounded} секунд.`];
      check.recommendation=`Сократить сюжет до ${max} секунд без потери обязательных элементов.`;
    }else{
      check.status='ok';
      check.critical=true;
      check.finding=`Хронометраж соответствует требованию: ${rounded} сек.`;
      check.evidence=[`Фактическая длительность видео: ${rounded} секунд.`];
      check.recommendation='';
    }
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

  function patchOverallSummary(analysis,syncUnknown){
    if(!syncUnknown||typeof analysis?.overall?.summary!=='string')return;
    const cleaned=analysis.overall.summary
      .split(/(?<=[.!?])\s+/)
      .filter(sentence=>!/недостат.*синхрон|количеств.*синхрон|добав.*синхрон|разнообраз.*позици/i.test(sentence))
      .join(' ')
      .trim();
    if(cleaned)analysis.overall.summary=cleaned;
  }

  function syncOverallStatus(analysis){
    if(!analysis?.overall||!Array.isArray(analysis?.checks))return;
    const hasCriticalProblem=analysis.checks.some(check=>check?.critical===true&&check?.status==='problem');
    const hasConcern=analysis.checks.some(check=>['problem','warning','unknown'].includes(check?.status));
    analysis.overall.status=hasCriticalProblem?'problem':(hasConcern?'warning':'ok');
  }

  function patchAnalysis(analysis,format,body){
    if(!analysis||typeof analysis!=='object'||!STORY_FORMATS.has(format))return analysis;

    const checks=Array.isArray(analysis.checks)?analysis.checks:(analysis.checks=[]);
    ensureDurationCheck(analysis,format,body);

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

    const syncConfirmed=reliableRoles&&syncCount>=3&&differentSpeakers>=3;
    let syncUnknown=!syncConfirmed;
    let opinionUnknown=false;
    let voiceoverUnknown=false;

    for(const check of checks){
      if(isSyncCountCheck(check)){
        if(syncConfirmed){
          check.status='ok';
          check.finding='Подтверждены минимум три синхрона от разных спикеров.';
          check.evidence=[
            `Карта ролей речи выделила синхронов: ${syncCount}.`,
            `Подтверждено разных групп спикеров: ${differentSpeakers}.`
          ];
          check.recommendation='';
        }else{
          check.status='unknown';
          check.finding='Недостаточно структурированных данных, чтобы надёжно подтвердить минимум три синхрона от разных спикеров.';
          check.evidence=reliableRoles?[
            `Автоматически выделено синхронов: ${syncCount}.`,
            `Разных подтверждённых групп спикеров: ${differentSpeakers}.`
          ]:[];
          check.recommendation='Проверить количество синхронов и число разных спикеров по готовому материалу.';
        }
      }

      if(isOpinionDiversityCheck(check)&&syncUnknown){
        opinionUnknown=true;
        check.status='unknown';
        check.evidence=[];
        check.finding='Недостаточно подтверждённых синхронов от разных спикеров для надёжной оценки разнообразия позиций.';
        check.recommendation='Проверить, представлены ли в готовом материале действительно различающиеся позиции спикеров.';
      }

      if(isVoiceoverWordsCheck(check)&&syncUnknown){
        voiceoverUnknown=true;
        check.status='unknown';
        check.evidence=[];
        check.finding='Точный объём закадрового текста пока нельзя считать надёжным: модуль ролей речи не подтвердил достаточное число синхронов и может относить часть речи героев к закадру.';
        check.recommendation='Проверить объём именно журналистского закадрового текста вручную после уточнения синхронов.';
      }
    }

    if(Array.isArray(analysis.priorityFixes)){
      analysis.priorityFixes=analysis.priorityFixes.filter(item=>{
        const issue=issueText(item);
        if(syncUnknown&&/синхрон|колич.*спикер|колич.*респондент/.test(issue))return false;
        if(opinionUnknown&&/разнообраз|позици|мнен/.test(issue))return false;
        if(voiceoverUnknown&&/закадр|250|330/.test(issue))return false;
        return true;
      });
    }

    patchOverallSummary(analysis,syncUnknown);
    analysis.checks=checks;
    syncTeacherReviewWithUnknowns(analysis);
    syncOverallStatus(analysis);
    rebuildFinalRecommendation(analysis);
    return analysis;
  }

  function patchPayload(payload,format,body){
    if(!payload||typeof payload!=='object')return payload;

    if(typeof payload.body==='string'){
      try{
        const inner=JSON.parse(payload.body);
        if(inner?.analysis)inner.analysis=patchAnalysis(inner.analysis,format,body);
        return {...payload,body:JSON.stringify(inner)};
      }catch(_){
        return payload;
      }
    }

    if(payload?.analysis){
      return {...payload,analysis:patchAnalysis(payload.analysis,format,body)};
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
