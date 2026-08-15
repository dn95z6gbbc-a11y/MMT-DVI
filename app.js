const defaults={savedUni:false,taskChecks:{},submitted:false,revised:false,reportAccepted:false,calendarDone:{},works:[]};
let state=load(),stack=['splash'],selectedEvent='docs';
const events={
 docs:{title:'Дедлайн документов',date:'10 июля',action:'Проверить комплект документов и убедиться, что заявление отправлено до дедлайна.'},
 written:{title:'Письменная работа',date:'16 июля',action:'Проверить место и время, подготовить документы и заранее пройти пробный режим.'},
 oral:{title:'Коллоквиум',date:'18 июля',action:'Повторить слабые темы, подготовить примеры из повестки и пройти симуляцию.'},
 results:{title:'Результаты',date:'25 июля',action:'Проверить результат и следующий обязательный шаг по поступлению.'}
};
function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem('mmtV04')||'{}'))}catch(e){return {...defaults}}}
function saveState(){localStorage.setItem('mmtV04',JSON.stringify(state));refresh()}
function render(id){
 document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
 const s=document.getElementById(id);if(s){s.classList.add('active');scrollTo(0,0)}
 document.getElementById('backBtn').classList.toggle('hidden',stack.length<=1);
 document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.nav===id));refresh()
}
function go(id){if(stack.at(-1)!==id)stack.push(id);render(id)}
function back(){if(stack.length>1){stack.pop();render(stack.at(-1))}}
document.getElementById('backBtn').onclick=back;
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]');if(t){if(t.dataset.event)selectedEvent=t.dataset.event;go(t.dataset.go)}});
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');document.getElementById('tab-'+b.dataset.tab).classList.add('active')
});
document.querySelectorAll('.option').forEach(o=>o.onclick=()=>{
 document.querySelectorAll('.option').forEach(x=>x.classList.remove('correct','wrong'));
 if(o.dataset.answer==='correct'){o.classList.add('correct');document.getElementById('microFeedback').classList.add('show');document.getElementById('microNext').style.display='block'}
 else{o.classList.add('wrong');toast('Этот факт можно получить и без присутствия на событии. Попробуйте ещё.')}
});
document.querySelectorAll('.taskcheck').forEach(c=>c.onchange=()=>{state.taskChecks[c.dataset.key]=c.checked;saveState()});
function toggleUniSave(){state.savedUni=!state.savedUni;saveState();toast(state.savedUni?'СПбГИКиТ сохранён':'СПбГИКиТ убран из сохранённых')}
function calcScores(){const r=+document.getElementById('rus').value||0,l=+document.getElementById('lit').value||0,box=document.getElementById('scoreResult');box.style.display='block';
 if(r<56||l<45){box.className='card red';box.innerHTML='<h3>Есть проблема с минимумом</h3><p>Хотя бы один результат ниже указанного минимального порога.</p>'}
 else{box.className='card green';box.innerHTML='<h3>Минимумы пройдены</h3><p>Сумма ЕГЭ: <b>'+(r+l)+'</b>. Дальше приложение учитывает внутренние испытания, но не обещает поступление.</p>'}}
function submitWork(){if(!document.getElementById('selfCheck').checked){toast('Сначала подтвердите самопроверку фактов и цитат');return}state.submitted=true;saveState();go('submitted')}
function resubmit(){state.revised=true;state.submitted=false;state.reportAccepted=true;saveState();go('revisionDone')}
function addWork(){const title=document.getElementById('workTitle').value.trim();if(!title){toast('Введите название работы');return}
 state.works.push({title,type:document.getElementById('workType').value,genre:document.getElementById('workGenre').value,link:document.getElementById('workLink').value.trim(),published:document.getElementById('workPublished').checked});saveState();toast('Работа добавлена');go('portfolio')}
function markEvent(){state.calendarDone[selectedEvent]=true;saveState();toast('Событие отмечено выполненным')}
function resetDemo(){localStorage.removeItem('mmtV04');state={...defaults,taskChecks:{},calendarDone:{},works:[]};stack=['profile'];refresh();toast('Демо-прогресс сброшен')}
function refresh(){
 const sbtn=document.getElementById('saveUniBtn');if(sbtn)sbtn.textContent=state.savedUni?'♥ Сохранено':'♡ Сохранить';
 document.querySelectorAll('.taskcheck').forEach(c=>c.checked=!!state.taskChecks[c.dataset.key]);
 const n=Object.values(state.taskChecks).filter(Boolean).length,cc=document.getElementById('checkCount');if(cc){cc.textContent=n+'/6';cc.className='status '+(n===6?'g':'y')}
 const ts=document.getElementById('taskStatus');if(ts)ts.textContent=state.revised?'версия 2 засчитана':state.submitted?'отправлено на разбор':'не отправлен';
 const rs=document.getElementById('reviewState');if(rs){
  if(state.submitted)rs.innerHTML='<div class="row between"><div><b>Работ на проверке</b><p class="meta">Репортаж №1 · ждёт разбора</p></div><span class="status y">1</span></div>';
  else if(state.revised){rs.className='card green';rs.innerHTML='<div class="row between"><div><b>Последняя работа</b><p class="meta">Репортаж №1 · версия 2 засчитана</p></div><span class="status g">готово</span></div>'}
 }
 const base=state.revised?77:74,ready=state.revised?64:61,week=state.revised?4:3;
 setText('basePct',base+'%');setWidth('baseBar',base);setText('ready',ready+'%');setWidth('readyBar',ready);setText('weekText',week+' из 7');setWidth('weekBar',week/7*100);
 const total=8+state.works.length+(state.reportAccepted||state.revised?1:0),pub=3+state.works.filter(w=>w.published).length;
 setText('portfolioCount',total);setText('homePortfolio',total);setText('publishedCount',pub);
 setText('reportPortfolioStatus',(state.reportAccepted||state.revised)?'2 работы · одна после разбора':'1 учебная работа');
 const cw=document.getElementById('customWorks');if(cw)cw.innerHTML=state.works.map(w=>'<div class="action"><div class="ai">+</div><div><b>'+esc(w.title)+'</b><div class="meta">'+esc(w.genre)+' · '+esc(w.type)+'</div></div><b>'+(w.published?'СМИ':'')+'</b></div>').join('');
 document.querySelectorAll('.event[data-event]').forEach(el=>el.classList.toggle('done',!!state.calendarDone[el.dataset.event]));
 if(document.getElementById('event')?.classList.contains('active')){const d=events[selectedEvent];setText('eventTitle',d.title);setText('eventDate',d.date);setText('eventAction',d.action);setText('eventStatus',state.calendarDone[selectedEvent]?'выполнено':'не выполнено')}
 refreshUniGate();
}
function setText(id,v){const x=document.getElementById(id);if(x)x.textContent=v}function setWidth(id,v){const x=document.getElementById(id);if(x)x.style.width=v+'%'}
function esc(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
let tt;function toast(text){const t=document.getElementById('toast');t.textContent=text;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)}

/* v0.4.2: UX refinements + author/reviews */
(function setupV042(){
 const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.4.2';
 document.title='MMT ДВИ — v0.4.2';

 const signup=document.getElementById('signup');
 if(signup)signup.innerHTML=`<div class="eye">Сохранение плана</div><h2>Создать аккаунт</h2><p class="sub">После входа СПбГИКиТ попадёт в ваш план, а приложение добавит его ДВИ в маршрут, календарь и готовность.</p><div class="authgrid"><button class="btn secondary" data-auth="phone">По телефону</button><button class="btn secondary" data-auth="vk">Через VK</button><button class="btn secondary" data-auth="email">По e-mail</button><button class="btn secondary" data-auth="telegram">Через Telegram</button></div><div class="notice">В прототипе все способы ведут в демо-профиль. В рабочем приложении Telegram можно будет подключить отдельно для бота и уведомлений.</div><button class="btn" data-auth="demo">Добавить СПбГИКиТ в план и открыть демо</button>`;
 signup.addEventListener('click',e=>{const b=e.target.closest('[data-auth]');if(!b)return;state.savedUni=true;saveState();toast('СПбГИКиТ добавлен в план');go('home')});

 document.addEventListener('click',e=>{
   const g=e.target.closest('[data-go]');if(!g||state.savedUni)return;
   const dest=g.dataset.go,section=g.closest('.screen')?.id;
   const specific=dest==='spbgikit'||(section==='oral'&&dest==='oralTrainer');
   if(specific){e.preventDefault();e.stopImmediatePropagation();toast('Сначала добавьте СПбГИКиТ в свой план');go('signup')}
 },true);

 const profile=document.getElementById('profile');
 if(profile&&!document.getElementById('personalPrepCard')){
   const about=[...profile.querySelectorAll('.card')].find(x=>x.textContent.includes('Об авторе'));
   const c=document.createElement('div');c.id='personalPrepCard';c.className='card orange click';c.setAttribute('data-go','personalPrep');c.innerHTML='<h3>Индивидуальная подготовка с Олегом</h3><p class="meta">Отдельная заявка. Количество мест ограничено.</p>';
   about?.before(c);
 }

 const author=document.getElementById('author');
 if(author)author.innerHTML=`<div class="eye">Автор проекта</div><div class="authorhead"><img class="authorphoto" src="assets/oleg-profile.jpg" alt="Олег Мушков"><div><h2>Олег Мушков</h2><p class="sub">Журналист, преподаватель и автор Mushkov Media Team</p></div></div><div class="card"><h3>Сейчас</h3><div class="role"><span>01</span><p><b>Редактор благотворительного фонда помощи сиротам «Большая Перемена»</b></p></div><div class="role"><span>02</span><p><b>Старший преподаватель кафедры журналистики Московского гуманитарного университета</b></p></div><div class="role"><span>03</span><p><b>Автор, ведущий и со-продюсер образовательного ток-шоу о журналистике MMT-Live</b></p></div><div class="role"><span>04</span><p><b>Заместитель главного редактора журнала «Юрист спешит на помощь»</b></p></div><div class="role"><span>05</span><p><b>Аспирант Института педагогики и психологии Московского городского педагогического университета</b><br><span class="meta">Пишет диссертацию о сопровождении студентов-журналистов в вузе.</span></p></div></div><div class="card orange"><h3>Индивидуальная подготовка</h3><p class="sub">Отдельный формат личной работы. Заявка не требует сначала читать раздел «Об авторе» — вход есть и прямо из профиля.</p><button class="btn dark" data-go="personalPrep">Подать заявку</button></div><div class="card"><div class="row between"><div><h3>Результаты учеников</h3><p class="meta">Видеоотзывы выпускников подготовки</p></div><span class="status o">6 видео</span></div><p class="sub">Видео добавим сюда по мере загрузки. Пока фиксируем участников и города, ничего не придумывая про вузы или результаты.</p><div class="video-placeholder click" onclick="toast('Видео Златы добавим позже')">▶ Злата · Пенза</div><div class="video-placeholder click" onclick="toast('Видео Кирилла добавим позже')">▶ Кирилл · Ростов</div><div class="video-placeholder click" onclick="toast('Видео Эльвиры добавим позже')">▶ Эльвира · Самара</div><div class="video-placeholder click" onclick="toast('Видео Насти добавим позже')">▶ Настя · Тобольск</div><div class="video-placeholder click" onclick="toast('Видео Жени добавим позже')">▶ Женя · Москва</div><div class="video-placeholder click" onclick="toast('Видео Маши добавим позже')">▶ Маша · Краснодар</div></div>`;

 if(!document.getElementById('personalPrep')){
   const s=document.createElement('section');s.id='personalPrep';s.className='screen';s.innerHTML=`<div class="eye">Личная подготовка</div><h2>Заявка к Олегу</h2><p class="sub">Количество мест ограничено, поэтому это заявка, а не автоматическая покупка занятий.</p><div class="label">Имя</div><input class="input" placeholder="Ваше имя"><div class="label">Город и класс</div><input class="input" placeholder="Например: Воронеж, 11 класс"><div class="label">Куда планируете поступать?</div><textarea class="textarea" style="min-height:90px" placeholder="Вузы и направления"></textarea><div class="label">Что уже сделано?</div><textarea class="textarea" style="min-height:90px" placeholder="Новости, портфолио, стажировка, пробники..."></textarea><button class="btn" onclick="toast('Заявка сохранена в демо')">Отправить заявку</button>`;document.querySelector('main').appendChild(s);
 }

 const portfolio=document.getElementById('portfolio');
 if(portfolio&&!document.getElementById('portfolioGuideCard')){
   const internship=[...portfolio.querySelectorAll('.card')].find(x=>x.textContent.includes('Стажировка'));
   const c=document.createElement('div');c.id='portfolioGuideCard';c.className='card click';c.setAttribute('data-go','portfolioGuide');c.innerHTML='<h3>Как собрать и оформить портфолио</h3><p class="meta">Структура, подписи, ссылки, QR, подтверждения и физическая папка.</p>';
   internship?.before(c);
 }
 if(!document.getElementById('portfolioGuide')){
   const s=document.createElement('section');s.id='portfolioGuide';s.className='screen';s.innerHTML=`<div class="eye">Портфолио MMT</div><h2>Не просто хранить работы — правильно их представить</h2><div class="card"><h3>Базовый чек-лист</h3><ul class="list"><li>Сначала сильные профессиональные публикации</li><li>У каждой работы: название, дата, СМИ, роль автора и ссылка</li><li>Видео и аудио — с рабочими ссылками и понятными подписями</li><li>Дипломы и рекомендации — отдельным блоком</li><li>Оригиналы и резервные файлы хранить отдельно</li></ul></div><div class="card softo"><h3>Под конкретный вуз</h3><p>Приложение будет выбирать из общего банка только те материалы, которые подходят под правила выбранной приёмной кампании.</p></div><div class="notice">Позже здесь появится редактор итоговой структуры и экспорт PDF. Для вузов, где нужна физическая папка, добавим отдельные рекомендации по печати и оформлению.</div>`;document.querySelector('main').appendChild(s);
 }

 const lesson=document.getElementById('lesson');
 if(lesson&&!document.getElementById('lessonFormats')){
   const h=lesson.querySelector('h2');const f=document.createElement('div');f.id='lessonFormats';f.className='formatbar';f.innerHTML='<span class="pill active">Текст</span><span class="pill">Видео · позже</span><span class="pill">Аудио · позже</span>';h?.after(f);
 }
})();

let originalUniPrep='';
function refreshUniGate(){
 const panel=document.getElementById('tab-uniprep');if(!panel)return;
 if(!originalUniPrep)originalUniPrep=panel.innerHTML;
 if(state.savedUni){if(panel.dataset.gated==='1'){panel.innerHTML=originalUniPrep;panel.dataset.gated='0'};return}
 panel.dataset.gated='1';panel.innerHTML='<div class="card"><span class="status o">Можно посмотреть</span><h3 style="margin-top:10px">Подготовка к СПбГИКиТ ещё не в вашем плане</h3><p class="sub">Требования, программу ДВИ и примеры можно изучать свободно. Персональный прогресс, календарь и полноценные тренировки включатся после добавления вуза.</p></div><button class="btn" data-go="signup">Добавить СПбГИКиТ в план</button><button class="btn secondary" data-go="written">Посмотреть формат письменного ДВИ</button>';
}

refresh();