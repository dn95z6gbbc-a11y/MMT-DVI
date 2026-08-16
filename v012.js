/* MMT ДВИ v0.12 — UX stabilization, persistent bottom navigation and route safety */
(function setupV012(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.12';
  document.title='MMT ДВИ — v0.12';

  const css=document.createElement('style');
  css.textContent=`
    html,body{min-height:100%;overflow-x:hidden}
    .app{min-height:100vh;min-height:100dvh;padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))}
    main{min-height:calc(100vh - 62px);min-height:calc(100dvh - 62px)}
    .screen{padding-bottom:calc(38px + env(safe-area-inset-bottom,0px))}
    .bottom#mmtBottomNav{
      position:fixed!important;
      left:50%!important;
      right:auto!important;
      bottom:0!important;
      transform:translateX(-50%) translateZ(0)!important;
      width:min(430px,100vw)!important;
      height:calc(76px + env(safe-area-inset-bottom,0px))!important;
      padding-bottom:env(safe-area-inset-bottom,0px)!important;
      display:grid!important;
      grid-template-columns:repeat(5,1fr)!important;
      visibility:visible!important;
      opacity:1!important;
      z-index:1000!important;
      background:#0c0c0cfb!important;
      box-shadow:0 -8px 24px #00000018;
      isolation:isolate;
      will-change:transform;
    }
    .bottom#mmtBottomNav .nav{min-width:0;min-height:56px;touch-action:manipulation}
    .bottom#mmtBottomNav .nav span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .toast{z-index:1200!important;bottom:calc(88px + env(safe-area-inset-bottom,0px))!important}
    [data-dead-route="true"]{opacity:.62}
    @media(max-width:360px){.bottom#mmtBottomNav .nav{font-size:9px}.bottom#mmtBottomNav .nav b{font-size:17px}}
  `;
  document.head.appendChild(css);

  const bottom=document.querySelector('nav.bottom');
  if(bottom){
    bottom.id='mmtBottomNav';
    /* Fixed UI lives outside .app so future transforms/overflow on app screens cannot clip it. */
    if(bottom.parentElement!==document.body) document.body.appendChild(bottom);
  }

  const navItems=bottom?[...bottom.querySelectorAll('.nav')]:[];
  const modernTargets=[
    {go:'home',nav:'home',label:'Главная'},
    {go:document.getElementById('uniCatalog')?'uniCatalog':'search',nav:'unis',label:'Вузы'},
    {go:'prepare',nav:'prepare',label:'Подготовка'},
    {go:document.getElementById('portfolio2Hub')?'portfolio2Hub':'portfolio',nav:'portfolio',label:'Портфолио'},
    {go:'profile',nav:'profile',label:'Профиль'}
  ];
  navItems.forEach((n,i)=>{
    const m=modernTargets[i]; if(!m)return;
    n.dataset.go=m.go; n.dataset.nav=m.nav;
    const icon=n.querySelector('b');
    n.innerHTML=''; if(icon)n.appendChild(icon);
    const s=document.createElement('span');s.textContent=m.label;n.appendChild(s);
    n.setAttribute('aria-label',m.label);
  });

  function activeScreenId(){return document.querySelector('.screen.active')?.id||''}
  function navSection(id){
    if(!id)return '';
    if(['home','calendar','event','nextRoute','diagnostics'].includes(id))return 'home';
    if(['uniCatalog','uniCompare10','search','picker','results','myUniversities','uni','scores','sources','written','oral','signup'].includes(id))return 'unis';
    if(['mpgu','ranepa','gitr'].includes(id))return 'unis';
    if(id==='portfolio'||id.startsWith('portfolio2')||id==='match'||id==='addwork'||id.startsWith('internship2'))return 'portfolio';
    if(id==='profile'||id==='author'||id==='personalPrep')return 'profile';
    return 'prepare';
  }
  function updateBottomNav(id=activeScreenId()){
    const section=navSection(id);
    navItems.forEach(n=>n.classList.toggle('active',n.dataset.nav===section));
    if(bottom){bottom.style.display='grid';bottom.style.visibility='visible';bottom.style.opacity='1'}
  }
  window.updateMMTBottomNav=updateBottomNav;

  /* Guard every route. Old prototype links should never leave the user on a blank screen. */
  if(typeof go==='function'){
    const oldGo=go;
    go=function(id){
      if(!document.getElementById(id)){
        console.warn('[MMT ДВИ v0.12] blocked missing route:',id);
        if(typeof toast==='function') toast('Этот экран ещё не готов. Вы остались в текущем разделе.');
        updateBottomNav();
        return;
      }
      oldGo(id);
      updateBottomNav(id);
    };
    window.go=go;
  }

  document.addEventListener('click',e=>{
    const route=e.target.closest('[data-go]');
    if(!route)return;
    const id=route.dataset.go;
    if(id&&!document.getElementById(id)){
      e.preventDefault();e.stopImmediatePropagation();
      route.dataset.deadRoute='true';
      console.warn('[MMT ДВИ v0.12] missing data-go target:',id,route);
      if(typeof toast==='function')toast('Раздел пока не готов — переход отменён.');
      updateBottomNav();
    }
  },true);

  /* Keep nav state synchronized even when an older module calls render directly. */
  const main=document.querySelector('main');
  if(main){
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.type==='attributes'&&m.attributeName==='class'&&m.target.classList?.contains('screen'))){
        requestAnimationFrame(()=>updateBottomNav());
      }
    });
    observer.observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  function routeAudit(){
    const all=[...document.querySelectorAll('[data-go]')];
    const dead=all.filter(x=>x.dataset.go&&!document.getElementById(x.dataset.go));
    dead.forEach(x=>x.dataset.deadRoute='true');
    window.MMT_UX_AUDIT={
      screens:document.querySelectorAll('.screen').length,
      routedControls:all.length,
      missingRoutes:dead.map(x=>({target:x.dataset.go,text:(x.textContent||'').trim().slice(0,80)})),
      bottomNavPresent:!!bottom,
      bottomNavTargets:navItems.map(x=>x.dataset.go)
    };
    if(dead.length)console.warn('[MMT ДВИ v0.12] missing routes',window.MMT_UX_AUDIT.missingRoutes);
    else console.info('[MMT ДВИ v0.12] route audit: no missing data-go screens');
  }

  /* Browser UI and Android viewport changes can repaint fixed elements. Reassert the nav after those changes. */
  const keepNav=()=>requestAnimationFrame(()=>updateBottomNav());
  window.addEventListener('resize',keepNav,{passive:true});
  window.addEventListener('orientationchange',keepNav,{passive:true});
  window.addEventListener('pageshow',keepNav,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)keepNav()});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',keepNav,{passive:true});
    window.visualViewport.addEventListener('scroll',keepNav,{passive:true});
  }

  /* Give the main hubs explicit return paths where older screens ended abruptly. */
  const hubReturns=[
    ['uniCompare10','uniCatalog','Вернуться к каталогу вузов'],
    ['interviewSimulationHistory','interviewHub','К тренировке собеседования'],
    ['portfolio2Match','portfolio2Hub','К портфолио'],
    ['portfolio2Guide','portfolio2Hub','К портфолио'],
    ['internship2Tracker','internship2Hub','К стажировке']
  ];
  hubReturns.forEach(([screenId,target,label])=>{
    const s=document.getElementById(screenId);
    if(!s||s.querySelector(`[data-v12-return="${target}"]`))return;
    const b=document.createElement('button');b.className='btn secondary';b.dataset.go=target;b.dataset.v12Return=target;b.textContent=label;s.appendChild(b);
  });

  updateBottomNav();
  routeAudit();
})();
