/* MMT ДВИ v0.14.1 — honest checks: formal facts != semantic approval */
(function setupV0141(){
  const main=document.querySelector('main');if(!main)return;
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.14.1';
  document.title='MMT ДВИ — v0.14.1';
  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){}};

  state.v141SemanticPackets=state.v141SemanticPackets&&typeof state.v141SemanticPackets==='object'?state.v141SemanticPackets:{};

  const css=document.createElement('style');css.id='mmt-v0141-css';css.textContent=`
    .hon141Panel{background:#fff;border:1px solid var(--line);border-radius:20px;padding:14px;margin:12px 0}.hon141Panel h2{font-size:24px;margin:2px 0 6px}.hon141Intro{font-size:11px;line-height:1.48;color:var(--soft);margin:0 0 10px}.hon141Legend{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0 12px}.hon141Legend span{border-radius:999px;padding:6px 8px;font-size:9px;background:var(--muted)}
    .hon141Section{margin:13px 0}.hon141Section h3{font-size:16px;margin:0 0 7px}.hon141Item{border-radius:15px;padding:11px 12px;margin:7px 0}.hon141Item.bad{background:#faeded;border:1px solid #d6aaaa}.hon141Item.warn{background:var(--os);border:1px solid #efc1a9}.hon141Item.neutral{background:var(--muted);border:1px solid var(--line)}.hon141Item.checked{background:#edf7ed;border:1px solid #a8c9a8}.hon141Item b{display:block;font-size:12px}.hon141Item span{display:block;font-size:11px;line-height:1.43;margin-top:4px}.hon141Item em{font-style:normal;font-size:9px;display:inline-block;margin-top:5px;color:var(--soft)}
    .hon141Semantic{background:#f5f4f1;border:1px dashed #aaa;border-radius:15px;padding:11px 12px;margin:7px 0}.hon141Semantic b{display:block;font-size:12px}.hon141Semantic span{display:block;font-size:11px;line-height:1.43;margin-top:4px}.hon141Semantic .badge{display:inline-block;border-radius:999px;background:#fff;padding:4px 7px;font-size:9px;margin-top:6px}
    .hon141Verdict{background:#0c0c0c;color:#fff;border-radius:19px;padding:15px;margin:12px 0}.hon141Verdict .meta{color:#aaa}.hon141Verdict h3{font-size:22px;margin:4px 0 6px}.hon141Verdict p{font-size:11px;line-height:1.47;color:#d0d0d0}.hon141Verdict.block h3{color:#ffd3d3}.hon141Next{background:var(--os);border-radius:14px;padding:11px 12px;font-size:10px;line-height:1.45;margin:10px 0}.hon141Packet{font-size:9px;color:var(--soft);line-height:1.35;margin:9px 2px}
    #newsOwn137 .fact140Panel{display:none!important}
    #newsReview138[data-v141-own="1"] .rub138Result.ok{background:var(--muted)!important;border-color:var(--line)!important}
  `;document.head.appendChild(css);

  function activeItem(){return (state.v137OwnNews?.items||[]).find(x=>String(x.id)===String(state.v137OwnNews?.activeId))||null}
  function sync(item){
    if(!item)return null;
    ['name','newFact','who','where','when','whyHow','sourceDetail','proof','commentWho','commentRole','secondSide','background','backgroundSource'].forEach(k=>{const e=document.getElementById('own137-'+k);if(e)item[k]=e.value.trim()});
    item.draft=item.draft||{};['title','lead','body','comment','background'].forEach(k=>{const e=document.getElementById('own137-draft-'+k);if(e)item.draft[k]=e.value.trim()});
    persist();return item;
  }
  function today(){const d=window.MMT_NEWS_TIME_GUARD?.today?.()||new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function parsedDates(text){return window.MMT_NEWS_TIME_GUARD?.parseDates?.(text)||[]}
  function formal(item){
    sync(item);
    const rows=[], blockers=[], missing=[];
    const add=(status,title,text,key)=>{rows.push({status,title,text,key});if(status==='bad')blockers.push(key)};
    const time=window.MMT_NEWS_TIME_GUARD?.check?.()||{strong:[]};
    const dates=parsedDates(item.when||'');const t=today();
    if(item.eventStatus==='future')add('bad','Тип материала','Вы выбрали «Только будет». Это анонс, а не выполненная новостная практика.','eventFuture');
    else if(item.eventStatus==='past'&&time.strong?.length)add('bad','Время противоречит выбору',`Вы отметили «Уже произошло», но система нашла признаки будущего: ${time.strong.join('; ')}.`,'timeConflict');
    else if(item.eventStatus==='past'&&dates.length&&dates.every(x=>x.date<=t))add('checked','Дата не находится в будущем','Указанная распознаваемая дата не позже сегодняшней. Это только формальная проверка даты, а не подтверждение самого события.','dateFormal');
    else if(item.eventStatus==='past')add('neutral','Статус события заполнен','Вы отметили «Уже произошло». Система не нашла явного формального противоречия, но это не доказывает, что событие действительно состоялось.','eventClaim');
    else add('warn','Не выбран тип материала','Нужно отметить: событие уже произошло или только состоится.','eventMissing');

    const required=[['newFact','Что именно произошло?'],['who','Кто?'],['where','Где?'],['when','Когда?'],['whyHow','Почему и как?'],['sourceDetail','Конкретный источник'],['proof','Как проверить главный факт?'],['commentWho','Кого берём на комментарий?'],['commentRole','Почему именно его/её?'],['background','Бэкграунд'],['backgroundSource','Источник бэкграунда']];
    required.forEach(([k,label])=>{if(!(item[k]||'').trim())missing.push(label)});
    if(missing.length)add('warn','Не все обязательные поля заполнены',`Не хватает: ${missing.join(', ')}.`,'missing');
    else add('neutral','Обязательные поля заполнены','Это означает только полноту формы. Правильность и журналистский смысл ответов ещё не проверены.','filled');

    if(!item.sourceType)add('warn','Не выбран тип источника','Выберите, откуда получен основной факт.','sourceType');
    else if(item.sourceType==='hearsay')add('bad','Пересказ не годится как единственная основа','Вы сами выбрали «пересказ / мне сказали». Для ключевого факта нужен идентифицируемый первичный источник или независимое подтверждение.','hearsay');
    else add('neutral','Тип источника выбран','Тип источника записан, но компетентность конкретного человека/документа требует смысловой проверки.','sourceChosen');

    if(item.conflict==='yes'&&!(item.secondSide||'').trim())add('bad','При отмеченном конфликте нет второй стороны','Вы указали, что есть спор/обвинение/конфликт, но не указали, у кого запросите вторую позицию.','secondSide');
    else if(item.conflict==='yes')add('neutral','Вторая сторона заполнена','Поле заполнено. Насколько эта сторона действительно релевантна спору, должна решить смысловая проверка.','secondSideFilled');
    else add('neutral','Вы отметили, что явного конфликта нет','Это заявление ученика, а не доказанный вывод. Смысловая проверка должна заметить скрытое обвинение или конфликт, если он есть в тексте.','noConflictClaim');

    return{rows,blockers,missing,canProceed:blockers.length===0&&missing.length===0};
  }

  const semanticQuestions=[
    ['Инфоповод','Есть ли здесь действительно новое произошедшее событие, а не обещание, общая тема или бессвязный набор действий?'],
    ['Логика фактуры','Согласуются ли между собой «кто», «что», «где», «когда», «почему и как»? Нет ли подмены ответа другим вопросом?'],
    ['Компетентность источника','Может ли именно этот источник знать заявленный ключевой факт? Откуда у него такое знание?'],
    ['Факт / мнение / слух / предположение','Не выдаётся ли чужой слух, догадка или оценка за установленный факт?'],
    ['Неподтверждённые обвинения','Нет ли утверждений о мотивах, преступлении, коррупции, вине или намерениях без достаточного основания?'],
    ['Комментарий','Нужен ли выбранный человек этой истории и способен ли его комментарий добавить фактуру, а не просто реакцию?'],
    ['Бэкграунд','Объясняет ли предыстория именно это событие, а не просто заполняет поле общими сведениями?'],
    ['Язык','Нет ли разговорности, оценочной лексики, канцелярита и формулировок, которые нельзя использовать в нейтральной новости?']
  ];

  function packet(item,formalResult){
    return{
      schema:'mmt-news-semantic-review-v1',
      createdAt:new Date().toISOString(),
      workId:item.id,
      task:'Проверь фактуру расширенной новостной заметки как редактор. Не дописывай факты за ученика и не переписывай материал целиком.',
      facts:{eventStatus:item.eventStatus||'',workingTitle:item.name||'',newFact:item.newFact||'',who:item.who||'',where:item.where||'',when:item.when||'',whyHow:item.whyHow||'',sourceType:item.sourceType||'',sourceDetail:item.sourceDetail||'',proof:item.proof||'',commentWho:item.commentWho||'',commentRole:item.commentRole||'',conflict:item.conflict||'no',secondSide:item.secondSide||'',background:item.background||'',backgroundSource:item.backgroundSource||''},
      formal:{blockers:formalResult.blockers,missing:formalResult.missing},
      semanticChecks:semanticQuestions.map(([name,question])=>({name,question})),
      expectedOutput:{verdict:['можно собирать дальше','нужно дособрать','нельзя использовать как есть'],items:'problem -> why -> what to verify -> next action',mustNot:'invent facts or write the news for the student'}
    };
  }

  function renderHonest(){
    const s=document.getElementById('newsOwn137'),item=activeItem();if(!s||!item)return;
    const old=s.querySelector('.fact140Panel');if(!old)return;
    sync(item);const f=formal(item);state.v141SemanticPackets[item.id]=packet(item,f);persist();
    let panel=s.querySelector('#hon141Panel');if(!panel){panel=document.createElement('div');panel.id='hon141Panel';panel.className='hon141Panel';old.after(panel)}
    const semanticHtml=semanticQuestions.map(([n,q])=>`<div class="hon141Semantic"><b>${safe(n)}</b><span>${safe(q)}</span><span class="badge">Нужна смысловая проверка</span></div>`).join('');
    panel.innerHTML=`<h2>Проверка фактуры</h2><p class="hon141Intro">Теперь приложение не считает хороший ответ только потому, что поле заполнено. Ниже отдельно показано, что можно проверить формально, а что требует понимания смысла.</p><div class="hon141Legend"><span>✕ явная формальная проблема</span><span>→ нужно заполнить</span><span>i заполнено, но не одобрено</span><span>✓ проверен только конкретный формальный факт</span></div><div class="hon141Section"><h3>1. Формальная проверка</h3>${f.rows.map(r=>`<div class="hon141Item ${r.status}"><b>${r.status==='bad'?'✕':r.status==='warn'?'→':r.status==='checked'?'✓':'i'} ${safe(r.title)}</b><span>${safe(r.text)}</span>${r.status==='neutral'?'<em>Это не положительная оценка содержания.</em>':''}</div>`).join('')}</div><div class="hon141Section"><h3>2. Что нельзя честно решить правилами</h3>${semanticHtml}</div><div class="hon141Verdict ${f.blockers.length?'block':''}"><div class="meta">Текущий статус</div><h3>${f.blockers.length?'Есть формальные стоп-сигналы':f.missing.length?'Сначала заполните фактуру':'Форма собрана, смысл ещё не проверен'}</h3><p>${f.blockers.length?'Исправьте явные противоречия. После этого всё равно потребуется смысловая редакторская проверка.':f.missing.length?'Заполните обязательные поля. Заполнение не означает, что ответы правильные.':'Можно переходить к черновику для тренировки, но приложение пока не утверждает, что источник, причина, комментарий и бэкграунд выбраны правильно. Это задача будущего AI-редактора / редактора.'}</p></div><div class="hon141Next"><b>Что изменится после подключения AI-редактора</b><br>Он будет видеть всю карточку целиком и проверять связи между ответами: почему источник может знать факт, где слух выдан за факт, есть ли необоснованное обвинение, действительно ли комментарий и бэкграунд работают на эту новость. Он не будет писать материал вместо ученика.</div><div class="hon141Packet">Структурированный пакет для смысловой проверки сохранён локально: ${safe(item.id)}.</div>`;
    const toEditor=s.querySelector('[data-own137-editor]');if(toEditor){toEditor.disabled=!!f.blockers.length||!!f.missing.length;toEditor.style.opacity=toEditor.disabled?'.55':'';toEditor.title=toEditor.disabled?'Сначала устраните формальные проблемы и заполните обязательные поля':''}
  }

  function downgradeOwnReview(){
    const s=document.getElementById('newsReview138');if(!s||s.dataset.v141Own!=='1')return;
    s.querySelectorAll('.rub138Result.ok').forEach(el=>{
      el.classList.remove('ok');el.classList.add('info');
      const b=el.querySelector('b');if(b&&!b.dataset.v141){b.dataset.v141='1';b.textContent=b.textContent.replace(/^✓\s*/, 'i ')}
      if(!el.querySelector('.v141ReviewNote')){const n=document.createElement('span');n.className='v141ReviewNote';n.textContent='Автоматическая проверка не обнаружила явной формальной ошибки. Это не подтверждение смысловой правильности.';el.appendChild(n)}
    });
    const v=s.querySelector('.rub138Verdict');if(v&&!v.querySelector('.v141VerdictNote')){const n=document.createElement('p');n.className='v141VerdictNote';n.textContent='Важно: пока AI-редактор не подключён, этот экран не может надёжно оценить смысл свободного текста. Итог ниже относится только к доступным формальным проверкам.';v.appendChild(n)}
  }

  const factScreen=document.getElementById('newsOwn137');if(factScreen)new MutationObserver(()=>requestAnimationFrame(renderHonest)).observe(factScreen,{childList:true,subtree:false});
  const reviewScreen=document.getElementById('newsReview138');if(reviewScreen)new MutationObserver(()=>requestAnimationFrame(downgradeOwnReview)).observe(reviewScreen,{childList:true,subtree:true});

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-own137-review]'))setTimeout(renderHonest,0);
    if(e.target.closest('[data-own138-submit]')){const s=document.getElementById('newsReview138');if(s)s.dataset.v141Own='1';setTimeout(downgradeOwnReview,20)}
  },true);
  document.addEventListener('input',e=>{if(e.target.closest('#newsOwn137')&&document.querySelector('#hon141Panel'))setTimeout(renderHonest,100)});
  document.addEventListener('change',e=>{if(e.target.closest('#newsOwn137')&&document.querySelector('#hon141Panel'))setTimeout(renderHonest,20)});

  window.MMT_NEWS_SEMANTIC_HANDOFF={packet:()=>{const item=activeItem();if(!item)return null;const f=formal(item);return packet(item,f)},formal:()=>{const item=activeItem();return item?formal(item):null}};
  renderHonest();
})();
