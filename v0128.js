/* MMT ДВИ v0.12.8 — isolated stable bottom dock, independent from legacy nav watchdogs */
(function setupV0128(){
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.12.8';
  document.title='MMT ДВИ — v0.12.8';

  if(window.MMT_NAV_WATCHDOG)clearInterval(window.MMT_NAV_WATCHDOG);

  const legacy=document.getElementById('mmtSystemNav');
  if(legacy){
    legacy.id='mmtRetiredNav';
    legacy.setAttribute('aria-hidden','true');
    legacy.style.setProperty('left','-10000px','important');
    legacy.style.setProperty('right','auto','important');
    legacy.style.setProperty('top','0','important');
    legacy.style.setProperty('bottom','auto','important');
    legacy.style.setProperty('width','1px','important');
    legacy.style.setProperty('height','1px','important');
    legacy.style.setProperty('overflow','hidden','important');
  }

  document.getElementById('mmtBottomDock')?.remove();

  const css=document.createElement('style');css.id='mmt-v0128-css';css.textContent=`
    body{padding-bottom:calc(82px + env(safe-area-inset-bottom,0px))!important}
    .app{padding-bottom:34px!important}
    #mmtBottomDock{position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;width:100%!important;height:calc(76px + env(safe-area-inset-bottom,0px))!important;margin:0!important;padding:0 0 env(safe-area-inset-bottom,0px)!important;background:#0c0c0c!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;transform:none!important;-webkit-transform:none!important;pointer-events:auto!important;contain:layout paint;isolation:isolate}
    #mmtBottomDock .dockInner128{height:76px;max-width:430px;margin:0 auto;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));background:#0c0c0c}
    #mmtBottomDock .dockBtn128{border:0;background:transparent;color:#999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0;padding:6px 2px;font-size:10px;touch-action:manipulation}
    #mmtBottomDock .dockBtn128 b{font-size:18px;line-height:1}.dockBtn128 span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    #mmtBottomDock .dockBtn128.active{color:#fff}#mmtBottomDock .dockBtn128.active b{color:var(--o)}
    #mmtRetiredNav{left:-10000px!important;right:auto!important;top:0!important;bottom:auto!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;transform:none!important;-webkit-transform:none!important}
    @media(max-width:360px){#mmtBottomDock .dockBtn128{font-size:9px}#mmtBottomDock .dockBtn128 b{font-size:17px}}
  `;document.head.appendChild(css);

  const dock=document.createElement('nav');dock.id='mmtBottomDock';dock.setAttribute('aria-label','Основная навигация');
  dock.innerHTML=`<div class="dockInner128">
    <button type="button" class="dockBtn128" data-dock-go="home" data-dock-section="home"><b>⌂</b><span>Главная</span></button>
    <button type="button" class="dockBtn128" data-dock-go="uniCatalog" data-dock-section="unis"><b>⌕</b><span>Вузы</span></button>
    <button type="button" class="dockBtn128" data-dock-go="prepare" data-dock-section="prepare"><b>▶</b><span>Подготовка</span></button>
    <button type="button" class="dockBtn128" data-dock-go="portfolio2Hub" data-dock-section="portfolio"><b>▣</b><span>Портфолио</span></button>
    <button type="button" class="dockBtn128" data-dock-go="profile" data-dock-section="profile"><b>●</b><span>Профиль</span></button>
  </div>`;
  document.body.appendChild(dock);

  function sectionFor(id){
    id=id||document.querySelector('.screen.active')?.id||'home';
    if(id==='home'||id==='calendar'||id==='event'||id==='deadlineCenter'||id==='diagnostics'||id==='nextRoute')return'home';
    if(id==='profile'||id==='author'||id==='personalPrep')return'profile';
    if(id.startsWith('portfolio')||id.startsWith('internship')||id==='match'||id==='addwork')return'portfolio';
    if(id.startsWith('uni')||['search','picker','results','myUniversities','mpgu','ranepa','gitr','scores','sources','written','oral','signup'].includes(id))return'unis';
    return'prepare';
  }
  function syncDock(){
    if(!dock.isConnected)document.body.appendChild(dock);
    const section=sectionFor();
    dock.querySelectorAll('.dockBtn128').forEach(b=>b.classList.toggle('active',b.dataset.dockSection===section));
  }
  window.syncMMTBottomDock=syncDock;

  dock.addEventListener('click',e=>{
    const b=e.target.closest('[data-dock-go]');if(!b)return;
    e.preventDefault();e.stopPropagation();
    const target=b.dataset.dockGo;
    if(target&&document.getElementById(target)&&typeof window.go==='function')window.go(target);
    syncDock();
  });

  const main=document.querySelector('main');
  if(main)new MutationObserver(ms=>{if(ms.some(m=>m.type==='attributes'&&m.attributeName==='class'))requestAnimationFrame(syncDock)}).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});

  ['pageshow','focus','orientationchange','resize'].forEach(ev=>window.addEventListener(ev,()=>requestAnimationFrame(syncDock),{passive:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestAnimationFrame(syncDock)});

  const dockWatch=setInterval(()=>{
    if(!dock.isConnected)document.body.appendChild(dock);
    const r=dock.getBoundingClientRect();
    if(r.height<50||r.bottom<window.innerHeight-8||r.top>window.innerHeight-40){
      dock.style.setProperty('position','fixed','important');
      dock.style.setProperty('left','0','important');
      dock.style.setProperty('right','0','important');
      dock.style.setProperty('bottom','0','important');
      dock.style.setProperty('top','auto','important');
      dock.style.setProperty('width','100%','important');
      dock.style.setProperty('transform','none','important');
      dock.style.setProperty('display','block','important');
      dock.style.setProperty('visibility','visible','important');
      dock.style.setProperty('opacity','1','important');
    }
    syncDock();
  },1200);
  window.MMT_DOCK_WATCHDOG=dockWatch;
  syncDock();
})();
