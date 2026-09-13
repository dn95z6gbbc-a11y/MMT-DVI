// V-CHECK Hot final cleanup v1: freshness uncertainty, semantic visual alignment, stale review cleanup.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  if (window.__VCHECK_HOT_FINAL_CLEANUP_V1__) return;
  window.__VCHECK_HOT_FINAL_CLEANUP_V1__ = '1.0';

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

  function textOf(check) {
    return `${String(check?.id || '')} ${String(check?.title || '')} ${String(check?.finding || '')} ${(Array.isArray(check?.evidence) ? check.evidence.join(' ') : '')}`.toLowerCase();
  }

  function isFreshness(check) {
    return /свеж|инфоповод.*недел|fresh|7.*дн/.test(textOf(check));
  }

  function isOrientation(check) {
    return /вертикал|ориентац.*видео|video.*orientation|orientation.*video/.test(textOf(check));
  }

  function isSources(check) {
    return /независим.*источ|источ.*независим|минимум.*источ|два.*источ|двух.*источ/.test(textOf(check));
  }

  function isFacts(check) {
    return /проверяемост.*факт|факт.*источ|привяз.*факт.*источ|соответств.*факт.*источ/.test(textOf(check));
  }

  function isMontage(check) {
    return /монтаж.*ритм|ритм.*монтаж|editing.*rhythm|montage.*rhythm/.test(textOf(check));
  }

  function isVisualMeaning(check) {
    const text = textOf(check);
    return /визуал.*подтверж.*сказ|визуал.*сказан|визуал.*фон|картин.*подтверж.*реч|visual.*support.*speech|visual.*background/.test(text);
  }

  function categoryFromText(value) {
    const text = String(value || '').toLowerCase();
    if (/свеж|инфоповод|актуальност/.test(text)) return 'freshness';
    if (/вертикал|ориентац.*видео/.test(text)) return 'orientation';
    if (/независим.*источ|минимум.*источ|два.*источ|двух.*источ/.test(text)) return 'sources';
    if (/проверяемост.*факт|факт.*источ|привяз.*факт.*источ|соответств.*факт.*источ/.test(text)) return 'facts';
    if (/монтаж.*ритм|ритм.*монтаж/.test(text)) return 'montage';
    if (/визуал.*подтверж.*сказ|визуал.*сказан|визуал.*фон/.test(text)) return 'visualMeaning';
    return String(value || '').toLowerCase().replace(/^проверить вручную:\s*/i, '').replace(/^проверить\s*/i, '').trim();
  }

  function statusByCategory(checks) {
    const result = {};
    for (const check of checks) {
      let category = null;
      if (isFreshness(check)) category = 'freshness';
      else if (isOrientation(check)) category = 'orientation';
      else if (isSources(check)) category = 'sources';
      else if (isFacts(check)) category = 'facts';
      else if (isMontage(check)) category = 'montage';
      else if (isVisualMeaning(check)) category = 'visualMeaning';
      if (category) result[category] = String(check?.status || '');
    }
    return result;
  }

  function addReview(analysis, text) {
    if (!Array.isArray(analysis.teacherReview)) analysis.teacherReview = [];
    const category = categoryFromText(text);
    if (!analysis.teacherReview.some(item => categoryFromText(item) === category)) {
      analysis.teacherReview.push(text);
    }
  }

  function cleanupTeacherReview(analysis, checks) {
    if (!Array.isArray(analysis.teacherReview)) analysis.teacherReview = [];
    const statuses = statusByCategory(checks);
    const seen = new Set();

    analysis.teacherReview = analysis.teacherReview.filter(item => {
      const category = categoryFromText(item);
      if (statuses[category] === 'ok') return false;
      if (seen.has(category)) return false;
      seen.add(category);
      return true;
    });

    if (statuses.freshness === 'unknown') addReview(analysis, 'Проверить вручную: свежесть инфоповода');
    if (statuses.montage === 'unknown') addReview(analysis, 'Проверить вручную: монтажный ритм');
    if (statuses.visualMeaning === 'unknown') addReview(analysis, 'Проверить вручную: соответствие визуала сказанному');
  }

  function rebuildPriorityFixes(analysis, checks) {
    if (!Array.isArray(analysis.priorityFixes)) return;
    const statuses = statusByCategory(checks);
    analysis.priorityFixes = analysis.priorityFixes.filter(item => {
      const text = `${item?.problem || ''} ${item?.why || ''} ${item?.how || ''}`;
      const category = categoryFromText(text);
      if (statuses[category] === 'unknown' || statuses[category] === 'ok') return false;
      return true;
    });
  }

  function rebuildRecommendation(analysis, checks) {
    const actionable = checks
      .filter(check => ['problem', 'warning'].includes(String(check?.status || '')) && String(check?.recommendation || '').trim())
      .map(check => String(check.recommendation).trim())
      .filter((value, index, list) => list.indexOf(value) === index)
      .slice(0, 3);

    if (actionable.length) {
      analysis.finalRecommendation = actionable.join(' ');
    } else if (checks.some(check => check?.status === 'unknown')) {
      analysis.finalRecommendation = 'Перед сдачей проверьте вручную пункты, которые V-CHECK не смог подтвердить автоматически.';
    } else {
      analysis.finalRecommendation = 'Материал соответствует автоматически проверяемым требованиям формата; финальное решение остаётся за преподавателем.';
    }
  }

  function rebuildOverall(analysis, checks) {
    if (!analysis.overall || typeof analysis.overall !== 'object') analysis.overall = {};
    const problems = checks.filter(check => ['problem', 'warning'].includes(String(check?.status || ''))).map(check => String(check?.title || '').trim()).filter(Boolean);
    const unknowns = checks.filter(check => check?.status === 'unknown').map(check => String(check?.title || '').trim()).filter(Boolean);

    if (problems.length) {
      analysis.overall.summary = `Материал прошёл автоматическую проверку. Требуют доработки: ${problems.slice(0, 3).join(', ')}.${unknowns.length ? ` Не удалось автоматически определить: ${unknowns.slice(0, 3).join(', ')}.` : ''}`;
    } else if (unknowns.length) {
      analysis.overall.summary = `Автоматически подтверждённые требования формата соблюдены. Не удалось автоматически определить: ${unknowns.slice(0, 4).join(', ')}.`;
    } else {
      analysis.overall.summary = 'Автоматически проверяемые требования формата соблюдены.';
    }

    const criticalProblem = checks.some(check => check?.critical === true && check?.status === 'problem');
    const concern = checks.some(check => ['problem', 'warning', 'unknown'].includes(check?.status));
    analysis.overall.status = criticalProblem ? 'problem' : (concern ? 'warning' : 'ok');
  }

  function patchAnalysis(analysis) {
    if (!analysis || typeof analysis !== 'object' || !Array.isArray(analysis.checks)) return analysis;
    const checks = analysis.checks;

    for (const check of checks) {
      if (isFreshness(check) && ['problem', 'warning'].includes(String(check?.status || ''))) {
        const basis = `${String(check?.finding || '')} ${(Array.isArray(check?.evidence) ? check.evidence.join(' ') : '')}`.toLowerCase();
        const onlyMissingEvidence = /не удалось.*подтверд|нет.*(?:явн|указ).*дат|без.*дат|дата.*не.*указ|нет.*временн.*привяз/.test(basis);
        if (onlyMissingEvidence) {
          check.status = 'unknown';
          check.finding = 'Свежесть инфоповода нельзя надёжно подтвердить по доступным данным: отсутствие даты в расшифровке не доказывает, что событие старше недели.';
          check.evidence = [];
          check.recommendation = 'Проверить дату инфоповода вручную: на момент сдачи ему должно быть не больше недели.';
        }
      }

      if (isVisualMeaning(check) && check?.status === 'ok') {
        const basis = `${String(check?.finding || '')} ${(Array.isArray(check?.evidence) ? check.evidence.join(' ') : '')}`.toLowerCase();
        const genericSourceEvidence = /кадр.*(?:публикац|документ|сайт|визуальн.*источник)|признак.*визуальн.*источник/.test(basis);
        const specificAlignment = /конкретн.*(?:факт|цифр|утвержден).*визуал|визуал.*(?:совпад|соответств).*сказ|на кадре.*(?:показан|виден).*(?:упомянут|сказан)/.test(basis);
        if (genericSourceEvidence && !specificAlignment) {
          check.status = 'unknown';
          check.finding = 'Наличие визуальных источников подтверждено, но по доступным данным нельзя надёжно установить, что каждый визуальный элемент соответствует именно тому, что говорится в этот момент.';
          check.evidence = [];
          check.recommendation = 'Проверить в готовом видео соответствие визуальных подтверждений конкретным словам ведущего.';
        }
      }
    }

    cleanupTeacherReview(analysis, checks);
    rebuildPriorityFixes(analysis, checks);
    rebuildRecommendation(analysis, checks);
    rebuildOverall(analysis, checks);
    return analysis;
  }

  window.fetch = async function hotFinalCleanupFetch(input, init = {}) {
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
      console.warn('V-CHECK Hot final cleanup skipped:', error);
      return response;
    }
  };

  console.log('V-CHECK Hot final cleanup v1.0 loaded');
})();
