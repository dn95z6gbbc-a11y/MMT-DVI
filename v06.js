/* MMT ДВИ v0.6 — РАНХиГС: тестирование, мини-пробник, банк ошибок */
(function setupV06(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.6';
  document.title='MMT ДВИ — v0.6';

  state.savedRanepa=!!state.savedRanepa;
  state.ranepaMistakes=Array.isArray(state.ranepaMistakes)?state.ranepaMistakes:[];
  state.ranepaAttempt=state.ranepaAttempt&&typeof state.ranepaAttempt==='object'?state.ranepaAttempt:{answers:{},matching:{},submitted:false};

  const css=document.createElement('style');
  css.textContent=`
    .examgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.examblock{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px}.examblock strong{font:700 25px Montserrat,Arial,sans-serif;display:block;margin:4px 0}.examblock small{color:var(--soft)}
    .sourceok{display:flex;gap:10px;align-items:flex-start;background:var(--gb);border-radius:14px;padding:12px;margin:12px 0}.sourceok .dot{width:28px;height:28px;border-radius:9px;background:var(--g);color:#fff;display:grid;place-items:center;font-weight:800;flex:0 0 auto}
    .topiccloud{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.topiccloud span{background:var(--muted);border-radius:999px;padding:8px 10px;font-size:12px}
    .testq{background:#fff;border:1px solid var(--line);border-radius:18px;padding:15px;margin:10px 0}.testq .qnum{font-size:11px;color:var(--soft);font-weight:700;margin-bottom:7px}.testq .option.chosen{border-color:var(--o);background:#fff5ef}.testq .option.correctAfter{border-color:var(--g);background:var(--gb)}.testq .option.wrongAfter{border-color:var(--r);background:var(--rb)}
    .matchrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #eee}.matchrow:last-child{border:0}.matchrow select{width:100%;padding:10px;border:1px solid var(--line);border-radius:12px;background:#fff}
    .testmeter{position:sticky;top:62px;z-index:8;background:var(--bg);padding:8px 0 6px}.mistake{border-left:4px solid var(--r);padding-left:12px;margin:13px 0}.bibliolist{counter-reset:bib}.bibliolist li{list-style:none;padding:11px 0;border-bottom:1px solid #eee}.bibliolist li:before{counter-increment:bib;content:counter(bib) '. ';font-weight:800;color:var(--o)}
    @media(max-width:370px){.examgrid{grid-template-columns:1fr}.matchrow{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);

  function appendScreen(id,html){
    if(document.getElementById(id))return document.getElementById(id);
    const s=document.createElement('section');s.id=id;s.className='screen';s.innerHTML=html;document.querySelector('main').appendChild(s);return s;
  }

  const results=document.getElementById('results');
  if(results){
    const card=[...results.querySelectorAll('.card')].find(x=>x.textContent.includes('РАНХиГС'));
    if(card){card.classList.add('click');card.setAttribute('data-go','ranepa');card.querySelector('.status')?.remove();const st=document.createElement('span');st.className='status g';st.textContent='программа 2026/27';card.appendChild(st);}
  }
  const search=document.getElementById('search');
  if(search&&!document.getElementById('ranepaSearchCard')){
    const c=document.createElement('div');c.id='ranepaSearchCard';c.className='card click';c.setAttribute('data-go','ranepa');c.innerHTML='<div class="row between"><div><h3>РАНХиГС</h3><p class="meta">Москва · Журналистика</p></div><span class="status g">программа 2026/27</span></div><span class="pill">письменный тест</span><span class="pill">40 вопросов</span><span class="pill">60+ баллов</span>';search.appendChild(c);
  }

  const prepare=document.getElementById('prepare');
  if(prepare){
    const my=[...prepare.querySelectorAll('.card')].find(x=>x.textContent.includes('Мои вузы'));
    if(my){my.setAttribute('data-go','myUniversities');my.classList.add('click');}
  }
  const dvi=document.getElementById('dvi');
  if(dvi){
    const testing=[...dvi.querySelectorAll('.card')].find(x=>x.textContent.includes('Тестирование'));
    if(testing){testing.classList.add('click');testing.setAttribute('data-go','ranepa');testing.querySelector('.meta')&&(testing.querySelector('.meta').textContent='РАНХиГС: структура теста + банк ошибок');}
  }

  appendScreen('myUniversities',`
    <div class="eye">Персональный маршрут</div><h2>Мои вузы</h2><p class="sub">Вуз можно изучать без добавления в план. Персональная подготовка и прогресс включаются только для выбранных целей.</p>
    <div class="card click" data-go="uni"><div class="row between"><div><h3>СПбГИКиТ</h3><p class="meta">письменная работа · коллоквиум · портфолио</p></div><span id="mySpbStatus" class="status"></span></div></div>
    <div class="card click" data-go="mpgu"><div class="row between"><div><h3>МПГУ</h3><p class="meta">творческий текст</p></div><span id="myMpguStatus" class="status"></span></div></div>
    <div class="card click" data-go="ranepa"><div class="row between"><div><h3>РАНХиГС</h3><p class="meta">письменное тестирование · 40 вопросов</p></div><span id="myRanepaStatus" class="status"></span></div></div>`);

  appendScreen('ranepa',`
    <div class="eye">Москва · третья модель ДВИ</div><div class="row between"><div><h2>РАНХиГС</h2><p class="meta">42.03.02 Журналистика</p></div><div class="universityMark">РАНХ</div></div>
    <div class="sourceok"><div class="dot">✓</div><div><b>Программа ДВИ 2026/27</b><div class="meta">Здесь используем данные из загруженной программы творческого вступительного испытания. Тренировочные вопросы MMT будут отмечены отдельно.</div></div></div>
    <div class="card hero"><div class="row between"><div><span class="meta" style="color:#bbb">Формат</span><h3>Письменное тестирование</h3></div><div class="big">60+</div></div><p class="meta" style="color:#bbb">минимум для участия в конкурсе · шкала 100 баллов</p></div>
    <div class="examgrid"><div class="examblock"><small>Блок 1</small><strong>25</strong><small>вопросов · 2 балла</small></div><div class="examblock"><small>Блок 2</small><strong>10</strong><small>вопросов · 3 балла</small></div><div class="examblock"><small>Блок 3</small><strong>5</strong><small>вопросов · 4 балла</small></div></div>
    <div class="card"><h3>Что проверяют</h3><div class="topiccloud"><span>литература</span><span>история</span><span>обществознание</span><span>мировая художественная культура</span><span>история журналистики</span><span>жанры</span><span>современная медиасфера</span><span>этика</span><span>право</span><span>медиасистемы</span><span>цифровые медиа</span><span>техника СМИ</span></div></div>
    <div class="card"><h3>Важно на экзамене</h3><p>Справочные материалы, средства связи, электронные устройства и вычислительная техника не допускаются.</p></div>
    <button id="ranepaSaveBtn" class="btn" onclick="toggleRanepaPlan()">Добавить РАНХиГС в план</button>
    <button class="btn secondary" onclick="openRanepaPrep()">Открыть подготовку</button>
    <button class="btn secondary" data-go="ranepaLiterature">Рекомендуемая литература</button>`);

  appendScreen('ranepaPrep',`
    <div class="eye">РАНХиГС · подготовка</div><h2>Тест: три разных слоя знаний</h2>
    <div class="card hero"><div class="big">40</div><p class="meta" style="color:#bbb">вопросов в полном испытании</p><div class="progress light"><i style="width:60%"></i></div><p>Наша задача — не просто набирать ответы, а видеть, в каком тематическом блоке повторяются ошибки.</p></div>
    <div class="modulemap"><div class="moduleline current"><div class="n">1</div><div><b>Общая эрудиция</b><div class="meta">литература · история · обществознание · МХК</div></div><b>25×2</b></div><div class="moduleline"><div class="n">2</div><div><b>Профессия и медиасфера</b><div class="meta">история журналистики · жанры · СМИ · сопоставления</div></div><b>10×3</b></div><div class="moduleline"><div class="n">3</div><div><b>Профессиональный уровень</b><div class="meta">термины · этика · право · медиасистемы</div></div><b>5×4</b></div></div>
    <div class="card softo"><h3>MMT мини-пробник</h3><p>8 тренировочных заданий, составленных по темам программы. Это <b>не вопросы экзамена РАНХиГС</b>. Включаем разные веса и одно задание на сопоставление.</p></div>
    <button class="btn" onclick="startRanepaMini()">Начать мини-пробник</button>
    <button class="btn secondary" data-go="ranepaMistakes">Открыть банк ошибок <span id="ranepaMistakeCount"></span></button>
    <button class="btn secondary" data-go="ranepaLiterature">Что читать по программе</button>`);

  appendScreen('ranepaMini',`
    <div class="eye">РАНХиГС · MMT тренажёр</div><h2>Мини-пробник</h2>
    <div class="testmeter"><div class="row between"><span class="meta">Ответы</span><b id="ranepaMiniProgress">0 / 8</b></div><div class="progress"><i id="ranepaMiniBar" style="width:0%"></i></div></div>
    <div class="demoSource"><b>Неофициальные тренировочные задания MMT.</b> Они моделируют тематику и веса блоков из программы, но не являются вопросами РАНХиГС.</div>
    <div id="ranepaMiniQuestions"></div>
    <button class="btn" onclick="submitRanepaMini()">Завершить и разобрать</button>
    <button class="btn secondary" onclick="resetRanepaMini()">Начать заново</button>`);

  appendScreen('ranepaResult',`
    <div class="eye">РАНХиГС · мини-пробник</div><h2>Разбор результата</h2><div id="ranepaResultBox"></div><button class="btn" data-go="ranepaMistakes">Разобрать ошибки</button><button class="btn secondary" data-go="ranepaPrep">К плану подготовки</button>`);

  appendScreen('ranepaMistakes',`
    <div class="eye">РАНХиГС · тренажёр</div><div class="row between"><h2>Банк ошибок</h2><span id="mistakeBadge" class="status y">0</span></div><p class="sub">Здесь остаются темы, на которых вы ошиблись в тренировках. В рабочей версии приложение будет собирать повторение именно из них.</p><div id="ranepaMistakeList"></div><button class="btn secondary" onclick="clearRanepaMistakes()">Очистить демо-банк</button>`);

  appendScreen('ranepaLiterature',`
    <div class="eye">РАНХиГС · программа 2026/27</div><h2>Рекомендуемая литература</h2><p class="sub">Список перенесён из загруженной программы ДВИ. В дальнейшем свяжем книги с конкретными темами и заданиями.</p><div class="card"><ol class="bibliolist"><li>А. В. Колесниченко. «Основы журналистской деятельности», 2024.</li><li>Г. В. Лазутина, И. Н. Денисова. «Профессиональная этика журналиста», 2025.</li><li>Б. Я. Мисонжников, А. Н. Тепляшина. «Введение в профессию: журналистика», 2025.</li><li>«Основы журналистской деятельности» / под ред. С. Г. Корконосенко, 2024.</li><li>Е. П. Прохоров. «Введение в теорию журналистики», 2023.</li><li>Л. Г. Свитич. «Актуальные проблемы современной науки и журналистика», 2023.</li><li>А. А. Тертычный. «Жанры периодической печати», 2014.</li><li>А. Х. Ульбашев. «Правовые и этические основы журналистики», 2025.</li><li>Г. В. Чевозерова. «Основы теории журналистики», 2025.</li><li>Ф. И. Шарков, В. В. Силкин. «Теория и практика массовой информации как фундаментальное направление коммуникологии», 2019.</li><li>М. И. Шостак. «Новостная журналистика. Новости прессы», 2025.</li></ol></div>`);

  const questions=[
    {id:'b1_1',block:1,w:2,q:'Кто автор романа «Отцы и дети»?',opts:['И. С. Тургенев','Л. Н. Толстой','Н. В. Гоголь','А. П. Чехов'],a:0,why:'Роман «Отцы и дети» написал Иван Тургенев.'},
    {id:'b1_2',block:1,w:2,q:'Какое событие относится к 1861 году в истории России?',opts:['Отмена крепостного права','Начало Первой мировой войны','Октябрьская революция','Отечественная война 1812 года'],a:0,why:'В 1861 году была проведена крестьянская реформа, отменившая крепостное право.'},
    {id:'b1_3',block:1,w:2,q:'С каким художественным направлением прежде всего связывают Клода Моне?',opts:['Импрессионизм','Классицизм','Сюрреализм','Конструктивизм'],a:0,why:'Клод Моне — один из ключевых представителей импрессионизма.'},
    {id:'b2_1',block:2,w:3,q:'Какой журналистский жанр строится вокруг целенаправленной беседы с героем?',opts:['Интервью','Рецензия','Хроника','Комментарий'],a:0,why:'Интервью строится на вопросах журналиста и ответах собеседника.'},
    {id:'b2_2',block:2,w:3,q:'Что точнее всего описывает фактчекинг в редакционной работе?',opts:['Проверка фактов и источников до публикации','Подбор выразительного заголовка','Продвижение материала в соцсетях','Сокращение текста до нужного объёма'],a:0,why:'Фактчекинг — проверка фактических утверждений и их источников.'},
    {id:'b3_1',block:3,w:4,q:'После публикации журналист обнаружил существенную фактическую ошибку. Какое действие лучше соответствует профессиональной ответственности?',opts:['Исправить ошибку прозрачно и как можно быстрее','Удалить комментарии читателей','Ничего не менять, если материал уже прочитали','Скрыть исходный материал без объяснения'],a:0,why:'Профессиональная ответственность предполагает исправление существенной ошибки и прозрачность по отношению к аудитории.'},
    {id:'b3_2',block:3,w:4,q:'Какое утверждение лучше всего отделяет факт от мнения?',opts:['Факт можно проверять по источникам, мнение выражает оценку или позицию','Мнение всегда короче факта','Факт обязательно содержит цифры','Мнение допустимо только в интервью'],a:0,why:'Ключевое различие — проверяемость фактического утверждения и оценочный характер мнения.'}
  ];
  const matching={id:'b2_match',block:2,w:3,q:'Сопоставьте жанр и его основную задачу',items:[['Новость','Оперативно сообщить о значимом факте'],['Репортаж','Передать событие через наблюдение и эффект присутствия'],['Интервью','Раскрыть тему или героя через систему вопросов и ответов']]};

  window.toggleRanepaPlan=function(){state.savedRanepa=!state.savedRanepa;saveState();toast(state.savedRanepa?'РАНХиГС добавлен в план':'РАНХиГС убран из плана');renderRanepaUI();};
  window.openRanepaPrep=function(){if(!state.savedRanepa){toast('Сначала добавьте РАНХиГС в свой план');return}go('ranepaPrep');};
  window.startRanepaMini=function(){if(!state.savedRanepa){toast('Сначала добавьте РАНХиГС в план');return}state.ranepaAttempt={answers:{},matching:{},submitted:false};saveState();renderRanepaMini();go('ranepaMini');};
  window.answerRanepaQuestion=function(id,idx){if(state.ranepaAttempt.submitted)return;state.ranepaAttempt.answers[id]=idx;saveState();renderRanepaMini();};
  window.setRanepaMatch=function(i,val){if(state.ranepaAttempt.submitted)return;state.ranepaAttempt.matching[i]=Number(val);saveState();renderRanepaProgress();};
  window.submitRanepaMini=function(){
    const answered=Object.keys(state.ranepaAttempt.answers||{}).length;const m=state.ranepaAttempt.matching||{};
    if(answered<questions.length||[0,1,2].some(i=>!Number.isInteger(m[i]))){toast('Ответьте на все 8 заданий');return}
    let raw=0,max=0;const wrong=[];questions.forEach(q=>{max+=q.w;if(state.ranepaAttempt.answers[q.id]===q.a)raw+=q.w;else wrong.push(q.id)});max+=matching.w;
    const matchCorrect=matching.items.every((x,i)=>m[i]===i);if(matchCorrect)raw+=matching.w;else wrong.push(matching.id);
    state.ranepaAttempt.submitted=true;state.ranepaAttempt.raw=raw;state.ranepaAttempt.max=max;state.ranepaAttempt.wrong=wrong;
    state.ranepaMistakes=[...new Set([...(state.ranepaMistakes||[]),...wrong])];saveState();renderRanepaResult();go('ranepaResult');
  };
  window.resetRanepaMini=function(){state.ranepaAttempt={answers:{},matching:{},submitted:false};saveState();renderRanepaMini();toast('Мини-пробник сброшен');};
  window.clearRanepaMistakes=function(){state.ranepaMistakes=[];saveState();renderRanepaMistakes();toast('Демо-банк очищен');};

  function renderRanepaMini(){
    const box=document.getElementById('ranepaMiniQuestions');if(!box)return;const submitted=!!state.ranepaAttempt.submitted;
    const mc=questions.map((q,n)=>`<div class="testq"><div class="qnum">Блок ${q.block} · ${q.w} балла · задание ${n+1}</div><h3>${q.q}</h3>${q.opts.map((o,i)=>{const chosen=state.ranepaAttempt.answers[q.id]===i;let cl='option'+(chosen?' chosen':'');if(submitted&&i===q.a)cl+=' correctAfter';else if(submitted&&chosen&&i!==q.a)cl+=' wrongAfter';return `<button class="${cl}" onclick="answerRanepaQuestion('${q.id}',${i})">${o}</button>`}).join('')}${submitted?`<div class="qfeedback" style="display:block">${q.why}</div>`:''}</div>`).join('');
    const options=matching.items.map(x=>x[1]);
    const match=`<div class="testq"><div class="qnum">Блок 2 · 3 балла · сопоставление</div><h3>${matching.q}</h3>${matching.items.map((x,i)=>`<div class="matchrow"><b>${x[0]}</b><select onchange="setRanepaMatch(${i},this.value)" ${submitted?'disabled':''}><option value="">Выберите</option>${options.map((o,j)=>`<option value="${j}" ${state.ranepaAttempt.matching[i]===j?'selected':''}>${o}</option>`).join('')}</select></div>`).join('')}${submitted?'<div class="qfeedback" style="display:block">В тренировке все три соответствия должны быть выбраны верно, чтобы получить 3 балла.</div>':''}</div>`;
    box.innerHTML=mc+match;renderRanepaProgress();
  }
  function renderRanepaProgress(){const mc=Object.keys(state.ranepaAttempt.answers||{}).length;const m=state.ranepaAttempt.matching||{};const matchDone=[0,1,2].every(i=>Number.isInteger(m[i]));const done=mc+(matchDone?1:0);setText('ranepaMiniProgress',done+' / 8');setWidth('ranepaMiniBar',done/8*100);}
  function renderRanepaResult(){const box=document.getElementById('ranepaResultBox');if(!box)return;const a=state.ranepaAttempt;if(!a.submitted){box.innerHTML='<div class="card">Сначала завершите мини-пробник.</div>';return}const pct=Math.round(a.raw/a.max*100);box.innerHTML=`<div class="card hero"><div class="big">${pct}%</div><p class="meta" style="color:#bbb">${a.raw} из ${a.max} условных баллов мини-пробника</p></div><div class="card"><h3>Важно</h3><p>Это не официальный результат РАНХиГС и не прогноз поступления. В полном испытании 40 вопросов и ровно 100 баллов; здесь мы только моделируем веса блоков.</p></div><div class="card ${a.wrong.length?'yellow':'green'}"><div class="row between"><b>Ошибок</b><strong>${a.wrong.length}</strong></div><p class="meta">Все ошибки добавлены в банк повторения.</p></div>`;}
  function renderRanepaMistakes(){const box=document.getElementById('ranepaMistakeList');if(!box)return;const ids=state.ranepaMistakes||[];setText('mistakeBadge',ids.length);setText('ranepaMistakeCount',ids.length?'· '+ids.length:'');if(!ids.length){box.innerHTML='<div class="card green"><h3>Пока пусто</h3><p>Ошибки из мини-пробников будут собираться здесь.</p></div>';return}box.innerHTML=ids.map(id=>{if(id===matching.id)return `<div class="card"><div class="mistake"><b>Сопоставление жанров</b><p class="meta">Повторить различия между новостью, репортажем и интервью.</p></div></div>`;const q=questions.find(x=>x.id===id);return q?`<div class="card"><div class="mistake"><b>${q.q}</b><p>${q.why}</p><span class="status y">блок ${q.block}</span></div></div>`:''}).join('');}
  function renderRanepaUI(){const b=document.getElementById('ranepaSaveBtn');if(b)b.textContent=state.savedRanepa?'✓ РАНХиГС в моём плане':'Добавить РАНХиГС в план';const setStatus=(id,on)=>{const x=document.getElementById(id);if(x){x.textContent=on?'в плане':'не добавлен';x.className='status '+(on?'g':'y')}};setStatus('mySpbStatus',!!state.savedUni);setStatus('myMpguStatus',!!state.savedMpgu);setStatus('myRanepaStatus',!!state.savedRanepa);renderRanepaMini();renderRanepaResult();renderRanepaMistakes();}

  const oldRefresh=window.refresh;if(typeof oldRefresh==='function'){window.refresh=function(){oldRefresh();renderRanepaUI();};}
  renderRanepaUI();
})();
