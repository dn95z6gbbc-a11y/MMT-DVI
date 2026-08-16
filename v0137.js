/* MMT ДВИ v0.13.7 — own news occasions + one stable bottom dock watchdog */
(function setupV0137(){
  const main=document.querySelector('main');if(!main)return;
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.7';
  document.title='MMT ДВИ — v0.13.7';
  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.13.7] persist failed',e)}};

  /* One dock watchdog only. v0.13.2 replaced the strong dock watchdog with a visibility-only loop. */
  if(window.MMT_DOCK_WATCHDOG)clearInterval(window.MMT_DOCK_WATCHDOG);
  const onboardingHidden=new Set(['splash','v132Geo','v132Pick']);
  function stabilizeDock(){
    const id=document.querySelector('.screen.active')?.id||'';
    const dock=document.getElementById('mmtBottomDock');if(!dock)return;
    const hidden=onboardingHidden.has(id);
    document.body.classList.toggle('v132-onboarding',hidden&&id!=='splash');
    if(hidden){dock.style.setProperty('display','none','important');return}
    document.body.classList.remove('v132-onboarding','v13-onboarding');
    document.body.style.setProperty('padding-bottom','calc(82px + env(safe-area-inset-bottom,0px))','important');
    const app=document.querySelector('.app');if(app)app.style.setProperty('padding-bottom','34px','important');
    dock.style.setProperty('display','block','important');
    dock.style.setProperty('position','fixed','important');
    dock.style.setProperty('left','0','important');dock.style.setProperty('right','0','important');
    dock.style.setProperty('bottom','0','important');dock.style.setProperty('top','auto','important');
    dock.style.setProperty('width','100%','important');
    dock.style.setProperty('transform','none','important');dock.style.setProperty('-webkit-transform','none','important');
    dock.style.setProperty('visibility','visible','important');dock.style.setProperty('opacity','1','important');
    dock.style.setProperty('z-index','2147483647','important');dock.style.setProperty('pointer-events','auto','important');
    if(typeof window.syncMMTBottomDock==='function')try{window.syncMMTBottomDock()}catch(e){}
  }
  window.MMT_DOCK_WATCHDOG=setInterval(stabilizeDock,1000);
  ['pageshow','focus','orientationchange','resize'].forEach(ev=>window.addEventListener(ev,()=>requestAnimationFrame(stabilizeDock),{passive:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestAnimationFrame(stabilizeDock)});
  const mainNavObserver=new MutationObserver(ms=>{if(ms.some(m=>m.type==='attributes'&&m.attributeName==='class'))requestAnimationFrame(stabilizeDock)});
  mainNavObserver.observe(main,{subtree:true,attributes:true,attributeFilter:['class']});

  state.v137OwnNews=state.v137OwnNews&&typeof state.v137OwnNews==='object'?state.v137OwnNews:{items:[],activeId:null};
  state.v137OwnNews.items=Array.isArray(state.v137OwnNews.items)?state.v137OwnNews.items:[];

  const css=document.createElement('style');css.id='mmt-v0137-css';css.textContent=`
    .own137Block{background:#fff;border:2px solid var(--o);border-radius:19px;padding:14px;margin:12px 0}.own137Block h3{font-size:19px;margin:4px 0 6px}.own137Block p{font-size:12px;line-height:1.45;color:var(--soft)}.own137Rhythm{background:var(--os);border-radius:12px;padding:9px 10px;font-size:11px;line-height:1.4;margin:9px 0}.own137List{display:grid;gap:7px;margin:9px 0}.own137Mini{border:1px solid var(--line);background:#fff;border-radius:13px;padding:10px;text-align:left;width:100%;color:var(--ink)}.own137Mini b{display:block;font-size:12px}.own137Mini small{display:block;color:var(--soft);font-size:10px;margin-top:3px}
    .own137Hero{background:#0c0c0c;color:#fff;border-radius:21px;padding:16px;margin:10px 0}.own137Hero .meta{color:#bbb}.own137Hero h2{font-size:26px;margin:5px 0 7px}.own137Hero p{font-size:12px;line-height:1.48;color:#d1d1d1}.own137Section{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:10px 0}.own137Section h3{font-size:17px;margin:0 0 7px}.own137Field{margin:11px 0}.own137Field label{display:block;font-size:11px;font-weight:800;margin-bottom:5px}.own137Field small{display:block;color:var(--soft);font-size:10px;line-height:1.35;margin-top:4px}.own137Field .input,.own137Field .textarea{width:100%;box-sizing:border-box}.own137Field .textarea{min-height:88px}.own137ChoiceRow{display:flex;gap:6px;flex-wrap:wrap}.own137Choice{border:1px solid var(--line);background:#fff;border-radius:12px;padding:9px 10px;font-size:11px;color:var(--ink)}.own137Choice.active{border:2px solid var(--o);background:var(--os);font-weight:800}.own137Review{border-radius:16px;padding:12px;margin:8px 0}.own137Review.ok{background:#edf7ed;border:1px solid #a8c9a8}.own137Review.warn{background:var(--os);border:1px solid #efc1a9}.own137Review.bad{background:#faeded;border:1px solid #d6aaaa}.own137Review b{display:block;font-size:12px}.own137Review span{display:block;font-size:11px;line-height:1.4;margin-top:3px}.own137Verdict{background:#0c0c0c;color:#fff;border-radius:18px;padding:14px;margin:11px 0}.own137Verdict h3{font-size:19px;margin:4px 0 6px}.own137Verdict p{font-size:11px;line-height:1.45;color:#d0d0d0}.own137Actions{display:grid;gap:7px;margin:12px 0}.own137Actions .btn{margin:0}.own137EditorTip{background:var(--os);border-radius:14px;padding:11px;font-size:11px;line-height:1.45;margin:9px 0}.own137Check label{display:flex;gap:8px;align-items:flex-start;font-size:11px;line-height:1.4;margin:8px 0}.own137Check input{margin-top:2px;accent-color:var(--o)}
  `;document.head.appendChild(css);

  function ensureScreen(id){let s=document.getElementById(id);if(!s){s=document.createElement('section');s.id=id;s.className='screen';main.appendChild(s)}return s}
  const factScreen=ensureScreen('newsOwn137');
  const editorScreen=ensureScreen('newsOwnEditor137');
  function go(id){if(typeof window.go==='function')window.go(id);else{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id)?.classList.add('active')}requestAnimationFrame(stabilizeDock)}
  function itemById(id){return state.v137OwnNews.items.find(x=>String(x.id)===String(id))}
  function blankItem(){return{id:'own-'+Date.now(),createdAt:new Date().toISOString(),name:'',newFact:'',who:'',where:'',when:'',whyHow:'',sourceType:'',sourceDetail:'',proof:'',commentWho:'',commentRole:'',conflict:'no',secondSide:'',background:'',backgroundSource:'',draft:{title:'',lead:'',body:'',comment:'',background:'',checks:{}},submitted:false}}
  function activeItem(){let x=itemById(state.v137OwnNews.activeId);if(!x){x=blankItem();state.v137OwnNews.items.unshift(x);state.v137OwnNews.activeId=x.id;persist()}x.draft=x.draft||{title:'',lead:'',body:'',comment:'',background:'',checks:{}};x.draft.checks=x.draft.checks||{};return x}

  const sourceLabels={official:'официальный документ / решение',participant:'прямой участник / интервью',observation:'личное наблюдение',press:'пресс-служба',social:'пост / публикация в соцсети',hearsay:'пересказ / «мне сказали»'};
  function collectFacts(){const x=activeItem();['name','newFact','who','where','when','whyHow','sourceDetail','proof','commentWho','commentRole','secondSide','background','backgroundSource'].forEach(k=>{const el=document.getElementById('own137-'+k);if(el)x[k]=el.value.trim()});x.updatedAt=new Date().toISOString();persist();return x}
  function review(x){
    const out=[];
    const push=(key,status,title,text)=>out.push({key,status,title,text});
    push('occasion',x.newFact.length>=25?'ok':'warn','Инфоповод',x.newFact.length>=25?'Новое изменение сформулировано отдельно от общей темы.':'Сформулируйте одним предложением, что именно произошло или изменилось сейчас. «Тема образования» или «проблема транспорта» — ещё не инфоповод.');
    const six=[x.who,x.where,x.when,x.whyHow].filter(v=>v&&v.length>=3).length;
    push('six',six>=4?'ok':'warn','Кто / где / когда / почему и как',six>=4?'Базовые вопросы закрыты.':'Не все базовые вопросы закрыты. Если ответа пока нет, это не повод придумать его — это список на досбор фактуры.');
    if(x.sourceType==='hearsay')push('source','bad','Источник','Пересказ «мне сказали» нельзя использовать как единственную основу новости. Найдите человека, документ, наблюдение или другой идентифицируемый источник.');
    else if(x.sourceType==='social')push('source',x.sourceDetail?'warn':'bad','Источник','Пост или публикация могут быть отправной точкой, но значимый факт лучше подтвердить у первичного источника. Зафиксируйте автора/аккаунт и найдите подтверждение.');
    else if(x.sourceType&&x.sourceDetail.length>=5)push('source','ok','Источник',`Источник понятен: ${sourceLabels[x.sourceType]||x.sourceType}. В тексте всё равно нужно точно атрибутировать, откуда известен факт.`);
    else push('source','warn','Источник','Укажите, откуда вы знаете о событии и что именно сможете предъявить редактору как подтверждение.');
    push('proof',x.proof.length>=8?'ok':'warn','Проверка факта',x.proof.length>=8?'Есть план, как подтвердить ключевой факт.':'Напишите, чем проверите ключевой факт: ссылка на документ, запись разговора, контакт участника, собственные наблюдения, несколько независимых подтверждений.');
    push('comment',x.commentWho.length>=3&&x.commentRole.length>=3?'ok':'warn','Комментарий',x.commentWho&&x.commentRole?'Понятно, у кого и зачем брать комментарий.':'Назовите не «эксперта вообще», а конкретного участника, ответственного человека или специалиста и объясните его роль в этой истории.');
    if(x.conflict==='yes')push('side',x.secondSide.length>=5?'ok':'bad','Вторая сторона',x.secondSide.length>=5?'Вторая сторона предусмотрена. В заметке нужно честно зафиксировать её позицию или попытку получить ответ.':'Есть спор, обвинение или конфликт, но второй стороны нет. До публикации её нужно запросить; иначе текст будет односторонним.');
    else push('side','ok','Вторая сторона','Вы отметили, что явного конфликта нет. Если он обнаружится при сборе информации, вернитесь к этому пункту.');
    push('background',x.background.length>=15&&x.backgroundSource.length>=5?'ok':'warn','Бэкграунд',x.background&&x.backgroundSource?'Есть релевантная предыстория и источник для неё.':'Для расширенной заметки нужен короткий контекст: что было раньше и откуда это известно. Не превращайте его в энциклопедическую справку.');
    const bad=out.filter(r=>r.status==='bad').length,warn=out.filter(r=>r.status==='warn').length;
    const ready=bad===0&&warn<=1;
    return{items:out,bad,warn,ready};
  }

  function renderFacts(){
    const x=activeItem(),r=review(x);
    factScreen.innerHTML=`<div class="eye">Новости · собственная практика</div><div class="own137Hero"><div class="meta">Сначала репортёрская работа</div><h2>Мой инфоповод</h2><p>Система не придумывает фактуру за вас. Она помогает увидеть, что уже можно использовать, чего не хватает и где есть редакционный риск.</p></div>
      <div class="own137Section"><h3>1. Что произошло?</h3><div class="own137Field"><label>Рабочее название темы</label><input id="own137-name" class="input" value="${safe(x.name)}" placeholder="Например: в школе открыли медиакласс"><small>Это название карточки, не будущий заголовок.</small></div><div class="own137Field"><label>Что именно изменилось сейчас?</label><textarea id="own137-newFact" class="textarea" placeholder="Одно конкретное новое событие, решение, действие или факт">${safe(x.newFact)}</textarea><small>Не общая тема, а ответ на вопрос: почему эту новость нужно писать сегодня?</small></div><div class="own137Field"><label>Кто?</label><input id="own137-who" class="input" value="${safe(x.who)}" placeholder="Кто действует или с кем произошло событие"></div><div class="own137Field"><label>Где?</label><input id="own137-where" class="input" value="${safe(x.where)}" placeholder="Конкретное место"></div><div class="own137Field"><label>Когда?</label><input id="own137-when" class="input" value="${safe(x.when)}" placeholder="Дата / время / период"></div><div class="own137Field"><label>Почему и как?</label><textarea id="own137-whyHow" class="textarea" placeholder="Причина, механизм решения, что будет происходить">${safe(x.whyHow)}</textarea></div></div>
      <div class="own137Section"><h3>2. Откуда это известно?</h3><div class="own137Field"><label>Тип основного источника</label><div class="own137ChoiceRow">${Object.entries(sourceLabels).map(([k,v])=>`<button type="button" class="own137Choice ${x.sourceType===k?'active':''}" data-own137-source="${k}">${safe(v)}</button>`).join('')}</div></div><div class="own137Field"><label>Конкретный источник</label><textarea id="own137-sourceDetail" class="textarea" placeholder="Название документа, имя и должность человека, ссылка/аккаунт, что именно наблюдали">${safe(x.sourceDetail)}</textarea></div><div class="own137Field"><label>Чем вы проверите главный факт?</label><textarea id="own137-proof" class="textarea" placeholder="Документ, запись, ссылка, контакт, второе подтверждение...">${safe(x.proof)}</textarea></div></div>
      <div class="own137Section"><h3>3. Кого нужно спросить?</h3><div class="own137Field"><label>Кого берём на комментарий?</label><input id="own137-commentWho" class="input" value="${safe(x.commentWho)}" placeholder="Имя или тип героя"></div><div class="own137Field"><label>Почему именно его?</label><input id="own137-commentRole" class="input" value="${safe(x.commentRole)}" placeholder="Участник, принимает решение, эксперт по последствиям..."></div><div class="own137Field"><label>Есть спор, обвинение или конфликт интересов?</label><div class="own137ChoiceRow"><button class="own137Choice ${x.conflict==='no'?'active':''}" data-own137-conflict="no" type="button">Нет</button><button class="own137Choice ${x.conflict==='yes'?'active':''}" data-own137-conflict="yes" type="button">Да</button></div></div>${x.conflict==='yes'?`<div class="own137Field"><label>Кто представляет вторую сторону?</label><textarea id="own137-secondSide" class="textarea" placeholder="К кому нужно обратиться за второй позицией">${safe(x.secondSide)}</textarea></div>`:''}</div>
      <div class="own137Section"><h3>4. Какой нужен бэкграунд?</h3><div class="own137Field"><label>Что из прошлого помогает понять событие?</label><textarea id="own137-background" class="textarea" placeholder="Короткая релевантная предыстория, цифра или контекст">${safe(x.background)}</textarea></div><div class="own137Field"><label>Источник бэкграунда</label><input id="own137-backgroundSource" class="input" value="${safe(x.backgroundSource)}" placeholder="Документ, база, прежняя публикация, официальный отчёт..."></div></div>
      <div class="own137Actions"><button type="button" class="btn" data-own137-review>Проверить фактуру</button><button type="button" class="btn secondary" data-own137-save>Сохранить и продолжить позже</button><button type="button" class="btn secondary" data-own137-hub>← К новостям</button></div>
      <div id="own137ReviewBox">${reviewHtml(r)}</div>`;
  }
  function reviewHtml(r){
    return `<div class="own137Section"><h3>Редакторская проверка</h3>${r.items.map(i=>`<div class="own137Review ${i.status}"><b>${i.status==='ok'?'✓ ':i.status==='bad'?'✕ ':'→ '}${safe(i.title)}</b><span>${safe(i.text)}</span></div>`).join('')}<div class="own137Verdict"><div class="meta" style="color:#aaa">Вердикт</div><h3>${r.ready?'Фактуры достаточно, можно писать':'Сначала дособерите фактуру'}</h3><p>${r.ready?'У вас есть рабочая основа расширенной заметки. Следующий экран не придумает текст за вас — он только даст структуру пяти обязательных частей.':r.bad?'Есть критические редакционные проблемы. Их лучше закрыть до написания текста.':'Критических проблем нет, но несколько важных элементов ещё пустые или слабые.'}</p></div>${r.ready?'<button type="button" class="btn" data-own137-editor>Перейти к расширенной заметке →</button>':''}</div>`;
  }

  function collectDraft(){const x=activeItem();['title','lead','body','comment','background'].forEach(k=>{const el=document.getElementById('own137-draft-'+k);if(el)x.draft[k]=el.value.trim()});document.querySelectorAll('[data-own137-check]').forEach(c=>x.draft.checks[c.dataset.own137Check]=c.checked);x.updatedAt=new Date().toISOString();persist();return x}
  function renderEditor(){
    const x=activeItem(),d=x.draft;
    editorScreen.innerHTML=`<div class="eye">Новости · мой инфоповод</div><div class="own137Hero"><div class="meta">${safe(x.name||'Собственная тема')}</div><h2>Соберите расширенную заметку</h2><p>${safe(x.newFact)}</p></div><div class="own137EditorTip"><b>Не переносите карточку фактуры в текст механически.</b><br>Заголовок и лид выбирают главное; тело раскрывает новое событие; комментарий добавляет позицию; бэкграунд объясняет только тот контекст, без которого новость хуже понятна.</div>
      <div class="own137Section"><div class="own137Field"><label>Заголовок-шило</label><input id="own137-draft-title" class="input" value="${safe(d.title)}" placeholder="Главный факт без тумана"></div><div class="own137Field"><label>Лид</label><textarea id="own137-draft-lead" class="textarea" placeholder="Главное событие + ключевая конкретика">${safe(d.lead)}</textarea></div><div class="own137Field"><label>Тело новости</label><textarea id="own137-draft-body" class="textarea" style="min-height:160px" placeholder="Новая фактура, детали, развитие события, источник">${safe(d.body)}</textarea></div><div class="own137Field"><label>Комментарий</label><textarea id="own137-draft-comment" class="textarea" placeholder="Не декоративная цитата, а позиция человека, который нужен этой истории">${safe(d.comment)}</textarea></div><div class="own137Field"><label>Бэкграунд</label><textarea id="own137-draft-background" class="textarea" placeholder="Релевантная предыстория + источник">${safe(d.background)}</textarea></div></div>
      <div class="own137Section own137Check"><h3>Самопроверка перед разбором</h3>${[['headline','Заголовок сообщает главный новый факт, а не просто тему.'],['lead','Лид раскрывает заголовок и не начинается с общих слов.'],['body','В теле есть новая фактура и понятная атрибуция источника.'],['comment','Комментарий взят у человека, который действительно нужен этой истории.'],['background','Бэкграунд помогает понять новость и не подменяет новое событие.']].map(([k,t])=>`<label><input type="checkbox" data-own137-check="${k}" ${d.checks[k]?'checked':''}>${t}</label>`).join('')}</div>
      <div class="own137Actions"><button type="button" class="btn secondary" data-own137-draft-save>Сохранить черновик</button><button type="button" class="btn" data-own137-submit>${x.submitted?'Сохранено для разбора':'Готово к разбору'}</button><button type="button" class="btn secondary" data-own137-facts>← Вернуться к фактуре</button></div>`;
  }

  function ownStatus(x){if(x.submitted)return'готово к разбору';if(x.draft&&(x.draft.title||x.draft.lead||x.draft.body))return'черновик';if(x.newFact)return'фактура';return'новая тема'}
  function patchHub(){
    const hub=document.getElementById('newsCourse136');if(!hub||document.getElementById('own137HubBlock'))return;
    const block=document.createElement('div');block.id='own137HubBlock';block.className='own137Block';
    const items=state.v137OwnNews.items.filter(x=>x.newFact||x.name||x.submitted);
    block.innerHTML=`<div class="eye">Своя журналистская практика</div><h3>Предложить свой инфоповод</h3><p>Чередуйте учебные редакционные пакеты с реальными событиями, которые нашли сами. Приложение сначала подскажет, достаточно ли фактуры и что нужно дособрать.</p><div class="own137Rhythm"><b>Рабочий ритм:</b> учебный кейс → свой инфоповод → следующий учебный кейс. Свои темы пока считаются дополнительной практикой и не заменяют обязательные 10.</div><button type="button" class="btn" data-own137-new>+ Добавить свой инфоповод</button>${items.length?`<div class="own137List">${items.slice(0,5).map(x=>`<button type="button" class="own137Mini" data-own137-open="${safe(x.id)}"><b>${safe(x.name||x.newFact||'Свой инфоповод')}</b><small>${safe(ownStatus(x))}</small></button>`).join('')}</div>`:''}`;
    hub.querySelector('.news136Progress')?.insertAdjacentElement('afterend',block);
  }
  const hub=document.getElementById('newsCourse136');if(hub)new MutationObserver(()=>requestAnimationFrame(patchHub)).observe(hub,{childList:true});

  document.addEventListener('click',e=>{
    const src=e.target.closest('[data-own137-source]');if(src){e.preventDefault();const x=collectFacts();x.sourceType=src.dataset.own137Source;persist();renderFacts();return}
    const cf=e.target.closest('[data-own137-conflict]');if(cf){e.preventDefault();const x=collectFacts();x.conflict=cf.dataset.own137Conflict;persist();renderFacts();return}
    if(e.target.closest('[data-own137-new]')){e.preventDefault();const x=blankItem();state.v137OwnNews.items.unshift(x);state.v137OwnNews.activeId=x.id;persist();renderFacts();go('newsOwn137');return}
    const op=e.target.closest('[data-own137-open]');if(op){e.preventDefault();state.v137OwnNews.activeId=op.dataset.own137Open;persist();renderFacts();go('newsOwn137');return}
    if(e.target.closest('[data-own137-save]')){e.preventDefault();collectFacts();if(typeof toast==='function')toast('Фактура сохранена');renderFacts();return}
    if(e.target.closest('[data-own137-review]')){e.preventDefault();const x=collectFacts();renderFacts();const box=document.getElementById('own137ReviewBox');box?.scrollIntoView({behavior:'smooth',block:'start'});return}
    if(e.target.closest('[data-own137-editor]')){e.preventDefault();const x=collectFacts(),r=review(x);if(!r.ready){if(typeof toast==='function')toast('Сначала дособерите фактуру');return}renderEditor();go('newsOwnEditor137');return}
    if(e.target.closest('[data-own137-draft-save]')){e.preventDefault();collectDraft();if(typeof toast==='function')toast('Черновик сохранён');renderEditor();return}
    if(e.target.closest('[data-own137-submit]')){e.preventDefault();const x=collectDraft(),d=x.draft;const missing=[d.title,d.lead,d.body,d.comment,d.background].filter(v=>!v).length;if(missing){if(typeof toast==='function')toast('Заполните все пять частей заметки');return}const checks=Object.values(d.checks||{}).filter(Boolean).length;if(checks<5){if(typeof toast==='function')toast('Сначала пройдите самопроверку');return}x.submitted=true;x.updatedAt=new Date().toISOString();persist();renderEditor();if(typeof toast==='function')toast('Своя заметка готова к разбору');return}
    if(e.target.closest('[data-own137-facts]')){e.preventDefault();collectDraft();renderFacts();go('newsOwn137');return}
    if(e.target.closest('[data-own137-hub]')){e.preventDefault();collectFacts();if(window.MMT_NEWS_COURSE?.render)window.MMT_NEWS_COURSE.render();go('newsCourse136');setTimeout(patchHub,0);return}
    if(e.target.closest('[data-v136-hub],[data-v136-complete-lesson],[data-v136-save-draft],[data-v136-submit]'))setTimeout(patchHub,0);
  },true);

  window.MMT_OWN_NEWS={new:()=>{const x=blankItem();state.v137OwnNews.items.unshift(x);state.v137OwnNews.activeId=x.id;persist();renderFacts();go('newsOwn137')},items:()=>state.v137OwnNews.items};
  patchHub();stabilizeDock();
})();
