/* MMT ДВИ v0.13.2 — simple outside, powerful inside: universities -> DVI -> route -> first action */
(function setupV0132(){
  const UNIS=window.MMT_UNIVERSITIES||{};
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.2';
  document.title='MMT ДВИ — v0.13.2';

  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.13.2] persist failed',e)}};
  const main=document.querySelector('main');
  const ensureScreen=id=>{let s=document.getElementById(id);if(!s){s=document.createElement('section');s.id=id;s.className='screen';main.appendChild(s)}return s};
  const geoScreen=ensureScreen('v132Geo');
  const pickScreen=ensureScreen('v132Pick');
  const routeScreen=ensureScreen('v132Route');
  const onboardingIds=new Set(['v132Geo','v132Pick','v132Route']);

  state.v132=state.v132&&typeof state.v132==='object'?state.v132:{};
  state.v132.selectedIds=Array.isArray(state.v132.selectedIds)?state.v132.selectedIds:[];

  const css=document.createElement('style');css.id='mmt-v0132-css';css.textContent=`
    .v132Hero{padding:46px 4px 24px}.v132Hero .logo{margin-bottom:24px}.v132Hero h1{font-size:35px;max-width:390px}.v132Hero .sub{font-size:16px;line-height:1.5;max-width:390px;margin-bottom:18px}
    .v132Actions{display:grid;gap:10px;margin:18px 0}.v132Action{width:100%;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:18px;padding:17px;text-align:left}.v132Action.primary{background:var(--o);border-color:var(--o)}.v132Action b{display:block;font:700 18px/1.25 Montserrat,Arial,sans-serif}.v132Action span{display:block;color:var(--soft);font-size:12px;line-height:1.4;margin-top:5px}.v132Action.primary span{color:#4a3024}
    .v132Flow{display:flex;gap:6px;flex-wrap:wrap;margin:16px 0}.v132Flow span{background:var(--muted);border-radius:999px;padding:7px 9px;font-size:11px;color:var(--soft)}
    .v132Saved{margin-top:21px;padding-top:15px;border-top:1px solid var(--line)}.v132Saved button{border:0;background:transparent;padding:7px 0;color:var(--ink);font-weight:700;text-decoration:underline;text-underline-offset:3px}
    .v132Head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}.v132Back{border:0;background:var(--muted);border-radius:12px;padding:9px 11px;font-weight:700}.v132Step{font-size:11px;color:var(--soft);font-weight:700;text-transform:uppercase;letter-spacing:.08em}
    .v132Geo{display:grid;gap:9px;margin:18px 0}.v132GeoBtn{width:100%;border:1px solid var(--line);background:#fff;border-radius:17px;padding:15px;text-align:left;color:var(--ink)}.v132GeoBtn b{font-size:16px}.v132GeoBtn small{display:block;color:var(--soft);margin-top:4px;line-height:1.35}
    .v132PickTools{position:sticky;top:0;z-index:9;background:var(--bg);padding:4px 0 8px}.v132Counter{background:var(--ink);color:#fff;border-radius:15px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px}.v132Counter .btn{width:auto;margin:0;padding:9px 12px}.v132Uni{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:9px 0}.v132Uni.selected{border:2px solid var(--o)}.v132Uni h3{margin:0 0 3px}.v132Exam{margin:10px 0;background:var(--muted);border-radius:13px;padding:10px 11px}.v132Exam small{display:block;color:var(--soft);margin-bottom:3px}.v132Exam b{font-size:13px;line-height:1.35}.v132Programs{font-size:11px;color:var(--soft);line-height:1.4;margin:6px 0}.v132Foot{display:flex;justify-content:space-between;align-items:center;gap:8px}.v132Foot .btn{width:auto;margin:0;padding:9px 12px}
    .v132RouteHero{background:var(--ink);color:#fff;border-radius:22px;padding:18px;margin:12px 0}.v132RouteHero .meta{color:#bbb}.v132RouteHero h2{font-size:28px}.v132Targets{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.v132Targets span{border:1px solid #ffffff25;background:#ffffff12;border-radius:999px;padding:7px 9px;font-size:11px}
    .v132Year{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:11px 0}.v132YearBtns{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.v132YearBtn{border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 5px}.v132YearBtn.active{background:var(--os);border:2px solid var(--o);font-weight:700}
    .v132UniRoute{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;margin:8px 0}.v132UniRoute .row{align-items:flex-start}.v132UniRoute p{margin:6px 0 0;font-size:13px;line-height:1.4}.v132Summary{background:var(--os);border-radius:17px;padding:14px;margin:12px 0}.v132Summary h3{margin-bottom:8px}.v132SummaryLine{padding:5px 0;font-size:13px}.v132First{background:#fff;border:2px solid var(--o);border-radius:19px;padding:15px;margin:12px 0}.v132First h3{font-size:20px;margin-bottom:6px}.v132First p{color:var(--soft);font-size:13px}
    body.v132-onboarding{padding-bottom:0!important}body.v132-onboarding .app{padding-bottom:12px!important}body.v132-onboarding .top{display:none!important}body.v132-onboarding #mmtBottomDock{display:none!important}body.v132-onboarding .screen{padding-top:24px}
    #v132FirstHome{background:#fff;border:2px solid var(--o);border-radius:22px;padding:17px;margin:12px 0}#v132FirstHome h2{font-size:25px;margin:5px 0 8px}#v132FirstHome .targets{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0}#v132FirstHome .targets span{background:var(--muted);border-radius:999px;padding:7px 9px;font-size:11px}
    @media(max-width:370px){.v132Hero h1{font-size:31px}.v132YearBtns{grid-template-columns:1fr}}
  `;document.head.appendChild(css);

  function hasSavedPlan(){return Object.values(UNIS).some(u=>u.stateKey&&!!state[u.stateKey])||!!state.v13OnboardingComplete}
  function planned(){return Object.values(UNIS).filter(u=>u.stateKey&&!!state[u.stateKey])}
  function start(mode,geo){
    state.v132={mode,geo:geo||'all',query:'',selectedIds:[],year:''};
    state.v13Onboarding=state.v13Onboarding&&typeof state.v13Onboarding==='object'?state.v13Onboarding:{};
    state.v13Onboarding.mode=mode;state.v13Onboarding.geo=geo||'all';state.v13Onboarding.selectedIds=[];
    persist();
  }

  function rewriteSplash(){
    const splash=document.getElementById('splash');if(!splash)return;
    splash.innerHTML=`<div class="v132Hero"><div class="logo">MMT</div><div class="eye">Поступление на журналистику</div><h1>Выбрать журфак и подготовиться к ДВИ</h1><p class="sub">Сначала выберем университеты. Сразу покажем, что именно там сдавать, а затем соберём ваш маршрут подготовки.</p><div class="v132Actions"><button type="button" class="v132Action primary" data-v132-known><b>Я уже знаю свои вузы</b><span>Найти их и увидеть требования ДВИ.</span></button><button type="button" class="v132Action" data-v132-help><b>Помогите выбрать</b><span>Начнём с города и покажем доступные варианты.</span></button></div><div class="v132Flow"><span>1 · вузы</span><span>2 · что сдавать</span><span>3 · маршрут</span><span>4 · первый шаг</span></div>${hasSavedPlan()?`<div class="v132Saved"><div class="meta">У вас уже есть план</div><button type="button" data-v132-continue>Продолжить подготовку →</button></div>`:''}</div>`;
  }

  function renderGeo(){
    geoScreen.innerHTML=`<div class="v132Head"><button class="v132Back" type="button" data-v132-splash>←</button><span class="v132Step">Выбор вузов</span></div><h2>Где готовы учиться?</h2><p class="sub">Это только первый фильтр. Список потом можно изменить.</p><div class="v132Geo"><button class="v132GeoBtn" data-v132-geo="Москва"><b>Москва</b><small>Покажем московские варианты, включая МГИК с кампусом в Химках.</small></button><button class="v132GeoBtn" data-v132-geo="Санкт-Петербург"><b>Санкт-Петербург</b><small>Вузы Петербурга из нашей базы.</small></button><button class="v132GeoBtn" data-v132-geo="other"><b>Другие города</b><small>Воронеж, Екатеринбург, Новосибирск, Тюмень и другие добавленные города.</small></button><button class="v132GeoBtn" data-v132-geo="all"><b>Вся Россия</b><small>Не ограничивать подбор географией.</small></button></div>`;
  }

  function geoMatches(u){
    const g=state.v132.geo||'all';
    if(g==='all')return true;
    if(g==='Москва'||g==='Санкт-Петербург')return u.city===g;
    if(g==='other')return !['Москва','Санкт-Петербург'].includes(u.city);
    return true;
  }
  function programLabel(u){
    const ps=Array.isArray(u.programs)?u.programs:[];
    if(ps.length>1)return `${ps.length} программы / профиля · можно уточнить позже`;
    return u.program||ps.map(p=>[p.code,p.name,p.profile].filter(Boolean).join(' ')).join('')||'';
  }
  function examLabel(u){
    if(u.model)return u.model;
    return (u.formats||[]).join(' + ')||'формат ДВИ уточняется';
  }
  function pickArray(){
    let arr=Object.values(UNIS);
    if(state.v132.mode==='help')arr=arr.filter(geoMatches);
    const q=(state.v132.query||'').trim().toLowerCase();
    if(q)arr=arr.filter(u=>[u.title,u.city,u.program,u.model,(u.programs||[]).map(p=>[p.code,p.name,p.profile].filter(Boolean).join(' ')).join(' ')].filter(Boolean).join(' ').toLowerCase().includes(q));
    return arr;
  }
  function renderPick(){
    const arr=pickArray(),sel=new Set(state.v132.selectedIds||[]);
    pickScreen.innerHTML=`<div class="v132Head"><button class="v132Back" type="button" data-v132-pickback>←</button><span class="v132Step">Шаг 1 · Вузы</span></div><h2>${state.v132.mode==='known'?'Какие вузы рассматриваете?':'Выберите подходящие варианты'}</h2><p class="sub">До пяти вузов. Сейчас важны только цели — детали можно менять позже.</p><div class="v132PickTools"><input id="v132Search" class="input" placeholder="Название вуза или программы" value="${safe(state.v132.query||'')}"><div class="v132Counter"><div><b>${sel.size} из 5 выбрано</b><div class="meta" style="color:#bbb">${arr.length} вариантов</div></div><button type="button" class="btn small" data-v132-route ${sel.size?'':'disabled'}>Что мне сдавать →</button></div></div>${arr.length?arr.map(u=>`<div class="v132Uni ${sel.has(u.id)?'selected':''}"><div class="row between"><div><h3>${safe(u.title)}</h3><div class="meta">${safe(u.locationDisplay||u.city)}</div></div><span class="status ${sel.has(u.id)?'g':'y'}">${sel.has(u.id)?'выбран':'смотрю'}</span></div><div class="v132Programs">${safe(programLabel(u))}</div><div class="v132Exam"><small>Что сдавать</small><b>${safe(examLabel(u))}</b></div><div class="v132Foot"><span class="meta">${u.portfolio?'портфолио / творческая папка учитывается':'без отдельного портфолио в текущей модели'}</span><button type="button" class="btn ${sel.has(u.id)?'ghost':'secondary'}" data-v132-select="${u.id}">${sel.has(u.id)?'Убрать':'Выбрать'}</button></div></div>`).join(''):`<div class="notice">В выбранной группе пока нет вузов в базе. Вернитесь назад и выберите «Вся Россия».</div>`}`;
    const q=document.getElementById('v132Search');if(q)q.addEventListener('input',()=>{state.v132.query=q.value;persist();renderPick()});
  }

  function counts(list){
    const c={oral:0,written:0,test:0,portfolio:0};
    list.forEach(u=>{const f=[...(u.formats||[]),u.model||''].join(' ').toLowerCase();if(/собесед|коллоквиум/.test(f))c.oral++;if(/письмен|эссе|творческ/.test(f))c.written++;if(/тест/.test(f))c.test++;if(u.portfolio)c.portfolio++});
    return c;
  }
  function renderRoute(){
    const selected=(state.v132.selectedIds||[]).map(id=>UNIS[id]).filter(Boolean),c=counts(selected),year=state.v132.year||'';
    routeScreen.innerHTML=`<div class="v132Head"><button class="v132Back" type="button" data-v132-backpick>←</button><span class="v132Step">Шаг 2 · Ваш ДВИ</span></div><div class="v132RouteHero"><div class="meta">Ваш выбор</div><h2>Вот к чему нужно готовиться</h2><div class="v132Targets">${selected.map(u=>`<span>${safe(u.title)}</span>`).join('')}</div></div><div class="v132Year"><h3>Когда поступаете?</h3><p class="meta">Нужно только для темпа подготовки и будущего счётчика до экзамена.</p><div class="v132YearBtns">${[['2027','Лето 2027'],['2028','Лето 2028'],['later','Позже']].map(([v,t])=>`<button type="button" class="v132YearBtn ${year===v?'active':''}" data-v132-year="${v}">${t}</button>`).join('')}</div></div><h3 style="margin-top:18px">По вашим вузам</h3>${selected.map(u=>`<div class="v132UniRoute"><div class="row between"><div><b>${safe(u.title)}</b><div class="meta">${safe(u.locationDisplay||u.city)}</div></div></div><p>${safe(examLabel(u))}</p>${(u.programs||[]).length>1?`<div class="meta" style="margin-top:6px">В вузе несколько подходящих программ; конкретное направление можно уточнить позже.</div>`:''}</div>`).join('')}<div class="v132Summary"><h3>Итого в маршруте</h3>${c.oral?`<div class="v132SummaryLine">Устные испытания / собеседования — <b>${c.oral}</b></div>`:''}${c.written?`<div class="v132SummaryLine">Письменные творческие испытания — <b>${c.written}</b></div>`:''}${c.test?`<div class="v132SummaryLine">Тестирование — <b>${c.test}</b></div>`:''}${c.portfolio?`<div class="v132SummaryLine">Вузов, где пригодится портфолио — <b>${c.portfolio}</b></div>`:''}</div><div class="v132First"><div class="eye">Первый шаг</div><h3>Начать с общей базы журналиста</h3><p>Не нужно сразу разбираться во всех разделах. Сначала приложение даст базовые задания, а затем подключит специфику выбранных ДВИ.</p></div><button class="btn" type="button" data-v132-finish ${year?'':'disabled'}>${year?'Создать маршрут и начать':'Сначала выберите год поступления'}</button>`;
  }

  function finish(){
    const ids=new Set(state.v132.selectedIds||[]);if(!ids.size||!state.v132.year)return;
    Object.values(UNIS).forEach(u=>{if(u.stateKey)state[u.stateKey]=ids.has(u.id)});
    state.v13Onboarding=state.v13Onboarding&&typeof state.v13Onboarding==='object'?state.v13Onboarding:{};
    state.v13Onboarding.year=state.v132.year;state.v13Onboarding.selectedIds=[...ids];state.v13Onboarding.mode=state.v132.mode;state.v13Onboarding.geo=state.v132.geo;
    state.v13OnboardingComplete=true;state.v132JustStarted=true;state.v127Demo=false;
    persist();syncChrome();if(typeof window.renderV10==='function')window.renderV10();if(typeof window.refresh==='function')window.refresh();renderFirstHome();go('home');if(typeof toast==='function')toast('Маршрут готов');
  }

  function renderFirstHome(){
    const home=document.getElementById('home');if(!home)return;
    let card=document.getElementById('v132FirstHome');
    if(!state.v132JustStarted){if(card)card.remove();const d=document.getElementById('v10Dashboard');if(d)d.style.removeProperty('display');const h=document.getElementById('home127');if(h)h.style.removeProperty('display');return}
    if(!card){card=document.createElement('div');card.id='v132FirstHome';home.prepend(card)}
    const list=planned();
    card.innerHTML=`<div class="eye">Ваш маршрут готов</div><h2>Начните с одного шага</h2><p class="sub">Не нужно изучать всё приложение сразу. Сначала откройте базовую подготовку — остальные разделы подключатся по ходу.</p><div class="targets">${list.map(u=>`<span>${safe(u.title)}</span>`).join('')}</div><button class="btn" type="button" data-v132-first>Начать подготовку</button><button class="btn secondary" type="button" data-go="uniCatalog">Посмотреть мои вузы</button>`;
    const d=document.getElementById('v10Dashboard');if(d)d.style.setProperty('display','none','important');const h=document.getElementById('home127');if(h)h.style.setProperty('display','none','important');
  }

  function syncChrome(){
    const id=document.querySelector('.screen.active')?.id||'';const on=onboardingIds.has(id);
    document.body.classList.toggle('v132-onboarding',on);
    const dock=document.getElementById('mmtBottomDock');if(dock)dock.style.setProperty('display',on?'none':'block','important');
  }
  if(window.MMT_DOCK_WATCHDOG)clearInterval(window.MMT_DOCK_WATCHDOG);
  window.MMT_DOCK_WATCHDOG=setInterval(()=>{syncChrome();if(!document.body.classList.contains('v132-onboarding')&&typeof window.syncMMTBottomDock==='function')window.syncMMTBottomDock()},900);

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-v132-known]')){e.preventDefault();start('known','all');renderPick();go('v132Pick');return}
    if(e.target.closest('[data-v132-help]')){e.preventDefault();start('help','all');renderGeo();go('v132Geo');return}
    if(e.target.closest('[data-v132-continue]')){e.preventDefault();go('home');return}
    if(e.target.closest('[data-v132-splash]')){e.preventDefault();rewriteSplash();go('splash');return}
    const gb=e.target.closest('[data-v132-geo]');if(gb){e.preventDefault();start('help',gb.dataset.v132Geo);renderPick();go('v132Pick');return}
    if(e.target.closest('[data-v132-pickback]')){e.preventDefault();if(state.v132.mode==='help'){renderGeo();go('v132Geo')}else{rewriteSplash();go('splash')}return}
    const s=e.target.closest('[data-v132-select]');if(s){e.preventDefault();const a=state.v132.selectedIds||[],id=s.dataset.v132Select,i=a.indexOf(id);if(i>=0)a.splice(i,1);else{if(a.length>=5){if(typeof toast==='function')toast('Можно выбрать максимум 5 вузов');return}a.push(id)}persist();renderPick();return}
    if(e.target.closest('[data-v132-route]')){e.preventDefault();if(!(state.v132.selectedIds||[]).length)return;renderRoute();go('v132Route');return}
    if(e.target.closest('[data-v132-backpick]')){e.preventDefault();renderPick();go('v132Pick');return}
    const y=e.target.closest('[data-v132-year]');if(y){e.preventDefault();state.v132.year=y.dataset.v132Year;persist();renderRoute();return}
    if(e.target.closest('[data-v132-finish]')){e.preventDefault();finish();return}
    if(e.target.closest('[data-v132-first]')){e.preventDefault();state.v132JustStarted=false;persist();renderFirstHome();go('prepare');return}
  },true);

  if(main)new MutationObserver(()=>requestAnimationFrame(()=>{syncChrome();renderFirstHome()})).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
  rewriteSplash();renderGeo();renderPick();renderRoute();renderFirstHome();syncChrome();
})();
