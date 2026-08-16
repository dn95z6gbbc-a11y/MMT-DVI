/* MMT ДВИ v0.13.3 — route is actually created; no dead CTA */
(function setupV0133(){
  const UNIS=window.MMT_UNIVERSITIES||{};
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.3';
  document.title='MMT ДВИ — v0.13.3';
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.13.3] persist failed',e)}};
  const routeScreen=document.getElementById('v132Route');
  if(!routeScreen)return;

  const css=document.createElement('style');css.id='mmt-v0133-css';css.textContent=`
    .v133Plan{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:12px 0}.v133Plan h3{margin-bottom:8px}.v133PlanItem{display:grid;grid-template-columns:28px 1fr;gap:9px;align-items:start;padding:8px 0;border-top:1px solid #eee}.v133PlanItem:first-of-type{border-top:0}.v133PlanItem .n{width:26px;height:26px;border-radius:9px;background:var(--muted);display:grid;place-items:center;font-weight:800}.v133PlanItem b{display:block;font-size:13px}.v133PlanItem small{display:block;color:var(--soft);line-height:1.35;margin-top:2px}.v133YearHint{display:none;background:var(--os);border:1px solid var(--o);border-radius:12px;padding:10px 12px;margin:8px 0;font-size:12px}.v133YearHint.show{display:block}.v133Cta{margin-top:14px!important}
  `;document.head.appendChild(css);

  function selectedUnis(){return (state.v132?.selectedIds||[]).map(id=>UNIS[id]).filter(Boolean)}
  function buildRoute(){
    const list=selectedUnis();
    const all=[...new Set(list.flatMap(u=>[...(u.formats||[]),u.model||'']).map(x=>String(x).toLowerCase()))].join(' ');
    const modules=[
      {id:'base-news',title:'Новости',desc:'Лид, структура новости и регулярная практика.'},
      {id:'base-reportage',title:'Репортаж',desc:'Сбор информации на месте, герои, детали и текст.'},
      {id:'base-interview',title:'Интервью',desc:'Подготовка вопросов, разговор и работа с ответами.'},
      {id:'base-video',title:'Видеожурналистика',desc:'Событийный и тематический видеосюжет.'},
      {id:'base-article',title:'Большой журналистский материал',desc:'Исследование, эксперты, герои и собственная работа с темой.'},
      {id:'media',title:'СМИ, журналисты и актуальная повестка',desc:'То, что понадобится для собеседований, эссе и общей профессиональной подготовки.'}
    ];
    if(/письмен|эссе|творческ/.test(all))modules.push({id:'written',title:'Письменные ДВИ выбранных вузов',desc:'Отдельная тренировка форматов и критериев каждого выбранного университета.'});
    if(/собесед|коллоквиум/.test(all))modules.push({id:'oral',title:'Собеседования и коллоквиумы',desc:'Общая устная подготовка + специфика конкретных комиссий.'});
    if(/тест/.test(all))modules.push({id:'test',title:'Тестовые ДВИ',desc:'Тематические блоки и пробные тестирования для выбранных вузов.'});
    if(list.some(u=>u.portfolio))modules.push({id:'portfolio',title:'Портфолио',desc:'Собрать работы и затем упаковать их под требования конкретных вузов.'});
    return {createdAt:new Date().toISOString(),year:state.v132?.year||'',universityIds:list.map(u=>u.id),modules};
  }

  function planHtml(){
    const route=buildRoute();
    return `<div id="v133Plan" class="v133Plan"><h3>Что войдёт в вашу подготовку</h3><p class="meta">Это уже ваш маршрут по выбранным вузам. Содержание уроков мы будем наполнять глубже, но структура программы формируется сейчас.</p>${route.modules.map((m,i)=>`<div class="v133PlanItem"><div class="n">${i+1}</div><div><b>${m.title}</b><small>${m.desc}</small></div></div>`).join('')}</div>`;
  }

  function patchRoute(){
    if(!routeScreen.classList.contains('active')&&!routeScreen.innerHTML)return;
    const first=routeScreen.querySelector('.v132First');
    if(first&&!document.getElementById('v133Plan'))first.insertAdjacentHTML('beforebegin',planHtml());
    const old=routeScreen.querySelector('[data-v132-finish]');
    if(old){
      const year=state.v132?.year||'';
      const b=document.createElement('button');b.type='button';b.id='v133Finish';b.className='btn v133Cta';b.textContent=year?'Сохранить маршрут и перейти дальше':'Создать маршрут и начать';
      old.replaceWith(b);
      if(!document.getElementById('v133YearHint'))b.insertAdjacentHTML('beforebegin','<div id="v133YearHint" class="v133YearHint">Выберите год поступления выше — он нужен только для темпа подготовки.</div>');
    }
    routeScreen.querySelectorAll('[data-v132-year]').forEach(btn=>btn.classList.toggle('active',btn.dataset.v132Year===state.v132?.year));
  }

  function finishRoute(){
    if(!(state.v132?.selectedIds||[]).length)return;
    if(!state.v132.year){
      const hint=document.getElementById('v133YearHint');if(hint)hint.classList.add('show');
      const yearBox=routeScreen.querySelector('.v132Year');if(yearBox)yearBox.scrollIntoView({behavior:'smooth',block:'center'});
      if(typeof toast==='function')toast('Сначала выберите год поступления');
      return;
    }
    const ids=new Set(state.v132.selectedIds);
    Object.values(UNIS).forEach(u=>{if(u.stateKey)state[u.stateKey]=ids.has(u.id)});
    state.v133Route=buildRoute();
    state.v13Onboarding=state.v13Onboarding&&typeof state.v13Onboarding==='object'?state.v13Onboarding:{};
    state.v13Onboarding.year=state.v132.year;
    state.v13Onboarding.selectedIds=[...ids];
    state.v13Onboarding.mode=state.v132.mode;
    state.v13Onboarding.geo=state.v132.geo;
    state.v13OnboardingComplete=true;
    state.v132JustStarted=true;
    state.v127Demo=false;
    persist();
    document.body.classList.remove('v132-onboarding','v13-onboarding');
    const dock=document.getElementById('mmtBottomDock');if(dock)dock.style.setProperty('display','block','important');
    if(typeof window.renderV10==='function')window.renderV10();
    if(typeof window.refresh==='function')window.refresh();
    if(typeof window.go==='function')window.go('home');
    if(typeof toast==='function')toast('Маршрут создан');
  }
  window.MMT_finishRouteV133=finishRoute;

  routeScreen.addEventListener('click',e=>{
    const y=e.target.closest('[data-v132-year]');
    if(y){
      state.v132.year=y.dataset.v132Year;persist();
      setTimeout(patchRoute,0);
      const hint=document.getElementById('v133YearHint');if(hint)hint.classList.remove('show');
      return;
    }
    if(e.target.closest('#v133Finish')){e.preventDefault();e.stopPropagation();finishRoute()}
  });

  const observer=new MutationObserver(()=>requestAnimationFrame(patchRoute));
  observer.observe(routeScreen,{childList:true,subtree:true});
  patchRoute();
})();
