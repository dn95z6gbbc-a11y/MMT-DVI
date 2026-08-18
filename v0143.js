/* MMT ДВИ v0.14.3 — Cloudflare AI endpoint connection fix */
(function setupV0143(){
  const ENDPOINT='https://mmt-dvi-review.mushkovmedia.workers.dev/';

  window.MMT_CONFIG=Object.assign({},window.MMT_CONFIG||{}, {
    aiReviewEndpoint: ENDPOINT
  });

  const ver=document.querySelector('.ver');
  if(ver)ver.textContent='v0.14.3';
  document.title='MMT ДВИ — v0.14.3';

  function refreshPanel(){
    const p=document.getElementById('ai142Panel');
    if(!p)return;
    const text=(p.textContent||'').toLowerCase();
    if(text.includes('backend ещё не подключён')||text.includes('backend еще не подключен')||text.includes('yandex cloud function')){
      p.innerHTML='<div class="meta">Смысловая проверка</div><h2>Редакторский разбор</h2><div class="ai142State wait"><b>AI-редактор подключён.</b><br>Нажмите «Проверить фактуру» ещё раз — карточка будет отправлена на смысловой разбор через Cloudflare Workers AI.</div>';
    }
  }

  setTimeout(refreshPanel,50);
  setTimeout(refreshPanel,250);
  setTimeout(refreshPanel,800);

  const screen=document.getElementById('newsOwn137');
  if(screen)new MutationObserver(()=>requestAnimationFrame(refreshPanel)).observe(screen,{childList:true,subtree:true});

  window.addEventListener('mmt:ready',()=>setTimeout(refreshPanel,50));
  window.MMT_CLOUDFLARE_AI_ENDPOINT=ENDPOINT;
})();
