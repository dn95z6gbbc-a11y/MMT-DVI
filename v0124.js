/* MMT ДВИ v0.12.4 — UI sanitation: one canonical route per feature, no dead placeholders */
(function setupV0124(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.12.4';
  document.title='MMT ДВИ — v0.12.4';

  const css=document.createElement('style');
  css.id='mmt-v0124-css';
  css.textContent=`
    .mmtSoon{background:var(--muted);border:1px solid var(--line);border-radius:16px;padding:12px 13px;margin:9px 0;color:var(--soft);font-size:12px;line-height:1.45}
    .mmtSoon b{color:var(--ink)}
    .mmtDisabledAction{opacity:.68;cursor:default!important;pointer-events:none!important}
    .mmtCleanupNote{font-size:11px;color:var(--soft);margin-top:6px}
    .mmtFieldHelp{font-size:11px;line-height:1.4;color:var(--soft);margin:-7px 0 11px}
    .screen[data-mmt-legacy='1']{display:none!important}
    .video-placeholder.mmtVideoPending{cursor:default!important;position:relative;padding-right:72px}
    .video-placeholder.mmtVideoPending:after{content:'позже';position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:10px;background:#ffffff18;border:1px solid #ffffff28;padding:5px 7px;border-radius:999px;color:#ddd}
  `;
  document.head.appendChild(css);

  /* One canonical destination for every feature. Historical screens remain in source only for migration. */
  const aliases={
    search:'uniCatalog', picker:'uniCatalog', results:'uniCatalog',
    portfolio:'portfolio2Hub', portfolioAdd:'portfolio2Add', match:'portfolio2Match',
    internship:'internship2Hub', letter:'internship2Letter'
  };
  const legacyIds=Object.keys(aliases);
  legacyIds.forEach(id=>document.getElementById(id)?.setAttribute('data-mmt-legacy','1'));
  window.MMT_ROUTE_ALIASES=Object.assign({},window.MMT_ROUTE_ALIASES||{},aliases);

  function canonical(id){return aliases[id]&&document.getElementById(aliases[id])?aliases[id]:id}

  /* Route at the final layer, after previous wrappers. */
  if(typeof window.go==='function'){
    const previousGo=window.go;
    window.go=function(id){return previousGo(canonical(id))};
  }
  document.querySelectorAll('[data-go]').forEach(el=>{
    const next=canonical(el.dataset.go);
    if(next!==el.dataset.go)el.dataset.go=next;
  });

  /* Remove duplicate v0.11 entry cards from old containers when modern bottom nav already leads directly to hubs. */
  ['portfolio2Entry'].forEach(id=>document.getElementById(id)?.remove());

  /* Old static home widgets should point to current features. */
  const home=document.getElementById('home');
  if(home){
    home.querySelectorAll('[data-go="portfolio"]').forEach(el=>el.dataset.go='portfolio2Hub');
  }

  /* Fields: every visible control gets an explicit purpose. */
  const fieldHints={
    v11WorkTitle:'Короткое понятное название, по которому вы сами узнаете материал через несколько месяцев.',
    v11WorkMedia:'Укажите редакцию, канал, сайт, школьное или авторское медиа, если работа где-то выходила.',
    v11WorkLink:'Ссылка необязательна для учебной работы. Для опубликованной работы лучше сохранить прямую ссылку.',
    v11WorkProof:'Что подтверждает публикацию или участие: ссылка, справка, письмо редактора, эфир, скрин.',
    v11WorkDate:'Дата поможет потом собирать портфолио под конкретную приёмную кампанию.'
  };
  Object.entries(fieldHints).forEach(([id,text])=>{
    const el=document.getElementById(id);if(!el||document.getElementById('hint-'+id))return;
    const h=document.createElement('div');h.id='hint-'+id;h.className='mmtFieldHelp';h.textContent=text;
    el.insertAdjacentElement('afterend',h);
  });

  /* Known dynamic containers: never show unexplained blank space. */
  const emptyStates={
    v11WorksList:'Портфолио пока пустое. Добавьте первую работу — учебную, опубликованную или авторскую.',
    v11PortfolioMatches:'Здесь появится подбор работ после того, как в плане будет хотя бы один вуз и в портфолио — хотя бы одна работа.',
    v11RegionHint:'Регион для поиска стажировки пока не выбран. Его можно добавить в блоке «Медиасреда и повестка».',
    customDeadlineList10:'Личных дат пока нет. Добавьте собственный дедлайн, если хотите видеть его рядом с вузовскими сроками.',
    archiveDeadlineList10:'Архивных дат для выбранных вузов сейчас нет.',
    simHistoryList:'История пока пустая. После первой симуляции здесь появится попытка.',
    interviewHistoryList:'Сохранённых ответов пока нет.',
    cloudList:'Медиаоблаков пока нет. Добавьте первое СМИ или журналиста и связанные с ним имена.'
  };
  function applyEmptyStates(){
    Object.entries(emptyStates).forEach(([id,text])=>{
      const el=document.getElementById(id);if(!el)return;
      const meaningful=(el.textContent||'').trim();
      const hasUI=el.querySelector('button,input,textarea,select,.mmtSelect,.card,.work11,.editorial11,.deadline10,.cloudCard');
      if(!meaningful&&!hasUI)el.innerHTML=`<div class="mmtSoon"><b>Пока пусто.</b><br>${text}</div>`;
    });
  }

  /* Turn obvious prototype-only actions into honest non-clickable states instead of fake buttons. */
  function cleanPrototypeActions(root=document){
    root.querySelectorAll?.('button,[onclick]').forEach(el=>{
      const code=(el.getAttribute('onclick')||'').toLowerCase();
      const text=(el.textContent||'').trim().toLowerCase();
      const placeholder=/добавим позже|станет отдельным|углубим|не подключена|здесь появится|демо/.test(code);
      if(!placeholder)return;
      /* Keep genuine demo flows that change state; only neutralize pure toast placeholders. */
      if(code && !/^\s*toast\(/.test(code) && !/onclick="?toast/.test('onclick="'+code))return;
      el.removeAttribute('onclick');
      el.classList.add('mmtDisabledAction');
      el.setAttribute('aria-disabled','true');
      if(!el.querySelector('.mmt-clean-label')){
        const label=document.createElement('span');label.className='mmt-clean-label';
        if(!/скоро|позже/.test(text)) label.textContent=' · позже';
        el.appendChild(label);
      }
    });
  }

  /* Video reviews are known planned content, so show them honestly without fake click interaction. */
  document.querySelectorAll('.video-placeholder').forEach(el=>{
    el.classList.add('mmtVideoPending');
    el.removeAttribute('onclick');
    el.setAttribute('aria-disabled','true');
  });

  /* DVI overview: static cards that currently have no action should say what they are for. */
  const dvi=document.getElementById('dvi');
  if(dvi){
    [...dvi.querySelectorAll('.card')].forEach(card=>{
      if(card.matches('[data-go],.click')||card.querySelector('[data-go],button,a'))return;
      if(card.querySelector('.mmtCleanupNote'))return;
      const note=document.createElement('div');note.className='mmtCleanupNote';
      note.textContent='Содержательный тренажёр будет доработан в следующем большом блоке.';
      card.appendChild(note);
    });
  }

  /* File upload is not implemented in the web prototype: replace fake upload button with clear status. */
  document.querySelectorAll('.filebox').forEach(box=>{
    const fake=[...box.querySelectorAll('button')].find(b=>/добавить/i.test(b.textContent||''));
    if(fake){fake.remove();if(!box.querySelector('.mmtCleanupNote')){const n=document.createElement('div');n.className='mmtCleanupNote';n.textContent='Загрузка файлов появится в мобильной версии. Сейчас можно сохранять ссылку на материал в портфолио.';box.appendChild(n)}}
  });

  /* Basic audit: visible empty blocks, missing routes and labels. */
  function sanitationAudit(){
    applyEmptyStates();cleanPrototypeActions();
    document.querySelectorAll('[data-go]').forEach(el=>{const c=canonical(el.dataset.go);if(c!==el.dataset.go)el.dataset.go=c});
    const missing=[...document.querySelectorAll('[data-go]')].filter(el=>el.dataset.go&&!document.getElementById(el.dataset.go)).map(el=>({target:el.dataset.go,text:(el.textContent||'').trim().slice(0,70)}));
    const blankVisible=[...document.querySelectorAll('.screen:not([data-mmt-legacy="1"]) .card,.screen:not([data-mmt-legacy="1"]) .notice,.screen:not([data-mmt-legacy="1"]) .metric')].filter(el=>{
      if(!(el.textContent||'').trim()&& !el.querySelector('input,textarea,select,.mmtSelect,button,img,video'))return true;
      return false;
    }).map(el=>({screen:el.closest('.screen')?.id||'',className:el.className}));
    window.MMT_SANITATION_AUDIT={missingRoutes:missing,blankVisible,legacyRoutes:aliases,version:'0.12.4'};
    if(missing.length||blankVisible.length)console.warn('[MMT v0.12.4] sanitation audit',window.MMT_SANITATION_AUDIT);
    return window.MMT_SANITATION_AUDIT;
  }
  window.runMMTSanitationAudit=sanitationAudit;

  /* Dynamic screens can repaint after navigation. Re-apply non-destructive cleanup. */
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-go],button,.mmtSelectOption'))setTimeout(()=>{applyEmptyStates();cleanPrototypeActions();},100);
  },true);
  new MutationObserver(ms=>{
    if(ms.some(m=>m.addedNodes.length))setTimeout(()=>{applyEmptyStates();cleanPrototypeActions();},30);
  }).observe(document.querySelector('main')||document.body,{subtree:true,childList:true});

  setTimeout(sanitationAudit,0);setTimeout(sanitationAudit,500);
})();
