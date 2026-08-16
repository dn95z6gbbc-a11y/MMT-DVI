/* MMT ДВИ v0.12.1 — technical sanitation: persistent system nav + form/empty-state audit */
(function setupV0121(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.12.1';
  document.title='MMT ДВИ — v0.12.1';

  const css=document.createElement('style');
  css.id='mmt-v0121-css';
  css.textContent=`
    :root{--mmt-nav-h:76px;--mmt-vv-inset:0px}
    body{padding-bottom:calc(var(--mmt-nav-h) + var(--mmt-vv-inset) + env(safe-area-inset-bottom,0px))!important}
    .app{padding-bottom:28px!important}
    #mmtSystemNav{
      position:fixed!important;left:50%!important;right:auto!important;
      bottom:var(--mmt-vv-inset)!important;transform:translateX(-50%) translate3d(0,0,0)!important;
      width:min(430px,100vw)!important;height:calc(var(--mmt-nav-h) + env(safe-area-inset-bottom,0px))!important;
      padding:0 0 env(safe-area-inset-bottom,0px)!important;margin:0!important;
      display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;
      visibility:visible!important;opacity:1!important;pointer-events:auto!important;
      z-index:2147483000!important;background:#0c0c0c!important;box-shadow:0 -8px 28px #0003!important;
      overflow:visible!important;contain:layout style;isolation:isolate;
    }
    #mmtSystemNav .nav{
      border:0!important;background:transparent!important;color:#aaa!important;min-width:0!important;
      display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;
      gap:3px!important;font-size:10px!important;padding:6px 2px!important;touch-action:manipulation!important;
    }
    #mmtSystemNav .nav b{font-size:18px!important;line-height:1!important}
    #mmtSystemNav .nav span{display:block!important;max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    #mmtSystemNav .nav.active{color:#fff!important}#mmtSystemNav .nav.active b{color:var(--o)!important}
    select,.select{
      color:#0C0C0C!important;-webkit-text-fill-color:#0C0C0C!important;background-color:#fff!important;
      opacity:1!important;visibility:visible!important;color-scheme:light!important;
    }
    select option{color:#0C0C0C!important;background:#fff!important;-webkit-text-fill-color:#0C0C0C!important}
    select:disabled{color:#777!important;-webkit-text-fill-color:#777!important}
    .mmt-empty-state{background:var(--muted);border:1px dashed var(--line);border-radius:14px;padding:12px 13px;color:var(--soft);font-size:12px;line-height:1.4;margin:8px 0}
    .mmt-form-hint{font-size:11px;color:var(--soft);margin:-7px 0 10px}
    @media(max-width:360px){#mmtSystemNav .nav{font-size:9px!important}#mmtSystemNav .nav b{font-size:17px!important}}
  `;
  document.head.appendChild(css);

  /* STEP 1. Build navigation from scratch instead of trusting the historical node. */
  const legacy=document.querySelector('nav.bottom');
  if(legacy) legacy.remove();
  const oldSystem=document.getElementById('mmtSystemNav'); if(oldSystem) oldSystem.remove();

  const nav=document.createElement('nav');
  nav.id='mmtSystemNav';nav.className='bottom';nav.setAttribute('aria-label','Основная навигация');
  const navSpec=[
    ['⌂','Главная','home','home'],
    ['⌕','Вузы',document.getElementById('uniCatalog')?'uniCatalog':'search','unis'],
    ['▶','Подготовка','prepare','prepare'],
    ['▣','Портфолио',document.getElementById('portfolio2Hub')?'portfolio2Hub':'portfolio','portfolio'],
    ['●','Профиль','profile','profile']
  ];
  nav.innerHTML=navSpec.map(([icon,label,go,section])=>`<button type="button" class="nav" data-go="${go}" data-nav="${section}" aria-label="${label}"><b>${icon}</b><span>${label}</span></button>`).join('');
  document.body.appendChild(nav);

  function currentSection(){
    const id=document.querySelector('.screen.active')?.id||'home';
    if(['home','calendar','event','nextRoute','diagnostics'].includes(id))return'home';
    if(['uniCatalog','uniCompare10','search','picker','results','myUniversities','uni','scores','sources','written','oral','signup','mpgu','ranepa','gitr'].includes(id))return'unis';
    if(id==='portfolio'||id.startsWith('portfolio2')||id==='match'||id==='addwork'||id.startsWith('internship2'))return'portfolio';
    if(['profile','author','personalPrep'].includes(id))return'profile';
    return'prepare';
  }
  function viewportInset(){
    const vv=window.visualViewport;if(!vv)return 0;
    const inset=Math.max(0,Math.round(window.innerHeight-vv.height-vv.offsetTop));
    return Math.min(inset,Math.max(0,window.innerHeight-120));
  }
  function enforceNav(){
    if(!nav.isConnected)document.body.appendChild(nav);
    const inset=viewportInset();
    document.documentElement.style.setProperty('--mmt-vv-inset',inset+'px');
    nav.style.setProperty('display','grid','important');
    nav.style.setProperty('visibility','visible','important');
    nav.style.setProperty('opacity','1','important');
    nav.style.setProperty('pointer-events','auto','important');
    nav.style.setProperty('z-index','2147483000','important');
    const section=currentSection();[...nav.querySelectorAll('.nav')].forEach(b=>b.classList.toggle('active',b.dataset.nav===section));
  }
  window.updateMMTBottomNav=enforceNav;
  ['resize','orientationchange','pageshow','focus'].forEach(ev=>window.addEventListener(ev,enforceNav,{passive:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)enforceNav()});
  if(window.visualViewport){window.visualViewport.addEventListener('resize',enforceNav,{passive:true});window.visualViewport.addEventListener('scroll',enforceNav,{passive:true})}
  new MutationObserver(()=>enforceNav()).observe(document.body,{childList:true});
  const navWatch=setInterval(()=>{
    enforceNav();
    const r=nav.getBoundingClientRect(),vv=window.visualViewport;
    const visibleBottom=vv?vv.offsetTop+vv.height:window.innerHeight;
    if(r.top>=visibleBottom||r.bottom<=0){
      document.documentElement.style.setProperty('--mmt-vv-inset',Math.max(0,window.innerHeight-visibleBottom)+'px');
    }
  },700);
  window.MMT_NAV_WATCHDOG=navWatch;

  /* Keep active state correct even when old modules call render() directly. */
  const main=document.querySelector('main');
  if(main)new MutationObserver(ms=>{if(ms.some(m=>m.type==='attributes'&&m.attributeName==='class'))requestAnimationFrame(enforceNav)}).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});

  /* STEP 2. Normalize selects/forms. Android/WebView must always have readable selected text. */
  const genre=document.getElementById('v11WorkGenre');
  if(genre){
    const current=genre.value;
    genre.innerHTML=`<option value="новость">Новость</option><option value="репортаж">Репортаж</option><option value="интервью">Интервью</option><option value="видеосюжет">Видеосюжет</option><option value="большая статья">Большая статья / лонгрид</option><option value="подкаст">Подкаст</option><option value="фотопроект">Фотопроект</option><option value="рецензия">Рецензия</option><option value="эссе">Эссе</option><option value="другое">Другое</option>`;
    if([...genre.options].some(o=>o.value===current))genre.value=current;
    genre.setAttribute('aria-label','Жанр работы');
  }
  const kind=document.getElementById('v11WorkKind');
  if(kind){
    const current=kind.value;
    kind.innerHTML=`<option value="учебная">Учебная работа MMT</option><option value="СМИ">Публикация / выход в СМИ</option><option value="авторская">Авторский проект</option><option value="институциональная">Бренд-медиа / институциональный материал</option><option value="школьная">Школьное / молодёжное медиа</option><option value="другое">Другое</option>`;
    if([...kind.options].some(o=>o.value===current))kind.value=current;
    kind.setAttribute('aria-label','Тип работы');
  }

  function auditSelects(){
    const report=[];
    document.querySelectorAll('select').forEach((s,i)=>{
      const opts=[...s.options];
      if(!opts.length||opts.every(o=>!o.textContent.trim())){
        s.innerHTML='<option value="">Выберите вариант</option>';
        report.push({id:s.id||'(без id)',problem:'empty-options'});
      }else{
        opts.forEach((o,n)=>{if(!o.textContent.trim()){o.textContent='Вариант '+(n+1);report.push({id:s.id||'(без id)',problem:'blank-option-'+n})}});
      }
      s.style.color='#0C0C0C';s.style.webkitTextFillColor='#0C0C0C';s.style.backgroundColor='#fff';
    });
    return report;
  }

  /* STEP 3. Known dynamic containers must explain an empty state instead of drawing a blank rectangle. */
  const emptyCopy={
    v11WorksList:'Пока нет добавленных работ. Нажмите «Добавить работу» и начните с любого материала, который уже сделали.',
    v11PortfolioMatches:'Добавьте хотя бы один вуз в план и одну работу — здесь появится подбор материалов под конкретные требования.',
    v11RegionHint:'Региональный контур пока не заполнен. Если поступаете или ищете практику в регионе, добавьте его в разделе «Медиасреда и повестка».',
    simHistoryList:'Симуляций пока нет. После первой беседы здесь появится история попыток.',
    interviewHistoryList:'Сохранённых устных ответов пока нет.',
    customDeadlineList10:'Личных дат пока нет.',
    v10CatalogList:'Каталог загружается…'
  };
  function fillKnownEmptyStates(){
    Object.entries(emptyCopy).forEach(([id,text])=>{
      const el=document.getElementById(id);if(!el)return;
      const hasUsefulText=(el.textContent||'').trim().length>0;
      const hasControls=!!el.querySelector('button,input,select,textarea,a,.card,.work11,.uniCard10,.deadline10');
      if(!hasUsefulText&&!hasControls)el.innerHTML=`<div class="mmt-empty-state">${text}</div>`;
    });
  }

  /* STEP 4. General visual sanitation report. Nothing is silently deleted. */
  function uiAudit(){
    const emptySelects=auditSelects();fillKnownEmptyStates();
    const emptyVisual=[...document.querySelectorAll('.screen.active .card,.screen.active .notice,.screen.active .metric')].filter(el=>!(el.textContent||'').trim()&&!el.querySelector('input,select,textarea,button,img,video')).map(el=>({screen:el.closest('.screen')?.id||'',className:el.className}));
    const deadRoutes=[...document.querySelectorAll('[data-go]')].filter(el=>el.dataset.go&&!document.getElementById(el.dataset.go)).map(el=>({target:el.dataset.go,text:(el.textContent||'').trim().slice(0,60)}));
    window.MMT_UI_SANITATION={emptySelects,emptyVisual,deadRoutes,selectCount:document.querySelectorAll('select').length,screenCount:document.querySelectorAll('.screen').length};
    if(emptyVisual.length||deadRoutes.length||emptySelects.length)console.warn('[MMT ДВИ v0.12.1] UI sanitation report',window.MMT_UI_SANITATION);
    return window.MMT_UI_SANITATION;
  }
  window.runMMTUIAudit=uiAudit;

  /* Dynamic modules can repaint containers later, so repeat harmless sanitation after navigation. */
  document.addEventListener('click',e=>{if(e.target.closest('[data-go],button'))setTimeout(()=>{fillKnownEmptyStates();auditSelects();enforceNav()},80)},true);
  setTimeout(uiAudit,0);setTimeout(uiAudit,500);enforceNav();
})();
