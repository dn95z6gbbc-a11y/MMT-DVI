// V-CHECK Hot retry v1: retry final AI analysis once if the model returns malformed JSON.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  if (window.__VCHECK_HOT_RETRY_V1__) return;
  window.__VCHECK_HOT_RETRY_V1__ = '1.0';

  const nativeFetch = window.fetch.bind(window);

  function parseMaybeEnvelope(raw) {
    if (!raw || typeof raw !== 'object') return raw || {};
    if (typeof raw.body === 'string') {
      try { return JSON.parse(raw.body); } catch (_) { return raw; }
    }
    return raw;
  }

  function isHotAnalyzeRequest(input, init) {
    try {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      if (url !== API_URL || typeof init?.body !== 'string') return false;
      const body = JSON.parse(init.body);
      return body?.action === 'analyzeMaterial' && String(body?.format || '') === 'hot';
    } catch (_) {
      return false;
    }
  }

  async function malformedAnalysisResponse(response) {
    try {
      const raw = await response.clone().json();
      const data = parseMaybeEnvelope(raw);
      const message = String(data?.error || data?.message || '').toLowerCase();
      if (data?.ok === false && /не в ожидаемом формате|ожидаем.*формат|unexpected format|invalid json|json.*invalid|не удалось.*json|malformed/.test(message)) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  window.fetch = async function hotRetryFetch(input, init = {}) {
    if (!isHotAnalyzeRequest(input, init)) {
      return nativeFetch(input, init);
    }

    const first = await nativeFetch(input, init);
    if (!(await malformedAnalysisResponse(first))) {
      return first;
    }

    console.warn('V-CHECK Hot: final AI response was malformed; retrying analyzeMaterial once.');

    try {
      const retryBody = JSON.parse(init.body);
      retryBody.sourceNote = `${String(retryBody.sourceNote || '').trim()} Верни итог строго в требуемой JSON-структуре без Markdown, комментариев и текста вне JSON.`.trim();
      return await nativeFetch(input, {
        ...init,
        body: JSON.stringify(retryBody)
      });
    } catch (_) {
      return nativeFetch(input, init);
    }
  };

  console.log('V-CHECK Hot retry v1.0 loaded');
})();