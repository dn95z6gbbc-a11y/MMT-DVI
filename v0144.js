/* MMT ДВИ v0.14.4 — robust Cloudflare Workers AI client */
(function setupV0144(){
  const ENDPOINT='https://mmt-dvi-review.mushkovmedia.workers.dev/';
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.14.4';
  document.title='MMT ДВИ — v0.14.4';
  window.MMT_CONFIG=Object.assign({},window.MMT_CONFIG||{},{aiReviewEndpoint:ENDPOINT});

  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){}};
  state.v144AiReviews=state.v144AiReviews&&typeof state.v144AiReviews==='object'?state.v144AiReviews:{};

  function activeItem(){return (state.v137OwnNews?.items||[]).find(x=>String(x.id)===String(state.v137OwnNews?.activeId))||null}
  function field(id,fallback=''){const el=document.getElementById(id);return el?String(el.value||'').trim():String(fallback||'').trim()}

  function ensurePanel(){
    const screen=document.getElementById('newsOwn137');if(!screen)return null;
    let p=screen.querySelector('#ai142Panel');
    if(p)return p;
    const anchor=screen.querySelector('#hon141Panel');if(!anchor)return null;
    p=document.createElement('div');p.id='ai142Panel';p.className='ai142Panel';anchor.after(p);return p;
  }

  function buildPacket(){
    const item=activeItem();if(!item)return null;
    const old=state.v141SemanticPackets?.[item.id]||{};
    return {
      schema:'mmt-news-semantic-review-v1',
      createdAt:new Date().toISOString(),
      workId:item.id,
      facts:{
        eventStatus:item.eventStatus||'',
        workingTitle:field('own137-name',item.name),
        newFact:field('own137-newFact',item.newFact),
        who:field('own137-who',item.who),
        where:field('own137-where',item.where),
        when:field('own137-when',item.when),
        whyHow:field('own137-whyHow',item.whyHow),
        sourceType:item.sourceType||'',
        sourceDetail:field('own137-sourceDetail',item.sourceDetail),
        proof:field('own137-proof',item.proof),
        commentWho:field('own137-commentWho',item.commentWho),
        commentRole:field('own137-commentRole',item.commentRole),
        conflict:item.conflict||'no',
        secondSide:field('own137-secondSide',item.secondSide),
        background:field('own137-background',item.background),
        backgroundSource:field('own137-backgroundSource',item.backgroundSource)
      },
      formal:old.formal&&typeof old.formal==='object'?old.formal:{blockers:[],missing:[]}
    };
  }

  function verdictClass(v){return v==='нельзя использовать как есть'?'stop':v==='нужно дособрать'?'work':''}
  function renderConnected(){
    const p=ensurePanel();if(!p)return;
    if((p.textContent||'').trim())return;
    p.innerHTML='<div class="meta">Смысловая проверка</div><h2>Редакторский разбор</h2><div class="ai142State wait"><b>AI-редактор подключён.</b><br>Нажмите «Проверить фактуру», чтобы отправить всю карточку на смысловой разбор.</div>';
  }
  function renderLoading(){
    const p=ensurePanel();if(!p)return;
    p.innerHTML='<div class="meta">Смысловая проверка</div><h2>Редакторский разбор</h2><div class="ai142State loading"><span class="ai142Spinner"></span><b>Редактор читает всю карточку целиком…</b><br>После калибровки подробный разбор может занять до полутора минут. Проверяем логику фактуры, источник, слухи и предположения, комментарий, бэкграунд и язык.</div>';
    try{p.scrollIntoView({behavior:'smooth',block:'nearest'})}catch(e){}
  }
  function renderError(message){
    const p=ensurePanel();if(!p)return;
    p.innerHTML=`<div class="meta">Смысловая проверка</div><h2>Редакторский разбор</h2><div class="ai142State error"><b>Не удалось получить смысловой разбор.</b><br>${safe(message||'Попробуйте ещё раз.')}</div><div class="ai142Actions"><button class="btn" type="button" data-ai144-retry>Повторить AI-проверку</button></div>`;
  }
  function renderResult(review,meta={}){
    const p=ensurePanel();if(!p)return;
    const issues=Array.isArray(review?.issues)?review.issues:[];
    const strengths=Array.isArray(review?.strengths)?review.strengths.filter(Boolean):[];
    const questions=Array.isArray(review?.questionsForStudent)?review.questionsForStudent.filter(Boolean):[];
    p.innerHTML=`<div class="meta">Смысловая проверка · AI</div><h2>Редакторский разбор</h2><p class="ai142Intro">Это смысловая редакторская проверка всей карточки, а не проверка заполненности полей.</p><div class="ai142Verdict ${verdictClass(review?.verdict)}"><div class="meta">Вердикт</div><h3>${safe(review?.verdict||'Нужно проверить')}</h3><p>${safe(review?.summary||'Разбор получен.')}</p></div>${issues.length?issues.map(i=>`<div class="ai142Issue ${['critical','important','note'].includes(i?.severity)?i.severity:'note'}"><span class="tag">${safe(i?.criterion||'редакторская проверка')}</span><h4>${safe(i?.problem||'Нужно проверить')}</h4><dl><dt>Почему это проблема</dt><dd>${safe(i?.why||'—')}</dd><dt>Что проверить</dt><dd>${safe(i?.whatToVerify||'—')}</dd><dt>Что сделать дальше</dt><dd>${safe(i?.nextAction||'—')}</dd></dl></div>`).join(''):'<div class="ai142State wait">Модель не перечислила отдельных смысловых проблем. Это не подтверждает достоверность фактов: их всё равно нужно проверять у источников.</div>'}${strengths.length?`<div class="ai142Good"><b>Что уже работает</b><ul>${strengths.map(x=>`<li>${safe(x)}</li>`).join('')}</ul></div>`:''}${questions.length?`<div class="ai142Questions"><b>Что редактор спросил бы у вас</b><ul>${questions.map(x=>`<li>${safe(x)}</li>`).join('')}</ul></div>`:''}<div class="ai142Actions"><button class="btn secondary" type="button" data-ai144-retry>Проверить смысл ещё раз</button></div><div class="ai142Meta">AI не подтверждает реальность события и не заменяет проверку источников.${meta?.modelVersion?' · Модель: '+safe(meta.modelVersion):''}</div>`;
  }

  async function run(){
    if(window.MMT_AI_144_IN_FLIGHT)return;
    const item=activeItem();const packet=buildPacket();
    if(!item||!packet){renderError('Не удалось собрать текущую карточку фактуры.');window.MMT_AI_REVIEW_IN_FLIGHT=false;return}
    window.MMT_AI_144_IN_FLIGHT=true;renderLoading();
    try{
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
      const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({packet}),signal:controller.signal,cache:'no-store'});clearTimeout(timer);
      let data=null;try{data=await r.json()}catch(e){}
      if(!r.ok||!data?.ok||!data?.review)throw new Error(data?.message||data?.error||`Ошибка сервера ${r.status}`);
      state.v144AiReviews[item.id]={at:new Date().toISOString(),review:data.review,meta:data.meta||{}};persist();
      renderResult(data.review,data.meta||{});
    }catch(e){
      const msg=e?.name==='AbortError'?'AI-проверка не успела завершиться за 90 секунд. Повторите запрос.':(e?.message||'Сетевая ошибка при обращении к AI.');
      renderError(msg);
    }finally{
      window.MMT_AI_144_IN_FLIGHT=false;
      window.MMT_AI_REVIEW_IN_FLIGHT=false;
    }
  }

  function restore(){
    const item=activeItem();if(!item){return}
    const saved=state.v144AiReviews?.[item.id];
    if(saved?.review)renderResult(saved.review,saved.meta||{});else renderConnected();
  }

  /* Capture before v0.14.2: let old formal handlers work, but block its AI request. */
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.matches('[data-ai144-retry]')){e.preventDefault();e.stopPropagation();setTimeout(run,30);return}
    if(btn.closest('#newsOwn137')&&/проверить\s+фактуру/i.test(btn.textContent||'')){
      window.MMT_AI_REVIEW_IN_FLIGHT=true;
      setTimeout(()=>{ensurePanel();run()},420);
    }
  },true);

  const screen=document.getElementById('newsOwn137');
  if(screen)new MutationObserver(()=>requestAnimationFrame(()=>{if(screen.classList.contains('active'))restore()})).observe(screen,{childList:true,subtree:false});
  window.addEventListener('mmt:ready',()=>setTimeout(restore,100));
  setTimeout(restore,200);
  window.MMT_AI_REVIEW_V144={run,restore,buildPacket,endpoint:ENDPOINT};
})();
