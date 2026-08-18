/* MMT ДВИ v0.15.2 — choose reportage type before preparation */
(function setupV0152(){
  if(typeof state==='undefined') return;
  const main=document.querySelector('main');
  if(!main) return;

  const VER='v0.15.2';
  const ver=document.querySelector('.ver'); if(ver) ver.textContent=VER;
  document.title='MMT ДВИ — '+VER;

  state.v150Reportage=state.v150Reportage&&typeof state.v150Reportage==='object'?state.v150Reportage:{};
  const R=state.v150Reportage;
  R.prep=R.prep||{}; R.field=R.field||{}; R.draft=R.draft||{};

  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.15.2] persist failed',e)}};
  const go=id=>{if(typeof window.go==='function')window.go(id)};
  const notify=msg=>{if(typeof toast==='function')toast(msg);else console.log(msg)};

  let typeScreen=document.getElementById('reportType152');
  if(!typeScreen){typeScreen=document.createElement('section');typeScreen.id='reportType152';typeScreen.className='screen';main.appendChild(typeScreen)}

  const css=document.createElement('style');css.id='mmt-v0152-css';css.textContent=`
    .rep152Hero{background:#0c0c0c;color:#fff;border-radius:22px;padding:18px;margin:10px 0}.rep152Hero .meta{color:#bbb}.rep152Hero h2{font-size:27px;margin:5px 0 7px}.rep152Hero p{color:#d4d4d4;font-size:12px;line-height:1.5}
    .rep152Choices{display:grid;gap:10px;margin:12px 0}.rep152Type{width:100%;text-align:left;background:#fff;border:2px solid var(--line);border-radius:18px;padding:14px;color:var(--ink)}.rep152Type.active{border-color:var(--o);background:var(--os)}.rep152Type h3{font-size:19px;margin:0 0 5px}.rep152Type p{font-size:11px;line-height:1.45;color:var(--soft);margin:0}.rep152Type ul{margin:9px 0 0;padding-left:17px}.rep152Type li{font-size:11px;line-height:1.4;margin:4px 0}.rep152Badge{display:inline-block;font-size:9px;font-weight:800;background:var(--muted);border-radius:999px;padding:5px 7px;margin-bottom:7px}.rep152Type.active .rep152Badge{background:#fff}
    .rep152Explain{border-radius:16px;padding:12px 13px;background:#fff3ea;border:1px solid #eab896;font-size:11px;line-height:1.5;margin:10px 0}.rep152Explain b{display:block;margin-bottom:4px}.rep152Summary{background:var(--os);border:1px solid #eab896;border-radius:15px;padding:11px 12px;margin:10px 0;font-size:11px;line-height:1.45}.rep152SummaryHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.rep152SummaryHead b{font-size:13px}.rep152Change{border:0;background:#fff;border-radius:10px;padding:7px 9px;font-size:9px;font-weight:800;white-space:nowrap}.rep152Context{border-left:4px solid var(--o);background:var(--os);border-radius:0 13px 13px 0;padding:10px 12px;margin:10px 0;font-size:11px;line-height:1.45}.rep152Context b{display:block;margin-bottom:3px}
  `;document.head.appendChild(css);

  const typeInfo={
    event:{
      title:'Событийный репортаж',
      short:'Конкретное событие с понятным временем и развитием.',
      examples:'матч, фестиваль, открытие, заседание, акция, премьера',
      influence:'Каркас материала держится на развитии события: что было до, что происходило во время, что изменилось к финалу. На месте особенно важны поворотные моменты, реакции разных людей, сцены и итог.',
      prep:'Планируйте не только «что спросить», но и что увидеть до начала, в ключевые моменты и после события. Ищите людей с разными ролями: организаторов, участников, зрителей, очевидцев.',
      field:'Собирайте хронологию, сильные сцены, изменения по ходу события и финал. Текст не обязан быть поминутным, но читатель должен чувствовать развитие происходящего.',
      draft:'У текста есть событийная дуга. Сцена может открыть материал, затем факты и комментарии двигают читателя через развитие события к естественному финалу.'
    },
    thematic:{
      title:'Тематический репортаж',
      short:'Тема раскрывается через реальное место, среду, людей и наблюдение.',
      examples:'жизнь общежития, работа редакции изнутри, день в службе, жизнь района, устройство сообщества',
      influence:'Хронология одного события не обязательна. Каркас строится на сценах, героях, деталях и разных сторонах темы. Личное присутствие всё равно обязательно: репортаж нельзя заменить пересказом чужих слов.',
      prep:'Определите, где тему можно увидеть в действии, какие люди покажут её с разных сторон, какие процессы, рутины, детали и контрасты нужно наблюдать лично. Запланируйте конкретное время работы на месте.',
      field:'Фиксируйте не «что произошло от начала до конца», а сцены и процессы, которые раскрывают тему. Нужны разные герои, точные детали, реплики и проверяемые факты.',
      draft:'Не обязателен ход «сначала → потом → финал события». Текст может двигаться от сцены к сцене и от героя к герою, но каждая часть должна раскрывать одну общую тему и вести к естественному завершению.'
    }
  };

  function selected(){return R.prep.reportType==='event'||R.prep.reportType==='thematic'?R.prep.reportType:''}
  function workStarted(){return !!((R.prep.eventName||'').trim()||(R.field.whatHappened||'').trim()||(R.draft.text||'').trim()||R.submitted)}

  function renderTypeScreen(){
    const current=selected();
    typeScreen.innerHTML=`<div class="eye">Текстовый репортаж · перед подготовкой</div>
      <div class="rep152Hero"><div class="meta">Сначала определяем логику материала</div><h2>Какой репортаж вы делаете?</h2><p>Текстовый репортаж может быть событийным или тематическим. Оба требуют личной работы на месте, наблюдения, людей, фактов и собственных фотографий — но собирать и строить материал нужно по-разному.</p></div>
      <div class="rep152Choices">
        <button type="button" class="rep152Type ${current==='event'?'active':''}" data-rep152-type="event"><span class="rep152Badge">вариант 1</span><h3>Событийный</h3><p>${typeInfo.event.short}</p><ul><li><b>Примеры:</b> ${typeInfo.event.examples}.</li><li><b>Основа:</b> развитие «до → во время → после».</li></ul></button>
        <button type="button" class="rep152Type ${current==='thematic'?'active':''}" data-rep152-type="thematic"><span class="rep152Badge">вариант 2</span><h3>Тематический</h3><p>${typeInfo.thematic.short}</p><ul><li><b>Примеры:</b> ${typeInfo.thematic.examples}.</li><li><b>Основа:</b> сцены, герои, процессы и разные стороны одной темы.</li></ul></button>
      </div>
      <div class="rep152Explain" data-rep152-explain>${current?`<b>Как это повлияет на работу</b>${typeInfo[current].influence}`:'<b>Это не просто метка</b>После выбора приложение меняет подсказки в плане выхода, полевых заметках и черновике: для событийного сильнее следит за развитием события, для тематического — за раскрытием темы через сцены, героев и наблюдение.'}</div>
      ${workStarted()?'<div class="rep151Warn"><b>Работа уже начата.</b> Смена типа не удалит ваши поля и фотографии, но изменит подсказки и логику самопроверки. Проверьте, соответствует ли собранный материал новому типу.</div>':''}
      <div class="rep150Actions"><button class="btn" data-rep152-confirm ${current?'':'disabled'}>Продолжить к плану выхода →</button><button class="btn secondary" data-rep152-back>← К модулю</button></div>`;
    go('reportType152');
  }

  function typeSummary(type){const i=typeInfo[type];return `<div class="rep152Summary" id="rep152TypeSummary" data-rep152-summary-type="${type}"><div class="rep152SummaryHead"><div><span class="rep152Badge">Выбран тип</span><br><b>${i.title}</b></div><button type="button" class="rep152Change" data-rep152-change>Изменить</button></div><div style="margin-top:6px">${i.influence}</div></div>`}
  function setHTML(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}
  function labelFor(el,text){const f=el?.closest('.rep150Field');const l=f?.querySelector('label');if(l&&l.textContent.trim()!==text.trim())l.textContent=text}
  function replaceCheck(screen,key,text){const input=screen?.querySelector(`[data-rep150-prep-check="${key}"],[data-rep150-field-check="${key}"],[data-rep150-draft-check="${key}"]`);const label=input?.closest('label');if(label&&label.textContent.trim()!==text.trim()){[...label.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>n.remove());label.append(document.createTextNode(text))}}

  function patchPrepContext(){
    const s=document.getElementById('reportPrep150');if(!s||!s.innerHTML)return;
    const type=selected();if(!type)return;
    const hero=s.querySelector('.rep150StageHero');
    let sum=s.querySelector('#rep152TypeSummary');
    if(!sum&&hero){hero.insertAdjacentHTML('afterend',typeSummary(type));sum=s.querySelector('#rep152TypeSummary')}
    else if(sum&&sum.dataset.rep152SummaryType!==type){sum.outerHTML=typeSummary(type)}

    const old=s.querySelector('#rep151PrepExtra');
    if(old){const h=old.querySelector('h3');if(h&&h.textContent!=='Доступ и согласование')h.textContent='Доступ и согласование';const typeField=old.querySelector('[data-rep151-type]')?.closest('.rep150Field');if(typeField&&typeField.style.display!=='none')typeField.style.display='none'}

    let ctx=s.querySelector('#rep152PrepContext');if(!ctx&&hero){ctx=document.createElement('div');ctx.id='rep152PrepContext';ctx.className='rep152Context';hero.after(ctx)}
    setHTML(ctx,`<b>${typeInfo[type].title}: что меняется в подготовке</b>${typeInfo[type].prep}`);

    const eventName=s.querySelector('[data-rep150-prep="eventName"]');
    const dateTime=s.querySelector('[data-rep150-prep="dateTime"]');
    const access=s.querySelector('[data-rep150-prep="access"]');
    const goal=s.querySelector('[data-rep150-prep="goal"]');
    const people=s.querySelector('[data-rep150-prep="people"]');
    const obs=s.querySelector('[data-rep150-prep="observations"]');
    if(type==='event'){
      labelFor(eventName,'На какое реальное событие вы идёте?');eventName?.setAttribute('placeholder','Матч, фестиваль, заседание, открытие…');
      labelFor(dateTime,'Когда проходит событие?');dateTime?.setAttribute('placeholder','Дата и время');
      labelFor(access,'Как вы попадёте на событие и получите доступ к людям / съёмке?');
      labelFor(goal,'Что нужно увидеть и понять своими глазами по ходу события?');
      labelFor(people,'Кого нужно найти и с кем поговорить до, во время или после события?');
      labelFor(obs,'Какие поворотные сцены или моменты важно не пропустить?');
      replaceCheck(s,'real','Это реальное событие, а не придуманная ситуация.');
      replaceCheck(s,'attend','Я действительно собираюсь присутствовать на событии лично.');
    }else{
      labelFor(eventName,'Какую тему, место или среду вы исследуете?');eventName?.setAttribute('placeholder','Например: как живёт общежитие / как устроена работа редакции');
      labelFor(dateTime,'Когда вы будете работать на месте?');dateTime?.setAttribute('placeholder','Дата и время выхода / наблюдения');
      labelFor(access,'Как вы попадёте внутрь среды и получите возможность наблюдать и разговаривать с людьми?');
      labelFor(goal,'Какие проявления темы нужно увидеть и понять своими глазами?');
      labelFor(people,'Кого нужно найти, чтобы показать тему с разных сторон?');
      labelFor(obs,'Какие сцены, процессы, рутины, детали или контрасты важно заметить?');
      replaceCheck(s,'real','Это реальная тема, место или среда, а не придуманная ситуация.');
      replaceCheck(s,'attend','Я действительно собираюсь работать на месте лично, а не собирать материал только дистанционно.');
      const toField=s.querySelector('[data-rep150-to-field]');if(toField&&toField.textContent!=='Я уже собрал(а) материал на месте →')toField.textContent='Я уже собрал(а) материал на месте →';
    }
  }

  function patchFieldContext(){
    const s=document.getElementById('reportField150');if(!s||!s.innerHTML)return;const type=selected();if(!type)return;
    const hero=s.querySelector('.rep150StageHero');let ctx=s.querySelector('#rep152FieldContext');if(!ctx&&hero){ctx=document.createElement('div');ctx.id='rep152FieldContext';ctx.className='rep152Context';hero.after(ctx)}setHTML(ctx,`<b>${typeInfo[type].title}: что собирать</b>${typeInfo[type].field}`);
    const what=s.querySelector('[data-rep150-field="whatHappened"]');const opening=s.querySelector('[data-rep150-field="openingScene"]');const ending=s.querySelector('[data-rep150-field="ending"]');
    if(type==='event'){
      labelFor(what,'Что произошло от начала до конца?');labelFor(opening,'Какая реальная сцена сильнее всего вводит в событие?');labelFor(ending,'Чем событие закончилось или что изменилось к финалу?');
      replaceCheck(s,'wasThere','Я лично присутствовал(а) на событии.');replaceCheck(s,'talked','Я разговаривал(а) с людьми, связанными с событием.');
    }else{
      labelFor(what,'Какие сцены и процессы вы наблюдали, которые раскрывают тему?');labelFor(opening,'Какая реальная сцена сильнее всего вводит в тему?');labelFor(ending,'Какой эпизод, наблюдение или изменение может естественно завершить материал?');
      replaceCheck(s,'wasThere','Я лично работал(а) на месте и наблюдал(а) тему в реальной среде.');replaceCheck(s,'talked','Я разговаривал(а) с людьми, которые помогают раскрыть тему с разных сторон.');
    }
  }

  function patchDraftContext(){
    const s=document.getElementById('reportDraft150');if(!s||!s.innerHTML)return;const type=selected();if(!type)return;
    const hero=s.querySelector('.rep150StageHero');let ctx=s.querySelector('#rep152DraftContext');if(!ctx&&hero){ctx=document.createElement('div');ctx.id='rep152DraftContext';ctx.className='rep152Context';hero.after(ctx)}setHTML(ctx,`<b>${typeInfo[type].title}: как собирать текст</b>${typeInfo[type].draft}`);
    replaceCheck(s,'eventClear',type==='event'?'Понятно, что это за событие, где и когда оно происходит.':'Понятно, какую тему раскрывает репортаж, где и когда журналист работал на месте.');
    replaceCheck(s,'ending',type==='event'?'Есть естественное завершение события, а не искусственная мораль.':'Есть естественное завершение темы или последняя значимая сцена, а не искусственная мораль.');
  }

  function patchHub(){
    const hub=document.getElementById('reportCourse150');if(!hub||!hub.innerHTML)return;
    const work=hub.querySelector('.rep150Work');if(work&&!work.querySelector('.rep152HubNote')){const p=document.createElement('div');p.className='rep152HubNote rep150Hint';p.style.marginTop='7px';p.textContent='Перед планом выхода выберите тип: событийный или тематический. От этого изменятся подсказки для сбора материала и сборки текста.';work.querySelector('p')?.after(p)}
    const b=hub.querySelector('[data-rep150-open-work]');if(b&&!R.prep.typeConfirmed152&&!workStarted()&&b.textContent!=='Выбрать тип и начать →')b.textContent='Выбрать тип и начать →';
  }

  function patchAll(){patchHub();patchPrepContext();patchFieldContext();patchDraftContext()}

  let bypass=false;
  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-rep150-open-work]');
    if(open&&!bypass&&!workStarted()&&!R.prep.typeConfirmed152){e.preventDefault();e.stopImmediatePropagation();renderTypeScreen();return}
    const change=e.target.closest('[data-rep152-change]');if(change){e.preventDefault();renderTypeScreen();return}
    const t=e.target.closest('[data-rep152-type]');if(t){e.preventDefault();R.prep.reportType=t.dataset.rep152Type;persist();renderTypeScreen();return}
    if(e.target.closest('[data-rep152-back]')){e.preventDefault();const hub=document.getElementById('reportCourse150');if(hub)go('reportCourse150');return}
    if(e.target.closest('[data-rep152-confirm]')){
      e.preventDefault();const type=selected();if(!type)return notify('Сначала выберите тип репортажа');R.prep.typeConfirmed152=true;persist();
      const hub=document.getElementById('reportCourse150');const btn=hub?.querySelector('[data-rep150-open-work]');
      if(btn){bypass=true;btn.click();setTimeout(()=>{bypass=false;patchAll()},0)}else{go('reportPrep150');setTimeout(patchAll,0)}
      return;
    }
  },true);

  const observer=new MutationObserver(()=>requestAnimationFrame(patchAll));
  observer.observe(main,{subtree:true,childList:true});
  setTimeout(patchAll,0);
})();
