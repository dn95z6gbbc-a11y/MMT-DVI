/* MMT ДВИ v0.12.2 — Android native select / bottom nav recovery */
(function setupV0122(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.12.2';
  document.title='MMT ДВИ — v0.12.2';

  const css=document.createElement('style');
  css.id='mmt-v0122-css';
  css.textContent=`
    :root{--mmt-vv-inset:0px!important}
    body{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))!important}
    #mmtSystemNav{
      position:fixed!important;
      left:50%!important;
      right:auto!important;
      top:auto!important;
      bottom:0!important;
      transform:translateX(-50%) translate3d(0,0,0)!important;
      width:min(430px,100vw)!important;
      display:grid!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
      z-index:2147483646!important;
      -webkit-transform:translateX(-50%) translate3d(0,0,0)!important;
      backface-visibility:hidden!important;
      -webkit-backface-visibility:hidden!important;
    }
  `;
  document.head.appendChild(css);

  function nav(){return document.getElementById('mmtSystemNav')}

  function hardRecoverNav(){
    document.documentElement.style.setProperty('--mmt-vv-inset','0px','important');
    const n=nav(); if(!n)return;
    if(n.parentElement!==document.body)document.body.appendChild(n);
    n.style.setProperty('position','fixed','important');
    n.style.setProperty('bottom','0','important');
    n.style.setProperty('top','auto','important');
    n.style.setProperty('display','grid','important');
    n.style.setProperty('visibility','visible','important');
    n.style.setProperty('opacity','1','important');
    n.style.setProperty('pointer-events','auto','important');
    n.style.setProperty('z-index','2147483646','important');
    n.style.setProperty('transform','translateX(-50%) translate3d(0,0,0)','important');
    /* Force Android/Chrome to recreate the compositing layer after native picker closes. */
    void n.offsetHeight;
    n.style.setProperty('will-change','transform','important');
    requestAnimationFrame(()=>{
      n.style.setProperty('will-change','auto','important');
      if(typeof window.updateMMTBottomNav==='function')window.updateMMTBottomNav();
      /* v0.12.1 may set viewport inset again; neutralize it after its own callback. */
      document.documentElement.style.setProperty('--mmt-vv-inset','0px','important');
      n.style.setProperty('bottom','0','important');
    });
  }
  window.hardRecoverMMTNav=hardRecoverNav;

  function recoverAfterNativeControl(){
    /* Native Android picker can return focus before visualViewport settles. */
    hardRecoverNav();
    setTimeout(hardRecoverNav,50);
    setTimeout(hardRecoverNav,180);
    setTimeout(hardRecoverNav,450);
  }

  document.addEventListener('change',e=>{
    if(e.target instanceof HTMLSelectElement)recoverAfterNativeControl();
  },true);
  document.addEventListener('blur',e=>{
    if(e.target instanceof HTMLSelectElement)recoverAfterNativeControl();
  },true);
  document.addEventListener('focusout',e=>{
    if(e.target instanceof HTMLSelectElement)recoverAfterNativeControl();
  },true);

  /* Do not follow visualViewport vertically. Only repaint the fixed bottom:0 layer. */
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',()=>setTimeout(hardRecoverNav,0),{passive:true});
    window.visualViewport.addEventListener('scroll',()=>setTimeout(hardRecoverNav,0),{passive:true});
  }
  window.addEventListener('resize',hardRecoverNav,{passive:true});
  window.addEventListener('pageshow',hardRecoverNav,{passive:true});
  window.addEventListener('focus',hardRecoverNav,{passive:true});

  /* Override v0.12.1's viewport-based value continuously, but without moving the nav. */
  const oldWatch=window.MMT_NAV_WATCHDOG;
  if(oldWatch)clearInterval(oldWatch);
  window.MMT_NAV_WATCHDOG=setInterval(hardRecoverNav,800);

  hardRecoverNav();
})();
