/* MMT ДВИ v0.13.4 — verdict is a normal app screen; stable mobile navigation */
(function setupV0134(){
  const route=document.getElementById('v132Route');
  const dockId='mmtBottomDock';
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.4';
  document.title='MMT ДВИ — v0.13.4';
  if(!route)return;

  function routeActive(){return route.classList.contains('active')}
  function exposeVerdictChrome(){
    if(!routeActive())return;
    document.body.classList.remove('v132-onboarding','v13-onboarding');
    document.body.style.removeProperty('padding-bottom');
    const app=document.querySelector('.app');if(app)app.style.removeProperty('padding-bottom');
    const dock=document.getElementById(dockId);
    if(dock){dock.style.setProperty('display','block','important');dock.style.setProperty('visibility','visible','important');dock.style.setProperty('opacity','1','important')}
    const top=document.querySelector('.top');if(top)top.style.removeProperty('display');
  }

  function persist(){try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.13.4] persist failed',e)}}
  function selectedIds(){return new Set(state.v132?.selectedIds||[])}
  function destination(action){
    if(action==='prepare'&&document.getElementById('prepare'))return 'prepare';
    if(action==='unis')return document.getElementById('myUniversities')?'myUniversities':'uniCatalog';
    if(action==='portfolio')return document.getElementById('portfolio2Hub')?'portfolio2Hub':'home';
    return 'home';
  }
  function directRender(id){
    const target=document.getElementById(id)||document.getElementById('home');if(!target)return;
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    target.classList.add('active');
    try{window.scrollTo(0,0)}catch(e){}
    document.body.classList.remove('v132-onboarding','v13-onboarding');
    const dock=document.getElementById(dockId);if(dock)dock.style.setProperty('display','block','important');
    try{if(typeof window.refresh==='function')setTimeout(()=>window.refresh(),0)}catch(e){console.warn('[MMT v0.13.4] refresh failed',e)}
  }
  function finalize(action){
    const ids=selectedIds();if(!ids.size)return;
    const UNIS=window.MMT_UNIVERSITIES||{};
    Object.values(UNIS).forEach(u=>{if(u.stateKey)state[u.stateKey]=ids.has(u.id)});
    state.v13Onboarding=state.v13Onboarding&&typeof state.v13Onboarding==='object'?state.v13Onboarding:{};
    state.v13Onboarding.year=state.v132?.year||'';
    state.v13Onboarding.selectedIds=[...ids];
    state.v13Onboarding.mode=state.v132?.mode||'';
    state.v13Onboarding.geo=state.v132?.geo||'';
    state.v13OnboardingComplete=true;
    state.v132JustStarted=false;
    state.v127Demo=false;
    state.v134LastRoute={createdAt:new Date().toISOString(),universityIds:[...ids],year:state.v132?.year||'',nextChoice:action};
    persist();
    directRender(destination(action));
    try{if(typeof window.toast==='function')window.toast('Маршрут сохранён')}catch(e){}
  }

  /* v0.13.2 still tries to hide the dock on this route. Run after its observer and undo that legacy onboarding rule. */
  const chromeObserver=new MutationObserver(()=>requestAnimationFrame(exposeVerdictChrome));
  chromeObserver.observe(document.querySelector('main')||document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('mmt:ready',exposeVerdictChrome);
  window.addEventListener('pageshow',()=>setTimeout(exposeVerdictChrome,0));
  document.addEventListener('click',e=>{if(e.target.closest('[data-v132-route],[data-v132-year],[data-v132-backpick]'))setTimeout(exposeVerdictChrome,0)},false);

  /* Mobile-safe route actions: pointerup runs independently of the legacy click chain. */
  let handledAt=0;
  function handleAction(e){
    const b=e.target.closest?.('[data-v133-action]');if(!b||!routeActive())return;
    const now=Date.now();if(now-handledAt<500)return;handledAt=now;
    e.preventDefault();e.stopPropagation();
    finalize(b.dataset.v133Action||'home');
  }
  document.addEventListener('pointerup',handleAction,true);
  document.addEventListener('touchend',handleAction,{capture:true,passive:false});

  /* Give save-to-home a direct semantic fallback too. */
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.v133SaveOnly');if(!b||!routeActive())return;
    e.preventDefault();e.stopPropagation();finalize('home');
  },true);

  exposeVerdictChrome();
})();
