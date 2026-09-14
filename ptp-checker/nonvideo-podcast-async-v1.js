// V-CHECK podcast async bridge v1: routes only podcast YandexGPT analysis through async operations.
(() => {
  if (window.__VCHECK_PODCAST_ASYNC_BRIDGE_V1__) return;
  window.__VCHECK_PODCAST_ASYNC_BRIDGE_V1__ = '1.0';

  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const nativeFetch = window.fetch.bind(window);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function parseEnvelope(value) {
    if (value && typeof value.body === 'string') {
      try { return JSON.parse(value.body); } catch (_) {}
    }
    return value || {};
  }

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {'Content-Type':'application/json; charset=utf-8'}
    });
  }

  async function callApi(payload) {
    const response = await nativeFetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    let raw = {};
    try { raw = await response.json(); }
    catch (_) {
      return {
        ok: false,
        status: response.status || 502,
        data: {
          ok: false,
          error: 'bad_async_bridge_response',
          message: 'Сервер вернул непонятный ответ во время анализа подкаста.'
        }
      };
    }

    const data = parseEnvelope(raw);
    return {
      ok: response.ok && data?.ok !== false,
      status: response.status,
      data
    };
  }

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();

    if (url !== API_URL || method !== 'POST' || typeof init?.body !== 'string') {
      return nativeFetch(input, init);
    }

    let payload;
    try { payload = JSON.parse(init.body); }
    catch (_) { return nativeFetch(input, init); }

    if (payload?.action !== 'analyzeMaterial' || payload?.format !== 'podcast') {
      return nativeFetch(input, init);
    }

    try {
      const started = await callApi({
        ...payload,
        action: 'startPodcastAnalysis'
      });

      if (!started.ok) {
        return jsonResponse(started.data, started.status || 502);
      }

      const operationId = String(started.data?.operationId || '').trim();
      if (!operationId) {
        return jsonResponse({
          ok: false,
          error: 'podcast_analysis_operation_id_missing',
          message: 'YandexGPT не вернул идентификатор анализа подкаста.'
        }, 502);
      }

      const deadline = Date.now() + 12 * 60 * 1000;

      while (Date.now() < deadline) {
        await sleep(4000);

        const current = await callApi({
          ...payload,
          action: 'getPodcastAnalysis',
          operationId
        });

        if (!current.ok) {
          return jsonResponse(current.data, current.status || 502);
        }

        if (current.data?.analysis) {
          return jsonResponse(current.data, 200);
        }

        if (
          current.data?.analysisReady === false ||
          current.data?.status === 'processing'
        ) {
          continue;
        }
      }

      return jsonResponse({
        ok: false,
        error: 'podcast_analysis_timeout',
        message: 'ИИ-анализ подкаста занял больше 12 минут. Попробуйте повторить проверку позже.'
      }, 504);

    } catch (error) {
      return jsonResponse({
        ok: false,
        error: 'podcast_async_bridge_error',
        message: error?.message || 'Не удалось завершить ИИ-анализ подкаста.'
      }, 502);
    }
  };

  console.log('V-CHECK podcast async bridge v1.0 loaded');
})();
