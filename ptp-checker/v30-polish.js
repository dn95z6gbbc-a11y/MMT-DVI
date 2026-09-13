(() => {
  // Build 80: spacing-only polish. No analysis logic is changed.
  const airStyle = document.createElement('style');
  airStyle.id = 'mmt-build80-air';
  airStyle.textContent = `
    .shell{
      padding-top:42px !important;
      padding-bottom:96px !important;
    }

    .top{
      padding-bottom:34px !important;
    }

    .card{
      margin:28px 0 !important;
      padding:38px !important;
    }

    .hero{
      min-height:500px !important;
      padding:66px 62px !important;
      margin-bottom:36px !important;
    }

    .hero h1{
      margin-top:32px !important;
      margin-bottom:24px !important;
    }

    .hero .tag{
      margin-bottom:24px !important;
      line-height:1.22 !important;
    }

    .hero .note{
      line-height:1.72 !important;
    }

    .hero .privacy{
      margin-top:38px !important;
      padding:20px 22px !important;
      line-height:1.62 !important;
    }

    form > .card{
      margin:30px 0 !important;
    }

    .section-title{
      margin-bottom:34px !important;
      gap:17px !important;
    }

    .section-title p{
      margin-top:7px !important;
      line-height:1.55 !important;
    }

    .grid{
      gap:24px 22px !important;
    }

    .field{
      gap:10px !important;
      margin:15px 0 !important;
    }

    input,select,textarea{
      padding:16px 17px !important;
    }

    textarea{
      min-height:132px !important;
    }

    .check{
      padding:19px 20px !important;
      line-height:1.58 !important;
    }

    .upload{
      padding:24px !important;
    }

    .privacy:not(.hero .privacy),
    .ai-box{
      padding:20px !important;
      line-height:1.6 !important;
    }

    .actions{
      gap:14px !important;
      padding-top:4px !important;
    }

    .btn{
      min-height:50px !important;
      padding:14px 20px !important;
    }

    #report.card{
      padding:42px !important;
    }

    #reportTitle{
      margin-top:18px !important;
      margin-bottom:10px !important;
    }

    #reportMeta{
      margin-bottom:26px !important;
    }

    #report .block{
      margin:16px 0 !important;
      padding:22px 23px !important;
      line-height:1.62 !important;
    }

    #report .final{
      margin-top:18px !important;
      padding:22px 23px !important;
      line-height:1.58 !important;
    }

    #vcheckUnifiedVideoReport{
      margin-top:26px !important;
    }

    #vcheckUnifiedVideoReport p,
    #vcheckUnifiedVideoReport li{
      line-height:1.72 !important;
    }

    #vcheckUnifiedVideoProgress{
      margin-top:20px !important;
      padding:18px 20px !important;
      line-height:1.55 !important;
    }

    .footer{
      padding-top:34px !important;
    }

    @media(max-width:680px){
      .shell{
        padding-top:18px !important;
        padding-bottom:58px !important;
      }

      .top{
        padding-bottom:20px !important;
      }

      .card{
        margin:16px 0 !important;
        padding:23px !important;
      }

      .hero{
        min-height:390px !important;
        padding:38px 26px 34px !important;
        margin-bottom:20px !important;
      }

      .hero h1{
        margin-top:24px !important;
        margin-bottom:18px !important;
      }

      .hero .privacy{
        margin-top:28px !important;
        padding:17px 18px !important;
      }

      form > .card{
        margin:18px 0 !important;
      }

      .section-title{
        margin-bottom:26px !important;
      }

      .grid{
        gap:14px !important;
      }

      .field{
        margin:12px 0 !important;
      }

      #report.card{
        padding:25px !important;
      }
    }
  `;
  (document.head || document.documentElement).appendChild(airStyle);

  // Build 81: restore the deep AI path for text formats and podcasts.
  // This is intentionally isolated from the video engine and does not touch backend logic.
  if (!window.__VCHECK_NONVIDEO_ENGINE_V1__) {
    const nonvideo = document.createElement('script');
    nonvideo.src = './nonvideo-engine-v1.js?v=81-nonvideo-restore';
    nonvideo.async = false;
    nonvideo.onload = () => console.log('V-CHECK non-video engine loaded');
    nonvideo.onerror = () => console.warn('V-CHECK non-video engine did not load');
    (document.head || document.documentElement).appendChild(nonvideo);
  }

  // v30 deliberately strips Mammoth at startup for Safari. Restore it lazily only for DOCX.
  if (!window.__VCHECK_DOCX_COMPAT_V1__) {
    const docxCompat = document.createElement('script');
    docxCompat.src = './nonvideo-docx-compat-v1.js?v=81-docx-restore';
    docxCompat.async = false;
    docxCompat.onload = () => console.log('V-CHECK DOCX compatibility loaded');
    docxCompat.onerror = () => console.warn('V-CHECK DOCX compatibility did not load');
    (document.head || document.documentElement).appendChild(docxCompat);
  }

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
