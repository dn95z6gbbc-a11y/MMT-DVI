/* MMT ДВИ v0.13.8 — MMT editorial rubric for expanded news notes */
(function setupV0138(){
  const main=document.querySelector('main');if(!main)return;
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.8';
  document.title='MMT ДВИ — v0.13.8';

  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.13.8] persist failed',e)}};
  const go=id=>{if(typeof window.go==='function')window.go(id);else{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id)?.classList.add('active')}window.scrollTo({top:0,behavior:'auto'})};
  const ensureScreen=id=>{let s=document.getElementById(id);if(!s){s=document.createElement('section');s.id=id;s.className='screen';main.appendChild(s)}return s};

  state.v138NewsReviews=state.v138NewsReviews&&typeof state.v138NewsReviews==='object'?state.v138NewsReviews:{byWork:{}};
  state.v138NewsReviews.byWork=state.v138NewsReviews.byWork||{};

  const css=document.createElement('style');css.id='mmt-v0138-css';css.textContent=`
    .rub138Hero{background:#0c0c0c;color:#fff;border-radius:22px;padding:17px;margin:10px 0}.rub138Hero .meta{color:#bbb}.rub138Hero h2{font-size:27px;margin:5px 0 7px}.rub138Hero p{font-size:12px;line-height:1.5;color:#d1d1d1}
    .rub138Card{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;margin:8px 0}.rub138Card h3{font-size:16px;margin:0 0 5px}.rub138Card p{font-size:11px;line-height:1.45;color:var(--soft);margin:4px 0}.rub138Card b{font-size:12px}.rub138Num{width:27px;height:27px;display:grid;place-items:center;border-radius:9px;background:var(--muted);font-size:11px;font-weight:800;flex:0 0 auto}
    .rub138Result{border-radius:17px;padding:13px;margin:8px 0}.rub138Result.ok{background:#edf7ed;border:1px solid #a8c9a8}.rub138Result.warn{background:var(--os);border:1px solid #efc1a9}.rub138Result.bad{background:#faeded;border:1px solid #d6aaaa}.rub138Result.info{background:var(--muted);border:1px solid var(--line)}.rub138Result b{display:block;font-size:12px}.rub138Result span{display:block;font-size:11px;line-height:1.42;margin-top:4px}
    .rub138Verdict{background:#0c0c0c;color:#fff;border-radius:19px;padding:15px;margin:11px 0}.rub138Verdict h2{font-size:25px;margin:4px 0 7px}.rub138Verdict p{font-size:11px;line-height:1.45;color:#d0d0d0}.rub138Verdict .status{display:inline-block;background:var(--o);color:#0c0c0c;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:800}
    .rub138Actions{display:grid;gap:7px;margin:12px 0}.rub138Actions .btn{margin:0}.rub138Note{background:var(--os);border-radius:14px;padding:11px;margin:9px 0;font-size:11px;line-height:1.45}.rub138Source{font-size:10px;color:var(--soft);line-height:1.4;margin:10px 2px}.rub138Hub{background:#fff;border:2px solid var(--o);border-radius:18px;padding:14px;margin:13px 0}.rub138Hub h3{font-size:18px;margin:3px 0 6px}.rub138Hub p{font-size:11px;line-height:1.45;color:var(--soft)}.rub138Repeat{background:var(--muted);border-radius:12px;padding:9px 10px;margin:8px 0;font-size:10px;line-height:1.4}.rub138Verify{background:#fff;border:2px solid var(--o);border-radius:17px;padding:13px;margin:10px 0}.rub138Verify label{display:flex;gap:8px;align-items:flex-start;font-size:11px;line-height:1.4;margin:8px 0}.rub138Verify input{margin-top:2px;accent-color:var(--o)}.rub138TypeBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.rub138TypeBtn{border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 8px;font-size:11px;color:var(--ink)}.rub138TypeBtn.active{border:2px solid var(--o);background:var(--os);font-weight:800}.rub138TypeAnswer{font-size:10px;line-height:1.4;margin-top:8px;color:var(--soft)}
  `;document.head.appendChild(css);

  const rubricScreen=ensureScreen('newsRubric138');
  const reviewScreen=ensureScreen('newsReview138');
  let reviewContext={kind:null,id:null};

  const RUBRIC=[
    ['Тип материала','Новость рассказывает о том, что уже произошло. То, что только состоится, — анонс. Для базовой тренировки эти форматы не смешиваем.'],
    ['Информационный заголовок','Короткое изъявительное предложение: кто/что сделал. Базовый ориентир — глагол завершённого действия, активный залог, без игры слов и авторской оценки.'],
    ['Лид','Кто? Что? Где? Когда? + краткий итог. Источник информации называем уже в лиде. Причину и подробную предысторию туда не заталкиваем.'],
    ['Тело новости','Пятый и шестой вопросы: почему? как? Здесь же новая фактура, детали, цифры и развитие события. Причина события и его предыстория — не одно и то же.'],
    ['Комментарий','В учебной расширенной новости комментарий обязателен и должен добавлять новую информацию. В своей новости его получают реально. Если используем прямую цитату — не переписываем её за героя.'],
    ['Бэкграунд','Только релевантная предыстория именно этого события. Фраза «раньше такого не было» сама по себе бэкграундом не является.'],
    ['Источники и баланс','Факты проверены и атрибутированы. Пресс-релиз сам по себе ещё не инфоповод. В конфликтной истории обязательна вторая сторона или честное указание, что её комментарий запрошен.'],
    ['Язык и нейтральность','Авторской позиции и оценочной лексики нет. Простой информационный стиль, активные глаголы, без канцелярита, штампов, лишних повторов и неоправданно длинных предложений.']
  ];

  const futureRe=/(^|\s)(будет|будут|состоится|пройд[её]т|планирует|планируют|намерен|намерена|намерены|ожидается|запланирован[аоы]?)(\s|$)/i;
  const sourceRe=/(сообщил[аи]?|сообщили|заявил[аи]?|заявили|рассказал[аи]?|рассказали|сказал[аи]?|сказали|по данным|по информации|говорится в|следует из|пресс-служб|уточнил[аи]?|уточнили|отметил[аи]?|отметили|переда[её]т|пишет)/i;
  const pastVerbRe=/(открыл[аи]?|пров[её]л|провела|провели|запустил[аи]?|запустили|принял[аи]?|приняли|объявил[аи]?|объявили|победил[аи]?|победили|закрыл[аи]?|закрыли|начал[аи]?|начали|завершил[аи]?|завершили|подписал[аи]?|подписали|утвердил[аи]?|утвердили|приехал[аи]?|приехали|прош[её]л|прошла|прошли|состоялся|состоялась|состоялись|вв[её]л|ввела|ввели|отменил[аи]?|отменили|вырос[лаи]?|снизил[аи]?|снизился|снизилась|увеличил[аи]?|увеличили|сократил[аи]?|сократили|переш[её]л|перешла|перешли|заработал[аи]?|заработали|получил[аи]?|получили|выиграл[аи]?|выиграли)/i;
  const authorRe=/(^|[\s,.;:!?])(я считаю|я думаю|на мой взгляд|по моему мнению|нам кажется|мы считаем)([\s,.;:!?]|$)/i;
  const evalRe=/(потрясающ|замечательн|ужасн|великолепн|грандиозн|безусловно прекрасн|невероятно красив|лучший в мире|скандальн)/i;
  const bgEmptyRe=/(ранее такого не было|раньше такого не было|до этого такого не было)/i;
  const quoteRe=/[«"][^»"]{8,}[»"]/;

  function ownItem(id){return (state.v137OwnNews?.items||[]).find(x=>String(x.id)===String(id))||null}
  function activeOwn(){return ownItem(state.v137OwnNews?.activeId)}
  function builtinDraft(id){return state.v136News?.practice?.[id]||state.v136News?.practice?.[String(id)]||null}
  function workData(kind,id){
    if(kind==='own'){const item=ownItem(id);return item?{kind,id,item,draft:item.draft||{}}:null}
    const draft=builtinDraft(id);return draft?{kind:'builtin',id,draft,item:null}:null;
  }

  function push(list,key,status,title,text){list.push({key,status,title,text})}
  function analyzeWork(kind,id){
    const wd=workData(kind,id);if(!wd)return null;
    const d=wd.draft||{},item=wd.item;
    const title=(d.title||'').trim(),lead=(d.lead||'').trim(),body=(d.body||'').trim(),comment=(d.comment||'').trim(),background=(d.background||'').trim();
    const all=[title,lead,body,comment,background].join(' ');
    const out=[];

    if(kind==='own'){
      if(item.eventStatus==='future')push(out,'type','bad','Тип материала','Событие ещё не произошло. Это анонс, а не новость. Для этой практики вернитесь к материалу после события или возьмите уже состоявшийся инфоповод.');
      else if(item.eventStatus==='past')push(out,'type','ok','Тип материала','Вы работаете с уже произошедшим событием — это подходит для новостной практики.');
      else push(out,'type','warn','Тип материала','Укажите, событие уже произошло или только состоится. Новость и анонс в базовой тренировке не смешиваем.');
    }else push(out,'type','info','Тип материала','Учебный редакционный пакет считается уже произошедшим событием. В собственной практике это нужно проверять отдельно.');

    if(!title)push(out,'headline','bad','Информационный заголовок','Заголовок отсутствует.');
    else{
      if(futureRe.test(title))push(out,'headline','warn','Информационный заголовок','В заголовке виден будущий план или событие. Проверьте, не написали ли вы анонс вместо новости. В базовой новости формулируем то, что уже произошло.');
      else if(pastVerbRe.test(title))push(out,'headline','ok','Информационный заголовок','В заголовке видно завершённое действие. Теперь проверьте, действительно ли это главный факт заметки.');
      else push(out,'headline','info','Информационный заголовок','Главный факт должен быть выражен действием: кто/что сделал. Автопроверка не может надёжно определить вид каждого русского глагола, поэтому отдельно проверьте завершённость действия.');
      if(title.length>75)push(out,'headlineLength','warn','Длина заголовка','Заголовок длиннее 75 знаков. Это не автоматический провал, но попробуйте оставить только главный факт и действующее лицо.');
    }

    if(!lead)push(out,'lead','bad','Лид','Лид отсутствует.');
    else{
      push(out,'leadStructure','info','Четыре вопроса + итог','Проверьте лид вручную: кто? что? где? когда? и чем событие закончилось или к какому результату привело. Причину и подробную предысторию оставьте телу.');
      if(sourceRe.test(lead))push(out,'sourceLead','ok','Источник в лиде','В лиде есть явная атрибуция источника.');
      else push(out,'sourceLead','warn','Источник в лиде','Автопроверка не видит явной ссылки на источник. Назовите в лиде, откуда известен ключевой факт.');
    }

    if(!body)push(out,'body','bad','Тело новости','Основная часть отсутствует.');
    else push(out,'body','info','Тело новости','Проверьте, что здесь раскрыты «почему?» и «как?», а также новая фактура и детали. Не путайте непосредственную причину события с цепочкой обстоятельств, которая ему предшествовала.');

    if(!comment)push(out,'comment','bad','Комментарий','Комментарий обязателен для нашей учебной расширенной новости.');
    else if(kind==='own'&&!item.commentObtained)push(out,'commentReal','bad','Комментарий должен быть реальным','Текст комментария заполнен, но вы не подтвердили, что действительно получили его у человека. Не привыкаем выдумывать героев и цитаты даже для тренировки.');
    else push(out,'comment','ok','Комментарий','Комментарий есть. Проверьте главное: он должен сообщать новую информацию, объяснение или позицию, а не просто повторять факт и не сводиться к «мне понравилось».');

    if(comment&&quoteRe.test(comment)){
      if(kind==='own'&&!item.quoteChecked)push(out,'quote','warn','Точность прямой цитаты','В комментарии есть прямая речь, но не отмечено, что формулировка сверена с записью или точной заметкой. Если хотите заметно «причесать» речь, лучше используйте косвенный пересказ.');
      else push(out,'quote','info','Прямая цитата','Кавычки означают точную речь героя. Не меняйте смысл и формулировку за собеседника; при серьёзной редактуре переходите к косвенной речи.');
    }

    if(!background)push(out,'background','bad','Бэкграунд','Бэкграунд отсутствует.');
    else if(bgEmptyRe.test(background))push(out,'background','warn','Бэкграунд','Фраза «раньше такого не было» сама по себе ничего не объясняет. Нужна релевантная предыстория: подготовка, предыдущий этап, история проекта, объекта или участников.');
    else push(out,'background','ok','Бэкграунд','Бэкграунд заполнен. Проверьте, что он относится именно к этому событию и помогает его понять, а не просто расширяет общую тему.');

    if(kind==='own'&&item){
      if(item.sourceType==='hearsay')push(out,'source','bad','Достоверность источника','Пересказ «мне сказали» не может быть единственной основой новости. Нужен идентифицируемый источник или подтверждение.');
      else if(item.sourceType==='social')push(out,'source','warn','Проверка источника','Пост в соцсети может дать инфоповод, но значимый факт лучше подтвердить у первичного источника.');
      else if(item.sourceType&&item.sourceDetail)push(out,'source','ok','Источник фактуры','Источник фактуры указан. Не забудьте точно атрибутировать его в самой заметке.');
      else push(out,'source','warn','Источник фактуры','В карточке своего инфоповода источник указан недостаточно ясно.');
      if(item.conflict==='yes'&&!(item.secondSide||'').trim())push(out,'balance','bad','Баланс','В истории есть конфликт, но второй стороне не предоставлена возможность ответить. Это критическая проблема.');
      else if(item.conflict==='yes')push(out,'balance','ok','Баланс','Вторая сторона предусмотрена. В тексте должна быть её позиция или честное указание на попытку получить комментарий.');
    }

    if(authorRe.test(all))push(out,'neutrality','bad','Авторская позиция','В тексте обнаружена явная авторская позиция. Новостная заметка должна быть обезличенной и нейтральной.');
    else if(evalRe.test(all))push(out,'neutrality','warn','Оценочная лексика','Есть слова, похожие на авторскую оценку. Проверьте, принадлежат ли они источнику; если нет — уберите их.');
    else push(out,'neutrality','ok','Нейтральность','Явной авторской позиции автоматическая проверка не обнаружила. Всё равно перечитайте текст на предмет скрытых оценок, штампов и канцелярита.');

    const bad=out.filter(x=>x.status==='bad').length,warn=out.filter(x=>x.status==='warn').length;
    const verdict=bad?'Переписать':warn?'Доработать':'Принято';
    const summary=bad?'Нарушена обязательная конструкция или есть критическая редакционная проблема. Сначала исправьте красные пункты.':warn?'Основа собрана, но перед завершением материала нужно исправить отмеченные места.':'По тем критериям, которые можно проверить в прототипе, конструкция собрана. Содержательную точность фактов и качество журналистских решений всё равно должен подтверждать полноценный редакторский разбор.';
    return{out,bad,warn,verdict,summary,kind,id};
  }

  function saveReview(r){
    if(!r)return;
    const key=`${r.kind}:${r.id}`;
    state.v138NewsReviews.byWork[key]={at:new Date().toISOString(),verdict:r.verdict,issues:r.out.filter(x=>x.status==='bad'||x.status==='warn').map(x=>x.key)};
    persist();
  }
  function repeatedIssues(){
    const counts={};Object.values(state.v138NewsReviews.byWork||{}).forEach(r=>(r.issues||[]).forEach(k=>counts[k]=(counts[k]||0)+1));
    const labels={type:'тип материала',headline:'информационный заголовок',headlineLength:'длина заголовка',lead:'лид',sourceLead:'источник в лиде',body:'тело новости',comment:'комментарий',commentReal:'реальный комментарий',quote:'точность цитаты',background:'бэкграунд',source:'источник',balance:'баланс сторон',neutrality:'нейтральность'};
    return Object.entries(counts).filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,n])=>`${labels[k]||k} · ${n} работы`);
  }

  function renderRubric(){
    rubricScreen.innerHTML=`<div class="eye">Новости · методика MMT</div><div class="rub138Hero"><div class="meta">Без баллов и процентов</div><h2>Как мы разбираем новость</h2><p>Итог только один из трёх: «Принято», «Доработать» или «Переписать». Сначала проверяем журналистскую конструкцию, затем язык.</p></div>${RUBRIC.map((r,i)=>`<div class="rub138Card"><div style="display:flex;gap:9px;align-items:flex-start"><span class="rub138Num">${i+1}</span><div><h3>${safe(r[0])}</h3><p>${safe(r[1])}</p></div></div></div>`).join('')}<div class="rub138Note"><b>Отдельно про объём.</b><br>Жёсткого числа знаков для тренировки нет. Текст должен быть настолько длинным, насколько нужно для правильно собранной расширенной заметки — и не длиннее.</div><div class="rub138Source">Основа рубрики: методика MMT + профессиональные принципы информационного стандарта «Интерфакса». SEO-рекомендации не влияют на вердикт новости: они остаются отдельным дополнительным слоем для интернет-публикации.</div><div class="rub138Actions"><button class="btn" type="button" data-v138-hub>Вернуться к новостям</button></div>`;
  }

  function renderReview(kind,id){
    reviewContext={kind,id};
    const r=analyzeWork(kind,id);if(!r){reviewScreen.innerHTML='<h2>Работа не найдена</h2><button class="btn" data-v138-hub>К новостям</button>';go('newsReview138');return}
    saveReview(r);
    reviewScreen.innerHTML=`<div class="eye">Новости · редакторский разбор</div><div class="rub138Verdict"><span class="status">${safe(r.verdict)}</span><h2>${safe(r.verdict==='Принято'?'Конструкция собрана':r.verdict==='Доработать'?'Есть что поправить':'Нужно пересобрать материал')}</h2><p>${safe(r.summary)}</p></div>${r.out.map(x=>`<div class="rub138Result ${x.status}"><b>${x.status==='ok'?'✓':x.status==='bad'?'✕':x.status==='warn'?'→':'i'} ${safe(x.title)}</b><span>${safe(x.text)}</span></div>`).join('')}<div class="rub138Note"><b>Как работать с разбором:</b> сначала исправьте красные пункты, затем жёлтые. Не переписывайте всё «для красоты» — исправляйте конкретную журналистскую проблему и снова проверяйте текст.</div><div class="rub138Actions"><button class="btn" type="button" data-v138-back-work>Исправить работу</button><button class="btn secondary" type="button" data-v138-rubric>Открыть всю рубрику</button><button class="btn secondary" type="button" data-v138-hub>К списку новостей</button></div>`;
    go('newsReview138');
  }

  function replaceText(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{let t=n.nodeValue||'';const old=t;t=t.replace(/Заголовок-шило/g,'Информационный заголовок').replace(/заголовок-шило/g,'информационный заголовок').replace(/Заголовке-шиле/g,'Информационном заголовке').replace(/заголовке-шиле/g,'информационном заголовке').replace(/Шило:/g,'Информационный заголовок:').replace(/«шила»/g,'информационного заголовка').replace(/«шило»/g,'информационный заголовок').replace(/\bШило\b/g,'Информационный заголовок').replace(/\bшило\b/g,'информационный заголовок');if(t!==old)n.nodeValue=t});
  }

  function patchLesson(){
    const s=document.getElementById('newsLesson136');if(!s)return;replaceText(s);
    const id=s.dataset.lesson||'';
    if(id==='occasion'){
      s.querySelectorAll('*').forEach(el=>{if(el.children.length)return;let t=el.textContent||'';if(t.includes('С сентября библиотека впервые будет работать до полуночи по пятницам'))el.textContent=t.replace('С сентября библиотека впервые будет работать до полуночи по пятницам','В пятницу библиотека впервые проработала до полуночи');if(t.includes('С понедельника медиакласс впервые станет круглосуточным для студентов журфака'))el.textContent=t.replace('С понедельника медиакласс впервые станет круглосуточным для студентов журфака','В понедельник медиакласс впервые проработал круглосуточно для студентов журфака')});
      if(!s.querySelector('#rub138OccasionNote')){const d=document.createElement('div');d.id='rub138OccasionNote';d.className='rub138Note';d.innerHTML='<b>Правило MMT:</b> в этом модуле новостью считаем уже произошедшее событие. Если событие только будет — это анонс, и мы его пока не выдаём за новость.';s.querySelector('.news136LessonHead')?.after(d)}
    }
    if(id==='headline'&&!s.querySelector('#rub138HeadlineNote')){const d=document.createElement('div');d.id='rub138HeadlineNote';d.className='rub138Note';d.innerHTML='<b>Базовый информационный заголовок:</b> кто/что сделал. Для завершившегося события тренируем глагол совершённого действия в прошедшем времени. Игровые заголовки оставляем на потом.';s.querySelector('.news136LessonHead')?.after(d)}
    if(id==='leadbody'&&!s.querySelector('#rub138LeadNote')){const d=document.createElement('div');d.id='rub138LeadNote';d.className='rub138Note';d.innerHTML='<b>Формула лида MMT:</b> кто? что? где? когда? + краткий итог. Источник информации называем уже в лиде. «Почему?» и «как?» раскрываем дальше, в теле новости.';s.querySelector('.news136LessonHead')?.after(d)}
    if(id==='comment'&&!s.querySelector('#rub138CommentNote')){const d=document.createElement('div');d.id='rub138CommentNote';d.className='rub138Note';d.innerHTML='<b>Комментарий обязателен.</b> В своей новости его нужно реально получить. Прямая цитата требует точности; если речь нужно заметно редактировать, лучше пересказать её косвенно, не меняя смысл.';s.querySelector('.news136LessonHead')?.after(d)}
    if(id==='background'&&!s.querySelector('#rub138BgNote')){const d=document.createElement('div');d.id='rub138BgNote';d.className='rub138Note';d.innerHTML='<b>Бэкграунд относится именно к событию.</b> «Раньше такого не было» — ещё не бэкграунд. Ищем подготовку, предыдущий этап, историю проекта, объекта или участников.';s.querySelector('.news136LessonHead')?.after(d)}
  }

  function patchHub(){
    const h=document.getElementById('newsCourse136');if(!h)return;replaceText(h);
    if(!h.querySelector('#rub138Hub')){
      const rep=repeatedIssues();const box=document.createElement('div');box.id='rub138Hub';box.className='rub138Hub';box.innerHTML=`<div class="meta">Редакторская система MMT</div><h3>Проверка без школьных баллов</h3><p>Каждую заметку разбираем по одной рубрике: структура, источник, комментарий, бэкграунд, баланс и нейтральность.</p>${rep.length?`<div class="rub138Repeat"><b>Повторяется в работах:</b><br>${rep.map(safe).join('<br>')}</div>`:''}<button type="button" class="btn secondary" data-v138-rubric>Посмотреть рубрику</button>`;
      const firstList=h.querySelector('.news136Progress');firstList?.after(box);
    }
  }

  function patchPractice(){
    const s=document.getElementById('newsPractice136');if(!s)return;replaceText(s);
    const titleLabel=s.querySelector('label[for="news136Title"]');if(titleLabel)titleLabel.textContent='Информационный заголовок';
    const submit=s.querySelector('[data-v136-submit]');if(submit){submit.removeAttribute('data-v136-submit');submit.setAttribute('data-v138-builtin-submit','1');submit.textContent='Проверить работу по рубрике'}
    const actions=s.querySelector('.news136PracticeActions');if(actions&&!actions.querySelector('[data-v138-review-current]')){const b=document.createElement('button');b.type='button';b.className='btn secondary';b.setAttribute('data-v138-review-current','builtin');b.textContent='Посмотреть редакторскую рубрику';actions.appendChild(b)}
    if(!s.querySelector('#rub138PracticeRule')){const d=document.createElement('div');d.id='rub138PracticeRule';d.className='rub138Note';d.innerHTML='<b>Факты и комментарии не придумываем.</b> В учебном кейсе используйте только то, что есть в редакционном пакете. Если информации для красивой фразы нет — её не существует.';s.querySelector('.news136Facts')?.after(d)}
  }

  function patchOwnFacts(){
    const s=document.getElementById('newsOwn137');if(!s)return;replaceText(s);const item=activeOwn();if(!item)return;
    if(!s.querySelector('#rub138EventType')){const d=document.createElement('div');d.id='rub138EventType';d.className='rub138Verify';s.querySelector('.own137Hero')?.after(d)}
    const box=s.querySelector('#rub138EventType');if(box)box.innerHTML=`<h3>Новость или анонс?</h3><div class="rub138TypeBtns"><button type="button" class="rub138TypeBtn ${item.eventStatus==='past'?'active':''}" data-v138-event-status="past">Уже произошло</button><button type="button" class="rub138TypeBtn ${item.eventStatus==='future'?'active':''}" data-v138-event-status="future">Только будет</button></div><div class="rub138TypeAnswer">${item.eventStatus==='future'?'Это анонс. Его можно подготовить, но как выполненную новостную практику он не засчитывается.':item.eventStatus==='past'?'Подходит: дальше собираем фактуру уже произошедшего события.':'Для начала зафиксируйте статус события.'}</div>`;
  }

  function patchOwnEditor(){
    const s=document.getElementById('newsOwnEditor137');if(!s)return;replaceText(s);const item=activeOwn();if(!item)return;
    const firstLabel=s.querySelector('#own137-draft-title')?.closest('.own137Field')?.querySelector('label');if(firstLabel)firstLabel.textContent='Информационный заголовок';
    if(!s.querySelector('#rub138OwnVerify')){const d=document.createElement('div');d.id='rub138OwnVerify';d.className='rub138Verify';const actions=s.querySelector('.own137Actions');actions?.before(d)}
    const v=s.querySelector('#rub138OwnVerify');if(v)v.innerHTML=`<h3>Перед отправкой</h3><label><input type="checkbox" data-v138-comment-obtained ${item.commentObtained?'checked':''}>Я действительно получил(а) этот комментарий у указанного человека. Он не придуман для текста.</label><label><input type="checkbox" data-v138-quote-checked ${item.quoteChecked?'checked':''}>Если использую прямую цитату, я сверил(а) её с записью или точной заметкой.</label>`;
    const submit=s.querySelector('[data-own137-submit]');if(submit){submit.removeAttribute('data-own137-submit');submit.setAttribute('data-own138-submit','1');submit.textContent=item.submitted?'Сохранить и проверить снова':'Готово — проверить по рубрике'}
  }

  function patchAll(){patchHub();patchLesson();patchPractice();patchOwnFacts();patchOwnEditor()}
  ['newsCourse136','newsLesson136','newsPractice136','newsOwn137','newsOwnEditor137'].forEach(id=>{const s=document.getElementById(id);if(s)new MutationObserver(()=>requestAnimationFrame(patchAll)).observe(s,{childList:true,subtree:false})});

  function collectBuiltin(){
    const s=document.getElementById('newsPractice136'),id=Number(s?.dataset.practice||0);if(!id)return null;
    state.v136News=state.v136News||{practice:{}};state.v136News.practice=state.v136News.practice||{};const d=state.v136News.practice[id]||{};
    d.title=document.getElementById('news136Title')?.value.trim()||'';d.lead=document.getElementById('news136Lead')?.value.trim()||'';d.body=document.getElementById('news136Body')?.value.trim()||'';d.comment=document.getElementById('news136Comment')?.value.trim()||'';d.background=document.getElementById('news136Background')?.value.trim()||'';d.checks=d.checks||{};s.querySelectorAll('[data-v136-check]').forEach(c=>d.checks[c.dataset.v136Check]=c.checked);d.updatedAt=new Date().toISOString();state.v136News.practice[id]=d;persist();return{id,d};
  }
  function collectOwn(){
    const item=activeOwn();if(!item)return null;item.draft=item.draft||{checks:{}};const d=item.draft;['title','lead','body','comment','background'].forEach(k=>d[k]=document.getElementById('own137-draft-'+k)?.value.trim()||d[k]||'');d.checks=d.checks||{};document.querySelectorAll('#newsOwnEditor137 [data-own137-check]').forEach(c=>d.checks[c.dataset.own137Check]=c.checked);item.commentObtained=!!document.querySelector('#newsOwnEditor137 [data-v138-comment-obtained]')?.checked;item.quoteChecked=!!document.querySelector('#newsOwnEditor137 [data-v138-quote-checked]')?.checked;item.updatedAt=new Date().toISOString();persist();return item;
  }

  document.addEventListener('change',e=>{
    if(e.target.matches('[data-v138-comment-obtained],[data-v138-quote-checked]'))collectOwn();
  });
  document.addEventListener('click',e=>{
    const st=e.target.closest('[data-v138-event-status]');if(st){e.preventDefault();const item=activeOwn();if(item){item.eventStatus=st.dataset.v138EventStatus;persist();patchOwnFacts()}return}
    if(e.target.closest('[data-v138-rubric]')){e.preventDefault();renderRubric();go('newsRubric138');return}
    if(e.target.closest('[data-v138-hub]')){e.preventDefault();if(window.MMT_NEWS_COURSE?.render)window.MMT_NEWS_COURSE.render();go('newsCourse136');setTimeout(patchAll,0);return}
    if(e.target.closest('[data-v138-builtin-submit]')){e.preventDefault();const x=collectBuiltin();if(!x)return;const missing=[x.d.title,x.d.lead,x.d.body,x.d.comment,x.d.background].filter(v=>!v).length;if(missing){if(typeof toast==='function')toast('Заполните все пять частей заметки');return}const checks=Object.values(x.d.checks||{}).filter(Boolean).length;if(checks<5){if(typeof toast==='function')toast('Сначала пройдите самопроверку');return}x.d.submitted=true;persist();renderReview('builtin',x.id);return}
    if(e.target.closest('[data-own138-submit]')){e.preventDefault();const item=collectOwn();if(!item)return;const d=item.draft,missing=[d.title,d.lead,d.body,d.comment,d.background].filter(v=>!v).length;if(missing){if(typeof toast==='function')toast('Заполните все пять частей заметки');return}const checks=Object.values(d.checks||{}).filter(Boolean).length;if(checks<5){if(typeof toast==='function')toast('Сначала пройдите самопроверку');return}if(item.eventStatus!=='past'){if(typeof toast==='function')toast('Сначала подтвердите: событие уже произошло');return}if(!item.commentObtained){if(typeof toast==='function')toast('Для своей новости нужен реально полученный комментарий');return}item.submitted=true;persist();renderReview('own',item.id);return}
    const cur=e.target.closest('[data-v138-review-current]');if(cur){e.preventDefault();if(cur.dataset.v138ReviewCurrent==='builtin'){const x=collectBuiltin();if(x)renderReview('builtin',x.id)}else{const item=collectOwn();if(item)renderReview('own',item.id)}return}
    if(e.target.closest('[data-v138-back-work]')){e.preventDefault();if(reviewContext.kind==='own')go('newsOwnEditor137');else go('newsPractice136');setTimeout(patchAll,0);return}
  });

  renderRubric();patchAll();
  window.MMT_NEWS_RUBRIC={analyze:analyzeWork,open:()=>{renderRubric();go('newsRubric138')},review:(kind,id)=>renderReview(kind,id)};
})();
