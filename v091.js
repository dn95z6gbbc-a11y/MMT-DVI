/* MMT ДВИ v0.9.1 — симуляции собеседования: общая + по вузам */
(function setupV091(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.9.1';
  document.title='MMT ДВИ — v0.9.1';

  state.interviewSessions=Array.isArray(state.interviewSessions)?state.interviewSessions:[];
  state.interviewSim=state.interviewSim&&typeof state.interviewSim==='object'?state.interviewSim:null;

  const css=document.createElement('style');
  css.textContent=`
    .simHero{background:var(--ink);color:#fff;border-radius:22px;padding:18px;margin:12px 0}.simHero .meta{color:#bbb}
    .simModes{display:grid;gap:8px;margin:12px 0}.simModeCard{background:#fff;border:1px solid var(--line);border-radius:17px;padding:14px}.simModeCard.active{border-color:var(--o);background:#fff9f5}.simModeCard h3{margin:0 0 5px}.simModeCard .row{align-items:center}
    .lengthPick{display:flex;gap:7px;margin:10px 0}.lengthPick button{flex:1;border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px;font-weight:700}.lengthPick button.active{background:var(--ink);color:#fff;border-color:var(--ink)}
    .commission{background:#fff;border:2px solid var(--o);border-radius:22px;padding:17px;margin:12px 0}.commissionHead{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.commissionWho{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--o)}.commissionQ{font:700 20px/1.25 Montserrat,Arial,sans-serif;margin:8px 0}.commissionNote{font-size:11px;color:var(--soft);margin-top:9px}
    .simProgress{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin:12px 0}.simDot{height:8px;background:#e8e6e2;border-radius:999px}.simDot.done{background:var(--ink)}.simDot.current{background:var(--o)}
    .simAnswerList{display:grid;gap:8px}.simAnswerItem{background:#fff;border:1px solid var(--line);border-radius:15px;padding:12px}.simAnswerItem small{color:var(--soft)}.simAnswerItem p{font-size:13px;white-space:pre-wrap;margin:7px 0 0}
    .coverage{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.coverage span{background:var(--muted);border-radius:999px;padding:7px 9px;font-size:11px}.coverage span.hit{background:var(--gb);color:var(--g)}
    .simSource{font-size:11px;line-height:1.4;background:var(--muted);border-radius:13px;padding:10px;margin:10px 0}.simSource.official{background:var(--gb)}
    .sessionRow{background:#fff;border:1px solid var(--line);border-radius:16px;padding:13px;margin:8px 0}.sessionRow .mini{font-size:11px;color:var(--soft)}
    .modeBadge{font-size:10px;font-weight:800;border-radius:999px;background:var(--os);padding:6px 8px}.simInline{border:1px solid var(--o);background:#fff9f5;border-radius:16px;padding:13px;margin:12px 0}
  `;document.head.appendChild(css);

  function appendScreen(id,html){if(document.getElementById(id))return document.getElementById(id);const s=document.createElement('section');s.id=id;s.className='screen';s.innerHTML=html;document.querySelector('main').appendChild(s);return s}

  function safe(s){return typeof esc==='function'?esc(String(s||'')):String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

  function dietMedia(){return state.mediaDiet&&Array.isArray(state.mediaDiet.media)?state.mediaDiet.media:[]}
  function dietJournalists(){return state.mediaDiet&&Array.isArray(state.mediaDiet.journalists)?state.mediaDiet.journalists:[]}

  const generalBank=[
    {cat:'Мотивация',q:'Почему вы хотите стать журналистом?',follow:'Вы назвали мотивацию. А какое конкретное событие или опыт сильнее всего повлияли на этот выбор?'},
    {cat:'Опыт',q:'Какой ваш собственный журналистский или медиапроект лучше всего показывает, что профессия вам действительно интересна?',follow:'Что именно в этой работе сделали лично вы и что сейчас сделали бы иначе?'},
    {cat:'СМИ',q:'Какие СМИ вы читаете регулярно и почему именно их?',follow:'Назовите один конкретный материал из одного из этих СМИ, который вам запомнился. Чем он был хорошо сделан?'},
    {cat:'Журналисты',q:'Назовите журналиста, за которым вы следите. Что именно вам интересно в его или её работе?',follow:'А с каким другим журналистом или редакцией вы бы сравнили его или её подход?'},
    {cat:'Повестка',q:'Какое событие последних дней вы считаете важным и почему?',follow:'Если бы редакция поручила вам материал на эту тему завтра, какого героя и какого эксперта вы бы искали?'},
    {cat:'Культура',q:'Какую книгу, фильм, спектакль или выставку последнего времени вы готовы содержательно обсудить с комиссией?',follow:'Что именно в этой работе связано с вашим будущим журналистским взглядом?'},
    {cat:'Профессия',q:'Какими качествами должен обладать хороший журналист и какое из них вам ещё нужно развивать?',follow:'Как вы собираетесь развивать это качество на практике?'},
    {cat:'Профессия',q:'Чем, по-вашему, журналист отличается от блогера?',follow:'Приведите пример ситуации, где это различие особенно важно.'},
    {cat:'Кругозор',q:'Назовите событие из истории России или мира, которое помогает лучше понимать современную повестку.',follow:'Какая современная тема становится понятнее благодаря этому историческому контексту?'},
    {cat:'Идеи',q:'Какую историю о своём городе или поколении вы хотели бы однажды рассказать как журналист?',follow:'Почему эту историю нужно рассказывать именно сейчас и кто был бы её главным героем?'},
    {cat:'Будущее',q:'Кем вы видите себя через четыре года, после окончания бакалавриата?',follow:'Что должно произойти за эти четыре года, чтобы вы сочли обучение успешным?'},
    {cat:'Медиасреда',q:'Как вы проверяете новость, если видите её только в одном Telegram-канале?',follow:'Какие признаки заставят вас не доверять источнику и искать дополнительное подтверждение?'}
  ];

  const gitrBank=[
    {cat:'Культура',q:'Перечислите 5 ваших любимых литературных произведений. Обоснуйте свой выбор.',source:'ГИТР · программа 2026',follow:'Выберите одно из названных произведений: почему именно оно важно лично вам?'},
    {cat:'Повестка',q:'Какие события произошли в вашем городе, нашей стране и мире за последний год, месяц и день?',source:'ГИТР · программа 2026',follow:'Какое одно событие из перечисленных вы бы выбрали для собственного журналистского материала и почему?'},
    {cat:'Мотивация',q:'Почему вы хотите стать журналистом?',source:'ГИТР · программа 2026',follow:'Почему для этого вам нужен именно университет, а не только практика в редакции?'},
    {cat:'Опыт',q:'Есть ли у вас опыт журналистской работы? Когда? Где? В каком объёме?',source:'ГИТР · программа 2026',follow:'Какую конкретную задачу в этой работе вы решали самостоятельно?'},
    {cat:'Профессия',q:'Какими качествами должен обладать журналист?',source:'ГИТР · программа 2026',follow:'Какое из названных качеств вы можете подтвердить примером из своего опыта?'},
    {cat:'Журналисты',q:'Каких журналистов вы знаете? Расскажите о них.',source:'ГИТР · программа 2026',follow:'Выберите одного: какой его материал или проект можете разобрать подробнее?'},
    {cat:'Медиа',q:'Какой для вас главный источник новостей? Почему?',source:'ГИТР · программа 2026',follow:'Какие его слабые стороны вы видите и чем дополняете этот источник?'},
    {cat:'Профессия',q:'Какая журналистика вам интереснее: печатная, радио-, теле- или интернет-журналистика? Объясните, почему.',source:'ГИТР · программа 2026',follow:'Какой формат в выбранном типе журналистики вы хотели бы освоить первым?'},
    {cat:'Медиа',q:'Назовите сайты, материалы которых вы читаете регулярно. Расскажите о них.',source:'ГИТР · программа 2026',follow:'Чем редакционная подача двух названных вами изданий отличается?'},
    {cat:'Кругозор',q:'Кто такой Иван Фёдоров?',source:'ГИТР · программа 2026',follow:'Почему история печати вообще важна будущему журналисту цифровой эпохи?'},
    {cat:'Кругозор',q:'Когда появилось радио? Кто его изобрёл?',source:'ГИТР · программа 2026',follow:'Как радио изменило журналистику как профессию?'},
    {cat:'Кругозор',q:'Когда появилось телевидение? Кто его изобрёл?',source:'ГИТР · программа 2026',follow:'Что телевидение добавило к возможностям журналиста по сравнению с радио?'},
    {cat:'Будущее',q:'Кем вы себя видите через 4 года, когда получите диплом о высшем образовании?',source:'ГИТР · программа 2026',follow:'Какой первый профессиональный результат вы хотите получить ещё во время учёбы?'}
  ];

  function spbBank(){
    const media=dietMedia(), journ=dietJournalists();
    return [
      {cat:'Медиа',q:media.length?`Вы выбрали для регулярного чтения «${media[0]}». Почему именно это СМИ и какой его недавний материал можете обсудить?`:'Какие российские СМИ вы читаете регулярно и почему именно их?',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Назовите конкретный материал за последний месяц и объясните, что в нём сделано профессионально.'},
      {cat:'Журналисты',q:journ.length?`Вы следите за журналистом ${journ[0]}. Что именно в его или её работе вам интересно?`:'Назовите журналистов, чью работу вы регулярно отслеживаете. Чем они вам интересны?',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'С каким другим журналистом или редакцией можно сравнить этот подход?'},
      {cat:'Повестка',q:'Какое событие последней недели вы считаете важным? Объясните не только что произошло, но и почему это важно.',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Как бы вы превратили эту тему в собственный журналистский материал?'},
      {cat:'Культура',q:'Назовите культурное событие, книгу, фильм или выставку, которые вы можете содержательно обсудить.',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Какой вопрос вы бы задали автору, режиссёру или куратору?'},
      {cat:'Петербург',q:'Что в культурной или общественной жизни Санкт-Петербурга вам интересно и почему?',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Какую петербургскую тему вы бы предложили для репортажа?'},
      {cat:'Профессия',q:'Какие инструменты сегодня должен уметь использовать журналист кроме текста?',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Какой из этих инструментов вы уже использовали сами?'},
      {cat:'Опыт',q:'Расскажите о работе из своего портфолио, которую готовы защищать перед комиссией.',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Как появилась тема, кого вы нашли и что было самым сложным в работе?'},
      {cat:'Мотивация',q:'Почему вы хотите изучать журналистику именно как профессию?',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Что вы уже делаете сейчас, чтобы проверить этот выбор практикой?'},
      {cat:'Кругозор',q:'Назовите событие из истории или культуры России, о котором вы могли бы говорить несколько минут без подготовки.',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Как оно связано с современностью?'},
      {cat:'Идеи',q:'Если завтра вам дадут камеру, диктофон и один день на материал, какую тему вы выберете?',source:'MMT · тренировка по требованиям СПбГИКиТ',follow:'Кто станет героем и какой будет первая сцена или первый вопрос?'}
    ];
  }

  function bankFor(mode){return mode==='gitr'?gitrBank:mode==='spbgikit'?spbBank():generalBank}
  function modeTitle(mode){return mode==='gitr'?'ГИТР':mode==='spbgikit'?'СПбГИКиТ':'Общая MMT'}

  // entry on the common interview hub
  const hub=document.getElementById('interviewHub');
  if(hub&&!document.getElementById('simInterviewEntry')){
    const hero=hub.querySelector('.oralHero');
    const c=document.createElement('div');c.id='simInterviewEntry';c.className='simInline';
    c.innerHTML='<div class="row between"><div><h3>Симуляция собеседования</h3><p class="meta">5 или 10 вопросов подряд · уточнения комиссии · итог без фиктивного балла</p></div><span class="status o">новое</span></div><button class="btn" onclick="openSimulationSetup(\'general\')">Общая симуляция MMT</button><button class="btn secondary" data-go="interviewSimulationSetup">Выбрать режим</button>';
    hero?.after(c);
  }

  // entry inside university-specific oral screens
  const gitrOral=document.getElementById('gitrOral');
  if(gitrOral&&!document.getElementById('gitrSimBtn')){
    const b=document.createElement('button');b.id='gitrSimBtn';b.className='btn';b.textContent='Пройти симуляцию собеседования ГИТРа';b.onclick=()=>openSimulationSetup('gitr');
    const firstBtn=gitrOral.querySelector('button');firstBtn?.before(b);
  }
  const spbOral=document.getElementById('oral');
  if(spbOral&&!document.getElementById('spbSimBtn')){
    const b=document.createElement('button');b.id='spbSimBtn';b.className='btn';b.textContent='Пройти симуляцию коллоквиума СПбГИКиТ';b.onclick=()=>openSimulationSetup('spbgikit');spbOral.appendChild(b);
  }

  appendScreen('interviewSimulationSetup',`
    <div class="eye">Собеседование · симуляция</div><h2>Выберите комиссию</h2>
    <p class="sub">Общий режим тренирует собственные знания о профессии и кругозор. Режим вуза перестраивает вопросы под конкретную программу и требования.</p>
    <div class="simModes">
      <div id="simModeGeneral" class="simModeCard"><div class="row between"><div><h3>Общая MMT</h3><p class="meta">профессия · опыт · медиа · повестка · культура · кругозор</p></div><span class="modeBadge">без вуза</span></div><button class="btn small secondary" onclick="selectSimulationMode('general')">Выбрать</button></div>
      <div id="simModeGitr" class="simModeCard"><div class="row between"><div><h3>ГИТР</h3><p class="meta">реальные типы вопросов программы 2026 + уточнения MMT</p></div><span class="modeBadge">вуз</span></div><button class="btn small secondary" onclick="selectSimulationMode('gitr')">Выбрать</button></div>
      <div id="simModeSpb" class="simModeCard"><div class="row between"><div><h3>СПбГИКиТ</h3><p class="meta">медиа · культура · Петербург · повестка · портфолио</p></div><span class="modeBadge">вуз</span></div><button class="btn small secondary" onclick="selectSimulationMode('spbgikit')">Выбрать</button></div>
    </div>
    <div class="card"><h3>Длина попытки</h3><div class="lengthPick"><button id="simLen5" class="active" onclick="selectSimulationLength(5)">5 вопросов</button><button id="simLen10" onclick="selectSimulationLength(10)">10 вопросов</button></div><p class="meta">Уточняющий вопрос комиссии считается отдельным вопросом и может заменить один из следующих базовых вопросов.</p></div>
    <div id="simSetupSource" class="simSource"></div>
    <button class="btn" onclick="beginInterviewSimulation()">Начать собеседование</button>
    <button class="btn secondary" data-go="interviewSimulationHistory">История симуляций</button>`);

  appendScreen('interviewSimulation',`
    <div class="eye">Собеседование · в процессе</div><div class="row between"><h2 id="simRunTitle">Общая MMT</h2><span id="simRunCounter" class="status o">1 / 5</span></div>
    <div id="simProgress" class="simProgress"></div>
    <div class="commission"><div class="commissionHead"><span class="commissionWho">Комиссия</span><span id="simQCategory" class="modeBadge">мотивация</span></div><div id="simQuestion" class="commissionQ"></div><div id="simQuestionSource" class="commissionNote"></div></div>
    <div class="label">Ваш ответ</div><textarea id="simAnswer" class="textarea" style="min-height:190px" placeholder="Отвечайте так, как отвечали бы комиссии. Не пишите идеальный текст заранее."></textarea>
    <div class="notice">В веб-прототипе ответ вводится текстом. В мобильной версии этот же сценарий планируется для голосовой записи.</div>
    <button class="btn" onclick="submitSimulationAnswer()">Ответить комиссии</button>
    <button class="btn secondary" onclick="leaveSimulation()">Закончить попытку</button>`);

  appendScreen('interviewSimulationResult',`
    <div class="eye">Собеседование · завершено</div><h2>Разбор попытки</h2>
    <div id="simResultHero"></div><div id="simCoverage" class="coverage"></div><div id="simResultRoute"></div>
    <div class="card"><h3>Ваши ответы</h3><div id="simResultAnswers" class="simAnswerList"></div></div>
    <button class="btn" onclick="repeatLastSimulation()">Пройти ещё раз</button><button class="btn secondary" data-go="interviewSimulationHistory">История симуляций</button><button class="btn secondary" data-go="interviewHub">Вернуться к тренировке собеседования</button>`);

  appendScreen('interviewSimulationHistory',`
    <div class="eye">Устная подготовка</div><div class="row between"><h2>Симуляции</h2><span id="simHistoryCount" class="status o">0</span></div>
    <p class="sub">Смотрите, какие типы вопросов уже встречались, и повторяйте беседу. Здесь не будет искусственного рейтинга «на 87 баллов» без реальной проверки качества речи.</p><div id="simHistoryList"></div>`);

  state.simSetupMode=state.simSetupMode||'general';state.simSetupLength=state.simSetupLength||5;

  window.openSimulationSetup=function(mode){state.simSetupMode=mode||'general';saveState();renderSimSetup();go('interviewSimulationSetup')};
  window.selectSimulationMode=function(mode){state.simSetupMode=mode;saveState();renderSimSetup()};
  window.selectSimulationLength=function(n){state.simSetupLength=n===10?10:5;saveState();renderSimSetup()};

  function shuffled(a){const arr=a.map(x=>({...x}));for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

  window.beginInterviewSimulation=function(){
    const mode=state.simSetupMode||'general',len=state.simSetupLength===10?10:5;
    if(mode==='gitr'&&!state.savedGitr){toast('Сначала добавьте ГИТР в свой план — полная вузовская подготовка открывается после выбора вуза');go('gitr');return}
    if(mode==='spbgikit'&&!state.savedUni){toast('Сначала добавьте СПбГИКиТ в свой план');go('uni');return}
    let pool=shuffled(bankFor(mode));
    // Guarantee broad coverage in general mode by taking different categories first.
    if(mode==='general'){
      const seen=new Set(),diverse=[];pool.forEach(q=>{if(!seen.has(q.cat)){seen.add(q.cat);diverse.push(q)}});pool.forEach(q=>{if(!diverse.includes(q))diverse.push(q)});pool=diverse;
    }
    state.interviewSim={mode,length:len,index:0,questions:pool.slice(0,len),answers:[],startedAt:new Date().toLocaleString('ru-RU'),finished:false};
    saveState();renderSimulation();go('interviewSimulation');
  };

  window.submitSimulationAnswer=function(){
    const sim=state.interviewSim;if(!sim||sim.finished){toast('Сначала начните новую симуляцию');return}
    const text=(document.getElementById('simAnswer')?.value||'').trim();if(text.length<20){toast('Ответьте хотя бы несколькими предложениями');return}
    const q=sim.questions[sim.index];sim.answers.push({q:q.q,cat:q.cat,text,source:q.source||'',isFollow:!!q.isFollow});
    // A real commission often asks a follow-up. In prototype we branch when the answer is short,
    // or on every second base question, but label added follow-ups as MMT rather than official wording.
    const shouldFollow=!q.isFollow&&q.follow&&(text.length<160||sim.index%2===0)&&sim.index<sim.length-1;
    if(shouldFollow){
      const follow={cat:'Уточнение',q:q.follow,source:'Уточняющий вопрос MMT · симуляция',isFollow:true};
      sim.questions.splice(sim.index+1,0,follow);if(sim.questions.length>sim.length)sim.questions.pop();
    }
    sim.index++;
    if(sim.index>=sim.length||sim.index>=sim.questions.length){finishSimulation();return}
    saveState();renderSimulation();
  };

  function finishSimulation(){
    const sim=state.interviewSim;if(!sim)return;sim.finished=true;sim.finishedAt=new Date().toLocaleString('ru-RU');
    const saved=JSON.parse(JSON.stringify(sim));state.interviewSessions.unshift(saved);state.interviewSessions=state.interviewSessions.slice(0,20);saveState();renderSimulationResult(saved);go('interviewSimulationResult');
  }
  window.leaveSimulation=function(){const sim=state.interviewSim;if(!sim||!sim.answers.length){toast('Попытка пока пустая');return}sim.length=sim.answers.length;finishSimulation()};
  window.repeatLastSimulation=function(){const s=state.interviewSessions[0];if(s){state.simSetupMode=s.mode;state.simSetupLength=s.length>=8?10:5}renderSimSetup();go('interviewSimulationSetup')};

  function renderSimSetup(){
    const mode=state.simSetupMode||'general';['General','Gitr','Spb'].forEach(k=>document.getElementById('simMode'+k)?.classList.remove('active'));
    document.getElementById(mode==='gitr'?'simModeGitr':mode==='spbgikit'?'simModeSpb':'simModeGeneral')?.classList.add('active');
    document.getElementById('simLen5')?.classList.toggle('active',state.simSetupLength!==10);document.getElementById('simLen10')?.classList.toggle('active',state.simSetupLength===10);
    const src=document.getElementById('simSetupSource');if(src){
      if(mode==='gitr'){src.className='simSource official';src.innerHTML='<b>ГИТР:</b> базовые вопросы берутся из программы ДВИ 2026 по журналистике. Дополнительные уточнения, которых нет в документе, отдельно маркируются как вопросы MMT.'}
      else if(mode==='spbgikit'){src.className='simSource';src.innerHTML='<b>СПбГИКиТ:</b> это тренировочная симуляция MMT по направлениям, которые проверяет коллоквиум. Она не выдаётся за дословный официальный билет.'}
      else {src.className='simSource';src.innerHTML='<b>Общая MMT:</b> вопросы тренируют профессию, личный опыт, медиасреду, повестку, культуру и кругозор независимо от выбранного университета.'}
    }
  }

  function renderSimulation(){
    const sim=state.interviewSim;if(!sim)return;const q=sim.questions[sim.index];if(!q)return;
    const title=document.getElementById('simRunTitle');if(title)title.textContent=modeTitle(sim.mode);
    const ctr=document.getElementById('simRunCounter');if(ctr)ctr.textContent=(sim.index+1)+' / '+sim.length;
    const qp=document.getElementById('simQuestion');if(qp)qp.textContent=q.q;
    const cat=document.getElementById('simQCategory');if(cat)cat.textContent=q.cat;
    const src=document.getElementById('simQuestionSource');if(src)src.textContent=q.source||(sim.mode==='general'?'Банк MMT · общий тренажёр':'Тренировочный вопрос MMT');
    const ans=document.getElementById('simAnswer');if(ans)ans.value='';
    const p=document.getElementById('simProgress');if(p)p.innerHTML=Array.from({length:sim.length},(_,i)=>`<span class="simDot ${i<sim.index?'done':i===sim.index?'current':''}"></span>`).join('');
  }

  function renderSimulationResult(sim){
    if(!sim)return;const hero=document.getElementById('simResultHero');
    const baseAnswers=sim.answers.filter(a=>!a.isFollow),follow=sim.answers.filter(a=>a.isFollow).length;
    const avg=sim.answers.length?Math.round(sim.answers.reduce((s,a)=>s+a.text.length,0)/sim.answers.length):0;
    if(hero)hero.innerHTML=`<div class="simHero"><div class="meta">${safe(modeTitle(sim.mode))}</div><h3>${sim.answers.length} ответов · ${follow} уточнений комиссии</h3><p>Средняя длина текстового ответа: ${avg} знаков. Это не оценка качества — только ориентир для сравнения собственных попыток.</p></div>`;
    const cats=[...new Set(baseAnswers.map(a=>a.cat))],all=['Мотивация','Опыт','СМИ','Журналисты','Повестка','Культура','Профессия','Кругозор','Идеи','Будущее'];
    const cov=document.getElementById('simCoverage');if(cov)cov.innerHTML=all.map(x=>`<span class="${cats.includes(x)?'hit':''}">${safe(x)}</span>`).join('');
    const short=sim.answers.filter(a=>a.text.length<90).length;
    const route=document.getElementById('simResultRoute');if(route){let tips=[];if(short)tips.push(`${short} ответ(а) получились очень короткими — попробуйте добавить тезис, объяснение и пример.`);if(cats.includes('СМИ')&&dietMedia().length<5)tips.push('На вопросах о СМИ не хватает сформированного списка 5+5 — вернитесь в «Медиасреду».');if(cats.includes('Повестка')&&(!state.agendaDone||Object.keys(state.agendaDone).length<1))tips.push('В симуляции была повестка — полезно пройти недельный блок и повторить попытку.');if(!tips.length)tips.push('Повторите беседу с новой выборкой вопросов и сравните, стали ли ответы конкретнее.');route.innerHTML='<div class="card"><h3>Следующий маршрут</h3>'+tips.map(t=>`<p>→ ${safe(t)}</p>`).join('')+'<button class="btn secondary" data-go="agendaHub">Медиасреда и повестка</button><button class="btn secondary" data-go="interviewHub">Тренировка собеседования</button></div>'}
    const list=document.getElementById('simResultAnswers');if(list)list.innerHTML=sim.answers.map((a,i)=>`<div class="simAnswerItem"><small>${i+1}. ${safe(a.cat)}${a.isFollow?' · уточнение':''}</small><b>${safe(a.q)}</b><p>${safe(a.text)}</p></div>`).join('');
  }

  function renderHistory(){const list=document.getElementById('simHistoryList'),count=document.getElementById('simHistoryCount');if(count)count.textContent=String(state.interviewSessions.length);if(!list)return;if(!state.interviewSessions.length){list.innerHTML='<div class="notice">Пока нет завершённых симуляций.</div>';return}list.innerHTML=state.interviewSessions.map((s,i)=>`<div class="sessionRow"><div class="row between"><div><b>${safe(modeTitle(s.mode))}</b><div class="mini">${safe(s.finishedAt||s.startedAt||'')}</div></div><span class="status ${s.mode==='general'?'o':'g'}">${s.answers?.length||0} вопросов</span></div><div class="coverage">${[...new Set((s.answers||[]).filter(a=>!a.isFollow).map(a=>a.cat))].map(c=>`<span class="hit">${safe(c)}</span>`).join('')}</div><button class="btn small secondary" onclick="openPastSimulation(${i})">Открыть</button></div>`).join('')}
  window.openPastSimulation=function(i){const s=state.interviewSessions[i];if(!s)return;renderSimulationResult(s);go('interviewSimulationResult')};

  const oldRefresh=window.refresh;if(typeof oldRefresh==='function'){window.refresh=function(){oldRefresh();renderSimSetup();renderHistory();if(document.getElementById('interviewSimulation')?.classList.contains('active'))renderSimulation()}}
  renderSimSetup();renderHistory();
})();
