/* MMT ДВИ v0.5 — учебная глубина, МПГУ, история устных ответов */
(function setupV05(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.5';
  document.title='MMT ДВИ — v0.5';

  state.savedMpgu = !!state.savedMpgu;
  state.newsCount = state.newsCount || 8;
  state.newsSubmitted = !!state.newsSubmitted;
  state.newsRevised = !!state.newsRevised;
  state.newsOrder = Array.isArray(state.newsOrder) ? state.newsOrder : [2,0,3,1];
  state.newsOrderDone = !!state.newsOrderDone;
  state.newsQuizCorrect = state.newsQuizCorrect || 0;
  state.newsQuizAnswered = state.newsQuizAnswered || 0;
  state.oralAnswers = Array.isArray(state.oralAnswers) ? state.oralAnswers : [];

  const css=document.createElement('style');
  css.textContent=`
    .modulemap{display:grid;gap:8px;margin:14px 0}.moduleline{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px}.moduleline .n{width:30px;height:30px;border-radius:10px;background:var(--muted);display:grid;place-items:center;font-weight:800;font-size:12px}.moduleline.done .n{background:var(--gb);color:var(--g)}.moduleline.current{border-color:var(--o);background:#fffaf7}.moduleline.current .n{background:var(--o)}
    .lessonhero{background:var(--ink);color:white;border-radius:22px;padding:18px;margin:12px 0}.lessonhero .meta{color:#bbb}.formula{font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:700;padding:14px;border-radius:16px;background:var(--os);margin:12px 0}.sixgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.sixgrid div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:11px;font-weight:700}.sixgrid small{display:block;color:var(--soft);font-weight:400;margin-top:3px}
    .newsq{padding:12px 0;border-bottom:1px solid var(--line)}.newsq:last-child{border:0}.qfeedback{display:none;margin-top:8px;font-size:12px;padding:9px 10px;border-radius:12px;background:var(--muted)}.newsq.answered .qfeedback{display:block}.newsq.good .qfeedback{background:var(--gb);color:var(--g)}.newsq.bad .qfeedback{background:var(--rb);color:var(--r)}
    .orderitem{display:grid;grid-template-columns:1fr 38px;gap:8px;align-items:start;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px;margin:8px 0}.orderbuttons{display:grid;gap:5px}.movebtn{width:36px;height:30px;border:1px solid var(--line);background:var(--muted);border-radius:9px;font-weight:800}.orderitem b{display:block;margin-bottom:4px}.orderok{border-color:var(--g);background:var(--gb)}
    .selfgrid{display:grid;gap:4px;margin:10px 0}.selfgrid label{display:flex;gap:9px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #eee}.selfgrid input{accent-color:var(--o);margin-top:3px}
    .comparegrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.comparebox{background:white;border:1px solid var(--line);border-radius:16px;padding:12px;min-height:150px}.comparebox p{font-size:13px}.recordbtn{display:flex;align-items:center;gap:10px;background:var(--ink);color:white;border-radius:18px;padding:14px;margin:12px 0}.recorddot{width:38px;height:38px;border-radius:50%;background:var(--o);display:grid;place-items:center;color:#000;font-weight:800}
    .universityMark{width:52px;height:52px;border-radius:16px;background:var(--ink);color:white;display:grid;place-items:center;font:800 12px Montserrat,Arial,sans-serif}.demoSource{background:#fff7e6;border:1px solid #ead8a4;border-radius:14px;padding:12px;font-size:12px;line-height:1.45}
    .continuecard{border:2px solid var(--o);background:white}.reason{display:flex;gap:9px;align-items:flex-start;background:var(--os);border-radius:13px;padding:11px;margin-top:10px;font-size:12px}.reason b{flex:0 0 auto}
    .outreachrow{display:grid;grid-template-columns:1fr auto;gap:10px;padding:12px 0;border-bottom:1px solid var(--line)}.outreachrow:last-child{border:0}
    @media(max-width:370px){.sixgrid,.comparegrid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);

  function appendScreen(id,html){
    if(document.getElementById(id)) return document.getElementById(id);
    const s=document.createElement('section'); s.id=id; s.className='screen'; s.innerHTML=html; document.querySelector('main').appendChild(s); return s;
  }

  // --- Главная: продолжить с места, где остановился ---
  const home=document.getElementById('home');
  if(home && !document.getElementById('continueCard')){
    const c=document.createElement('div'); c.id='continueCard'; c.className='card continuecard click'; c.setAttribute('data-go','newsCourse');
    const firstCard=home.querySelector('.card'); if(firstCard) firstCard.after(c); else home.prepend(c);
  }

  // --- БАЗА MMT: Новости как первый глубокий модуль ---
  const base=document.getElementById('base');
  if(base){
    const candidates=[...base.querySelectorAll('.step,.card,.action,li,div')];
    const news=candidates.find(x=>x.children.length<5 && /^\s*Новости\b/i.test(x.textContent.trim()));
    if(news){ news.classList.add('click'); news.setAttribute('data-go','newsCourse'); news.style.cursor='pointer'; }
  }

  appendScreen('newsCourse',`
    <div class="eye">База MMT · Новости</div><div class="row between"><h2>Новости</h2><span class="status o" id="newsCountBadge">8 / 10</span></div>
    <p class="sub">Около десяти самостоятельных новостей — ориентир, а не магическое число. Важно, чтобы навык стал стабильным.</p>
    <div class="card hero"><div class="row between"><div><div class="meta" style="color:#bbb">Навык</div><div class="big" id="newsSkillPct">72%</div></div><div style="text-align:right"><div class="meta" style="color:#bbb">Следующее</div><b>лид и структура</b></div></div><div class="progress light"><i id="newsSkillBar" style="width:72%"></i></div></div>
    <div class="modulemap">
      <div class="moduleline done"><div class="n">✓</div><div><b>Что такое новость</b><div class="meta">Факт, событие, актуальность</div></div><span>›</span></div>
      <div class="moduleline current click" data-go="newsLesson"><div class="n">2</div><div><b>Шесть вопросов и лид</b><div class="meta">Что читатель должен понять сразу</div></div><span>›</span></div>
      <div class="moduleline click" data-go="newsOrder"><div class="n">3</div><div><b>Перевёрнутая пирамида</b><div class="meta">Ядро → детали → бэкграунд</div></div><span>›</span></div>
      <div class="moduleline"><div class="n">4</div><div><b>Источники и цитаты</b><div class="meta">Кто сообщает и можно ли проверить</div></div><span>›</span></div>
      <div class="moduleline"><div class="n">5</div><div><b>Баланс и редактура</b><div class="meta">Фокус, полнота, точность</div></div><span>›</span></div>
      <div class="moduleline click" data-go="newsAssignment"><div class="n">6</div><div><b>Самостоятельная новость</b><div class="meta">Работа №<span id="nextNewsNumber">9</span></div></div><span>›</span></div>
    </div>
    <button class="btn" data-go="newsLesson">Продолжить обучение</button>
    <button class="btn secondary" data-go="newsAssignment">Перейти к своей новости</button>`);

  appendScreen('newsLesson',`
    <div class="eye">Новости · микроурок</div><h2>Сначала главное</h2>
    <div class="lessonhero"><div class="meta">Задача</div><h3>Читатель должен понять событие уже из первых строк</h3><p>Не начинайте новость с длинной предыстории, если главный факт можно назвать сразу.</p></div>
    <div class="card"><h3>Шесть базовых вопросов</h3><div class="sixgrid"><div>Что?<small>что произошло</small></div><div>Кто?<small>участники</small></div><div>Где?<small>место</small></div><div>Когда?<small>время</small></div><div>Почему?<small>причина, если известна</small></div><div>Как?<small>обстоятельства</small></div></div><p class="meta">Не каждый лид обязан механически отвечать на все шесть вопросов. Они помогают проверить полноту материала.</p></div>
    <div class="formula">Лид → главное событие + важнейшая конкретика</div>
    <div class="card"><h3>Перевёрнутая пирамида</h3><div class="step"><span class="num">1</span><div><b>Ядро</b><p class="meta">Что произошло и почему это новость.</p></div></div><div class="step"><span class="num">2</span><div><b>Детали</b><p class="meta">Цифры, участники, цитаты, развитие.</p></div></div><div class="step"><span class="num">3</span><div><b>Бэкграунд</b><p class="meta">Контекст, без которого событие трудно понять.</p></div></div></div>
    <button class="btn" data-go="newsQuiz">Проверить себя</button>`);

  appendScreen('newsQuiz',`
    <div class="eye">Новости · упражнение</div><h2>Что поставить выше?</h2><p class="sub">Три коротких вопроса. После каждого ответа сразу увидите объяснение.</p>
    <div class="card">
      <div class="newsq" data-q="1"><b>1. С чего лучше начать новость о закрытии станции метро?</b><button class="option" onclick="newsQuizAnswer(this,false)">С истории строительства линии</button><button class="option" onclick="newsQuizAnswer(this,true)">С факта закрытия, времени и того, кого это затронет</button><div class="qfeedback">В лид выносим событие и наиболее важную для читателя конкретику.</div></div>
      <div class="newsq" data-q="2"><b>2. Что обычно относится к бэкграунду?</b><button class="option" onclick="newsQuizAnswer(this,true)">Контекст похожих событий и предыстория</button><button class="option" onclick="newsQuizAnswer(this,false)">Главный факт, ради которого написана новость</button><div class="qfeedback">Бэкграунд объясняет контекст, но не должен вытеснять главное событие.</div></div>
      <div class="newsq" data-q="3"><b>3. Зачем указывать источник?</b><button class="option" onclick="newsQuizAnswer(this,false)">Чтобы текст выглядел длиннее</button><button class="option" onclick="newsQuizAnswer(this,true)">Чтобы читатель понимал происхождение информации и мог оценить её надёжность</button><div class="qfeedback">Источник — часть проверяемости и прозрачности новости.</div></div>
    </div>
    <div id="newsQuizResult" class="card green" style="display:none"></div>
    <button id="newsQuizNext" class="btn" data-go="newsOrder" style="display:none">Следующее упражнение</button>`);

  appendScreen('newsOrder',`
    <div class="eye">Новости · структура</div><h2>Соберите новость</h2><p class="sub">Перемещайте абзацы стрелками. Сильная структура ведёт от главного факта к деталям и контексту.</p>
    <div id="newsOrderList"></div>
    <button class="btn" onclick="checkNewsOrder()">Проверить порядок</button>
    <div id="newsOrderFeedback" class="card" style="display:none"></div>
    <button class="btn secondary" data-go="newsEdit">Ещё одно упражнение: переписать лид</button>`);

  appendScreen('newsEdit',`
    <div class="eye">Новости · редактура</div><h2>Уберите предысторию из лида</h2>
    <div class="card red"><h3>До</h3><p>В последние годы городские пространства всё чаще становятся местом проведения различных культурных мероприятий. В субботу в центральном парке прошёл книжный фестиваль, который посетили более пяти тысяч человек.</p></div>
    <div class="label">Перепишите начало</div><textarea id="newsLeadRewrite" class="textarea" placeholder="Начните с события..."></textarea>
    <button class="btn" onclick="saveNewsLead()">Сохранить вариант</button>
    <div id="newsLeadModel" class="card green" style="display:none"><h3>Один из рабочих вариантов</h3><p><b>Более пяти тысяч человек посетили книжный фестиваль в центральном парке в субботу.</b></p><p class="meta">Это не единственно возможный лид. Смысл упражнения — поднять главный факт выше.</p></div>
    <button class="btn secondary" data-go="newsAssignment">Написать свою новость</button>`);

  appendScreen('newsAssignment',`
    <div class="eye">Новости · самостоятельная работа</div><div class="row between"><h2>Новость №<span id="newsAssignmentNo">9</span></h2><span class="status y" id="newsSubmitStatus">черновик</span></div>
    <div class="card softo"><h3>Задание</h3><p>Найдите реальное событие, которое произошло рядом с вами или в доступной вам среде, соберите факты и напишите короткую новость. Не придумывайте событие для выполнения упражнения.</p></div>
    <div class="label">Текст новости</div><textarea id="newsOwnText" class="textarea" style="min-height:240px" placeholder="Заголовок и текст новости..."></textarea>
    <div class="card"><h3>Самопроверка перед сдачей</h3><div class="selfgrid"><label><input class="newscheck" type="checkbox"><span>Главный факт понятен из первых строк</span></label><label><input class="newscheck" type="checkbox"><span>Я проверил имена, цифры, даты и названия</span></label><label><input class="newscheck" type="checkbox"><span>Понятно, откуда взята информация</span></label><label><input class="newscheck" type="checkbox"><span>Бэкграунд не заслоняет событие</span></label><label><input class="newscheck" type="checkbox"><span>В тексте нет фактов, которые я не могу подтвердить</span></label></div></div>
    <button class="btn" onclick="submitNewsWork()">Отправить на разбор</button>`);

  appendScreen('newsReview',`
    <div class="eye">Разбор MMT · демо</div><div class="row between"><h2>Новость №<span id="newsReviewNo">9</span></h2><div class="big" style="font-size:36px">82</div></div>
    <div class="notice">Оценка ниже демонстрирует интерфейс будущей проверки. В рабочем продукте баллы будут рассчитываться по критериям MMT на основании конкретного текста.</div>
    <div class="card"><h3>По критериям</h3><div class="rubric"><span>Лид и фокус</span><strong>18/20</strong></div><div class="rubric"><span>Факты и источники</span><strong>17/20</strong></div><div class="rubric"><span>Структура</span><strong>16/20</strong></div><div class="rubric"><span>Полнота</span><strong>16/20</strong></div><div class="rubric"><span>Язык</span><strong>15/20</strong></div></div>
    <div class="card green"><h3>Сильная сторона</h3><p>Главный факт вынесен наверх, текст быстро отвечает на вопрос «что произошло».</p></div>
    <div class="card red"><h3>Что исправить</h3><p>Проверьте, нужен ли весь бэкграунд в середине текста, и убедитесь, что каждая оценочная формулировка принадлежит источнику, а не автору новости.</p></div>
    <button class="btn" data-go="newsRevise">Исправить и отправить ещё раз</button>`);

  appendScreen('newsRevise',`
    <div class="eye">Новости · версия 2</div><h2>Доработайте текст</h2><div class="card yellow"><b>Фокус версии 2</b><p>1) проверить источники; 2) убрать лишний бэкграунд; 3) сделать формулировки нейтральнее.</p></div><textarea id="newsRevisionText" class="textarea" style="min-height:240px" placeholder="Исправленная версия..."></textarea><button class="btn" onclick="resubmitNewsWork()">Отправить версию 2</button>`);

  appendScreen('newsDone',`
    <div class="card green"><span class="status g">версия 2</span><h2 style="margin-top:10px">Новость засчитана</h2><p>В демо счётчик самостоятельных новостей увеличился. В реальном курсе переход дальше будет зависеть не только от количества, но и от стабильности навыка.</p></div><button class="btn" data-go="newsCourse">Вернуться к модулю</button><button class="btn secondary" data-go="portfolio">Посмотреть портфолио</button>`);

  // --- МПГУ: вторая архитектурно отличающаяся модель ---
  const results=document.getElementById('results');
  if(results){
    const mp=[...results.querySelectorAll('.card')].find(x=>x.textContent.includes('МПГУ'));
    if(mp){mp.classList.add('click');mp.setAttribute('data-go','mpgu');}
  }
  const search=document.getElementById('search');
  if(search && !document.getElementById('mpguSearchCard')){
    const c=document.createElement('div'); c.id='mpguSearchCard'; c.className='card click'; c.setAttribute('data-go','mpgu'); c.innerHTML='<div class="row between"><div><h3>МПГУ</h3><p class="meta">Москва · тестовая модель</p></div><span class="chev">›</span></div><span class="pill">Журналистика</span><span class="status y" style="margin-left:6px">официальные данные дополняются</span>'; search.appendChild(c);
  }

  appendScreen('mpgu',`
    <div class="eye">Москва · второй тестовый вуз</div><div class="row between"><div><h2>МПГУ</h2><p class="meta">Московский педагогический государственный университет</p></div><div class="universityMark">МПГУ</div></div>
    <div class="demoSource"><b>Важно:</b> это пока демонстрация другой модели ДВИ. Мы не публикуем здесь места, стоимость, минимумы и даты, пока не внесём проверенные данные конкретной приёмной кампании.</div>
    <div class="card orange"><h3>Ключевое отличие модели</h3><p><b>Творческий текст</b> — задача не сводится к стандартному школьному эссе. Подготовка должна тренировать свободное творческое решение, работу с образом, голосом и композицией.</p></div>
    <div class="card"><h3>Пример из материалов MMT</h3><p class="quote">«Монолог пуговицы»</p><p class="meta">Это пример ранее встречавшейся темы, а не обещание формата будущего экзамена.</p></div>
    <div class="card"><h3>Что из базы уже работает</h3><div class="score"><span>Наблюдение и детали</span><strong>база MMT</strong></div><div class="score"><span>Язык и композиция</span><strong>общий навык</strong></div><div class="score"><span>Творческие задания МПГУ</span><strong>специализация</strong></div></div>
    <button id="mpguSaveBtn" class="btn" onclick="toggleMpguPlan()">Добавить МПГУ в план</button><button class="btn secondary" onclick="openMpguPrep()">Посмотреть подготовку</button>`);

  appendScreen('mpguPrep',`
    <div class="eye">МПГУ · подготовка</div><h2>Творческий текст</h2><div class="card hero"><div class="meta" style="color:#bbb">Принцип</div><h3>Не учим одному шаблону</h3><p>Тренируем способность быстро придумать художественное решение и удержать его от первой до последней строки.</p></div>
    <div class="modulemap"><div class="moduleline done"><div class="n">✓</div><div><b>Наблюдение и детали</b><div class="meta">из общей базы</div></div></div><div class="moduleline current"><div class="n">2</div><div><b>Необычная точка зрения</b><div class="meta">говорит предмет / пространство / свидетель</div></div></div><div class="moduleline"><div class="n">3</div><div><b>Композиция</b><div class="meta">как не потерять идею по ходу текста</div></div></div><div class="moduleline"><div class="n">4</div><div><b>Пробные темы</b><div class="meta">с таймером и разбором</div></div></div></div>
    <div class="card softo"><h3>Демо-задание</h3><p>Выберите обычный предмет и напишите начало монолога от его лица так, чтобы уже в первом абзаце появился конфликт или желание.</p></div><textarea class="textarea" placeholder="Первые 5–7 предложений..."></textarea><button class="btn" onclick="toast('Демо-ответ сохранён. Полный разбор добавим после критериев МПГУ.')">Сохранить демо-ответ</button>`);

  // --- История устных ответов ---
  const dvi=document.getElementById('dvi');
  if(dvi && !document.getElementById('oralHistoryCard')){
    const c=document.createElement('div'); c.id='oralHistoryCard'; c.className='card click'; c.setAttribute('data-go','oralHistory'); c.innerHTML='<div class="row between"><div><h3>История устных ответов</h3><p class="meta">Сохранять попытки и сравнивать прогресс</p></div><span class="chev">›</span></div>'; dvi.appendChild(c);
  }
  const oralTrainer=document.getElementById('oralTrainer');
  if(oralTrainer && !document.getElementById('oralSaveHistory')){
    const ta=oralTrainer.querySelector('textarea'); if(ta) ta.id='oralAnswerText';
    const firstBtn=oralTrainer.querySelector('.btn');
    const b=document.createElement('button'); b.id='oralSaveHistory'; b.className='btn secondary'; b.textContent='Сохранить ответ в историю'; b.onclick=saveOralAnswer;
    if(firstBtn) firstBtn.after(b); else oralTrainer.appendChild(b);
    const r=document.createElement('div'); r.className='recordbtn click'; r.onclick=()=>toast('Запись голоса появится в настоящем приложении. В веб-прототипе сохраняем текст ответа.'); r.innerHTML='<div class="recorddot">●</div><div><b>Записать голосом</b><div class="meta" style="color:#bbb">механика для Android · позже</div></div>'; oralTrainer.insertBefore(r,ta);
  }

  appendScreen('oralHistory',`
    <div class="eye">Устная подготовка</div><div class="row between"><h2>Мои ответы</h2><span class="status o" id="oralCount">0</span></div><p class="sub">Сохраняйте попытки, чтобы видеть не только итоговый балл, но и как меняется сам ответ.</p>
    <div id="oralHistoryList"></div>
    <div id="oralEmpty" class="card"><h3>Пока нет сохранённых ответов</h3><p class="meta">Откройте текстовую симуляцию и сохраните первую попытку. В Android-версии сюда добавятся аудиозаписи.</p><button class="btn" data-go="oralTrainer">Ответить на вопрос</button></div>
    <button id="oralCompareBtn" class="btn secondary" data-go="oralCompare" style="display:none">Сравнить две последние попытки</button>`);

  appendScreen('oralCompare',`
    <div class="eye">Устная подготовка</div><h2>Сравнение попыток</h2><div id="oralCompareContent"></div><div class="card softo"><h3>Что будем сравнивать в рабочей версии</h3><ul class="list"><li>структуру ответа</li><li>конкретность и качество примеров</li><li>умение отвечать на уточнение</li><li>темп, паузы и слова-паразиты — при голосовой записи</li></ul></div><div class="notice">Прототип не выставляет фиктивные оценки речи. Метрики появятся после того, как мы зададим реальные критерии проверки.</div>`);

  // --- Стажировка: чуть виднее продолжение после письма ---
  const internship=document.getElementById('internship');
  if(internship && !document.getElementById('outreachCard')){
    const c=document.createElement('div'); c.id='outreachCard'; c.className='card click'; c.setAttribute('data-go','outreach'); c.innerHTML='<div class="row between"><div><h3>Мои обращения</h3><p class="meta">Отправлено → ответили → договорились</p></div><span class="chev">›</span></div>'; internship.appendChild(c);
  }
  appendScreen('outreach',`<div class="eye">Стажировка</div><h2>Мои обращения</h2><div class="notice">Это демонстрация трекера. Конкретные редакции появятся только после добавления пользователем или из проверенной базы MMT.</div><div class="card"><div class="outreachrow"><div><b>Редакция 1</b><div class="meta">письмо подготовлено</div></div><span class="status y">черновик</span></div><div class="outreachrow"><div><b>Редакция 2</b><div class="meta">контакт добавлен пользователем</div></div><span class="status o">отправлено</span></div></div><button class="btn" data-go="letter">Подготовить новое письмо</button>`);

  // Перехватываем refresh, чтобы новые состояния обновлялись вместе со старым прототипом.
  const refresh042=refresh;
  refresh=function(){ refresh042(); refreshV05(); };
  refreshV05();
})();

function refreshV05(){
  if(typeof state==='undefined') return;
  state.savedMpgu=!!state.savedMpgu; state.newsCount=state.newsRevised?Math.max(state.newsCount||8,9):(state.newsCount||8); state.oralAnswers=Array.isArray(state.oralAnswers)?state.oralAnswers:[];
  const c=document.getElementById('continueCard');
  if(c){
    if(state.newsSubmitted&&!state.newsRevised){c.setAttribute('data-go','newsReview');c.innerHTML='<div class="eye">Продолжить</div><div class="row between"><div><h3>Разбор новости готов</h3><p class="meta">Откройте замечания и подготовьте версию 2.</p></div><span class="chev">›</span></div><div class="reason"><b>Почему сейчас:</b><span>исправление по свежему разбору полезнее нового задания.</span></div>'}
    else if(state.newsRevised){c.setAttribute('data-go','newsCourse');c.innerHTML='<div class="eye">Продолжить</div><div class="row between"><div><h3>Новость засчитана</h3><p class="meta">Следующий шаг — закрепить навык ещё одной самостоятельной работой.</p></div><span class="chev">›</span></div><div class="reason"><b>Почему сейчас:</b><span>одной удачной работы недостаточно — важна стабильность.</span></div>'}
    else{c.setAttribute('data-go','newsCourse');c.innerHTML='<div class="eye">Продолжить с места остановки</div><div class="row between"><div><h3>Новости: лид и структура</h3><p class="meta">8 из рекомендуемых 10 работ · следующий микроурок</p></div><span class="chev">›</span></div><div class="reason"><b>Почему сейчас:</b><span>это ближайший незакрытый базовый навык в вашем маршруте.</span></div>'}
  }
  const nc=state.newsCount||8; setText('newsCountBadge',nc+' / 10'); setText('nextNewsNumber',Math.min(nc+1,10)); setText('newsAssignmentNo',Math.min(nc+1,10)); setText('newsReviewNo',Math.min(nc+1,10));
  const pct=state.newsRevised?80:72; setText('newsSkillPct',pct+'%'); setWidth('newsSkillBar',pct);
  const ns=document.getElementById('newsSubmitStatus'); if(ns) ns.textContent=state.newsSubmitted?'отправлено':state.newsRevised?'засчитано':'черновик';
  const m=document.getElementById('mpguSaveBtn'); if(m)m.textContent=state.savedMpgu?'✓ МПГУ в моём плане':'Добавить МПГУ в план';
  renderNewsOrder(); renderOralHistory(); renderOralCompare();
}

function newsQuizAnswer(btn,correct){
  const q=btn.closest('.newsq'); if(!q||q.classList.contains('answered'))return; q.classList.add('answered',correct?'good':'bad'); btn.classList.add(correct?'correct':'wrong');
  state.newsQuizAnswered=(state.newsQuizAnswered||0)+1; if(correct)state.newsQuizCorrect=(state.newsQuizCorrect||0)+1; saveState();
  if(state.newsQuizAnswered>=3){const r=document.getElementById('newsQuizResult'),n=document.getElementById('newsQuizNext'); if(r){r.style.display='block';r.innerHTML='<h3>'+state.newsQuizCorrect+' из 3</h3><p>'+(state.newsQuizCorrect===3?'Отлично. Переходим к структуре.':'Ошибки здесь нормальны: откройте объяснения и переходите к следующему упражнению.')+'</p>'} if(n)n.style.display='flex';}
}

const newsParagraphs=[
  {t:'Ядро',x:'Городская библиотека открыла новую медиалабораторию для школьников в субботу.'},
  {t:'Важная деталь',x:'В лаборатории можно бесплатно работать со звуком, видео и цифровой графикой по предварительной записи.'},
  {t:'Комментарий / развитие',x:'По словам организаторов, первые занятия начнутся в сентябре.'},
  {t:'Бэкграунд',x:'Проект готовили несколько месяцев в рамках обновления молодёжных пространств библиотеки.'}
];
function renderNewsOrder(){const box=document.getElementById('newsOrderList');if(!box)return; const order=state.newsOrder||[2,0,3,1]; box.innerHTML=order.map((idx,pos)=>`<div class="orderitem ${state.newsOrderDone?'orderok':''}"><div><b>${pos+1}. ${newsParagraphs[idx].t}</b><span>${newsParagraphs[idx].x}</span></div><div class="orderbuttons"><button class="movebtn" onclick="moveNewsOrder(${pos},-1)">↑</button><button class="movebtn" onclick="moveNewsOrder(${pos},1)">↓</button></div></div>`).join('')}
function moveNewsOrder(pos,delta){const a=state.newsOrder||[2,0,3,1],to=pos+delta;if(to<0||to>=a.length)return;[a[pos],a[to]]=[a[to],a[pos]];state.newsOrder=a;state.newsOrderDone=false;saveState()}
function checkNewsOrder(){const ok=(state.newsOrder||[]).join(',')==='0,1,2,3';state.newsOrderDone=ok;saveState();const f=document.getElementById('newsOrderFeedback');if(f){f.style.display='block';f.className='card '+(ok?'green':'yellow');f.innerHTML=ok?'<h3>Логика собрана</h3><p>Сначала событие, затем важные детали и развитие, в конце — контекст.</p>':'<h3>Попробуйте ещё</h3><p>Спросите себя: какой абзац читатель должен увидеть, даже если прочитает только начало?</p>'}}
function saveNewsLead(){const t=document.getElementById('newsLeadRewrite');if(!t||t.value.trim().length<20){toast('Напишите хотя бы одно полноценное предложение');return}document.getElementById('newsLeadModel').style.display='block';toast('Ваш вариант сохранён в демо')}
function submitNewsWork(){const t=document.getElementById('newsOwnText');const checks=[...document.querySelectorAll('.newscheck')];if(!t||t.value.trim().length<120){toast('Для демо напишите хотя бы небольшой текст новости');return}if(checks.some(x=>!x.checked)){toast('Сначала пройдите всю самопроверку');return}state.newsSubmitted=true;state.newsDraft=t.value.trim();saveState();go('newsReview')}
function resubmitNewsWork(){const t=document.getElementById('newsRevisionText');if(!t||t.value.trim().length<80){toast('Добавьте исправленную версию текста');return}state.newsRevised=true;state.newsSubmitted=false;state.newsCount=Math.max(state.newsCount||8,9);if(!state.works.some(w=>w.title==='Учебная новость №9'))state.works.push({title:'Учебная новость №9',type:'Учебная работа MMT',genre:'Новость',link:'',published:false});saveState();go('newsDone')}

function toggleMpguPlan(){state.savedMpgu=!state.savedMpgu;saveState();toast(state.savedMpgu?'МПГУ добавлен в план':'МПГУ убран из плана')}
function openMpguPrep(){if(!state.savedMpgu){toast('Полная подготовка включается после добавления МПГУ в план');return}go('mpguPrep')}

function saveOralAnswer(){const t=document.getElementById('oralAnswerText');if(!t||t.value.trim().length<20){toast('Сначала напишите ответ');return}const now=new Date();state.oralAnswers.push({date:now.toLocaleDateString('ru-RU',{day:'2-digit',month:'short'}),text:t.value.trim()});saveState();toast('Ответ добавлен в историю')}
function renderOralHistory(){const list=document.getElementById('oralHistoryList');if(!list)return;const a=state.oralAnswers||[];setText('oralCount',a.length);const empty=document.getElementById('oralEmpty'),cmp=document.getElementById('oralCompareBtn');if(empty)empty.style.display=a.length?'none':'block';if(cmp)cmp.style.display=a.length>=2?'flex':'none';list.innerHTML=a.slice().reverse().map((x,i)=>`<div class="card"><div class="row between"><b>Попытка ${a.length-i}</b><span class="status o">${esc(x.date)}</span></div><p>${esc(x.text).slice(0,220)}${x.text.length>220?'…':''}</p><div class="meta">Текстовая попытка · без фиктивной оценки</div></div>`).join('')}
function renderOralCompare(){const box=document.getElementById('oralCompareContent');if(!box)return;const a=state.oralAnswers||[];if(a.length<2){box.innerHTML='<div class="card">Нужно сохранить минимум две попытки.</div>';return}const x=a[a.length-2],y=a[a.length-1];box.innerHTML=`<div class="comparegrid"><div class="comparebox"><span class="status y">${esc(x.date)}</span><p>${esc(x.text)}</p></div><div class="comparebox"><span class="status o">${esc(y.date)}</span><p>${esc(y.text)}</p></div></div>`}
