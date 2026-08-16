/* MMT ДВИ — manifest loader
   Safe refactor: keep historical feature modules, remove nested callback tower.
   New shared features should use MMT_UNIVERSITIES and state instead of duplicating data. */
(function(){
  const modules=[
    ['app-v042.js','042'],
    ['v05.js','050'],
    ['v051.js','052'],
    ['v06.js','060'],
    ['v07.js','070'],
    ['v071.js','071'],
    ['v08.js','080'],
    ['v081.js','081'],
    ['v09.js','090'],
    ['v091.js','091'],
    ['v010.js','010'],
    ['v010-fix.js','0101'],
    ['v010-extra.js','0102'],
    ['v011.js','011'],
    ['v012.js','012'],
    ['v0121.js','0121a'],
    ['v0122.js','0122'],
    ['v0123.js','0123'],
    ['v0124.js','0124b'],
    ['v0125.js','0125'],
    ['v0126.js','0126'],
    ['v0127.js','0127'],
    ['v0128.js','0128'],
    ['v0129.js','0129'],
    ['v01210.js','01210'],
    ['v013.js','013'],
    ['v0131.js','0131'],
    ['v0132.js','0132'],
    ['v0133.js','0133']
  ];

  window.MMT_MODULES=modules.map(([file,version])=>({file,version}));

  function loadAt(index){
    if(index>=modules.length){
      document.documentElement.dataset.mmtReady='true';
      window.dispatchEvent(new CustomEvent('mmt:ready',{detail:{modules:window.MMT_MODULES}}));
      return;
    }
    const [file,version]=modules[index];
    const script=document.createElement('script');
    script.src=file+'?v='+version;
    script.dataset.mmtModule=file;
    script.onload=()=>loadAt(index+1);
    script.onerror=()=>{
      console.error('[MMT ДВИ] Не удалось загрузить часть прототипа',file);
      const toast=document.getElementById('toast');
      if(toast){toast.textContent='Не удалось загрузить часть прототипа. Обновите страницу.';toast.classList.add('show')}
    };
    document.body.appendChild(script);
  }

  loadAt(0);
})();
