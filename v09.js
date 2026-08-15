/* MMT ДВИ v0.9 — глубокое собеседование + ГИТР */
(function setupV09(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.9';
  document.title='MMT ДВИ — v0.9';

  state.savedGitr=!!state.savedGitr;
  state.interviewAnswers=Array.isArray(state.interviewAnswers)?state.interviewAnswers:[];
  state.interviewMode=state.interviewMode||'universal';
  state.interviewCategory=state.interviewCategory||'motivation';
  state.interviewQuestionIndex=Number.isInteger(state.interviewQuestionIndex)?state.interviewQuestionIndex:0;

  const css=document.createElement('style');
  css.textContent=`
    .oralHero{background:var(--ink);color:#fff;border-radius:22px;padding:18px;margin:12px 0}.oralHero .meta{color:#bbb}.oralModes{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.oralMode{border:1px solid var(--line);background:#fff;border-radius:14px;padding:11px 8px;text-align:center;font-size:12px;font-weight:700}.oralMode.active{border-color:var(--o);background:var(--os)}
    .circleGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.circleCard{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;min-height:112px}.circleCard.current{border-color:var(--o);background:#fff9f5}.circleIcon{font-size:22px;margin-bottom:8px}.circleCard b{display:block;margin-bottom:4px}.circleCard small{color:var(--soft);line-height:1.3}
    .questionCard{background:#fff;border:2px solid var(--o);border-radius:21px;padding:17px;margin:12px 0}.questionCard .qtype{font-size:11px;font-weight:800;color:var(--o);text-transform:uppercase;letter-spacing:.06em}.questionCard h3{margin:8px 0 3px}.answerMap{display:grid;gap:7px;margin:12px 0}.answerCheck{display:flex;gap:9px;align-items:flex-start;background:#fff;border:1px solid var(--line);border-radius:13px;padding:10px}.answerCheck input{accent-color:var(--o);margin-top:3px}.answerCheck span{font-size:12px;line-height:1.35}.historyAnswer{background:#fff;border:1px solid var(--line);border-radius:16px;padding:13px;margin:8px 0}.historyAnswer .answerText{font-size:13px;white-space:pre-wrap;margin:8px 0}.tagline{display:flex;gap:5px;flex-wrap:wrap}.tagline span{font-size:10px;background:var(--muted);border-radius:999px;padding:5px 7px}
    .gitrFolder{display:grid;gap:7px;margin:10px 0}.gitrFolder div{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:start;background:#fff;border:1px solid var(--line);border-radius:13px;padding:10px}.gitrFolder span{width:27px;height:27px;border-radius:9px;background:var(--os);display:grid;place-items:center;font-weight:800}.questionBank{display:grid;gap:7px}.bankQ{background:#fff;border:1px solid var(--line);border-radius:14px;padding:11px}.bankQ small{display:block;color:var(--soft);margin-bottom:4px}.source2026{background:var(--gb);border-radius:14px;padding:12px;margin:10px 0;font-size:12px;line-height:1.45}.oralProgress{display:flex;gap:6px;flex-wrap:wrap}.oralProgress span{width:28px;height:28px;border-radius:9px;background:var(--muted);display:grid;place-items:center;font-size:11px;font-weight:800}.oralProgress span.done{background:var(--gb);color:var(--g)}
    @media(max-width:370px){.circleGrid,.oralModes{grid-template-columns:1fr}}
  `;document.head.appendChild(css);

  function appendScreen(id,html){if(document.getElementById(id))return document.getElementById(id);const s=document.createElement('section');s.id=id;s.className='screen';s.innerHTML=html;document.querySelector('main').appendChild(s);return s}

  const categories={
    motivation:{title:'Я и профессия',icon:'◎',desc:'мотивация · выбор профессии · будущее',qs:[
      'Почему вы хотите стать журналистом?',
      'Если бы вы не стали журналистом, какую профессию выбрали бы и почему?',
      'Кем вы видите себя через четыре года, после получения диплома?',
      'Какими качествами должен обладать журналист?',
      'Если бы вы уже были журналистом, о чём рассказали бы в первую очередь?'
    ]},
    experience:{title:'Опыт и портфолио',icon:'▣',desc:'свои работы · практика · решения',qs:[
      'Есть ли у вас опыт журналистской работы? Где, когда и что именно вы делали?',
      'Какую свою журналистскую работу вы считаете самой сильной и почему?',
      'Расскажите о работе из портфолио: как появилась тема, кого вы нашли и что получилось?',
      'Что в одной из ваших работ вы бы сейчас переделали?',
      'Какой новый материал вы хотели бы сделать в ближайший месяц?'
    ]},
    media:{title:'СМИ и журналисты',icon:'◉',desc:'медиарацион · авторы · источники',qs:[
      'Какие СМИ вы читаете регулярно и почему именно их?',
      'Каких журналистов вы знаете? Расскажите о нескольких из них.',
      'Какой источник новостей для вас главный и почему?',
      'Назовите сайты или каналы, материалы которых вы читаете регулярно. Чем они различаются?',
      'Какая журналистика вам интереснее: печатная, радио, телевидение или интернет? Почему?'
    ]},
    agenda:{title:'Повестка',icon:'⚡',desc:'день · месяц · год · свой регион',qs:[
      'Какое событие последних дней вы считаете самым важным и почему?',
      'Какие события произошли в вашем городе за последний месяц?',
      'Назовите крупную тему последнего года, за которой вы следили особенно внимательно.',
      'Какая новость за последнюю неделю заставила вас изменить мнение или узнать что-то новое?',
      'Какую текущую тему вы бы сами предложили редакции для материала?'
    ]},
    culture:{title:'Культура и чтение',icon:'◇',desc:'книги · кино · музеи · театр · музыка',qs:[
      'Назовите пять любимых литературных произведений и объясните выбор хотя бы двух.',
      'Какие книги вы прочли за последний месяц? Что из них запомнилось?',
      'Назовите пять фильмов, которые для вас важны. Что вы в них цените?',
      'В каких музеях вы были и о каком экспонате или выставке можете рассказать?',
      'Какой спектакль, концерт или культурное событие последнего года вы можете содержательно обсудить?'
    ]},
    profession:{title:'Профессия и медиа',icon:'M',desc:'история · жанры · инструменты · теория',qs:[
      'Какие книги по журналистике вы читали и что из них вынесли?',
      'Чем журналист отличается от блогера?',
      'Какие журналистские жанры вы знаете и какой вам ближе?',
      'Как журналист проверяет информацию перед публикацией?',
      'Что изменилось в работе журналиста из-за цифровых платформ?'
    ]},
    erudition:{title:'Общий кругозор',icon:'⌁',desc:'история · география · культура · медиаистория',qs:[
      'Назовите пять исторических фактов, которые считаете важными, и объясните один из них.',
      'Кто такой Иван Фёдоров и почему его имя важно для истории медиа?',
      'Что вы знаете об истории появления радио?',
      'Что вы знаете об истории появления телевидения?',
      'Назовите пять российских городов и расскажите, чем хотя бы два из них вам интересны.'
    ]},
    ideas:{title:'Идеи и позиция',icon:'✦',desc:'собственный взгляд · темы · аргументы',qs:[
      'Какую проблему современной журналистики вы считаете самой заметной?',
      'Какой медиапроект вы бы запустили для своей возрастной аудитории?',
      'Какую тему о вашем городе федеральные СМИ недооценивают?',
      'Что бы вы хотели изменить в современных медиа?',
      'Какую историю вы хотите однажды рассказать как журналист?'
    ]}
  };
  const catKeys=Object.keys(categories);

  const gitrQs=[
    ['Культура','Перечислите 5 ваших любимых литературных произведений. Обоснуйте свой выбор. Кто ваш любимый писатель и литературный герой? Почему?'],
    ['Культура','Назовите 5 ваших любимых художников. Расскажите о них и любимых направлениях в изобразительном искусстве.'],
    ['Культура','Назовите 5 ваших любимых композиторов. Расскажите о них. Музыку какого жанра вы слушаете?'],
    ['Культура','Назовите 5 ваших любимых режиссёров кино и телевидения. Расскажите о них.'],
    ['Культура','Назовите 5 ваших любимых фильмов. Обоснуйте свой выбор.'],
    ['Медиа','Назовите 5 ваших любимых телевизионных каналов. Проанализируйте их, программы и авторов.'],
    ['Культура','Назовите книги, которые вы прочли за последний месяц. Расскажите о них.'],
    ['Культура','Назовите спектакли, которые вы посмотрели за последний год. Расскажите о них.'],
    ['Культура','Назовите музеи, в которых вы были. Расскажите о них.'],
    ['Повестка','Какие события произошли в вашем городе, нашей стране и мире за последний год, месяц и день?'],
    ['Мотивация','Почему вы хотите стать журналистом?'],
    ['Мотивация','Если бы вы не стали журналистом, какую профессию выбрали бы? Почему?'],
    ['Опыт','Есть ли у вас опыт журналистской работы? Когда, где и в каком объёме?'],
    ['Профессия','Какими качествами должен обладать журналист?'],
    ['Медиа','Каких журналистов вы знаете? Расскажите о них.'],
    ['Профессия','Какие книги по журналистике вы читали? Расскажите о них.'],
    ['Медиа','Какой для вас главный источник новостей? Почему?'],
    ['Профессия','Какая журналистика вам интереснее: печатная, радио-, теле- или интернет-журналистика? Почему?'],
    ['Идеи','Если бы вы уже были журналистом, о чём бы вы рассказали в первую очередь?'],
    ['Мотивация','Кем вы себя видите через 4 года, когда получите диплом о высшем образовании?'],
    ['Медиа','Назовите сайты, материалы которых вы читаете регулярно. Расскажите о них.'],
    ['Медиа','Назовите ваши любимые радиостанции. Проанализируйте их.'],
    ['Медиа','Назовите ваши любимые журналы. Проанализируйте их.'],
    ['Кругозор','Назовите 5 исторических фактов. Расскажите о них.'],
    ['Кругозор','Какой самый экономически развитый район в России? Какой самый дотационный? Объясните, почему.'],
    ['Кругозор','Кто такой Иван Фёдоров?'],
    ['Кругозор','Когда появилось радио? Кто его изобрёл?'],
    ['Кругозор','Когда появилось телевидение? Кто его изобрёл?'],
    ['Кругозор','Назовите 5 европейских, азиатских, американских или африканских столиц. Расскажите о них.'],
    ['Кругозор','Назовите 5 российских городов. Расскажите о них.']
  ];

  // New university cards
  const search=document.getElementById('search');
  if(search&&!document.getElementById('gitrSearchCard')){const c=document.createElement('div');c.id='gitrSearchCard';c.className='card click';c.setAttribute('data-go','gitr');c.innerHTML='<div class="row between"><div><h3>ГИТР</h3><p class="meta">Москва · Журналистика · телевидение и радио</p></div><span class="status g">программа 2026</span></div><span class="pill">коллоквиум</span><span class="pill">эссе</span><span class="pill">творческая папка</span>';search.appendChild(c)}
  const results=document.getElementById('results');
  if(results&&!document.getElementById('gitrResultCard')){const c=document.createElement('div');c.id='gitrResultCard';c.className='card click';c.setAttribute('data-go','gitr');c.innerHTML='<div class="row between"><div><h3>ГИТР</h3><p class="meta">Москва · Журналистика, телевидение и радио</p></div><span class="status g">программа 2026</span></div><span class="pill">коллоквиум</span><span class="pill">эссе</span>';results.insertBefore(c,results.lastElementChild)}
  const my=document.getElementById('myUniversities');
  if(my&&!document.getElementById('gitrMyCard')){const c=document.createElement('div');c.id='gitrMyCard';c.className='card click';c.setAttribute('data-go','gitr');c.innerHTML='<div class="row between"><div><h3>ГИТР</h3><p class="meta">коллоквиум · эссе · творческая папка</p></div><span id="myGitrStatus" class="status"></span></div>';my.appendChild(c)}

  // Upgrade generic oral entry in DVI hub if it exists
  const dvi=document.getElementById('dvi');
  if(dvi&&!document.getElementById('interviewEntry')){const c=document.createElement('div');c.id='interviewEntry';c.className='card click';c.setAttribute('data-go','interviewHub');c.innerHTML='<div class="row between"><div><h3>Собеседование / коллоквиум</h3><p class="meta">8 кругов вопросов → ответы → уточнения → история</p></div><span class="status o">v0.9</span></div>';dvi.prepend(c)}

  // Replace SPbGIKiT oral screen with clearer university-specific entry
  const oral=document.getElementById('oral');
  if(oral)oral.innerHTML='<div class="eye">СПбГИКиТ · ДВИ</div><h2>Коллоквиум</h2><p class="sub">Устная беседа без отдельного времени на подготовку ответа. Это не универсальный список вопросов: тренировка должна учитывать именно требования СПбГИКиТ.</p><div class="card"><ul class="list"><li>Речь и способность вести диалог</li><li>Общественная, культурная и политическая жизнь</li><li>Российские СМИ</li><li>История и культура Петербурга, России и мира</li><li>Интересы и кругозор абитуриента</li><li>Инструменты текста, графики, фото, аудио и видео</li></ul></div><button class="btn" onclick="startInterviewMode(\'spbgikit\')">Тренировать коллоквиум СПбГИКиТ</button><button class="btn secondary" data-go="interviewHub">Сначала общая база собеседования</button>';

  appendScreen('interviewHub',`
    <div class="eye">Навык ДВИ · собеседование</div><h2>Комиссия может спросить почти о чём угодно</h2>
    <p class="sub">Поэтому не учим один «идеальный ответ». Строим кругозор и способность быстро отвечать конкретно, аргументированно и своими словами.</p>
    <div class="oralHero"><div class="meta">Универсальная база MMT</div><h3>8 кругов собеседования</h3><p>После общей базы переключаемся на конкретный вуз: его программу, формулировки, критерии и особенности комиссии.</p></div>
    <div class="oralModes"><button class="oralMode active" onclick="startInterviewMode('universal')">Общая база</button><button class="oralMode" onclick="startInterviewMode('gitr')">ГИТР</button><button class="oralMode" onclick="startInterviewMode('spbgikit')">СПбГИКиТ</button></div>
    <div class="circleGrid" id="interviewCircles"></div>
    <button class="btn" onclick="startMixedInterview()">Смешанная тренировка</button>
    <button class="btn secondary" data-go="interviewHistory">История моих ответов</button>
    <div class="notice"><b>Принцип:</b> общий тренажёр помогает готовить базу, но не подменяет программу конкретного вуза.</div>`);

  appendScreen('interviewTrainer',`
    <div class="eye" id="interviewModeEye">Общая база · устный ответ</div><div class="row between"><h2 id="interviewCatTitle">Вопрос</h2><span class="status o" id="interviewAttemptCount">0 ответов</span></div>
    <div class="questionCard"><div class="qtype" id="interviewQType">Вопрос комиссии</div><h3 id="interviewQuestion"></h3><p class="meta" id="interviewHint"></p></div>
    <div id="personalMediaHint" class="card softo" style="display:none"></div>
    <div class="label">Ответ своими словами</div><textarea id="interviewAnswerText" class="textarea" style="min-height:190px" placeholder="Не пишите сочинение. Представьте, что отвечаете комиссии вслух..."></textarea>
    <div class="card"><h3>Карта ответа</h3><p class="meta">Это самопроверка структуры, а не автоматическая оценка качества.</p><div class="answerMap">
      <label class="answerCheck"><input type="checkbox" id="ac1"><span><b>Есть прямой ответ / тезис</b><br>Я не начинаю издалека и отвечаю именно на вопрос.</span></label>
      <label class="answerCheck"><input type="checkbox" id="ac2"><span><b>Есть объяснение «почему»</b><br>Не просто называю факт, а раскрываю выбор.</span></label>
      <label class="answerCheck"><input type="checkbox" id="ac3"><span><b>Есть конкретный пример</b><br>Материал, книга, журналист, событие, собственная работа.</span></label>
      <label class="answerCheck"><input type="checkbox" id="ac4"><span><b>Есть связь с моим опытом / медиасредой / повесткой</b><br>Ответ звучит личным, а не заученным.</span></label>
      <label class="answerCheck"><input type="checkbox" id="ac5"><span><b>Есть короткий вывод</b><br>Я могу закончить мысль и быть готовым к уточнению.</span></label>
    </div></div>
    <button class="btn" onclick="saveInterviewAnswer()">Сохранить попытку</button><button class="btn secondary" onclick="nextInterviewQuestion()">Другой вопрос</button>`);

  appendScreen('interviewSaved',`
    <div class="eye">Устный ответ · попытка сохранена</div><h2>Не балл. Следующий шаг</h2>
    <div id="savedInterviewSummary"></div>
    <div class="card"><h3>Что делать дальше</h3><p>1. Посмотрите, какие элементы карты ответа вы сами не отметили.<br>2. Вернитесь в медиасреду или повестку, если не хватило конкретики.<br>3. Ответьте на следующий вопрос того же круга или смените круг.</p></div>
    <button class="btn" onclick="nextInterviewQuestion();go('interviewTrainer')">Следующий вопрос</button><button class="btn secondary" data-go="interviewHistory">Сравнить с прошлыми ответами</button>`);

  appendScreen('interviewHistory',`
    <div class="eye">Устная подготовка</div><div class="row between"><h2>История ответов</h2><span id="historyCount" class="status o">0</span></div><p class="sub">Сравнивайте не «красивость», а конкретность: появились ли примеры, медиассылки, аргументы и более ясная структура.</p><div id="interviewHistoryList"></div>`);

  appendScreen('gitr',`
    <div class="eye">Москва · программа 2026</div><div class="row between"><div><h2>ГИТР</h2><p class="meta">42.03.02 Журналистика · профиль «телевидение и радио»</p></div><div class="universityMark">ГИТР</div></div>
    <div class="source2026"><b>Источник в прототипе:</b> программа дополнительных вступительных испытаний, приложение №4 к приказу от 19.01.2026 №61.</div>
    <div class="card hero"><h3>Два творческих испытания</h3><div class="score"><span>Коллоквиум: журналистика</span><strong>устно</strong></div><div class="score"><span>Письменная работа</span><strong>эссе</strong></div><p class="meta" style="color:#bbb">Также учитываются ЕГЭ по русскому языку и литературе.</p></div>
    <div class="card"><h3>До экзамена: творческая папка</h3><div class="gitrFolder"><div><span>1</span><b>Собственные журналистские материалы</b></div><div><span>2</span><b>Автобиография</b></div><div><span>3</span><b>Видеовизитка до 1 минуты</b></div><div><span>4</span><b>Грамоты, дипломы, призы — при наличии</b></div><div><span>5</span><b>Характеристика и рекомендации — при наличии</b></div></div><p class="meta">Электронную папку программа требует прислать не менее чем за 3 дня до экзамена; на коллоквиум — принести соответствующую физическую версию.</p></div>
    <button id="gitrSaveBtn" class="btn" onclick="toggleGitrPlan()">Добавить ГИТР в план</button><button class="btn secondary" data-go="gitrOral">Коллоквиум: вопросы и тренировка</button><button class="btn secondary" data-go="gitrWritten">Письменная работа: эссе</button>`);

  appendScreen('gitrOral',`
    <div class="eye">ГИТР · журналистика</div><h2>Коллоквиум</h2><p class="sub">По программе: сначала обсуждение творческой папки, затем ответы на вопросы комиссии.</p>
    <div class="card"><h3>Что реально оценивается</h3><ul class="list"><li>грамотная и логичная устная речь</li><li>полнота творческой папки и видеовизитки</li><li>умение держаться на экзамене</li><li>полные ответы на основные и дополнительные вопросы</li><li>культурный уровень и кругозор</li><li>ориентация в журналистике</li><li>знание текущих новостей</li><li>идеи для аудиовизуального контента</li><li>профессиональная терминология</li></ul></div>
    <div class="card softo"><h3>Почему эта программа полезна и для общей базы</h3><p>30 вопросов охватывают мотивацию, опыт, СМИ, журналистов, чтение, кино, искусство, повестку, историю и географию. Многие из этих направлений логичны и для собеседований других журфаков — но формулировки и критерии конкретного вуза всё равно проверяем отдельно.</p></div>
    <button class="btn" onclick="startInterviewMode('gitr')">Тренировать вопросы ГИТРа</button><button class="btn secondary" data-go="gitrBank">Посмотреть все 30 вопросов</button>`);

  appendScreen('gitrBank',`<div class="eye">ГИТР · программа 2026</div><div class="row between"><h2>30 вопросов</h2><span class="status o">официальная программа</span></div><p class="sub">Это не список, который надо зубрить слово в слово. Используйте его как карту зон, в которых комиссия может развивать разговор.</p><div class="questionBank" id="gitrQuestionBank"></div>`);

  appendScreen('gitrWritten',`
    <div class="eye">ГИТР · письменная работа</div><h2>Эссе</h2><div class="grid2"><div class="metric"><span class="meta">Выбор</span><strong>1 из 4</strong><span class="meta">тем</span></div><div class="metric"><span class="meta">Время</span><strong>3</strong><span class="meta">астрономических часа</span></div></div>
    <div class="card"><h3>Объём по программе</h3><p>Не менее 4 рукописных страниц или не менее 2 машинописных страниц; в программе указано 1800 знаков с пробелами на одну машинописную страницу.</p></div>
    <div class="card"><h3>Примеры тем из программы</h3><span class="pill">Журналистика: ремесло и искусство</span><span class="pill">Журналисты и блогеры</span><span class="pill">Событие на всю жизнь</span><span class="pill">У кого я никогда не возьму интервью</span></div>
    <div class="notice">Отдельный содержательный тренажёр эссе ГИТРа добавим при ревизии письменных испытаний.</div>`);

  window.toggleGitrPlan=function(){state.savedGitr=!state.savedGitr;saveState();renderV09();toast(state.savedGitr?'ГИТР добавлен в план':'ГИТР убран из плана')};

  window.startInterviewMode=function(mode){
    state.interviewMode=mode;
    if(mode==='gitr'){state.interviewCategory='gitr';state.interviewQuestionIndex=Math.floor(Math.random()*gitrQs.length)}
    else if(mode==='spbgikit'){state.interviewCategory='media';state.interviewQuestionIndex=0}
    else if(!catKeys.includes(state.interviewCategory)){state.interviewCategory='motivation';state.interviewQuestionIndex=0}
    saveState();renderV09();go('interviewTrainer');
  };
  window.openInterviewCircle=function(key){state.interviewMode='universal';state.interviewCategory=key;state.interviewQuestionIndex=0;saveState();renderV09();go('interviewTrainer')};
  window.startMixedInterview=function(){state.interviewMode='universal';state.interviewCategory=catKeys[Math.floor(Math.random()*catKeys.length)];state.interviewQuestionIndex=Math.floor(Math.random()*categories[state.interviewCategory].qs.length);saveState();renderV09();go('interviewTrainer')};
  window.nextInterviewQuestion=function(){
    if(state.interviewMode==='gitr'){state.interviewQuestionIndex=(state.interviewQuestionIndex+1)%gitrQs.length}
    else if(state.interviewMode==='spbgikit'){const pool=spbQuestions();state.interviewQuestionIndex=(state.interviewQuestionIndex+1)%pool.length}
    else {const qs=categories[state.interviewCategory].qs;state.interviewQuestionIndex=(state.interviewQuestionIndex+1)%qs.length}
    saveState();renderV09();
  };
  window.saveInterviewAnswer=function(){
    const text=(document.getElementById('interviewAnswerText')?.value||'').trim();if(text.length<20){toast('Ответьте хотя бы несколькими предложениями');return}
    const checks=[1,2,3,4,5].map(i=>!!document.getElementById('ac'+i)?.checked);
    const q=currentQuestion();
    state.interviewAnswers.push({date:new Date().toLocaleDateString('ru-RU'),mode:state.interviewMode,category:state.interviewCategory,question:q,text,checks});saveState();renderSaved(q,text,checks);go('interviewSaved');
  };

  function spbQuestions(){
    const media=state.mediaDiet?.media||[],journ=state.mediaDiet?.journalists||[];
    return [
      media[0]?`Вы выбрали ${media[0]} в свой медиарацион. Какой материал этого СМИ за последнее время вы можете обсудить?`:'Какие российские СМИ вы читаете регулярно и почему?',
      journ[0]?`Вы следите за ${journ[0]}. Чем вам интересна работа этого журналиста?`:'Назовите журналиста, за которым вы следите, и объясните почему.',
      'Какое событие последней недели вы считаете важным и почему?',
      'Что вы знаете о культурной жизни Санкт-Петербурга?',
      'Какую собственную работу из портфолио вы готовы защищать перед комиссией?'
    ];
  }
  function currentQuestion(){
    if(state.interviewMode==='gitr')return gitrQs[state.interviewQuestionIndex%gitrQs.length][1];
    if(state.interviewMode==='spbgikit'){const p=spbQuestions();return p[state.interviewQuestionIndex%p.length]}
    const c=categories[state.interviewCategory]||categories.motivation;return c.qs[state.interviewQuestionIndex%c.qs.length];
  }
  function currentLabel(){if(state.interviewMode==='gitr')return 'ГИТР';if(state.interviewMode==='spbgikit')return 'СПбГИКиТ';return categories[state.interviewCategory]?.title||'Общая база'}

  function renderSaved(q,text,checks){const box=document.getElementById('savedInterviewSummary');if(!box)return;const n=checks.filter(Boolean).length;box.innerHTML=`<div class="card green"><div class="row between"><h3>Попытка сохранена</h3><span class="status g">${n}/5 элементов</span></div><p class="meta">${esc(currentLabel())}</p><p><b>${esc(q)}</b></p></div><div class="card"><h3>Самопроверка</h3><p>${n===5?'Вы отметили все элементы структуры. Теперь важнее проверить содержательность и факты, а не добавлять формальные пункты.':`Не отмечено элементов: ${5-n}. Это не «ошибки комиссии», а подсказка, куда посмотреть перед следующей попыткой.`}</p></div>`}

  function renderV09(){
    const grid=document.getElementById('interviewCircles');if(grid)grid.innerHTML=catKeys.map(k=>{const c=categories[k];const cnt=state.interviewAnswers.filter(a=>a.mode==='universal'&&a.category===k).length;return `<div class="circleCard click ${state.interviewCategory===k?'current':''}" onclick="openInterviewCircle('${k}')"><div class="circleIcon">${c.icon}</div><b>${c.title}</b><small>${c.desc}</small><div class="meta" style="margin-top:7px">${cnt?`ответов: ${cnt}`:'ещё не тренировали'}</div></div>`}).join('');
    const q=currentQuestion(),mode=currentLabel();set('interviewQuestion',q);set('interviewModeEye',mode+' · устный ответ');set('interviewCatTitle',mode==='ГИТР'?'Вопросы программы':mode==='СПбГИКиТ'?'Коллоквиум СПбГИКиТ':categories[state.interviewCategory]?.title||'Вопрос');set('interviewAttemptCount',state.interviewAnswers.length+' ответов');
    const hint=document.getElementById('interviewHint');if(hint)hint.textContent=state.interviewMode==='gitr'?'Формулировка из программы ГИТРа 2026. Будьте готовы к дополнительному уточнению.':state.interviewMode==='spbgikit'?'Тренировочная формулировка MMT по требованиям СПбГИКиТ, не официальный билет.':'Универсальная тренировочная формулировка MMT.';
    const pm=document.getElementById('personalMediaHint');if(pm){const m=state.mediaDiet?.media||[],j=state.mediaDiet?.journalists||[];if((state.interviewCategory==='media'||state.interviewMode==='spbgikit')&&(m.length||j.length)){pm.style.display='block';pm.innerHTML=`<h3>Используйте свою медиасреду</h3><p class="meta">Ваши СМИ: ${m.map(esc).join(', ')||'не выбраны'}<br>Ваши журналисты: ${j.map(esc).join(', ')||'не выбраны'}</p>`}else pm.style.display='none'}
    const bank=document.getElementById('gitrQuestionBank');if(bank)bank.innerHTML=gitrQs.map((x,i)=>`<div class="bankQ"><small>${i+1} · ${esc(x[0])}</small>${esc(x[1])}</div>`).join('');
    const hist=document.getElementById('interviewHistoryList');if(hist){set('historyCount',String(state.interviewAnswers.length));hist.innerHTML=state.interviewAnswers.length?state.interviewAnswers.slice().reverse().map((a,i)=>`<div class="historyAnswer"><div class="row between"><div><b>${esc(a.mode==='gitr'?'ГИТР':a.mode==='spbgikit'?'СПбГИКиТ':categories[a.category]?.title||'Общая база')}</b><div class="meta">${esc(a.date)}</div></div><span class="status ${a.checks.filter(Boolean).length>=4?'g':'y'}">${a.checks.filter(Boolean).length}/5</span></div><p><b>${esc(a.question)}</b></p><div class="answerText">${esc(a.text)}</div><div class="tagline">${['тезис','почему','пример','личная связь','вывод'].map((t,n)=>a.checks[n]?`<span>✓ ${t}</span>`:`<span>— ${t}</span>`).join('')}</div></div>`).join(''):'<div class="notice">Пока нет сохранённых устных ответов.</div>'}
    const gb=document.getElementById('gitrSaveBtn');if(gb)gb.textContent=state.savedGitr?'✓ ГИТР в моём плане':'Добавить ГИТР в план';const gs=document.getElementById('myGitrStatus');if(gs){gs.textContent=state.savedGitr?'в плане':'изучаю';gs.className='status '+(state.savedGitr?'g':'')}
  }
  function set(id,v){const e=document.getElementById(id);if(e)e.textContent=v}

  // Prevent full GITR training path before adding to plan, but allow viewing requirements and question bank.
  document.addEventListener('click',e=>{const t=e.target.closest('[onclick*="startInterviewMode(\'gitr\')"]');if(t&&!state.savedGitr){e.preventDefault();e.stopImmediatePropagation();toast('Сначала добавьте ГИТР в свой план');go('gitr')}},true);

  const oldRefresh=window.refresh;if(typeof oldRefresh==='function')window.refresh=function(){oldRefresh();renderV09()};
  renderV09();
})();
