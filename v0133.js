/* MMT ДВИ v0.13.3 — route verdict + choice of next action; year no longer blocks route creation */
(function setupV0133(){
  const UNIS=window.MMT_UNIVERSITIES||{};
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.3';
  document.title='MMT ДВИ — v0.13.3';
  const route=document.getElementById('v132Route');if(!route)return;
  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.13.3] persist failed',e)}};

  const css=document.createElement('style');css.id='mmt-v0133-css';css.textContent=`
    .v133Verdict{background:#0c0c0c;color:#fff;border-radius:20px;padding:16px;margin:12px 0}.v133Verdict .eye{color:#aaa}.v133Verdict h3{font-size:22px;margin:6px 0}.v133Verdict p{color:#d0d0d0;font-size:13px;line-height:1.48;margin:7px 0 0}
    .v133Reason{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.v133Reason span{font-size:10px;border:1px solid #ffffff25;background:#ffffff12;border-radius:999px;padding:6px 8px}
    .v133Choices{display:grid;gap:9px;margin:13px 0}.v133Choice{width:100%;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:18px;padding:15px;text-align:left}.v133Choice.primary{background:var(--o);border-color:var(--o)}.v133Choice b{display:block;font:700 16px/1.25 Montserrat,Arial,sans-serif}.v133Choice span{display:block;color:var(--soft);font-size:12px;line-height:1.4;margin-top:4px}.v133Choice.primary span{color:#4a3024}.v133Choice .arrow{float:right;font-size:19px}
    .v133Optional{font-size:11px;color:var(--soft);margin-top:5px}.v133SaveOnly{display:block;width:100%;border:0;background:transparent;color:var(--soft);font-size:12px;padding:11px;text-align:center;text-decoration:underline;text-underline-offset:3px}
    #v132Route .v132First{display:none!important}#v132Route [data-v132-finish]{display:none!important}
  `;document.head.appendChild(css);

  function selected(){return (state.v132?.selectedIds||[]).map(id=>UNIS[id]).filter(Boolean)}
  function counts(list){
    const c={oral:0,written:0,test:0,portfolio:0};
    list.forEach(u=>{const f=[...(u.formats||[]),u.model||''].join(' ').toLowerCase();if(/собесед|коллоквиум/.test(f))c.oral++;if(/письмен|эссе|творческ/.test(f))c.written++;if(/тест/.test(f))c.test++;if(u.portfolio)c.portfolio++});
    return c;
  }
  function verdictFor(c,n){
    if(c.test>=2&&c.test>=c.oral&&c.test>=c.written)return{title:'Маршрут с сильным акцентом на тестирование',text:'Вам особенно важны системная теория, профессиональная терминология и регулярные короткие тренировки. Общая журналистская база всё равно нужна, но её стоит сразу связывать с тестовыми форматами.'};
    if(c.oral>=2&&c.written>=2)return{title:'Смешанный маршрут: писать и отвечать устно',text:'У выбранных вузов заметно различаются форматы. Вам понадобится общая база журналиста, но письменные работы, собеседования и портфолио лучше развивать параллельно, а не по очереди.'};
    if(c.oral>=2&&c.oral>c.written)return{title:'Главный акцент — собеседования и устная часть',text:'Большая часть ваших целей проверяет речь, кругозор, знание медиа и способность разговаривать с комиссией. Базовые практические навыки нужны, но устную подготовку стоит подключить рано.'};
    if(c.written>=2&&c.written>c.oral)return{title:'Главный акцент — письменные творческие работы',text:'В вашем наборе вузов особенно важны эссе и другие письменные форматы. Значит, базу стоит строить вокруг регулярного письма, фактуры, композиции и редактуры.'};
    if(c.portfolio>=Math.max(2,Math.ceil(n/2)))return{title:'Портфолио будет важной частью маршрута',text:'У значительной части выбранных вузов пригодятся публикации, творческая папка или подтверждённый опыт. Его лучше собирать с самого начала, одновременно с основной подготовкой.'};
    return{title:'Маршрут можно собрать вокруг общей журналистской базы',text:'Форматы выбранных ДВИ различаются, но у них есть общая основа: письмо, медиасреда, кругозор и практический опыт. После базы приложение подключит конкретные требования каждого вуза.'};
  }

  function upgrade(){
    route.querySelector('.v133Verdict')?.remove();route.querySelector('.v133Choices')?.remove();route.querySelector('.v133SaveOnly')?.remove();
    const list=selected(),c=counts(list),v=verdictFor(c,list.length);
    const summary=route.querySelector('.v132Summary');if(!summary)return;
    const verdict=document.createElement('div');verdict.className='v133Verdict';verdict.innerHTML=`<div class="eye">Общий вердикт</div><h3>${safe(v.title)}</h3><p>${safe(v.text)}</p><div class="v133Reason">${c.oral?`<span>устные · ${c.oral}</span>`:''}${c.written?`<span>письменные · ${c.written}</span>`:''}${c.test?`<span>тесты · ${c.test}</span>`:''}${c.portfolio?`<span>портфолио · ${c.portfolio}</span>`:''}</div>`;
    summary.insertAdjacentElement('afterend',verdict);

    const y=route.querySelector('.v132Year');if(y){const p=y.querySelector('.meta');if(p)p.textContent='Можно указать сейчас или позже. Год нужен только для темпа подготовки и будущего счётчика до экзамена.';if(!y.querySelector('.v133Optional')){const o=document.createElement('div');o.className='v133Optional';o.textContent='Маршрут сформируется и без этого шага.';y.appendChild(o)}}

    const choices=document.createElement('div');choices.className='v133Choices';choices.innerHTML=`
      <button type="button" class="v133Choice primary" data-v133-action="prepare"><span class="arrow">›</span><b>Начать подготовку с базы</b><span>Получить первое базовое задание; специфика выбранных ДВИ будет подключаться по ходу.</span></button>
      <button type="button" class="v133Choice" data-v133-action="unis"><span class="arrow">›</span><b>Сначала разобрать требования моих вузов</b><span>Посмотреть выбранные цели и подробнее понять формат каждого ДВИ.</span></button>
      ${c.portfolio?`<button type="button" class="v133Choice" data-v133-action="portfolio"><span class="arrow">›</span><b>Сначала посмотреть портфолио</b><span>Разобраться, какие работы и подтверждения опыта уже есть и что стоит начать собирать.</span></button>`:''}`;
    verdict.insertAdjacentElement('afterend',choices);
    const save=document.createElement('button');save.type='button';save.className='v133SaveOnly';save.dataset.v133Action='home';save.textContent='Сохранить маршрут и перейти на Главную';choices.insertAdjacentElement('afterend',save);
  }

  function finalize(target){
    const ids=new Set(state.v132?.selectedIds||[]);if(!ids.size)return;
    Object.values(UNIS).forEach(u=>{if(u.stateKey)state[u.stateKey]=ids.has(u.id)});
    state.v13Onboarding=state.v13Onboarding&&typeof state.v13Onboarding==='object'?state.v13Onboarding:{};
    state.v13Onboarding.year=state.v132.year||'';state.v13Onboarding.selectedIds=[...ids];state.v13Onboarding.mode=state.v132.mode;state.v13Onboarding.geo=state.v132.geo;
    state.v13OnboardingComplete=true;state.v132JustStarted=false;state.v127Demo=false;
    state.v133RouteVerdict={createdAt:new Date().toISOString(),universityIds:[...ids],year:state.v132.year||'',nextChoice:target};
    persist();
    document.body.classList.remove('v132-onboarding','v13-onboarding');
    const dock=document.getElementById('mmtBottomDock');if(dock)dock.style.setProperty('display','block','important');
    if(typeof window.renderV10==='function')window.renderV10();if(typeof window.refresh==='function')window.refresh();
    let screen='home';
    if(target==='prepare'&&document.getElementById('prepare'))screen='prepare';
    if(target==='unis')screen=document.getElementById('myUniversities')?'myUniversities':'uniCatalog';
    if(target==='portfolio')screen=document.getElementById('portfolio2Hub')?'portfolio2Hub':'home';
    if(typeof window.go==='function')window.go(screen);
    if(typeof toast==='function')toast('Маршрут сохранён');
  }

  document.addEventListener('click',e=>{const b=e.target.closest('[data-v133-action]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();finalize(b.dataset.v133Action)},true);
  new MutationObserver(()=>requestAnimationFrame(upgrade)).observe(route,{childList:true,subtree:false});
  document.addEventListener('click',e=>{if(e.target.closest('[data-v132-year]'))setTimeout(upgrade,0)},true);
  upgrade();
})();
