// V-CHECK Hot retry v4: retry incomplete reports with a compact evidence payload.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  if (window.__VCHECK_HOT_RETRY_V4__) return;
  window.__VCHECK_HOT_RETRY_V4__ = '4.0';

  const nativeFetch = window.fetch.bind(window);
  const MAX_ATTEMPTS = 3;

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

  function hasCompleteHotSchema(data) {
    const analysis = data?.analysis;
    if (!analysis || typeof analysis !== 'object') return false;

    const checks = Array.isArray(analysis.checks) ? analysis.checks : [];
    const validChecks = checks.filter(check =>
      check &&
      typeof check === 'object' &&
      String(check.title || check.id || '').trim() &&
      ['ok', 'warning', 'problem', 'unknown'].includes(String(check.status || ''))
    );

    const hasOverall =
      analysis.overall &&
      typeof analysis.overall === 'object' &&
      String(analysis.overall.summary || '').trim().length >= 20;

    const hasTrailingSections =
      Array.isArray(analysis.strengths) &&
      Array.isArray(analysis.priorityFixes) &&
      Array.isArray(analysis.teacherReview) &&
      String(analysis.finalRecommendation || '').trim().length >= 10;

    return hasOverall && validChecks.length >= 8 && hasTrailingSections;
  }

  async function inspect(response) {
    try {
      const raw = await response.clone().json();
      const data = parseEnvelope(raw);
      const message = String(data?.error || data?.message || '').toLowerCase();
      const formatError = /не в ожидаемом формате|ожидаем.*формат|unexpected format|invalid json|json.*invalid|не удалось.*json|malformed|структурированн.*отч[её]т|поврежд[её]нн.*json/.test(message);
      const missingStructured = !data?.ai || !data?.analysis;
      const incompleteSchema = !missingStructured && !hasCompleteHotSchema(data);
      return { bad: formatError || missingStructured || incompleteSchema, message, data, incompleteSchema };
    } catch (_) {
      return { bad: true, message: 'response_json_parse_failed', data: null, incompleteSchema: false };
    }
  }

  function compactGlobalEvidence(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      standupEvidence: Array.isArray(source.standupEvidence) ? source.standupEvidence.slice(0, 2) : [],
      cutawayEvidence: Array.isArray(source.cutawayEvidence) ? source.cutawayEvidence.slice(0, 4) : [],
      sequenceNotes: Array.isArray(source.sequenceNotes) ? source.sequenceNotes.slice(0, 4) : [],
      uncertain: Array.isArray(source.uncertain) ? source.uncertain.slice(0, 4) : []
    };
  }

  function compactObservations(value) {
    const source = value && typeof value === 'object' ? value : {};

    return {
      sampling: String(source.sampling || '').slice(0, 320),
      expectedFrames: Number(source.expectedFrames || 0) || null,
      checkedFrames: Number(source.checkedFrames || source.processedFrames || 0) || null,
      processedFrames: Number(source.processedFrames || source.checkedFrames || 0) || null,
      failedFrames: Number(source.failedFrames || 0) || 0,
      counts: source.counts && typeof source.counts === 'object' ? source.counts : {},
      peopleFrames: Number(source.peopleFrames || 0) || 0,
      nameLowerThirdFrames: Number(source.nameLowerThirdFrames || 0) || 0,
      subtitleOrTextFrames: Number(source.subtitleOrTextFrames || 0) || 0,
      logoFrames: Number(source.logoFrames || 0) || 0,
      locationTextFrames: Number(source.locationTextFrames || 0) || 0,
      standupConfirmed: source.standupConfirmed === true ? true : null,
      cutawaysConfirmed: source.cutawaysConfirmed === true ? true : null,
      shotVariety: String(source.shotVariety || 'unknown').slice(0, 40),
      visualAlternationConfirmed: source.visualAlternationConfirmed === true ? true : null,
      globalVisionAvailable: Boolean(source.globalVisionAvailable),
      globalVisionEvidence: compactGlobalEvidence(source.globalVisionEvidence),
      transcriptSegmentsCount: Number(source.transcriptSegmentsCount || 0) || null,
      visualSource: 'uploaded_video_server_ffmpeg_qwen_compact_for_hot'
    };
  }

  function buildRetryBody(body, attempt) {
    const retryBody = { ...body };
    const observations = body.mediaObservations || body.videoObservations || {};

    // The normal video payload contains detailed data for every sampled frame and a timeline.
    // That is useful for stories, but unnecessarily large for a 90-second Hot explainer and
    // was causing YandexGPT to finish with a truncated JSON report. On retries we keep only
    // the evidence Hot actually needs. video-hot-final-guards then adds its own hotEvidence.
    retryBody.mediaObservations = compactObservations(observations);
    delete retryBody.videoObservations;

    retryBody.sourceNote = [
      String(body.sourceNote || '').trim(),
      `Повтор итогового анализа №${attempt}. Верни ПОЛНЫЙ отчёт по схеме: overall, checks, strengths, priorityFixes, teacherReview, finalRecommendation.`,
      'Не сокращай checks: покрой все обязательные требования и ключевые deepChecks. Верни только валидный JSON.'
    ].filter(Boolean).join(' ');

    try {
      window.__VCHECK_HOT_RETRY_PAYLOAD_BYTES__ = JSON.stringify(retryBody).length;
      console.log('V-CHECK Hot v4 compact retry payload bytes:', window.__VCHECK_HOT_RETRY_PAYLOAD_BYTES__);
    } catch (_) {}

    return retryBody;
  }

  function incompleteResponse() {
    return new Response(JSON.stringify({
      ok: false,
      error: 'incomplete_ai_report',
      message: 'ИИ несколько раз вернул неполный итоговый отчёт. Видео и расшифровка обработаны, но финальный анализ нужно повторить.'
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  window.fetch = async function hotRetryV4Fetch(input, init = {}) {
    const body = requestBody(input, init);
    if (!body) return nativeFetch(input, init);

    let response = await nativeFetch(input, init);
    let state = await inspect(response);
    if (!state.bad) return response;

    for (let attempt = 2; attempt <= MAX_ATTEMPTS; attempt++) {
      console.warn(
        `V-CHECK Hot: report incomplete/malformed; retrying with compact evidence (${attempt}/${MAX_ATTEMPTS}).`,
        state.message,
        state.incompleteSchema ? 'incomplete_schema' : ''
      );

      setProgress(
        state.incompleteSchema
          ? `ИИ вернул неполный отчёт. Повторяем итоговый анализ на компактных данных (${attempt}/${MAX_ATTEMPTS})…`
          : `Финальный ИИ-ответ пришёл некорректно. Повторяем итоговый анализ на компактных данных (${attempt}/${MAX_ATTEMPTS})…`
      );

      const retryBody = buildRetryBody(body, attempt);
      response = await nativeFetch(input, {
        ...init,
        body: JSON.stringify(retryBody)
      });

      state = await inspect(response);
      if (!state.bad) {
        setProgress('Полный итоговый анализ получен. Собираем отчёт…');
        return response;
      }
    }

    console.warn('V-CHECK Hot: all compact final-analysis attempts returned incomplete/malformed reports.');
    setProgress('Видео обработано, но ИИ несколько раз вернул неполный итоговый отчёт.', 'bad');
    return incompleteResponse();
  };

  console.log('V-CHECK Hot retry v4.0 loaded');
})();