/* MMT ДВИ v0.14.7 — human-readable AI review labels */
(function setupV0147(){
  const ver=document.querySelector('.ver');if(ver)ver.textContent='v0.14.7';
  document.title='MMT ДВИ — v0.14.7';

  const criterionLabels={
    'инфоповод':'Инфоповод',
    'логика фактуры':'Логика фактуры',
    'время события':'Время события',
    'источник':'Источник',
    'факт или мнение':'Факт или мнение',
    'обвинение или риск':'Обвинение / риск',
    'комментарий':'Комментарий',
    'вторая сторона':'Вторая сторона',
    'бэкграунд':'Бэкграунд',
    'язык':'Язык',
    'другое':'Редакторская проверка'
  };

  const replacements=[
    [/\beventStatus\b/g,'«Новость или анонс?»'],
    [/\bworkingTitle\b/g,'«Рабочее название темы»'],
    [/\bnewFact\b/g,'«Что именно изменилось сейчас?»'],
    [/\bsourceType\b/g,'«Тип основного источника»'],
    [/\bsourceDetail\b/g,'«Конкретный источник»'],
    [/\bcommentWho\b/g,'«Кого берём на комментарий?»'],
    [/\bcommentRole\b/g,'«Почему именно его/её?»'],
    [/\bsecondSide\b/g,'«Вторая сторона»'],
    [/\bbackgroundSource\b/g,'«Источник бэкграунда»'],
    [/\bbackground\b/g,'«Какой нужен бэкграунд?»'],
    [/\bwhyHow\b/g,'«Почему и как?»'],
    [/\bproof\b/g,'«Чем вы проверите главный факт?»'],
    [/\bconflict\b/g,'«Есть спор, обвинение или конфликт интересов?»'],
    [/\bwhen\b/g,'«Когда?»'],
    [/\bwhere\b/g,'«Где?»'],
    [/\bwho\b/g,'«Кто?»'],
    [/'past'/g,'«Уже произошло»'],
    [/'future'/g,'«Только будет»'],
    [/'press'/g,'«пресс-служба»']
  ];

  function humanizeText(text){
    let out=String(text||'');
    for(const [rx,to] of replacements)out=out.replace(rx,to);
    return out;
  }

  function polishPanel(){
    const panel=document.getElementById('ai142Panel');
    if(!panel)return;

    panel.querySelectorAll('.tag').forEach(tag=>{
      const key=(tag.textContent||'').trim().toLowerCase();
      if(criterionLabels[key])tag.textContent=criterionLabels[key];
    });

    const walker=document.createTreeWalker(panel,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(node.parentElement?.classList?.contains('tag'))continue;
      const next=humanizeText(node.nodeValue);
      if(next!==node.nodeValue)node.nodeValue=next;
    }
  }

  const screen=document.getElementById('newsOwn137');
  if(screen){
    new MutationObserver(()=>requestAnimationFrame(polishPanel)).observe(screen,{childList:true,subtree:true});
  }
  window.addEventListener('mmt:ready',()=>setTimeout(polishPanel,100));
  setTimeout(polishPanel,250);
})();
