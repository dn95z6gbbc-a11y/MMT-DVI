// V-CHECK unified video report v4.2: formal report + Cloud Video transcript + Qwen frames + YandexGPT + Safari-safe PDF.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const TEST_VIDEO_IDS = { 'Стрит тест.mp4': 'vplvturpy67z22dg7om4' };
  const VIDEO_FORMATS = new Set(['story_event', 'story_theme', 'street', 'hot', 'live']);
  let running = false;
  window.__VCHECK_UNIFIED_VIDEO_LOADED__ = 'v4.2';

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatKey = () => String(document.getElementById('format')?.value || '');
  const isVideoFormat = () => VIDEO_FORMATS.has(formatKey());
  const currentFile = () => document.getElementById('materialFile')?.files?.[0] || null;
  const durationSeconds = () => { try { return typeof material !== 'undefined' && Number.isFinite(material.duration) ? Math.round(material.duration) : null; } catch (_) { return null; } };

  function parseEnvelope(value){
    if(value && typeof value.body === 'string'){try{return JSON.parse(value.body)}catch(_){}}
    return value;
  }

  async function api(body){
    const response = await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    const raw = await response.json();
    const data = parseEnvelope(raw);
    if(!response.ok || data?.ok === false){
      const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
      error.payload = data; throw error;
    }
    return data;
  }

  function vttText(vtt){
    const lines=[];
    for(const raw of String(vtt||'').replace(/\r/g,'').split('\n')){
      const line=raw.trim();
      if(!line || line==='WEBVTT' || /^NOTE\b/i.test(line) || /^\d+$/.test(line) || /\d{2}:\d{2}(?::\d{2})?[.,]\d{3}\s+-->\s+/.test(line)) continue;
      const clean=line.replace(/<[^>]+>/g,'').trim();
      if(clean && lines[lines.length-1]!==clean) lines.push(clean);
    }
    return lines.join('\n');
  }

  function progress(text,tone='normal'){
    const report=document.getElementById('report'),pdf=document.getElementById('pdfArea');
    if(!report)return; report.style.display='block';
    let box=document.getElementById('vcheckUnifiedVideoProgress');
    if(!box){box=document.createElement('div');box.id='vcheckUnifiedVideoProgress';box.style.cssText='margin:12px 0;padding:13px 15px;border:1px solid #dbe3ee;border-radius:14px;font-size:13px';(pdf||report).appendChild(box)}
    const palette={normal:['#f8fafc','#dbe3ee','#334155'],ok:['#f0fdf4','#bbf7d0','#166534'],bad:['#fff1f2','#fecdd3','#9f1239']}[tone]||['#f8fafc','#dbe3ee','#334155'];
    box.style.background=palette[0];box.style.borderColor=palette[1];box.style.color=palette[2];
    box.innerHTML=`<b>Видео: содержательная ИИ-проверка</b><br>${esc(text)}`;
  }

  async function waitFrames(){
    const started=Date.now();
    while(Date.now()-started<45000){
      const state=window.__VCHECK_VIDEO_FRAMES_STATE__;
      const frames=Array.isArray(window.__VCHECK_VIDEO_FRAMES__)?window.__VCHECK_VIDEO_FRAMES__:[];
      if(state && !state.running && frames.length>=6)return frames;
      await sleep(300);
    }
    throw new Error('Не удалось дождаться стоп-кадров видео.');
  }

  async function ensureVision(){
    if(window.VCHECK_VIDEO_VISION?.checked)return window.VCHECK_VIDEO_VISION;
    let button=null;const lookupStarted=Date.now();
    while(Date.now()-lookupStarted<12000){button=document.querySelector('.vcheck-vision-btn');if(button)break;await sleep(250)}
    if(!button)throw new Error('Визуальная ИИ-проверка не успела подключиться.');
    if(!button.disabled)button.click();
    const started=Date.now();
    while(Date.now()-started<180000){if(window.VCHECK_VIDEO_VISION?.checked)return window.VCHECK_VIDEO_VISION;await sleep(500)}
    throw new Error('Qwen слишком долго анализирует кадры.');
  }

  function compactVision(vision){
    return {
      sampling:'Выборка из 8 стоп-кадров по всей длине ролика. Отсутствие признака в выборке НЕ доказывает его отсутствие во всём видео.',
      checkedFrames:vision?.checked||0,failedFrames:vision?.failed||0,counts:vision?.counts||{},peopleFrames:vision?.person||0,
      nameLowerThirdFrames:vision?.lowerThird||0,subtitleOrTextFrames:vision?.subtitles||0,logoFrames:vision?.logo||0,locationTextFrames:vision?.locationText||0,
      frames:(Array.isArray(vision?.frames)?vision.frames:[]).filter(item=>item?.analysis).map(item=>({
        time:item.time,frameType:item.analysis.frameType,frameTypeConfidence:item.analysis.frameTypeConfidence,personOnCamera:!!item.analysis.personOnCamera,
        nameLowerThirdVisible:!!item.analysis.lowerThirdVisible,subtitlesVisible:!!item.analysis.subtitlesVisible,logoVisible:!!item.analysis.logoVisible,
        locationTextVisible:!!item.analysis.locationTextVisible,shotType:item.analysis.shotType||'unknown',journalistLikelySpeakingToCamera:item.analysis.journalistLikelySpeakingToCamera||'unknown',
        visualDescription:item.analysis.visualDescription||'',evidence:Array.isArray(item.analysis.evidence)?item.analysis.evidence.slice(0,4):[],uncertain:Array.isArray(item.analysis.uncertain)?item.analysis.uncertain.slice(0,3):[]
      }))
    };
  }

  async function transcriptFor(file){
    const videoId=TEST_VIDEO_IDS[file?.name||''];
    if(!videoId)throw new Error('На тестовом этапе объединённая расшифровка подключена к файлу «Стрит тест.mp4».');
    const started=Date.now(),timeoutMs=180000;let attempt=0;
    while(Date.now()-started<timeoutMs){
      attempt++;const data=await api({action:'videoSubtitles',videoId});
      if(typeof data?.transcript==='string'&&data.transcript.trim())return data.transcript.trim();
      if(typeof data?.subtitleText==='string'&&data.subtitleText.trim()){const text=vttText(data.subtitleText);if(text.trim())return text.trim()}
      const elapsed=Math.round((Date.now()-started)/1000);progress(`Ждём готовую расшифровку Cloud Video… ${elapsed} сек. Не закрывайте эту вкладку.`);await sleep(attempt<3?2500:5000);
    }
    throw new Error('Cloud Video не вернул текст субтитров за 3 минуты. Визуальный анализ уже готов — повторите проверку позже.');
  }

  function ensureStyles(){
    if(document.getElementById('vcheckUnifiedVideoStyles'))return;
    const style=document.createElement('style');style.id='vcheckUnifiedVideoStyles';style.textContent=`
      #vcheckUnifiedVideoReport{margin-top:12px;border:1px solid #fed7aa;background:#fffaf5;border-radius:17px;padding:18px;color:#334155}
      #vcheckUnifiedVideoReport h3{margin:0 0 5px;color:#111827;font-size:20px}
      #vcheckUnifiedVideoReport .vr-sub{color:#64748b;font-size:13px;margin-bottom:12px}
      #vcheckUnifiedVideoReport .vr-overall,#vcheckUnifiedVideoReport .vr-block{border:1px solid #f1e5da;background:#fff;border-radius:13px;padding:13px;margin-top:12px}
      #vcheckUnifiedVideoReport .vr-check{border-top:1px solid #f1e5da;padding:12px 0}
      #vcheckUnifiedVideoReport .vr-title{font-weight:850;color:#1f2937}
      #vcheckUnifiedVideoReport .vr-pill{display:inline-block;margin:5px 0;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:850}
      #vcheckUnifiedVideoReport .ok{background:#dcfce7;color:#166534}.problem{background:#ffe4e6;color:#9f1239}.warning{background:#fef3c7;color:#92400e}.unknown{background:#e2e8f0;color:#475569}
      #vcheckUnifiedVideoReport .vr-evidence{font-size:12px;color:#64748b;margin-top:5px}#vcheckUnifiedVideoReport .vr-action{font-size:13px;color:#9a3412;margin-top:5px}
    `;document.head.appendChild(style);
  }

  const statusLabel=status=>({ok:'Соблюдено',problem:'Проблема',warning:'Нужно внимание',unknown:'Не удалось определить'})[status]||'Проверка';

  function render(payload,vision){
    ensureStyles();const analysis=payload?.analysis||{},pdf=document.getElementById('pdfArea'),final=document.getElementById('final');if(!pdf)return;
    let root=document.getElementById('vcheckUnifiedVideoReport');
    if(!root){root=document.createElement('section');root.id='vcheckUnifiedVideoReport';final?pdf.insertBefore(root,final):pdf.appendChild(root)}
    const checks=Array.isArray(analysis.checks)?analysis.checks:[],strengths=Array.isArray(analysis.strengths)?analysis.strengths:[],fixes=Array.isArray(analysis.priorityFixes)?analysis.priorityFixes:[],teacher=Array.isArray(analysis.teacherReview)?analysis.teacherReview:[];
    const frameLine=vision?.failed?`${Number(vision?.checked||0)} из 8 стоп-кадров Qwen (${Number(vision.failed)} не ответили после повторной попытки)`:`${Number(vision?.checked||0)} стоп-кадров Qwen`;
    root.innerHTML=`
      <h3>Глубокий ИИ-анализ видео</h3>
      <div class="vr-sub">Расшифровка Cloud Video + ${esc(frameLine)} · ИИ не заменяет преподавателя.</div>
      <div class="vr-overall"><b>Общий вывод</b><br>${esc(analysis?.overall?.summary||'ИИ-анализ выполнен.')}</div>
      ${checks.map(check=>`<div class="vr-check"><div class="vr-title">${esc(check.title||check.id||'Проверка')}</div><span class="vr-pill ${esc(check.status||'unknown')}">${esc(statusLabel(check.status))}</span><div>${esc(check.finding||'')}</div>${Array.isArray(check.evidence)&&check.evidence.length?`<div class="vr-evidence"><b>Основание:</b> ${check.evidence.slice(0,3).map(esc).join(' · ')}</div>`:''}${check.recommendation?`<div class="vr-action"><b>Что сделать:</b> ${esc(check.recommendation)}</div>`:''}</div>`).join('')}
      ${strengths.length?`<div class="vr-block"><b>Сильные стороны</b><ul>${strengths.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      ${fixes.length?`<div class="vr-block"><b>Что исправить в первую очередь</b><ol>${fixes.map(x=>`<li><b>${esc(x.problem||'')}</b>${x.how?` — ${esc(x.how)}`:''}</li>`).join('')}</ol></div>`:''}
      ${teacher.length?`<div class="vr-block"><b>Что должен проверить преподаватель</b><ul>${teacher.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      <div class="vr-block"><b>Рекомендация перед сдачей</b><br>${esc(analysis.finalRecommendation||'Сопоставьте выводы ИИ с исходным видео.')}</div>`;
    if(final&&analysis.finalRecommendation)final.textContent=analysis.finalRecommendation;
    try{if(typeof reportText!=='undefined')reportText+=`\n\nГЛУБОКИЙ ИИ-АНАЛИЗ ВИДЕО\n${analysis?.overall?.summary||''}\n${checks.map(x=>`— ${x.title||x.id}: ${x.finding||''}`).join('\n')}\n\nРЕКОМЕНДАЦИЯ\n${analysis.finalRecommendation||''}`}catch(_){}
    root.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function loadScript(src,test){
    if(test())return Promise.resolve();
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=()=>test()?resolve():reject(new Error('library_not_ready'));s.onerror=()=>reject(new Error('library_load_failed'));document.head.appendChild(s)});
  }

  async function ensurePdfLibraries(){
    await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',()=>typeof window.html2canvas==='function');
    await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
  }

  function pdfChunks(area){
    const out=[];
    for(const child of Array.from(area.children)){
      if(child.id==='vcheckUnifiedVideoReport')out.push(...Array.from(child.children));else out.push(child);
    }
    return out.filter(el=>el && el.offsetHeight>0 && el.id!=='vcheckUnifiedVideoProgress');
  }

  async function buildPdfBlob(){
    const area=document.getElementById('pdfArea');if(!area)throw new Error('pdf_area_missing');
    await ensurePdfLibraries();
    const details=Array.from(area.querySelectorAll('details')),wasOpen=details.map(x=>x.open);details.forEach(x=>x.open=true);await sleep(80);
    const {jsPDF}=window.jspdf,pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
    const pageW=210,pageH=297,margin=9,usableW=pageW-margin*2,usableH=pageH-margin*2;let y=margin,used=false;
    try{
      const areaWidth=Math.max(1,area.getBoundingClientRect().width);
      for(const el of pdfChunks(area)){
        const canvas=await window.html2canvas(el,{scale:1.15,backgroundColor:'#ffffff',useCORS:true,logging:false,removeContainer:true});
        if(!canvas.width||!canvas.height)continue;
        const fraction=Math.min(1,Math.max(.18,el.getBoundingClientRect().width/areaWidth));
        const targetW=usableW*fraction,mmPerPx=targetW/canvas.width,maxSlicePx=Math.max(1,Math.floor(usableH/mmPerPx));
        let sy=0;
        while(sy<canvas.height){
          const sliceH=Math.min(maxSlicePx,canvas.height-sy),slice=document.createElement('canvas');slice.width=canvas.width;slice.height=sliceH;
          const ctx=slice.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,slice.width,slice.height);ctx.drawImage(canvas,0,sy,canvas.width,sliceH,0,0,canvas.width,sliceH);
          const hMm=sliceH*mmPerPx;
          if(used && y+hMm>pageH-margin){pdf.addPage();y=margin}
          pdf.addImage(slice.toDataURL('image/jpeg',.9),'JPEG',margin,y,targetW,hMm,undefined,'FAST');used=true;y+=hMm+2.5;sy+=sliceH;
          if(sy<canvas.height){pdf.addPage();y=margin}
        }
      }
      if(!used)throw new Error('pdf_render_empty');
      return pdf.output('blob');
    }finally{details.forEach((x,i)=>x.open=wasOpen[i])}
  }

  function installPdfFix(){
    const pdfBtn=document.getElementById('pdf'),shareBtn=document.getElementById('share');
    if(pdfBtn && !pdfBtn.dataset.vcheckPdf42){pdfBtn.dataset.vcheckPdf42='1';pdfBtn.addEventListener('click',async event=>{event.preventDefault();event.stopImmediatePropagation();const old=pdfBtn.textContent;pdfBtn.disabled=true;pdfBtn.textContent='Готовим PDF…';try{const blob=await buildPdfBlob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='MMT-V-CHECK.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000)}catch(error){console.error('V-CHECK PDF failed',error);alert('Не удалось собрать PDF. Попробуйте ещё раз.')}finally{pdfBtn.disabled=false;pdfBtn.textContent=old}},true)}
    if(shareBtn && !shareBtn.dataset.vcheckPdf42){shareBtn.dataset.vcheckPdf42='1';shareBtn.addEventListener('click',async event=>{event.preventDefault();event.stopImmediatePropagation();try{const blob=await buildPdfBlob(),file=new File([blob],'MMT-V-CHECK.pdf',{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({title:'MMT V-CHECK',text:'Результат проверки материала',files:[file]});else if(navigator.share)await navigator.share({title:'MMT V-CHECK',text:typeof reportText!=='undefined'?reportText:'Результат проверки материала'});else{await navigator.clipboard.writeText(typeof reportText!=='undefined'?reportText:'Результат проверки материала');alert('Отчёт скопирован. Его можно вставить в Telegram.')}}catch(error){if(error?.name!=='AbortError')console.error('V-CHECK share failed',error)}},true)}
  }

  async function run(){
    if(running||!isVideoFormat())return;const file=currentFile();if(!file)return;
    running=true;const button=document.querySelector('#form button[type="submit"]'),oldLabel=button?.textContent||'Проверить материал';if(button){button.disabled=true;button.textContent='Проверяем видео…'}
    try{
      progress('Готовим 8 стоп-кадров…');await waitFrames();
      progress('Qwen анализирует визуальную часть…');const vision=await ensureVision();
      progress('Получаем расшифровку речи из Cloud Video…');const transcript=await transcriptFor(file);
      const observations=compactVision(vision);progress('YandexGPT объединяет речь, визуальные признаки и требования выбранного формата…');
      const payload=await api({action:'analyzeMaterial',format:formatKey(),transcript,annotation:document.getElementById('annotation')?.value||'',significance:document.getElementById('significance')?.value||'',aiElement:document.getElementById('aiElement')?.value||'',aiPlace:document.getElementById('aiPlace')?.value||'',durationSeconds:durationSeconds(),mediaObservations:observations,videoObservations:observations,sourceNote:'Доступна расшифровка речи и выборка из 8 стоп-кадров. Не утверждай отсутствие визуального элемента только потому, что он не попал в выборку. Не делай выводов о возрасте, социальном статусе или иных характеристиках людей по внешности. Не делай выводов о качестве звука или динамике монтажа без прямых данных. Если данных недостаточно, ставь unknown, а не warning/problem.'});
      if(!payload?.ai||!payload?.analysis)throw new Error('YandexGPT не вернул структурированный видеоотчёт.');
      render(payload,vision);installPdfFix();progress('Единый отчёт готов: формальная проверка + расшифровка + визуальный ИИ.','ok');
    }catch(error){console.error('V-CHECK unified video report failed',error);progress(error?.message||'Не удалось выполнить содержательную проверку видео.','bad')}
    finally{running=false;if(button){button.disabled=false;button.textContent=oldLabel}}
  }

  function trigger(){if(isVideoFormat())setTimeout(run,80)}
  function bind(){
    const form=document.getElementById('form');if(!form||form.dataset.vcheckUnifiedVideo==='4.2')return;form.dataset.vcheckUnifiedVideo='4.2';
    form.addEventListener('submit',trigger,true);document.addEventListener('click',event=>{if(event.target?.closest?.('#form button[type="submit"]'))trigger()},true);
    form.addEventListener('reset',()=>{document.getElementById('vcheckUnifiedVideoReport')?.remove();document.getElementById('vcheckUnifiedVideoProgress')?.remove()});
    installPdfFix();console.log('V-CHECK unified video v4.2 bound');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();