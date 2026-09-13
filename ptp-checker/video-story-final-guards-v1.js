// V-CHECK story final guards v1: remove social-significance criterion and use reliable speech-role standup evidence.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS = new Set(['story_event', 'story_theme']);

  if (window.__VCHECK_STORY_FINAL_GUARDS_V1__) return;
  window.__VCHECK_STORY_FINAL_GUARDS_V1__ = '1.0';

  const nativeFetch = window.fetch.bind(window);

  function requestBody(input, init) {
    try {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      if (url !== API_URL || !init?.body) return null;
      const body = JSON.parse(String(init.body));
      return body?.action === 'analyzeMaterial' ? body : null;
    } catch (_) {
      return null;
    }
  }

  function textOf(check) {
    return `${String(check?.id || '')} ${String(check?.title || '')}`.toLowerCase();
  }

  function isSignificance(value) {
    return /обществен.*значим|значимост|significance/i.test(String(value || ''));
  }

  function isStandupCheck(check) {
    return /стендап|standup/i.test(textOf(check));
  }

  function ensureSentence(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    return /[.!?…]$/.test(text) ? text : `${text}.`;
  }

  function rebuildFinalRecommendation(analysis) {
    const checks = Array.isArray(analysis?.checks) ? analysis.checks : [];
    const confirmed = checks
      .filter(check => ['problem', 'warning'].includes(check?.status) && String(check?.recommendation || '').trim())
      .map(check => ensureSentence(check.recommendation))
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .slice(0, 3);

    if (confirmed.length) {
      analysis.finalRecommendation = confirmed.join(' ');
    } else if (checks.some(check => check?.status === 'unknown')) {
      analysis.finalRecommendation = 'Перед сдачей проверьте вручную пункты, которые V-CHECK не смог определить автоматически.';
    } else {
      analysis.finalRecommendation = 'Сопоставьте выводы ИИ с готовым материалом перед сдачей.';
    }
  }

  function syncOverallStatus(analysis) {
    if (!analysis?.overall || !Array.isArray(analysis?.checks)) return;
    const hasCriticalProblem = analysis.checks.some(
      check => check?.critical === true && check?.status === 'problem'
    );
    const hasConcern = analysis.checks.some(
      check => ['problem', 'warning', 'unknown'].includes(check?.status)
    );
    analysis.overall.status = hasCriticalProblem ? 'problem' : (hasConcern ? 'warning' : 'ok');
  }

  function patchAnalysis(analysis, format) {
    if (!analysis || typeof analysis !== 'object' || !STORY_FORMATS.has(format)) return analysis;

    let checks = Array.isArray(analysis.checks) ? analysis.checks : [];

    // Пользователь решил обсуждать общественную значимость со студентами лично.
    checks = checks.filter(check => !isSignificance(textOf(check)));

    const roles = window.__VCHECK_SPEECH_ROLE_ANALYSIS__ || null;
    const standupCount = Number(roles?.standupCount);
    const standupConfirmed = Number.isFinite(standupCount) && standupCount >= 1;

    if (standupConfirmed) {
      for (const check of checks) {
        if (!isStandupCheck(check)) continue;
        check.status = 'ok';
        check.finding = 'Содержательный стендап подтверждён картой ролей речи и привязанным к речи визуальным кадром.';
        check.evidence = [
          `Карта ролей речи выделила подтверждённых стендап-эпизодов: ${standupCount}.`
        ];
        check.recommendation = '';
      }
    }

    analysis.checks = checks;

    if (Array.isArray(analysis.teacherReview)) {
      analysis.teacherReview = analysis.teacherReview.filter(item => {
        if (isSignificance(item)) return false;
        if (standupConfirmed && /стендап|standup/i.test(String(item || ''))) return false;
        return true;
      });
    }

    if (Array.isArray(analysis.priorityFixes)) {
      analysis.priorityFixes = analysis.priorityFixes.filter(item => {
        const text = `${item?.problem || ''} ${item?.why || ''} ${item?.how || ''}`;
        if (isSignificance(text)) return false;
        if (standupConfirmed && /стендап|standup/i.test(text)) return false;
        return true;
      });
    }

    if (Array.isArray(analysis.strengths)) {
      analysis.strengths = analysis.strengths.filter(item => !isSignificance(item));
    }

    if (typeof analysis?.overall?.summary === 'string') {
      const cleaned = analysis.overall.summary
        .split(/(?<=[.!?])\s+/)
        .filter(sentence => !isSignificance(sentence))
        .join(' ')
        .trim();
      if (cleaned) analysis.overall.summary = cleaned;
    }

    rebuildFinalRecommendation(analysis);
    syncOverallStatus(analysis);
    return analysis;
  }

  function patchPayload(payload, format) {
    if (!payload || typeof payload !== 'object') return payload;

    if (typeof payload.body === 'string') {
      try {
        const inner = JSON.parse(payload.body);
        if (inner?.analysis) inner.analysis = patchAnalysis(inner.analysis, format);
        return { ...payload, body: JSON.stringify(inner) };
      } catch (_) {
        return payload;
      }
    }

    if (payload?.analysis) {
      return { ...payload, analysis: patchAnalysis(payload.analysis, format) };
    }

    return payload;
  }

  window.fetch = async function storyFinalGuardsFetch(input, init = {}) {
    const body = requestBody(input, init);
    const response = await nativeFetch(input, init);
    if (!body) return response;

    try {
      const raw = await response.clone().json();
      const format = String(body.format || document.getElementById('format')?.value || '');
      const patched = patchPayload(raw, format);
      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
    } catch (error) {
      console.warn('V-CHECK story final guards skipped:', error);
      return response;
    }
  };

  console.log('V-CHECK story final guards v1.0 loaded');
})();
