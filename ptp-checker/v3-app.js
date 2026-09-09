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
  if(aiBox) aiBox.innerHTML='<b>Одна кнопка — две проверки</b>Формальные требования проверяются автоматически. Для формата «Статья / лонгрид» YandexGPT также читает текст и делает содержательный разбор. Максимум файла — 100 МБ, максимум — 2 проверки в сутки.';

  const extraStyle=d.createElement('style');
  extraStyle.textContent=`
    #uploadStatus{display:none;margin-top:14px;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.45}
    #uploadStatus.info{display:block;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a}
    #uploadStatus.ok{display:block;background:#f0fdf4;border:1px solid #bbf7d0;color:#14532d}
    #uploadStatus.error{display:block;background:#fff1f2;border:1px solid #fecdd3;color:#881337}
    #uploadStatus b{font-weight:850}
    button[data-uploading="1"]{opacity:.7;cursor:wait}
    #aiResult{border:1px solid #c7d2fe;background:#eef2ff;color:#312e81;border-radius:17px;padding:16px 18px;margin:10px 0}
    #aiResult h3{margin:0 0 5px;font-size:18px}
    #aiResult .ai-note{margin:0 0 10px;color:#4f46e5;font-size:13px}
    #aiResult ul{margin:8px 0;padding-left:20px}
    #aiResult li{margin:9px 0}
    .ai-ok{color:#166534}.ai-warning{color:#854d0e}.ai-problem{color:#9f1239}.ai-unknown{color:#475569}
    .ai-detail{display:block;margin-top:2px;font-weight:400;color:#475569}
  `;
  d.head.appendChild(extraStyle);

  const materialBox=$('materialBox');
  const uploadStatus=d.createElement('div');
  uploadStatus.id='uploadStatus';
  if(materialBox) materialBox.after(uploadStatus);

  function escapeHtml(s){
    return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function setStatus(kind,html){
    uploadStatus.className=kind||'';
    uploadStatus.innerHTML=html||'';
  }

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
      if(file.size>MAX_FILE_BYTES){
        setStatus('error','<b>Файл больше 100 МБ.</b> Сожмите его и выберите заново. Такой файл не будет отправлен и не потратит попытку.');
      }else{
        setStatus('info',`Файл готов к проверке: <b>${(file.size/1048576).toFixed(1)} МБ</b>. Лимит — 100 МБ.`);
      }
    });
  }

  async function callApi(payload){
    const response=await fetch(API_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      cache:'no-store'
    });
    let raw={};
    try{raw=await response.json()}catch(_){throw new Error('Сервер вернул непонятный ответ. Попробуйте ещё раз.');}
    let data=raw;
    if(raw&&typeof raw.body==='string'){
      try{data=JSON.parse(raw.body)}catch(_){data=raw;}
    }
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
    if(/\.(txt|md)$/i.test(file.name)||file.type==='text/plain') return (await file.text()).trim();
    return '';
  }

  function recalcFormalReport(){
    const bad=$('bad');
    if(!bad)return 0;

    const type=FORMAT_TYPES[$('format')?.value]||'';
    const items=[...bad.querySelectorAll('li')];

    // Для текстовых форматов превышение рекомендуемого объёма не считаем нарушением.
    if(type==='text'){
      for(const li of items){
        const text=li.textContent||'';
        const m=text.match(/Объём текста\s+(\d+)\s+знаков;\s+требуется\s+(\d+)[–-](\d+)/);
        if(m&&Number(m[1])>=Number(m[2])) li.remove();
      }
    }

    const remaining=[...bad.querySelectorAll('li')].length;
    const badTitle=bad.querySelector('b');
    if(badTitle) badTitle.textContent=`Не соблюдено · ${remaining}`;
    bad.style.display=remaining?'block':'none';

    const title=$('reportTitle');
    if(title) title.textContent=remaining?`Найдено формальных нарушений: ${remaining}`:'Формальных нарушений не найдено';

    const final=$('final');
    if(final) final.textContent=remaining
      ?`Формальная проверка: ${remaining} нарушений. Ниже — отдельный содержательный вывод ИИ.`
      :'Формальные требования соблюдены. Ниже — отдельный содержательный вывод ИИ.';

    return remaining;
  }

  function aiLabel(status){
    return status==='ok'?'Соблюдено':status==='warning'?'Нужно внимание':status==='problem'?'Проблема':'Не удалось определить';
  }

  function renderAiAnalysis(analysis,formalCount){
    const report=$('report');
    const final=$('final');
    if(!report||!analysis)return;

    d.getElementById('aiResult')?.remove();

    // Старый блок «нужно проверить по содержанию» больше не актуален после реального AI-анализа.
    const neutral=$('neutral');
    if(neutral) neutral.style.display='none';

    const box=d.createElement('div');
    box.id='aiResult';
    box.innerHTML='<h3>Содержательная проверка ИИ</h3><p class="ai-note">ИИ помогает найти риски и соответствие требованиям, но не ставит оценку и не заменяет преподавателя.</p>';
    const ul=d.createElement('ul');

    let okCount=0,warningCount=0,problemCount=0,unknownCount=0;

    for(const [key,value] of Object.entries(analysis||{})){
      const li=d.createElement('li');
      if(value&&typeof value==='object'&&!Array.isArray(value)){
        const status=String(value.status||'unknown').toLowerCase();
        if(status==='ok')okCount++;
        else if(status==='warning')warningCount++;
        else if(status==='problem')problemCount++;
        else unknownCount++;

        const evidence=value.evidence||value.comment||value.explanation||value.details||value.found||'';
        li.className=`ai-${['ok','warning','problem','unknown'].includes(status)?status:'unknown'}`;
        li.innerHTML=`<b>${escapeHtml(key)}</b> — ${aiLabel(status)}${evidence?`<span class="ai-detail">${escapeHtml(Array.isArray(evidence)?evidence.join(', '):evidence)}</span>`:''}`;
      }else{
        li.className='ai-unknown';
        unknownCount++;
        li.innerHTML=`<b>${escapeHtml(key)}</b>: ${escapeHtml(typeof value==='string'?value:JSON.stringify(value))}`;
      }
      ul.appendChild(li);
    }

    box.appendChild(ul);
    if(final) final.before(box); else report.appendChild(box);

    if(final){
      const aiParts=[];
      if(okCount) aiParts.push(`${okCount} соблюдено`);
      if(warningCount) aiParts.push(`${warningCount} требуют внимания`);
      if(problemCount) aiParts.push(`${problemCount} проблем`);
      if(unknownCount) aiParts.push(`${unknownCount} не определено`);
      final.textContent=`Формальная проверка: ${formalCount} ${formalCount===1?'нарушение':'нарушений'}. ИИ: ${aiParts.join(', ')||'анализ завершён'}.`;
    }
  }

  const form=$('form');
  const submitButton=form?.querySelector('button[type="submit"]');
  let uploading=false;

  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    if(uploading)return;

    const fullName=$('name')?.value.trim()||'';
    const groupValue=$('group')?.value||'';
    const formatValue=$('format')?.value||'';
    const file=$('materialFile')?.files?.[0];

    if(typeof originalCheck==='function') originalCheck();
    const formalCount=recalcFormalReport();

    if(fullName.length<4){setStatus('error','<b>Укажите имя и фамилию.</b>');return;}
    if(!groupValue){setStatus('error','<b>Выберите группу.</b>');return;}
    if(!file){setStatus('error','<b>Загрузите готовый материал.</b>');return;}
    if(file.size>MAX_FILE_BYTES){setStatus('error','<b>Файл больше 100 МБ.</b> Он не отправлен и попытка не потрачена.');return;}

    uploading=true;
    if(submitButton){
      submitButton.disabled=true;
      submitButton.dataset.uploading='1';
      submitButton.dataset.oldText=submitButton.textContent;
      submitButton.textContent='Подготавливаем проверку…';
    }

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

      reservationId=created.reservationId;
      quotaDate=created.quotaDate;
      if(submitButton) submitButton.textContent='Загружаем файл…';
      setStatus('info',`<b>Загружаем ${escapeHtml(file.name)}</b> во временное защищённое хранилище…`);

      const putResponse=await fetch(created.uploadUrl,{
        method:'PUT',
        headers:created.uploadHeaders||{'Content-Type':contentType},
        body:file
      });
      if(!putResponse.ok) throw new Error(`Хранилище вернуло ошибку ${putResponse.status}.`);
      uploaded=true;

      // Сейчас содержательный AI-профиль настроен именно для статьи/лонгрида.
      if(formatValue==='article'){
        if(submitButton) submitButton.textContent='ИИ читает материал…';
        setStatus('info','<b>Файл загружен. YandexGPT читает статью и проверяет содержание…</b> Обычно это занимает несколько секунд.');
        const text=await extractText(file);
        if(!text) throw new Error('Не удалось извлечь текст из файла для ИИ-проверки.');
        const ai=await callApi({action:'analyzeText',text});
        if(!ai?.ok) throw new Error(ai?.message||'ИИ-анализ не завершён.');
        renderAiAnalysis(ai.analysis||{},formalCount);
      }else{
        const neutral=$('neutral');
        if(neutral&&FORMAT_TYPES[formatValue]==='text'){
          neutral.innerHTML='<b>Содержательный ИИ-анализ этого формата ещё подключается.</b><br>Сейчас автоматическая смысловая проверка настроена для «Статья / лонгрид».';
        }
      }

      const remaining=Number.isFinite(created.remainingToday)?created.remainingToday:null;
      setStatus('ok',remaining===null
        ?'<b>Проверка завершена.</b> Результат собран в отчёте.'
        :`<b>Проверка завершена.</b> На сегодня осталось проверок: <b>${remaining}</b>.`);
    }catch(err){
      if(!uploaded&&reservationId) await releaseReservation(fullName,groupValue,reservationId,quotaDate);
      setStatus('error',`<b>Проверка не завершена.</b> ${escapeHtml(err?.message||'Попробуйте ещё раз.')}${!uploaded?' Попытка возвращена.':''}`);
    }finally{
      uploading=false;
      if(submitButton){
        submitButton.disabled=false;
        delete submitButton.dataset.uploading;
        submitButton.textContent=submitButton.dataset.oldText||'Проверить материал';
        delete submitButton.dataset.oldText;
      }
    }
  },true);

  function createPdfHost(){
    const report=$('pdfArea');
    if(!report)return null;

    const host=document.createElement('div');
    host.className='vcheck-pdf-host';
    host.style.cssText='position:fixed;left:0;top:0;width:794px;min-height:1123px;z-index:2147483647;background:#fff;padding:34px;color:#111827;font:15px/1.45 Arial,sans-serif;box-sizing:border-box;';

    const style=document.createElement('style');
    style.textContent=`
      .vcheck-pdf-host *{box-sizing:border-box}
      .vcheck-pdf-host h2{font-size:26px;margin:10px 0 4px}
      .vcheck-pdf-host .eyebrow{display:inline-block;background:#ffe4e6;color:#9f1239;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700}
      .vcheck-pdf-host .hint{color:#667085;font-size:13px;margin-bottom:12px}
      .vcheck-pdf-host .block,.vcheck-pdf-host #aiResult{border-radius:14px;padding:14px 16px;margin:10px 0;break-inside:avoid}
      .vcheck-pdf-host .bad{background:#fff1f2;border:1px solid #fecdd3;color:#881337}
      .vcheck-pdf-host .good{background:#f0fdf4;border:1px solid #bbf7d0;color:#14532d}
      .vcheck-pdf-host .neutral{background:#f8fafc;border:1px solid #e2e8f0;color:#334155}
      .vcheck-pdf-host #aiResult{background:#eef2ff;border:1px solid #c7d2fe;color:#312e81}
      .vcheck-pdf-host #aiResult h3{margin:0 0 6px}
      .vcheck-pdf-host #aiResult .ai-note{font-size:12px;color:#4f46e5}
      .vcheck-pdf-host .ai-ok{color:#166534}.vcheck-pdf-host .ai-warning{color:#854d0e}.vcheck-pdf-host .ai-problem{color:#9f1239}.vcheck-pdf-host .ai-unknown{color:#475569}
      .vcheck-pdf-host .ai-detail{display:block;color:#475569;margin-top:2px}
      .vcheck-pdf-host .final{background:#111827;color:#fff;border-radius:13px;padding:14px;font-weight:700;margin-top:12px;break-inside:avoid}
      .vcheck-pdf-host ul{padding-left:20px}.vcheck-pdf-host li{margin:5px 0}
      .vcheck-pdf-host details{display:block}.vcheck-pdf-host summary{list-style:none}
    `;
    document.head.appendChild(style);
    host._vcheckStyle=style;

    const clone=report.cloneNode(true);
    clone.querySelectorAll('details').forEach(el=>el.open=true);
    clone.querySelectorAll('[style*="display: none"], [style*="display:none"]').forEach(el=>el.remove());
    host.appendChild(clone);
    document.body.appendChild(host);
    return host;
  }

  async function exportPdf(asBlob=false){
    const host=createPdfHost();
    if(!host)throw new Error('Отчёт ещё не сформирован.');
    try{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const worker=html2pdf().set({
        margin:8,
        filename:'MMT-V-CHECK.pdf',
        image:{type:'jpeg',quality:.98},
        html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:0},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['css','legacy']}
      }).from(host);
      if(asBlob)return await worker.outputPdf('blob');
      await worker.save();
    }finally{
      host._vcheckStyle?.remove();
      host.remove();
    }
  }

  $('pdf')?.addEventListener('click',async e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    const btn=$('pdf');
    const old=btn?.textContent;
    try{
      if(btn){btn.disabled=true;btn.textContent='Готовим PDF…';}
      await exportPdf(false);
    }catch(err){
      alert(`Не удалось создать PDF: ${err?.message||'неизвестная ошибка'}`);
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old||'Скачать PDF';}
    }
  },true);

  $('share')?.addEventListener('click',async e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    try{
      const blob=await exportPdf(true);
      const file=new File([blob],'MMT-V-CHECK.pdf',{type:'application/pdf'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({title:'MMT V-CHECK',text:'Результат проверки материала',files:[file]});
      }else if(navigator.share){
        await navigator.share({title:'MMT V-CHECK',text:w.reportText||'Результат проверки материала'});
      }else{
        alert('На этом устройстве системная отправка недоступна. Скачайте PDF и отправьте его вручную.');
      }
    }catch(err){
      if(err?.name!=='AbortError')alert(`Не удалось поделиться отчётом: ${err?.message||'неизвестная ошибка'}`);
    }
  },true);

  form?.addEventListener('reset',()=>setTimeout(()=>{
    setStatus('','');
    d.getElementById('aiResult')?.remove();
    const neutral=$('neutral');
    if(neutral)neutral.style.display='block';
  },0));
});