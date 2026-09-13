// V-CHECK Hot final polish v1: deterministic hook/duration + conservative montage + semantic review dedupe.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  if (window.__VCHECK_HOT_FINAL_POLISH_V1__) return;
  window.__VCHECK_HOT_FINAL_POLISH_V1__ = '1.0';

  const nativeFetch = window.fetch.bind(window);

  function requestBody(input, init) {
    try {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      if (url !== API_URL || typeof init?.body !== 'string') return null;
      const body = JSON.parse(init.body);
      return body?.action === 'analyzeMaterial' && String(body?.format || '') === 'hot' ? body : null;
    } catch (_) {
      return null;
    }
  }

  function parseEnvelope(raw) {
    if (!raw || typeof raw !== 'object') return raw || {};
    if (typeof raw.body === 'string') {
      try { return JSON.parse(raw.body); } catch (_) { return raw; }
    }
    return raw;
  }

  function keyText(check) {
    return `${String(check?.id || '')} ${String(check?.title || '')}`.toLowerCase();
  }

  function isHookCheck(check) {
    return /\bхук\b|hook|начал.*не нейтрал|не нейтрал.*начал/.test(keyText(check));
  }

  function isDurationCheck(check) {
    return /хронометраж|длительн|duration/.test(keyText(check));
  }

  function isMontageCheck(check) {
    return /монтаж.*ритм|ритм.*монтаж|editing.*rhythm|montage.*rhythm/.test(keyText(check));
  }

  function openingTranscript() {
    const segments = Array.isArray(window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__)
      ? window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__
      : [];
    return segments
      .filter(segment => Number(segment?.startSeconds) < 5.5)
      .slice(0, 6)
      .map(segment => String(segment?.text || '').trim())
      .filter(Boolean)
      .join(' ')
      .trim()
      .slice(0, 500);
  }

  function strongHook(text) {
    const value = String(text || '').trim();
    if (!value) return false;
    const first = value.slice(0, 220);

    if (/[?!]/.test(first.slice(0, 160))) return true;
    if (/^(?:а\s+вы|вы\s+знали|знаете|представьте|почему|как\s+так|что\s+если|целых|всего|только|никогда|сразу)\b/i.test(first)) return true;
    if (/\b(?:целых|всего|только)\b.{0,90}\b(?:человек|миллион|миллиард|тысяч|процент|раз|стран)/i.test(first)) return true;
    if (/\b(?:сенсац|рекорд|впервые|последн.*раз|невозмож|абсурд|парадокс)\b/i.test(first)) return true;

    return false;
  }

  function durationSeconds() {
    const source = window.__VCHECK_VIDEO_SOURCE__ || {};
    const value = Number(source?.durationSeconds);
    if (Number.isFinite(value) && value > 0) return value;
    try {
      if (typeof material !== 'undefined') {
        const fallback = Number(material?.duration);
        if (Number.isFinite(fallback) && fallback > 0) return fallback;
      }
    } catch (_) {}
    return null;
  }

  function canonicalReviewKey(value) {
    const text = String(value || '').toLowerCase();
    if (/свеж|инфоповод|актуальност/.test(text)) return 'freshness';
    if (/независим.*источ|минимум.*источ|два.*источ|двух.*источ/.test(text)) return 'sources';
    if (/проверяемост.*факт|факт.*источ|соответств.*факт.*источ|привяз.*факт.*источ/.test(text)) return 'facts';
    if (/монтаж.*ритм|ритм.*монтаж/.test(text)) return 'montage';
    if (/визуальн.*подтверж|визуал.*сказан|визуал.*фон/.test(text)) return 'visual';
    if (/вертикал|ориентац.*видео/.test(text)) return 'orientation';
    return text
      .replace(/^проверить вручную:\s*/i, '')
      .replace(/^необходимо проверить\s*/i, '')
      .replace(/^проверить\s*/i, '')
      .replace(/[.:;]+$/g, '')
      .trim();
  }

  function dedupeTeacherReview(analysis) {
    if (!Array.isArray(analysis?.teacherReview)) return;
    const seen = new Set();
    analysis.teacherReview = analysis.teacherReview.filter(item => {
      const key = canonicalReviewKey(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function ensureTeacherReview(analysis, text) {
    if (!Array.isArray(analysis.teacherReview)) analysis.teacherReview = [];
    const key = canonicalReviewKey(text);
    if (!analysis.teacherReview.some(item => canonicalReviewKey(item) === key)) {
      analysis.teacherReview.push(text);
    }
  }

  function rebuildFinalRecommendation(analysis) {
    const checks = Array.isArray(analysis?.checks) ? analysis.checks : [];
    const recommendations = checks
      .filter(check => ['problem', 'warning'].includes(check?.status) && String(check?.recommendation || '').trim())
      .map(check => String(check.recommendation).trim())
      .filter((value, index, list) => list.indexOf(value) === index)
      .slice(0, 3);

    if (recommendations.length) {
      analysis.finalRecommendation = recommendations.join(' ');
    } else if (checks.some(check => check?.status === 'unknown')) {
      analysis.finalRecommendation = 'Перед сдачей проверьте вручную пункты, которые V-CHECK не смог подтвердить автоматически.';
    } else {
      analysis.finalRecommendation = 'Материал соответствует автоматически проверяемым требованиям формата; финальное решение остаётся за преподавателем.';
    }
  }

  function syncOverall(analysis) {
    if (!analysis?.overall || !Array.isArray(analysis?.checks)) return;
    const criticalProblem = analysis.checks.some(check => check?.critical === true && check?.status === 'problem');
    const concern = analysis.checks.some(check => ['problem', 'warning', 'unknown'].includes(check?.status));
    analysis.overall.status = criticalProblem ? 'problem' : (concern ? 'warning' : 'ok');
  }

  function ensureDurationCheck(analysis) {
    if (!Array.isArray(analysis?.checks)) return;
    if (analysis.checks.some(isDurationCheck)) return;

    const duration = durationSeconds();
    if (!Number.isFinite(duration)) return;
    const ok = duration <= 90.05;

    analysis.checks.unshift({
      id: 'hot_duration',
      title: 'Хронометраж',
      status: ok ? 'ok' : 'problem',
      critical: true,
      finding: ok
        ? `Хронометраж соответствует требованию: ${Math.round(duration)} сек.`
        : `Хронометраж превышает максимум формата: ${Math.round(duration)} сек. при требовании не более 90 сек.`,
      evidence: [`Фактическая длительность видео: ${Math.round(duration)} секунд.`],
      recommendation: ok ? '' : 'Сократить ролик до 1 минуты 30 секунд, сохранив ключевое объяснение и доказательства.'
    });
  }

  function patchAnalysis(analysis) {
    if (!analysis || typeof analysis !== 'object' || !Array.isArray(analysis.checks)) return analysis;

    ensureDurationCheck(analysis);

    const opening = openingTranscript();
    const hookConfirmed = strongHook(opening);
    let montageMovedToManual = false;

    for (const check of analysis.checks) {
      if (isHookCheck(check) && hookConfirmed && check?.status !== 'ok') {
        check.status = 'ok';
        check.finding = 'В первые секунды есть содержательный хук.';
        check.evidence = [`Начало расшифровки: «${opening.slice(0, 180)}${opening.length > 180 ? '…' : ''}»`];
        check.recommendation = '';
      }

      if (isMontageCheck(check)) {
        check.status = 'unknown';
        check.finding = 'Монтажный ритм нельзя надёжно оценить по отдельным стоп-кадрам: для этого нужно видеть частоту и логику смены планов во времени.';
        check.evidence = [];
        check.recommendation = 'Преподавателю проверить монтажный ритм по готовому видео.';
        ensureTeacherReview(analysis, 'Проверить вручную: монтажный ритм');
        montageMovedToManual = true;
      }
    }

    if (montageMovedToManual && Array.isArray(analysis.priorityFixes)) {
      analysis.priorityFixes = analysis.priorityFixes.filter(item => {
        const text = `${item?.problem || ''} ${item?.why || ''} ${item?.how || ''}`.toLowerCase();
        return !/монтаж.*ритм|ритм.*монтаж/.test(text);
      });
    }

    if (hookConfirmed && Array.isArray(analysis.priorityFixes)) {
      analysis.priorityFixes = analysis.priorityFixes.filter(item => {
        const text = `${item?.problem || ''} ${item?.why || ''} ${item?.how || ''}`.toLowerCase();
        return !/отсутств.*хук|нет.*хук|добав.*хук|хук.*начал/.test(text);
      });
    }

    if (hookConfirmed && analysis.overall && typeof analysis.overall.summary === 'string') {
      analysis.overall.summary = analysis.overall.summary
        .replace(/(?:однако\s+)?(?:в\s+)?начал[ео][^.]*хук[^.]*\.?/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    dedupeTeacherReview(analysis);
    rebuildFinalRecommendation(analysis);
    syncOverall(analysis);
    return analysis;
  }

  window.fetch = async function hotFinalPolishFetch(input, init = {}) {
    const body = requestBody(input, init);
    if (!body) return nativeFetch(input, init);

    const response = await nativeFetch(input, init);
    try {
      const raw = await response.clone().json();
      const payload = parseEnvelope(raw);
      if (payload?.analysis) payload.analysis = patchAnalysis(payload.analysis);
      return new Response(JSON.stringify(payload), {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
    } catch (error) {
      console.warn('V-CHECK Hot final polish skipped:', error);
      return response;
    }
  };

  console.log('V-CHECK Hot final polish v1.0 loaded');
})();
