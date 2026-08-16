/* MMT ДВИ v0.12.10 — СПбГИКиТ: restore both Journalism and Television programs */
(function setupV01210(){
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.12.10';
  document.title='MMT ДВИ — v0.12.10';
  const U=window.MMT_UNIVERSITIES;if(!U?.spbgikit)return;
  const u=U.spbgikit;

  u.program='42.03.02 Журналистика · «Журналистика в медиаиндустрии» + 42.03.04 Телевидение · «Телевизионное производство и вещание»';
  u.programs=[
    {code:'42.03.02',name:'Журналистика',profile:'Журналистика в медиаиндустрии',forms:['очная','очно-заочная'],budget:'6 мест очно · 8 мест очно-заочно',paid:'18 мест очно · 3 места очно-заочно',tuition:'283 000 ₽/год очно · 146 000 ₽/год очно-заочно'},
    {code:'42.03.04',name:'Телевидение',profile:'Телевизионное производство и вещание',forms:['очная'],budget:'9 мест',paid:'36 мест',tuition:'310 000 ₽/год'}
  ];
  u.budget='Журналистика: 6 очно / 8 очно-заочно · Телевидение: 9 очно · 2026';
  u.tuition='Журналистика: 283 000 ₽ очно / 146 000 ₽ очно-заочно · Телевидение: 310 000 ₽ · 2026';
  u.model='общие ДВИ для журналистики и телевидения: письменная работа + коллоквиум';
  u.status='две программы внесены · структура ДВИ заполнена';

  const admission=document.getElementById('tab-admission');
  if(admission){
    admission.innerHTML=`
      <div class="card orange">
        <div class="row between"><div><h3>42.03.02 Журналистика</h3><p class="meta">«Журналистика в медиаиндустрии»</p></div><span class="status o">очная / очно-заочная</span></div>
        <div class="score"><span>Бюджет · очная</span><strong>6 мест</strong></div>
        <div class="score"><span>Платно · очная</span><strong>18 мест</strong></div>
        <div class="score"><span>Стоимость · очная</span><strong>283 000 ₽/год</strong></div>
        <div class="score"><span>Бюджет · очно-заочная</span><strong>8 мест</strong></div>
        <div class="score"><span>Платно · очно-заочная</span><strong>3 места</strong></div>
        <div class="score"><span>Стоимость · очно-заочная</span><strong>146 000 ₽/год</strong></div>
      </div>
      <div class="card orange">
        <div class="row between"><div><h3>42.03.04 Телевидение</h3><p class="meta">«Телевизионное производство и вещание»</p></div><span class="status o">очная</span></div>
        <div class="score"><span>Бюджет</span><strong>9 мест</strong></div>
        <div class="score"><span>Платно</span><strong>36 мест</strong></div>
        <div class="score"><span>Стоимость</span><strong>310 000 ₽/год</strong></div>
      </div>
      <div class="card">
        <h3>Что нужно сдать</h3>
        <p class="sub">Для обеих программ в текущем каркасе используются одинаковые вступительные испытания.</p>
        <div class="score"><span>Русский язык</span><strong>56+</strong></div>
        <div class="score"><span>Литература</span><strong>45+</strong></div>
        <div class="score"><span>Письменная работа</span><strong>40+</strong></div>
        <div class="score"><span>Коллоквиум</span><strong>40+</strong></div>
        <button class="btn ghost" data-go="scores">Посчитать по моим баллам</button>
      </div>
      <div class="card click" data-go="sources"><div class="row between"><div><h3>Источники и актуальность</h3><p class="meta">Официальные материалы + дата проверки</p></div><span class="chev">›</span></div></div>
      <button class="btn" onclick="toggleV10Plan('spbgikit')">Добавить / убрать СПбГИКиТ из моего плана</button>`;
  }

  /* Refresh the shared passport copy for an already injected old node. */
  const pass=document.getElementById('passport10-spbgikit');
  if(pass){
    const boxes=pass.querySelectorAll('.pbox b');
    if(boxes[1])boxes[1].textContent=u.status;
    if(boxes[2])boxes[2].textContent=u.formats.join(' + ');
  }

  /* Give the university header a compact two-program cue. */
  const screen=document.getElementById('uni');
  if(screen&&!document.getElementById('spbgikit-programs-note')){
    const tabs=screen.querySelector('.tabs');
    if(tabs){
      const n=document.createElement('div');n.id='spbgikit-programs-note';n.className='notice';
      n.innerHTML='<b>В базе две программы:</b> 42.03.02 «Журналистика» и 42.03.04 «Телевидение». Условия по местам и стоимости показаны отдельно.';
      tabs.insertAdjacentElement('beforebegin',n);
    }
  }

  if(typeof window.renderV10==='function')window.renderV10();
})();
