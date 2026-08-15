/* MMT ДВИ v0.8.1 — последовательное прохождение медиасреды */
(function setupV081(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.8.1';
  document.title='MMT ДВИ — v0.8.1';

  state.mediaProgress = state.mediaProgress || {ratingsDone:false,regionSkipped:false};

  const steps=[
    {id:'mediaRecall',label:'Вспомнить без подсказок'},
    {id:'mediaRatings',label:'Свериться с рейтингами'},
    {id:'mediaClouds',label:'Медиаоблака'},
    {id:'mediaDiet',label:'Выбрать 5 СМИ + 5 журналистов'},
    {id:'regionalMedia',label:'Добавить регион'},
    {id:'agendaWeek',label:'Следить за повесткой'}
  ];

  const css=document.createElement('style');
  css.textContent=`
    .agendaStep.locked{opacity:.48;cursor:not-allowed;background:#f4f3f0}.agendaStep.locked .n{background:#e4e2dd;color:#777}.agendaStep.locked .lockmark{font-size:16px}.agendaStep.doneStep{border-color:#bddac6;background:#f5fbf7}.agendaStep.doneStep .n{background:var(--g);color:#fff}.gateNote{display:flex;gap:9px;align-items:flex-start;background:#f2f1ee;border-radius:13px;padding:11px;margin:10px 0;font-size:12px}.gateNote b{flex:0 0 auto}.completeBtn{margin-top:10px}.gateSuccess{background:var(--gb);color:var(--g);border-radius:13px;padding:11px;margin:10px 0;font-size:12px;font-weight:700}
  `;
  document.head.appendChild(css);

  function lines(s){return (s||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)}
  function done(i){
    if(i===0) return lines(state.mediaRecall?.media).length>0 && lines(state.mediaRecall?.journalists).length>0;
    if(i===1) return !!state.mediaProgress.ratingsDone;
    if(i===2) return Array.isArray(state.mediaClouds) && state.mediaClouds.length>0;
    if(i===3) return (state.mediaDiet?.media?.length||0)>=5 && (state.mediaDiet?.journalists?.length||0)>=5;
    if(i===4) return !!(state.mediaDiet?.region||'').trim() || !!state.mediaProgress.regionSkipped;
    if(i===5) return Object.keys(state.agendaDone||{}).length>0;
    return false;
  }
  function unlocked(i){return i===0 || done(i-1)}

  function addControls(){
    const ratings=document.getElementById('mediaRatings');
    if(ratings&&!document.getElementById('ratingsCompleteBtn')){
      const btn=document.createElement('button');btn.id='ratingsCompleteBtn';btn.className='btn completeBtn';btn.textContent='Я сверился и дополнил свою карту';btn.onclick=()=>{state.mediaProgress.ratingsDone=true;saveState();toast('Шаг 2 выполнен — медиаоблака открыты');renderGate()};ratings.appendChild(btn);
      const note=document.createElement('div');note.className='gateNote';note.innerHTML='<b>Важно:</b><span>Отметьте шаг выполненным только после того, как действительно просмотрели рейтинги и выписали то, что забыли.</span>';ratings.insertBefore(note,btn);
    }

    const regional=document.getElementById('regionalMedia');
    if(regional&&!document.getElementById('skipRegionBtn')){
      const btn=document.createElement('button');btn.id='skipRegionBtn';btn.className='btn secondary completeBtn';btn.textContent='Региональный контур мне сейчас не нужен';btn.onclick=()=>{state.mediaProgress.regionSkipped=true;saveState();toast('Шаг 5 отмечен — повестка открыта');renderGate()};regional.appendChild(btn);
    }
  }

  function renderGate(){
    const hub=document.getElementById('agendaHub');
    if(hub){
      hub.querySelectorAll('.agendaStep').forEach((el,i)=>{
        const isDone=done(i),isOpen=unlocked(i);
        el.classList.toggle('locked',!isOpen);
        el.classList.toggle('doneStep',isDone);
        el.classList.toggle('current',isOpen&&!isDone);
        const tail=el.lastElementChild;
        if(tail)tail.innerHTML=!isOpen?'🔒':isDone?'✓':'›';
        el.dataset.locked=isOpen?'0':'1';
      });
      let note=document.getElementById('mediaGateStatus');
      if(!note){note=document.createElement('div');note.id='mediaGateStatus';note.className='gateNote';hub.querySelector('.agendaPath')?.after(note)}
      const first=steps.findIndex((_,i)=>!done(i));
      note.innerHTML=first<0?'<b>Маршрут пройден.</b><span>Можно возвращаться к любому шагу и обновлять свою медиасреду.</span>':`<b>Сейчас:</b><span>${first+1}. ${steps[first].label}. Следующий шаг откроется после выполнения этого.</span>`;
    }
    const rb=document.getElementById('ratingsCompleteBtn');if(rb){rb.textContent=state.mediaProgress.ratingsDone?'✓ Сверка с рейтингами выполнена':'Я сверился и дополнил свою карту';rb.disabled=!!state.mediaProgress.ratingsDone}
    const skip=document.getElementById('skipRegionBtn');if(skip){skip.textContent=state.mediaProgress.regionSkipped?'✓ Региональный контур пропущен осознанно':'Региональный контур мне сейчас не нужен'}
  }

  document.addEventListener('click',e=>{
    const step=e.target.closest('#agendaHub .agendaStep');
    if(step&&step.dataset.locked==='1'){
      e.preventDefault();e.stopImmediatePropagation();
      const idx=[...document.querySelectorAll('#agendaHub .agendaStep')].indexOf(step);
      const prev=Math.max(0,idx-1);
      toast('Сначала завершите шаг '+(prev+1)+': '+steps[prev].label);
    }
  },true);

  // Убираем обходные кнопки «дальше» внутри экранов, если следующий этап ещё закрыт.
  document.addEventListener('click',e=>{
    const go=e.target.closest('[data-go]');if(!go)return;
    const idx=steps.findIndex(s=>s.id===go.dataset.go);
    if(idx>0&&!unlocked(idx)){
      e.preventDefault();e.stopImmediatePropagation();toast('Сначала завершите предыдущий этап медиатренировки');
    }
  },true);

  const oldSaveRecall=window.saveMediaRecall;
  window.saveMediaRecall=function(){
    const m=document.getElementById('recallMedia')?.value||'',j=document.getElementById('recallJournalists')?.value||'';
    if(!lines(m).length||!lines(j).length){toast('Заполните обе колонки: хотя бы одно СМИ и одного журналиста');return}
    oldSaveRecall?.();renderGate();
  };
  const oldAddCloud=window.addMediaCloud;window.addMediaCloud=function(){oldAddCloud?.();renderGate()};
  const oldAddDiet=window.addDietItem;window.addDietItem=function(type){oldAddDiet?.(type);setTimeout(renderGate,0)};
  const oldRemoveDiet=window.removeDietItem;window.removeDietItem=function(type,i){oldRemoveDiet?.(type,i);setTimeout(renderGate,0)};
  const oldSaveRegion=window.saveRegion;window.saveRegion=function(){oldSaveRegion?.();if((state.mediaDiet?.region||'').trim())state.mediaProgress.regionSkipped=false;saveState();renderGate()};

  const oldRefresh=window.refresh;
  if(typeof oldRefresh==='function')window.refresh=function(){oldRefresh();addControls();renderGate()};
  addControls();renderGate();
})();
