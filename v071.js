/* MMT ДВИ v0.7.1 — уточнение маркировки кампании РАНХиГС */
(function setupV071(){
  const ver=document.querySelector('.ver');
  if(ver) ver.textContent='v0.7.1';
  document.title='MMT ДВИ — v0.7.1';

  // Для пользователя маркируем программу по фактическому сезону экзамена — лето 2026,
  // а не по учебному году, упомянутому внутри правил приема.
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    if(node.nodeValue && node.nodeValue.includes('2026/27')){
      node.nodeValue=node.nodeValue.replaceAll('2026/27','лето 2026');
    }
  });
})();
