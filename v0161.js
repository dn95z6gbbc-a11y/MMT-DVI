/* MMT ДВИ v0.16.1 — interview methodology upgrade from MMT teaching materials */
(function setupV0161(){
  if(typeof state==='undefined')return;
  const main=document.querySelector('main');if(!main)return;
  const VER='v0.16.1';
  const ver=document.querySelector('.ver');if(ver)ver.textContent=VER;
  document.title='MMT ДВИ — '+VER;

  state.v160Interview=state.v160Interview&&typeof state.v160Interview==='object'?state.v160Interview:{};
  const I=state.v160Interview;
  I.prep=I.prep||{};I.questions=I.questions||{};I.talk=I.talk||{};I.draft=I.draft||{};
  I.v161Lessons=I.v161Lessons||{};I.v161Micro=I.v161Micro||{};I.media=I.media||{};

  const safe=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.16.1] persist failed',e)}};
  const notify=msg=>{if(typeof toast==='function')toast(msg);else console.log(msg)};
  const go=id=>{if(typeof window.go==='function')window.go(id)};

  const css=document.createElement('style');css.id='mmt-v0161-css';css.textContent=`
    .int161Note,.int161Warn,.int161Tip{border-radius:14px;padding:11px 12px;margin:9px 0;font-size:11px;line-height:1.48}.int161Note{background:var(--os)}.int161Warn{background:#fff3ea;border:1px solid #eab896}.int161Tip{background:#eef5ee;border:1px solid #b5cbb5}
    .int161ChoiceRow{display:flex;gap:7px;flex-wrap:wrap;margin:7px 0}.int161Choice{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:12px;padding:9px 10px;font-size:10px;font-weight:800}.int161Choice.active{border-color:var(--o);background:var(--os)}
    .int161Tactic{font-size:10px;line-height:1.45;color:var(--soft);background:var(--muted);border-radius:12px;padding:9px 10px;margin-top:7px}
    .int161LessonHead{background:#0c0c0c;color:#fff;border-radius:20px;padding:16px;margin:10px 0}.int161LessonHead .meta{color:#bbb}.int161LessonHead h2{font-size:25px;margin:5px 0}.int161LessonHead p{font-size:12px;line-height:1.45;color:#d0d0d0}.int161Body{background:#fff;border:1px solid var(--line);border-radius:18px;padding:15px;margin:9px 0}.int161Body h3{font-size:18px;margin:0 0 8px}.int161Body p,.int161Body li{font-size:13px;line-height:1.53}.int161Body ul{padding-left:20px}.int161Rule{border-left:4px solid var(--o);padding:9px 12px;background:var(--os);border-radius:0 13px 13px 0;margin:10px 0;font-size:12px;line-height:1.45}
    .int161Micro{background:#fff;border:2px solid var(--o);border-radius:18px;padding:14px;margin:12px 0}.int161Option{width:100%;background:#fff;border:1px solid var(--line);border-radius:13px;padding:11px;margin:5px 0;text-align:left;font-size:12px;line-height:1.4;color:var(--ink)}.int161Option.correct{border-color:#6aa46c;background:#eef7ee}.int161Option.wrong{border-color:#c36e6e;background:#faeeee}.int161Feedback{font-size:12px;line-height:1.45;margin-top:8px;padding:9px 10px;border-radius:12px;background:var(--muted)}
    .int161Example{background:#faf8f5;border:1px solid var(--line);border-radius:14px;padding:11px 12px;margin:10px 0}.int161Example b{display:block;margin-bottom:4px}.int161Example p{font-size:11px;line-height:1.48;margin:0;color:var(--soft)}
    .int161Upload{display:block;border:1px dashed #bbb;border-radius:14px;padding:13px;text-align:center;font-size:11px;font-weight:800;cursor:pointer;margin:9px 0}.int161Upload input{display:none}.int161Photo img{width:100%;max-height:220px;object-fit:cover;border-radius:12px;background:#eee}.int161Photo .input{width:100%;box-sizing:border-box}.int161Delete{border:0;background:transparent;color:#8e3e3e;font-size:10px;font-weight:800;padding:7px 0;cursor:pointer}
    .int161Submit{border-radius:14px;padding:11px 12px;margin:10px 0;font-size:11px;line-height:1.45}.int161Submit.bad{background:#faeeee;border:1px solid #d99a9a}.int161Submit.warn{background:#fff3ea;border:1px solid #eab896}
  `;document.head.appendChild(css);

  let lessonScreen=document.getElementById('interviewLesson161');if(!lessonScreen){lessonScreen=document.createElement('section');lessonScreen.id='interviewLesson161';lessonScreen.className='screen';main.appendChild(lessonScreen)}

  const lessons=[
    {id:'types',title:'Виды интервью: зачем вы разговариваете',time:'8–10 мин',intro:'Формат разговора зависит от журналистской задачи, а не только от героя.',body:`<h3>Четыре рабочих типа</h3><ul><li><b>Информационное:</b> выяснить факты и объяснения по событию у эксперта, очевидца или участника.</li><li><b>Оперативное:</b> одни и те же вопросы нескольким людям по свежему событию; обычно это часть другого материала, а не самостоятельная публикация.</li><li><b>Интервью-расследование:</b> вместе с компетентным собеседником разобраться в событии, решении, конфликте или ответственности.</li><li><b>Интервью-портрет:</b> раскрыть человека, его опыт, характер, выборы и важный этап жизни.</li></ul><div class="int161Rule">Сначала сформулируйте: «После интервью читатель должен узнать / понять…». Только потом выбирайте героя и вопросы.</div>`,q:'Вы хотите показать, как человек пришёл в профессию, что его меняло и чего он боится. Какой тип ближе?',options:['Оперативное интервью','Интервью-портрет','Опрос нескольких людей'],correct:1,feedback:'Это портретная задача: в центре человек, его опыт, решения и внутренние изменения.'},
    {id:'guest',title:'Тип собеседника меняет тактику',time:'9–12 мин',intro:'Эксперт, медийный человек, чиновник, политик и обычный герой требуют разного ведения разговора.',body:`<h3>Не разговаривайте со всеми одинаково</h3><ul><li><b>Эксперт:</b> просите переводить профессиональный язык на понятный, отделяйте главное от деталей.</li><li><b>Медийный человек:</b> не застревайте в сценическом образе — ищите конкретный личный опыт и темы, где человек перестаёт отвечать заученно.</li><li><b>Чиновник:</b> не позволяйте разговору превращаться в отчёт; спрашивайте о результате, ответственности, сроках и том, что не получилось.</li><li><b>Политик:</b> особенно важны конкретика, проверка утверждений и возвращение к вопросу.</li><li><b>Герой события:</b> говорите проще, не давите профессиональными «добивками», помогайте восстановить конкретные сцены.</li></ul>`,q:'Эксперт отвечает длинно и профессиональными терминами. Что полезнее?',options:['Попросить объяснить тот же смысл простыми словами и выделить главное','Оставить всё как есть: эксперт лучше знает, что важно читателю','Сразу перейти к другой теме'],correct:0,feedback:'Задача журналиста — получить понятное объяснение и не превратить интервью в научный доклад.'},
    {id:'agreement',title:'Договориться и выбрать формат',time:'8–11 мин',intro:'Человек должен понимать, что это интервью и о какой теме вы хотите говорить.',body:`<h3>До встречи</h3><p>При договорённости обозначьте, что разговор предназначен для журналистского материала. Если интервью строится вокруг конкретного эпизода, конфликта или события в жизни человека, тему лучше проговорить заранее.</p><p>Личная встреча даёт невербальное общение и возможность видеть среду. Дистанционное интервью бывает синхронным — звонок / видеосвязь — и асинхронным, когда человек получает список вопросов и отвечает позже. Асинхронный формат удобен, но ответы чаще оказываются более «причёсанными» и хуже дают живые уточнения.</p><div class="int161Rule">Продумайте место, разрешения на съёмку / запись, шум и резервную запись. Надёжная техника тоже может подвести.</div>`,q:'Почему асинхронное интервью хуже подходит для живого глубокого разговора?',options:['У героя есть время подготовить и отредактировать ответы, а журналист не может сразу уточнять','Его нельзя публиковать в интернете','В нём запрещены открытые вопросы'],correct:0,feedback:'Главный минус — потеря живой реакции и возможности строить следующий вопрос из ответа здесь и сейчас.'},
    {id:'questioncraft',title:'Архитектура вопросов',time:'12–16 мин',intro:'Вопросы должны добывать информацию и одновременно управлять ходом разговора.',body:`<h3>Базовые различия</h3><p><b>Открытые</b> вопросы чаще дают развёрнутый ответ. <b>Закрытый</b> вопрос полезен, когда нужно получить ясное «да / нет» или собеседник уклоняется. <b>Непрямой</b> вопрос может мягче вводить чувствительную тему.</p><p>По функции вопросы бывают информационными и управляющими. Управляющие помогают открыть тему, плавно перейти в другой блок или вернуть собеседника, если он ушёл в сторону.</p><ul><li>короче — обычно лучше;</li><li>один вопрос — одна мысль;</li><li>не вкладывайте свой ответ в формулировку;</li><li>не спорьте вместо того, чтобы спрашивать;</li><li>строьте следующий вопрос на ответе собеседника;</li><li>просите доказательство, пример, сцену, цифру или источник.</li></ul><div class="int161Example"><b>Из реальной ученической работы</b><p>В интервью с танцовщицей разговор был собран крупными блоками: путь в танце → отношение к танцу → преподавание → страхи → будущее. Сильные вопросы появлялись из предыдущих ответов, а не только из заранее написанного списка.</p></div><div class="int161Example"><b>Ещё один реальный приём</b><p>В интервью с преподавателем английского журналист заранее обозначил три большие темы разговора. Это помогло удержать длинный материал и переходить от британской культуры к преподаванию и жизни за границей.</p></div>`,q:'Собеседник сказал: «Тогда был очень тяжёлый период». Какой вопрос сильнее?',options:['«Вам было плохо?»','«Что именно делало тот период тяжёлым?»','«Тяжёлый период был из-за работы и семьи?»'],correct:1,feedback:'Короткий открытый вопрос просит конкретизировать собственные слова героя и не подсказывает ответ.'},
    {id:'tricks',title:'Когда собеседник уходит от ответа',time:'10–14 мин',intro:'Уклонение часто выглядит как полноценный ответ. Задача журналиста — заметить подмену и вернуться к сути.',body:`<h3>Красные флаги</h3><ul><li><b>Смена темы:</b> вместо ответа начинается заранее подготовленная лекция.</li><li><b>Абстрактные слова:</b> «справедливость», «успех», «почти готово» без измеримого содержания.</li><li><b>Подмена причин:</b> вместо причины называют цель, повод или удобную связь между событиями.</li><li><b>Ложная альтернатива:</b> предлагают только два варианта, хотя их больше.</li><li><b>Обобщение:</b> вывод делают по одному примеру или ссылаются на безымянных «всех умных людей».</li><li><b>Переформулирование:</b> собеседник меняет ваш вопрос на удобный и отвечает уже на него.</li><li><b>«Вопрос недопустим»:</b> собеседник сам объявляет тему закрытой.</li></ul><div class="int161Rule">Рабочие контрприёмы: спокойно перебить, повторить вопрос другими словами, сфокусироваться на той части, от которой ушли, попросить назвать людей / цифры / доказательства и вернуть бремя доказательства утверждения собеседнику.</div>`,q:'На вопрос о причине провала герой долго объясняет, чего команда хотела добиться. Что произошло?',options:['Он ответил на вопрос о причине','Он подменил причину целью','Он использовал закрытый вопрос'],correct:1,feedback:'Рассказ о намерениях не объясняет, почему получился конкретный результат. Нужно вернуть разговор к причинам.'},
    {id:'during',title:'Во время разговора: слушать и замечать',time:'9–12 мин',intro:'Диктофон сохраняет слова, но не заменяет журналистское внимание.',body:`<h3>Отмечайте по ходу</h3><ul><li>новые факты и места, где нужен источник;</li><li>сильные фразы и формулировки;</li><li>противоречия и уходы от ответа;</li><li>темы, к которым нужно вернуться;</li><li>паузу, смех, смущение, жест, действие или деталь места — если это действительно важно для текстового интервью.</li></ul><div class="int161Rule">Репортажный элемент не придумывают. Если вы пишете, что герой смеётся, нервничает или замолкает, вы должны реально это наблюдать.</div><p>После разговора отдельно выпишите то, что надо проверить, и вопросы, которые стоит дозадать.</p>`,q:'Герой рассмеялся после вопроса, и это меняет смысл его следующей фразы. Можно ли отметить смех в текстовом интервью?',options:['Да, если журналист реально это наблюдал и деталь помогает понять разговор','Нет, в интервью можно публиковать только слова','Да, даже если журналист не уверен, потому что ремарки оживляют текст'],correct:0,feedback:'Наблюдаемая реакция может быть репортажным элементом текстового интервью, но её нельзя додумывать.'},
    {id:'publish',title:'Заголовок, лид, монтаж и согласование',time:'10–14 мин',intro:'Публикация — это отредактированный разговор, а не выгрузка расшифровки.',body:`<h3>Как упаковать текст</h3><p>Заголовок может строиться на яркой цитате героя, но нельзя искажать её смысл ради скандальности. Другой рабочий вариант — имя / роль героя + о чём он рассказывает.</p><p>Лид быстро объясняет, с кем вы разговаривали, о чём и по какому поводу. В текстовом интервью можно использовать наблюдения за местом и поведением героя, если они имеют значение.</p><p>Устную речь можно чистить от повторов и речевого мусора, но нельзя менять смысл. Если собеседник существенно меняет формулировку после разговора, это уже не должно незаметно превращаться в «точную цитату» первоначальной беседы.</p><div class="int161Rule">Если вы договорились о согласовании, заранее определите, что именно согласуется и в какой срок. Согласование ответов не должно превращаться в переписывание журналистских вопросов, заголовка и собственной фактуры автора.</div>`,q:'Что опаснее всего при цитатном заголовке?',options:['Использовать короткую яркую фразу героя','Искажать смысл сказанного ради более громкого заголовка','Указать имя героя рядом с цитатой'],correct:1,feedback:'Цитатный заголовок может быть ярким, но смысл слов собеседника должен оставаться верным.'}
  ];

  const guestTactics={expert:'Просите объяснять профессиональные вещи простым языком и отделять главное от специальных деталей.',star:'Не останавливайтесь на публичном образе. Ищите личный опыт, решения и темы, где человек отвечает не заученно.',official:'Контролируйте конкретику: что сделано, что нет, кто отвечает, сроки, результат и основания утверждений.',politician:'Особенно тщательно возвращайте к вопросу, просите доказательства и не принимайте общие формулировки за ответ.',hero:'Говорите просто и спокойно. Помогайте человеку вспоминать конкретные сцены, не превращая разговор в допрос.',other:'Опишите, почему этот человек нужен материалу, и подберите тактику под его роль в теме.'};
  const formatHints={personal:'Личная встреча: видно невербальную реакцию и среду; заранее проверьте место, доступ и запись.',sync:'Синхронно дистанционно: можно сразу уточнять ответы; проверьте связь и резервную запись.',async:'Асинхронно: удобно, но ответы чаще более подготовленные; заранее предусмотрите возможность дозадать уточнения.'};

  function renderLessonsHub(){
    const hub=document.getElementById('interviewCourse160');if(!hub||!hub.innerHTML)return;
    const progress=hub.querySelector('.int160Progress'),list=hub.querySelector('.int160List');if(!progress||!list)return;
    const done=lessons.filter(l=>I.v161Lessons[l.id]).length;
    progress.innerHTML=`<b>Матчасть: ${done} из ${lessons.length}</b><div class="meta" style="margin-top:5px">Методика: виды интервью → тип гостя → договорённость → вопросы → уловки → разговор → публикация.</div>`;
    list.innerHTML=lessons.map((l,i)=>`<button class="int160Card ${I.v161Lessons[l.id]?'done':''}" data-int161-lesson="${l.id}"><div class="row" style="align-items:flex-start;gap:9px"><span class="int160Num">${i+1}</span><span style="flex:1"><b>${safe(l.title)}</b><small>${safe(l.intro)} · ${safe(l.time)}</small></span><span class="int160Status ${I.v161Lessons[l.id]?'ok':''}">${I.v161Lessons[l.id]?'готово':'открыть'}</span></div></button>`).join('');
    const work=hub.querySelector('.int160Work p');if(work&&work.textContent.indexOf('вид интервью')<0)work.textContent=work.textContent+' Перед подготовкой определите вид интервью, тип собеседника и формат встречи.';
  }

  function openLesson(id){
    const l=lessons.find(x=>x.id===id);if(!l)return;const m=I.v161Micro[id];lessonScreen.dataset.lesson=id;
    lessonScreen.innerHTML=`<div class="eye">Интервью · матчасть MMT</div><div class="int161LessonHead"><div class="meta">${safe(l.time)}</div><h2>${safe(l.title)}</h2><p>${safe(l.intro)}</p></div><div class="int161Body">${l.body}</div><div class="int161Micro"><div class="meta">Быстрая проверка</div><h3>${safe(l.q)}</h3>${l.options.map((o,i)=>`<button class="int161Option ${m&&m.choice===i?(m.correct?'correct':'wrong'):''}" data-int161-option="${i}">${safe(o)}</button>`).join('')}${m?`<div class="int161Feedback">${safe(m.correct?l.feedback:'Пока нет. Вернитесь к принципу выше и попробуйте ещё раз.')}</div>`:''}</div><div class="int160Actions">${m?.correct?'<button class="btn" data-int161-complete>Завершить урок</button>':''}<button class="btn secondary" data-int161-hub>← К модулю</button></div>`;go('interviewLesson161');
  }

  function choice(label,key,value,current){return `<button type="button" class="int161Choice ${current===value?'active':''}" data-int161-choice="${key}" data-int161-value="${value}">${label}</button>`}
  function patchPrep(){
    const s=document.getElementById('interviewPrep160');if(!s||!s.innerHTML||s.querySelector('#int161PrepExtra'))return;
    const first=s.querySelector('.int160Section');if(!first)return;
    const x=document.createElement('div');x.id='int161PrepExtra';x.className='int160Section';
    x.innerHTML=`<h3>0. Формат и стратегия интервью</h3>
      <div class="int160Field"><label>Какой вид интервью вы готовите?</label><div class="int161ChoiceRow">${choice('Информационное','interviewType','info',I.prep.interviewType)}${choice('Оперативное','interviewType','operational',I.prep.interviewType)}${choice('Расследование','interviewType','investigation',I.prep.interviewType)}${choice('Портрет','interviewType','portrait',I.prep.interviewType)}</div><div class="int160Hint">Оперативное интервью обычно становится частью другого материала. Для большой самостоятельной работы чаще подходят портрет, расследование или развёрнутое информационное интервью.</div></div>
      <div class="int160Field"><label>К какому типу ближе ваш собеседник?</label><div class="int161ChoiceRow">${choice('Эксперт','guestType','expert',I.prep.guestType)}${choice('Медийный человек','guestType','star',I.prep.guestType)}${choice('Чиновник','guestType','official',I.prep.guestType)}${choice('Политик','guestType','politician',I.prep.guestType)}${choice('Герой события','guestType','hero',I.prep.guestType)}${choice('Другое','guestType','other',I.prep.guestType)}</div><div class="int161Tactic" data-int161-tactic>${safe(guestTactics[I.prep.guestType]||'Выберите тип собеседника — приложение покажет, на что обратить внимание в разговоре.')}</div></div>
      <div class="int160Field"><label>Как пройдёт интервью?</label><div class="int161ChoiceRow">${choice('Лично','format','personal',I.prep.format)}${choice('Звонок / видео','format','sync',I.prep.format)}${choice('Список вопросов','format','async',I.prep.format)}</div><div class="int161Tactic" data-int161-format-hint>${safe(formatHints[I.prep.format]||'Выберите формат разговора.')}</div></div>
      <label class="int160Check"><input type="checkbox" data-int161-prep-check="knowsInterview" ${I.prep.knowsInterview?'checked':''}>Собеседник знает, что это журналистское интервью для публикации.</label>
      <label class="int160Check"><input type="checkbox" data-int161-prep-check="knowsTopic" ${I.prep.knowsTopic?'checked':''}>Мы заранее обозначили основную тему / важный эпизод разговора.</label>
      <div class="int160Field"><label>О чём договорились: время, место, запись, съёмка, ограничения?</label><textarea class="textarea" data-int161-prep="agreement">${safe(I.prep.agreement||'')}</textarea></div>
      <div class="int160Field"><label>Какой резервный план записи?</label><textarea class="textarea" data-int161-prep="backup" placeholder="Второй диктофон / второй телефон / локальная запись звонка…">${safe(I.prep.backup||'')}</textarea></div>`;
    first.before(x);
  }

  function patchQuestions(){
    const s=document.getElementById('interviewQuestions160');if(!s||!s.innerHTML||s.querySelector('#int161QuestionsExtra'))return;
    const actions=s.querySelector('.int160Actions');if(!actions)return;
    const x=document.createElement('div');x.id='int161QuestionsExtra';x.className='int160Section';
    x.innerHTML=`<h3>3. Управление разговором</h3>
      <div class="int160Field"><label>Открывающий вопрос</label><textarea class="textarea" data-int161-q="opening" placeholder="Назовите тему и дайте герою войти в разговор">${safe(I.questions.opening||'')}</textarea></div>
      <div class="int160Field"><label>Переходы между блоками</label><textarea class="textarea" data-int161-q="transitions" placeholder="Какими фразами вы свяжете разные темы?">${safe(I.questions.transitions||'')}</textarea></div>
      <div class="int160Field"><label>Как вернёте героя, если он уйдёт от вопроса?</label><textarea class="textarea" data-int161-q="returnPlan" placeholder="Повторить вопрос иначе, сфокусироваться на пропущенной части, попросить конкретику…">${safe(I.questions.returnPlan||'')}</textarea></div>
      <div class="int160Field"><label>Какой закрытый вопрос оставите как запасной для ясного ответа?</label><textarea class="textarea" data-int161-q="closedFallback">${safe(I.questions.closedFallback||'')}</textarea></div>
      <div class="int160Field"><label>Есть ли чувствительная тема, которую лучше ввести непрямым вопросом?</label><textarea class="textarea" data-int161-q="indirect">${safe(I.questions.indirect||'')}</textarea></div>
      <div class="int160Field"><label>Запасные вопросы</label><textarea class="textarea" data-int161-q="backupQuestions" placeholder="То, что пригодится, если разговор пойдёт иначе или закончится один из блоков">${safe(I.questions.backupQuestions||'')}</textarea></div>
      <label class="int160Check"><input type="checkbox" data-int161-q-check="oneIdea" ${I.questions.oneIdea?'checked':''}>В каждом основном вопросе одна главная мысль, а не два-три вопроса сразу.</label>
      <label class="int160Check"><input type="checkbox" data-int161-q-check="neutral" ${I.questions.neutral?'checked':''}>Я не подсказываю желаемый ответ и не вкладываю в вопрос своё предположение.</label>
      <label class="int160Check"><input type="checkbox" data-int161-q-check="evidence" ${I.questions.evidence?'checked':''}>К важным утверждениям героя у меня подготовлены уточнения: «откуда это известно?», «какой пример?», «чем это подтверждается?».</label>
      <div class="int161Example"><b>Подсказка по реальным работам</b><p>Длинное интервью легче вести крупными тематическими блоками. В одном ученическом материале это были путь героя → отношение к профессии → преподавание → страхи → будущее; в другом — культура страны → преподавание → жизнь за границей.</p></div>`;
    actions.before(x);
  }

  function patchTalk(){
    const s=document.getElementById('interviewTalk160');if(!s||!s.innerHTML||s.querySelector('#int161TalkExtra'))return;
    const actions=s.querySelector('.int160Actions');if(!actions)return;
    const x=document.createElement('div');x.id='int161TalkExtra';x.className='int160Section';
    x.innerHTML=`<h3>4. Что происходило в самом разговоре</h3>
      <div class="int160Field"><label>Какие важные реакции, паузы, действия или детали места вы наблюдали?</label><textarea class="textarea" data-int161-talk="nonverbal" placeholder="Только то, что реально видели / слышали. Если ничего значимого не было — так и напишите.">${safe(I.talk.nonverbal||'')}</textarea><div class="int160Hint">Для текстового интервью это может стать репортажной ремаркой, если помогает понять героя или сцену.</div></div>
      <div class="int160Field"><label>Где собеседник ушёл от ответа, говорил общо или переформулировал вопрос?</label><textarea class="textarea" data-int161-talk="evasions">${safe(I.talk.evasions||'')}</textarea></div>
      <div class="int160Field"><label>Как вы вернули разговор к сути?</label><textarea class="textarea" data-int161-talk="returns">${safe(I.talk.returns||'')}</textarea></div>
      <div class="int160Field"><label>Какой сильный ответ появился благодаря уточняющему вопросу?</label><textarea class="textarea" data-int161-talk="followupWin">${safe(I.talk.followupWin||'')}</textarea></div>
      <label class="int160Check"><input type="checkbox" data-int161-talk-check="backupWorked" ${I.talk.backupWorked?'checked':''}>Основная запись сохранилась или у меня есть резервная запись / подробные заметки.</label>
      <div class="int161Note"><b>Если встретилась уловка:</b> не нужно «побеждать» человека. Нужно вернуть интервью к вопросу и получить проверяемую информацию.</div>`;
    actions.before(x);
  }

  const DB='mmt-dvi-interview-media-v1',STORE='media';
  function openDB(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE,{keyPath:'id'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
  async function putBlob(id,blob){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id,blob});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
  async function getBlob(id){if(!id)return null;const db=await openDB();return new Promise((resolve,reject)=>{const q=db.transaction(STORE,'readonly').objectStore(STORE).get(id);q.onsuccess=()=>{db.close();resolve(q.result?.blob||null)};q.onerror=()=>{db.close();reject(q.error)}})}
  async function delBlob(id){if(!id)return;const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
  const uid=()=>`int-photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

  async function renderInterviewPhoto(){
    const box=document.querySelector('[data-int161-photo-box]');if(!box)return;
    const p=I.media.heroPhoto;box.innerHTML='';if(!p?.id)return;
    const blob=await getBlob(p.id).catch(()=>null),url=blob?URL.createObjectURL(blob):'';
    box.innerHTML=`<div class="int161Photo">${url?`<img src="${url}" alt="Фото героя">`:'<div class="int161Warn">Файл фото не найден на этом устройстве.</div>'}<div class="int160Field"><label>Источник / автор фото</label><input class="input" data-int161-photo-source value="${safe(p.source||'')}" placeholder="Личный архив героя / фотограф / издание / источник"></div><button type="button" class="int161Delete" data-int161-photo-delete>Удалить фото</button></div>`;
  }

  function patchDraft(){
    const s=document.getElementById('interviewDraft160');if(!s||!s.innerHTML||s.querySelector('#int161DraftExtra'))return;
    const text=s.querySelector('[data-int160-draft="text"]');const section=text?.closest('.int160Section');if(!section)return;
    const lead=s.querySelector('[data-int160-draft="lead"]');const leadLabel=lead?.closest('.int160Field')?.querySelector('label');if(leadLabel)leadLabel.textContent='Лид: кто герой, о чём вы говорили и / или по какому поводу состоялось интервью?';
    const x=document.createElement('div');x.id='int161DraftExtra';x.className='int160Section';
    x.innerHTML=`<h3>Упаковка текстового интервью</h3>
      <div class="int160Field"><label>Как строится заголовок?</label><div class="int161ChoiceRow">${choice('Яркая цитата','headlineType','quote',I.draft.headlineType)}${choice('Имя / роль + темы','headlineType','descriptor',I.draft.headlineType)}</div><div class="int160Hint">Цитату можно сокращать или аккуратно перефразировать, но нельзя менять её смысл ради более громкого заголовка.</div></div>
      <div class="int160Field"><label>Какие репортажные элементы войдут в публикацию?</label><textarea class="textarea" data-int161-draft="reportage" placeholder="Место, действие, пауза, смех, жест, перемещение — только наблюдавшееся лично">${safe(I.draft.reportage||'')}</textarea></div>
      <div class="int160Field"><label>Согласование</label><select class="input" data-int161-draft="approval"><option value="none" ${I.draft.approval==='none'?'selected':''}>Не договаривались о согласовании</option><option value="planned" ${I.draft.approval==='planned'?'selected':''}>Договорились согласовать ответы позже</option><option value="sent" ${I.draft.approval==='sent'?'selected':''}>Отправлено на согласование</option><option value="approved" ${I.draft.approval==='approved'?'selected':''}>Ответы согласованы</option><option value="changes" ${I.draft.approval==='changes'?'selected':''}>Есть правки собеседника — нужно проверить смысл</option></select><div class="int160Hint">Согласование ответов не должно незаметно превращаться в переписывание вопросов, заголовка или вашей собственной фактуры.</div></div>
      <h3 style="margin-top:15px">Фото героя / обложка</h3><label class="int161Upload">＋ Загрузить фото<input type="file" accept="image/*" data-int161-photo-input></label><div class="int160Hint">Укажите автора / источник. В реальных ученических интервью встречаются и личные архивы героя, и отдельные фотографы, и внешние источники.</div><div data-int161-photo-box></div>
      <div id="int161SubmitStatus"></div>`;
    section.before(x);renderInterviewPhoto();
  }

  function syncExtras(){
    document.querySelectorAll('[data-int161-prep]').forEach(el=>I.prep[el.dataset.int161Prep]=el.value.trim());
    document.querySelectorAll('[data-int161-prep-check]').forEach(el=>I.prep[el.dataset.int161PrepCheck]=el.checked);
    document.querySelectorAll('[data-int161-q]').forEach(el=>I.questions[el.dataset.int161Q]=el.value.trim());
    document.querySelectorAll('[data-int161-q-check]').forEach(el=>I.questions[el.dataset.int161QCheck]=el.checked);
    document.querySelectorAll('[data-int161-talk]').forEach(el=>I.talk[el.dataset.int161Talk]=el.value.trim());
    document.querySelectorAll('[data-int161-talk-check]').forEach(el=>I.talk[el.dataset.int161TalkCheck]=el.checked);
    document.querySelectorAll('[data-int161-draft]').forEach(el=>I.draft[el.dataset.int161Draft]=el.value.trim());
    const ps=document.querySelector('[data-int161-photo-source]');if(ps&&I.media.heroPhoto)I.media.heroPhoto.source=ps.value.trim();
    persist();
  }

  function patchAll(){renderLessonsHub();patchPrep();patchQuestions();patchTalk();patchDraft()}

  document.addEventListener('click',e=>{
    const l=e.target.closest('[data-int161-lesson]');if(l){e.preventDefault();e.stopImmediatePropagation();openLesson(l.dataset.int161Lesson);return}
    const o=e.target.closest('[data-int161-option]');if(o){e.preventDefault();const id=lessonScreen.dataset.lesson,x=lessons.find(v=>v.id===id);if(!x)return;const choice=Number(o.dataset.int161Option);I.v161Micro[id]={choice,correct:choice===x.correct};persist();openLesson(id);return}
    if(e.target.closest('[data-int161-complete]')){e.preventDefault();const id=lessonScreen.dataset.lesson;if(!I.v161Micro[id]?.correct)return notify('Сначала выберите правильный ответ');I.v161Lessons[id]=true;persist();const hub=document.getElementById('interviewCourse160');if(hub){go('interviewCourse160');setTimeout(renderLessonsHub,0)}return}
    if(e.target.closest('[data-int161-hub]')){e.preventDefault();go('interviewCourse160');setTimeout(renderLessonsHub,0);return}
    const c=e.target.closest('[data-int161-choice]');if(c){e.preventDefault();const key=c.dataset.int161Choice,val=c.dataset.int161Value;if(key==='headlineType')I.draft[key]=val;else I.prep[key]=val;persist();document.querySelectorAll(`[data-int161-choice="${key}"]`).forEach(b=>b.classList.toggle('active',b.dataset.int161Value===val));if(key==='guestType'){const box=document.querySelector('[data-int161-tactic]');if(box)box.textContent=guestTactics[val]}if(key==='format'){const box=document.querySelector('[data-int161-format-hint]');if(box)box.textContent=formatHints[val]}return}
    if(e.target.closest('[data-int161-photo-delete]')){e.preventDefault();const id=I.media.heroPhoto?.id;if(id)delBlob(id).catch(()=>{});I.media.heroPhoto=null;persist();renderInterviewPhoto();return}
  },true);

  document.addEventListener('change',async e=>{
    if(e.target.matches('[data-int161-photo-input]')){const f=e.target.files?.[0];if(f&&f.type.startsWith('image/')){if(f.size>12*1024*1024){notify('Фото больше 12 МБ');return}if(I.media.heroPhoto?.id)await delBlob(I.media.heroPhoto.id).catch(()=>{});const id=uid();await putBlob(id,f);I.media.heroPhoto={id,name:f.name,source:''};persist();await renderInterviewPhoto()}e.target.value='';return}
    if(e.target.closest('[data-int161-prep],[data-int161-prep-check],[data-int161-q],[data-int161-q-check],[data-int161-talk],[data-int161-talk-check],[data-int161-draft],[data-int161-photo-source]'))syncExtras();
  });
  document.addEventListener('input',e=>{if(e.target.closest('[data-int161-prep],[data-int161-q],[data-int161-talk],[data-int161-draft],[data-int161-photo-source]'))syncExtras()});

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-int160-submit]');if(!b)return;syncExtras();const critical=[],warn=[];
    if(!I.prep.interviewType)critical.push('выберите вид интервью');
    if(!I.prep.guestType)critical.push('укажите тип собеседника');
    if(!I.prep.format)critical.push('укажите формат разговора');
    if(!I.prep.knowsInterview)critical.push('подтвердите, что собеседник понимает: это интервью для публикации');
    if(!I.prep.knowsTopic)warn.push('не отмечено, что основная тема была обозначена заранее');
    if(!I.questions.opening)warn.push('не подготовлен открывающий вопрос');
    if(!I.questions.returnPlan)warn.push('не продуман способ вернуть героя к вопросу при уклонении');
    if(!I.questions.oneIdea||!I.questions.neutral)warn.push('не завершена самопроверка формулировок вопросов');
    if(I.media.heroPhoto?.id&&!(I.media.heroPhoto.source||'').trim())critical.push('у загруженного фото нужен источник / автор');
    const status=document.getElementById('int161SubmitStatus');
    if(critical.length){e.preventDefault();e.stopImmediatePropagation();if(status)status.innerHTML=`<div class="int161Submit bad"><b>Пока нельзя сохранять для разбора:</b><br>• ${critical.map(safe).join('<br>• ')}</div>`;notify('Закройте обязательные элементы подготовки интервью');return}
    if(status&&warn.length)status.innerHTML=`<div class="int161Submit warn"><b>Перед сдачей проверьте:</b><br>• ${warn.map(safe).join('<br>• ')}</div>`;
  },true);

  const obs=new MutationObserver(()=>requestAnimationFrame(patchAll));obs.observe(main,{subtree:true,childList:true});setTimeout(patchAll,0);
})();