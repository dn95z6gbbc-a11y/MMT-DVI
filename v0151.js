/* MMT ДВИ v0.15.1 — reportage methodology + photo evidence */
(function setupV0151(){
  if(typeof state==='undefined') return;
  const VER='v0.15.1';
  const ver=document.querySelector('.ver'); if(ver) ver.textContent=VER;
  document.title='MMT ДВИ — '+VER;

  state.v150Reportage=state.v150Reportage&&typeof state.v150Reportage==='object'?state.v150Reportage:{};
  const R=state.v150Reportage;
  R.prep=R.prep||{}; R.field=R.field||{}; R.draft=R.draft||{};
  R.media=R.media&&typeof R.media==='object'?R.media:{photos:[],cover:null};
  R.media.photos=Array.isArray(R.media.photos)?R.media.photos:[];

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const persist=()=>{try{localStorage.setItem('mmtV04',JSON.stringify(state))}catch(e){console.warn('[MMT v0.15.1] persist failed',e)}};
  const notify=msg=>{if(typeof toast==='function')toast(msg);else console.log(msg)};

  const css=document.createElement('style');
  css.id='mmt-v0151-css';
  css.textContent=`
    .rep151ChoiceRow{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 3px}.rep151Choice{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:12px;padding:9px 11px;font-size:11px;font-weight:800}.rep151Choice.active{border-color:var(--o);background:var(--os)}
    .rep151Note{background:var(--os);border-radius:13px;padding:10px 11px;font-size:11px;line-height:1.45;margin:9px 0}.rep151Warn{background:#fff3ea;border:1px solid #eab896;border-radius:13px;padding:10px 11px;font-size:11px;line-height:1.45;margin:9px 0}
    .rep151MediaHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.rep151MediaHead .rep151Count{font-size:10px;background:var(--muted);border-radius:999px;padding:5px 7px;white-space:nowrap}.rep151Upload{display:block;border:1px dashed #bbb;border-radius:14px;padding:13px;text-align:center;font-size:11px;font-weight:800;cursor:pointer;margin:9px 0}.rep151Upload input{display:none}
    .rep151Grid{display:grid;gap:9px}.rep151Photo{border:1px solid var(--line);border-radius:15px;padding:10px;background:#fafafa}.rep151Photo img{width:100%;max-height:210px;object-fit:cover;border-radius:11px;background:#eee}.rep151PhotoGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.rep151PhotoGrid .input,.rep151PhotoGrid select{width:100%;box-sizing:border-box}.rep151Photo label{display:block;font-size:9px;font-weight:800;margin:6px 0 4px}.rep151Delete{border:0;background:transparent;color:#8e3e3e;font-size:10px;font-weight:800;padding:7px 0;cursor:pointer}.rep151Cover{border:1px solid var(--line);border-radius:15px;padding:10px;margin-top:12px}.rep151Cover img{width:100%;max-height:180px;object-fit:cover;border-radius:11px;background:#eee}.rep151Small{font-size:10px;color:var(--soft);line-height:1.4}.rep151Status{border-radius:13px;padding:10px 11px;font-size:11px;line-height:1.45;margin:9px 0;background:#eef5ee;border:1px solid #b5cbb5}.rep151Status.warn{background:#fff3ea;border-color:#eab896}.rep151Status.bad{background:#faeeee;border-color:#d99a9a}
    .rep151DraftCount{font-size:10px;color:var(--soft);margin-top:5px}.rep151SubmitBox{border-radius:14px;padding:11px 12px;margin:10px 0;font-size:11px;line-height:1.45}.rep151SubmitBox.bad{background:#faeeee;border:1px solid #d99a9a}.rep151SubmitBox.ok{background:#eef5ee;border:1px solid #b5cbb5}
  `;
  document.head.appendChild(css);

  // Large photo blobs should not live in localStorage. They are kept in IndexedDB on this device.
  const DB='mmt-dvi-media-v1', STORE='reportage';
  function openDB(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE,{keyPath:'id'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
  async function putBlob(id,blob){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id,blob,updatedAt:Date.now()});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
  async function getBlob(id){if(!id)return null;const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).get(id);q.onsuccess=()=>{db.close();resolve(q.result?.blob||null)};q.onerror=()=>{db.close();reject(q.error)}})}
  async function delBlob(id){if(!id)return;const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
  function uid(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function imageSize(file){return new Promise(resolve=>{const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>{resolve({width:im.naturalWidth,height:im.naturalHeight});URL.revokeObjectURL(u)};im.onerror=()=>{resolve({width:0,height:0});URL.revokeObjectURL(u)};im.src=u})}

  function patchPrep(){
    const s=document.getElementById('reportPrep150'); if(!s||s.querySelector('#rep151PrepExtra'))return;
    const sections=s.querySelectorAll('.rep150Section'); if(!sections.length)return;
    const x=document.createElement('div');x.id='rep151PrepExtra';x.className='rep150Section';
    x.innerHTML=`<h3>Тип репортажа и доступ</h3>
      <div class="rep150Field"><label>Какой репортаж вы делаете?</label><div class="rep151ChoiceRow"><button type="button" class="rep151Choice ${R.prep.reportType==='event'?'active':''}" data-rep151-type="event">Событийный</button><button type="button" class="rep151Choice ${R.prep.reportType==='thematic'?'active':''}" data-rep151-type="thematic">Тематический</button></div><div class="rep150Hint">Событийный держится на хронологии «до → во время → после». Тематический — на внутренней жизни места, героях, сценах и том, что нельзя увидеть без личного присутствия.</div></div>
      <div class="rep150Field"><label>Кто отвечает за событие / площадку?</label><input class="input" data-rep151-prep="organizer" value="${esc(R.prep.organizer||'')}" placeholder="Организатор, пресс-служба, площадка, команда…"></div>
      <div class="rep150Field"><label>Как вы согласовали журналистскую работу?</label><textarea class="textarea" data-rep151-prep="accessAgreement" placeholder="Кому написали, что ответили, нужна ли аккредитация или отдельное разрешение">${esc(R.prep.accessAgreement||'')}</textarea></div>
      <div class="rep151Warn"><b>Важно:</b> билет или обычный вход не всегда дают журналистский доступ к спикерам и право работать там, где действуют ограничения. Для крупных профессиональных событий заранее уточняйте аккредитацию и правила съёмки.</div>`;
    sections[0].after(x);
  }

  function patchField(){
    const s=document.getElementById('reportField150'); if(!s||s.querySelector('#rep151FieldExtra'))return;
    const sections=s.querySelectorAll('.rep150Section'); if(sections.length<2)return;
    const people=sections[1];
    const speaker=document.createElement('div');speaker.className='rep150Field';speaker.innerHTML=`<label>Сколько разных спикеров вы реально опросили?</label><input class="input" type="number" min="0" max="30" data-rep151-field="speakerCount" value="${esc(R.field.speakerCount||'')}" placeholder="Ориентир для учебного репортажа — не менее 4"><div class="rep150Hint">Организаторы, участники, зрители или другие люди, которые действительно добавляют фактуру. Не все обязаны попасть в текст прямой цитатой.</div>`;people.appendChild(speaker);

    const x=document.createElement('div');x.id='rep151FieldExtra';x.className='rep150Section';
    x.innerHTML=`<div class="rep151MediaHead"><div><h3>4. Фото с места</h3><div class="rep151Small">Фотографии — часть репортёрской фактуры, а не украшение.</div></div><span class="rep151Count" data-rep151-count></span></div>
      <label class="rep151Upload">＋ Добавить фотографии<input type="file" accept="image/*" multiple data-rep151-photo-input></label>
      <div class="rep151Small">Ориентир — 7–10 кадров: общий план, эмоции, детали. Для каждого кадра укажите подпись и источник / автора.</div>
      <div class="rep151Grid" data-rep151-photo-list></div>
      <div class="rep151Cover"><b>Горизонтальная обложка</b><div class="rep151Small">Просто фотография не считается готовой обложкой. Загрузите отдельную горизонтальную обложку с названием и датой.</div><label class="rep151Upload">＋ Загрузить обложку<input type="file" accept="image/*" data-rep151-cover-input></label><div data-rep151-cover></div></div>
      <div data-rep151-media-status></div>`;
    const confirm=[...s.querySelectorAll('.rep150Section')].find(n=>n.textContent.includes('Подтвердите способ работы'));
    if(confirm)confirm.before(x);else s.appendChild(x);
    renderMedia();
  }

  function patchDraft(){
    const s=document.getElementById('reportDraft150'); if(!s||s.querySelector('#rep151DraftExtra'))return;
    const textSection=[...s.querySelectorAll('.rep150Section')].find(n=>n.querySelector('[data-rep150-draft="text"]')); if(!textSection)return;
    const x=document.createElement('div');x.id='rep151DraftExtra';x.className='rep150Section';
    x.innerHTML=`<h3>Подводка и аннотация</h3>
      <div class="rep150Field"><label>Подводка внутри репортажа — 2 абзаца</label><textarea class="textarea" data-rep151-draft="lead" placeholder="1-й абзац вводит в тему. 2-й быстро объясняет, что сделал автор и куда он отправился.">${esc(R.draft.lead||'')}</textarea><div class="rep150Hint">Подводка относится к самому материалу и не заменяет аннотацию для соцсетей.</div></div>
      <div class="rep150Field"><label>Аннотация для VK / Telegram — если материал готовится к публикации</label><textarea class="textarea" data-rep151-draft="annotation" placeholder="1-й абзац — общий заход. 2-й — конкретно о материале, авторе и его работе.">${esc(R.draft.annotation||'')}</textarea><div class="rep150Hint">Это отдельный публикационный текст. Для тренировки репортажа можно оставить пустым.</div></div>`;
    textSection.before(x);
    const text=textSection.querySelector('[data-rep150-draft="text"]');
    const oldHint=text?.parentElement?.querySelector('.rep150Hint');if(oldHint)oldHint.textContent='Ориентир учебного репортажа — 5 000–7 000 знаков с пробелами. Это рекомендация, а не повод раздувать пустой текст.';
    if(text){const c=document.createElement('div');c.className='rep151DraftCount';c.dataset.rep151DraftCount='1';text.after(c);updateDraftCount(text)}
    const actions=s.querySelector('.rep150Actions');if(actions){const st=document.createElement('div');st.id='rep151SubmitStatus';actions.before(st)}
  }

  function updateDraftCount(textEl){const n=(textEl?.value||'').length;const el=document.querySelector('[data-rep151-draft-count]');if(el)el.textContent=`Сейчас: ${n.toLocaleString('ru-RU')} знаков с пробелами${n&&n<5000?' · короче рекомендуемого ориентира':n>7000?' · длиннее рекомендуемого ориентира':''}`}

  async function renderMedia(){
    const s=document.getElementById('reportField150');if(!s)return;
    const list=s.querySelector('[data-rep151-photo-list]'),coverBox=s.querySelector('[data-rep151-cover]'),count=s.querySelector('[data-rep151-count]');if(!list)return;
    count.textContent=`${R.media.photos.length} фото`;
    list.innerHTML='';
    for(const p of R.media.photos){
      const card=document.createElement('div');card.className='rep151Photo';card.dataset.photoId=p.id;
      const blob=await getBlob(p.id).catch(()=>null);const url=blob?URL.createObjectURL(blob):'';
      card.innerHTML=`${url?`<img src="${url}" alt="Фото репортажа">`:'<div class="rep151Warn">Файл фото не найден на этом устройстве. Загрузите его заново.</div>'}
        <div class="rep151PhotoGrid"><div><label>Тип кадра</label><select class="input" data-rep151-photo-meta="role"><option value="general" ${p.role==='general'?'selected':''}>Общий план</option><option value="emotion" ${p.role==='emotion'?'selected':''}>Эмоция / действие</option><option value="detail" ${p.role==='detail'?'selected':''}>Деталь</option><option value="other" ${p.role==='other'?'selected':''}>Другое</option></select></div><div><label>Источник / автор</label><input class="input" data-rep151-photo-meta="source" value="${esc(p.source||'')}" placeholder="Фото: автор / имя / пресс-служба"></div></div>
        <label>Подпись: что именно на фото?</label><input class="input" data-rep151-photo-meta="caption" value="${esc(p.caption||'')}" placeholder="Конкретная подпись, а не «фото с мероприятия»">
        <button type="button" class="rep151Delete" data-rep151-photo-delete="${esc(p.id)}">Удалить фото</button>`;
      list.appendChild(card);
    }
    coverBox.innerHTML='';
    if(R.media.cover?.id){
      const c=R.media.cover,blob=await getBlob(c.id).catch(()=>null),url=blob?URL.createObjectURL(blob):'';
      const ratio=c.width&&c.height?c.width/c.height:0;
      coverBox.innerHTML=`${url?`<img src="${url}" alt="Обложка репортажа">`:'<div class="rep151Warn">Файл обложки не найден на этом устройстве.</div>'}
        ${ratio&&ratio<1.3?'<div class="rep151Warn">Обложка выглядит недостаточно горизонтальной. Лучше использовать широкий кадр / коллаж.</div>':''}
        <div class="rep150Field"><label>Источник / автор обложки</label><input class="input" data-rep151-cover-meta="source" value="${esc(c.source||'')}" placeholder="Фото / коллаж: автор"></div>
        <label class="rep150Check"><input type="checkbox" data-rep151-cover-meta="ready" ${c.ready?'checked':''}>На готовой обложке есть название материала и дата.</label>
        <button type="button" class="rep151Delete" data-rep151-cover-delete>Удалить обложку</button>`;
    }
    updateMediaStatus();
  }

  function updateMediaStatus(){
    const el=document.querySelector('[data-rep151-media-status]');if(!el)return;
    const photos=R.media.photos,missingMeta=photos.filter(p=>!(p.source||'').trim()||!(p.caption||'').trim()).length,cover=R.media.cover;
    let cls='rep151Status',text='';
    if(!photos.length||!cover?.id){cls+=' bad';text='Для полноценного учебного репортажа нужны фотографии с места и отдельная обложка.'}
    else if(missingMeta||!(cover.source||'').trim()||!cover.ready){cls+=' warn';text='Файлы загружены, но ещё не у всех фото есть подпись / источник или не подтверждена готовность обложки.'}
    else if(photos.length<7){cls+=' warn';text=`Сейчас ${photos.length} фото. Формально фотоматериал есть, но ориентир для репортажа — 7–10 разных кадров.`}
    else{text=`Фотоматериал собран: ${photos.length} фото с подписями и источниками + обложка.`}
    el.innerHTML=`<div class="${cls}">${text}</div>`;
  }

  async function addPhotos(files){
    const left=Math.max(0,12-R.media.photos.length);const arr=[...files].slice(0,left);if(!arr.length)return notify('В прототипе можно сохранить до 12 фото на один репортаж');
    for(const f of arr){if(!f.type.startsWith('image/'))continue;if(f.size>10*1024*1024){notify(`Фото «${f.name}» больше 10 МБ и пропущено`);continue}const id=uid('rep-photo');await putBlob(id,f);R.media.photos.push({id,name:f.name,caption:'',source:'',role:'other',createdAt:new Date().toISOString()})}
    persist();await renderMedia();
  }
  async function addCover(file){if(!file||!file.type.startsWith('image/'))return;if(file.size>12*1024*1024)return notify('Обложка больше 12 МБ');if(R.media.cover?.id)await delBlob(R.media.cover.id).catch(()=>{});const id=uid('rep-cover'),sz=await imageSize(file);await putBlob(id,file);R.media.cover={id,name:file.name,source:'',ready:false,width:sz.width,height:sz.height,createdAt:new Date().toISOString()};persist();await renderMedia()}

  function syncExtra(){
    document.querySelectorAll('[data-rep151-prep]').forEach(el=>R.prep[el.dataset.rep151Prep]=el.value.trim());
    document.querySelectorAll('[data-rep151-field]').forEach(el=>R.field[el.dataset.rep151Field]=el.value.trim());
    document.querySelectorAll('[data-rep151-draft]').forEach(el=>R.draft[el.dataset.rep151Draft]=el.value.trim());
    document.querySelectorAll('[data-rep151-photo-meta]').forEach(el=>{const card=el.closest('[data-photo-id]'),p=R.media.photos.find(x=>x.id===card?.dataset.photoId);if(p)p[el.dataset.rep151PhotoMeta]=el.value.trim()});
    document.querySelectorAll('[data-rep151-cover-meta]').forEach(el=>{if(!R.media.cover)return;const k=el.dataset.rep151CoverMeta;R.media.cover[k]=el.type==='checkbox'?el.checked:el.value.trim()});
    R.updatedAt=new Date().toISOString();persist();
  }

  function twoParagraphs(v){return String(v||'').trim().split(/\n\s*\n/).filter(Boolean).length>=2}
  function enhancedProblems(){
    syncExtra();
    const d=R.draft,f=R.field,m=R.media,p=R.prep;
    const text=(document.querySelector('[data-rep150-draft="text"]')?.value||d.text||'').trim();
    const title=(document.querySelector('[data-rep150-draft="title"]')?.value||d.title||'').trim();
    const checks=[...document.querySelectorAll('#reportDraft150 [data-rep150-draft-check]')];
    const critical=[];const warnings=[];
    if(!p.reportType)critical.push('выберите тип репортажа: событийный или тематический');
    if(!title||text.length<250)critical.push('нужен полноценный черновик репортажа');
    if(!twoParagraphs(d.lead))critical.push('подводка должна состоять из двух абзацев');
    if(!String(f.quotes||'').trim())critical.push('в полевых заметках нет зафиксированных реплик / комментариев');
    const sc=Number(f.speakerCount||0);if(sc<4)critical.push('для учебной работы нужно поговорить минимум с 4 разными спикерами');
    if(!m.photos.length)critical.push('нет фотографий с места события');
    if(m.photos.some(x=>!(x.caption||'').trim()||!(x.source||'').trim()))critical.push('у каждого фото нужны подпись и источник / автор');
    if(!m.cover?.id)critical.push('нет отдельной горизонтальной обложки');
    else {if(!(m.cover.source||'').trim())critical.push('у обложки не указан источник / автор');if(!m.cover.ready)critical.push('не подтверждено, что на обложке есть название и дата')}
    if(checks.some(x=>!x.checked))critical.push('завершите самопроверку черновика');
    if(text.length&&text.length<5000)warnings.push('текст короче рекомендуемого ориентира 5 000–7 000 знаков');
    if(text.length>7000)warnings.push('текст длиннее рекомендуемого ориентира 5 000–7 000 знаков');
    if(m.photos.length>0&&m.photos.length<7)warnings.push(`сейчас ${m.photos.length} фото; ориентир — 7–10`);
    return {critical,warnings};
  }

  function showSubmitStatus(kind,lines){const box=document.getElementById('rep151SubmitStatus');if(!box)return;box.innerHTML=`<div class="rep151SubmitBox ${kind}">${lines.map(esc).join('<br>')}</div>`}

  document.addEventListener('click',async e=>{
    const type=e.target.closest('[data-rep151-type]');if(type){e.preventDefault();R.prep.reportType=type.dataset.rep151Type;persist();patchPrep();document.querySelectorAll('[data-rep151-type]').forEach(b=>b.classList.toggle('active',b.dataset.rep151Type===R.prep.reportType));return}
    const del=e.target.closest('[data-rep151-photo-delete]');if(del){e.preventDefault();const id=del.dataset.rep151PhotoDelete;R.media.photos=R.media.photos.filter(p=>p.id!==id);await delBlob(id).catch(()=>{});persist();await renderMedia();return}
    if(e.target.closest('[data-rep151-cover-delete]')){e.preventDefault();const id=R.media.cover?.id;if(id)await delBlob(id).catch(()=>{});R.media.cover=null;persist();await renderMedia();return}
  });

  document.addEventListener('change',async e=>{
    if(e.target.matches('[data-rep151-photo-input]')){await addPhotos(e.target.files||[]);e.target.value='';return}
    if(e.target.matches('[data-rep151-cover-input]')){await addCover(e.target.files?.[0]);e.target.value='';return}
    if(e.target.closest('[data-rep151-photo-meta],[data-rep151-cover-meta],[data-rep151-prep],[data-rep151-field],[data-rep151-draft]')){syncExtra();updateMediaStatus()}
  });
  document.addEventListener('input',e=>{if(e.target.closest('[data-rep151-photo-meta],[data-rep151-cover-meta],[data-rep151-prep],[data-rep151-field],[data-rep151-draft]')){syncExtra();if(e.target.matches('[data-rep151-draft="lead"],[data-rep151-draft="annotation"]')){};updateMediaStatus()}if(e.target.matches('[data-rep150-draft="text"]'))updateDraftCount(e.target)});

  // Intercept final submission only to enforce the methodology additions. Saving drafts still works as before.
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-rep150-submit]');if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    const r=enhancedProblems();
    if(r.critical.length){showSubmitStatus('bad',['Пока нельзя сохранять для редакторского разбора:','• '+r.critical.join(' • ')]);notify('Сначала закройте обязательные элементы репортажа');return}
    R.submitted=true;R.submittedAt=new Date().toISOString();R.v151Warnings=r.warnings;persist();
    showSubmitStatus('ok',[r.warnings.length?'Черновик сохранён. Есть рекомендации: '+r.warnings.join('; ')+'.':'Черновик сохранён для редакторского разбора. Обязательные элементы собраны.']);
    notify('Репортаж сохранён для редакторского разбора');
  },true);

  const obs=new MutationObserver(()=>{patchPrep();patchField();patchDraft()});
  obs.observe(document.body,{subtree:true,childList:true});
  patchPrep();patchField();patchDraft();
})();
