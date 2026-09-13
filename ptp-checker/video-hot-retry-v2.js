// V-CHECK Hot retry v2: retry malformed/missing structured final analysis once.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  if (window.__VCHECK_HOT_RETRY_V2__) return;
  window.__VCHECK_HOT_RETRY_V2__ = '2.0';

  const nativeFetch = window.fetch.bind(window);

  function parseEnvelope(raw) {
    if (!raw || typeof raw !== 'object') return raw || {};
    if (typeof raw.body === 'string') {
      try { return JSON.parse(raw.body); } catch (_) { return raw; }
    }
    return raw;
  }

  function requestBody(input, init) {
    try {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      if (url !== API_URL || typeof init?.body !== 'string') return null;
      const body = JSON.parse(init.body);
      if (body?.action !== 'analyzeMaterial' || String(body?.format || '') !== 'hot') return null;
      return body;
    } catch (_) {
      return null;
    }
  }

  function setProgress(text) {
    const box = document.getElementById('vcheckUnifiedVideoProgress');
    if (!box) return;
    box.innerHTML = `<b>Видео: содержательная ИИ-проверка</b><br>${String(text || '')}`;
  }

  async function inspect(response) {
    try {
      const raw = await response.clone().json();
      const data = parseEnvelope(raw);
      const message = String(data?.error || data?.message || '').toLowerCase();
      const formatError = /не в ожидаемом формате|ожидаем.*формат|unexpected format|invalid json|json.*invalid|не удалось.*json|malformed|структурированн.*отч[её]т/.test(message);
      const missingStructured = !data?.ai || !data?.analysis;
      return { bad: formatError || missingStructured, message, data };
    } catch (_) {
      return { bad: true, message: 'response_json_parse_failed', data: null };
    }
  }

  window.fetch = async function hotRetryV2Fetch(input, init = {}) {
    const body = requestBody(input, init);
    if (!body) return nativeFetch(input, init);

    const first = await nativeFetch(input, init);
    const firstState = await inspect(first);
    if (!firstState.bad) return first;

    console.warn('V-CHECK Hot: structured final response missing/malformed; retrying once.', firstState.message);
    setProgress('Финальный ИИ-ответ пришёл некорректно. Повторяем только итоговый анализ…');

    const retryBody = {
      ...body,
      sourceNote: `${String(body.sourceNote || '').trim()} КРИТИЧЕСКИ ВАЖНО: верни только валидный JSON строго в требуемой схеме. Без Markdown, без пояснений до или после JSON, без незакрытых строк и комментариев.`.trim()
    };

    // Не дублируем идентичный визуальный блок на повторной попытке: backend умеет читать mediaObservations.
    if (retryBody.mediaObservations && retryBody.videoObservations) {
      delete retryBody.videoObservations;
    }

    const second = await nativeFetch(input, {
      ...init,
      body: JSON.stringify(retryBody)
    });

    const secondState = await inspect(second);
    if (!secondState.bad) {
      setProgress('Повторный итоговый анализ получен. Собираем отчёт…');
    } else {
      console.warn('V-CHECK Hot: retry also malformed.', secondState.message);
    }

    return second;
  };

  console.log('V-CHECK Hot retry v2.0 loaded');
})();
