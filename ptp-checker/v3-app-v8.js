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

  const tag=d.querySelector('.hero .tag');
  if(tag) tag.textContent='Сначала V‑CHECK. Потом — преподаватель.';

  const privacy=d.querySelector('.privacy div');
  if(privacy) privacy.innerHTML='<b>Проверка идёт в два слоя.</b><br>Формальные параметры проверяются автоматически. Для содержательного ИИ-анализа текст временно обрабатывается сервисами Yandex Cloud. Итоговое решение остаётся за преподавателем.';

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
  if(aiBox) aiBox.innerHTML='<b>Одна кнопка — две проверки</b>Формальные требования проверяются автоматически. Для «Статьи / лонгрида» YandexGPT читает текст и делает содержательный редакторский разбор. Максимум файла — 100 МБ, максимум — 2 проверки в сутки.';

  const extraStyle=d.createElement('style');
  extraStyle.textContent=`
    #uploadStatus{display:none;margin-top:14px;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.45}
    #uploadStatus.info{display:block;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a}
    #uploadStatus.ok{display:block;background:#f0fdf4;border:1px solid #bbf7d0;color:#14532d}
    #uploadStatus.error{display:block;background:#fff1f2;border:1px solid #fecdd3;color:#881337}
    #uploadStatus b{font-weight:850}
    button[data-uploading="1"]{opacity:.7;cursor:wait}
    #aiResult{border:1px solid #fed7aa;background:linear-gradient(180deg,#fffaf7,#fff7ed);color:#1f2937;border-radius:18px;padding:18px;margin:12px 0}
    #aiResult h3{margin:0;font-size:19px;color:#111827}
    #aiResult .ai-note{margin:5px 0 14px;color:#78716c;font-size:13px}
    #aiResult .ai-overall{padding:13px 14px;border-radius:14px;background:#fff;border:1px solid #fed7aa;margin-bottom:12px}
    #aiResult .ai-overall b{display:block;margin-bottom:3px}
    #aiResult .ai-check{display:grid;grid-template-columns:minmax(170px,.75fr) 2fr;gap:14px;padding:13px 0;border-top:1px solid #f1e7df}
    #aiResult .ai-check:first-of-type{border-top:0}
    #aiResult .ai-left{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}
    #aiResult .ai-title{font-weight:800;color:#111827}
    #aiResult .ai-status{display:inline-flex;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:800;white-space:nowrap}
    #aiResult .ai-status.ok{background:#dcfce7;color:#166534}.ai-status.warning{background:#fef3c7;color:#92400e}.ai-status.problem{background:#ffe4e6;color:#9f1239}.ai-status.unknown{background:#e2e8f0;color:#475569}
    #aiResult .ai-finding{font-weight:650;color:#334155}
    #aiResult .ai-evidence,#aiResult .ai-rec{margin-top:5px;color:#64748b;font-size:13px}
    #aiResult .ai-rec{color:#9a3412}
    #aiResult .ai-priority{margin-top:14px;padding:13px 14px;border-radius:14px;background:#fff;border:1px solid #fde68a}
    #aiResult .ai-priority h4{margin:0 0 7px;color:#854d0e}
    #aiResult .ai-priority ul{margin:0;padding-left:18px}
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
    const source=analysis.checks&&typeof analysis.checks==='object'?analysis.checks:analysis;
    const skip=new Set(['overall','strengths','priorityFixes','teacherReview','finalRecommendation','editorialRisks','summary']);
    const rows=[];
    for(const [key,value] of Object.entries(source)){
      if(skip.has(key))continue;
      if(value&&typeof value==='object'&&!Array.isArray(value)){
        rows.push({
          key,
          title:cleanText(value.title||key),
          status:normalizeStatus(value.status),
          finding:cleanText(value.finding||value.comment||value.explanation||value.details||''),
          evidence:Array.isArray(value.evidence)?value.evidence.map(cleanText).filter(Boolean):value.evidence?[cleanText(value.evidence)]:value.found?(Array.isArray(value.found)?value.found.map(cleanText):[cleanText(value.found)]):[],
          recommendation:cleanText(value.recommendation||value.advice||value.fix||'')
        });
      }
    }
    return rows;
  }

  function renderAiAnalysis(analysis,formalCount){
    const report=$('report'),final=$('final');
    if(!report||!analysis)return;
    latestAiAnalysis=analysis;
    d.getElementById('aiResult')?.remove();
    const neutral=$('neutral');if(neutral)neutral.style.display='none';

    const box=d.createElement('div');box.id='aiResult';
    box.innerHTML='<h3>Глубокий ИИ-анализ</h3><p class="ai-note">Семантический разбор содержания, логики и журналистских требований. ИИ не заменяет преподавателя.</p>';

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
      el.innerHTML=`<div class="ai-left"><span class="ai-title">${escapeHtml(row.title)}</span><span class="ai-status ${row.status}">${aiLabel(row.status)}</span></div><div><div class="ai-finding">${escapeHtml(row.finding||'')}</div>${ev}${rec}</div>`;
      box.appendChild(el);
    }

    const fixes=Array.isArray(analysis.priorityFixes)?analysis.priorityFixes:[];
    if(fixes.length){
      const pr=d.createElement('div');pr.className='ai-priority';
      pr.innerHTML='<h4>Что исправить в первую очередь</h4><ul>'+fixes.map(x=>`<li>${escapeHtml(cleanText(typeof x==='string'?x:(x.problem||x.title||x.how||x.recommendation||JSON.stringify(x))))}</li>`).join('')+'</ul>';
      box.appendChild(pr);
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
    latestAiAnalysis=null;
    const fullName=$('name')?.value.trim()||'';
    const groupValue=$('group')?.value||'';
    const formatValue=$('format')?.value||'';
    const file=$('materialFile')?.files?.[0];

    if(typeof originalCheck==='function')originalCheck();
    const formalCount=recalcFormalReport();

    if(fullName.length<4){setStatus('error','<b>Укажите имя и фамилию.</b>');return;}
    if(!groupValue){setStatus('error','<b>Выберите группу.</b>');return;}
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

      if(formatValue==='article'){
        if(submitButton)submitButton.textContent='ИИ анализирует материал…';
        setStatus('info','<b>Файл загружен. YandexGPT читает статью и делает глубокий содержательный разбор…</b>');
        const text=await extractText(file);
        if(!text)throw new Error('Не удалось извлечь текст из файла для ИИ-проверки.');
        const ai=await callApi({
          action:'analyzeText',
          text,
          format:formatValue,
          annotation:$('annotation')?.value||'',
          significance:$('significance')?.value||'',
          aiElement:$('aiElement')?.value||'',
          aiPlace:$('aiPlace')?.value||''
        });
        if(!ai?.ok)throw new Error(ai?.message||'ИИ-анализ не завершён.');
        renderAiAnalysis(ai.analysis||{},formalCount);
      }else{
        const neutral=$('neutral');
        if(neutral&&FORMAT_TYPES[formatValue]==='text')neutral.innerHTML='<b>Содержательный ИИ-анализ этого формата ещё подключается.</b><br>Сейчас глубокая смысловая проверка настроена для «Статья / лонгрид».';
      }

      const remaining=Number.isFinite(created.remainingToday)?created.remainingToday:null;
      setStatus('ok',remaining===null?'<b>Проверка завершена.</b> Результат собран в отчёте.':`<b>Проверка завершена.</b> На сегодня осталось проверок: <b>${remaining}</b>.`);
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
    const fixes=Array.isArray(latestAiAnalysis?.priorityFixes)?latestAiAnalysis.priorityFixes:[];

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
      content.push({text:'Глубокий ИИ-анализ',style:'h2',margin:[0,10,0,6]});
      content.push({text:'Содержательный анализ носит рекомендательный характер и не заменяет решение преподавателя.',style:'meta',margin:[0,0,0,8]});
      if(overall&&typeof overall==='object'&&cleanText(overall.summary||overall.finding||overall.comment)){
        content.push({table:{widths:['*'],body:[[{text:'Общий вывод\n'+cleanText(overall.summary||overall.finding||overall.comment),fillColor:'#fff7ed',color:'#7c2d12',margin:8,bold:false}]]},layout:'noBorders',margin:[0,0,0,8]});
      }
      for(const row of rows){
        const pieces=[];
        if(row.finding)pieces.push(row.finding);
        if(row.evidence.length)pieces.push('Основание: '+row.evidence.join(' · '));
        if(row.recommendation)pieces.push('Что сделать: '+row.recommendation);
        content.push({table:{widths:[120,'*'],body:[[
          {stack:[{text:row.title,bold:true},{text:aiLabel(row.status),fontSize:8,bold:true,color:statusColor(row.status),margin:[0,4,0,0]}],fillColor:'#fafafa',margin:7},
          {text:pieces.join('\n'),margin:7,color:'#334155'}
        ]]},layout:{hLineColor:()=> '#e5e7eb',vLineColor:()=> '#e5e7eb',hLineWidth:()=>0.5,vLineWidth:()=>0.5},margin:[0,0,0,6]});
      }
      if(fixes.length){
        content.push({text:'Что исправить в первую очередь',style:'h3',margin:[0,9,0,4]});
        content.push({ol:fixes.map(x=>cleanText(typeof x==='string'?x:(x.problem||x.title||x.how||x.recommendation||JSON.stringify(x)))),margin:[8,0,0,10]});
      }
    }

    content.push({text:cleanText($('final')?.textContent||''),style:'final',margin:[0,12,0,0]});
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
        final:{fontSize:10,bold:true,color:'#ffffff',background:'#111827',margin:[8,8,8,8]},
        foot:{fontSize:7.5,color:'#94a3b8'}
      },
      footer:(current,pageCount)=>({text:`MMT V-CHECK · ${current}/${pageCount}`,alignment:'right',fontSize:7,color:'#94a3b8',margin:[0,10,42,0]})
    };
  }

  function getPdfBlob(){
    return new Promise((resolve,reject)=>{
      try{window.pdfMake.createPdf(buildPdfDefinition()).getBlob(resolve);}catch(e){reject(e);}
    });
  }

  $('pdf')?.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const btn=$('pdf'),old=btn?.textContent;
    try{
      if(btn){btn.disabled=true;btn.textContent='Готовим PDF…';}
      window.pdfMake.createPdf(buildPdfDefinition()).download('MMT-V-CHECK.pdf',()=>{if(btn){btn.disabled=false;btn.textContent=old||'Скачать PDF';}});
    }catch(err){
      if(btn){btn.disabled=false;btn.textContent=old||'Скачать PDF';}
      alert(`Не удалось создать PDF: ${err?.message||'неизвестная ошибка'}`);
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
    setStatus('','');latestAiAnalysis=null;latestFormalCount=0;d.getElementById('aiResult')?.remove();
    const neutral=$('neutral');if(neutral)neutral.style.display='block';
  },0));
});
