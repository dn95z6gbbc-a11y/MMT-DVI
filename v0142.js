/* MMT ДВИ v0.14.2 — semantic AI editorial review client */
(function setupV0142(){
  const main=document.querySelector('main');if(!main)return;
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.14.2';
  document.title='MMT ДВИ — v0.14.2';

  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){}};
  state.v142AiReviews=state.v142AiReviews&&typeof state.v142AiReviews==='object'?state.v142AiReviews:{};

  const css=document.createElement('style');css.id='mmt-v0142-css';css.textContent=`
    .ai142Panel{background:#fff;border:2px solid var(--o);border-radius:20px;padding:14px;margin:12px 0}.ai142Panel h2{font-size:24px;margin:2px 0 6px}.ai142Intro{font-size:11px;line-height:1.47;color:var(--soft);margin:0 0 10px}.ai142State{border-radius:15px;padding:12px;margin:9px 0;font-size:11px;line-height:1.45}.ai142State.wait{background:var(--muted);border:1px solid var(--line)}.ai142State.loading{background:var(--os);border:1px solid #efc1a9}.ai142State.error{background:#faeded;border:1px solid #d6aaaa}.ai142Verdict{background:#0c0c0c;color:#fff;border-radius:18px;padding:14px;margin:10px 0}.ai142Verdict .meta{color:#aaa}.ai142Verdict h3{font-size:22px;margin:4px 0 6px}.ai142Verdict p{font-size:11px;line-height:1.47;color:#d0d0d0}.ai142Verdict.stop h3{color:#ffd3d3}.ai142Verdict.work h3{color:#ffd9c7}
    .ai142Issue{border-radius:15px;padding:12px;margin:8px 0}.ai142Issue.critical{background:#faeded;border:1px solid #d6aaaa}.ai142Issue.important{background:var(--os);border:1px solid #efc1a9}.ai142Issue.note{background:var(--muted);border:1px solid var(--line)}.ai142Issue .tag{display:inline-block;font-size:9px;border-radius:999px;background:#fff;padding:4px 7px;margin-bottom:6px}.ai142Issue h4{font-size:14px;margin:0 0 7px}.ai142Issue dl{margin:0}.ai142Issue dt{font-size:10px;font-weight:800;margin-top:7px}.ai142Issue dd{font-size:11px;line-height:1.43;margin:2px 0 0;color:var(--soft)}
    .ai142Good{background:#edf7ed;border:1px solid #a8c9a8;border-radius:15px;padding:11px 12px;margin:9px 0}.ai142Good b{font-size:12px}.ai142Good ul,.ai142Questions ul{padding-left:18px;margin:7px 0}.ai142Good li,.ai142Questions li{font-size:11px;line-height:1.42;margin:4px 0}.ai142Questions{background:#f5f4f1;border:1px dashed #aaa;border-radius:15px;padding:11px 12px;margin:9px 0}.ai142Questions b{font-size:12px}.ai142Actions{display:grid;gap:7px;margin-top:10px}.ai142Actions .btn{margin:0}.ai142Meta{font-size:9px;color:var(--soft);line-height:1.35;margin-top:8px}.ai142Spinner{display:inline-block;width:14px;height:14px;border:2px solid #bbb;border-top-color:var(--o);border-radius:50%;animation:ai142spin .8s linear infinite;vertical-align:-3px;margin-right:6px}@keyframes ai142spin{to{transform:rotate(360deg)}}
  `;document.head.appendChild(css);

  function activeItem(){return (state.v137OwnNews?.items||[]).find(x=>String(x.id)===String(state.v137OwnNews?.activeId))||null}
  function endpoint(){return String(window.MMT_CONFIG?.aiReviewEndpoint||'').trim()}

  function ensurePanel(){
    const screen=document.getElementById('newsOwn137');if(!screen)return null;
    const honest=screen.querySelector('#hon141Panel');if(!honest)return null;
    let p=screen.querySelector('#ai142Panel');
    if(!p){p=document.createElement('div');p.id='ai142Panel';p.className='ai142Panel';honest.after(p)}
    return p;
  }

  function currentPacket(){
    const item=activeItem();if(!item)return null;
    try{
      if(window.MMT_NEWS_HONEST_REVIEW?.formal&&window.MMT_NEWS_HONEST_REVIEW?.packet){
        const formal=window.MMT_NEWS_HONEST_REVIEW.formal(item);
        const packet=window.MMT_NEWS_HONEST_REVIEW.packet(item,formal);
        state.v141SemanticPackets=state.v141SemanticPackets||{};
        state.v141SemanticPackets[item.id]=packet;persist();
        return packet;
      }
    }catch(e){console.warn('[MMT v0.14.2] cannot rebuild packet',e)}
    return state.v141SemanticPackets?.[item.id]||null;
  }

  function verdictClass(v){return v==='нельзя использовать как есть'?'stop':v==='нужно дособрать'?'work':''}
  function issueTitle(i){return i.criterion?`${i.criterion}: ${i.problem||'нужно проверить'}`:(i.problem||'Нужно проверить')}

  function renderResult(review,meta){
    const p=ensurePanel();if(!p)return;
    const issues=Array.isArray(review?.issues)?review.issues:[];
    const strengths=Array.isArray(review?.strengths)?review.strengths.filter(Boolean):[];
    const questions=Array.isArray(review?.questionsForStudent)?review.questionsForStudent.filter(Boolean):[];
    p.innerHTML=`<div class="meta">Смысловая проверка</div><h2>Редакторский разбор</h2><p class="ai142Intro">Здесь проверяется уже не заполненность формы, а смысл: логика фактуры, компетентность источника, слухи и предположения, комментарий, бэкграунд и язык.</p>
      <div class="ai142Verdict ${verdictClass(review?.verdict)}"><div class="meta">Вердикт</div><h3>${safe(review?.verdict||'Нужно проверить')}</h3><p>${safe(review?.summary||'Редакторский разбор получен.')}</p></div>
      ${issues.length?issues.map(i=>`<div class="ai142Issue ${['critical','important','note'].includes(i.severity)?i.severity:'note'}"><span class="tag">${safe(i.criterion||'редакторская проверка')}</span><h4>${safe(issueTitle(i))}</h4><dl><dt>Почему это проблема</dt><dd>${safe(i.why||'—')}</dd><dt>Что проверить</dt><dd>${safe(i.whatToVerify||'—')}</dd><dt>Что сделать дальше</dt><dd>${safe(i.nextAction||'—')}</dd></dl></div>`).join(''):'<div class="ai142State wait">Смысловых проблем в ответе не перечислено. Это всё равно не подтверждает достоверность фактов: журналист должен проверить их у источников.</div>'}
      ${strengths.length?`<div class="ai142Good"><b>Что уже работает</b><ul>${strengths.map(x=>`<li>${safe(x)}</li>`).join('')}</ul></div>`:''}
      ${questions.length?`<div class="ai142Questions"><b>Что редактор спросил бы у вас</b><ul>${questions.map(x=>`<li>${safe(x)}</li>`).join('')}</ul></div>`:''}
      <div class="ai142Actions"><button class="btn secondary" type="button" data-ai142-retry>Проверить смысл ещё раз</button></div>
      <div class="ai142Meta">AI помогает найти редакционные риски, но не подтверждает реальность события и не заменяет проверку источников.${meta?.modelVersion?' · Модель: '+safe(meta.modelVersion):''}</div>`;
  }

  function renderWaiting(){
    const p=ensurePanel();if(!p)return;
    p.innerHTML=`<div class="meta">Смысловая проверка</div><h2>Редакторский разбор</h2><div class="ai142State wait"><b>AI-редактор подготовлен, но backend ещё не подключён.</b><br>Формальная проверка уже работает. После добавления URL Yandex Cloud Function эта же кнопка «Проверить фактуру» автоматически запустит смысловой разбор.</div>`;
  }

  function renderLoading(){
    const p=ensurePanel();if(!p)return;
    p.innerHTML=`<div class="meta">Смысловая проверка</div><h2>Редакторский разбор</h2><div class="ai142State loading"><span class="ai142Spinner"></span><b>Редактор читает всю карточку целиком…</b><br>Проверяем связи между фактами, источники, слухи и предположения, комментарий, бэкграунд и язык.</div>`;
  }

  function renderError(message){
    const p=ensurePanel();if(!p)return;
    p.innerHTML=`<div class="meta">Смысловая проверка</div><h2>Редакторский разбор</h2><div class="ai142State error"><b>Не удалось получить смысловой разбор.</b><br>${safe(message||'Попробуйте ещё раз.')}</div><div class="ai142Actions"><button class="btn" type="button" data-ai142-retry>Повторить</button></div>`;
  }

  async function run(){
    const item=activeItem();const url=endpoint();const packet=currentPacket();
    if(!item||!packet)return;
    if(!url){renderWaiting();return}
    if(window.MMT_AI_REVIEW_IN_FLIGHT)return;
    window.MMT_AI_REVIEW_IN_FLIGHT=true;renderLoading();
    try{
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
      const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({packet}),signal:controller.signal,cache:'no-store'});clearTimeout(timer);
      let data=null;try{data=await r.json()}catch(e){}
      if(!r.ok||!data?.ok||!data?.review){throw new Error(data?.message||data?.error||`Ошибка сервера ${r.status}`)}
      state.v142AiReviews[item.id]={at:new Date().toISOString(),review:data.review,meta:data.meta||{}};persist();
      renderResult(data.review,data.meta||{});
    }catch(e){
      const msg=e?.name==='AbortError'?'Проверка заняла слишком много времени. Повторите запрос.':(e?.message||'Сетевая ошибка.');
      renderError(msg);
    }finally{window.MMT_AI_REVIEW_IN_FLIGHT=false}
  }

  function restore(){
    const item=activeItem();if(!item)return;
    const saved=state.v142AiReviews?.[item.id];
    if(saved?.review)renderResult(saved.review,saved.meta||{});else if(!endpoint())renderWaiting();
  }

  /* Old course modules render the fact review first. Start semantic review just after that render. */
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.matches('[data-ai142-retry]')){e.preventDefault();run();return}
    if(btn.closest('#newsOwn137')&&/проверить\s+фактуру/i.test(btn.textContent||''))setTimeout(()=>{ensurePanel();run()},180);
  },false);

  const screen=document.getElementById('newsOwn137');
  if(screen)new MutationObserver(()=>requestAnimationFrame(()=>{if(screen.classList.contains('active')){ensurePanel();restore()}})).observe(screen,{childList:true,subtree:false});
  window.addEventListener('mmt:ready',()=>setTimeout(restore,50));

  window.MMT_AI_REVIEW={run,restore,endpoint};
  setTimeout(restore,80);
})();
