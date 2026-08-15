/* MMT ДВИ v0.5.1 — реальный билет МПГУ 18.07.2024 */
(function setupV051(){
  const ver=document.querySelector('.ver'); if(ver) ver.textContent='v0.5.1';
  document.title='MMT ДВИ — v0.5.1';

  const mpguTopics=[
    '«Фотографии открывают двери в прошлое, но также позволяют заглянуть и в будущее» (С. Манн)',
    'Монолог пуговицы',
    '«Сталинграду» (О. Берггольц)',
    '«Семья подобна ветвям на дереве. Мы растем в разных направлениях, но наши корни остаются едиными» (неизвестный автор)'
  ];
  state.mpguSelectedTopic = Number.isInteger(state.mpguSelectedTopic) ? state.mpguSelectedTopic : 0;

  function appendScreen(id,html){
    if(document.getElementById(id)) return document.getElementById(id);
    const s=document.createElement('section'); s.id=id; s.className='screen'; s.innerHTML=html; document.querySelector('main').appendChild(s); return s;
  }

  const css=document.createElement('style');
  css.textContent=`
    .ticketlist{display:grid;gap:9px;margin:12px 0}.tickettopic{background:#fff;border:1px solid var(--line);border-radius:16px;padding:13px;line-height:1.42}.tickettopic b{display:block;font-size:11px;color:var(--soft);margin-bottom:5px}.tickettopic.selected{border:2px solid var(--o);background:#fff8f4}.sourcechip{display:inline-flex;align-items:center;gap:6px;background:var(--yb);color:var(--y);border-radius:999px;padding:6px 9px;font-size:11px;font-weight:700}.mmtread{border-left:4px solid var(--o);padding-left:12px;margin:14px 0}.mmtread p{margin:5px 0}
  `;
  document.head.appendChild(css);

  const mpgu=document.getElementById('mpgu');
  if(mpgu){
    const old=[...mpgu.querySelectorAll('.card')].find(x=>x.textContent.includes('Пример из материалов MMT'));
    if(old){
      const card=document.createElement('div'); card.className='card';
      card.innerHTML=`<div class="row between"><div><h3>Реальный билет МПГУ</h3><p class="meta">18 июля 2024 · творческое сочинение</p></div><span class="sourcechip">реальный билет</span></div><div class="ticketlist">${mpguTopics.map((t,i)=>`<div class="tickettopic"><b>Тема ${i+1}</b>${t}</div>`).join('')}</div><div class="demoSource"><b>Источник этого блока:</b> фотография реального экзаменационного билета, предоставленная учеником/ученицей. Это подтверждает темы конкретного экзамена 18 июля 2024 года, но не означает, что они повторятся в будущей кампании.</div><button class="btn secondary" data-go="mpguTicket">Потренироваться на этом билете</button>`;
      old.replaceWith(card);
    }
  }

  const prep=document.getElementById('mpguPrep');
  if(prep){
    const module=[...prep.querySelectorAll('.moduleline')].find(x=>x.textContent.includes('Пробные темы'));
    if(module){module.classList.add('click');module.setAttribute('data-go','mpguTicket');}
    const hero=prep.querySelector('.card.hero');
    if(hero && !document.getElementById('mpguMethodNote')){
      const note=document.createElement('div'); note.id='mpguMethodNote'; note.className='card';
      note.innerHTML='<h3>Что видно по реальному билету 2024</h3><div class="mmtread"><p><b>Методический вывод MMT, а не официальное правило:</b></p><p>в одном билете соседствуют очень разные входы в текст — цитата, предметный монолог и литературная тема. Поэтому готовиться только к одному типу вроде «монолога предмета» недостаточно.</p></div>';
      hero.after(note);
    }
  }

  appendScreen('mpguTicket',`
    <div class="eye">МПГУ · реальный билет</div><h2>Творческое сочинение</h2>
    <div class="demoSource"><b>18 июля 2024.</b> Ниже — четыре темы с фотографии реального билета. В тренировке можно выбрать любую одну, как на экзамене.</div>
    <div class="ticketlist" id="mpguTicketTopics">${mpguTopics.map((t,i)=>`<button class="tickettopic ${i===state.mpguSelectedTopic?'selected':''}" data-mpgu-topic="${i}" onclick="selectMpguTopic(${i})"><b>Тема ${i+1}</b>${t}</button>`).join('')}</div>
    <div class="card softo"><h3>Перед тем как писать</h3><p>За 3–5 минут сформулируйте: кто или что будет центром текста, какой конфликт/вопрос вы разворачиваете, откуда начинается движение и к чему придёте в финале.</p><p class="meta">Это рекомендация MMT для тренировки, не формулировка экзаменационной комиссии.</p></div>
    <div class="label">Выбранная тема</div><div id="mpguChosenTopic" class="formula"></div>
    <div class="label">Замысел в 2–4 предложениях</div><textarea id="mpguIdea" class="textarea" style="min-height:90px" placeholder="О чём будет ваш текст и в чём его ход?"></textarea>
    <div class="label">Начало текста</div><textarea id="mpguDraft" class="textarea" placeholder="Напишите первые абзацы..."></textarea>
    <button class="btn" onclick="saveMpguTicketDraft()">Сохранить тренировку</button>
    <button class="btn secondary" onclick="randomMpguTopic()">Выдать случайную тему из билета</button>`);

  window.selectMpguTopic=function(i){
    state.mpguSelectedTopic=i; saveState(); renderMpguTicket();
  };
  window.randomMpguTopic=function(){
    let i=Math.floor(Math.random()*mpguTopics.length); if(mpguTopics.length>1 && i===state.mpguSelectedTopic)i=(i+1)%mpguTopics.length; state.mpguSelectedTopic=i; saveState(); renderMpguTicket(); toast('Тема выбрана случайно');
  };
  window.saveMpguTicketDraft=function(){
    const idea=document.getElementById('mpguIdea')?.value.trim()||''; const draft=document.getElementById('mpguDraft')?.value.trim()||'';
    if(idea.length<20){toast('Сначала коротко сформулируйте замысел');return}
    if(draft.length<80){toast('Добавьте хотя бы несколько предложений текста');return}
    state.mpguTicketDraft={topic:state.mpguSelectedTopic,idea,draft}; saveState(); toast('Тренировка сохранена в демо');
  };
  function renderMpguTicket(){
    const chosen=document.getElementById('mpguChosenTopic'); if(chosen)chosen.textContent=mpguTopics[state.mpguSelectedTopic];
    document.querySelectorAll('[data-mpgu-topic]').forEach(x=>x.classList.toggle('selected',Number(x.dataset.mpguTopic)===state.mpguSelectedTopic));
  }

  const oldRefresh=window.refresh;
  if(typeof oldRefresh==='function'){
    window.refresh=function(){oldRefresh();renderMpguTicket();};
  }
  renderMpguTicket();
})();
