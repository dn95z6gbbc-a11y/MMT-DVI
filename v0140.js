/* MMT ДВИ v0.14.0 — substantive fact review: completeness is not correctness */
(function setupV0140(){
  const main=document.querySelector('main');if(!main)return;
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.14.0';
  document.title='MMT ДВИ — v0.14.0';
  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){}};

  const css=document.createElement('style');css.id='mmt-v0140-css';css.textContent=`
    .fact140Panel{background:#fff;border:1px solid var(--line);border-radius:19px;padding:14px;margin:12px 0}.fact140Panel h2{font-size:23px;margin:2px 0 6px}.fact140Lead{font-size:11px;line-height:1.45;color:var(--soft);margin-bottom:10px}
    .fact140Item{border-radius:15px;padding:11px 12px;margin:8px 0}.fact140Item.ok{background:#edf7ed;border:1px solid #a8c9a8}.fact140Item.warn{background:var(--os);border:1px solid #efc1a9}.fact140Item.bad{background:#faeded;border:1px solid #d6aaaa}.fact140Item.info{background:var(--muted);border:1px solid var(--line)}.fact140Item b{display:block;font-size:12px}.fact140Item span{display:block;font-size:11px;line-height:1.43;margin-top:4px}
    .fact140Verdict{background:#0c0c0c;color:#fff;border-radius:18px;padding:14px;margin:12px 0}.fact140Verdict .meta{color:#aaa}.fact140Verdict h3{font-size:22px;margin:4px 0 6px}.fact140Verdict p{font-size:11px;line-height:1.45;color:#d1d1d1}.fact140Actions{display:grid;gap:7px}.fact140Actions .btn{margin:0}.fact140Tiny{font-size:9px;line-height:1.35;color:var(--soft);margin-top:8px}
    .lang140Box{background:var(--os);border:1px solid #efc1a9;border-radius:15px;padding:11px 12px;margin:9px 0}.lang140Box b{display:block;font-size:12px}.lang140Box span{display:block;font-size:11px;line-height:1.43;margin-top:4px}
  `;document.head.appendChild(css);

  const rolePersonRe=/(^|[^а-яё])(директор|учител[ья]|преподавател[ья]|ученик[аи]?|школьник[аи]?|родител[ьи]|сотрудник[аи]?|эксперт[аы]?|министр|врач|тренер|организатор|руководител[ья]|представител[ья]|очевидец|участник)([^а-яё]|$)/i;
  const causalRe=/(потому|из-за|в связи|по причине|чтобы|для того|решил|решила|решили|цель|понадоб|необходим|в результате|благодаря)/i;
  const weakBgRe=/(^|[.!?]\s*)(раньше\s+(?:такого\s+)?не\s+было|ранее\s+(?:такого\s+)?не\s+было|до\s+этого\s+(?:такого\s+)?не\s+было)/i;
  const genericSourceRe=/^(директор|учитель|преподаватель|документ школы|сайт школы|пресс-служба|сотрудник|эксперт)$/i;
  const slangMap={
    'компы':'компьютеры','комп':'компьютер','инфа':'информация','видос':'видео / видеоматериал','видосы':'видео / видеоматериалы','препод':'преподаватель','преподы':'преподаватели','универ':'университет','общага':'общежитие','телек':'телевидение / телевизор','фотки':'фотографии','фотка':'фотография','туса':'мероприятие / встреча','тусовка':'мероприятие / встреча','прикол':'конкретный факт вместо оценки','прикольный':'нейтральное описание вместо оценки','классный':'нейтральное описание вместо оценки','офигенный':'нейтральное описание вместо оценки'
  };
  const slangKeys=Object.keys(slangMap);
  const slangRe=new RegExp('(^|[^а-яё])('+slangKeys.join('|')+')([^а-яё]|$)','ig');

  function activeItem(){return (state.v137OwnNews?.items||[]).find(x=>String(x.id)===String(state.v137OwnNews?.activeId))||null}
  function syncFacts(item){
    if(!item)return null;
    ['name','newFact','who','where','when','whyHow','sourceDetail','proof','commentWho','commentRole','secondSide','background','backgroundSource'].forEach(k=>{const e=document.getElementById('own137-'+k);if(e)item[k]=e.value.trim()});
    persist();return item;
  }
  function findSlang(text){
    const hits=[];String(text||'').replace(slangRe,(m,a,w)=>{hits.push(w.toLowerCase());return m});return[...new Set(hits)];
  }
  function today(){const d=window.MMT_NEWS_TIME_GUARD?.today?.()||new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function dateRelations(text){
    const dates=window.MMT_NEWS_TIME_GUARD?.parseDates?.(text)||[],t=today();return dates.map(x=>({raw:x.raw,date:x.date,rel:x.date>t?'future':x.date<t?'past':'today'}));
  }
  function push(out,status,title,text,key){out.push({status,title,text,key:key||title})}

  function analyzeFacts(item){
    syncFacts(item);const out=[];
    const time=window.MMT_NEWS_TIME_GUARD?.check?.()||{strong:[],soft:[]};
    const whenDates=dateRelations(item.when||'');
    const pastDates=whenDates.filter(x=>x.rel==='past'),futureDates=whenDates.filter(x=>x.rel==='future');

    if(item.eventStatus==='future'){
      let detail='Вы сами отметили «Только будет». Для этого модуля это анонс, а не выполненная новостная практика.';
      if(pastDates.length)detail+=` При этом дата «${pastDates[0].raw}» уже прошла — фактура ещё и противоречит сама себе.`;
      push(out,'bad','Тип материала: это не новость',detail,'time');
    }else if(item.eventStatus==='past'&&time.strong?.length){
      push(out,'bad','Время события противоречит выбору',`Вы отметили «Уже произошло», но в фактуре есть признаки будущего: ${time.strong.join('; ')}.`,'time');
    }else if(item.eventStatus==='past'&&futureDates.length){
      push(out,'bad','Дата ещё не наступила',`В поле «Когда?» стоит ${futureDates[0].raw}, а эта дата позже сегодняшней. Для новости нужен уже произошедший инфоповод.`,'time');
    }else if(item.eventStatus==='past')push(out,'ok','Тип материала','Явных противоречий по времени основного события не найдено.','time');
    else push(out,'warn','Тип материала не зафиксирован','Укажите, событие уже произошло или только состоится.','time');

    if((item.newFact||'').length<25)push(out,'warn','Инфоповод','Слишком общая формулировка. Одним предложением назовите конкретное изменение, которое произошло сейчас.','occasion');
    else if(time.strong?.some(x=>String(x).startsWith('инфоповод:')))push(out,'bad','Инфоповод сформулирован в будущем времени','В поле «Что именно изменилось сейчас?» описано то, что только произойдёт. Это анонсная фактура.','occasion');
    else push(out,'ok','Инфоповод','Конкретное новое изменение сформулировано.','occasion');

    const missing=[];if(!(item.who||'').trim())missing.push('кто');if(!(item.where||'').trim())missing.push('где');if(!(item.when||'').trim())missing.push('когда');
    if(missing.length)push(out,'warn','Базовые вопросы',`Не хватает: ${missing.join(', ')}.`,'six');
    else push(out,'ok','Кто / где / когда','Базовая фактура по участнику, месту и времени заполнена.','six');

    if(!(item.whyHow||'').trim())push(out,'warn','Почему и как?','Причина и механизм события не собраны.','why');
    else if(!causalRe.test(item.whyHow))push(out,'warn','Почему и как?','Поле заполнено, но причина события неочевидна. Проверьте, что вы ответили не только «что сделали», но и почему это произошло / зачем было принято решение.','why');
    else push(out,'ok','Почему и как?','Есть объяснение причины или механизма события.','why');

    if(item.sourceType==='hearsay')push(out,'bad','Источник','«Мне сказали» не может быть единственной основой новости. Нужен идентифицируемый источник или подтверждение.','source');
    else if(item.sourceType==='social')push(out,'warn','Источник','Публикация в соцсети может дать повод, но ключевой факт лучше подтвердить у первичного источника.','source');
    else if(!item.sourceType||!(item.sourceDetail||'').trim())push(out,'warn','Источник','Укажите тип и конкретный источник факта.','source');
    else if(item.sourceType==='observation'&&rolePersonRe.test(item.sourceDetail))push(out,'warn','Тип источника не совпадает с описанием',`Вы выбрали «личное наблюдение», но конкретным источником указали «${item.sourceDetail}». Если этот человек сообщил вам факт, это интервью / прямой участник, а не личное наблюдение.`,'source');
    else if(genericSourceRe.test((item.sourceDetail||'').trim()))push(out,'warn','Источник слишком общий',`«${item.sourceDetail}» пока недостаточно для точной атрибуции. Перед публикацией зафиксируйте ФИО/должность человека или точное название документа.`,'source');
    else push(out,'ok','Источник','Тип и конкретный источник факта не противоречат друг другу.','source');

    if(!(item.proof||'').trim())push(out,'warn','Проверка факта','Не указано, чем будет подтверждён главный факт.','proof');
    else push(out,'ok','Проверка факта','Есть план подтверждения ключевого факта. Помните: сама запись в поле ещё не доказывает достоверность.','proof');

    if(!(item.commentWho||'').trim()||!(item.commentRole||'').trim())push(out,'warn','Комментарий','Назовите конкретного человека/роль и объясните, зачем его комментарий нужен этой истории.','comment');
    else push(out,'ok','Комментарий','Понятно, у кого и зачем брать комментарий. Сам комментарий в собственной новости всё равно нужно реально получить.','comment');

    if(item.conflict==='yes'&&!(item.secondSide||'').trim())push(out,'bad','Вторая сторона','Есть конфликт или обвинение, но вторая сторона не предусмотрена. До публикации нужно запросить её позицию.','balance');
    else if(item.conflict==='yes')push(out,'ok','Вторая сторона','Вторая сторона предусмотрена.','balance');
    else push(out,'info','Вторая сторона','Вы отметили, что явного конфликта нет. Если он обнаружится при сборе фактуры, вернитесь к этому пункту.','balance');

    const bg=(item.background||'').trim();
    if(!bg)push(out,'warn','Бэкграунд','Для расширенной заметки нужен релевантный контекст или предыстория.','background');
    else if(weakBgRe.test(bg)||bg.length<28)push(out,'warn','Бэкграунд слишком слабый',`«${bg}» пока почти ничего не объясняет. Нужна конкретная предыстория этого события: подготовка, предыдущий этап, история проекта, объекта или участников.`,'background');
    else if(!(item.backgroundSource||'').trim())push(out,'warn','Источник бэкграунда','Предыстория есть, но не указан её источник.','background');
    else if(genericSourceRe.test((item.backgroundSource||'').trim()))push(out,'warn','Источник бэкграунда слишком общий',`«${item.backgroundSource}» нужно конкретизировать: какой именно документ / страница / человек и откуда взят факт.`,'background');
    else push(out,'ok','Бэкграунд','Есть содержательная предыстория и источник для неё.','background');

    const factText=[item.newFact,item.whyHow,item.sourceDetail,item.proof,item.commentWho,item.commentRole,item.background,item.backgroundSource].join(' ');
    const slang=findSlang(factText);
    if(slang.length){
      const fixes=slang.map(w=>`«${w}» → ${slangMap[w]}`).join('; ');
      push(out,'warn','Разговорная лексика',`Нашёл разговорные слова: ${fixes}. В рабочих заметках для себя так записать можно, но в новостном тексте нужна нейтральная информационная лексика. Лучше привыкать к ней уже на этапе фактуры.`,'language');
    }else push(out,'info','Язык фактуры','Явной разговорной лексики из базового словаря система не нашла. Это не заменяет редакторскую вычитку.','language');

    const bad=out.filter(x=>x.status==='bad').length,warn=out.filter(x=>x.status==='warn').length;
    let verdict,desc,ready;
    if(bad){verdict='Фактура пока не готова';desc='Есть критическое противоречие или нарушение, из-за которого нельзя переходить к написанию новости.';ready=false}
    else if(warn>=2){verdict='Фактуру нужно доработать';desc='Поля заполнены, но несколько элементов пока нельзя считать качественно собранной фактурой.';ready=true}
    else if(warn===1){verdict='Можно писать после уточнения';desc='Критических проблем нет, но один элемент лучше поправить до текста.';ready=true}
    else{verdict='Фактура собрана';desc='Обязательные элементы не противоречат друг другу. Дальше качество будет проверяться уже на тексте заметки.';ready=true}
    return{out,bad,warn,verdict,desc,ready};
  }

  function hideLegacyReview(screen){
    screen.querySelectorAll('.own137Review').forEach(el=>{const section=el.closest('.own137Section');if(section)section.style.display='none'});
    screen.querySelectorAll('.own137Verdict').forEach(el=>{const section=el.closest('.own137Section');if(section)section.style.display='none'});
  }
  function renderFactReview(){
    const screen=document.getElementById('newsOwn137'),item=activeItem();if(!screen||!item)return;syncFacts(item);hideLegacyReview(screen);
    const r=analyzeFacts(item);let panel=screen.querySelector('#fact140Review');if(!panel){panel=document.createElement('div');panel.id='fact140Review';const actions=screen.querySelector('.own137Actions');(actions||screen.lastElementChild)?.after(panel)}
    panel.innerHTML=`<div class="fact140Panel"><h2>Проверка фактуры</h2><div class="fact140Lead">Зелёный здесь означает не «поле заполнено», а «система не видит явного противоречия по этому критерию». Там, где смысл нельзя проверить надёжно, будет подсказка, а не автоматическое одобрение.</div>${r.out.map(x=>`<div class="fact140Item ${x.status}"><b>${x.status==='ok'?'✓':x.status==='bad'?'✕':x.status==='warn'?'→':'i'} ${safe(x.title)}</b><span>${safe(x.text)}</span></div>`).join('')}<div class="fact140Verdict"><div class="meta">Вердикт</div><h3>${safe(r.verdict)}</h3><p>${safe(r.desc)}</p></div><div class="fact140Actions">${r.ready?'<button type="button" class="btn" data-fact140-editor>Перейти к расширенной заметке →</button>':''}<button type="button" class="btn secondary" data-fact140-save>Сохранить фактуру</button></div><div class="fact140Tiny">Эта проверка оценивает готовность фактуры, а не «качество новости целиком». Заголовок, лид, тело, комментарий и бэкграунд проходят отдельный редакторский разбор после написания.</div></div>`;
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function latestReviewKey(){
    const entries=Object.entries(state.v138NewsReviews?.byWork||{});if(!entries.length)return null;entries.sort((a,b)=>new Date(b[1]?.at||0)-new Date(a[1]?.at||0));return entries[0][0];
  }
  function draftByKey(key){
    if(!key)return null;const [kind,id]=key.split(':');if(kind==='own'){const item=(state.v137OwnNews?.items||[]).find(x=>String(x.id)===id);return item?.draft||null}return state.v136News?.practice?.[id]||null;
  }
  function patchFinalLanguage(){
    const screen=document.getElementById('newsReview138');if(!screen||!screen.classList.contains('active'))return;const key=latestReviewKey(),d=draftByKey(key);if(!d)return;
    const text=[d.title,d.lead,d.body,d.comment,d.background].join(' '),hits=findSlang(text);let box=screen.querySelector('#lang140Final');
    if(!hits.length){if(box)box.remove();return}
    const fixes=hits.map(w=>`«${w}» → ${slangMap[w]}`).join('; ');
    if(!box){box=document.createElement('div');box.id='lang140Final';box.className='lang140Box';const verdict=screen.querySelector('.rub138Verdict');verdict?.after(box)}
    box.innerHTML=`<b>→ Доработать язык</b><span>В самом тексте заметки есть разговорная лексика: ${safe(fixes)}. Для информационной новости замените её нейтральной.</span>`;
    const verdict=screen.querySelector('.rub138Verdict'),status=verdict?.querySelector('.status'),h2=verdict?.querySelector('h2');
    if(status&&status.textContent.trim()==='Принято'){status.textContent='Доработать';if(h2)h2.textContent='Есть что поправить'}
    if(key&&state.v138NewsReviews?.byWork?.[key]){const rr=state.v138NewsReviews.byWork[key];if(rr.verdict==='Принято')rr.verdict='Доработать';rr.issues=Array.from(new Set([...(rr.issues||[]),'language']));persist()}
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-own137-review]'))setTimeout(renderFactReview,0);
    if(e.target.closest('[data-fact140-save]')){e.preventDefault();const item=activeItem();syncFacts(item);if(typeof toast==='function')toast('Фактура сохранена');return}
    if(e.target.closest('[data-fact140-editor]')){e.preventDefault();const item=activeItem(),r=analyzeFacts(item);if(!r.ready){renderFactReview();if(typeof toast==='function')toast('Сначала исправьте критические проблемы');return}const old=document.querySelector('#newsOwn137 [data-own137-editor]');if(old)old.click();return}
    if(e.target.closest('[data-own138-submit],[data-v138-builtin-submit]'))setTimeout(patchFinalLanguage,50);
  },true);
  document.addEventListener('input',e=>{if(e.target.closest('#newsOwn137')){const panel=document.querySelector('#fact140Review');if(panel)panel.remove();hideLegacyReview(document.getElementById('newsOwn137'))}});

  const reviewScreen=document.getElementById('newsReview138');if(reviewScreen)new MutationObserver(()=>requestAnimationFrame(patchFinalLanguage)).observe(reviewScreen,{childList:true,subtree:false,attributes:true,attributeFilter:['class']});
  const ownScreen=document.getElementById('newsOwn137');if(ownScreen)new MutationObserver(()=>{if(ownScreen.classList.contains('active')){const legacy=ownScreen.querySelector('.own137Review');if(legacy&&ownScreen.querySelector('#fact140Review'))hideLegacyReview(ownScreen)}}).observe(ownScreen,{childList:true,subtree:false});

  window.MMT_FACT_REVIEW={analyze:()=>{const item=activeItem();return item?analyzeFacts(item):null},render:renderFactReview};
})();
