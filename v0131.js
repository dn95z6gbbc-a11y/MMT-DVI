/* MMT ДВИ v0.13.1 — applicant-first splash; saved progress becomes secondary */
(function setupV0131(){
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.1';
  document.title='MMT ДВИ — v0.13.1';

  const css=document.createElement('style');css.id='mmt-v0131-css';css.textContent=`
    .v131Hero{padding:46px 4px 22px}.v131Hero .logo{margin-bottom:24px}.v131Hero h1{font-size:35px;max-width:390px}.v131Hero .sub{font-size:16px;line-height:1.5;max-width:390px;margin-bottom:20px}
    .v131Choices{display:grid;gap:10px;margin:18px 0 12px}.v131Choice{width:100%;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:18px;padding:17px;text-align:left}.v131Choice.primary{background:var(--o);border-color:var(--o)}.v131Choice b{display:block;font:700 18px/1.25 Montserrat,Arial,sans-serif}.v131Choice span{display:block;color:var(--soft);font-size:12px;line-height:1.4;margin-top:5px}.v131Choice.primary span{color:#493024}
    .v131How{display:flex;gap:7px;align-items:center;flex-wrap:wrap;color:var(--soft);font-size:11px;margin:17px 0 21px}.v131How span{background:var(--muted);border-radius:999px;padding:7px 9px}.v131Saved{border-top:1px solid var(--line);padding-top:15px;margin-top:12px}.v131Saved button{border:0;background:transparent;color:var(--ink);padding:6px 0;font-weight:700;text-decoration:underline;text-underline-offset:3px}.v131Restart{display:block;border:0;background:transparent;color:var(--soft);font-size:11px;padding:10px 0 0}
    @media(max-width:370px){.v131Hero h1{font-size:31px}}
  `;document.head.appendChild(css);

  const splash=document.getElementById('splash');if(!splash)return;
  const UNIS=window.MMT_UNIVERSITIES||{};
  const hasProgress=Object.values(UNIS).some(u=>!!state[u.stateKey]) || !!state.v13OnboardingComplete || (state.newsCount||0)>0 || (state.interviewSessions||[]).length>0 || (state.v11Works||state.works||[]).length>0;

  function renderSplash(){
    splash.innerHTML=`<div class="v131Hero">
      <div class="logo">MMT</div>
      <div class="eye">Поступление на журналистику</div>
      <h1>Выбрать журфак и подготовиться к ДВИ</h1>
      <p class="sub">Выберите университеты, которые рассматриваете. MMT ДВИ покажет, что именно там сдавать, и соберёт понятный маршрут подготовки.</p>
      <div class="v131Choices">
        <button class="v131Choice primary" type="button" data-v13-mode="known"><b>Я уже знаю свои вузы</b><span>Найти их в базе и собрать план подготовки.</span></button>
        <button class="v131Choice" type="button" data-v13-mode="help"><b>Помогите выбрать вузы</b><span>Подобрать варианты по географии и формату поступления.</span></button>
      </div>
      <div class="v131How"><span>1 · выбрать цели</span><span>2 · увидеть ДВИ</span><span>3 · получить маршрут</span></div>
      ${hasProgress?`<div class="v131Saved"><div class="meta">У вас уже есть сохранённый план</div><button type="button" data-v13-continue>Продолжить подготовку →</button><button class="v131Restart" type="button" data-v131-restart>Начать настройку заново</button></div>`:''}
    </div>`;
  }

  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-v131-restart]'))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(confirm('Начать настройку заново? Сохранённый прогресс этого прототипа будет очищен.')){
      localStorage.removeItem('mmtV04');location.reload();
    }
  },true);

  renderSplash();
})();
