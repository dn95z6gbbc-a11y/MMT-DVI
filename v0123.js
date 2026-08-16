/* MMT ДВИ v0.12.3 — custom in-page selects; avoid Android native picker entirely */
(function setupV0123(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.12.3';
  document.title='MMT ДВИ — v0.12.3';

  const css=document.createElement('style');
  css.id='mmt-v0123-css';
  css.textContent=`
    select.mmt-native-select{display:none!important}
    .mmtSelect{position:relative;margin:6px 0 12px}
    .mmtSelectBtn{width:100%;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:14px;padding:13px 42px 13px 14px;text-align:left;position:relative;min-height:48px}
    .mmtSelectBtn:after{content:'⌄';position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--soft)}
    .mmtSelect.open .mmtSelectBtn{border-color:var(--o);box-shadow:0 0 0 2px #e7794618}
    .mmtSelectList{display:none;background:#fff;border:1px solid var(--line);border-radius:14px;margin-top:6px;padding:5px;box-shadow:0 10px 24px #00000012}
    .mmtSelect.open .mmtSelectList{display:grid;gap:3px}
    .mmtSelectOption{border:0;background:#fff;color:var(--ink);text-align:left;padding:11px 10px;border-radius:10px;line-height:1.25}
    .mmtSelectOption.selected{background:var(--os);font-weight:700}
    .mmtSelectOption:active{background:var(--muted)}
    .mmtSelect.disabled{opacity:.58;pointer-events:none}
  `;
  document.head.appendChild(css);

  function getLabel(select){
    const opt=select.options[select.selectedIndex]||select.options[0];
    return opt?(opt.textContent||'').trim():'Выберите вариант';
  }

  function closeAll(except){
    document.querySelectorAll('.mmtSelect.open').forEach(w=>{if(w!==except)w.classList.remove('open')});
  }

  function renderOptions(select,wrap){
    const list=wrap.querySelector('.mmtSelectList');
    const btn=wrap.querySelector('.mmtSelectBtn');
    if(!list||!btn)return;
    btn.textContent=getLabel(select)||'Выберите вариант';
    btn.disabled=select.disabled;
    wrap.classList.toggle('disabled',select.disabled);
    const options=[...select.options];
    list.innerHTML=options.map((o,i)=>`<button type="button" class="mmtSelectOption ${i===select.selectedIndex?'selected':''}" data-mmt-index="${i}">${(o.textContent||'Вариант').trim()||'Вариант'}</button>`).join('');
    list.querySelectorAll('.mmtSelectOption').forEach(b=>{
      b.addEventListener('click',()=>{
        const idx=Number(b.dataset.mmtIndex);
        if(!Number.isInteger(idx)||!select.options[idx])return;
        select.selectedIndex=idx;
        select.dispatchEvent(new Event('input',{bubbles:true}));
        select.dispatchEvent(new Event('change',{bubbles:true}));
        renderOptions(select,wrap);
        wrap.classList.remove('open');
        if(typeof window.hardRecoverMMTNav==='function')window.hardRecoverMMTNav();
        if(typeof window.updateMMTBottomNav==='function')window.updateMMTBottomNav();
      });
    });
  }

  function upgrade(select){
    if(!(select instanceof HTMLSelectElement)||select.dataset.mmtUpgraded==='1')return;
    select.dataset.mmtUpgraded='1';
    select.classList.add('mmt-native-select');
    const wrap=document.createElement('div');wrap.className='mmtSelect';
    const btn=document.createElement('button');btn.type='button';btn.className='mmtSelectBtn';
    const list=document.createElement('div');list.className='mmtSelectList';
    wrap.append(btn,list);select.after(wrap);
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const willOpen=!wrap.classList.contains('open');
      closeAll(wrap);wrap.classList.toggle('open',willOpen);
      if(willOpen)renderOptions(select,wrap);
    });
    select.addEventListener('change',()=>renderOptions(select,wrap));
    new MutationObserver(()=>renderOptions(select,wrap)).observe(select,{childList:true,subtree:true,attributes:true});
    renderOptions(select,wrap);
  }

  function upgradeAll(root=document){
    if(root instanceof HTMLSelectElement)upgrade(root);
    root.querySelectorAll?.('select').forEach(upgrade);
  }

  upgradeAll();
  document.addEventListener('click',e=>{if(!e.target.closest('.mmtSelect'))closeAll();});
  new MutationObserver(ms=>{
    ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)upgradeAll(n)}));
  }).observe(document.body,{childList:true,subtree:true});

  /* v0.12.1/2 nav watchdogs are no longer needed for select interactions. Keep one calm recovery timer. */
  if(window.MMT_NAV_WATCHDOG)clearInterval(window.MMT_NAV_WATCHDOG);
  window.MMT_NAV_WATCHDOG=setInterval(()=>{
    document.documentElement.style.setProperty('--mmt-vv-inset','0px','important');
    const nav=document.getElementById('mmtSystemNav');
    if(nav){
      nav.style.setProperty('bottom','0','important');
      nav.style.setProperty('display','grid','important');
      nav.style.setProperty('visibility','visible','important');
      nav.style.setProperty('opacity','1','important');
    }
  },1500);
})();
