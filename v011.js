/* MMT ДВИ v0.11 — портфолио 2.0 + стажировка 2.0 */
(function setupV011(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.11';
  document.title='MMT ДВИ — v0.11';

  state.v11Works=Array.isArray(state.v11Works)?state.v11Works:[];
  state.v11ImportedLegacy=!!state.v11ImportedLegacy;
  state.v11PortfolioDocs=state.v11PortfolioDocs&&typeof state.v11PortfolioDocs==='object'?state.v11PortfolioDocs:{gitrBio:false,gitrVideo:false,gitrAwards:false,gitrRecommendations:false};
  state.v11Outreach=Array.isArray(state.v11Outreach)?state.v11Outreach:[];
  state.v11LetterDraft=state.v11LetterDraft&&typeof state.v11LetterDraft==='object'?state.v11LetterDraft:{editorial:'',contact:'',why:'',experience:'',themes:'',portfolio:''};

  if(!state.v11ImportedLegacy){
    const legacy=Array.isArray(state.works)?state.works:[];
    legacy.forEach((w,i)=>state.v11Works.push({id:'legacy-'+Date.now()+'-'+i,title:w.title||'Работа',genre:w.genre||'не указан',kind:w.type||'учебная',published:!!w.published,media:'',link:w.link||'',proof:'',date:'',source:'legacy'}));
    state.v11ImportedLegacy=true;
    try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){}
  }

  const css=document.createElement('style');
  css.textContent=`
    .v11hero{background:var(--ink);color:#fff;border-radius:22px;padding:17px;margin:12px 0}.v11hero .meta{color:#bbb}
    .v11grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.v11metric{background:#fff;border:1px solid var(--line);border-radius:15px;padding:12px}.v11metric strong{font:700 24px Montserrat,Arial,sans-serif;display:block}.v11metric small{color:var(--soft)}
    .work11{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;margin:8px 0}.work11 .tags{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}.work11 .tags span{font-size:10px;background:var(--muted);border-radius:999px;padding:5px 7px}.work11 .workmeta{font-size:11px;color:var(--soft);line-height:1.45}
    .match11{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:9px 0}.match11.good{border-color:var(--g)}.match11.warn{border-color:#d6a238}.match11 .req{display:grid;grid-template-columns:26px 1fr;gap:8px;padding:8px 0;border-bottom:1px solid #eee}.match11 .req:last-child{border:0}.match11 .tick{width:24px;height:24px;border-radius:8px;background:var(--muted);display:grid;place-items:center;font-weight:800}.match11 .tick.ok{background:var(--gb);color:var(--g)}
    .doccheck11{display:flex;gap:9px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #eee}.doccheck11:last-child{border:0}.doccheck11 input{accent-color:var(--o);margin-top:3px}
    .stage11{display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:15px;padding:11px;margin:7px 0}.stage11 .n{width:30px;height:30px;border-radius:10px;background:var(--os);display:grid;place-items:center;font-weight:800}.stage11.done .n{background:var(--gb);color:var(--g)}
    .editorial11{background:#fff;border:1px solid var(--line);border-radius:17px;padding:13px;margin:8px 0}.editorial11 .statusline{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.editorial11 .statusline button{border:1px solid var(--line);background:var(--muted);border-radius:999px;padding:6px 8px;font-size:10px}.editorial11 .statusline button.active{background:var(--ink);color:#fff;border-color:var(--ink)}
    .letterPreview11{white-space:pre-wrap;background:#fff;border:1px solid var(--line);border-radius:17px;padding:14px;font-size:13px;line-height:1.55;margin:10px 0}.reuse11{background:var(--os);border-radius:14px;padding:11px;font-size:12px;line-height:1.45}.region11{border-left:4px solid var(--o);padding-left:11px}
    @media(max-width:370px){.v11grid{grid-template-columns:1fr}}
  `;document.head.appendChild(css);

  function appendScreen(id,html){if(document.getElementById(id))return document.getElementById(id);const s=document.createElement('section');s.id=id;s.className='screen';s.innerHTML=html;document.querySelector('main').appendChild(s);return s}
  function safe(s){return typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function unis(){return window.MMT_UNIVERSITIES||{}}
  function plannedUnis11(){return Object.values(unis()).filter(u=>!!state[u.stateKey])}

  const portfolio=document.getElementById('portfolio');
  if(portfolio&&!document.getElementById('portfolio2Entry')){const c=document.createElement('div');c.id='portfolio2Entry';c.className='card orange click';c.setAttribute('data-go','portfolio2Hub');c.innerHTML='<div class="row between"><div><h3>Портфолио 2.0</h3><p class="meta">работы → подтверждения → подбор под вуз → стажировка</p></div><span class="chev">›</span></div>';portfolio.prepend(c)}
  const prepare=document.getElementById('prepare');
  if(prepare&&!document.getElementById('internship2Entry')){const c=document.createElement('div');c.id='internship2Entry';c.className='card click';c.setAttribute('data-go','internship2Hub');c.innerHTML='<div class="row between"><div><h3>Стажировка в редакции</h3><p class="meta">выбрать редакцию → письмо → отправка → ответ → практика</p></div><span class="status o">2.0</span></div>';prepare.appendChild(c)}

  appendScreen('portfolio2Hub',`
    <div class="eye">Портфолио MMT</div><div class="row between"><div><h2>Все работы — в одном реестре</h2><p class="meta">Не отдельные папки под каждый вуз</p></div><span class="status o">v0.11</span></div>
    <div class="v11hero"><div class="meta">Принцип</div><h3>Сначала собираем доказательства практики. Потом подбираем из них нужное под конкретный ДВИ.</h3><p>Одна работа может пригодиться и для поступления, и для стажировки, и как материал для разговора на собеседовании.</p></div>
    <div class="v11grid"><div class="v11metric"><strong id="v11WorkCount">0</strong><small>работ в реестре</small></div><div class="v11metric"><strong id="v11PublishedCount">0</strong><small>опубликовано / подтверждено</small></div></div>
    <button class="btn" data-go="portfolio2Add">+ Добавить работу</button><button class="btn secondary" data-go="portfolio2Match">Подобрать под мои вузы</button><button class="btn secondary" data-go="portfolio2Guide">Как собрать и оформить портфолио</button><button class="btn secondary" data-go="internship2Hub">Перейти к стажировке</button>
    <div id="v11WorksList"></div>`);

  appendScreen('portfolio2Add',`
    <div class="eye">Портфолио · новая работа</div><h2>Добавить материал</h2><p class="sub">Файл необязателен для прототипа. Важно описать работу так, чтобы потом её можно было отобрать под вуз или редакцию.</p>
    <div class="label">Название</div><input id="v11WorkTitle" class="input" placeholder="Например: репортаж с книжной ярмарки">
    <div class="v11grid"><div><div class="label">Жанр</div><select id="v11WorkGenre" class="select"><option>новость</option><option>репортаж</option><option>интервью</option><option>видеосюжет</option><option>большая статья</option><option>подкаст</option><option>другое</option></select></div><div><div class="label">Тип</div><select id="v11WorkKind" class="select"><option value="учебная">учебная работа MMT</option><option value="СМИ">публикация в СМИ</option><option value="авторская">авторский проект</option><option value="институциональная">институциональный / бренд-медиа материал</option></select></div></div>
    <label class="check"><input id="v11WorkPublished" type="checkbox"><span><b>Опубликовано / вышло в эфир</b><br><span class="meta">Отдельно от учебной работы.</span></span></label>
    <div class="label">Редакция / площадка</div><input id="v11WorkMedia" class="input" placeholder="Если есть">
    <div class="label">Ссылка</div><input id="v11WorkLink" class="input" placeholder="https://...">
    <div class="label">Подтверждение</div><input id="v11WorkProof" class="input" placeholder="Ссылка, справка, письмо редактора, скрин — пока текстом">
    <div class="label">Дата</div><input id="v11WorkDate" class="input" type="date">
    <button class="btn" onclick="addV11Work()">Сохранить работу</button>`);

  appendScreen('portfolio2Match',`
    <div class="eye">Портфолио · цели</div><h2>Что пригодится моим вузам</h2><p class="sub">Здесь мы не придумываем официальные требования. Показываем только то, что уже известно в текущей модели, и отдельно — рекомендации MMT.</p><div id="v11PortfolioMatches"></div>`);

  appendScreen('portfolio2Guide',`
    <div class="eye">Портфолио · оформление</div><h2>Не просто собрать файлы — сделать их понятными комиссии</h2>
    <div class="card"><div class="stage11"><div class="n">1</div><div><b>Разделить материалы</b><div class="meta">публикации в СМИ · авторские/учебные работы · дипломы и подтверждения</div></div></div><div class="stage11"><div class="n">2</div><div><b>Для каждой работы дать контекст</b><div class="meta">название · жанр · дата · площадка · ваша роль · ссылка/подтверждение</div></div></div><div class="stage11"><div class="n">3</div><div><b>Отобрать под конкретный вуз</b><div class="meta">не отправлять всё накопленное, если программа требует другое</div></div></div><div class="stage11"><div class="n">4</div><div><b>Проверить доступность ссылок</b><div class="meta">облачные файлы, видео, публикации и права доступа</div></div></div><div class="stage11"><div class="n">5</div><div><b>Сделать резервную копию</b><div class="meta">PDF/папка + облачное хранение; конкретный формат зависит от требований вуза</div></div></div></div>
    <div class="notice">Позже здесь появится экспорт итогового портфолио/PDF. Сначала нужно стабилизировать требования конкретных вузов и правила отбора работ.</div>`);

  appendScreen('internship2Hub',`
    <div class="eye">Практика MMT</div><h2>Стажировка: от медиасреды к редакции</h2>
    <div class="v11hero"><div class="meta">Цель</div><h3>Не массовая рассылка. Осмысленный выход в редакции, которые вы уже знаете и читаете.</h3><p>Региональные СМИ из медиасреды особенно полезны: они одновременно расширяют кругозор и становятся кандидатами для первой практики.</p></div>
    <div id="v11RegionHint"></div>
    <div class="card"><div class="stage11"><div class="n">1</div><div><b>Выбрать редакцию</b><div class="meta">интересна вам и подходит по городу/теме</div></div></div><div class="stage11"><div class="n">2</div><div><b>Изучить её материалы</b><div class="meta">чтобы письмо не было безличным</div></div></div><div class="stage11"><div class="n">3</div><div><b>Подготовить персональное письмо</b><div class="meta">кто вы · что уже умеете · почему именно эта редакция · портфолио</div></div></div><div class="stage11"><div class="n">4</div><div><b>Отправить и зафиксировать статус</b><div class="meta">написал → ответили → договорились</div></div></div></div>
    <button class="btn" data-go="internship2Letter">Подготовить письмо</button><button class="btn secondary" data-go="internship2Tracker">Редакции и статусы</button><button class="btn secondary" data-go="portfolio2Hub">Проверить портфолио</button>`);

  appendScreen('internship2Letter',`
    <div class="eye">Стажировка · письмо</div><h2>Персональное обращение</h2><p class="sub">Прототип помогает собрать структуру. Финальное письмо должно звучать как конкретный человек, а не шаблонная массовая рассылка.</p>
    <div class="label">Редакция</div><input id="v11LetterEditorial" class="input" placeholder="Название редакции">
    <div class="label">Кому пишем</div><input id="v11LetterContact" class="input" placeholder="Редактор / имя, если известно">
    <div class="label">Почему именно эта редакция</div><textarea id="v11LetterWhy" class="textarea" style="min-height:100px" placeholder="Что вы читаете, какая рубрика/тема вам близка..."></textarea>
    <div class="label">Что уже умеете</div><textarea id="v11LetterExperience" class="textarea" style="min-height:100px" placeholder="Новости, репортаж, интервью, видео, практика..."></textarea>
    <div class="label">Какие темы готовы предложить</div><textarea id="v11LetterThemes" class="textarea" style="min-height:90px"></textarea>
    <div class="label">Портфолио</div><input id="v11LetterPortfolio" class="input" placeholder="Ссылка на папку/подборку">
    <button class="btn" onclick="buildV11Letter()">Собрать черновик</button><div id="v11LetterPreview"></div>`);

  appendScreen('internship2Tracker',`
    <div class="eye">Стажировка · трекер</div><div class="row between"><div><h2>Редакции</h2><p class="meta">от интереса до договорённости</p></div><span id="v11OutreachCount" class="status o">0</span></div>
    <div class="card"><h3>Добавить редакцию</h3><input id="v11EditorialName" class="input" placeholder="Название"><input id="v11EditorialCity" class="input" placeholder="Город"><input id="v11EditorialContact" class="input" placeholder="Контакт / e-mail / Telegram"><button class="btn" onclick="addV11Editorial()">Добавить</button></div><div id="v11OutreachList"></div>`);

  window.addV11Work=function(){
    const title=(document.getElementById('v11WorkTitle')?.value||'').trim();if(!title){toast('Введите название работы');return}
    const w={id:'w11-'+Date.now(),title,genre:document.getElementById('v11WorkGenre')?.value||'другое',kind:document.getElementById('v11WorkKind')?.value||'учебная',published:!!document.getElementById('v11WorkPublished')?.checked,media:(document.getElementById('v11WorkMedia')?.value||'').trim(),link:(document.getElementById('v11WorkLink')?.value||'').trim(),proof:(document.getElementById('v11WorkProof')?.value||'').trim(),date:document.getElementById('v11WorkDate')?.value||'',source:'v11'};
    state.v11Works.push(w);saveState();toast('Работа добавлена в реестр');go('portfolio2Hub');
  };
  window.deleteV11Work=function(id){state.v11Works=state.v11Works.filter(w=>w.id!==id);saveState();toast('Работа удалена из реестра')};
  window.toggleV11Doc=function(key,on){state.v11PortfolioDocs[key]=!!on;saveState()};

  window.buildV11Letter=function(){
    const d={editorial:(document.getElementById('v11LetterEditorial')?.value||'').trim(),contact:(document.getElementById('v11LetterContact')?.value||'').trim(),why:(document.getElementById('v11LetterWhy')?.value||'').trim(),experience:(document.getElementById('v11LetterExperience')?.value||'').trim(),themes:(document.getElementById('v11LetterThemes')?.value||'').trim(),portfolio:(document.getElementById('v11LetterPortfolio')?.value||'').trim()};
    if(!d.editorial||!d.why||!d.experience){toast('Заполните редакцию, мотивацию и опыт');return}state.v11LetterDraft=d;saveState();renderV11Letter();
  };
  window.saveV11LetterToTracker=function(){const d=state.v11LetterDraft;if(!d.editorial)return;const existing=state.v11Outreach.find(x=>x.name.toLowerCase()===d.editorial.toLowerCase());if(!existing)state.v11Outreach.push({id:'ed-'+Date.now(),name:d.editorial,city:state.mediaDiet?.region||'',contact:d.contact||'',status:'планирую',note:'Черновик письма подготовлен'});saveState();toast('Редакция добавлена в трекер');go('internship2Tracker')};
  window.addV11Editorial=function(){const name=(document.getElementById('v11EditorialName')?.value||'').trim();if(!name){toast('Введите название редакции');return}state.v11Outreach.push({id:'ed-'+Date.now(),name,city:(document.getElementById('v11EditorialCity')?.value||'').trim(),contact:(document.getElementById('v11EditorialContact')?.value||'').trim(),status:'планирую',note:''});saveState();toast('Редакция добавлена')};
  window.setV11EditorialStatus=function(id,status){const e=state.v11Outreach.find(x=>x.id===id);if(e){e.status=status;saveState()}};
  window.deleteV11Editorial=function(id){state.v11Outreach=state.v11Outreach.filter(x=>x.id!==id);saveState()};

  function renderV11Works(){const box=document.getElementById('v11WorksList');if(!box)return;const a=state.v11Works||[];const pub=a.filter(w=>w.published||w.kind==='СМИ').length;const wc=document.getElementById('v11WorkCount');if(wc)wc.textContent=a.length;const pc=document.getElementById('v11PublishedCount');if(pc)pc.textContent=pub;if(!a.length){box.innerHTML='<div class="empty10">Работ пока нет. Добавьте первую учебную или опубликованную работу.</div>';return}box.innerHTML=a.slice().reverse().map(w=>`<div class="work11"><div class="row between"><div><b>${safe(w.title)}</b><div class="workmeta">${safe(w.media||'площадка не указана')}${w.date?' · '+safe(w.date):''}</div></div><span class="status ${w.published?'g':'y'}">${w.published?'опубликовано':'в портфолио'}</span></div><div class="tags"><span>${safe(w.genre)}</span><span>${safe(w.kind)}</span>${w.proof?'<span>есть подтверждение</span>':''}</div><div class="workmeta">${w.link?safe(w.link):'ссылка не добавлена'}</div><button class="btn small secondary" onclick="deleteV11Work('${safe(w.id)}')">Удалить</button></div>`).join('')}

  function renderV11Matches(){const box=document.getElementById('v11PortfolioMatches');if(!box)return;const planned=plannedUnis11();if(!planned.length){box.innerHTML='<div class="card yellow"><h3>Сначала добавьте вуз в план</h3><p>Тогда приложение сможет показать, где портфолио вообще участвует в поступлении.</p><button class="btn secondary" data-go="uniCatalog">К каталогу вузов</button></div>';return}const works=state.v11Works||[];box.innerHTML=planned.map(u=>{
      if(!u.portfolio)return `<div class="match11"><div class="row between"><h3>${safe(u.title)}</h3><span class="status y">в текущей модели</span></div><p>Отдельное требование к портфолио сейчас не зафиксировано. Работы всё равно полезны для собеседования, стажировки и общей подготовки.</p></div>`;
      if(u.id==='gitr'){const anyJournalism=works.some(w=>['новость','репортаж','интервью','видеосюжет','большая статья','подкаст'].includes(w.genre));return `<div class="match11 ${anyJournalism&&state.v11PortfolioDocs.gitrBio&&state.v11PortfolioDocs.gitrVideo?'good':'warn'}"><div class="row between"><div><h3>ГИТР</h3><p class="meta">творческая папка · программа 2026</p></div><span class="status o">по известной структуре</span></div><div class="req"><div class="tick ${anyJournalism?'ok':''}">${anyJournalism?'✓':'!'}</div><div><b>Собственные журналистские материалы</b><div class="meta">В реестре: ${works.length}. Подбор качества и состава ещё требует методической ревизии.</div></div></div><label class="doccheck11"><input type="checkbox" ${state.v11PortfolioDocs.gitrBio?'checked':''} onchange="toggleV11Doc('gitrBio',this.checked)"><span><b>Автобиография</b></span></label><label class="doccheck11"><input type="checkbox" ${state.v11PortfolioDocs.gitrVideo?'checked':''} onchange="toggleV11Doc('gitrVideo',this.checked)"><span><b>Видеовизитка</b></span></label><label class="doccheck11"><input type="checkbox" ${state.v11PortfolioDocs.gitrAwards?'checked':''} onchange="toggleV11Doc('gitrAwards',this.checked)"><span><b>Дипломы / грамоты — при наличии</b></span></label><label class="doccheck11"><input type="checkbox" ${state.v11PortfolioDocs.gitrRecommendations?'checked':''} onchange="toggleV11Doc('gitrRecommendations',this.checked)"><span><b>Характеристика / рекомендации — при наличии</b></span></label></div>`}
      if(u.id==='spbgikit'){const published=works.filter(w=>w.published).length;return `<div class="match11"><div class="row between"><div><h3>СПбГИКиТ</h3><p class="meta">творческая папка / портфолио</p></div><span class="status o">подбор MMT</span></div><p>В реестре ${works.length} работ, опубликованных/вышедших — ${published}. Здесь пока не ставим «готово на 73%»: точный отбор и лимиты должны опираться на актуальную программу кампании.</p><div class="reuse11"><b>Что уже можем делать:</b> отбирать разнообразные сильные работы, отделять публикации от учебных материалов и проверять наличие ссылок/подтверждений.</div></div>`}
      return `<div class="match11"><h3>${safe(u.title)}</h3><p>Портфолио участвует в модели, но правила отбора ещё нужно заполнить.</p></div>`}).join('')}

  function renderV11Letter(){const box=document.getElementById('v11LetterPreview');if(!box)return;const d=state.v11LetterDraft||{};['Editorial','Contact','Why','Experience','Themes','Portfolio'].forEach(k=>{const el=document.getElementById('v11Letter'+k);const key=k.charAt(0).toLowerCase()+k.slice(1);if(el&&!el.value&&d[key])el.value=d[key]});if(!d.editorial){box.innerHTML='';return}const greeting=d.contact?`Здравствуйте, ${safe(d.contact)}!`:'Здравствуйте!';const preview=`${greeting}\n\nМеня зовут [имя]. Я готовлюсь к поступлению на журналистику и хотел(а) бы попробовать себя в работе редакции «${safe(d.editorial)}».\n\nПочему обращаюсь именно к вам: ${safe(d.why)}\n\nЧто уже умею и делал(а): ${safe(d.experience)}${d.themes?`\n\nТемы, с которыми готов(а) поработать: ${safe(d.themes)}`:''}${d.portfolio?`\n\nПортфолио: ${safe(d.portfolio)}`:''}\n\nБуду благодарен(на), если вы подскажете, возможна ли у вас стажировка, практика или выполнение тестового задания.`;box.innerHTML=`<div class="label">Черновик структуры</div><div class="letterPreview11">${preview}</div><div class="notice">Это не финальный универсальный шаблон для массовой рассылки. Перед отправкой текст нужно персонализировать под конкретную редакцию.</div><button class="btn secondary" onclick="saveV11LetterToTracker()">Добавить редакцию в трекер</button>`}

  function renderV11Region(){const box=document.getElementById('v11RegionHint');if(!box)return;const region=(state.mediaDiet?.region||'').trim();const media=Array.isArray(state.mediaDiet?.media)?state.mediaDiet.media:[];if(region)box.innerHTML=`<div class="card region11"><h3>Ваш региональный контур: ${safe(region)}</h3><p>Вы уже формировали медиасреду для поступления. Теперь проверьте, какие местные редакции из неё подходят для стажировки.</p>${media.length?`<div class="uniTags10">${media.slice(0,5).map(x=>`<span>${safe(x)}</span>`).join('')}</div>`:''}<button class="btn secondary" data-go="internship2Tracker">Добавить редакции в трекер</button></div>`;else box.innerHTML='<div class="reuse11"><b>Связь с медиасредой:</b> если вы добавите регион на шаге «Мой регион», местные СМИ можно будет переиспользовать здесь как кандидатов для практики.</div>'}

  function renderV11Outreach(){const box=document.getElementById('v11OutreachList');if(!box)return;const a=state.v11Outreach||[];const cnt=document.getElementById('v11OutreachCount');if(cnt)cnt.textContent=a.length;if(!a.length){box.innerHTML='<div class="empty10">Редакций пока нет. Начните с тех, которые реально читаете или нашли в региональной медиакарте.</div>';return}const statuses=['планирую','письмо готово','отправлено','ответили','договорились'];box.innerHTML=a.slice().reverse().map(e=>`<div class="editorial11"><div class="row between"><div><b>${safe(e.name)}</b><div class="meta">${safe(e.city||'город не указан')}${e.contact?' · '+safe(e.contact):''}</div></div><button class="btn small secondary" onclick="deleteV11Editorial('${safe(e.id)}')">×</button></div><div class="statusline">${statuses.map(s=>`<button class="${e.status===s?'active':''}" onclick="setV11EditorialStatus('${safe(e.id)}','${s}')">${s}</button>`).join('')}</div>${e.note?`<p class="meta">${safe(e.note)}</p>`:''}</div>`).join('')}

  function renderV11(){renderV11Works();renderV11Matches();renderV11Letter();renderV11Region();renderV11Outreach()}
  const oldRefresh=window.refresh;if(typeof oldRefresh==='function'){window.refresh=function(){oldRefresh();renderV11()}}
  renderV11();
})();
