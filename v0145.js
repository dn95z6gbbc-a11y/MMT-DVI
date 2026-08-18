/* MMT ДВИ v0.14.5 — robust AI trigger fallback */
(function setupV0145(){
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.14.5';
  document.title='MMT ДВИ — v0.14.5';

  let queued=false;
  function scheduleRun(delay=650){
    if(queued)return;
    queued=true;
    window.MMT_AI_REVIEW_IN_FLIGHT=true;
    setTimeout(()=>{
      queued=false;
      try{
        if(window.MMT_AI_REVIEW_V144?.run){
          window.MMT_AI_REVIEW_V144.run();
        }
      }catch(e){
        console.error('[MMT v0.14.5] AI run failed',e);
        window.MMT_AI_REVIEW_IN_FLIGHT=false;
      }
    },delay);
  }

  function isFactCheckButton(target){
    const btn=target?.closest?.('button');
    return !!(btn&&btn.closest('#newsOwn137')&&/проверить\s+фактуру/i.test(btn.textContent||''));
  }

  /* pointerdown fires before the legacy click chain, so old handlers cannot swallow the AI trigger */
  document.addEventListener('pointerdown',e=>{
    if(isFactCheckButton(e.target))scheduleRun(700);
  },true);

  /* Touch fallback for older mobile browsers. */
  document.addEventListener('touchstart',e=>{
    if(isFactCheckButton(e.target))scheduleRun(700);
  },{capture:true,passive:true});

  function addFallbackButton(){
    const p=document.getElementById('ai142Panel');if(!p)return;
    if(p.querySelector('[data-ai145-run]'))return;
    const txt=(p.textContent||'').toLowerCase();
    if(!txt.includes('ai-редактор подключён')&&!txt.includes('ai-редактор подключен'))return;
    const wrap=document.createElement('div');
    wrap.className='ai142Actions';
    wrap.innerHTML='<button class="btn" type="button" data-ai145-run>Запустить AI-разбор</button>';
    p.appendChild(wrap);
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-ai145-run]');if(!b)return;
    e.preventDefault();e.stopPropagation();
    scheduleRun(10);
  },true);

  const screen=document.getElementById('newsOwn137');
  if(screen)new MutationObserver(()=>requestAnimationFrame(addFallbackButton)).observe(screen,{childList:true,subtree:true});
  window.addEventListener('mmt:ready',()=>setTimeout(addFallbackButton,150));
  setTimeout(addFallbackButton,300);
})();
