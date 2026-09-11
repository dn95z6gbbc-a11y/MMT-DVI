(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const TARGET_FRAMES = 24;

  if (window.__VCHECK_VIDEO_24_FRAMES_V1__) return;
  window.__VCHECK_VIDEO_24_FRAMES_V1__ = '1.0';
  window.__VCHECK_VIDEO_TARGET_FRAMES__ = TARGET_FRAMES;

  const nativeFetch = window.fetch.bind(window);

  function fixObservations(value) {
    if (!value || typeof value !== 'object') return value;

    return {
      ...value,
      expectedFrames: TARGET_FRAMES,
      sampling:
        `Выборка из ${TARGET_FRAMES} стоп-кадров по всей длине ролика. ` +
        `Отсутствие признака в выборке НЕ доказывает его отсутствие во всём видео.`
    };
  }

  function fixSourceNote(value) {
    return String(value || '')
      .replace(/выборк[аи]\s+из\s+8\s+стоп-кадр\w*/gi, `выборка из ${TARGET_FRAMES} стоп-кадров`)
      .replace(/8\s+стоп-кадр\w*/gi, `${TARGET_FRAMES} стоп-кадров`);
  }

  window.fetch = async function(input, init) {
    let nextInit = init;

    try {
      const url =
        typeof input === 'string'
          ? input
          : String(input?.url || '');

      if (url === API_URL && init?.body) {
        const body = JSON.parse(String(init.body));
        const action = String(body?.action || '');

        if (action === 'extractVideoFrames') {
          body.count = TARGET_FRAMES;
          nextInit = {
            ...init,
            body: JSON.stringify(body)
          };
        }

        if (action === 'analyzeMaterial') {
          body.mediaObservations =
            fixObservations(body.mediaObservations);

          body.videoObservations =
            fixObservations(body.videoObservations);

          body.sourceNote =
            fixSourceNote(body.sourceNote);

          nextInit = {
            ...init,
            body: JSON.stringify(body)
          };
        }
      }
    } catch (_) {}

    return nativeFetch(input, nextInit);
  };

  const fixUiText = () => {
    const nodes = [
      document.getElementById('cloudVisionNote'),
      document.getElementById('vcheckUnifiedVideoProgress')
    ].filter(Boolean);

    for (const node of nodes) {
      const html = String(node.innerHTML || '');
      const fixed = html
        .replace(/8\s+стоп-кадр\w*/gi, `${TARGET_FRAMES} стоп-кадров`)
        .replace(/из\s+8\s+кадров/gi, `из ${TARGET_FRAMES} кадров`);

      if (fixed !== html) {
        node.innerHTML = fixed;
      }
    }
  };

  const timer = setInterval(fixUiText, 500);
  setTimeout(() => clearInterval(timer), 10 * 60 * 1000);

  console.log('V-CHECK 24-frame coverage enabled');
})();
