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
}
function setText(id,v){const x=document.getElementById(id);if(x)x.textContent=v}function setWidth(id,v){const x=document.getElementById(id);if(x)x.style.width=v+'%'}
function esc(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
let tt;function toast(text){const t=document.getElementById('toast');t.textContent=text;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)}
refresh();