/* MMT ДВИ v0.12.7 — first-run clarity: clean Home, explain demo persistence, remove internal jargon */
(function setupV0127(){
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.12.7';
  document.title='MMT ДВИ — v0.12.7';

  state.v127Demo=!!state.v127Demo;

  const css=document.createElement('style');css.id='mmt-v0127-css';css.textContent=`
    .home127{display:grid;gap:12px;margin-top:12px}.home127 .card{margin:0}
    .welcome127{background:#fff;border:1px solid var(--line);border-radius:20px;padding:15px}.welcome127 h3{margin:0 0 7px}
    .demo127{background:#fff6e9;border:1px solid #efcfae;border-radius:17px;padding:13px;margin:0 0 12px}.demo127 p{margin:5px 0 10px;font-size:12px;line-height:1.45;color:var(--soft)}
    .plainSteps127{display:grid;gap:8px}.plainStep127{display:grid;grid-template-columns:32px 1fr auto;gap:9px;align-items:center;background:var(--muted);border-radius:14px;padding:11px}.plainStep127 .n{width:30px;height:30px;border-radius:10px;background:#fff;display:grid;place-items:center;font-weight:800}.plainStep127 b{font-size:13px}.plainStep127 small{display:block;color:var(--soft);margin-top:2px;line-height:1.3}.plainStep127 .chev{font-size:18px;color:var(--soft)}
    .reset127{border:0;background:transparent;text-decoration:underline;color:var(--soft);font-size:11px;padding:8px 0}
    .how127{background:var(--ink);color:#fff;border-radius:19px;padding:15px}.how127 .meta{color:#bbb}.how127 .howrow{display:grid;grid-template-columns:25px 1fr;gap:8px;margin:10px 0}.how127 .howrow span{width:24px;height:24px;border-radius:8px;background:var(--o);color:#111;display:grid;place-items:center;font-weight:800;font-size:11px}.how127 b{font-size:12px}
  `;document.head.appendChild(css);

  function planned(){return window.MMT_UNIVERSITIES?Object.values(window.MMT_UNIVERSITIES).filter(u=>!!state[u.stateKey]):[]}
  function hasSavedProgress(){
    return planned().length>0 || (state.newsCount||0)>0 || (state.interviewSessions||[]).length>0 || (state.v11Works||state.works||[]).length>0 || !!state.mediaRecall || !!state.mediaDiet;
  }

  /* Splash: make the difference between a real first start and a demo explicit. */
  const splash=document.getElementById('splash');
  if(splash){
    const primary=[...splash.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='Начать');
    if(primary)primary.textContent='Начать как абитуриент';
    const demo=[...splash.querySelectorAll('button')].find(b=>/демо-профиль/i.test(b.textContent||''));
    if(demo){
      demo.textContent='Посмотреть приложение';demo.removeAttribute('data-go');demo.dataset.v127Demo='1';
    }
    const note=splash.querySelector('.meta');if(note)note.textContent='Прототип. Для тестирования прогресс сохраняется в этом браузере.';
    if(hasSavedProgress()&&!document.getElementById('freshStart127')){
      const r=document.createElement('button');r.id='freshStart127';r.className='reset127';r.textContent='Сбросить тестовый прогресс и посмотреть первый вход';
      (note||splash.lastElementChild)?.insertAdjacentElement('afterend',r);
    }
  }

  window.resetMMTFirstRun=function(){
    if(!confirm('Сбросить тестовый прогресс в этом браузере? Это удалит выбранные вузы, упражнения и демо-данные.'))return;
    localStorage.removeItem('mmtV04');location.reload();
  };
  document.getElementById('freshStart127')?.addEventListener('click',window.resetMMTFirstRun);

  /* Capture demo entry before the generic data-go handler. */
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-v127-demo]');if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();state.v127Demo=true;saveState();go('home');
  },true);

  /* Hide the old hard-coded Home. It was useful as an early mockup but is misleading for a first-time user. */
  const home=document.getElementById('home');
  if(home){
    [...home.children].forEach(ch=>{if(ch.id!=='v10Dashboard')ch.style.display='none'});
    if(!document.getElementById('home127')){const c=document.createElement('div');c.id='home127';c.className='home127';home.appendChild(c)}
  }

  function nextStep(){
    const plan=planned();
    if(!plan.length)return {title:'Сначала выберите вузы',text:'Добавьте 1–5 вариантов. После этого приложение сможет собрать маршрут подготовки именно под ваши ДВИ.',go:'uniCatalog',cta:'Выбрать вузы'};
    const recall=state.mediaRecall||{};
    if(!String(recall.media||'').trim()||!String(recall.journalists||'').trim())return {title:'Выберите СМИ и журналистов для подготовки',text:'Этот список понадобится для работы с новостной повесткой и для вопросов на собеседованиях.',go:'agendaHub',cta:'Выбрать СМИ и журналистов'};
    const oral=plan.some(u=>(u.formats||[]).some(x=>/коллоквиум|собесед/.test(x)));
    if(oral&&!(state.interviewSessions||[]).length)return {title:'Попробуйте тренировочное собеседование',text:'В вашем плане есть вуз с устным испытанием. Первая тренировка покажет, какие темы стоит подтянуть.',go:'interviewSimulationSetup',cta:'Начать тренировку'};
    if((state.newsCount||0)<10)return {title:'Продолжите практику новостей',text:'Навык быстро находить главное и писать понятный лид нужен почти во всех вариантах подготовки журналиста.',go:'newsCourse',cta:'Продолжить новости'};
    return {title:'Продолжите подготовку по своему плану',text:'Основные стартовые шаги уже сделаны. Откройте подготовку и выберите ближайшее незавершённое задание.',go:'prepare',cta:'Открыть подготовку'};
  }

  function renderHome127(){
    if(!home)return;
    const plan=planned(),next=nextStep();
    const dash=document.getElementById('v10Dashboard');
    if(dash){
      dash.innerHTML=`<div class="eye">Следующее действие</div><h2 style="margin:7px 0 8px">${next.title}</h2><p class="sub">${next.text}</p><button class="btn" data-go="${next.go}">${next.cta}</button>${plan.length?`<div class="label">Мои вузы</div><div class="planChips10">${plan.map(u=>`<span>${u.title}</span>`).join('')}</div>`:''}`;
    }
    const box=document.getElementById('home127');if(!box)return;
    const diet=(state.mediaDiet?.media?.length||0)+(state.mediaDiet?.journalists?.length||0);
    const sims=(state.interviewSessions||[]).length;
    const works=(state.v11Works||state.works||[]).length;
    const needsPortfolio=plan.some(u=>u.portfolio);
    box.innerHTML=`${state.v127Demo?`<div class="demo127"><b>Вы смотрите демо-режим</b><p>Прогресс хранится в этом браузере. Поэтому здесь могут отображаться вузы и задания, которые вы выбирали во время прошлых тестов.</p><button class="btn small secondary" onclick="resetMMTFirstRun()">Посмотреть как новый пользователь</button></div>`:''}
      <div class="welcome127"><h3>Что ещё стоит сделать</h3><div class="plainSteps127">
        <div class="plainStep127" data-go="agendaHub"><div class="n">1</div><div><b>СМИ и журналисты для подготовки</b><small>${diet?`выбрано ${diet} из 10`:'ещё не выбраны'}</small></div><span class="chev">›</span></div>
        ${needsPortfolio?`<div class="plainStep127" data-go="portfolio2Hub"><div class="n">2</div><div><b>Портфолио</b><small>${works?`добавлено работ: ${works}`:'добавьте первые работы и публикации'}</small></div><span class="chev">›</span></div>`:''}
        ${plan.some(u=>(u.formats||[]).some(x=>/коллоквиум|собесед/.test(x)))?`<div class="plainStep127" data-go="interviewSimulationSetup"><div class="n">3</div><div><b>Тренировочное собеседование</b><small>${sims?`пройдено попыток: ${sims}`:'ещё не пробовали'}</small></div><span class="chev">›</span></div>`:''}
        <div class="plainStep127" data-go="calendar"><div class="n">${needsPortfolio?4:2}</div><div><b>Даты экзаменов и дедлайны</b><small>покажем только подтверждённые даты; неизвестные не угадываем</small></div><span class="chev">›</span></div>
      </div></div>
      ${!plan.length?`<div class="how127"><div class="meta">Как работает MMT ДВИ</div><div class="howrow"><span>1</span><div><b>Вы выбираете вузы</b><div class="meta">Можно сравнить несколько вариантов.</div></div></div><div class="howrow"><span>2</span><div><b>Приложение собирает маршрут</b><div class="meta">Общая база + задания конкретных ДВИ.</div></div></div><div class="howrow"><span>3</span><div><b>Маршрут меняется по срокам и прогрессу</b><div class="meta">Чем ближе экзамен, тем выше приоритет обязательных задач.</div></div></div></div>`:''}`;
  }

  /* Remove internal methodology jargon from navigation labels. The concepts can be introduced later inside lessons with explanation. */
  function plainLanguage(root=document){
    const replacements=[
      ['Медиарацион','СМИ и журналисты для подготовки'],
      ['медиарацион','список СМИ и журналистов'],
      ['исходную медиакарту','список СМИ и журналистов'],
      ['медиакарту','список СМИ и журналистов'],
      ['Медиаоблака','Связи СМИ и журналистов'],
      ['медиаоблаков','связей СМИ и журналистов'],
      ['медиаоблако','связь СМИ и журналистов'],
      ['0 симуляций','ещё не пробовали'],
      ['Даты кампании','Даты экзаменов'],
      ['нужна актуализация','ещё не подтверждены']
    ];
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{let t=n.nodeValue;replacements.forEach(([a,b])=>{t=t.split(a).join(b)});n.nodeValue=t});
  }

  const oldRefresh=window.refresh;if(typeof oldRefresh==='function'){window.refresh=function(){oldRefresh();renderHome127();plainLanguage()}};
  renderHome127();plainLanguage();
  new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes.length))setTimeout(()=>plainLanguage(),20)}).observe(document.querySelector('main')||document.body,{subtree:true,childList:true});
})();
