/* MMT ДВИ v0.7 — пробник → разбор → следующий маршрут */
(function setupV07(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.7';
  document.title='MMT ДВИ — v0.7';

  state.mockHistory = Array.isArray(state.mockHistory) ? state.mockHistory : [];
  state.routeNotes = Array.isArray(state.routeNotes) ? state.routeNotes : [];

  const css=document.createElement('style');
  css.textContent=`
    .mockhero{background:var(--ink);color:#fff;border-radius:22px;padding:18px;margin:12px 0}.mockhero .meta{color:#bbb}.mockcard{background:#fff;border:1px solid var(--line);border-radius:20px;padding:16px;margin:12px 0}.mockcard.locked{opacity:.72}.mocktag{display:inline-flex;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:700;background:var(--muted)}.mocktag.ready{background:var(--gb);color:var(--g)}.mocktag.demo{background:var(--os)}
    .diagrow{display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;padding:13px 0;border-bottom:1px solid #eee}.diagrow:last-child{border-bottom:0}.diagicon{width:42px;height:42px;border-radius:13px;background:var(--muted);display:grid;place-items:center;font-weight:800}.diagicon.good{background:var(--gb);color:var(--g)}.diagicon.warn{background:var(--yb);color:var(--y)}.diagicon.work{background:var(--os)}
    .routeitem{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:13px 0;border-bottom:1px solid #eee}.routeitem:last-child{border-bottom:0}.routeitem .n{width:30px;height:30px;border-radius:10px;background:var(--o);display:grid;place-items:center;font-weight:800}.whybox{background:var(--os);border-radius:14px;padding:11px 12px;margin-top:8px;font-size:12px;line-height:1.45}.historyrow{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #eee}.historyrow:last-child{border:0}
  `;
  document.head.appendChild(css);

  function appendScreen(id,html){
    if(document.getElementById(id))return document.getElementById(id);
    const s=document.createElement('section');s.id=id;s.className='screen';s.innerHTML=html;document.querySelector('main').appendChild(s);return s;
  }

  const prepare=document.getElementById('prepare');
  if(prepare&&!document.getElementById('mockCenterCard')){
    const notice=prepare.querySelector('.notice');
    const a=document.createElement('div');a.id='mockCenterCard';a.className='card orange click';a.setAttribute('data-go','mockCenter');a.innerHTML='<div class="row between"><div><h3>Пробные ДВИ</h3><p class="meta">СПбГИКиТ · МПГУ · РАНХиГС</p></div><span class="chev">›</span></div>';
    const b=document.createElement('div');b.id='diagnosticsCard';b.className='card click';b.setAttribute('data-go','diagnostics');b.innerHTML='<div class="row between"><div><h3>Мои слабые места</h3><p class="meta">Не оценка личности — только незакрытые учебные действия и ошибки тренажёров</p></div><span class="chev">›</span></div>';
    if(notice){notice.before(a);notice.before(b)}else{prepare.append(a,b)}
  }

  appendScreen('mockCenter',`
    <div class="eye">Контроль готовности</div><h2>Пробные ДВИ</h2>
    <div class="mockhero"><div class="meta">Главная идея</div><h3>Пробник нужен не ради одной цифры</h3><p>После попытки приложение должно показать слабые темы и перестроить ближайшие задания.</p></div>
    <div id="mockSpb" class="mockcard"><div class="row between"><div><h3>СПбГИКиТ</h3><p class="meta">письменная работа · 120 минут</p></div><span class="mocktag demo">демо</span></div><p>Пробная письменная работа с выбором темы, таймером и последующим разбором.</p><button class="btn" onclick="startMockSpb()">Открыть пробник</button></div>
    <div id="mockMpgu" class="mockcard"><div class="row between"><div><h3>МПГУ</h3><p class="meta">творческое сочинение</p></div><span class="mocktag demo">пример билета</span></div><p>Выбор одной темы, короткий замысел и начало текста. Позже добавим полноценный таймер и критерии.</p><button class="btn" onclick="startMockMpgu()">Открыть тренировочный билет</button></div>
    <div id="mockRanepa" class="mockcard"><div class="row between"><div><h3>РАНХиГС</h3><p class="meta">письменное тестирование</p></div><span class="mocktag demo">мини-пробник</span></div><p>Пока короткая версия для проверки механики блоков, весов и банка ошибок.</p><button class="btn" onclick="startMockRanepa()">Открыть мини-пробник</button></div>
    <div class="notice">Содержание всех трёх пробников ещё будет отдельно дорабатываться. В v0.7 проверяем именно связку «попытка → разбор → следующий шаг».</div>`);

  appendScreen('diagnostics',`
    <div class="eye">Персональный маршрут</div><div class="row between"><h2>Мои слабые места</h2><span class="status o">демо-диагностика</span></div>
    <p class="sub">Здесь нет фиктивных «оценок интеллекта» или качества текста. Экран использует только реальные действия в прототипе: что пройдено, где были ошибки и что ещё не пробовали.</p>
    <div id="diagnosticList" class="card"></div>
    <button class="btn" data-go="nextRoute">Собрать следующий маршрут</button>
    <button class="btn secondary" data-go="mockCenter">К пробным ДВИ</button>`);

  appendScreen('nextRoute',`
    <div class="eye">Что делать дальше</div><h2>Ближайшие действия</h2><p class="sub">Маршрут строится из текущих незакрытых шагов. Когда контент станет финальным, здесь будут учитываться и результаты по критериям.</p>
    <div id="nextRouteList" class="card"></div>
    <button class="btn secondary" data-go="prepare">Вернуться в подготовку</button>`);

  appendScreen('mockHistory',`
    <div class="eye">Контроль готовности</div><div class="row between"><h2>История пробников</h2><span id="mockHistoryCount" class="status o">0</span></div>
    <div id="mockHistoryList"></div><div class="notice">Пока сохраняем только факт прохождения демо-режима и доступные объективные результаты тренажёра. Позже появятся полноценные попытки по каждому вузу.</div>`);

  const home=document.getElementById('home');
  if(home&&!document.getElementById('homeDiagCard')){
    const review=document.getElementById('reviewState');
    const c=document.createElement('div');c.id='homeDiagCard';c.className='card click';c.setAttribute('data-go','diagnostics');
    c.innerHTML='<div class="row between"><div><b>Следующий шаг после тренировок</b><p class="meta" id="homeDiagText">Посмотреть, что ещё не закрыто</p></div><span class="chev">›</span></div>';
    review?.after(c);
  }

  window.startMockSpb=function(){
    if(!state.savedUni){toast('Сначала добавьте СПбГИКиТ в свой план');go('uni');return}
    recordMock('СПбГИКиТ','Открыт демо-пробник письменной работы');
    go(document.getElementById('mock')?'mock':'spbgikit');
  };
  window.startMockMpgu=function(){
    if(!state.savedMpgu){toast('Сначала добавьте МПГУ в свой план');go('mpgu');return}
    recordMock('МПГУ','Открыт тренировочный билет');
    go('mpguTicket');
  };
  window.startMockRanepa=function(){
    if(!state.savedRanepa){toast('Сначала добавьте РАНХиГС в свой план');go('ranepa');return}
    recordMock('РАНХиГС','Открыт MMT мини-пробник');
    if(typeof startRanepaMini==='function')startRanepaMini();else go('ranepaPrep');
  };
  function recordMock(uni,note){
    const last=state.mockHistory[state.mockHistory.length-1];
    if(!last||last.uni!==uni||last.note!==note){state.mockHistory.push({uni,note,date:new Date().toLocaleDateString('ru-RU',{day:'2-digit',month:'short'})});saveState()}
  }

  function getSignals(){
    const signals=[];
    const mistakes=Array.isArray(state.ranepaMistakes)?state.ranepaMistakes.length:0;
    signals.push({kind:state.newsRevised?'good':'work',title:'Новости',text:state.newsRevised?'Есть исправленная учебная новость':'Не закрыт полный цикл новости: работа → разбор → исправление',go:'newsCourse'});
    signals.push({kind:state.revised?'good':'work',title:'Репортаж',text:state.revised?'Есть повторная сдача репортажа':'Практический репортаж ещё не доведён до повторной сдачи',go:'base'});
    signals.push({kind:(state.oralAnswers||[]).length>=2?'good':'warn',title:'Устный ответ',text:(state.oralAnswers||[]).length>=2?'Есть минимум две попытки для сравнения':'Нужно сохранить хотя бы две попытки, чтобы видеть динамику',go:'oralHistory'});
    if(state.savedRanepa)signals.push({kind:mistakes?'warn':'work',title:'РАНХиГС',text:mistakes?`В банке ошибок: ${mistakes}. Их стоит разобрать перед следующим пробником`:'Мини-пробник ещё не дал банка ошибок — пройдите его или повторите',go:mistakes?'ranepaMistakes':'ranepaPrep'});
    if(state.savedMpgu)signals.push({kind:state.mpguTicketDraft?'good':'work',title:'МПГУ',text:state.mpguTicketDraft?'Есть сохранённая тренировка по творческой теме':'Тренировочный билет ещё не доведён до сохранённого черновика',go:'mpguTicket'});
    if(state.savedUni)signals.push({kind:'work',title:'СПбГИКиТ',text:'Пробную письменную работу пока нужно использовать как отдельную тренировку; полноценная диагностика по критериям ещё впереди',go:document.getElementById('mock')?'mock':'spbgikit'});
    return signals;
  }

  function renderDiagnostics(){
    const box=document.getElementById('diagnosticList');if(!box)return;const s=getSignals();
    box.innerHTML=s.map(x=>`<div class="diagrow click" data-go="${x.go}"><div class="diagicon ${x.kind}">${x.kind==='good'?'✓':x.kind==='warn'?'!':'→'}</div><div><b>${x.title}</b><div class="meta">${x.text}</div></div><span class="chev">›</span></div>`).join('');
    const pending=s.filter(x=>x.kind!=='good').length;setText('homeDiagText',pending?`Незакрытых учебных направлений: ${pending}`:'Базовые демо-шаги закрыты — пора на следующий пробник');
  }

  function renderRoute(){
    const box=document.getElementById('nextRouteList');if(!box)return;const s=getSignals().filter(x=>x.kind!=='good').slice(0,3);
    if(!s.length){box.innerHTML='<div class="green" style="border-radius:14px;padding:14px"><b>Демо-маршрут закрыт.</b><p>Следующим шагом будет полноценный пробник по выбранному вузу.</p></div>';return}
    box.innerHTML=s.map((x,i)=>`<div class="routeitem click" data-go="${x.go}"><div class="n">${i+1}</div><div><b>${x.title}</b><p class="meta">${x.text}</p><div class="whybox"><b>Почему сейчас:</b> это одно из ближайших незакрытых действий в текущем маршруте.</div></div></div>`).join('');
  }

  function renderMockHistory(){
    const list=document.getElementById('mockHistoryList');if(!list)return;const a=state.mockHistory||[];setText('mockHistoryCount',String(a.length));
    list.innerHTML=a.length?`<div class="card">${a.slice().reverse().map(x=>`<div class="historyrow"><div><b>${esc(x.uni)}</b><div class="meta">${esc(x.note)}</div></div><span class="status o">${esc(x.date)}</span></div>`).join('')}</div>`:'<div class="card"><p>Пробники ещё не открывались.</p></div>';
  }

  const mockCenter=document.getElementById('mockCenter');
  if(mockCenter&&!document.getElementById('mockHistoryBtn')){
    const b=document.createElement('button');b.id='mockHistoryBtn';b.className='btn secondary';b.setAttribute('data-go','mockHistory');b.textContent='История пробников';mockCenter.appendChild(b);
  }

  const oldRefresh=window.refresh;
  if(typeof oldRefresh==='function'){
    window.refresh=function(){oldRefresh();renderDiagnostics();renderRoute();renderMockHistory();};
  }
  renderDiagnostics();renderRoute();renderMockHistory();
})();
