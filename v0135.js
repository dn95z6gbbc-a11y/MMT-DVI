/* MMT ДВИ v0.13.5 — persistent adaptive route: selected universities are the source of truth */
(function setupV0135(){
  const UNIS=window.MMT_UNIVERSITIES||{};
  const main=document.querySelector('main');
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.5';
  document.title='MMT ДВИ — v0.13.5';
  if(!main)return;

  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.13.5] persist failed',e)}};

  const css=document.createElement('style');css.id='mmt-v0135-css';css.textContent=`
    .route135Hero{background:#0c0c0c;color:#fff;border-radius:22px;padding:17px;margin:11px 0}.route135Hero .meta{color:#bbb}.route135Hero h2{margin:5px 0 7px;font-size:27px}.route135Targets{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.route135Targets span{border:1px solid #ffffff28;background:#ffffff12;border-radius:999px;padding:7px 9px;font-size:11px}
    .route135Verdict{background:var(--os);border-radius:18px;padding:14px;margin:10px 0}.route135Verdict h3{font-size:19px;margin:4px 0 6px}.route135Verdict p{font-size:12px;line-height:1.45;margin:0;color:var(--soft)}
    .route135Section{margin:18px 0 8px}.route135Section h3{margin-bottom:3px}.route135Module{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;margin:8px 0;display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:start}.route135Module .num{width:32px;height:32px;border-radius:10px;background:var(--muted);display:grid;place-items:center;font-weight:800;font-size:12px}.route135Module b{font-size:13px;line-height:1.3}.route135Module small{display:block;color:var(--soft);font-size:11px;line-height:1.4;margin-top:4px}.route135Module .tag{font-size:9px;padding:5px 7px;border-radius:999px;background:var(--muted);white-space:nowrap}.route135Module.specific{border-color:#efc1a9}.route135Module.specific .num{background:var(--os)}
    .route135Uni{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;margin:8px 0}.route135Uni h3{margin:0 0 4px}.route135Uni p{font-size:12px;line-height:1.4;margin:6px 0}.route135Tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.route135Tags span{font-size:9px;background:var(--muted);border-radius:999px;padding:5px 7px}
    .route135Actions{display:grid;gap:8px;margin:13px 0}.route135Actions .btn{margin:0}.route135Note{font-size:11px;color:var(--soft);line-height:1.4;margin:8px 0}.route135Empty{background:var(--muted);border-radius:18px;padding:16px;margin:12px 0}
    #v135HomeRoute{border:2px solid var(--o);background:#fff}.route135HomeTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.route135HomeTop h3{margin:3px 0 5px}.route135HomeTargets{display:flex;gap:5px;flex-wrap:wrap;margin:9px 0}.route135HomeTargets span{font-size:9px;background:var(--muted);border-radius:999px;padding:5px 7px}.route135HomeNext{font-size:12px;line-height:1.4;color:var(--soft)}
    .v135Final{background:#fff;border:2px solid var(--o);border-radius:19px;padding:14px;margin:12px 0}.v135Final h3{font-size:19px;margin:4px 0 6px}.v135Final p{font-size:12px;line-height:1.45;color:var(--soft)}.v135Final .btn{margin:8px 0 0}.v135Final .secondary{margin-top:7px}
  `;document.head.appendChild(css);

  function allPlanned(){return Object.values(UNIS).filter(u=>u.stateKey&&!!state[u.stateKey])}
  function currentIds(){return allPlanned().map(u=>u.id)}
  function formatCounts(list){
    const c={oral:0,written:0,test:0,portfolio:0};
    list.forEach(u=>{const f=[...(u.formats||[]),u.model||''].join(' ').toLowerCase();if(/собесед|коллоквиум/.test(f))c.oral++;if(/письмен|эссе|творческ/.test(f))c.written++;if(/тест/.test(f))c.test++;if(u.portfolio)c.portfolio++});return c;
  }
  function verdict(c,n){
    if(!n)return{title:'Сначала выберите вузы',text:'Маршрут появится автоматически, когда в вашем плане будет хотя бы один университет.'};
    if(c.oral>=2&&c.written>=2)return{title:'Смешанный маршрут: письмо + устные испытания',text:'Лучше развивать базовую журналистскую практику, письменные ДВИ и собеседования параллельно. Портфолио будет собираться из практических работ по ходу подготовки.'};
    if(c.test>=2&&c.test>=c.oral&&c.test>=c.written)return{title:'Сильный акцент на тестировании',text:'К журналистской базе нужно рано добавить системную теорию, терминологию и короткие тестовые тренировки.'};
    if(c.oral>=2&&c.oral>c.written)return{title:'Главный акцент — устная подготовка',text:'Речь, медиакругозор, текущая повестка и умение отвечать комиссии должны тренироваться регулярно, а не только перед экзаменом.'};
    if(c.written>=2&&c.written>c.oral)return{title:'Главный акцент — регулярное письмо',text:'Основу маршрута составят журналистская практика, эссе и другие письменные форматы с постепенным усложнением.'};
    if(c.portfolio>=Math.max(2,Math.ceil(n/2)))return{title:'Портфолио — важная часть поступления',text:'Практические задания стоит сразу выполнять так, чтобы лучшие работы можно было затем упаковать под требования выбранных вузов.'};
    return{title:'Общая база + специализация под ваши ДВИ',text:'Сначала формируем журналистские навыки, а специальные тренировки подключаем только там, где они нужны выбранным университетам.'};
  }
  function deriveRoute(list){
    const c=formatCounts(list),v=verdict(c,list.length);
    const base=[
      {id:'news',title:'Новости',desc:'Инфоповод, лид, структура, источники и серия практических новостей. Цель — научиться быстро и точно собирать короткий информационный текст.'},
      {id:'reportage',title:'Текстовый репортаж',desc:'Побывать на событии, поговорить с людьми, собрать детали и написать материал с эффектом присутствия.'},
      {id:'interview',title:'Интервью',desc:'Подготовить героя и вопросы, провести реальный разговор, обработать ответы и собрать публикацию.'},
      {id:'video-event',title:'Событийный видеосюжет',desc:'Съёмка события: герой, синхроны, закадровый текст, стендап и монтажная логика.'},
      {id:'video-theme',title:'Тематический видеосюжет',desc:'Собрать историю не вокруг одного события, а вокруг темы, героев, наблюдений и фактуры.'},
      {id:'article',title:'Большой журналистский материал',desc:'Исследование темы, герой, экспертные комментарии, источники и собственная работа с фактами.'},
      {id:'media',title:'СМИ, журналисты и актуальная повестка',desc:'Выбрать медиа и журналистов для регулярного чтения, понимать профессиональную среду и уверенно работать с текущими событиями.'}
    ];
    const specific=[];
    if(c.written)specific.push({id:'written',title:'Письменные ДВИ',desc:`Нужны для ${c.written} из выбранных вузов. Здесь будут отдельные форматы, критерии, темы и пробники каждого университета.`});
    if(c.oral)specific.push({id:'oral',title:'Собеседования и коллоквиумы',desc:`Нужны для ${c.oral} из выбранных вузов. Общая устная тренировка + вопросы и критерии конкретных комиссий.`});
    if(c.test)specific.push({id:'tests',title:'Тестовые ДВИ',desc:`Нужны для ${c.test} из выбранных вузов. Теория, тематические блоки, банк ошибок и полноценные пробники.`});
    if(c.portfolio)specific.push({id:'portfolio',title:'Портфолио и творческие папки',desc:`Актуально для ${c.portfolio} из выбранных вузов. Работы из базового курса автоматически станут кандидатами в портфолио, затем их можно будет упаковать под каждый вуз.`});
    specific.push({id:'mock',title:'Пробники выбранных вузов',desc:'Финальный этап: отдельная симуляция каждого ДВИ в его реальном формате — без подсказок, с таймером там, где он нужен.'});
    return {version:1,updatedAt:new Date().toISOString(),year:state.v13Onboarding?.year||state.v132?.year||'',universityIds:list.map(u=>u.id),counts:c,verdict:v,base,specific,universities:list.map(u=>({id:u.id,title:u.title,city:u.locationDisplay||u.city,model:u.model||((u.formats||[]).join(' + ')),formats:u.formats||[],portfolio:!!u.portfolio,screen:u.screen}))};
  }
  function syncRoute(reason){
    const r=deriveRoute(allPlanned());r.reason=reason||'sync';state.v135Route=r;persist();renderRoute();renderHomeCard();return r;
  }
  window.MMT_ROUTE_ENGINE={derive:()=>deriveRoute(allPlanned()),sync:syncRoute,get:()=>state.v135Route||deriveRoute(allPlanned())};

  let routeScreen=document.getElementById('myRoute');
  if(!routeScreen){routeScreen=document.createElement('section');routeScreen.id='myRoute';routeScreen.className='screen';main.appendChild(routeScreen)}
  function renderRoute(){
    const list=allPlanned(),r=deriveRoute(list);state.v135Route=r;
    if(!list.length){routeScreen.innerHTML=`<div class="eye">Моя подготовка</div><h2>Мой маршрут</h2><div class="route135Empty"><h3>Пока нет выбранных вузов</h3><p class="sub">Добавьте хотя бы один вуз — программа подготовки соберётся автоматически.</p><button class="btn" data-go="uniCatalog">Выбрать вузы</button></div>`;return}
    routeScreen.innerHTML=`<div class="eye">Моя подготовка</div><div class="route135Hero"><div class="meta">Персональный маршрут · ${list.length} ${list.length===1?'вуз':'вузов'}</div><h2>${safe(r.verdict.title)}</h2><p>${safe(r.verdict.text)}</p><div class="route135Targets">${list.map(u=>`<span>${safe(u.title)}</span>`).join('')}</div></div>
      <div class="route135Actions"><button class="btn secondary" data-go="uniCatalog">Изменить выбранные вузы</button></div>
      <div class="route135Section"><h3>1. Общая журналистская база</h3><p class="meta">Эти навыки нужны независимо от конкретного журфака. Лучшие практические работы сразу идут в портфолио.</p></div>
      ${r.base.map((m,i)=>`<div class="route135Module"><div class="num">${i+1}</div><div><b>${safe(m.title)}</b><small>${safe(m.desc)}</small></div><span class="tag">база</span></div>`).join('')}
      <div class="route135Section"><h3>2. Специализация под выбранные ДВИ</h3><p class="meta">Этот блок меняется автоматически вместе со списком ваших вузов.</p></div>
      ${r.specific.map((m,i)=>`<div class="route135Module specific"><div class="num">${i+1}</div><div><b>${safe(m.title)}</b><small>${safe(m.desc)}</small></div><span class="tag">ваш маршрут</span></div>`).join('')}
      <div class="route135Section"><h3>3. Что именно требуют ваши вузы</h3></div>
      ${r.universities.map(u=>`<div class="route135Uni"><div class="row between"><div><h3>${safe(u.title)}</h3><div class="meta">${safe(u.city)}</div></div><button type="button" class="btn small secondary" data-v135-open-uni="${safe(u.id)}">Открыть</button></div><p>${safe(u.model||'Формат уточняется')}</p><div class="route135Tags">${u.formats.map(f=>`<span>${safe(f)}</span>`).join('')}${u.portfolio?'<span>портфолио</span>':''}</div></div>`).join('')}
      <p class="route135Note">Маршрут не является отдельной сохранённой копией. Он всегда строится из вузов, которые сейчас находятся в вашем плане. Если список целей изменится, этот экран изменится вместе с ним.</p>`;
  }

  function ensureHomeCard(){
    const home=document.getElementById('home');if(!home)return null;
    let card=document.getElementById('v135HomeRoute');if(!card){card=document.createElement('div');card.id='v135HomeRoute';card.className='card';const dash=document.getElementById('v10Dashboard');if(dash)dash.insertAdjacentElement('afterend',card);else home.prepend(card)}return card;
  }
  function renderHomeCard(){
    const card=ensureHomeCard();if(!card)return;const list=allPlanned(),r=deriveRoute(list);
    if(!list.length){card.innerHTML=`<div class="route135HomeTop"><div><div class="eye">Мой маршрут</div><h3>Сначала выберите вузы</h3></div><span class="status y">0</span></div><p class="route135HomeNext">После выбора целей здесь появится программа подготовки.</p><button class="btn secondary" data-go="uniCatalog">Выбрать вузы</button>`;return}
    card.innerHTML=`<div class="route135HomeTop"><div><div class="eye">Мой маршрут</div><h3>${safe(r.verdict.title)}</h3></div><span class="status o">${list.length}</span></div><div class="route135HomeTargets">${list.map(u=>`<span>${safe(u.title)}</span>`).join('')}</div><p class="route135HomeNext">Общая база: ${r.base.length} блоков · специализация: ${r.specific.length}. Измените вузы — маршрут перестроится автоматически.</p><button class="btn" data-go="myRoute">Открыть мой маршрут</button>`;
  }

  function showDock(){document.body.classList.remove('v132-onboarding','v13-onboarding');const dock=document.getElementById('mmtBottomDock');if(dock){dock.style.setProperty('display','block','important');dock.style.setProperty('visibility','visible','important');dock.style.setProperty('opacity','1','important')}}
  function directRender(id){const target=document.getElementById(id)||document.getElementById('home');if(!target)return;document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));target.classList.add('active');showDock();try{window.scrollTo(0,0)}catch(e){};try{window.syncMMTBottomDock?.()}catch(e){}}
  function applyOnboardingSelection(){
    const ids=new Set(state.v132?.selectedIds||[]);if(!ids.size)return false;
    Object.values(UNIS).forEach(u=>{if(u.stateKey)state[u.stateKey]=ids.has(u.id)});
    state.v13Onboarding=state.v13Onboarding&&typeof state.v13Onboarding==='object'?state.v13Onboarding:{};
    state.v13Onboarding.selectedIds=[...ids];state.v13Onboarding.year=state.v132?.year||state.v13Onboarding.year||'';state.v13Onboarding.mode=state.v132?.mode||'';state.v13Onboarding.geo=state.v132?.geo||'';
    state.v13OnboardingComplete=true;state.v127Demo=false;state.v132JustStarted=false;syncRoute('onboarding-save');return true;
  }

  function patchVerdict(){
    const route=document.getElementById('v132Route');if(!route)return;
    route.querySelectorAll('.v133Choices,.v133SaveOnly,.v135Final').forEach(x=>x.remove());
    const anchor=route.querySelector('.v133Verdict')||route.querySelector('.v132Summary');if(!anchor)return;
    const box=document.createElement('div');box.className='v135Final';box.innerHTML=`<div class="eye">Маршрут готов</div><h3>Сохранить выбранные вузы и программу</h3><p>После сохранения эти вузы станут вашим текущим планом. Раздел «Мой маршрут» будет автоматически перестраиваться, если позже вы добавите или уберёте университет.</p><button type="button" class="btn" data-v135-finish="route">Сохранить и открыть мой маршрут</button><button type="button" class="btn secondary" data-v135-finish="home">Сохранить и перейти на Главную</button>`;anchor.insertAdjacentElement('afterend',box);showDock();
  }

  document.addEventListener('click',e=>{
    const finish=e.target.closest('[data-v135-finish]');if(finish){e.preventDefault();e.stopImmediatePropagation();if(!applyOnboardingSelection()){if(typeof toast==='function')toast('Сначала выберите хотя бы один вуз');return}directRender(finish.dataset.v135Finish==='route'?'myRoute':'home');if(typeof toast==='function')toast('Маршрут сохранён');return}
    const open=e.target.closest('[data-v135-open-uni]');if(open){e.preventDefault();const u=UNIS[open.dataset.v135OpenUni];if(u?.screen)directRender(u.screen);return}
    if(e.target.closest('[data-v132-route],[data-v132-year]'))setTimeout(patchVerdict,30);
  },true);

  /* Preparation dock now opens the living route instead of a generic legacy hub. */
  const dockPrepare=document.querySelector('#mmtBottomDock [data-dock-section="prepare"]');if(dockPrepare)dockPrepare.dataset.dockGo='myRoute';

  /* Any plan change in catalog automatically updates the route. */
  if(typeof window.toggleV10Plan==='function'&&!window.toggleV10Plan._v135){const old=window.toggleV10Plan;const wrapped=function(){const out=old.apply(this,arguments);setTimeout(()=>syncRoute('plan-change'),0);return out};wrapped._v135=true;window.toggleV10Plan=wrapped}

  let lastSig=currentIds().sort().join('|');
  window.MMT_ROUTE_WATCHDOG&&clearInterval(window.MMT_ROUTE_WATCHDOG);
  window.MMT_ROUTE_WATCHDOG=setInterval(()=>{const sig=currentIds().sort().join('|');if(sig!==lastSig){lastSig=sig;syncRoute('state-change')}},900);

  renderRoute();renderHomeCard();patchVerdict();
})();
