// V-CHECK unified video report v3: formal report + Cloud Video transcript + Qwen frames + YandexGPT.
(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const TEST_VIDEO_IDS={'Стрит тест.mp4':'vplvturpy67z22dg7om4'};
  const VIDEO_FORMATS=new Set(['story_event','story_theme','street','hot','live']);
  let running=false;
  window.__VCHECK_UNIFIED_VIDEO_LOADED__='v3';

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function formatKey(){return String(document.getElementById('format')?.value||'');}
  function videoFormat(){return VIDEO_FORMATS.has(formatKey());}
  function file(){return document.getElementById('materialFile')?.files?.[0]||null;}
  function duration(){try{return typeof material!=='undefined'&&Number.isFinite(material.duration)?Math.round(material.duration):null;}catch(_){return null;}}
  function parseEnvelope(x){if(x&&typeof x.body==='string'){try{return JSON.parse(x.body);}catch(_){}}return x;}

  async function api(body){
    const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const raw=await r.json();
    const data=parseEnvelope(raw);
    if(!r.ok||data?.ok===false){
      const e=new Error(data?.message||data?.error||`HTTP ${r.status}`);
      e.payload=data;
      throw e;
    }
    return data;
  }

  function vttText(vtt){
    const out=[];
    for(const raw of String(vtt||'').replace(/\r/g,'').split('\n')){
      const s=raw.trim();
      if(!s||s==='WEBVTT'||/^NOTE\b/i.test(s)||/^\d+$/.test(s)||/\d{2}:\d{2}(?::\d{2})?[.,]\d{3}\s+-->\s+/.test(s))continue;
      const clean=s.replace(/<[^>]+>/g,'').trim();
      if(clean&&out[out.length-1]!==clean)out.push(clean);
    }
    return out.join('\n');
  }

  async function waitFrames(){
    const start=Date.now();
    while(Date.now()-start<45000){
      const st=window.__VCHECK_VIDEO_FRAMES_STATE__;
      const frames=Array.isArray(window.__VCHECK_VIDEO_FRAMES__)?window.__VCHECK_VIDEO_FRAMES__:[];
      if(st&&!st.running&&frames.length>=6)return frames;
      if(document.visibilityState==='hidden'){
        await new Promise(resolve=>{const f=()=>{if(document.visibilityState!=='hidden'){document.removeEventListener('visibilitychange',f);resolve();}};document.addEventListener('visibilitychange',f);});
      }
      await sleep(300);
    }
    throw new Error('Не удалось дождаться стоп-кадров видео.');
  }

  async function ensureVision(){
    if(window.VCHECK_VIDEO_VISION?.checked)return window.VCHECK_VIDEO_VISION;
    let btn=null,start=Date.now();
    while(Date.now()-start<12000){
      btn=document.querySelector('.vcheck-vision-btn');
      if(btn)break;
      await sleep(250);
    }
    if(!btn)throw new Error('Визуальная ИИ-проверка не успела подключиться.');
    if(!btn.disabled)btn.click();
    start=Date.now();
    while(Date.now()-start<150000){
      if(window.VCHECK_VIDEO_VISION?.checked)return window.VCHECK_VIDEO_VISION;
      await sleep(500);
    }
    throw new Error('Qwen слишком долго анализирует кадры.');
  }

  function compactVision(v){
    return {
      sampling:'Выборка из 8 стоп-кадров по всей длине ролика. Отсутствие признака в выборке НЕ доказывает его отсутствие во всём видео.',
      checkedFrames:v?.checked||0,
      failedFrames:v?.failed||0,
      counts:v?.counts||{},
      peopleFrames:v?.person||0,
      nameLowerThirdFrames:v?.lowerThird||0,
      subtitleOrTextFrames:v?.subtitles||0,
      logoFrames:v?.logo||0,
      locationTextFrames:v?.locationText||0,
      frames:(Array.isArray(v?.frames)?v.frames:[]).filter(x=>x?.analysis).map(x=>({
        time:x.time,
        frameType:x.analysis.frameType,
        frameTypeConfidence:x.analysis.frameTypeConfidence,
        personOnCamera:!!x.analysis.personOnCamera,
        nameLowerThirdVisible:!!x.analysis.lowerThirdVisible,
        subtitlesVisible:!!x.analysis.subtitlesVisible,
        logoVisible:!!x.analysis.logoVisible,
        locationTextVisible:!!x.analysis.locationTextVisible,
        shotType:x.analysis.shotType||'unknown',
        journalistLikelySpeakingToCamera:x.analysis.journalistLikelySpeakingToCamera||'unknown',
        visualDescription:x.analysis.visualDescription||'',
        evidence:Array.isArray(x.analysis.evidence)?x.analysis.evidence.slice(0,4):[],
        uncertain:Array.isArray(x.analysis.uncertain)?x.analysis.uncertain.slice(0,3):[]
      }))
    };
  }

  function ensureProgressHost(){
    const report=document.getElementById('report');
    const pdf=document.getElementById('pdfArea');
    if(!report)return null;
    report.style.display='block';
    let box=document.getElementById('vcheckUnifiedVideoProgress');
    if(!box){
      box=document.createElement('div');
      box.id='vcheckUnifiedVideoProgress';
      box.style.cssText='margin:12px 0;padding:13px 15px;border:1px solid #dbe3ee;border-radius:14px;font-size:13px';
      (pdf||report).appendChild(box);
    }
    return box;
  }

  function progress(text,tone='normal'){
    const box=ensureProgressHost();if(!box)return;
    const t={normal:['#f8fafc','#dbe3ee','#334155'],ok:['#f0fdf4','#bbf7d0','#166534'],bad:['#fff1f2','#fecdd3','#9f1239']}[tone]||['#f8fafc','#dbe3ee','#334155'];
    box.style.background=t[0];box.style.borderColor=t[1];box.style.color=t[2];
    box.innerHTML=`<b>Видео: содержательная ИИ-проверка</b><br>${esc(text)}`;
  }

  function styles(){
    if(document.getElementById('vcheckUnifiedVideoStyles'))return;
    const s=document.createElement('style');s.id='vcheckUnifiedVideoStyles';
    s.textContent=`#vcheckUnifiedVideoReport{margin-top:12px;border:1px solid #fed7aa;background:#fffaf5;border-radius:17px;padding:18px;color:#334155}#vcheckUnifiedVideoReport h3{margin:0 0 4px;color:#111827;font-size:20px}#vcheckUnifiedVideoReport .vr-sub{color:#64748b;font-size:13px;margin-bottom:14px}.vr-overall,.vr-block{border:1px solid #f1e5da;background:#fff;border-radius:13px;padding:13px;margin-top:12px}.vr-check{display:grid;grid-template-columns:minmax(145px,.55fr) 1.45fr;gap:14px;border-top:1px solid #f1e5da;padding:12px 0}.vr-title{font-weight:850}.vr-pill{display:inline-block;margin-top:5px;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:850}.ai-ok{background:#dcfce7;color:#166534}.ai-problem{background:#ffe4e6;color:#9f1239}.ai-warning{background:#fef3c7;color:#92400e}.ai-unknown{background:#e2e8f0;color:#475569}.vr-finding{font-weight:700}.vr-evidence{font-size:12px;color:#64748b;margin-top:5px}.vr-action{font-size:13px;color:#9a3412;margin-top:5px}.vr-block h4{margin:0 0 7px;color:#9a3412}.vr-block ul,.vr-block ol{margin:6px 0;padding-left:20px}@media(max-width:680px){.vr-check{grid-template-columns:1fr;gap:6px}}`;
    document.head.appendChild(s);
  }
  const lab=s=>({ok:'Соблюдено',problem:'Проблема',warning:'Нужно внимание',unknown:'Не удалось определить'})[s]||s||'Проверка';
  const cls=s=>s==='ok'?'ai-ok':s==='problem'?'ai-problem':s==='warning'?'ai-warning':'ai-unknown';

  function render(payload,vision){
    styles();
    const a=payload?.analysis||{},pdf=document.getElementById('pdfArea'),final=document.getElementById('final');
    if(!pdf)return;
    let root=document.getElementById('vcheckUnifiedVideoReport');
    if(!root){root=document.createElement('section');root.id='vcheckUnifiedVideoReport';final?pdf.insertBefore(root,final):pdf.appendChild(root);}
    const checks=Array.isArray(a.checks)?a.checks:[],strengths=Array.isArray(a.strengths)?a.strengths:[],fixes=Array.isArray(a.priorityFixes)?a.priorityFixes:[],teacher=Array.isArray(a.teacherReview)?a.teacherReview:[];
    root.innerHTML=`<h3>Глубокий ИИ-анализ видео</h3><div class="vr-sub">Расшифровка Cloud Video + ${Number(vision?.checked||0)} стоп-кадров Qwen · ИИ не заменяет преподавателя.</div><div class="vr-overall"><b>Общий вывод</b><br>${esc(a?.overall?.summary||'ИИ-анализ выполнен.')}</div>${checks.map(x=>`<div class="vr-check"><div><div class="vr-title">${esc(x.title||x.id||'Проверка')}</div><span class="vr-pill ${cls(x.status)}">${esc(lab(x.status))}</span></div><div><div class="vr-finding">${esc(x.finding||'')}</div>${Array.isArray(x.evidence)&&x.evidence.length?`<div class="vr-evidence"><b>Основание:</b> ${x.evidence.slice(0,3).map(esc).join(' · ')}</div>`:''}${x.recommendation?`<div class="vr-action"><b>Что сделать:</b> ${esc(x.recommendation)}</div>`:''}</div></div>`).join('')}${strengths.length?`<div class="vr-block"><h4>Сильные стороны</h4><ul>${strengths.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}${fixes.length?`<div class="vr-block"><h4>Что исправить в первую очередь</h4><ol>${fixes.map(x=>`<li><b>${esc(x.problem||'')}</b>${x.how?` — ${esc(x.how)}`:''}</li>`).join('')}</ol></div>`:''}${teacher.length?`<div class="vr-block"><h4>Что должен проверить преподаватель</h4><ul>${teacher.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<div class="vr-block"><h4>Рекомендация перед сдачей</h4>${esc(a.finalRecommendation||'Сопоставьте выводы ИИ с исходным видео.')}</div>`;
    if(final&&a.finalRecommendation)final.textContent=a.finalRecommendation;
    try{if(typeof reportText!=='undefined')reportText+=`\n\nГЛУБОКИЙ ИИ-АНАЛИЗ ВИДЕО\n${a?.overall?.summary||''}\n${checks.map(x=>`— ${x.title||x.id}: ${x.finding||''}`).join('\n')}\n\nРЕКОМЕНДАЦИЯ\n${a.finalRecommendation||''}`;}catch(_){}
    root.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function transcriptFor(f){
    const id=TEST_VIDEO_IDS[f?.name||''];
    if(!id)throw new Error('Первый объединённый тест сейчас подключён к файлу «Стрит тест.mp4». После проверки отчёта автоматизируем загрузку любого видео в Cloud Video.');
    const d=await api({action:'videoSubtitles',videoId:id});
    if(!d?.transcriptReady||!d?.subtitleText)throw new Error('Cloud Video ещё не вернул готовую расшифровку.');
    return vttText(d.subtitleText);
  }

  async function run(){
    if(running||!videoFormat())return;
    const f=file();if(!f)return;
    running=true;
    const btn=document.querySelector('#form button[type="submit"]'),old=btn?.textContent||'Проверить материал';
    if(btn){btn.disabled=true;btn.textContent='Проверяем видео…';}
    try{
      progress('Готовим 8 стоп-кадров…');
      await waitFrames();
      progress('Qwen анализирует визуальную часть…');
      const vision=await ensureVision();
      progress('Получаем расшифровку речи из Cloud Video…');
      const transcript=await transcriptFor(f);
      if(!transcript.trim())throw new Error('Расшифровка оказалась пустой.');
      const obs=compactVision(vision);
      progress('YandexGPT объединяет речь, визуальные признаки и требования формата…');
      const payload=await api({
        action:'analyzeMaterial',
        format:formatKey(),
        transcript,
        annotation:document.getElementById('annotation')?.value||'',
        significance:document.getElementById('significance')?.value||'',
        aiElement:document.getElementById('aiElement')?.value||'',
        aiPlace:document.getElementById('aiPlace')?.value||'',
        durationSeconds:duration(),
        mediaObservations:obs,
        videoObservations:obs,
        sourceNote:'Доступна расшифровка речи и выборка из 8 стоп-кадров. Не утверждай отсутствие визуального элемента только потому, что он не попал в выборку. Не делай выводов о качестве звука или динамике монтажа без прямых данных.'
      });
      if(!payload?.ai||!payload?.analysis)throw new Error('YandexGPT не вернул структурированный видеоотчёт.');
      render(payload,vision);
      progress('Единый отчёт готов: формальная проверка + расшифровка + визуальный ИИ.','ok');
    }catch(e){
      console.error('V-CHECK unified video report failed',e);
      progress(e?.message||'Не удалось выполнить содержательную проверку видео.','bad');
    }finally{
      running=false;
      if(btn){btn.disabled=false;btn.textContent=old;}
    }
  }

  function trigger(){if(videoFormat())setTimeout(run,80);}
  function bind(){
    const form=document.getElementById('form');
    if(!form||form.dataset.vcheckUnifiedVideo==='3')return;
    form.dataset.vcheckUnifiedVideo='3';
    form.addEventListener('submit',trigger,true);
    document.addEventListener('click',event=>{
      const btn=event.target?.closest?.('#form button[type="submit"]');
      if(btn)trigger();
    },true);
    form.addEventListener('reset',()=>{
      document.getElementById('vcheckUnifiedVideoReport')?.remove();
      document.getElementById('vcheckUnifiedVideoProgress')?.remove();
    });
    console.log('V-CHECK unified video v3 bound');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
