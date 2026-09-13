(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';

  if(window.__VCHECK_REPORT_CONSISTENCY_V1__)return;
  window.__VCHECK_REPORT_CONSISTENCY_V1__='1.3';

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

  function fullTextOfCheck(check){
    return [
      check?.id,
      check?.title,
      check?.finding,
      ...(Array.isArray(check?.evidence)?check.evidence:[]),
      check?.recommendation
    ].map(value=>String(value||'')).join(' ').toLowerCase();
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

  function voiceoverCountCheck(speechRoles){
    const count=Number(speechRoles?.voiceoverWordCount);
    const available=
      speechRoles &&
      Number.isFinite(count) &&
      Number(speechRoles?.classifiedSegments||0)>0;

    if(!available){
      return {
        id:'voiceoverWordCount',
        title:'250–330 слов закадрового текста',
        status:'unknown',
        finding:'Не удалось надёжно выделить закадровый текст журналиста и посчитать его объём.',
        evidence:[],
        recommendation:'Проверить объём закадрового текста по готовому материалу вручную.'
      };
    }

    if(count>=250&&count<=330){
      return {
        id:'voiceoverWordCount',
        title:'250–330 слов закадрового текста',
        status:'ok',
        finding:`Автоматически выделено ${count} слов закадрового текста.`,
        evidence:[`Карта ролей речи отнесла к закадровому тексту ${count} слов.`],
        recommendation:''
      };
    }

    return {
      id:'voiceoverWordCount',
      title:'250–330 слов закадрового текста',
      status:'warning',
      finding:`Автоматически выделено ${count} слов закадрового текста — это вне ориентира 250–330 слов.`,
      evidence:[`Карта ролей речи отнесла к закадровому тексту ${count} слов.`],
      recommendation:count<250?'Добавить содержательный закадровый текст до ориентира 250–330 слов.':'Сократить закадровый текст до ориентира 250–330 слов.'
    };
  }

  function patchAnalysis(analysis){
    if(!analysis||typeof analysis!=='object')return analysis;

    const vision=window.VCHECK_VIDEO_VISION||{};
    const targeted=window.__VCHECK_RESPONDENT_TARGETING__||{};
    const durationAnalysis=window.__VCHECK_ANSWER_DURATION__||null;
    const speechRoles=window.__VCHECK_SPEECH_ROLE_ANALYSIS__||null;
    const format=String(document.getElementById('format')?.value||'');
    const checks=Array.isArray(analysis.checks)?analysis.checks:[];
    const respondentCount=
      Number.isInteger(targeted?.confirmedRespondentCount)
        ?targeted.confirmedRespondentCount
        :(Number.isInteger(vision?.confirmedRespondentCount)?vision.confirmedRespondentCount:null);

    const syncCount=Number(speechRoles?.syncCount);
    const differentSyncSpeakers=Number(speechRoles?.confirmedDifferentSyncSpeakers);
    const speechRolesAvailable=
      !!speechRoles &&
      Number.isFinite(syncCount) &&
      Number(speechRoles?.classifiedSegments||0)>0;

    for(const check of checks){
      const identity=textOfCheck(check);
      const fullText=fullTextOfCheck(check);

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

      const isSyncCountCheck=
        /синхрон|sync/.test(identity) &&
        /колич|минимум|три|3|count|number/.test(identity);

      if(isSyncCountCheck&&speechRolesAvailable){
        if(syncCount>=3&&differentSyncSpeakers>=3){
          check.status='ok';
          check.finding=`Подтверждено минимум ${syncCount} синхрона от разных спикеров.`;
          check.recommendation='';
          check.evidence=[
            `Карта ролей речи выделила ${syncCount} синхрона.`,
            `Подтверждено разных групп спикеров: ${differentSyncSpeakers}.`
          ];
        }else{
          check.status='unknown';
          check.finding='Карта ролей речи пока не дала достаточного подтверждения минимум трёх синхронов от разных спикеров.';
          check.evidence=[
            `Автоматически выделено синхронов: ${Number.isFinite(syncCount)?syncCount:0}.`,
            `Разных подтверждённых групп спикеров: ${Number.isFinite(differentSyncSpeakers)?differentSyncSpeakers:0}.`
          ];
          check.recommendation='Проверить число синхронов и разных спикеров по готовому материалу.';
        }
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

      const isChronology=/хронолог|chronolog/.test(identity);
      const chronologyWasPollutedByDuration=
        isChronology &&
        /хронометраж|длитель|duration|180\s*(сек|second)|минимальн.*180|162\s*(сек|second)/.test(fullText);

      if(chronologyWasPollutedByDuration){
        check.status='unknown';
        check.finding='Хронометраж материала оценивается отдельным требованием и сам по себе не доказывает нарушение хронологии события.';
        check.evidence=[];
        check.recommendation='Оценить последовательность развития события отдельно от общей длительности ролика.';
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

    if(format==='story_event'||format==='story_theme'){
      const voiceoverPatch=voiceoverCountCheck(speechRoles);
      const voiceoverIndex=checks.findIndex(check=>{
        const identity=textOfCheck(check);
        return /закадр|voiceover/.test(identity)&&/250|330|слов|word|объ[её]м|колич/.test(identity);
      });
      if(voiceoverIndex>=0){
        checks[voiceoverIndex]={...checks[voiceoverIndex],...voiceoverPatch};
      }else{
        checks.push(voiceoverPatch);
      }
    }

    const opinionCheck=checks.find(check=>{
      const identity=textOfCheck(check);
      return /разн.*позици|разнообраз.*мнен|different.*position|opinion.*divers/.test(identity);
    });

    const montageDialogueCheck=checks.find(check=>{
      const identity=textOfCheck(check);
      return /монтаж|сопостав|разговор между|alternation/.test(identity);
    });

    if(
      opinionCheck &&
      montageDialogueCheck &&
      opinionCheck.status!=='ok' &&
      montageDialogueCheck.status==='ok'
    ){
      if(opinionCheck.status==='unknown'){
        montageDialogueCheck.status='unknown';
        montageDialogueCheck.finding='Нельзя надёжно подтвердить разговор между позициями, пока сами различающиеся позиции не подтверждены.';
        montageDialogueCheck.recommendation='Проверить монтаж и наличие действительно различающихся позиций вручную по готовому материалу.';
      }else{
        montageDialogueCheck.status='warning';
        montageDialogueCheck.finding='Чередование интервью и дополнительных планов подтверждено, но заметно различающиеся позиции не подтверждены.';
        montageDialogueCheck.recommendation='Если задача — создать разговор между позициями, усилить различия между выбранными ответами или перестроить их сопоставление.';
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
      const filtered=analysis.teacherReview.filter(item=>{
        const text=String(item||'');
        if(vision?.standupConfirmed===true && /стендап/i.test(text))return false;
        if(vision?.cutawaysConfirmed===true && /перебив/i.test(text))return false;
        if(Number.isInteger(respondentCount)&&respondentCount>=8&&/респондент/i.test(text)&&/(колич|минимум|восем|8)/i.test(text))return false;
        if(speechRolesAvailable&&syncCount>=3&&differentSyncSpeakers>=3&&/синхрон/i.test(text)&&/(колич|минимум|три|3)/i.test(text))return false;
        if(speechRoles&&Number.isFinite(Number(speechRoles.voiceoverWordCount))&&Number(speechRoles.classifiedSegments||0)>0&&/закадр/i.test(text)&&/(250|330|слов|объ[её]м|колич)/i.test(text))return false;
        if(durationAnalysis?.available&&/ответ/i.test(text)&&(/8\s*[–—-]?\s*15/.test(text)||/длитель.*ответ|ответ.*секунд/i.test(text)))return false;
        return true;
      });

      let respondentDiversitySeen=false;
      analysis.teacherReview=filtered.filter(item=>{
        const text=String(item||'');
        const isRespondentDiversity=
          /респондент/i.test(text) &&
          /(возраст|пол\b|тип\s+аудитор|разнообраз)/i.test(text);

        if(!isRespondentDiversity)return true;
        if(respondentDiversitySeen)return false;
        respondentDiversitySeen=true;
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

  console.log('V-CHECK report consistency v1.3 loaded');
})();
