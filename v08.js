/* MMT ДВИ v0.8 — медиасреда, медиаоблака и учебная повестка */
(function setupV08(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.8';
  document.title='MMT ДВИ — v0.8';

  state.mediaRecall = state.mediaRecall || {media:'',journalists:''};
  state.mediaDiet = state.mediaDiet || {media:[],journalists:[],region:''};
  state.mediaClouds = Array.isArray(state.mediaClouds) ? state.mediaClouds : [];
  state.agendaDone = state.agendaDone || {};

  const css=document.createElement('style');
  css.textContent=`
    .agendaPath{display:grid;gap:8px;margin:14px 0}.agendaStep{display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:13px}.agendaStep .n{width:34px;height:34px;border-radius:11px;background:var(--muted);display:grid;place-items:center;font-weight:800}.agendaStep.current{border-color:var(--o);background:#fff9f5}.agendaStep.current .n{background:var(--o)}
    .twoCols{display:grid;grid-template-columns:1fr 1fr;gap:9px}.columnBox{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px}.columnBox textarea{min-height:210px}.sourceCard{background:#fff;border:1px solid var(--line);border-radius:17px;padding:14px;margin:9px 0}.sourceCard .src{font-size:11px;color:var(--soft);font-weight:700;text-transform:uppercase;letter-spacing:.05em}.sourceCard h3{margin:5px 0}.safetyFlow{display:grid;gap:7px;margin:12px 0}.safetyItem{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start;padding:10px;background:#fff;border:1px solid var(--line);border-radius:14px}.safetyItem b{display:block;margin-bottom:3px}.cloudCard{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:10px 0}.cloudCore{font:700 18px Montserrat,Arial,sans-serif;margin-bottom:8px}.cloudPeople{display:flex;flex-wrap:wrap;gap:5px}.cloudPeople span{background:var(--muted);border-radius:999px;padding:7px 9px;font-size:12px}.pickGrid{display:grid;gap:8px}.pickRow{display:grid;grid-template-columns:28px 1fr auto;gap:9px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px}.pickRow input{accent-color:var(--o)}.regional{border-left:4px solid var(--o);padding-left:12px}.agendaTopic{background:#fff;border:1px solid var(--line);border-radius:18px;padding:15px;margin:10px 0}.agendaTopic .labels{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.agendaTopic .labels span{font-size:11px;background:var(--muted);border-radius:999px;padding:6px 8px}.useTabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.useTabs div{background:var(--os);border-radius:12px;padding:9px;font-size:11px;line-height:1.35}.safeNote{background:var(--yb);border-radius:14px;padding:12px;font-size:12px;line-height:1.45}.telegramPlan{background:var(--ink);color:#fff;border-radius:20px;padding:16px;margin:12px 0}.telegramPlan .meta{color:#bbb}.dietCount{font:700 28px Montserrat,Arial,sans-serif}.smallLink{font-size:12px;text-decoration:underline;cursor:pointer}.sourceStamp{font-size:11px;color:var(--soft);border-top:1px solid var(--line);margin-top:10px;padding-top:8px}
    @media(max-width:370px){.twoCols,.useTabs{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);

  function appendScreen(id,html){
    if(document.getElementById(id))return document.getElementById(id);
    const s=document.createElement('section');s.id=id;s.className='screen';s.innerHTML=html;document.querySelector('main').appendChild(s);return s;
  }

  // Entry points
  const prepare=document.getElementById('prepare');
  if(prepare&&!document.getElementById('agendaEntry')){
    const cards=[...prepare.querySelectorAll('.card')];
    const dvi=cards.find(x=>x.textContent.includes('Навыки ДВИ'));
    const c=document.createElement('div');c.id='agendaEntry';c.className='card click';c.setAttribute('data-go','agendaHub');
    c.innerHTML='<div class="row between"><div><h3>Медиасреда и повестка</h3><p class="meta">СМИ → журналисты → медиаоблака → 5+5 → события недели</p></div><span class="chev">›</span></div>';
    dvi?.after(c);
  }
  const home=document.getElementById('home');
  if(home&&!document.getElementById('agendaHomeCard')){
    const c=document.createElement('div');c.id='agendaHomeCard';c.className='card click';c.setAttribute('data-go','agendaHub');
    c.innerHTML='<div class="row between"><div><b>Повестка и медиасреда</b><p class="meta">Сначала соберите собственный список СМИ и журналистов</p></div><span class="status o">новое</span></div>';
    home.appendChild(c);
  }

  appendScreen('agendaHub',`
    <div class="eye">Медиасреда MMT</div><h2>Не читать всё. Построить свою систему</h2>
    <p class="sub">Повестка начинается не с бесконечной ленты новостей, а с понимания: какие СМИ и журналисты вы знаете, за кем реально хотите следить и чего вам не хватает.</p>
    <div class="card hero"><div class="row between"><div><div class="meta" style="color:#bbb">Маршрут</div><h3>Знаю → расширяю → выбираю → читаю → применяю</h3></div><span class="status o">MMT</span></div></div>
    <div class="agendaPath">
      <div class="agendaStep current click" data-go="mediaRecall"><div class="n">1</div><div><b>Вспомнить без подсказок</b><div class="meta">2 колонки: СМИ и журналисты</div></div><span>›</span></div>
      <div class="agendaStep click" data-go="mediaRatings"><div class="n">2</div><div><b>Свериться с рейтингами</b><div class="meta">найти то, что забыли</div></div><span>›</span></div>
      <div class="agendaStep click" data-go="mediaClouds"><div class="n">3</div><div><b>Медиаоблака</b><div class="meta">связать редакции и людей</div></div><span>›</span></div>
      <div class="agendaStep click" data-go="mediaDiet"><div class="n">4</div><div><b>Выбрать 5 СМИ + 5 журналистов</b><div class="meta">и подписаться до экзамена</div></div><span>›</span></div>
      <div class="agendaStep click" data-go="regionalMedia"><div class="n">5</div><div><b>Добавить регион</b><div class="meta">если поступаете не только в Москву/Петербург</div></div><span>›</span></div>
      <div class="agendaStep click" data-go="agendaWeek"><div class="n">6</div><div><b>Следить за повесткой</b><div class="meta">неделя → месяц → применение на ДВИ</div></div><span>›</span></div>
    </div>
    <div class="safeNote"><b>Важно:</b> высокий рейтинг цитируемости или популярности не означает автоматически, что источник безопасно использовать на конкретном ДВИ. Перед рекомендацией приложение должно отдельно проверить актуальный правовой статус и правила выбранного вуза.</div>`);

  appendScreen('mediaRecall',`
    <div class="eye">Шаг 1 · без подсказок</div><h2>Что вы помните сами?</h2><p class="sub">Не открывайте рейтинги заранее. Цель — увидеть собственную медиакарту до подсказок.</p>
    <div class="twoCols"><div class="columnBox"><h3>СМИ</h3><p class="meta">По одному в строке</p><textarea id="recallMedia" class="textarea" placeholder="РБК\nКоммерсантъ\n..."></textarea></div><div class="columnBox"><h3>Журналисты</h3><p class="meta">По одному в строке</p><textarea id="recallJournalists" class="textarea" placeholder="Имя Фамилия\n..."></textarea></div></div>
    <button class="btn" onclick="saveMediaRecall()">Сохранить две колонки</button><button class="btn secondary" data-go="mediaRatings">Теперь свериться с рейтингами</button>
    <div class="notice">Мы специально сохраняем первый ответ. Позже можно сравнить, насколько выросла ваша медиакарта.</div>`);

  appendScreen('mediaRatings',`
    <div class="eye">Шаг 2 · расширить карту</div><h2>Рейтинги — подсказка, не готовый ответ</h2>
    <div class="sourceCard"><div class="src">СМИ · основной ориентир</div><h3>Медиалогия</h3><p>Свежие федеральные и региональные рейтинги помогают найти заметные и цитируемые редакции, которые вы не вспомнили сами.</p><div class="sourceStamp">В прототипе: источник для discovery. Данные рейтинга должны обновляться по периоду, а не храниться навсегда.</div></div>
    <div class="sourceCard"><div class="src">Журналисты / авторы · дополнительный ориентир</div><h3>Brand Analytics</h3><p>Свежие рейтинги авторов и тематические рейтинги можно использовать, когда нужен актуальный ориентир по заметным авторам, особенно в Telegram.</p><div class="sourceStamp">Метрика отличается от цитируемости журналистов: для Telegram это просмотры, для ряда других площадок — вовлечённость.</div></div>
    <div class="card yellow"><h3>Почему не берём старый рейтинг журналистов Медиалогии как актуальный</h3><p>Он полезен исторически, но свежих выпусков после 2023 года сейчас нет. В рабочем приложении источник обязательно маркируется датой.</p></div>
    <div class="card"><h3>Алгоритм после рейтинга</h3><div class="step"><span class="num">1</span><div><b>Добавьте забытые СМИ и людей</b><div class="meta">не копируйте весь топ</div></div></div><div class="step"><span class="num">2</span><div><b>Отберите то, что вам реально интересно</b><div class="meta">интерес повышает шанс, что вы будете читать регулярно</div></div></div><div class="step"><span class="num">3</span><div><b>Если ничего не цепляет — возьмите ориентиры из топа</b><div class="meta">лучше устойчивые 5+5, чем хаотичные 30 подписок</div></div></div></div>
    <button class="btn" data-go="mediaClouds">Перейти к медиаоблакам</button>`);

  appendScreen('mediaClouds',`
    <div class="eye">Шаг 3 · упражнение MMT</div><h2>Медиаоблака</h2>
    <p class="sub">Связываем названия редакций с конкретными людьми, а журналистов — с редакциями и коллегами.</p>
    <div class="card softo"><h3>Если начинаете со СМИ</h3><p>Найдите <b>главного редактора + трёх журналистов</b>. Новые фамилии добавьте в правую колонку.</p></div>
    <div class="card softo"><h3>Если начинаете с журналиста</h3><p>Найдите <b>СМИ, где он/она работает + главного редактора + ещё двух журналистов</b> этой редакции. Новых людей тоже добавьте в правую колонку.</p></div>
    <div class="label">Центр облака: СМИ или журналист</div><input id="cloudCore" class="input" placeholder="Например: название редакции">
    <div class="label">Главред / место работы</div><input id="cloudEditor" class="input" placeholder="Имя или редакция">
    <div class="label">Связанные журналисты, через запятую</div><input id="cloudPeople" class="input" placeholder="Имя 1, Имя 2, Имя 3">
    <button class="btn" onclick="addMediaCloud()">Добавить облако</button><div id="cloudList"></div>
    <div class="notice">Пример ученицы из архива MMT показывает именно такую сетевую логику. В рабочем приложении связи, должности и статусы нельзя считать вечными — они требуют даты проверки.</div>`);

  appendScreen('mediaDiet',`
    <div class="eye">Шаг 4 · до экзамена</div><h2>Мой медиарацион: 5 + 5</h2>
    <p class="sub">Выберите пять СМИ и пять журналистов, за которыми готовы следить регулярно. Не «самых правильных вообще», а тех, кого вы действительно будете читать.</p>
    <div class="telegramPlan"><div class="row between"><div><div class="meta">Цель</div><h3>10 постоянных источников внимания</h3></div><div><span class="dietCount" id="dietTotal">0</span><span class="meta"> / 10</span></div></div><p>Telegram — основной удобный сценарий подписки, если у выбранного СМИ или журналиста есть актуальный официальный/авторский канал.</p></div>
    <div class="card"><h3>5 СМИ</h3><div class="pickGrid" id="dietMediaList"></div><button class="btn small secondary" onclick="addDietItem('media')">+ Добавить СМИ</button></div>
    <div class="card"><h3>5 журналистов</h3><div class="pickGrid" id="dietJournalistList"></div><button class="btn small secondary" onclick="addDietItem('journalists')">+ Добавить журналиста</button></div>
    <div class="safeNote">Если интересных вариантов мало, рейтинг помогает выбрать ориентиры. Но перед экзаменом приложение должно отдельно показать, какие источники допустимы для ссылок и примеров именно по правилам выбранного вуза.</div>
    <button class="btn" data-go="regionalMedia">Добавить региональные СМИ</button>`);

  appendScreen('regionalMedia',`
    <div class="eye">Шаг 5 · регион</div><h2>Федеральной повестки недостаточно</h2>
    <div class="card orange"><h3>Если поступаете в региональный вуз</h3><p>Добавьте минимум несколько сильных СМИ региона. Это даёт локальные темы для разговора на ДВИ и одновременно формирует будущий список редакций для стажировки.</p></div>
    <div class="label">Регион поступления</div><input id="dietRegion" class="input" placeholder="Например: Воронежская область">
    <div class="regional"><p><b>Что ищем:</b></p><p>1–2 заметных новостных/деловых СМИ региона, одно медиа с культурой/городской жизнью и, если есть интерес, профильное или спортивное СМИ.</p></div>
    <div class="sourceCard"><div class="src">Discovery</div><h3>Региональные рейтинги Медиалогии</h3><p>Используем свежий рейтинг нужного региона как отправную точку, затем уже проверяем редакцию, тематику, Telegram и актуальные контакты.</p></div>
    <button class="btn" onclick="saveRegion()">Сохранить регион</button><button class="btn secondary" data-go="agendaWeek">К повестке недели</button>`);

  appendScreen('mediaSafety',`
    <div class="eye">Безопасность источников</div><h2>Рейтинг ≠ разрешение использовать на экзамене</h2>
    <p class="sub">У популярного СМИ или журналиста может быть правовой статус или ограничение, важное для конкретного вуза. Это отдельная проверка.</p>
    <div class="safetyFlow"><div class="safetyItem"><span class="num">1</span><div><b>Проверить актуальный статус</b><div class="meta">на дату подготовки, по официальным реестрам/решениям</div></div></div><div class="safetyItem"><span class="num">2</span><div><b>Проверить правила конкретного ДВИ</b><div class="meta">вуз может формулировать собственные ограничения</div></div></div><div class="safetyItem"><span class="num">3</span><div><b>Отделить правовой статус от рекомендации MMT</b><div class="meta">это разные причины не использовать источник</div></div></div><div class="safetyItem"><span class="num">4</span><div><b>Показать дату проверки</b><div class="meta">статусы и правила меняются</div></div></div></div>
    <div class="safeNote"><b>Принцип для продукта:</b> мы не импортируем старые «цветные списки» как истину. Каждый актуальный статус должен иметь источник и дату проверки.</div>`);

  appendScreen('agendaWeek',`
    <div class="eye">Шаг 6 · учебная повестка</div><div class="row between"><h2>Эта неделя</h2><span class="status o">демо</span></div>
    <p class="sub">Здесь будет не лента новостей, а редакторский отбор MMT: несколько тем, которые стоит понимать и уметь использовать.</p>
    <div class="card"><div class="row between"><h3>Ваш контур чтения</h3><span class="status g" id="dietStatus">0 / 10</span></div><p class="meta" id="regionStatus">Регион пока не выбран.</p><button class="btn small secondary" data-go="mediaDiet">Настроить 5+5</button></div>
    <div class="agendaTopic"><div class="row between"><b>Тема недели №1</b><span class="status y">демо-контент</span></div><div class="labels"><span>общество</span><span>медиа</span><span>ДВИ</span></div><p><b>Что произошло:</b> в рабочей версии здесь будет короткий проверенный фактологический конспект события.</p><p><b>Почему важно:</b> зачем абитуриенту понимать тему и какие процессы она показывает.</p><p><b>Что перепроверить:</b> цифры, даты, участников и свежие изменения перед использованием.</p><div class="useTabs"><div><b>Эссе</b><br>какой аргумент можно построить</div><div><b>Устный ответ</b><br>какой вопрос может возникнуть</div><div><b>Творческий текст</b><br>какой конфликт/наблюдение взять</div></div><button class="btn small secondary" onclick="markAgendaTopic('demo1')">Изучено</button></div>
    <div class="agendaTopic"><div class="row between"><b>Тема недели №2</b><span class="status y">демо-контент</span></div><div class="labels"><span>культура</span><span>регион</span></div><p>В рабочей версии подборка будет адаптироваться под выбранные вузы и регион поступления.</p><button class="btn small secondary" onclick="markAgendaTopic('demo2')">Изучено</button></div>
    <div class="card"><h3>Повторение месяца</h3><p class="sub">Крупные темы не исчезают через неделю: приложение будет сохранять их в месячную подборку и возвращать через мини-тесты.</p><button class="btn secondary" onclick="toast('Месячный режим будет наполнен вместе с редакторским контентом MMT')">Открыть месяц</button></div>
    <button class="btn secondary" data-go="mediaSafety">Как проверяем безопасность источников</button>`);

  window.saveMediaRecall=function(){
    state.mediaRecall.media=document.getElementById('recallMedia')?.value||'';
    state.mediaRecall.journalists=document.getElementById('recallJournalists')?.value||'';
    saveState();toast('Первичная медиакарта сохранена');
  };
  window.addMediaCloud=function(){
    const core=document.getElementById('cloudCore')?.value.trim()||'';
    if(!core){toast('Введите центр облака');return}
    const editor=document.getElementById('cloudEditor')?.value.trim()||'';
    const people=(document.getElementById('cloudPeople')?.value||'').split(',').map(x=>x.trim()).filter(Boolean);
    state.mediaClouds.push({core,editor,people,date:new Date().toLocaleDateString('ru-RU')});saveState();renderMediaClouds();toast('Медиаоблако добавлено');
  };
  window.addDietItem=function(type){
    const name=prompt(type==='media'?'Название СМИ':'Имя журналиста'); if(!name||!name.trim())return;
    if(state.mediaDiet[type].length>=5){toast('В основном списке уже 5. Лишние можно хранить как резерв позже.');return}
    state.mediaDiet[type].push(name.trim());saveState();renderDiet();
  };
  window.removeDietItem=function(type,i){state.mediaDiet[type].splice(i,1);saveState();renderDiet();};
  window.saveRegion=function(){state.mediaDiet.region=document.getElementById('dietRegion')?.value.trim()||'';saveState();toast('Регион сохранён');};
  window.markAgendaTopic=function(k){state.agendaDone[k]=true;saveState();toast('Тема отмечена изученной');};

  function renderMediaClouds(){
    const box=document.getElementById('cloudList');if(!box)return;
    box.innerHTML=state.mediaClouds.length?state.mediaClouds.map((c,i)=>`<div class="cloudCard"><div class="row between"><div class="cloudCore">${esc(c.core)}</div><span class="status o">${esc(c.date)}</span></div>${c.editor?`<p class="meta">Главред / редакция: <b>${esc(c.editor)}</b></p>`:''}<div class="cloudPeople">${c.people.map(p=>`<span>${esc(p)}</span>`).join('')}</div></div>`).join(''):'<div class="notice">Пока нет облаков. Добавьте первое СМИ или журналиста.</div>';
  }
  function renderDiet(){
    const media=document.getElementById('dietMediaList'),journ=document.getElementById('dietJournalistList');
    const row=(x,i,t)=>`<div class="pickRow"><span>${i+1}</span><b>${esc(x)}</b><button class="btn small ghost" onclick="removeDietItem('${t}',${i})">×</button></div>`;
    if(media)media.innerHTML=state.mediaDiet.media.map((x,i)=>row(x,i,'media')).join('')||'<div class="notice">Добавьте до 5 СМИ.</div>';
    if(journ)journ.innerHTML=state.mediaDiet.journalists.map((x,i)=>row(x,i,'journalists')).join('')||'<div class="notice">Добавьте до 5 журналистов.</div>';
    const total=state.mediaDiet.media.length+state.mediaDiet.journalists.length;setText('dietTotal',total);setText('dietStatus',total+' / 10');
    setText('regionStatus',state.mediaDiet.region?'Регион: '+state.mediaDiet.region:'Регион пока не выбран.');
    const r=document.getElementById('dietRegion');if(r&&document.activeElement!==r)r.value=state.mediaDiet.region||'';
  }
  function renderRecall(){
    const m=document.getElementById('recallMedia'),j=document.getElementById('recallJournalists');
    if(m&&document.activeElement!==m)m.value=state.mediaRecall.media||'';
    if(j&&document.activeElement!==j)j.value=state.mediaRecall.journalists||'';
  }

  const oldRefresh=window.refresh;
  if(typeof oldRefresh==='function')window.refresh=function(){oldRefresh();renderMediaClouds();renderDiet();renderRecall();};
  renderMediaClouds();renderDiet();renderRecall();
})();
