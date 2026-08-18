/* MMT ДВИ v0.15.0 — text reportage module */
(function setupV015(){
  const main=document.querySelector('main');
  if(!main)return;

  const ver=document.querySelector('.ver');
  if(ver)ver.textContent='v0.15.0';
  document.title='MMT ДВИ — v0.15.0';

  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.15] persist failed',e)}};
  const notify=msg=>{if(typeof toast==='function')toast(msg)};
  const go=id=>{if(typeof window.go==='function')window.go(id)};

  state.v150Reportage=state.v150Reportage&&typeof state.v150Reportage==='object'?state.v150Reportage:{};
  const R=state.v150Reportage;
  R.lessons=R.lessons||{};
  R.micro=R.micro||{};
  R.prep=R.prep||{};
  R.field=R.field||{};
  R.draft=R.draft||{};
  R.submitted=!!R.submitted;

  const css=document.createElement('style');
  css.id='mmt-v015-css';
  css.textContent=`
    .rep150Hero{background:#0c0c0c;color:#fff;border-radius:22px;padding:18px;margin:10px 0}.rep150Hero .meta{color:#bbb}.rep150Hero h2{font-size:29px;margin:5px 0 7px}.rep150Hero p{color:#d4d4d4;font-size:13px;line-height:1.5}.rep150HeroTags{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.rep150HeroTags span{font-size:10px;border:1px solid #ffffff28;background:#ffffff12;border-radius:999px;padding:6px 8px}
    .rep150Progress{background:var(--os);border-radius:17px;padding:13px;margin:10px 0}.rep150Progress b{display:block;margin-bottom:6px}.rep150ProgressLine{font-size:12px;line-height:1.45;color:var(--soft)}
    .rep150List{display:grid;gap:8px;margin:10px 0}.rep150Card{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;text-align:left;color:var(--ink);width:100%}.rep150Card.done{border-color:#9cbe9d}.rep150Card b{font-size:14px;display:block}.rep150Card small{display:block;color:var(--soft);font-size:11px;line-height:1.4;margin-top:4px}.rep150Num{width:29px;height:29px;border-radius:9px;background:var(--muted);display:grid;place-items:center;font-size:11px;font-weight:800;flex:0 0 auto}.rep150Status{font-size:9px;border-radius:999px;background:var(--muted);padding:5px 7px;white-space:nowrap}.rep150Status.ok{background:#e8f3e8}.rep150Status.work{background:var(--os)}
    .rep150Work{background:#fff;border:2px solid var(--o);border-radius:19px;padding:14px;margin:13px 0}.rep150Work h3{font-size:20px;margin:4px 0 7px}.rep150Work p{font-size:12px;line-height:1.45;color:var(--soft)}.rep150Work .btn{margin:8px 0 0}
    .rep150LessonHead{background:var(--os);border-radius:19px;padding:15px;margin:10px 0}.rep150LessonHead h2{font-size:25px;margin:4px 0 7px}.rep150Text{background:#fff;border:1px solid var(--line);border-radius:18px;padding:15px;margin:9px 0}.rep150Text h3{font-size:18px;margin:0 0 8px}.rep150Text p,.rep150Text li{font-size:13px;line-height:1.53}.rep150Text ul{padding-left:20px}.rep150Rule{border-left:4px solid var(--o);padding:9px 12px;background:var(--os);border-radius:0 13px 13px 0;margin:10px 0;font-size:12px;line-height:1.45}.rep150Example{background:var(--muted);border-radius:14px;padding:12px;margin:10px 0;font-size:12px;line-height:1.45}.rep150Micro{background:#fff;border:2px solid var(--o);border-radius:18px;padding:14px;margin:12px 0}.rep150Option{width:100%;background:#fff;border:1px solid var(--line);border-radius:13px;padding:11px;margin:5px 0;text-align:left;font-size:12px;line-height:1.4;color:var(--ink)}.rep150Option.correct{border-color:#6aa46c;background:#eef7ee}.rep150Option.wrong{border-color:#c36e6e;background:#faeeee}.rep150Feedback{font-size:12px;line-height:1.45;margin-top:8px;padding:9px 10px;border-radius:12px;background:var(--muted)}
    .rep150StageHero{background:#0c0c0c;color:#fff;border-radius:20px;padding:16px;margin:10px 0}.rep150StageHero .meta{color:#bbb}.rep150StageHero h2{font-size:25px;margin:5px 0}.rep150StageHero p{font-size:12px;line-height:1.45;color:#d0d0d0}.rep150Section{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:10px 0}.rep150Section h3{font-size:18px;margin:0 0 9px}.rep150Field{margin:12px 0}.rep150Field label{display:block;font-size:11px;font-weight:800;margin-bottom:5px}.rep150Field .input,.rep150Field .textarea{width:100%;box-sizing:border-box}.rep150Field .textarea{min-height:94px}.rep150Field.long .textarea{min-height:180px}.rep150Hint{font-size:10px;color:var(--soft);line-height:1.4;margin-top:5px}.rep150Check{display:flex;gap:8px;align-items:flex-start;font-size:11px;line-height:1.4;margin:9px 0}.rep150Check input{margin-top:2px;accent-color:var(--o)}.rep150Actions{display:grid;gap:8px;margin:13px 0}.rep150Actions .btn{margin:0}.rep150Gate{background:var(--os);border-radius:14px;padding:11px;font-size:11px;line-height:1.45;margin:10px 0}.rep150Saved{text-align:center;color:var(--soft);font-size:10px;margin-top:7px}
    .rep150Submitted{background:#eaf4ea;border:1px solid #aac8aa;border-radius:16px;padding:13px;margin:11px 0}.rep150Submitted b{display:block;margin-bottom:4px}.rep150Submitted p{font-size:11px;line-height:1.45;margin:0;color:var(--soft)}
    .route135Module.rep150Open{cursor:pointer}.route135Module.rep150Open .tag{background:var(--o);color:#0c0c0c}.rep150NewsNext{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;margin:12px 0}.rep150NewsNext h3{font-size:18px;margin:3px 0 6px}.rep150NewsNext p{font-size:12px;line-height:1.45;color:var(--soft)}.rep150NewsNext .btn{margin:8px 0 0}
  `;
  document.head.appendChild(css);

  function ensureScreen(id){
    let s=document.getElementById(id);
    if(!s){s=document.createElement('section');s.id=id;s.className='screen';main.appendChild(s)}
    return s;
  }

  const hub=ensureScreen('reportCourse150');
  const lessonScreen=ensureScreen('reportLesson150');
  const prepScreen=ensureScreen('reportPrep150');
  const fieldScreen=ensureScreen('reportField150');
  const draftScreen=ensureScreen('reportDraft150');

  const lessons=[
    {
      id:'difference',title:'Что такое текстовый репортаж',time:'7–10 мин',
      intro:'Репортаж начинается не с красивого текста, а с присутствия журналиста на реальном событии.',
      body:`<h3>Главное отличие от новости</h3><p>Новость прежде всего быстро сообщает, <b>что произошло</b>. Репортаж тоже держится на фактах, но позволяет читателю <b>увидеть событие через наблюдение журналиста</b>: сцены, действия людей, конкретные детали, живые реплики и развитие происходящего.</p><div class="rep150Rule"><b>Для учебного репортажа MMT обязательна реальная репортёрская работа:</b> побывать на месте, наблюдать своими глазами и поговорить хотя бы с одним человеком, который связан с событием.</div><p>Эффект присутствия не означает художественный вымысел. Нельзя додумывать погоду, эмоции, жесты, запахи, реплики или детали, которых журналист не видел и не слышал.</p>`,
      q:'Что из этого можно считать основой репортажа?',options:['Пересказать пресс-релиз яркими словами.','Побывать на событии, наблюдать происходящее, поговорить с людьми и затем собрать текст.','Придумать выразительное начало, а факты добавить потом.'],correct:1,feedback:'Да. Сначала репортёрская работа, затем текст. Без присутствия на событии это уже другой формат.'
    },
    {
      id:'before',title:'До события: план выхода',time:'8–12 мин',
      intro:'Хороший репортаж начинается ещё до того, как журналист пришёл на площадку.',
      body:`<h3>Вы должны понимать, зачем идёте</h3><p>До выхода зафиксируйте: что это за событие, где и когда оно проходит, как вы попадёте внутрь, кто там будет и что именно вам важно проверить собственным наблюдением.</p><ul><li><b>Люди:</b> кто организует, кто участвует, кто может быть героем или комментатором.</li><li><b>Наблюдение:</b> какие моменты нельзя восстановить по телефону после события.</li><li><b>Вопросы:</b> что нужно спросить, чтобы получить не реакцию «понравилось / не понравилось», а фактуру.</li><li><b>Проверка:</b> какие цифры, названия и утверждения потребуют дополнительного подтверждения.</li></ul><div class="rep150Rule">План нужен не для того, чтобы заранее придумать вывод. Он нужен, чтобы не вернуться с события без материала.</div>`,
      q:'Что важнее всего определить до выхода?',options:['Какой будет последний абзац текста.','Кого нужно увидеть и спросить, какие сцены и факты нужно собрать.','Сколько метафор использовать.'],correct:1,feedback:'Верно. Репортаж нельзя написать качественно, если на месте вы не собрали людей, сцены, детали и проверяемую фактуру.'
    },
    {
      id:'field',title:'На месте: что собирать',time:'10–14 мин',
      intro:'Телефон с диктофоном полезен, но он не заменяет глаза журналиста.',
      body:`<h3>Четыре корзины материала</h3><ul><li><b>Событие:</b> что происходит и как меняется ситуация от начала к концу.</li><li><b>Наблюдение:</b> конкретные действия, детали пространства, предметы, реакции, которые вы действительно видели.</li><li><b>Люди:</b> точные реплики и комментарии участников, организаторов, очевидцев, экспертов — в зависимости от темы.</li><li><b>Проверяемые факты:</b> цифры, документы, результаты, имена, должности, названия.</li></ul><div class="rep150Rule"><b>Записывайте факт отдельно от собственного впечатления.</b> «В зале 30 свободных мест» — наблюдение. «Людям неинтересно» — уже вывод, который нужно доказать.</div><p>Если берёте прямую цитату, сохраните её точно. Если фразу приходится сильно переписывать, лучше использовать косвенную речь.</p>`,
      q:'Какая запись из блокнота безопаснее для репортажа?',options:['Публика явно скучала.','Через десять минут после начала в последних трёх рядах оставалось около 30 свободных мест.','Мероприятие оказалось провальным.'],correct:1,feedback:'Да. Это наблюдаемая деталь. Два других варианта — оценки, для которых нужны дополнительные основания.'
    },
    {
      id:'write',title:'После события: собрать текст',time:'10–15 мин',
      intro:'Черновик строится из собранного материала, а не из заранее придуманной картинки.',
      body:`<h3>Рабочая логика текста</h3><p>Не существует одной обязательной схемы репортажа, но в учебной работе нам нужны четыре вещи: <b>понятное событие, развитие, люди и наблюдение журналиста</b>.</p><p>Начать можно с сильной реальной сцены или действия, если она действительно помогает войти в событие. Затем читателю быстро нужно объяснить, где он находится, что происходит и почему это важно. Дальше чередуются сцены, факты, комментарии и переходы между этапами события.</p><div class="rep150Rule">Деталь работает только тогда, когда помогает понять событие или человека. Не превращайте текст в каталог цветов, звуков и запахов ради «атмосферы».</div><p>В конце должен быть не искусственный моральный вывод, а естественное завершение: итог события, последняя значимая сцена, решение, результат или изменение ситуации.</p>`,
      q:'Что лучше сделать после возвращения с события?',options:['Сначала разобрать заметки и понять, какие сцены, факты и комментарии действительно работают на историю.','Сразу добавить художественные детали, чтобы текст был живее.','Удалить факты и оставить только впечатления.'],correct:0,feedback:'Верно. Сначала разбираем собранный материал и только потом строим из него историю.'
    }
  ];

  function lessonCount(){return lessons.filter(l=>R.lessons[l.id]).length}
  function stage(){
    if(R.submitted)return{title:'Работа готова к редакторскому разбору',tag:'готово'};
    if((R.draft.text||'').trim())return{title:'Есть черновик репортажа',tag:'черновик'};
    if((R.field.whatHappened||'').trim())return{title:'Материал с события собран',tag:'заметки'};
    if((R.prep.eventName||'').trim())return{title:'План выхода начат',tag:'в работе'};
    return{title:'Начните с реального события',tag:'старт'};
  }

  function renderHub(){
    const s=stage();
    hub.innerHTML=`<div class="eye">Общая база · практика</div>
      <div class="rep150Hero"><div class="meta">Следующий формат после новостей</div><h2>Текстовый репортаж</h2><p>Побывать на реальном событии, собрать сцены, детали, людей и факты — и только после этого написать материал.</p><div class="rep150HeroTags"><span>реальное событие</span><span>наблюдение</span><span>люди</span><span>факты</span></div></div>
      <div class="rep150Progress"><b>Матчасть: ${lessonCount()} из ${lessons.length}</b><div class="rep150ProgressLine">Не нужно проходить всё за один раз. Но перед своим первым выходом полезно открыть хотя бы уроки «До события» и «На месте».</div></div>
      <div class="rep150List">${lessons.map((l,i)=>`<button class="rep150Card ${R.lessons[l.id]?'done':''}" data-rep150-lesson="${l.id}"><div class="row" style="align-items:flex-start;gap:9px"><span class="rep150Num">${i+1}</span><span style="flex:1"><b>${safe(l.title)}</b><small>${safe(l.intro)} · ${safe(l.time)}</small></span><span class="rep150Status ${R.lessons[l.id]?'ok':''}">${R.lessons[l.id]?'готово':'открыть'}</span></div></button>`).join('')}</div>
      <div class="rep150Work"><div class="meta">Практическая работа</div><h3>Мой репортаж</h3><p>${safe(s.title)}. Здесь мы разделяем работу на три шага: план выхода → заметки с места → собственный черновик.</p><button class="btn" data-rep150-open-work>${R.submitted?'Открыть работу':'Продолжить работу'} →</button></div>
      <div class="rep150Actions"><button class="btn secondary" data-rep150-route>← К моему маршруту</button></div>`;
  }

  function openLesson(id){
    const l=lessons.find(x=>x.id===id);if(!l)return;
    const micro=R.micro[id];
    lessonScreen.dataset.lesson=id;
    lessonScreen.innerHTML=`<div class="eye">Текстовый репортаж · матчасть</div><div class="rep150LessonHead"><div class="meta">${safe(l.time)}</div><h2>${safe(l.title)}</h2><p class="sub">${safe(l.intro)}</p></div>
      <div class="rep150Text">${l.body}</div>
      <div class="rep150Micro"><div class="meta">Быстрая проверка</div><h3>${safe(l.q)}</h3>${l.options.map((o,i)=>`<button class="rep150Option ${micro&&micro.choice===i?(micro.correct?'correct':'wrong'):''}" data-rep150-micro="${i}">${safe(o)}</button>`).join('')}${micro?`<div class="rep150Feedback">${safe(micro.correct?l.feedback:'Пока нет. Вернитесь к правилу выше и выберите вариант, который опирается на реальную репортёрскую работу.')}</div>`:''}</div>
      <div class="rep150Actions">${micro?.correct?'<button class="btn" data-rep150-complete>Завершить урок</button>':''}<button class="btn secondary" data-rep150-hub>← К модулю</button></div>`;
    go('reportLesson150');
  }

  function prepVal(k){return safe(R.prep[k]||'')}
  function fieldVal(k){return safe(R.field[k]||'')}
  function draftVal(k){return safe(R.draft[k]||'')}

  function renderPrep(){
    prepScreen.innerHTML=`<div class="eye">Текстовый репортаж · шаг 1 из 3</div><div class="rep150StageHero"><div class="meta">До события</div><h2>План выхода</h2><p>Не придумываем будущий текст. Фиксируем, куда вы идёте, кого нужно найти и что нельзя упустить на месте.</p></div>
      <div class="rep150Section"><h3>1. Событие и доступ</h3>
        <div class="rep150Field"><label>На какое реальное событие вы идёте?</label><input class="input" data-rep150-prep="eventName" value="${prepVal('eventName')}" placeholder="Например: открытая лекция, матч, фестиваль, заседание, выставка"></div>
        <div class="rep150Field"><label>Где это будет?</label><input class="input" data-rep150-prep="place" value="${prepVal('place')}" placeholder="Площадка и город"></div>
        <div class="rep150Field"><label>Когда?</label><input class="input" data-rep150-prep="dateTime" value="${prepVal('dateTime')}" placeholder="Дата и время"></div>
        <div class="rep150Field"><label>Как вы попадёте на событие?</label><textarea class="textarea" data-rep150-prep="access" placeholder="Билет, аккредитация, свободный вход, приглашение…">${prepVal('access')}</textarea><div class="rep150Hint">Если доступ неясен, это нужно решить до выхода.</div></div>
      </div>
      <div class="rep150Section"><h3>2. Зачем вы туда идёте</h3>
        <div class="rep150Field"><label>Что в этом событии нужно увидеть и понять своими глазами?</label><textarea class="textarea" data-rep150-prep="goal" placeholder="Не будущий вывод, а репортёрская задача">${prepVal('goal')}</textarea></div>
        <div class="rep150Field"><label>Кого нужно найти и с кем поговорить?</label><textarea class="textarea" data-rep150-prep="people" placeholder="Участник, организатор, герой, очевидец, эксперт — по ситуации">${prepVal('people')}</textarea></div>
        <div class="rep150Field"><label>Какие вопросы вы хотите задать?</label><textarea class="textarea" data-rep150-prep="questions" placeholder="Короткий список вопросов">${prepVal('questions')}</textarea></div>
        <div class="rep150Field"><label>Какие сцены или моменты важно не пропустить?</label><textarea class="textarea" data-rep150-prep="observations" placeholder="Начало, ключевой момент, реакция людей, итог…">${prepVal('observations')}</textarea></div>
        <div class="rep150Field"><label>Что, возможно, придётся дополнительно проверить?</label><textarea class="textarea" data-rep150-prep="verify" placeholder="Цифры, имя, должность, документ, результат…">${prepVal('verify')}</textarea></div>
      </div>
      <div class="rep150Section"><h3>Перед выходом</h3>
        <label class="rep150Check"><input type="checkbox" data-rep150-prep-check="real" ${R.prep.real?'checked':''}>Это реальное событие, а не придуманная учебная ситуация.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-prep-check="attend" ${R.prep.attend?'checked':''}>Я действительно собираюсь присутствовать на нём лично.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-prep-check="talk" ${R.prep.talk?'checked':''}>У меня есть план, с кем попробовать поговорить на месте.</label>
      </div>
      <div class="rep150Actions"><button class="btn" data-rep150-save-prep>Сохранить план выхода</button><button class="btn secondary" data-rep150-to-field>Я уже побывал на событии →</button><button class="btn secondary" data-rep150-hub>← К модулю</button></div><div class="rep150Saved">План сохраняется на этом устройстве.</div>`;
    go('reportPrep150');
  }

  function collectPrep(){
    prepScreen.querySelectorAll('[data-rep150-prep]').forEach(el=>R.prep[el.dataset.rep150Prep]=el.value.trim());
    prepScreen.querySelectorAll('[data-rep150-prep-check]').forEach(el=>R.prep[el.dataset.rep150PrepCheck]=el.checked);
    R.updatedAt=new Date().toISOString();persist();patchRoute();return R.prep;
  }

  function prepReady(p){return !!(p.eventName&&p.place&&p.dateTime&&p.goal&&p.people&&p.real&&p.attend)}

  function renderField(){
    fieldScreen.innerHTML=`<div class="eye">Текстовый репортаж · шаг 2 из 3</div><div class="rep150StageHero"><div class="meta">После события</div><h2>Разберите полевые заметки</h2><p>Сейчас важнее сохранить фактуру, чем писать красиво. Записывайте только то, что реально видели, слышали и проверили.</p></div>
      <div class="rep150Section"><h3>1. Что произошло</h3>
        <div class="rep150Field"><label>Что произошло от начала до конца?</label><textarea class="textarea" data-rep150-field="whatHappened" placeholder="Короткая хронология события">${fieldVal('whatHappened')}</textarea></div>
        <div class="rep150Field"><label>Какая реальная сцена сильнее всего вводит в событие?</label><textarea class="textarea" data-rep150-field="openingScene" placeholder="Что именно вы увидели или услышали">${fieldVal('openingScene')}</textarea></div>
        <div class="rep150Field"><label>Какие конкретные детали вы заметили?</label><textarea class="textarea" data-rep150-field="details" placeholder="Действия, предметы, пространство, реакция — без додумывания">${fieldVal('details')}</textarea></div>
      </div>
      <div class="rep150Section"><h3>2. Люди и речь</h3>
        <div class="rep150Field"><label>С кем вы поговорили и почему этот человек важен для истории?</label><textarea class="textarea" data-rep150-field="peopleMet" placeholder="Имя/роль + отношение к событию">${fieldVal('peopleMet')}</textarea></div>
        <div class="rep150Field"><label>Точные реплики или комментарии</label><textarea class="textarea" data-rep150-field="quotes" placeholder="Не улучшайте смысл сказанного">${fieldVal('quotes')}</textarea></div>
      </div>
      <div class="rep150Section"><h3>3. Факты и итог</h3>
        <div class="rep150Field"><label>Какие факты, цифры, результаты или документы вы собрали?</label><textarea class="textarea" data-rep150-field="facts" placeholder="То, что можно проверить">${fieldVal('facts')}</textarea></div>
        <div class="rep150Field"><label>Чем событие закончилось или что изменилось к финалу?</label><textarea class="textarea" data-rep150-field="ending" placeholder="Итог, решение, результат, последняя значимая сцена">${fieldVal('ending')}</textarea></div>
        <div class="rep150Field"><label>Что ещё нужно проверить перед публикацией?</label><textarea class="textarea" data-rep150-field="verify" placeholder="Неясные имена, цифры, спорные утверждения…">${fieldVal('verify')}</textarea></div>
      </div>
      <div class="rep150Section"><h3>Подтвердите способ работы</h3>
        <label class="rep150Check"><input type="checkbox" data-rep150-field-check="wasThere" ${R.field.wasThere?'checked':''}>Я лично присутствовал(а) на событии.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-field-check="talked" ${R.field.talked?'checked':''}>Я разговаривал(а) хотя бы с одним человеком, связанным с событием.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-field-check="noInvent" ${R.field.noInvent?'checked':''}>Я не добавлял(а) в заметки деталей и реплик, которых не видел(а) и не слышал(а).</label>
      </div>
      <div class="rep150Actions"><button class="btn" data-rep150-save-field>Сохранить полевые заметки</button><button class="btn secondary" data-rep150-to-draft>Перейти к черновику →</button><button class="btn secondary" data-rep150-to-prep>← К плану выхода</button></div><div class="rep150Saved">Полевые заметки сохраняются на этом устройстве.</div>`;
    go('reportField150');
  }

  function collectField(){
    fieldScreen.querySelectorAll('[data-rep150-field]').forEach(el=>R.field[el.dataset.rep150Field]=el.value.trim());
    fieldScreen.querySelectorAll('[data-rep150-field-check]').forEach(el=>R.field[el.dataset.rep150FieldCheck]=el.checked);
    R.updatedAt=new Date().toISOString();persist();patchRoute();return R.field;
  }

  function fieldReady(f){return !!(f.whatHappened&&f.openingScene&&f.details&&f.peopleMet&&f.facts&&f.ending&&f.wasThere&&f.talked&&f.noInvent)}

  function renderDraft(){
    draftScreen.innerHTML=`<div class="eye">Текстовый репортаж · шаг 3 из 3</div><div class="rep150StageHero"><div class="meta">Черновик</div><h2>Соберите репортаж</h2><p>Теперь можно писать. Опирайтесь на собственные заметки: сцены, факты, людей и развитие события.</p></div>
      ${R.submitted?'<div class="rep150Submitted"><b>Черновик сохранён для редакторского разбора</b><p>Это пока не означает «Принято». В этой версии модуля мы фиксируем работу и самопроверку; смысловой AI-разбор репортажа подключим отдельно после калибровки методики.</p></div>':''}
      <div class="rep150Section"><h3>Текст</h3>
        <div class="rep150Field"><label>Рабочий заголовок</label><input class="input" data-rep150-draft="title" value="${draftVal('title')}" placeholder="Без обязанности придумывать игру слов"></div>
        <div class="rep150Field long"><label>Черновик репортажа</label><textarea class="textarea" data-rep150-draft="text" placeholder="Напишите материал целиком. Не вставляйте детали, которых нет в ваших полевых заметках.">${draftVal('text')}</textarea><div class="rep150Hint">Жёсткого объёма в тренажёре нет. Важнее, чтобы текст был собран из реальной репортёрской работы.</div></div>
      </div>
      <div class="rep150Section"><h3>Самопроверка перед сдачей</h3>
        <label class="rep150Check"><input type="checkbox" data-rep150-draft-check="eventClear" ${R.draft.eventClear?'checked':''}>Читателю понятно, что это за событие, где и когда оно происходит.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-draft-check="scene" ${R.draft.scene?'checked':''}>В тексте есть конкретные наблюдаемые сцены и детали, а не только общие слова.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-draft-check="people" ${R.draft.people?'checked':''}>Люди в тексте добавляют фактуру: действия, объяснения, комментарии или точные реплики.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-draft-check="facts" ${R.draft.facts?'checked':''}>Факты, цифры, имена и должности проверены настолько, насколько это возможно.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-draft-check="noInvent" ${R.draft.noInvent?'checked':''}>Я не придумал(а) атмосферу, эмоции, действия или цитаты ради красивого текста.</label>
        <label class="rep150Check"><input type="checkbox" data-rep150-draft-check="ending" ${R.draft.ending?'checked':''}>У текста есть естественное завершение события, а не искусственная мораль.</label>
      </div>
      <div class="rep150Actions"><button class="btn" data-rep150-save-draft>Сохранить черновик</button><button class="btn secondary" data-rep150-submit>Сохранить для редакторского разбора</button><button class="btn secondary" data-rep150-to-field>← К полевым заметкам</button></div><div class="rep150Saved">Черновик сохраняется локально на этом устройстве.</div>`;
    go('reportDraft150');
  }

  function collectDraft(){
    draftScreen.querySelectorAll('[data-rep150-draft]').forEach(el=>R.draft[el.dataset.rep150Draft]=el.value.trim());
    draftScreen.querySelectorAll('[data-rep150-draft-check]').forEach(el=>R.draft[el.dataset.rep150DraftCheck]=el.checked);
    R.updatedAt=new Date().toISOString();persist();patchRoute();return R.draft;
  }

  function draftReady(d){
    const checks=['eventClear','scene','people','facts','noInvent','ending'].filter(k=>d[k]).length;
    return !!(d.title&&d.text&&d.text.length>=250&&checks===6);
  }

  function openWork(){
    if((R.draft.text||'').trim()||R.submitted){renderDraft();return}
    if((R.field.whatHappened||'').trim()){renderField();return}
    renderPrep();
  }

  function patchRoute(){
    const route=document.getElementById('myRoute');if(!route)return;
    [...route.querySelectorAll('.route135Module')].forEach(card=>{
      const title=card.querySelector('b')?.textContent?.trim();
      if(title!=='Текстовый репортаж')return;
      card.classList.add('rep150Open');
      card.dataset.rep150Open='1';
      const tag=card.querySelector('.tag');
      if(tag){const st=stage();tag.textContent=st.tag;tag.title=st.title}
    });
  }

  function patchNewsHub(){
    const n=document.getElementById('newsCourse136');if(!n||n.querySelector('#rep150NewsNext'))return;
    const box=document.createElement('div');box.id='rep150NewsNext';box.className='rep150NewsNext';
    box.innerHTML='<div class="meta">Следующий практический формат</div><h3>Текстовый репортаж</h3><p>После новостей идём на реальное событие: планируем выход, наблюдаем, разговариваем с людьми и пишем материал из собственных заметок.</p><button class="btn secondary" data-rep150-open>Открыть модуль →</button>';
    n.appendChild(box);
  }

  document.addEventListener('input',e=>{
    const p=e.target.closest('[data-rep150-prep]');if(p){R.prep[p.dataset.rep150Prep]=p.value;R.updatedAt=new Date().toISOString();persist();return}
    const f=e.target.closest('[data-rep150-field]');if(f){R.field[f.dataset.rep150Field]=f.value;R.updatedAt=new Date().toISOString();persist();return}
    const d=e.target.closest('[data-rep150-draft]');if(d){R.draft[d.dataset.rep150Draft]=d.value;R.submitted=false;R.updatedAt=new Date().toISOString();persist();return}
  });

  document.addEventListener('change',e=>{
    const p=e.target.closest('[data-rep150-prep-check]');if(p){R.prep[p.dataset.rep150PrepCheck]=p.checked;persist();return}
    const f=e.target.closest('[data-rep150-field-check]');if(f){R.field[f.dataset.rep150FieldCheck]=f.checked;persist();return}
    const d=e.target.closest('[data-rep150-draft-check]');if(d){R.draft[d.dataset.rep150DraftCheck]=d.checked;R.submitted=false;persist();return}
  });

  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-rep150-open],[data-rep150-open-work],[data-rep150-open="1"]');
    if(open){e.preventDefault();if(open.matches('[data-rep150-open-work]'))openWork();else{renderHub();go('reportCourse150')}return}
    const routeCard=e.target.closest('[data-rep150-open="1"]');if(routeCard){e.preventDefault();renderHub();go('reportCourse150');return}
    const lesson=e.target.closest('[data-rep150-lesson]');if(lesson){e.preventDefault();openLesson(lesson.dataset.rep150Lesson);return}
    const micro=e.target.closest('[data-rep150-micro]');if(micro){e.preventDefault();const id=lessonScreen.dataset.lesson,l=lessons.find(x=>x.id===id);if(!l)return;const choice=Number(micro.dataset.rep150Micro);R.micro[id]={choice,correct:choice===l.correct};persist();openLesson(id);return}
    if(e.target.closest('[data-rep150-complete]')){e.preventDefault();const id=lessonScreen.dataset.lesson;if(!R.micro[id]?.correct){notify('Сначала выберите правильный ответ');return}R.lessons[id]=true;persist();renderHub();go('reportCourse150');patchRoute();return}
    if(e.target.closest('[data-rep150-hub]')){e.preventDefault();renderHub();go('reportCourse150');return}
    if(e.target.closest('[data-rep150-route]')){e.preventDefault();if(window.MMT_ROUTE_ENGINE?.sync)window.MMT_ROUTE_ENGINE.sync('reportage');go('myRoute');setTimeout(patchRoute,0);return}
    if(e.target.closest('[data-rep150-save-prep]')){e.preventDefault();collectPrep();notify('План выхода сохранён');return}
    if(e.target.closest('[data-rep150-to-field]')){e.preventDefault();if(prepScreen.classList.contains('active')){const p=collectPrep();if(!prepReady(p)){notify('Сначала заполните событие, место, время, задачу и людей — и подтвердите личное присутствие');return}}renderField();return}
    if(e.target.closest('[data-rep150-to-prep]')){e.preventDefault();renderPrep();return}
    if(e.target.closest('[data-rep150-save-field]')){e.preventDefault();collectField();notify('Полевые заметки сохранены');return}
    if(e.target.closest('[data-rep150-to-draft]')){e.preventDefault();if(fieldScreen.classList.contains('active')){const f=collectField();if(!fieldReady(f)){notify('Для черновика сначала соберите хронологию, сцену, детали, людей, факты и итог события');return}}renderDraft();return}
    if(e.target.closest('[data-rep150-save-draft]')){e.preventDefault();collectDraft();notify('Черновик сохранён');return}
    if(e.target.closest('[data-rep150-submit]')){e.preventDefault();const d=collectDraft();if(!draftReady(d)){notify('Для сдачи нужен полноценный черновик и все пункты самопроверки');return}R.submitted=true;R.submittedAt=new Date().toISOString();persist();renderDraft();patchRoute();notify('Работа сохранена для редакторского разбора');return}
  },true);

  const route=document.getElementById('myRoute');
  if(route)new MutationObserver(()=>requestAnimationFrame(patchRoute)).observe(route,{childList:true,subtree:true});
  const news=document.getElementById('newsCourse136');
  if(news)new MutationObserver(()=>requestAnimationFrame(patchNewsHub)).observe(news,{childList:true,subtree:true});

  renderHub();
  patchRoute();
  patchNewsHub();
  window.MMT_REPORTAGE_COURSE={render:renderHub,open:()=>{renderHub();go('reportCourse150')},state:()=>R};
})();
