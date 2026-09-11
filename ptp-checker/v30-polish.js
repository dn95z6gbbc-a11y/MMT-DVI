(() => {
  let stopped = false;

  function polish(){
    if(stopped) return;

    const unified = document.getElementById('vcheckUnifiedVideoReport');
    if(!unified) return;

    // Убираем старую дублирующую чёрную рекомендацию.
    const final = document.getElementById('final');
    if(final && final.style.display !== 'none'){
      final.style.display = 'none';
    }

    // Подпись обновляем только один раз, когда единый отчёт реально готов.
    const progress = document.getElementById('vcheckUnifiedVideoProgress');
    if(progress && /Единый отчёт готов/i.test(progress.textContent || '')){
      const vision = window.VCHECK_VIDEO_VISION || {};
      const checked = Number(vision.checked || 0);
      const failed = Number(vision.failed || 0);
      const html = `<b>Видео: содержательная ИИ-проверка</b><br>Единый отчёт готов: расшифровка + ${checked} облачных стоп-кадров Qwen${failed ? ` · ошибок кадров: ${failed}` : ''} + YandexGPT.`;

      if(progress.innerHTML !== html){
        progress.innerHTML = html;
      }

      stopped = true;
      clearInterval(timer);
    }
  }

  // Вместо MutationObserver по всему DOM используем редкую проверку.
  // Это не создаёт рекурсивных мутаций и не загружает Safari.
  const timer = setInterval(polish, 800);
  setTimeout(() => {
    stopped = true;
    clearInterval(timer);
  }, 240000);

  polish();
})();
