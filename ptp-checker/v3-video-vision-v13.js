(function(){
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const FRAME_ID='app';
  const MAX_CONCURRENCY=3;

  function parseApiResponse(raw){
    let data=raw;
    if(raw&&typeof raw.body==='string'){
      try{data=JSON.parse(raw.body);}catch(_){ }
    }
    return data||{};
  }

  async function callVision(payload){
    const response=await fetch(API_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      cache:'no-store'
    });
    let raw={};
    try{raw=await response.json();}
    catch(_){throw new Error('Сервер вернул непонятный ответ.');}
    const data=parseApiResponse(raw);
    if(!data.ok){
      throw new Error(data.message||data.error||`Ошибка ${response.status}`);
    }
    return data;
  }

  function blobToBase64(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{
        const value=String(reader.result||'');
        const comma=value.indexOf(',');
        if(comma<0)return reject(new Error('Не удалось подготовить кадр.'));
        resolve(value.slice(comma+1));
      };
      reader.onerror=()=>reject(new Error('Не удалось прочитать кадр.'));
      reader.readAsDataURL(blob);
    });
  }

  function formatTime(seconds){
    const total=Math.max(0,Math.round(Number(seconds)||0));
    const m=Math.floor(total/60);
    const s=String(total%60).padStart(2,'0');
    return `${m}:${s}`;
  }

  function ensureStyles(d){
    if(d.getElementById('vcheck-video-vision-style'))return;
    const style=d.createElement('style');
    style.id='vcheck-video-vision-style';
    style.textContent=`
      #vcheckVisionControls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}
      #vcheckVisionButton{border:0;border-radius:11px;padding:10px 14px;background:#111827;color:#fff;font-weight:800;cursor:pointer}
      #vcheckVisionButton:disabled{opacity:.55;cursor:wait}
      #vcheckVisionStatus{font-size:12px;color:#475569;font-weight:700}
      #vcheckVisionSummary{display:none;margin-top:12px;border-radius:12px;padding:12px;background:#fff;border:1px solid #dbe3ee;font-size:12px;color:#334155;line-height:1.45}
      #vcheckVisionSummary b{color:#111827}
      #vcheckVideoFrames .vf-ai{position:absolute;right:6px;top:6px;background:rgba(15,23,42,.86);color:#fff;border-radius:999px;padding:3px 6px;font-size:9px;font-weight:800;max-width:80%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #vcheckVideoFrames .vf-ai.ok{background:rgba(22,101,52,.92)}
      #vcheckVideoFrames .vf-ai.err{background:rgba(159,18,57,.92)}
    `;
    d.head.appendChild(style);
  }

  function ensureControls(d){
    const box=d.getElementById('vcheckVideoFrames');
    if(!box)return null;
    let controls=d.getElementById('vcheckVisionControls');
    if(controls)return controls;
    controls=d.createElement('div');
    controls.id='vcheckVisionControls';
    controls.innerHTML='<button type="button" id="vcheckVisionButton">Проверить 12 кадров ИИ</button><span id="vcheckVisionStatus">Сначала дождитесь появления всех кадров.</span>';
    const summary=d.createElement('div');
    summary.id='vcheckVisionSummary';
    box.appendChild(controls);
    box.appendChild(summary);
    return controls;
  }

  function frameLabel(result){
    if(!result)return '—';
    const a=result.analysis||{};
    const bits=[];
    if(a.frameType&&a.frameType!=='unknown')bits.push(a.frameType);
    if(a.lowerThirdVisible===true)bits.push('плашка');
    if(a.shotType&&a.shotType!=='unknown')bits.push(a.shotType);
    return bits.slice(0,2).join(' · ')||'проанализирован';
  }

  function clearBadges(d){
    for(const el of d.querySelectorAll('#vcheckVideoFrames .vf-ai'))el.remove();
  }

  async function runVision(d){
    const button=d.getElementById('vcheckVisionButton');
    const status=d.getElementById('vcheckVisionStatus');
    const summary=d.getElementById('vcheckVisionSummary');
    const frames=Array.isArray(window.__VCHECK_VIDEO_FRAMES__)?window.__VCHECK_VIDEO_FRAMES__:[];

    if(frames.length!==12){
      status.textContent=`Сейчас готово кадров: ${frames.length}. Дождитесь 12.`;
      return;
    }

    button.disabled=true;
    clearBadges(d);
    summary.style.display='none';
    summary.innerHTML='';
    window.__VCHECK_VIDEO_VISION__=[];

    let done=0;
    let next=0;
    const results=new Array(frames.length);
    status.textContent='Запускаем визуальный анализ…';

    async function worker(){
      while(true){
        const i=next++;
        if(i>=frames.length)return;
        const f=frames[i];
        const items=d.querySelectorAll('#vcheckVideoFrames .vf-item');
        const item=items[i];
        let badge=null;
        if(item){
          badge=d.createElement('span');
          badge.className='vf-ai';
          badge.textContent='ИИ…';
          item.appendChild(badge);
        }
        try{
          const imageBase64=await blobToBase64(f.blob);
          const result=await callVision({
            action:'videoVision',
            imageBase64,
            mimeType:f.mimeType||'image/jpeg',
            frameIndex:f.index,
            timeSeconds:f.timeSeconds
          });
          results[i]={
            index:f.index,
            timeSeconds:f.timeSeconds,
            analysis:result.analysis||null,
            model:result.model||null,
            imageBytes:result.imageBytes||f.size||null
          };
          if(badge){
            badge.className='vf-ai ok';
            badge.textContent=frameLabel(result);
          }
        }catch(error){
          results[i]={index:f.index,timeSeconds:f.timeSeconds,error:error?.message||'Ошибка анализа'};
          if(badge){
            badge.className='vf-ai err';
            badge.textContent='ошибка';
          }
        }finally{
          done++;
          status.textContent=`Анализируем кадры: ${done} из ${frames.length}…`;
        }
      }
    }

    await Promise.all(Array.from({length:MAX_CONCURRENCY},()=>worker()));
    window.__VCHECK_VIDEO_VISION__=results;

    const good=results.filter(x=>x&&!x.error);
    const failed=results.length-good.length;
    const lowerThird=good.filter(x=>x.analysis?.lowerThirdVisible===true).length;
    const people=good.filter(x=>x.analysis?.personOnCamera===true).length;
    const standup=good.filter(x=>x.analysis?.frameType==='standup').length;
    const interviews=good.filter(x=>x.analysis?.frameType==='interview').length;
    const shotTypes=[...new Set(good.map(x=>x.analysis?.shotType).filter(x=>x&&x!=='unknown'))];

    status.textContent=failed?`Готово: ${good.length} из ${results.length}; ошибок: ${failed}.`:`Готово: ИИ разобрал все ${good.length} кадров.`;
    summary.style.display='block';
    summary.innerHTML=`<b>Тест визуального анализа завершён.</b><br>Люди в кадре: ${people}/${good.length} · плашки: ${lowerThird}/${good.length} · вероятные стендапы: ${standup} · вероятные интервью: ${interviews}${shotTypes.length?` · планы: ${shotTypes.join(', ')}`:''}.<br><span style="color:#64748b">Это пока наблюдения по отдельным стоп-кадрам, а не финальные нарушения. Следующий этап — сопоставить их с таймкодами расшифровки.</span>`;
    button.disabled=false;
  }

  function refreshReadyState(d){
    const status=d.getElementById('vcheckVisionStatus');
    const button=d.getElementById('vcheckVisionButton');
    if(!status||!button)return;
    const frames=Array.isArray(window.__VCHECK_VIDEO_FRAMES__)?window.__VCHECK_VIDEO_FRAMES__:[];
    if(button.disabled)return;
    if(frames.length===12){
      status.textContent='12 кадров готовы. Можно запустить тест зрения.';
      button.disabled=false;
    }else{
      status.textContent=`Готовим кадры: ${frames.length}/12…`;
      button.disabled=true;
    }
  }

  function onLoad(){
    const frame=document.getElementById(FRAME_ID);
    if(!frame)return;
    const d=frame.contentDocument;
    if(!d)return;
    ensureStyles(d);
    const controls=ensureControls(d);
    if(!controls)return;
    const button=d.getElementById('vcheckVisionButton');
    button.addEventListener('click',()=>runVision(d));

    const framesBox=d.getElementById('vcheckVideoFrames');
    if(framesBox){
      const observer=new MutationObserver(()=>refreshReadyState(d));
      observer.observe(framesBox,{childList:true,subtree:true,characterData:true});
    }
    d.addEventListener('change',event=>{
      if(event.target?.id==='materialFile'){
        window.__VCHECK_VIDEO_VISION__=[];
        clearBadges(d);
        const summary=d.getElementById('vcheckVisionSummary');
        if(summary){summary.style.display='none';summary.innerHTML='';}
        setTimeout(()=>refreshReadyState(d),100);
      }
    },true);
    refreshReadyState(d);
  }

  const frame=document.getElementById(FRAME_ID);
  if(!frame)return;
  if(frame.contentDocument?.readyState==='complete')onLoad();
  frame.addEventListener('load',onLoad);
})();
