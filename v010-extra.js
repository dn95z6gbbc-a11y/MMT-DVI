/* v0.10 — My Universities also reads the shared registry */
(function(){
  const screen=document.getElementById('myUniversities');
  if(screen){
    screen.innerHTML=`<div class="eye">Персональный маршрут</div><div class="row between"><div><h2>Мои вузы</h2><p class="meta">Цели, которые влияют на подготовку и календарь</p></div><span id="v10MyCount" class="status o">0 / 5</span></div><div id="v10MyUniList"></div><button class="btn" data-go="uniCatalog">Добавить или сравнить вузы</button><div class="notice">Просмотр карточки вуза сам по себе не добавляет его в маршрут. Подготовка, дедлайны и готовность учитываются только для вузов в плане.</div>`;
  }
  function renderMy(){
    const box=document.getElementById('v10MyUniList');if(!box||!window.MMT_UNIVERSITIES)return;
    const all=Object.values(window.MMT_UNIVERSITIES), planned=all.filter(u=>!!state[u.stateKey]);
    const count=document.getElementById('v10MyCount');if(count)count.textContent=planned.length+' / 5';
    box.innerHTML=planned.length?planned.map(u=>`<div class="uniCard10 inplan"><div class="titleline"><div><h3>${typeof esc==='function'?esc(u.title):u.title}</h3><div class="meta">${typeof esc==='function'?esc(u.city+' · '+u.program):u.city+' · '+u.program}</div></div><span class="status g">в плане</span></div><div class="uniTags10">${u.formats.map(x=>`<span>${typeof esc==='function'?esc(x):x}</span>`).join('')}</div><div class="score"><span>Кампания / версия</span><strong style="font-size:12px;text-align:right">${typeof esc==='function'?esc(u.cycle):u.cycle}</strong></div><button class="btn secondary" data-go="${u.screen}">Открыть вуз</button></div>`).join(''):'<div class="card yellow"><h3>План пока пуст</h3><p>Добавьте университет из каталога. После этого его ДВИ и календарь начнут влиять на ваш маршрут.</p></div>';
  }
  const oldRefresh=window.refresh;
  if(typeof oldRefresh==='function')window.refresh=function(){oldRefresh();renderMy();};
  renderMy();
})();
