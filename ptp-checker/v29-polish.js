(() => {
  function polish(){
    const unified=document.getElementById('vcheckUnifiedVideoReport');
    if(!unified)return;

    // В unified-отчёте уже есть собственная «Рекомендация перед сдачей».
    // Старый чёрный #final дублировал ту же мысль и попадал в PDF второй раз.
    const final=document.getElementById('final');
    if(final)final.style.display='none';

    // Подпись внизу должна соответствовать реальному источнику кадров.
    const progress=document.getElementById('vcheckUnifiedVideoProgress');
    if(progress&&/Единый отчёт готов/i.test(progress.textContent||'')){
      const vision=window.VCHECK_VIDEO_VISION||{};
      const checked=Number(vision.checked||0);
      const failed=Number(vision.failed||0);
      progress.innerHTML=`<b>Видео: содержательная ИИ-проверка</b><br>Единый отчёт готов: расшифровка + ${checked} облачных стоп-кадров Qwen${failed?` · ошибок кадров: ${failed}`:''} + YandexGPT.`;
    }
  }

  const observer=new MutationObserver(polish);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  polish();
})();
