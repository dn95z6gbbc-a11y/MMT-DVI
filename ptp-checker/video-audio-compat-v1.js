(() => {
  if (window.__VCHECK_VIDEO_AUDIO_COMPAT_V1__) return;
  window.__VCHECK_VIDEO_AUDIO_COMPAT_V1__ = '1.0';

  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function(input, init) {
    try {
      const url =
        typeof input === 'string'
          ? input
          : String(input?.url || '');

      if (
        url === API_URL &&
        init?.body &&
        typeof init.body === 'string'
      ) {
        const body = JSON.parse(init.body);

        if (body?.action === 'prepareUploadedVideoAudio') {
          body.action = 'prepareVideoAudio';
          init = {
            ...init,
            body: JSON.stringify(body)
          };
        }
      }
    } catch (_) {}

    return nativeFetch(input, init);
  };

  console.log('V-CHECK video audio compatibility bridge loaded');
})();