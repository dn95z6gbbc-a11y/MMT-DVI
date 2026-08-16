/* MMT ДВИ v0.13.9 — semantic/date guard: news vs announcement */
(function setupV0139(){
  const main=document.querySelector('main');if(!main)return;
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.13.9';
  document.title='MMT ДВИ — v0.13.9';
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){}};
  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  const css=document.createElement('style');css.id='mmt-v0139-css';css.textContent=`
    .time139Alert{background:#faeded;border:1px solid #d6aaaa;border-radius:15px;padding:11px 12px;margin:9px 0;font-size:11px;line-height:1.45}.time139Alert b{display:block;font-size:12px;margin-bottom:4px}.time139Alert ul{padding-left:18px;margin:6px 0}.time139Alert li{margin:3px 0}.time139Ok{background:#edf7ed;border:1px solid #a8c9a8;border-radius:14px;padding:9px 11px;margin:9px 0;font-size:10px;line-height:1.4}.time139Hint{background:var(--os);border-radius:14px;padding:9px 11px;margin:9px 0;font-size:10px;line-height:1.4}
  `;document.head.appendChild(css);

  const months={
    'января':0,'январь':0,'февраля':1,'февраль':1,'марта':2,'март':2,'апреля':3,'апрель':3,'мая':4,'май':4,'июня':5,'июнь':5,'июля':6,'июль':6,'августа':7,'август':7,'сентября':8,'сентябрь':8,'октября':9,'октябрь':9,'ноября':10,'ноябрь':10,'декабря':11,'декабрь':11
  };
  const futureVerbRe=/(^|[^а-яё])(откроют|откроет|откроется|запустят|запустит|запустится|начнут|начн[её]т|начн[её]тся|проведут|провед[её]т|пройд[её]т|состоится|появится|появятся|заработает|заработают|введут|введ[её]т|отменят|отменит|закроют|закроет|построят|построит|приедет|приедут|станет|станут|создадут|создаст|подпишут|подпишет|утвердят|утвердит|объявят|объявит|представят|представит|покажут|покажет|выпустят|выпустит|провед[её]тся|будет|будут|планирует|планируют|собирается|собираются|намерен|намерена|намерены|ожидается|запланирован|запланирована|запланировано|запланированы)([^а-яё]|$)/i;
  const relativeFutureRe=/(\bзавтра\b|\bпослезавтра\b|\bчерез\s+(?:один|два|три|четыре|пять|\d+)\s+(?:день|дня|дней|недел[юиь]|месяц|месяца|месяцев)\b|\bна\s+следующей\s+неделе\b|\bв\s+следующем\s+месяце\b)/i;

  function todayLocal(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function validDate(y,m,d){const x=new Date(y,m,d);return x.getFullYear()===y&&x.getMonth()===m&&x.getDate()===d?x:null}
  function parseDates(text){
    text=String(text||'');const found=[];
    let m;
    const word=/\b(\d{1,2})\s+(января|январь|февраля|февраль|марта|март|апреля|апрель|мая|май|июня|июнь|июля|июль|августа|август|сентября|сентябрь|октября|октябрь|ноября|ноябрь|декабря|декабрь)(?:\s+(\d{4}))?\b/gi;
    while((m=word.exec(text))){const y=m[3]?Number(m[3]):todayLocal().getFullYear(),x=validDate(y,months[m[2].toLowerCase()],Number(m[1]));if(x)found.push({date:x,raw:m[0]})}
    const dot=/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\b/g;
    while((m=dot.exec(text))){const x=validDate(Number(m[3]),Number(m[2])-1,Number(m[1]));if(x)found.push({date:x,raw:m[0]})}
    const iso=/\b(\d{4})-(\d{2})-(\d{2})\b/g;
    while((m=iso.exec(text))){const x=validDate(Number(m[1]),Number(m[2])-1,Number(m[3]));if(x)found.push({date:x,raw:m[0]})}
    return found;
  }
  function fmt(d){return d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}
  function ownItem(){return (state.v137OwnNews?.items||[]).find(x=>String(x.id)===String(state.v137OwnNews?.activeId))||null}
  function readFactInputs(item){
    if(!item)return null;
    const ids=['newFact','when','who','where','whyHow','sourceDetail','proof','commentWho','commentRole','secondSide','background','backgroundSource'];
    ids.forEach(k=>{const e=document.getElementById('own137-'+k);if(e)item[k]=e.value.trim()});
    persist();return item;
  }
  function readDraft(item){
    if(!item)return null;item.draft=item.draft||{};
    ['title','lead','body','comment','background'].forEach(k=>{const e=document.getElementById('own137-draft-'+k);if(e)item.draft[k]=e.value.trim()});
    persist();return item;
  }

  function futureEvidence(item){
    if(!item)return{strong:[],soft:[]};
    const strong=[],soft=[],today=todayLocal();
    const when=String(item.when||'').trim();
    parseDates(when).forEach(x=>{if(x.date>today)strong.push(`дата «${x.raw}» позже сегодняшней даты (${fmt(today)})`)});
    if(relativeFutureRe.test(when))strong.push(`поле «Когда?» сформулировано как будущее время: «${when}»`);

    const core=[['инфоповод',item.newFact||''],['заголовок',item.draft?.title||''],['лид',item.draft?.lead||'']];
    core.forEach(([label,text])=>{
      const hit=String(text).match(futureVerbRe);if(hit)strong.push(`${label}: найдено будущее действие «${hit[2]}»`);
      if(relativeFutureRe.test(String(text)))strong.push(`${label}: есть указание на будущее время`);
      parseDates(text).forEach(x=>{if(x.date>today)strong.push(`${label}: дата «${x.raw}» ещё не наступила`)});
    });

    const tail=[['тело',item.draft?.body||''],['комментарий',item.draft?.comment||''],['бэкграунд',item.draft?.background||'']];
    tail.forEach(([label,text])=>{
      const hit=String(text).match(futureVerbRe);if(hit)soft.push(`${label}: встречается будущее действие «${hit[2]}» — это допустимо, если речь о последствиях уже произошедшего события`);
      parseDates(text).forEach(x=>{if(x.date>today)soft.push(`${label}: есть будущая дата «${x.raw}» — проверьте, это продолжение истории, а не сам инфоповод`)});
    });
    return{strong:[...new Set(strong)],soft:[...new Set(soft)]};
  }

  function guard(item){const ev=futureEvidence(item);return{...ev,blocked:ev.strong.length>0}}
  function alertHtml(g,item){
    if(g.blocked)return `<div class="time139Alert"><b>Похоже, это анонс, а не уже произошедшая новость</b><div>Вы можете отметить «уже произошло», но фактура этому противоречит:</div><ul>${g.strong.map(x=>`<li>${safe(x)}</li>`).join('')}</ul><div><b>Что делать:</b> если событие действительно ещё впереди — выберите «Только будет». Для новостной практики вернитесь к нему после события или возьмите другой инфоповод.</div></div>`;
    if(item?.eventStatus==='past')return `<div class="time139Ok">✓ Явных признаков того, что главный инфоповод находится в будущем, система не обнаружила.</div>`;
    return `<div class="time139Hint">Система проверит не только ваш выбор, но и дату, формулировку инфоповода, заголовок и лид.</div>`;
  }

  function patchFacts(){
    const s=document.getElementById('newsOwn137'),item=ownItem();if(!s||!item)return;readFactInputs(item);const g=guard(item);
    let box=s.querySelector('#time139Facts');if(!box){box=document.createElement('div');box.id='time139Facts';const type=s.querySelector('#rub138EventType');(type||s.querySelector('.own137Hero'))?.after(box)}box.innerHTML=alertHtml(g,item);
    const toEditor=s.querySelector('[data-own137-editor]');if(toEditor){toEditor.disabled=g.blocked;toEditor.style.opacity=g.blocked?'.55':'';toEditor.title=g.blocked?'Сначала разберитесь: это будущее событие':''}
  }
  function patchEditor(){
    const s=document.getElementById('newsOwnEditor137'),item=ownItem();if(!s||!item)return;readDraft(item);const g=guard(item);
    let box=s.querySelector('#time139Editor');if(!box){box=document.createElement('div');box.id='time139Editor';s.querySelector('.own137Hero')?.after(box)}box.innerHTML=alertHtml(g,item)+(g.soft.length?`<div class="time139Hint"><b>Будущее внутри уже произошедшей новости:</b><br>${g.soft.map(safe).join('<br>')}</div>`:'');
    const submit=s.querySelector('[data-own138-submit]');if(submit){submit.disabled=g.blocked;submit.style.opacity=g.blocked?'.55':''}
  }
  function patch(){patchFacts();patchEditor()}

  ['newsOwn137','newsOwnEditor137'].forEach(id=>{const s=document.getElementById(id);if(s)new MutationObserver(()=>requestAnimationFrame(patch)).observe(s,{childList:true,subtree:false})});
  document.addEventListener('input',e=>{if(e.target.closest('#newsOwn137,#newsOwnEditor137'))setTimeout(patch,80)});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-v138-event-status]'))setTimeout(patch,0);
  });

  /* Capture phase: never let older handlers accept a self-declared past event when the actual core facts are future. */
  document.addEventListener('click',e=>{
    const editor=e.target.closest('[data-own137-editor]');
    const submit=e.target.closest('[data-own138-submit]');
    const review=e.target.closest('[data-v138-review-current]');
    if(!editor&&!submit&&!(review&&review.dataset.v138ReviewCurrent==='own'))return;
    const item=ownItem();if(!item)return;readFactInputs(item);readDraft(item);const g=guard(item);
    if(!g.blocked)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(typeof toast==='function')toast('Похоже, это будущее событие — сначала исправьте тип материала');
    if(editor)patchFacts();else patchEditor();
  },true);

  window.MMT_NEWS_TIME_GUARD={check:()=>{const item=ownItem();return futureEvidence(item)},parseDates,today:todayLocal};
  patch();
})();
