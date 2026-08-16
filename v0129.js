/* MMT ДВИ v0.12.9 — catalog filter sync after custom selects */
(function setupV0129(){
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.12.9';
  document.title='MMT ДВИ — v0.12.9';

  const UNIS=window.MMT_UNIVERSITIES;if(!UNIS)return;
  state.v10Catalog=state.v10Catalog&&typeof state.v10Catalog==='object'?state.v10Catalog:{query:'',city:'all',format:'all',planOnly:false};

  function fmtMatch(u,f){
    if(!f||f==='all')return true;
    const s=(u.formats||[]).join(' ').toLowerCase();
    if(f==='oral')return /коллоквиум|собесед/.test(s);
    if(f==='written')return /письмен|эссе|творческий текст/.test(s);
    if(f==='test')return /тест/.test(s);
    if(f==='portfolio')return !!u.portfolio;
    return true;
  }
  function planned(u){return !!state[u.stateKey]}
  function safe(s){return typeof esc==='function'?esc(String(s??'')):String(s??'')}

  function readControls(){
    const city=document.getElementById('v10City');
    const format=document.getElementById('v10Format');
    const query=document.getElementById('v10UniQuery');
    const plan=document.getElementById('v10PlanOnly');
    if(city)state.v10Catalog.city=city.value||'all';
    if(format)state.v10Catalog.format=format.value||'all';
    if(query)state.v10Catalog.query=query.value||'';
    if(plan)state.v10Catalog.planOnly=!!plan.checked;
  }

  function renderCatalog129(){
    const box=document.getElementById('v10CatalogList');if(!box)return;
    readControls();
    const f=state.v10Catalog;
    const q=(f.query||'').trim().toLowerCase();
    const arr=Object.values(UNIS).filter(u=>
      (f.city==='all'||u.city===f.city) &&
      fmtMatch(u,f.format) &&
      (!f.planOnly||planned(u)) &&
      (!q||[u.title,u.city,u.location||'',u.locationDisplay||'',u.program,u.model,(u.formats||[]).join(' ')].join(' ').toLowerCase().includes(q))
    );
    box.innerHTML=arr.length?arr.map(u=>{
      const plan=planned(u),checked=(state.v10Compare||[]).includes(u.id);
      const place=u.locationDisplay||u.city;
      return `<div class="uniCard10 ${plan?'inplan':''}"><div class="titleline"><div><h3>${safe(u.title)}</h3><div class="meta">${safe(place)} · ${safe(u.program)}</div></div><span class="status ${plan?'g':'y'}">${plan?'в плане':'смотрю'}</span></div><div class="uniTags10"><span>${safe(u.model)}</span><span>${u.portfolio?'портфолио':'без отдельного портфолио в текущей модели'}</span></div><div class="score"><span>Кампания / версия</span><strong style="font-size:12px;text-align:right">${safe(u.cycle)}</strong></div><div class="score"><span>Статус данных</span><strong style="font-size:12px;text-align:right">${safe(u.status)}</strong></div><label class="comparePick"><input type="checkbox" ${checked?'checked':''} onchange="toggleV10Compare('${u.id}')"> Добавить к сравнению</label><div class="uniActions10"><button class="btn secondary" onclick="go('${u.screen}')">Подробнее</button><button class="btn ${plan?'ghost':''}" onclick="toggleV10Plan('${u.id}')">${plan?'Убрать из плана':'Добавить в план'}</button></div></div>`;
    }).join(''):`<div class="empty10">По выбранным фильтрам вузов пока нет.</div>`;
    const count=document.getElementById('v10CompareCount');if(count)count.textContent=(state.v10Compare||[]).length;
  }
  window.renderCatalog129=renderCatalog129;

  function bind(id,event){
    const el=document.getElementById(id);if(!el||el.dataset.v129Bound)return;
    el.dataset.v129Bound='1';
    el.addEventListener(event,()=>{readControls();try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){};renderCatalog129()},true);
  }
  bind('v10City','change');bind('v10Format','change');bind('v10UniQuery','input');bind('v10PlanOnly','change');

  /* Custom in-page select buttons dispatch change on the hidden select. Re-render again after the option click to avoid race with older renderers. */
  document.addEventListener('click',e=>{
    if(e.target.closest('.mmtSelectOption'))setTimeout(renderCatalog129,0);
  },true);

  const oldRender=window.renderV10;
  if(typeof oldRender==='function')window.renderV10=function(){oldRender();setTimeout(renderCatalog129,0)};
  const oldRefresh=window.refresh;
  if(typeof oldRefresh==='function')window.refresh=function(){oldRefresh();setTimeout(renderCatalog129,0)};

  renderCatalog129();
})();
