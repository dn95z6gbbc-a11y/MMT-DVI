// V-CHECK story final polish v1: remove contradictory cosmetic warnings and soften near-miss VO wording.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS = new Set(['story_event', 'story_theme']);

  if (window.__VCHECK_STORY_FINAL_POLISH_V1__) return;
  window.__VCHECK_STORY_FINAL_POLISH_V1__ = '1.0';

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
    return `${String(check?.id || '')} ${String(check?.title || '')} ${String(check?.finding || '')} ${Array.isArray(check?.evidence) ? check.evidence.join(' ') : ''} ${String(check?.recommendation || '')}`.toLowerCase();
  }

  function isStandupCheck(check) {
    return /стендап|standup/i.test(`${check?.id || ''} ${check?.title || ''}`);
  }

  function isVoiceoverWordsCheck(check) {
    const text = `${String(check?.id || '')} ${String(check?.title || '')}`.toLowerCase();
    return /250.*330|закадр.*слов|слов.*закадр|voiceover.*word/.test(text);
  }

  function isVisualQualityCheck(check) {
    const text = `${String(check?.id || '')} ${String(check?.title || '')}`.toLowerCase();
    return /качество.*визуал|визуал.*качеств|visual.*quality/.test(text);
  }

  function isStructureCheck(check) {
    const text = `${String(check?.id || '')} ${String(check?.title || '')}`.toLowerCase();
    return /структур|цельност|сквозн.*лини|structure|coherence/.test(text);
  }

  function isHypotheticalPrettyFramesWarning(check) {
    const text = textOf(check);
    return check?.status === 'warning' &&
      /риск.*набор.*красив.*кадр|могут.*статич|могут.*оторван|кажд.*кадр.*поддерж.*сюжет|не связан.*основн.*тем/.test(text);
  }

  function structureConfirmsCoherence(check) {
    if (check?.status !== 'ok') return false;
    const text = textOf(check);
    return /не превращ.*набор.*красив.*кадр|ч[её]тк.*структур|логичн.*развит|цельн.*истор|сквозн.*лини/.test(text);
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
    let removedVisualWarning = false;

    // Не показываем студенту точное число стендапов: для требования важно наличие хотя бы одного.
    for (const check of checks) {
      if (isStandupCheck(check) && check?.status === 'ok') {
        check.evidence = [
          'Карта ролей речи и привязанный к речи визуальный кадр подтвердили наличие стендапа.'
        ];
      }
    }

    // Для тематического сюжета убираем противоречивый гипотетический warning
    // про «набор красивых кадров», если другая проверка уже подтверждает цельность структуры.
    if (format === 'story_theme') {
      const coherentStructure = checks.some(check => isStructureCheck(check) && structureConfirmsCoherence(check));
      if (coherentStructure) {
        const before = checks.length;
        checks = checks.filter(check => {
          if (!isVisualQualityCheck(check)) return true;
          return !isHypotheticalPrettyFramesWarning(check);
        });
        removedVisualWarning = checks.length < before;
      }
    }

    // Если закадра совсем немного не хватает до ориентира, не советуем механически «добивать слова».
    const roles = window.__VCHECK_SPEECH_ROLE_ANALYSIS__ || null;
    const voiceoverWords = Number(roles?.voiceoverWordCount);
    if (Number.isFinite(voiceoverWords) && voiceoverWords >= 220 && voiceoverWords < 250) {
      for (const check of checks) {
        if (!isVoiceoverWordsCheck(check) || check?.status !== 'warning') continue;
        check.finding = `Закадрового текста немного меньше ориентира: ${voiceoverWords} слов при ориентире 250–330.`;
        check.evidence = [`Карта ролей речи отнесла к закадровому тексту ${voiceoverWords} слов.`];
        check.recommendation = 'Если это помогает раскрыть тему, можно добавить короткий содержательный закадровый фрагмент; не добирать объём искусственно.';
      }
    }

    analysis.checks = checks;

    if (removedVisualWarning) {
      if (Array.isArray(analysis.priorityFixes)) {
        analysis.priorityFixes = analysis.priorityFixes.filter(item => {
          const text = `${item?.problem || ''} ${item?.why || ''} ${item?.how || ''}`.toLowerCase();
          return !/набор.*красив.*кадр|кажд.*кадр.*поддерж.*сюжет|оторван.*контекст|визуальн.*составляющ/.test(text);
        });
      }

      if (Array.isArray(analysis.teacherReview)) {
        analysis.teacherReview = analysis.teacherReview.filter(item => {
          const text = String(item || '').toLowerCase();
          return !/визуальн.*целост|визуальн.*составляющ.*целост|набор.*красив.*кадр/.test(text);
        });
      }

      if (typeof analysis?.overall?.summary === 'string') {
        const cleaned = analysis.overall.summary
          .split(/(?<=[.!?])\s+/)
          .filter(sentence => !/недоч.*визуальн|визуальн.*составляющ.*треб.*доработ|визуальн.*составляющ.*недоч/i.test(sentence))
          .join(' ')
          .trim();
        if (cleaned) analysis.overall.summary = cleaned;
      }
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

  window.fetch = async function storyFinalPolishFetch(input, init = {}) {
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
      console.warn('V-CHECK story final polish skipped:', error);
      return response;
    }
  };

  console.log('V-CHECK story final polish v1.0 loaded');
})();
