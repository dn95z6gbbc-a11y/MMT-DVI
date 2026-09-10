// V-CHECK visual AI for extracted frames. v4.2: pair processing + retry.
(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  let running=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const frames=()=>Array.from(document.querySelectorAll('[data-vcheck-frame]'));

  function loadUnified(){
    if(document.getElementById('vcheckUnifiedVideoScriptV4'))return;
    const s=document.createElement('script');
    s.id='vcheckUnifiedVideoScriptV4';
    s.src='./video-unified-report-v4.js';
    s.defer=true;
    document.head.appendChild(s);
  }

  function blobFor(el){
    const i=Number(el.dataset.index),list=Array.isArray(window.__VCHECK_VIDEO_FRAMES__)?window.__VCHECK_VIDEO_FRAMES__:[];
    return list.find(x=>Number(x.index)===i)?.blob||null;
  }

  async function base64(blob){
    return await new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onerror=()=>reject(r.error||new Error('file_reader_failed'));
      r.onload=()=>{const s=String(r.result||''),i=s.indexOf(',');resolve(i>=0?s.slice(i+1):s)};
      r.readAsDataURL(blob);
    });
  }

  async function analyzeOnce(el){
    const blob=blobFor(el);
    if(!blob)throw new Error('frame_blob_missing');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),45000);
    try{
      const r=await fetch(API_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'videoVision',imageBase64:await base64(blob),mimeType:blob.type||'image/jpeg'}),
        cache:'no-store',
        signal:controller.signal
      });
      const raw=await r.json(),data=typeof raw?.body==='string'?JSON.parse(raw.body):raw;
      if(!r.ok||!data?.ok||!data?.analysis)throw new Error(data?.error||`vision_http_${r.status}`);
      return data.analysis;
    }finally{
      clearTimeout(timer);
    }
  }

  async function analyze(el){
    let lastError=null;
    for(let attempt=1;attempt<=2;attempt++){
      try{return await analyzeOnce(el)}catch(error){
        lastError=error;
        if(attempt<2)await sleep(900);
      }
    }
    throw lastError||new Error('vision_failed');
  }

  function evidence(raw){return [raw?.visualDescription,...(Array.isArray(raw?.evidence)?raw.evidence:[]),...(Array.isArray(raw?.uncertain)?raw.uncertain:[])].filter(Boolean).join(' ').toLowerCase()}
  function normalize(raw){
    const text=evidence(raw);
    const identity=/(?:имя|именем|фамили|должност|ролью|професс|name|surname|role|job title)/i.test(text);
    const subtitle=/(?:субтитр|реплик|вопрос|ответ|текст внизу|текст снизу|caption|subtitle)/i.test(text);
    const logo=/(?:логотип|лого|watermark|водян(?:ой|ая) знак|бренд)/i.test(text);
    const lower=!!(raw?.lowerThirdVisible&&identity&&!subtitle);
    const subtitles=!!(raw?.subtitlesVisible||subtitle||(raw?.otherTextVisible&&raw?.lowerThirdVisible&&!lower&&!logo));
    let type=raw?.frameType||'unknown',confidence='normal';
    if(type==='standup'){confidence=raw?.journalistLikelySpeakingToCamera==='yes'?'likely':'weak';if(!raw?.personOnCamera)type='unknown'}
    if(type==='interview'){confidence=/(?:микрофон|интервью|вопрос|ответ|собесед|microphone|interview)/i.test(text)?'likely':'weak'}
    return {...raw,frameType:type,frameTypeConfidence:confidence,lowerThirdVisible:lower,subtitlesVisible:subtitles,logoVisible:!!(raw?.logoVisible||logo),rawLowerThirdVisible:!!raw?.lowerThirdVisible};
  }

  function badge(el,a){
    let b=el.querySelector('.vcheck-frame-ai');
    if(!b){b=document.createElement('div');b.className='vcheck-frame-ai';el.appendChild(b)}
    const names={standup:a.frameTypeConfidence==='likely'?'вероятный стендап':'стендап?',interview:a.frameTypeConfidence==='likely'?'интервью':'интервью?',broll:'перебивка?',graphic:'графика',other:'другое',unknown:'неясно'};
    const p=[names[a.frameType]||a.frameType||'неясно'];
    if(a.lowerThirdVisible)p.push('именной титр');else if(a.subtitlesVisible)p.push('субтитры/текст');
    if(a.locationTextVisible)p.push('место');
    b.textContent=p.join(' · ');
  }

  function summarize(results){
    const ok=results.filter(x=>x.analysis),counts={};let lowerThird=0,subtitles=0,logo=0,locationText=0,person=0;
    for(const x of ok){
      const a=x.analysis,t=a.frameType||'unknown';counts[t]=(counts[t]||0)+1;
      if(a.lowerThirdVisible)lowerThird++;if(a.subtitlesVisible)subtitles++;if(a.logoVisible)logo++;if(a.locationTextVisible)locationText++;if(a.personOnCamera)person++;
    }
    return {checked:ok.length,failed:results.length-ok.length,counts,lowerThird,subtitles,logo,locationText,person,frames:results};
  }

  function styles(){
    if(document.getElementById('vcheckVisionStyles'))return;
    const s=document.createElement('style');s.id='vcheckVisionStyles';
    s.textContent='.vcheck-vision-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}.vcheck-vision-btn{border:0;border-radius:12px;padding:10px 14px;font:inherit;font-weight:800;background:#111827;color:#fff;cursor:pointer}.vcheck-vision-btn:disabled{opacity:.48;cursor:not-allowed}.vcheck-vision-status{font-size:13px;color:#667085}.vcheck-frame-ai{position:absolute;right:6px;top:6px;z-index:2;max-width:calc(100% - 12px);padding:3px 6px;border-radius:999px;background:rgba(15,23,42,.86);color:#fff;font-size:9px;line-height:1.25;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vcheck-vision-summary{margin-top:10px;padding:12px;border:1px solid #dbe3ee;background:#fff;border-radius:12px;font-size:13px;color:#334155}.vcheck-vision-caveat{margin-top:6px;color:#64748b;font-size:12px}';
    document.head.appendChild(s);
  }

  function attach(){
    styles();loadUnified();
    const list=frames();if(!list.length)return false;
    const host=document.getElementById('vcheckVideoFrames')||list[0].parentElement?.parentElement;
    if(!host||host.querySelector('.vcheck-vision-actions'))return true;

    const actions=document.createElement('div');actions.className='vcheck-vision-actions';
    const btn=document.createElement('button');btn.type='button';btn.className='vcheck-vision-btn';btn.textContent=`Проверить ${list.length} кадров ИИ`;
    const status=document.createElement('span');status.className='vcheck-vision-status';status.textContent='Кадры готовы для визуального анализа.';
    const summaryBox=document.createElement('div');summaryBox.className='vcheck-vision-summary';summaryBox.hidden=true;
    actions.append(btn,status);host.append(actions,summaryBox);

    btn.addEventListener('click',async()=>{
      if(running)return;
      running=true;btn.disabled=true;
      const current=frames(),results=new Array(current.length);
      try{
        for(let start=0;start<current.length;start+=2){
          const end=Math.min(start+2,current.length);
          status.textContent=`Qwen анализирует кадры ${start+1}${end>start+1?'–'+end:''} из ${current.length}…`;
          const pair=current.slice(start,end);
          const settled=await Promise.allSettled(pair.map(el=>analyze(el)));
          settled.forEach((res,offset)=>{
            const i=start+offset,el=current[i];
            if(res.status==='fulfilled'){
              const a=normalize(res.value);
              results[i]={index:i,time:el.dataset.time||`кадр ${i+1}`,analysis:a,rawAnalysis:res.value};
              badge(el,a);
            }else{
              results[i]={index:i,time:el.dataset.time||`кадр ${i+1}`,error:String(res.reason?.message||res.reason||'vision_failed')};
            }
          });
          await sleep(250);
        }

        const s=summarize(results.filter(Boolean));
        window.VCHECK_VIDEO_VISION=s;
        const names={standup:'вероятный стендап',interview:'интервью',broll:'перебивка?',graphic:'графика',other:'другое',unknown:'неясно'};
        const types=Object.entries(s.counts).map(([k,v])=>`${names[k]||k}: ${v}`).join(' · ')||'нет данных';
        summaryBox.hidden=false;
        summaryBox.innerHTML=`<b>Визуальная ИИ-проверка готова.</b><br>Проверено: ${s.checked} из ${current.length}${s.failed?`; не ответили после повторной попытки: ${s.failed}`:''}.<br>${types}<br>Кадров с человеком: ${s.person}; с именным титром: ${s.lowerThird}; с субтитрами/текстом: ${s.subtitles}; с логотипом: ${s.logo}; с видимым названием места: ${s.locationText}.<div class="vcheck-vision-caveat">Стоп-кадр даёт визуальные признаки, но сам по себе не доказывает монтаж, звук или роль человека.${s.failed?' Итоговый отчёт учитывает только успешно проверенные кадры.':''}</div>`;
        status.textContent=`Готово: ${s.checked} из ${current.length} кадров.`;
      }finally{
        running=false;btn.disabled=false;
      }
    });
    return true;
  }

  loadUnified();
  const obs=new MutationObserver(()=>attach());obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();