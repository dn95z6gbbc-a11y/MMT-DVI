/* MMT ДВИ v0.13 — guided first-run journey for a new applicant */
(function setupV013(){
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13';
  document.title='MMT ДВИ — v0.13';

  const UNIS=window.MMT_UNIVERSITIES||{};
  state.v13Onboarding=state.v13Onboarding&&typeof state.v13Onboarding==='object'?state.v13Onboarding:{};
  state.v13Onboarding.selectedIds=Array.isArray(state.v13Onboarding.selectedIds)?state.v13Onboarding.selectedIds:[];
  state.v13OnboardingComplete=!!state.v13OnboardingComplete;

  const onboardingIds=new Set(['splash','v13Setup','v13Pick','v13Ready']);
  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.13] persist failed',e)}};
  function appendScreen(id){let s=document.getElementById(id);if(s)return s;s=document.createElement('section');s.id=id;s.className='screen';document.querySelector('main').appendChild(s);return s}

  const css=document.createElement('style');css.id='mmt-v013-css';css.textContent=`
    .v13Hero{padding:34px 4px 18px}.v13Hero .logo{margin-bottom:20px}.v13Hero h1{font-size:33px}.v13Hero .sub{font-size:16px;line-height:1.5}
    .v13Choice{display:grid;gap:9px;margin:18px 0}.v13ChoiceBtn{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:18px;padding:16px;text-align:left}.v13ChoiceBtn.primary{background:var(--o);border-color:var(--o)}.v13ChoiceBtn b{display:block;font:700 17px/1.25 Montserrat,Arial,sans-serif}.v13ChoiceBtn span{display:block;color:var(--soft);font-size:12px;margin-top:5px;line-height:1.4}.v13ChoiceBtn.primary span{color:#3d2b22}
    .v13Progress{display:flex;gap:5px;margin:4px 0 20px}.v13Progress i{height:5px;flex:1;border-radius:999px;background:var(--line)}.v13Progress i.on{background:var(--o)}
    .v13Section{background:#fff;border:1px solid var(--line);border-radius:20px;padding:15px;margin:12px 0}.v13Section h3{margin-bottom:7px}.v13Options{display:grid;gap:8px}.v13Opt{width:100%;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:14px;padding:12px 13px;text-align:left}.v13Opt.active{border:2px solid var(--o);background:var(--os);font-weight:700}.v13Opt small{display:block;color:var(--soft);font-weight:400;margin-top:3px}.v13Other{display:none;margin-top:8px}.v13Other.show{display:block}
    .v13Topline{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}.v13Back{border:0;background:var(--muted);border-radius:12px;padding:9px 11px;font-weight:700}.v13Step{font-size:11px;color:var(--soft);font-weight:700;text-transform:uppercase;letter-spacing:.08em}
    .v13PickTools{position:sticky;top:62px;z-index:8;background:var(--bg);padding:5px 0 9px}.v13Uni{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:9px 0}.v13Uni.selected{border:2px solid var(--o)}.v13Uni h3{margin:0 0 4px}.v13Uni .meta{line-height:1.35}.v13UniModel{background:var(--muted);border-radius:12px;padding:9px 10px;font-size:12px;line-height:1.35;margin:10px 0}.v13UniFoot{display:flex;gap:8px;align-items:center;justify-content:space-between}.v13UniFoot .btn{width:auto;margin:0;padding:9px 12px}.v13Counter{background:var(--ink);color:#fff;border-radius:14px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}.v13Counter .btn{width:auto;margin:0;padding:9px 12px}.v13Empty{padding:16px;border-radius:14px;background:var(--muted);color:var(--soft);font-size:13px}
    .v13ReadyHero{background:var(--ink);color:#fff;border-radius:22px;padding:18px;margin:12px 0}.v13ReadyHero .meta{color:#bbb}.v13ReadyHero h2{font-size:27px}.v13Targets{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.v13Targets span{background:#ffffff18;border:1px solid #ffffff24;border-radius:999px;padding:7px 9px;font-size:11px}.v13Summary{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v13Metric{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px}.v13Metric b{display:block;font-size:21px;margin-top:4px}.v13Metric span{font-size:11px;color:var(--soft)}.v13Timing{border-left:4px solid var(--o);background:#fff;border-radius:14px;padding:12px 13px;margin:12px 0}.v13Timing b{display:block;margin-bottom:4px}.v13Timing span{font-size:12px;color:var(--soft);line-height:1.4}
    body.v13-onboarding{padding-bottom:0!important}body.v13-onboarding .app{padding-bottom:12px!important}body.v13-onboarding #mmtBottomDock{display:none!important}body.v13-onboarding .top{display:none!important}body.v13-onboarding .screen{padding-top:24px}
    @media(max-width:370px){.v13Summary{grid-template-columns:1fr}.v13Hero h1{font-size:29px}}
  `;document.head.appendChild(css);

  const setup=appendScreen('v13Setup');
  const pick=appendScreen('v13Pick');
  const ready=appendScreen('v13Ready');

  function hasRealProgress(){
    const planned=Object.values(UNIS).some(u=>!!state[u.stateKey]);
    return planned || (state.newsCount||0)>0 || (state.interviewSessions||[]).length>0 || (state.v11Works||state.works||[]).length>0 || !!state.mediaRecall || !!state.v13OnboardingComplete;
  }

  function rewriteSplash(){
    const splash=document.getElementById('splash');if(!splash)return;
    const progress=hasRealProgress();
    splash.innerHTML=`<div class="v13Hero"><div class="logo">MMT</div><div class="eye">Поступление на журналистику</div><h1>Выбрать журфак и подготовиться к его ДВИ</h1><p class="sub">Сначала определим ваши цели. Затем приложение соберёт маршрут именно под выбранные университеты.</p>
      ${progress?`<div class="v13Choice"><button class="v13ChoiceBtn primary" type="button" data-v13-continue><b>Продолжить мой план</b><span>Вернуться к сохранённым вузам и подготовке.</span></button><button class="v13ChoiceBtn" type="button" data-v13-new><b>Посмотреть путь нового абитуриента</b><span>Сбросить тестовые данные в этом браузере и пройти настройку с нуля.</span></button></div>`:
      `<div class="v13Choice"><button class="v13ChoiceBtn primary" type="button" data-v13-mode="known"><b>Знаю, куда хочу поступать</b><span>Быстро найти нужные вузы и добавить их в план.</span></button><button class="v13ChoiceBtn" type="button" data-v13-mode="help"><b>Помогите выбрать вузы</b><span>Покажем варианты по географии и формату поступления.</span></button></div>`}
      <p class="meta">Прототип. Официальные даты и условия показываем только там, где они внесены и проверены.</p></div>`;
  }

  function begin(mode){
    state.v13Onboarding={mode:mode||'help',year:'2027',geo:'all',otherCity:'',ege:'none',selectedIds:[]};
    persist();renderSetup();go('v13Setup');
  }

  function renderSetup(){
    const o=state.v13Onboarding;
    setup.innerHTML=`<div class="v13Topline"><button class="v13Back" type="button" data-v13-back-splash>←</button><span class="v13Step">Шаг 1 из 3</span></div><div class="v13Progress"><i class="on"></i><i></i><i></i></div>
      <h2>Несколько вопросов — и соберём маршрут</h2><p class="sub">Никаких длинных анкет. Эти ответы нужны только для первого подбора.</p>
      <div class="v13Section"><h3>Когда поступаете?</h3><div class="v13Options">
        ${[['2027','Летом 2027'],['2028','Летом 2028'],['later','Позже']].map(([v,t])=>`<button type="button" class="v13Opt ${o.year===v?'active':''}" data-v13-year="${v}">${t}</button>`).join('')}
      </div></div>
      <div class="v13Section"><h3>Где готовы учиться?</h3><div class="v13Options">
        ${[['Москва','Москва'],['Санкт-Петербург','Санкт-Петербург'],['other','Другой город'],['all','Вся Россия']].map(([v,t])=>`<button type="button" class="v13Opt ${o.geo===v?'active':''}" data-v13-geo="${v}">${t}</button>`).join('')}
      </div><div class="v13Other ${o.geo==='other'?'show':''}"><input id="v13OtherCity" class="input" placeholder="Например: Воронеж" value="${safe(o.otherCity||'')}"><p class="meta">Если такого города ещё нет в базе, покажем остальные доступные варианты.</p></div></div>
      <div class="v13Section"><h3>Результаты ЕГЭ уже известны?</h3><div class="v13Options">
        <button type="button" class="v13Opt ${o.ege==='none'?'active':''}" data-v13-ege="none">Пока нет<small>Баллы можно будет добавить позже.</small></button>
        <button type="button" class="v13Opt ${o.ege==='known'?'active':''}" data-v13-ege="known">Да, результаты уже есть<small>После настройки плана можно будет внести их для оценки требований.</small></button>
      </div></div>
      <button class="btn" type="button" data-v13-to-pick>Дальше — выбрать вузы</button>`;
  }

  function geoMatches(u){
    const o=state.v13Onboarding;
    if(o.geo==='all')return true;
    if(o.geo==='Москва'||o.geo==='Санкт-Петербург')return u.city===o.geo;
    if(o.geo==='other'){
      const q=(o.otherCity||'').trim().toLowerCase();
      if(q)return [u.city,u.location,u.locationDisplay].filter(Boolean).join(' ').toLowerCase().includes(q);
      return !['Москва','Санкт-Петербург'].includes(u.city);
    }
    return true;
  }

  function renderPick(){
    const o=state.v13Onboarding;
    const query=(o.query||'').trim().toLowerCase();
    let arr=Object.values(UNIS);
    const geo=arr.filter(geoMatches);
    if(o.mode==='help'&&geo.length)arr=geo;
    else if(o.mode==='known'&&o.geo!=='all'&&geo.length)arr=[...geo,...arr.filter(u=>!geo.includes(u))];
    if(query)arr=arr.filter(u=>[u.title,u.city,u.location,u.program,u.model,(u.programs||[]).map(p=>[p.name,p.profile].join(' ')).join(' ')].filter(Boolean).join(' ').toLowerCase().includes(query));
    const selected=new Set(o.selectedIds||[]);
    pick.innerHTML=`<div class="v13Topline"><button class="v13Back" type="button" data-v13-back-setup>←</button><span class="v13Step">Шаг 2 из 3</span></div><div class="v13Progress"><i class="on"></i><i class="on"></i><i></i></div>
      <h2>${o.mode==='known'?'Найдите свои вузы':'Выберите подходящие вузы'}</h2><p class="sub">Можно выбрать до 5. Ничего окончательного: список потом можно изменить.</p>
      <div class="v13PickTools"><input id="v13UniSearch" class="input" placeholder="Название вуза или программа" value="${safe(o.query||'')}"><div class="v13Counter"><div><b>${selected.size} из 5 выбрано</b><div class="meta" style="color:#bbb">${arr.length} вариантов сейчас</div></div><button type="button" class="btn small" data-v13-to-ready ${selected.size?'':'disabled'}>Продолжить</button></div></div>
      <div id="v13PickList">${arr.length?arr.map(u=>`<div class="v13Uni ${selected.has(u.id)?'selected':''}"><div class="row between"><div><h3>${safe(u.title)}</h3><div class="meta">${safe(u.locationDisplay||u.city)} · ${safe(u.program)}</div></div><span class="status ${selected.has(u.id)?'g':'y'}">${selected.has(u.id)?'выбран':'смотрю'}</span></div><div class="v13UniModel">${safe(u.model||u.formats?.join(' + ')||'формат уточняется')}</div><div class="v13UniFoot"><span class="meta">${u.portfolio?'есть работа с портфолио':'без отдельного портфолио в текущей модели'}</span><button type="button" class="btn ${selected.has(u.id)?'ghost':'secondary'}" data-v13-select="${u.id}">${selected.has(u.id)?'Убрать':'Выбрать'}</button></div></div>`).join(''):`<div class="v13Empty">По выбранной географии в текущей базе пока нет вузов. Вернитесь назад и выберите «Вся Россия» — список целей потом можно уточнить.</div>`}</div>`;
    const q=document.getElementById('v13UniSearch');if(q)q.addEventListener('input',()=>{state.v13Onboarding.query=q.value;persist();renderPick()});
  }

  function formatCounts(list){
    const c={oral:0,written:0,test:0,portfolio:0};
    list.forEach(u=>{
      const s=(u.formats||[]).join(' ').toLowerCase()+' '+String(u.model||'').toLowerCase();
      if(/коллоквиум|собесед/.test(s))c.oral++;
      if(/письмен|эссе|творческий текст|анализ текста/.test(s))c.written++;
      if(/тест/.test(s))c.test++;
      if(u.portfolio)c.portfolio++;
    });
    return c;
  }

  function timingCopy(){
    const y=state.v13Onboarding.year;
    if(y==='later')return {title:'Срок поступления пока без конкретного года',text:'Когда определитесь с годом, маршрут сможет учитывать срочность подготовки.'};
    return {title:`Поступление — лето ${y}`,text:'Точный счётчик до ДВИ включится, когда в базе появится официальная дата экзамена выбранного вуза. Мы не подставляем прошлогоднюю дату как новую.'};
  }

  function renderReady(){
    const list=(state.v13Onboarding.selectedIds||[]).map(id=>UNIS[id]).filter(Boolean);
    const c=formatCounts(list),tim=timingCopy();
    ready.innerHTML=`<div class="v13Topline"><button class="v13Back" type="button" data-v13-back-pick>←</button><span class="v13Step">Шаг 3 из 3</span></div><div class="v13Progress"><i class="on"></i><i class="on"></i><i class="on"></i></div>
      <div class="v13ReadyHero"><div class="eye" style="color:#bbb">MMT ДВИ</div><h2>Ваш маршрут готов</h2><p>Вы выбрали ${list.length} ${list.length===1?'вуз':'вуза/вузов'}. Теперь приложение может отделить общую журналистскую базу от подготовки к конкретным испытаниям.</p><div class="v13Targets">${list.map(u=>`<span>${safe(u.title)}</span>`).join('')}</div></div>
      <div class="v13Summary"><div class="v13Metric"><span>Устный этап</span><b>${c.oral}</b></div><div class="v13Metric"><span>Письменный этап</span><b>${c.written}</b></div><div class="v13Metric"><span>Тестирование</span><b>${c.test}</b></div><div class="v13Metric"><span>Портфолио / папка</span><b>${c.portfolio}</b></div></div>
      <div class="v13Timing"><b>${safe(tim.title)}</b><span>${safe(tim.text)}</span></div>
      <div class="v13Section"><h3>Что будет дальше</h3><div class="step"><div class="num current">1</div><div><b>Общая база журналиста</b><div class="meta">Новости, репортаж, интервью, видео и большая работа.</div></div></div><div class="step"><div class="num">2</div><div><b>Специфика ваших ДВИ</b><div class="meta">Только те форматы, которые нужны выбранным вузам.</div></div></div><div class="step"><div class="num">3</div><div><b>Сроки и готовность</b><div class="meta">Главная будет подсказывать одно ближайшее действие, а не показывать всё сразу.</div></div></div></div>
      <button class="btn" type="button" data-v13-finish>Начать подготовку</button><button class="btn secondary" type="button" data-v13-back-pick>Изменить вузы</button>`;
  }

  function finish(){
    const selected=new Set(state.v13Onboarding.selectedIds||[]);
    if(!selected.size){toast('Выберите хотя бы один вуз');go('v13Pick');return}
    Object.values(UNIS).forEach(u=>{if(u.stateKey)state[u.stateKey]=selected.has(u.id)});
    state.v13OnboardingComplete=true;
    state.v127Demo=false;
    persist();
    document.body.classList.remove('v13-onboarding');
    const dock=document.getElementById('mmtBottomDock');if(dock)dock.style.removeProperty('display');
    if(typeof window.renderV10==='function')window.renderV10();
    if(typeof window.refresh==='function')window.refresh();
    go('home');
    toast('Маршрут создан');
  }

  function syncChrome(){
    const id=document.querySelector('.screen.active')?.id||'';
    const on=onboardingIds.has(id);
    document.body.classList.toggle('v13-onboarding',on);
    const dock=document.getElementById('mmtBottomDock');
    if(dock){
      if(on)dock.style.setProperty('display','none','important');
      else dock.style.setProperty('display','block','important');
    }
  }
  if(window.MMT_DOCK_WATCHDOG)clearInterval(window.MMT_DOCK_WATCHDOG);
  window.MMT_DOCK_WATCHDOG=setInterval(()=>{
    const dock=document.getElementById('mmtBottomDock');if(!dock)return;
    syncChrome();
    if(!document.body.classList.contains('v13-onboarding')){
      dock.style.setProperty('position','fixed','important');dock.style.setProperty('left','0','important');dock.style.setProperty('right','0','important');dock.style.setProperty('bottom','0','important');dock.style.setProperty('top','auto','important');dock.style.setProperty('width','100%','important');dock.style.setProperty('transform','none','important');dock.style.setProperty('visibility','visible','important');dock.style.setProperty('opacity','1','important');
      if(typeof window.syncMMTBottomDock==='function')window.syncMMTBottomDock();
    }
  },1500);

  document.addEventListener('click',e=>{
    const mode=e.target.closest('[data-v13-mode]');if(mode){e.preventDefault();begin(mode.dataset.v13Mode);return}
    if(e.target.closest('[data-v13-continue]')){e.preventDefault();go('home');return}
    if(e.target.closest('[data-v13-new]')){e.preventDefault();if(confirm('Сбросить тестовый прогресс в этом браузере и посмотреть первый вход с нуля?')){localStorage.removeItem('mmtV04');location.reload()}return}
    if(e.target.closest('[data-v13-back-splash]')){e.preventDefault();go('splash');return}
    const y=e.target.closest('[data-v13-year]');if(y){state.v13Onboarding.year=y.dataset.v13Year;persist();renderSetup();return}
    const g=e.target.closest('[data-v13-geo]');if(g){state.v13Onboarding.geo=g.dataset.v13Geo;persist();renderSetup();return}
    const eg=e.target.closest('[data-v13-ege]');if(eg){state.v13Onboarding.ege=eg.dataset.v13Ege;persist();renderSetup();return}
    if(e.target.closest('[data-v13-to-pick]')){const city=document.getElementById('v13OtherCity');if(city)state.v13Onboarding.otherCity=city.value.trim();state.v13Onboarding.query='';persist();renderPick();go('v13Pick');return}
    if(e.target.closest('[data-v13-back-setup]')){renderSetup();go('v13Setup');return}
    const sel=e.target.closest('[data-v13-select]');if(sel){const id=sel.dataset.v13Select,a=state.v13Onboarding.selectedIds||[],i=a.indexOf(id);if(i>=0)a.splice(i,1);else{if(a.length>=5){toast('Можно выбрать максимум 5 вузов');return}a.push(id)}persist();renderPick();return}
    if(e.target.closest('[data-v13-to-ready]')){if(!(state.v13Onboarding.selectedIds||[]).length){toast('Выберите хотя бы один вуз');return}renderReady();go('v13Ready');return}
    if(e.target.closest('[data-v13-back-pick]')){renderPick();go('v13Pick');return}
    if(e.target.closest('[data-v13-finish]')){finish();return}
  },true);

  setup.addEventListener('input',e=>{if(e.target.id==='v13OtherCity'){state.v13Onboarding.otherCity=e.target.value;persist()}});

  const main=document.querySelector('main');if(main)new MutationObserver(()=>requestAnimationFrame(syncChrome)).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
  rewriteSplash();renderSetup();renderPick();renderReady();syncChrome();
})();
