const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
const MAX_FILE_BYTES=100*1024*1024;
const FORMAT_TYPES={
  article:'text',report_event:'text',report_theme:'text',interview:'text',profile:'text',factcheck:'text',
  story_event:'video',story_theme:'video',street:'video',hot:'video',live:'video',podcast:'audio'
};

const frame=document.getElementById('app');
frame.addEventListener('load',()=>{
  const w=frame.contentWindow,d=frame.contentDocument;
  const $=id=>d.getElementById(id);
  const originalCheck=w.check;
  let latestAiAnalysis=null;
  let latestFormalCount=0;
  let latestAiMeta=null;

  const tag=d.querySelector('.hero .tag');
  if(tag) tag.textContent='Сначала V‑CHECK. Потом — преподаватель.';

  const privacy=d.querySelector('.privacy div');
  if(privacy) privacy.innerHTML='<b>Проверка идёт в два слоя.</b><br>Формальные параметры проверяются автоматически. Текстовые материалы дополнительно читает YandexGPT по инструктажу выбранного формата. Итоговое решение остаётся за преподавателем.';

  const group=$('group');
  if(group) group.innerHTML='<option value="">— выберите группу —</option><option>Ж501-311</option><option>Ж502-311</option><option>Ж503-311</option>';

  const old=$('aiElement');
  if(old&&old.tagName==='SELECT'){
    const input=d.createElement('input');
    input.id='aiElement';
    input.type='text';
    input.autocomplete='off';
    old.replaceWith(input);
  }

  function setAiPlaceholder(){
    const el=$('aiElement'),fmt=$('format');
    if(!el||!fmt)return;
    const type=FORMAT_TYPES[fmt.value]||'video';
    el.placeholder=type==='text'
      ?'Например: инфографика по собственным данным, схема или таймлайн'
      :type==='audio'
        ?'Например: джингл, музыкальная перебивка или синтезированный голос'
        :'Например: музыкальная подложка, инфографика, схема или синтезированный голос';
  }
  setAiPlaceholder();
  $('format')?.addEventListener('change',setAiPlaceholder);

  const aiBox=d.querySelector('.ai-box');
  if(aiBox) aiBox.innerHTML='<b>Одна кнопка — две проверки</b>Формальные требования проверяются автоматически. Для всех текстовых форматов YandexGPT читает материал и сверяет его с инструктажем именно выбранного формата. Видео и аудио пока проходят формальную проверку; глубокий анализ медиа подключим через распознавание речи и визуальные наблюдения. Максимум файла — 100 МБ, максимум — 2 проверки в сутки.';

  const extraStyle=d.createElement('style');
  extraStyle.textContent=`
    #uploadStatus{display:none;margin-top:14px;border-radius:16px;padding:13px 15px;font-size:14px;line-height:1.45}
    #uploadStatus.info{display:block;background:#fff7f1;border:1px solid #f7c4aa;color:#7c2d12}
    #uploadStatus.ok{display:block;background:#f0fdf4;border:1px solid #bbf7d0;color:#14532d}
    #uploadStatus.error{display:block;background:#fff1f2;border:1px solid #fecdd3;color:#881337}
    #uploadStatus b{font-weight:850}
    button[data-uploading="1"]{opacity:.7;cursor:wait}
    #aiResult{border:1px solid #f1c2aa;background:linear-gradient(180deg,#fffdfa,#fff7f1);color:#1f2937;border-radius:20px;padding:20px;margin:14px 0;box-shadow:0 10px 30px rgba(12,12,12,.05)}
    #aiResult h3{margin:0;font-size:20px;color:#111827}
    #aiResult .ai-note{margin:5px 0 15px;color:#78716c;font-size:13px}
    #aiResult .ai-overall{padding:14px 15px;border-radius:15px;background:#fff;border:1px solid #f3d3c2;margin-bottom:12px}
    #aiResult .ai-overall b{display:block;margin-bottom:4px}
    #aiResult .ai-check{display:grid;grid-template-columns:minmax(180px,.8fr) 2fr;gap:15px;padding:14px 0;border-top:1px solid #f1e7df}
    #aiResult .ai-check:first-of-type{border-top:0}
    #aiResult .ai-left{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}
    #aiResult .ai-title{font-weight:800;color:#111827}
    #aiResult .ai-status{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:800;white-space:nowrap}
    #aiResult .ai-status.ok{background:#dcfce7;color:#166534}.ai-status.warning{background:#fef3c7;color:#92400e}.ai-status.problem{background:#ffe4e6;color:#9f1239}.ai-status.unknown{background:#e2e8f0;color:#475569}
    #aiResult .ai-finding{font-weight:650;color:#334155}
    #aiResult .ai-evidence,#aiResult .ai-rec{margin-top:6px;color:#64748b;font-size:13px;line-height:1.45}
    #aiResult .ai-rec{color:#9a3412}
    #aiResult .ai-panel{margin-top:14px;padding:14px 15px;border-radius:15px;background:#fff;border:1px solid #f2dfd4}
    #aiResult .ai-panel h4{margin:0 0 8px;color:#7c2d12}
    #aiResult .ai-panel ul,#aiResult .ai-panel ol{margin:0;padding-left:20px}
    #aiResult .ai-panel li{margin:6px 0}
    #aiResult .ai-final{margin-top:14px;padding:14px 15px;border-radius:15px;background:#0c0c0c;color:#fff}
    @media(max-width:680px){#aiResult .ai-check{grid-template-columns:1fr;gap:6px}}
  `;
  d.head.appendChild(extraStyle);

  const materialBox=$('materialBox');
  const uploadStatus=d.createElement('div');
  uploadStatus.id='uploadStatus';
  if(materialBox) materialBox.after(uploadStatus);

  function escapeHtml(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function cleanText(s){return String(s??'').replace(/\s+/g,' ').trim();}
  function setStatus(kind,html){uploadStatus.className=kind||'';uploadStatus.innerHTML=html||'';}

  function updateLimitCopy(){
    const hint=materialBox?.querySelector('.hint');
    if(hint&&hint.textContent.includes('400 МБ')) hint.textContent=hint.textContent.replace('400 МБ','100 МБ');
  }
  updateLimitCopy();
  if(materialBox){
    new MutationObserver(updateLimitCopy).observe(materialBox,{childList:true,subtree:true});
    materialBox.addEventListener('change',e=>{
      if(e.target?.id!=='materialFile')return;
      const file=e.target.files?.[0];
      if(!file){setStatus('','');return;}
      if(file.size>MAX_FILE_BYTES)setStatus('error','<b>Файл больше 100 МБ.</b> Такой файл не будет отправлен и не потратит попытку.');
      else setStatus('info',`Файл готов к проверке: <b>${(file.size/1048576).toFixed(1)} МБ</b>. Лимит — 100 МБ.`);
    });
  }

  async function callApi(payload){
    const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
    let raw={};
    try{raw=await response.json()}catch(_){throw new Error('Сервер вернул непонятный ответ. Попробуйте ещё раз.');}
    let data=raw;
    if(raw&&typeof raw.body==='string'){try{data=JSON.parse(raw.body)}catch(_){data=raw;}}
    return data;
  }

  async function releaseReservation(fullName,groupValue,reservationId,quotaDate){
    if(!reservationId||!quotaDate)return;
    try{await callApi({action:'cancelUpload',fullName,group:groupValue,reservationId,quotaDate});}catch(_){ }
  }

  async function extractText(file){
    if(!file)return '';
    if(/\.docx$/i.test(file.name)){
      const ab=await file.arrayBuffer();
      const r=await w.mammoth.extractRawText({arrayBuffer:ab});
      return String(r?.value||'').trim();
    }
    if(/\.(txt|md)$/i.test(file.name)||file.type==='text/plain')return (await file.text()).trim();
    return '';
  }

  function recalcFormalReport(){
    const bad=$('bad');
    if(!bad)return 0;
    const type=FORMAT_TYPES[$('format')?.value]||'';
    if(type==='text'){
      for(const li of [...bad.querySelectorAll('li')]){
        const m=(li.textContent||'').match(/Объём текста\s+(\d+)\s+знаков;\s+требуется\s+(\d+)[–-](\d+)/);
        if(m&&Number(m[1])>=Number(m[2]))li.remove();
      }
    }
    const remaining=[...bad.querySelectorAll('li')].length;
    const badTitle=bad.querySelector('b');
    if(badTitle)badTitle.textContent=`Не соблюдено · ${remaining}`;
    bad.style.display=remaining?'block':'none';
    const title=$('reportTitle');
    if(title)title.textContent=remaining?`Найдено формальных нарушений: ${remaining}`:'Формальных нарушений не найдено';
    const final=$('final');
    if(final)final.textContent=remaining?`Формальная проверка: ${remaining} нарушений. Ниже — содержательный вывод ИИ.`:'Формальные требования соблюдены. Ниже — содержательный вывод ИИ.';
    latestFormalCount=remaining;
    return remaining;
  }

  function aiLabel(status){return status==='ok'?'Соблюдено':status==='warning'?'Нужно внимание':status==='problem'?'Проблема':'Не удалось определить';}
  function normalizeStatus(s){s=String(s||'unknown').toLowerCase();return ['ok','warning','problem','unknown'].includes(s)?s:'unknown';}

  function normalizeAiChecks(analysis){
    if(!analysis||typeof analysis!=='object')return [];
    const source=analysis.checks ?? analysis;
    const skip=new Set(['overall','strengths','priorityFixes','teacherReview','finalRecommendation','editorialRisks','summary']);
    const entries=Array.isArray(source)?source.map((value,index)=>[String(index),value]):Object.entries(source||{});
    const rows=[];
    for(const [key,value] of entries){
      if(skip.has(key))continue;
      if(value&&typeof value==='object'&&!Array.isArray(value)){
        rows.push({
          key,
          title:cleanText(value.title||key),
          status:normalizeStatus(value.status),
          finding:cleanText(value.finding||value.comment||value.explanation||value.details||''),
          evidence:Array.isArray(value.evidence)?value.evidence.map(cleanText).filter(Boolean):value.evidence?[cleanText(value.evidence)]:value.found?(Array.isArray(value.found)?value.found.map(cleanText):[cleanText(value.found)]):[],
          recommendation:cleanText(value.recommendation||value.advice||value.fix||''),
          critical:Boolean(value.critical),
          scope:cleanText(value.scope||'content')
        });
      }
    }
    return rows;
  }

  function renderListPanel(box,title,items,ordered=false){
    if(!Array.isArray(items)||!items.length)return;
    const panel=d.createElement('div');panel.className='ai-panel';
    const tag=ordered?'ol':'ul';
    panel.innerHTML=`<h4>${escapeHtml(title)}</h4><${tag}>${items.map(item=>`<li>${escapeHtml(cleanText(typeof item==='string'?item:(item.problem||item.how||item.why||item.title||JSON.stringify(item))))}</li>`).join('')}</${tag}>`;
    box.appendChild(panel);
  }

  function renderAiAnalysis(analysis,formalCount,meta={}){
    const report=$('report'),final=$('final');
    if(!report||!analysis)return;
    latestAiAnalysis=analysis;
    latestAiMeta=meta;
    d.getElementById('aiResult')?.remove();
    const neutral=$('neutral');if(neutral)neutral.style.display='none';

    const box=d.createElement('div');box.id='aiResult';
    box.innerHTML=`<h3>Глубокий ИИ-анализ</h3><p class="ai-note">${escapeHtml(meta.formatTitle||'Выбранный формат')} · семантический разбор по инструктажу курса. ИИ не заменяет преподавателя.</p>`;

    const overall=analysis.overall;
    if(overall&&typeof overall==='object'){
      const ov=d.createElement('div');ov.className='ai-overall';
      ov.innerHTML=`<b>Общий вывод</b>${escapeHtml(cleanText(overall.summary||overall.finding||overall.comment||''))}`;
      box.appendChild(ov);
    }

    const rows=normalizeAiChecks(analysis);
    let okCount=0,warningCount=0,problemCount=0,unknownCount=0;
    for(const row of rows){
      if(row.status==='ok')okCount++;else if(row.status==='warning')warningCount++;else if(row.status==='problem')problemCount++;else unknownCount++;
      const el=d.createElement('div');el.className='ai-check';
      const ev=row.evidence.length?`<div class="ai-evidence"><b>Основание:</b> ${escapeHtml(row.evidence.join(' · '))}</div>`:'';
      const rec=row.recommendation?`<div class="ai-rec"><b>Что сделать:</b> ${escapeHtml(row.recommendation)}</div>`:'';
      const scope=row.scope&&row.scope!=='content'?`<div class="ai-evidence">Область проверки: ${escapeHtml(row.scope)}</div>`:'';
      el.innerHTML=`<div class="ai-left"><span class="ai-title">${escapeHtml(row.title)}</span><span class="ai-status ${row.status}">${aiLabel(row.status)}</span></div><div><div class="ai-finding">${escapeHtml(row.finding||'')}</div>${ev}${rec}${scope}</div>`;
      box.appendChild(el);
    }

    renderListPanel(box,'Сильные стороны',analysis.strengths,false);
    renderListPanel(box,'Что исправить в первую очередь',analysis.priorityFixes,true);
    renderListPanel(box,'Что должен проверить преподаватель',analysis.teacherReview,false);

    if(cleanText(analysis.finalRecommendation||'')){
      const rec=d.createElement('div');rec.className='ai-final';
      rec.innerHTML=`<b>Рекомендация перед сдачей</b><br>${escapeHtml(cleanText(analysis.finalRecommendation))}`;
      box.appendChild(rec);
    }

    if(final)final.before(box);else report.appendChild(box);
    if(final){
      const parts=[];if(okCount)parts.push(`${okCount} соблюдено`);if(warningCount)parts.push(`${warningCount} требуют внимания`);if(problemCount)parts.push(`${problemCount} проблем`);if(unknownCount)parts.push(`${unknownCount} не определено`);
      final.textContent=`Формальная проверка: ${formalCount} ${formalCount===1?'нарушение':'нарушений'}. ИИ: ${parts.join(', ')||'анализ завершён'}.`;
    }
  }

  const form=$('form');
  const submitButton=form?.querySelector('button[type="submit"]');
  let uploading=false;

  form?.addEventListener('submit',async e=>{
    e.preventDefault();e.stopImmediatePropagation();if(uploading)return;
    latestAiAnalysis=null;latestAiMeta=null;
    const fullName=$('name')?.value.trim()||'';
    const groupValue=$('group')?.value||'';
    const formatValue=$('format')?.value||'';
    const mediaType=FORMAT_TYPES[formatValue]||'';
    const file=$('materialFile')?.files?.[0];

    if(typeof originalCheck==='function')originalCheck();
    const formalCount=recalcFormalReport();

    if(fullName.length<4){setStatus('error','<b>Укажите имя и фамилию.</b>');return;}
    if(!groupValue){setStatus('error','<b>Выберите группу.</b>');return;}
    if(!formatValue){setStatus('error','<b>Выберите формат материала.</b>');return;}
    if(!file){setStatus('error','<b>Загрузите готовый материал.</b>');return;}
    if(file.size>MAX_FILE_BYTES){setStatus('error','<b>Файл больше 100 МБ.</b> Он не отправлен и попытка не потрачена.');return;}

    uploading=true;
    if(submitButton){submitButton.disabled=true;submitButton.dataset.uploading='1';submitButton.dataset.oldText=submitButton.textContent;submitButton.textContent='Подготавливаем проверку…';}
    let reservationId='',quotaDate='',uploaded=false;

    try{
      const contentType=file.type||'application/octet-stream';
      setStatus('info','<b>Подготавливаем защищённую загрузку…</b>');
      const created=await callApi({action:'createUpload',fullName,group:groupValue,fileName:file.name,fileSize:file.size,contentType});
      if(!created?.ok){
        if(created?.error==='daily_limit'){setStatus('error','<b>На сегодня использованы обе проверки.</b> Новые попытки будут доступны после 00:00 по Москве.');return;}
        if(created?.error==='file_too_large'){setStatus('error','<b>Файл больше 100 МБ.</b> Он не отправлен и попытка не потрачена.');return;}
        throw new Error(created?.message||'Не удалось подготовить загрузку.');
      }

      reservationId=created.reservationId;quotaDate=created.quotaDate;
      if(submitButton)submitButton.textContent='Загружаем файл…';
      setStatus('info',`<b>Загружаем ${escapeHtml(file.name)}</b> во временное защищённое хранилище…`);
      const putResponse=await fetch(created.uploadUrl,{method:'PUT',headers:created.uploadHeaders||{'Content-Type':contentType},body:file});
      if(!putResponse.ok)throw new Error(`Хранилище вернуло ошибку ${putResponse.status}.`);
      uploaded=true;

      if(mediaType==='text'){
        if(submitButton)submitButton.textContent='ИИ анализирует материал…';
        setStatus('info','<b>Файл загружен. YandexGPT читает материал и сверяет его с инструктажем выбранного формата…</b> Это может занять 10–30 секунд.');
        const text=await extractText(file);
        if(!text)throw new Error('Не удалось извлечь текст из файла. Для текстовой ИИ-проверки сейчас используйте DOCX, TXT или MD.');
        const ai=await callApi({
          action:'analyzeMaterial',
          format:formatValue,
          text,
          annotation:$('annotation')?.value||'',
          significance:$('significance')?.value||'',
          aiElement:$('aiElement')?.value||'',
          aiPlace:$('aiPlace')?.value||''
        });
        if(!ai?.ok)throw new Error(ai?.message||'ИИ-анализ не завершён.');
        renderAiAnalysis(ai.analysis||{},formalCount,{format:ai.format||formatValue,formatTitle:ai.formatTitle||'',mediaType:ai.mediaType||mediaType});
      }else{
        const neutral=$('neutral');
        if(neutral){
          neutral.style.display='block';
          neutral.innerHTML='<b>Глубокий анализ этого медиа ещё не выполнен.</b><br>Файл загружен и формальные параметры проверены. Для полноценного анализа аудио/видео V-CHECK ещё нужно подключить распознавание речи, а для видео — визуальные наблюдения. Система не будет выдумывать то, чего не смогла увидеть или услышать.';
        }
      }

      const remaining=Number.isFinite(created.remainingToday)?created.remainingToday:null;
      if(mediaType==='text'){
        setStatus('ok',remaining===null?'<b>Проверка завершена.</b> Формальный и глубокий ИИ-отчёт готовы.':`<b>Проверка завершена.</b> Формальный и глубокий ИИ-отчёт готовы. На сегодня осталось проверок: <b>${remaining}</b>.`);
      }else{
        setStatus('ok',remaining===null?'<b>Формальная проверка завершена.</b> Глубокий анализ медиа подключим следующим этапом.':`<b>Формальная проверка завершена.</b> На сегодня осталось проверок: <b>${remaining}</b>.`);
      }
    }catch(err){
      if(!uploaded&&reservationId)await releaseReservation(fullName,groupValue,reservationId,quotaDate);
      setStatus('error',`<b>Проверка не завершена.</b> ${escapeHtml(err?.message||'Попробуйте ещё раз.')}${!uploaded?' Попытка возвращена.':''}`);
    }finally{
      uploading=false;
      if(submitButton){submitButton.disabled=false;delete submitButton.dataset.uploading;submitButton.textContent=submitButton.dataset.oldText||'Проверить материал';delete submitButton.dataset.oldText;}
    }
  },true);

  function listText(selector){return [...d.querySelectorAll(selector)].map(el=>cleanText(el.textContent)).filter(Boolean);}
  function statusColor(status){return status==='ok'?'#166534':status==='warning'?'#92400e':status==='problem'?'#9f1239':'#475569';}

  function buildPdfDefinition(){
    if(!window.pdfMake)throw new Error('Модуль PDF не загрузился. Обновите страницу и попробуйте ещё раз.');
    const title=cleanText($('reportTitle')?.textContent||'Результат V-CHECK');
    const meta=cleanText($('reportMeta')?.textContent||'');
    const badItems=listText('#bad li');
    const goodItems=listText('#good li');
    const rows=normalizeAiChecks(latestAiAnalysis||{});
    const overall=latestAiAnalysis?.overall;
    const strengths=Array.isArray(latestAiAnalysis?.strengths)?latestAiAnalysis.strengths:[];
    const fixes=Array.isArray(latestAiAnalysis?.priorityFixes)?latestAiAnalysis.priorityFixes:[];
    const teacherReview=Array.isArray(latestAiAnalysis?.teacherReview)?latestAiAnalysis.teacherReview:[];
    const finalRecommendation=cleanText(latestAiAnalysis?.finalRecommendation||'');

    const content=[
      {text:'MMT V-CHECK',style:'brand'},
      {text:'Отчёт по проверке материала',style:'kicker'},
      {text:title,style:'h1'},
      {text:meta,style:'meta',margin:[0,0,0,14]},
      {text:'Формальная проверка',style:'h2'}
    ];

    if(badItems.length){
      content.push({text:'Требует исправления',style:'badHead',margin:[0,7,0,4]});
      content.push({ul:badItems.map(x=>({text:x,color:'#9f1239'})),margin:[8,0,0,8]});
    }else content.push({text:'Формальных нарушений не найдено.',color:'#166534',bold:true,margin:[0,6,0,10]});

    if(goodItems.length){
      content.push({text:'Соблюдено',style:'goodHead',margin:[0,7,0,4]});
      content.push({ul:goodItems.map(x=>({text:x,color:'#166534'})),margin:[8,0,0,12]});
    }

    if(latestAiAnalysis){
      const formatTitle=latestAiMeta?.formatTitle||'';
      content.push({text:'Глубокий ИИ-анализ'+(formatTitle?` · ${formatTitle}`:''),style:'h2',margin:[0,10,0,6]});
      content.push({text:'Содержательный анализ носит рекомендательный характер и не заменяет решение преподавателя.',style:'meta',margin:[0,0,0,8]});
      if(overall&&typeof overall==='object'&&cleanText(overall.summary||overall.finding||overall.comment)){
        content.push({table:{widths:['*'],body:[[{text:[{text:'Общий вывод\n',bold:true},{text:cleanText(overall.summary||overall.finding||overall.comment)}],fillColor:'#fff7ed',color:'#7c2d12',margin:9}]]},layout:'noBorders',margin:[0,0,0,8]});
      }
      for(const row of rows){
        const pieces=[];
        if(row.finding)pieces.push(row.finding);
        if(row.evidence.length)pieces.push('Основание: '+row.evidence.join(' · '));
        if(row.recommendation)pieces.push('Что сделать: '+row.recommendation);
        content.push({table:{widths:[125,'*'],body:[[
          {stack:[{text:row.title,bold:true},{text:aiLabel(row.status),fontSize:8,bold:true,color:statusColor(row.status),margin:[0,4,0,0]}],fillColor:'#fafafa',margin:7},
          {text:pieces.join('\n'),margin:7,color:'#334155'}
        ]]},layout:{hLineColor:()=> '#e5e7eb',vLineColor:()=> '#e5e7eb',hLineWidth:()=>0.5,vLineWidth:()=>0.5},margin:[0,0,0,6]});
      }
      if(strengths.length){
        content.push({text:'Сильные стороны',style:'h3',margin:[0,10,0,4]});
        content.push({ul:strengths.map(x=>cleanText(x)),margin:[8,0,0,8]});
      }
      if(fixes.length){
        content.push({text:'Что исправить в первую очередь',style:'h3',margin:[0,9,0,4]});
        content.push({ol:fixes.map(x=>{
          if(typeof x==='string')return cleanText(x);
          const parts=[x.problem,x.why?`Почему: ${x.why}`:'',x.how?`Как: ${x.how}`:''].map(cleanText).filter(Boolean);
          return parts.join('\n');
        }),margin:[8,0,0,10]});
      }
      if(teacherReview.length){
        content.push({text:'Что должен проверить преподаватель',style:'h3',margin:[0,9,0,4]});
        content.push({ul:teacherReview.map(x=>cleanText(x)),margin:[8,0,0,10]});
      }
      if(finalRecommendation){
        content.push({table:{widths:['*'],body:[[{text:[{text:'Рекомендация перед сдачей\n',bold:true},{text:finalRecommendation}],fillColor:'#0c0c0c',color:'#ffffff',margin:9}]]},layout:'noBorders',margin:[0,6,0,8]});
      }
    }

    const finalText=cleanText($('final')?.textContent||'');
    if(finalText)content.push({text:finalText,style:'final',margin:[0,12,0,0]});
    content.push({text:'Результаты V-CHECK носят рекомендательный характер и не заменяют оценку преподавателя.',style:'foot',margin:[0,16,0,0]});

    return {
      pageSize:'A4',pageMargins:[42,42,42,46],
      content,
      defaultStyle:{font:'Roboto',fontSize:9.5,color:'#1f2937',lineHeight:1.25},
      styles:{
        brand:{fontSize:11,bold:true,color:'#e77946',characterSpacing:1.2},
        kicker:{fontSize:8,color:'#94a3b8',margin:[0,3,0,10]},
        h1:{fontSize:21,bold:true,color:'#111827',margin:[0,0,0,5]},
        h2:{fontSize:14,bold:true,color:'#111827',margin:[0,4,0,4]},
        h3:{fontSize:11,bold:true,color:'#111827'},
        meta:{fontSize:8,color:'#64748b'},
        badHead:{fontSize:10,bold:true,color:'#9f1239'},
        goodHead:{fontSize:10,bold:true,color:'#166534'},
        final:{fontSize:10,bold:true,color:'#111827',background:'#fff7ed',margin:[8,8,8,8]},
        foot:{fontSize:7.5,color:'#94a3b8'}
      },
      footer:(current,pageCount)=>({text:`MMT V-CHECK · ${current}/${pageCount}`,alignment:'right',fontSize:7,color:'#94a3b8',margin:[0,10,42,0]})
    };
  }

  function getPdfBlob(){
    return new Promise((resolve,reject)=>{
      try{
        window.pdfMake.createPdf(buildPdfDefinition()).getBlob(blob=>{
          if(!blob||blob.size<1000)return reject(new Error('PDF получился пустым. Обновите страницу и повторите проверку.'));
          resolve(blob);
        });
      }catch(e){reject(e);}
    });
  }

  async function downloadPdf(){
    const blob=await getPdfBlob();
    const url=URL.createObjectURL(blob);
    try{
      const a=document.createElement('a');
      a.href=url;
      a.download='MMT-V-CHECK.pdf';
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }finally{
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }
  }

  $('pdf')?.addEventListener('click',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const btn=$('pdf'),old=btn?.textContent;
    try{
      if(btn){btn.disabled=true;btn.textContent='Готовим PDF…';}
      await downloadPdf();
    }catch(err){
      alert(`Не удалось создать PDF: ${err?.message||'неизвестная ошибка'}`);
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old||'Скачать PDF';}
    }
  },true);

  $('share')?.addEventListener('click',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    try{
      const blob=await getPdfBlob();
      const file=new File([blob],'MMT-V-CHECK.pdf',{type:'application/pdf'});
      if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({title:'MMT V-CHECK',text:'Результат проверки материала',files:[file]});
      else if(navigator.share)await navigator.share({title:'MMT V-CHECK',text:w.reportText||'Результат проверки материала'});
      else alert('На этом устройстве системная отправка недоступна. Скачайте PDF и отправьте его вручную.');
    }catch(err){if(err?.name!=='AbortError')alert(`Не удалось поделиться отчётом: ${err?.message||'неизвестная ошибка'}`);}
  },true);

  form?.addEventListener('reset',()=>setTimeout(()=>{
    setStatus('','');latestAiAnalysis=null;latestAiMeta=null;latestFormalCount=0;d.getElementById('aiResult')?.remove();
    const neutral=$('neutral');if(neutral)neutral.style.display='block';
  },0));
});
