const VCHECK_AUDIO_API='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
const VCHECK_AUDIO_MAX=100*1024*1024;

const vcheckFrame=document.getElementById('app');
vcheckFrame.addEventListener('load',()=>{
  const w=vcheckFrame.contentWindow;
  const d=vcheckFrame.contentDocument;
  const $=id=>d.getElementById(id);
  const form=$('form');
  const submitButton=form?.querySelector('button[type="submit"]');
  let busy=false;
  let audioState=null;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();

  function statusBox(){return d.getElementById('uploadStatus');}
  function setStatus(kind,html){
    const box=statusBox();
    if(!box)return;
    box.className=kind||'';
    box.innerHTML=html||'';
  }

  async function api(payload){
    const response=await fetch(VCHECK_AUDIO_API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      cache:'no-store'
    });
    let raw={};
    try{raw=await response.json();}
    catch(_){throw new Error('Сервер вернул непонятный ответ. Попробуйте ещё раз.');}
    if(raw&&typeof raw.body==='string'){
      try{return JSON.parse(raw.body);}catch(_){return raw;}
    }
    return raw;
  }

  async function release(fullName,group,reservationId,quotaDate){
    if(!reservationId||!quotaDate)return;
    try{await api({action:'cancelUpload',fullName,group,reservationId,quotaDate});}catch(_){ }
  }

  function formalCount(){
    return [...d.querySelectorAll('#bad li')].length;
  }

  function aiLabel(status){
    return status==='ok'?'Соблюдено':status==='warning'?'Нужно внимание':status==='problem'?'Проблема':'Не удалось определить';
  }

  function checksOf(analysis){
    return Array.isArray(analysis?.checks)?analysis.checks:[];
  }

  function teacherItems(analysis){
    const fromUnknown=checksOf(analysis)
      .filter(x=>String(x?.status||'').toLowerCase()==='unknown')
      .map(x=>`Проверить вручную: ${clean(x?.title||'пункт')}`);
    const other=Array.isArray(analysis?.teacherReview)?analysis.teacherReview.map(clean).filter(Boolean):[];
    const result=[];
    const seen=new Set();
    for(const item of [...fromUnknown,...other]){
      const key=item.toLowerCase()
        .replace(/^проверить вручную:\s*/,'')
        .replace(/^необходимо\s+/,'')
        .replace(/^нужно\s+/,'')
        .replace(/^требуется\s+/,'')
        .replace(/[«»"'.,:;!?()]/g,'')
        .replace(/\s+/g,' ')
        .trim();
      if(!key||seen.has(key))continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  function renderAudioAnalysis(result){
    const analysis=result.analysis||{};
    audioState={result,analysis,formalCount:formalCount()};
    d.getElementById('aiResult')?.remove();
    const neutral=$('neutral');
    if(neutral)neutral.style.display='none';

    const report=$('report');
    const final=$('final');
    if(!report)return;
    report.style.display='block';

    const box=d.createElement('div');
    box.id='aiResult';
    box.innerHTML=`<h3>Глубокий ИИ-анализ</h3><p class="ai-note">Подкаст · SpeechKit + YandexGPT · ИИ не заменяет преподавателя.</p>`;

    const overall=analysis.overall;
    if(overall&&clean(overall.summary||overall.finding||overall.comment)){
      const el=d.createElement('div');
      el.className='ai-overall';
      el.innerHTML=`<b>Общий вывод</b>${esc(clean(overall.summary||overall.finding||overall.comment))}`;
      box.appendChild(el);
    }

    let ok=0,warning=0,problem=0,unknown=0;
    for(const check of checksOf(analysis)){
      const status=['ok','warning','problem','unknown'].includes(String(check?.status||'').toLowerCase())?String(check.status).toLowerCase():'unknown';
      if(status==='ok')ok++;else if(status==='warning')warning++;else if(status==='problem')problem++;else unknown++;
      const evidence=Array.isArray(check?.evidence)?check.evidence.map(clean).filter(Boolean):[];
      const el=d.createElement('div');
      el.className='ai-check';
      el.innerHTML=`<div class="ai-left"><span class="ai-title">${esc(clean(check?.title||'Проверка'))}</span><span class="ai-status ${status}">${aiLabel(status)}</span></div><div><div class="ai-finding">${esc(clean(check?.finding||''))}</div>${evidence.length?`<div class="ai-evidence"><b>Основание:</b> ${esc(evidence.join(' · '))}</div>`:''}${clean(check?.recommendation)?`<div class="ai-rec"><b>Что сделать:</b> ${esc(clean(check.recommendation))}</div>`:''}${check?.scope&&check.scope!=='content'?`<div class="ai-evidence">Область проверки: ${esc(clean(check.scope))}</div>`:''}</div>`;
      box.appendChild(el);
    }

    function panel(title,items,ordered=false){
      if(!Array.isArray(items)||!items.length)return;
      const el=d.createElement('div');
      el.className='ai-panel';
      const tag=ordered?'ol':'ul';
      el.innerHTML=`<h4>${esc(title)}</h4><${tag}>${items.map(item=>`<li>${esc(clean(typeof item==='string'?item:(item?.problem||item?.how||item?.why||item?.title||'')))}</li>`).join('')}</${tag}>`;
      box.appendChild(el);
    }

    panel('Сильные стороны',analysis.strengths,false);
    panel('Что исправить в первую очередь',analysis.priorityFixes,true);
    panel('Что должен проверить преподаватель',teacherItems(analysis),false);

    if(clean(analysis.finalRecommendation)){
      const el=d.createElement('div');
      el.className='ai-final';
      el.innerHTML=`<b>Рекомендация перед сдачей</b><br>${esc(clean(analysis.finalRecommendation))}`;
      box.appendChild(el);
    }

    if(final)final.before(box);else report.appendChild(box);
    if(final){
      const parts=[];
      if(ok)parts.push(`${ok} соблюдено`);
      if(warning)parts.push(`${warning} требуют внимания`);
      if(problem)parts.push(`${problem} проблем`);
      if(unknown)parts.push(`${unknown} не определено`);
      final.textContent=`Формальная проверка: ${audioState.formalCount} ${audioState.formalCount===1?'нарушение':'нарушений'}. ИИ: ${parts.join(', ')||'анализ завершён'}.`;
    }
    report.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function audioReportText(){
    if(!audioState)return '';
    const a=audioState.analysis;
    const lines=['MMT V-CHECK','Подкаст · глубокий ИИ-анализ',''];
    const overall=clean(a?.overall?.summary||a?.overall?.finding||'');
    if(overall)lines.push('ОБЩИЙ ВЫВОД',overall,'');
    for(const c of checksOf(a)){
      lines.push(`${clean(c.title||'Проверка')} — ${aiLabel(String(c.status||'unknown').toLowerCase())}`);
      if(clean(c.finding))lines.push(clean(c.finding));
      if(Array.isArray(c.evidence)&&c.evidence.length)lines.push('Основание: '+c.evidence.map(clean).filter(Boolean).join(' · '));
      if(clean(c.recommendation))lines.push('Что сделать: '+clean(c.recommendation));
      lines.push('');
    }
    const teachers=teacherItems(a);
    if(teachers.length)lines.push('ПРОВЕРИТЬ ПРЕПОДАВАТЕЛЮ',...teachers.map(x=>'— '+x),'');
    if(clean(a.finalRecommendation))lines.push('РЕКОМЕНДАЦИЯ ПЕРЕД СДАЧЕЙ',clean(a.finalRecommendation));
    return lines.join('\n');
  }

  function buildAudioPdf(){
    if(!window.pdfMake)throw new Error('Модуль PDF не загрузился. Обновите страницу.');
    const a=audioState.analysis;
    const content=[
      {text:'MMT V-CHECK',fontSize:11,bold:true,color:'#e77946'},
      {text:'Отчёт по проверке подкаста',fontSize:20,bold:true,margin:[0,8,0,4]},
      {text:clean($('reportMeta')?.textContent||''),fontSize:8,color:'#64748b',margin:[0,0,0,14]}
    ];
    const overall=clean(a?.overall?.summary||a?.overall?.finding||'');
    if(overall)content.push({text:[{text:'Общий вывод\n',bold:true},{text:overall}],fillColor:'#fff7ed',color:'#7c2d12',margin:[8,8,8,10]});
    for(const c of checksOf(a)){
      const status=String(c?.status||'unknown').toLowerCase();
      const pieces=[clean(c?.finding||'')];
      if(Array.isArray(c?.evidence)&&c.evidence.length)pieces.push('Основание: '+c.evidence.map(clean).filter(Boolean).join(' · '));
      if(clean(c?.recommendation))pieces.push('Что сделать: '+clean(c.recommendation));
      content.push({table:{widths:[125,'*'],body:[[
        {stack:[{text:clean(c?.title||'Проверка'),bold:true},{text:aiLabel(status),fontSize:8,margin:[0,4,0,0]}],fillColor:'#fafafa',margin:7},
        {text:pieces.filter(Boolean).join('\n'),margin:7,color:'#334155'}
      ]]},layout:{hLineColor:()=> '#e5e7eb',vLineColor:()=> '#e5e7eb',hLineWidth:()=>0.5,vLineWidth:()=>0.5},margin:[0,0,0,6]});
    }
    const teachers=teacherItems(a);
    if(teachers.length){
      content.push({text:'Что должен проверить преподаватель',fontSize:11,bold:true,margin:[0,10,0,4]});
      content.push({ul:teachers,margin:[8,0,0,10]});
    }
    if(clean(a.finalRecommendation))content.push({text:[{text:'Рекомендация перед сдачей\n',bold:true},{text:clean(a.finalRecommendation)}],fillColor:'#0c0c0c',color:'#fff',margin:[8,8,8,8]});
    content.push({text:'Результаты V-CHECK носят рекомендательный характер и не заменяют оценку преподавателя.',fontSize:7.5,color:'#94a3b8',margin:[0,16,0,0]});
    return {pageSize:'A4',pageMargins:[42,42,42,46],content,defaultStyle:{font:'Roboto',fontSize:9.5,color:'#1f2937',lineHeight:1.25}};
  }

  function audioPdfBlob(){
    return new Promise((resolve,reject)=>{
      try{window.pdfMake.createPdf(buildAudioPdf()).getBlob(blob=>blob&&blob.size>1000?resolve(blob):reject(new Error('PDF получился пустым.')));}
      catch(error){reject(error);}
    });
  }

  form?.addEventListener('submit',async event=>{
    if($('format')?.value!=='podcast')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(busy)return;

    const fullName=$('name')?.value.trim()||'';
    const group=$('group')?.value||'';
    const file=$('materialFile')?.files?.[0];
    if(fullName.length<4){setStatus('error','<b>Укажите имя и фамилию.</b>');return;}
    if(!group){setStatus('error','<b>Выберите группу.</b>');return;}
    if(!file){setStatus('error','<b>Загрузите готовый подкаст.</b>');return;}
    if(file.size>VCHECK_AUDIO_MAX){setStatus('error','<b>Файл больше 100 МБ.</b> Он не отправлен и попытка не потрачена.');return;}
    if(!/\.(mp3|wav)$/i.test(file.name)){setStatus('error','<b>Подкаст должен быть в MP3 или WAV.</b> Файл не отправлен и попытка не потрачена.');return;}

    audioState=null;
    if(typeof w.check==='function')w.check();
    busy=true;
    let reservationId='',quotaDate='',uploaded=false;
    const originalText=submitButton?.textContent||'Проверить материал';
    if(submitButton){submitButton.disabled=true;submitButton.dataset.uploading='1';}

    try{
      const contentType=file.type||(/\.wav$/i.test(file.name)?'audio/wav':'audio/mpeg');
      if(submitButton)submitButton.textContent='Подготавливаем проверку…';
      setStatus('info','<b>Подготавливаем защищённую загрузку…</b>');
      const created=await api({action:'createUpload',fullName,group,fileName:file.name,fileSize:file.size,contentType});
      if(!created?.ok){
        if(created?.error==='daily_limit')throw new Error('На сегодня использованы обе проверки. Новые попытки будут доступны после 00:00 по Москве.');
        throw new Error(created?.message||'Не удалось подготовить загрузку.');
      }
      reservationId=created.reservationId||'';
      quotaDate=created.quotaDate||'';

      if(submitButton)submitButton.textContent='Загружаем файл…';
      setStatus('info',`<b>Загружаем ${esc(file.name)}</b> во временное защищённое хранилище…`);
      const put=await fetch(created.uploadUrl,{method:'PUT',headers:created.uploadHeaders||{'Content-Type':contentType},body:file});
      if(!put.ok)throw new Error(`Хранилище вернуло ошибку ${put.status}.`);
      uploaded=true;

      if(submitButton)submitButton.textContent='Запускаем расшифровку…';
      setStatus('info','<b>Файл загружен. SpeechKit распознаёт речь.</b><br>После расшифровки YandexGPT автоматически проанализирует содержание. Это может занять несколько минут.');
      const started=await api({action:'startTranscription',objectKey:created.objectKey,fileName:file.name,contentType});
      if(!started?.ok)throw new Error(started?.message||'SpeechKit не смог запустить расшифровку.');
      if(!started?.operationId)throw new Error('SpeechKit не вернул номер операции.');

      let result=null;
      const deadline=Date.now()+15*60*1000;
      while(Date.now()<deadline){
        if(submitButton)submitButton.textContent='Распознаём речь и анализируем…';
        const current=await api({
          action:'getTranscription',
          operationId:started.operationId,
          format:'podcast',
          annotation:$('annotation')?.value||'',
          significance:$('significance')?.value||'',
          aiElement:$('aiElement')?.value||'',
          aiPlace:$('aiPlace')?.value||''
        });
        if(!current?.ok)throw new Error(current?.message||'Не удалось получить расшифровку.');
        if(current.transcriptionReady){result=current;break;}
        await sleep(5000);
      }
      if(!result)throw new Error('Расшифровка заняла больше 15 минут. Попробуйте повторить проверку позже.');
      if(!result.transcript)throw new Error('SpeechKit завершил работу, но не вернул расшифровку.');

      if(!result.ai||!result.analysis){
        if(submitButton)submitButton.textContent='ИИ анализирует материал…';
        setStatus('info','<b>Расшифровка готова. YandexGPT анализирует содержание подкаста…</b>');
        const ai=await api({
          action:'analyzeMaterial',
          format:'podcast',
          transcript:result.transcript,
          durationSeconds:result.durationSeconds,
          audioObservations:result.audioObservations||{durationSeconds:result.durationSeconds},
          annotation:$('annotation')?.value||'',
          significance:$('significance')?.value||'',
          aiElement:$('aiElement')?.value||'',
          aiPlace:$('aiPlace')?.value||''
        });
        if(!ai?.ok)throw new Error(ai?.message||'ИИ-анализ подкаста не завершён.');
        result={...result,...ai};
      }

      renderAudioAnalysis(result);
      const remaining=Number.isFinite(created.remainingToday)?created.remainingToday:null;
      setStatus('ok',remaining===null?'<b>Проверка завершена.</b> Расшифровка и глубокий ИИ-отчёт готовы.':`<b>Проверка завершена.</b> Расшифровка и глубокий ИИ-отчёт готовы. На сегодня осталось проверок: <b>${remaining}</b>.`);
    }catch(error){
      if(!uploaded&&reservationId)await release(fullName,group,reservationId,quotaDate);
      setStatus('error',`<b>Проверка не завершена.</b> ${esc(error?.message||'Попробуйте ещё раз.')}${!uploaded?' Попытка возвращена.':''}`);
    }finally{
      busy=false;
      if(submitButton){submitButton.disabled=false;delete submitButton.dataset.uploading;submitButton.textContent=originalText;}
    }
  },true);

  $('copy')?.addEventListener('click',async event=>{
    if(!audioState)return;
    event.preventDefault();event.stopImmediatePropagation();
    await navigator.clipboard.writeText(audioReportText());
    const btn=$('copy'),old=btn?.textContent;
    if(btn){btn.textContent='Скопировано';setTimeout(()=>btn.textContent=old||'Скопировать',1300);}
  },true);

  $('pdf')?.addEventListener('click',async event=>{
    if(!audioState)return;
    event.preventDefault();event.stopImmediatePropagation();
    const btn=$('pdf'),old=btn?.textContent;
    try{
      if(btn){btn.disabled=true;btn.textContent='Готовим PDF…';}
      const blob=await audioPdfBlob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='MMT-V-CHECK-podcast.pdf';a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
    }catch(error){alert(`Не удалось создать PDF: ${error?.message||'неизвестная ошибка'}`);}
    finally{if(btn){btn.disabled=false;btn.textContent=old||'Скачать PDF';}}
  },true);

  $('share')?.addEventListener('click',async event=>{
    if(!audioState)return;
    event.preventDefault();event.stopImmediatePropagation();
    try{
      const blob=await audioPdfBlob();
      const file=new File([blob],'MMT-V-CHECK-podcast.pdf',{type:'application/pdf'});
      if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({title:'MMT V-CHECK',text:'Результат проверки подкаста',files:[file]});
      else if(navigator.share)await navigator.share({title:'MMT V-CHECK',text:audioReportText()});
      else{await navigator.clipboard.writeText(audioReportText());alert('Отчёт скопирован. Его можно вставить в Telegram.');}
    }catch(error){if(error?.name!=='AbortError')alert(`Не удалось поделиться отчётом: ${error?.message||'неизвестная ошибка'}`);}
  },true);

  form?.addEventListener('reset',()=>{audioState=null;});
});