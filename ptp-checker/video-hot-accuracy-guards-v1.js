// V-CHECK Hot accuracy guards v1: deterministic metadata + conservative visual negatives.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  if (window.__VCHECK_HOT_ACCURACY_GUARDS_V1__) return;
  window.__VCHECK_HOT_ACCURACY_GUARDS_V1__ = '1.0';

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

  function isVerticalCheck(check) {
    return /вертикал|ориентац.*видео|video.*orientation|orientation.*video/.test(textOf(check));
  }

  function isHostOnlyCheck(check) {
    const text = textOf(check);
    return /говорящ.*голов|только.*ведущ|не только.*ведущ|перебив|визуальн.*черед|visual.*altern/.test(text);
  }

  function isVisualConfirmationCheck(check) {
    const text = textOf(check);
    return /визуальн.*подтверж|подтверж.*визуал|визуальн.*доказ|visual.*evidence/.test(text);
  }

  function isMontageRhythmCheck(check) {
    const text = textOf(check);
    return /монтаж.*ритм|ритм.*монтаж|editing.*rhythm|montage.*rhythm/.test(text);
  }

  function isSignificanceCheck(check) {
    return /обществен.*значим|значимост|significance/.test(textOf(check));
  }

  function materialDimensions() {
    try {
      if (typeof material !== 'undefined') {
        const width = Number(material?.width);
        const height = Number(material?.height);
        return {
          width: Number.isFinite(width) ? width : 0,
          height: Number.isFinite(height) ? height : 0
        };
      }
    } catch (_) {}
    return { width: 0, height: 0 };
  }

  function visualEvidence() {
    const vision = window.VCHECK_VIDEO_VISION || {};
    const frames = Array.isArray(vision?.frames) ? vision.frames : [];
    const good = frames.filter(item => item?.analysis && !item?.error);

    const broll = good.filter(item => item.analysis?.frameType === 'broll').length;
    const graphic = good.filter(item => item.analysis?.frameType === 'graphic').length;
    const interview = good.filter(item => item.analysis?.frameType === 'interview').length;
    const host = good.filter(item => {
      const a = item.analysis || {};
      return a.frameType === 'standup' || a.journalistLikelySpeakingToCamera === 'yes';
    }).length;

    const explicitSourceFrames = good.filter(item => {
      const a = item.analysis || {};
      const text = `${String(a.visualDescription || '')} ${(Array.isArray(a.evidence) ? a.evidence.join(' ') : '')}`.toLowerCase();
      return /скриншот|публикац|новостн.*сайт|страниц.*сайт|документ|стать[яи]|источник|логотип.*(?:reuters|tass|тасс|bbc|cnn|ap|afp|bloomberg|рбк|риа|yonhap)|(?:reuters|tass|тасс|bbc|cnn|ap|afp|bloomberg|рбк|риа|yonhap)/i.test(text);
    }).length;

    return {
      processed: good.length,
      broll,
      graphic,
      interview,
      host,
      explicitSourceFrames,
      cutawaysConfirmed: vision?.cutawaysConfirmed === true,
      visualAlternationConfirmed: vision?.visualAlternationConfirmed === true,
      shotVariety: String(vision?.shotVariety || 'unknown')
    };
  }

  function ensureTeacherReview(analysis, title) {
    if (!Array.isArray(analysis.teacherReview)) analysis.teacherReview = [];
    const item = `Проверить вручную: ${title}`;
    if (!analysis.teacherReview.includes(item)) analysis.teacherReview.push(item);
  }

  function cleanUnknownFromPriority(analysis, patterns) {
    if (!Array.isArray(analysis.priorityFixes)) return;
    analysis.priorityFixes = analysis.priorityFixes.filter(item => {
      const text = `${item?.problem || ''} ${item?.why || ''} ${item?.how || ''}`;
      return !patterns.some(pattern => pattern.test(text));
    });
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

  function patchAnalysis(analysis) {
    if (!analysis || typeof analysis !== 'object' || !Array.isArray(analysis.checks)) return analysis;

    const dims = materialDimensions();
    const visual = visualEvidence();
    let visualsUnknown = false;
    let montageUnknown = false;

    for (const check of analysis.checks) {
      if (isVerticalCheck(check) && dims.width > 0 && dims.height > 0) {
        const vertical = dims.height > dims.width;
        check.status = vertical ? 'ok' : 'problem';
        check.finding = vertical
          ? `Ориентация видео вертикальная: ${dims.width}×${dims.height}.`
          : `Ориентация видео не вертикальная: ${dims.width}×${dims.height}.`;
        check.evidence = [`Метаданные видео: ${dims.width}×${dims.height}.`];
        check.recommendation = vertical ? '' : 'Экспортировать «Горячий разбор» в вертикальном формате.';
      }

      if (isHostOnlyCheck(check)) {
        const positive = visual.cutawaysConfirmed || visual.visualAlternationConfirmed || (visual.broll + visual.graphic + visual.interview >= 2);
        if (positive) {
          check.status = 'ok';
          check.finding = 'Видео не состоит только из ведущего: визуальная выборка подтверждает дополнительные планы или визуальные вставки.';
          check.evidence = [`Из ${visual.processed} обработанных кадров: b-roll — ${visual.broll}, графика — ${visual.graphic}, интервью — ${visual.interview}; подтверждение чередования: ${visual.visualAlternationConfirmed ? 'да' : 'нет'}.`];
          check.recommendation = '';
        } else if (check.status === 'problem') {
          check.status = 'unknown';
          check.finding = 'По выборке стоп-кадров нельзя доказать, что ролик состоит только из ведущего: короткие перебивки могли не попасть в выборку.';
          check.evidence = [];
          check.recommendation = 'Проверить в готовом видео наличие визуальных перебивок.';
          ensureTeacherReview(analysis, check.title || 'визуальные перебивки');
          visualsUnknown = true;
        }
      }

      if (isVisualConfirmationCheck(check)) {
        if (visual.explicitSourceFrames >= 1) {
          check.status = 'ok';
          check.finding = 'В выборке обнаружены кадры, похожие на визуальные подтверждения или показ источника.';
          check.evidence = [`Кадров с явными признаками публикации, документа, сайта или названного источника: ${visual.explicitSourceFrames}.`];
          check.recommendation = '';
        } else if (check.status === 'problem') {
          check.status = 'unknown';
          check.finding = 'Отсутствие визуального подтверждения нельзя доказать по 24 отдельным стоп-кадрам.';
          check.evidence = [];
          check.recommendation = 'Проверить в готовом видео наличие скриншотов, документов, фото, видео или других подтверждений инфоповода.';
          ensureTeacherReview(analysis, check.title || 'визуальные подтверждения');
          visualsUnknown = true;
        }
      }

      if (isMontageRhythmCheck(check)) {
        if (check.status === 'problem' && !visual.visualAlternationConfirmed) {
          check.status = 'unknown';
          check.finding = 'По равномерной выборке стоп-кадров нельзя надёжно измерить монтажный ритм готового ролика.';
          check.evidence = [];
          check.recommendation = 'Преподавателю проверить монтажный ритм по готовому видео.';
          ensureTeacherReview(analysis, check.title || 'монтажный ритм');
          montageUnknown = true;
        }
      }

      if (isSignificanceCheck(check) && check.status === 'ok') {
        const basis = `${String(check.finding || '')} ${(Array.isArray(check.evidence) ? check.evidence.join(' ') : '')}`;
        const onlyResonance = /широк.*(?:общественн.*)?резонанс|много.*обсужд|популяр/i.test(basis) && !/последств|влияни|проблем|тенденц|прав|эконом|общественн.*интерес|значени.*для/i.test(basis);
        if (onlyResonance) {
          check.status = 'warning';
          check.finding = 'Резонанс темы заметен, но сама по себе популярность обсуждения ещё не объясняет её общественную значимость.';
          check.recommendation = 'Сформулировать, какие последствия, интересы аудитории или более широкое явление делает инфоповод общественно значимым.';
        }
      }
    }

    const patterns = [];
    if (visualsUnknown) patterns.push(/говорящ.*голов|перебив|визуальн.*подтверж|визуальн.*элемент/i);
    if (montageUnknown) patterns.push(/монтаж.*ритм|ритм.*монтаж/i);
    cleanUnknownFromPriority(analysis, patterns);

    if (analysis.overall && typeof analysis.overall.summary === 'string' && (visualsUnknown || montageUnknown)) {
      const parts = analysis.overall.summary.split(/(?<=[.!?])\s+/).filter(Boolean);
      const cleaned = parts.filter(part => {
        if (visualsUnknown && /говорящ.*голов|визуальн.*состав|визуальн.*подтверж|перебив/i.test(part)) return false;
        if (montageUnknown && /монтаж.*ритм|ритм.*монтаж/i.test(part)) return false;
        return true;
      }).join(' ').trim();
      analysis.overall.summary = cleaned || 'Материал проанализирован по расшифровке и доступной визуальной выборке. Часть визуальных критериев требует проверки по готовому видео.';
    }

    rebuildFinalRecommendation(analysis);
    syncOverall(analysis);
    return analysis;
  }

  function patchPayload(raw) {
    const payload = parseEnvelope(raw);
    if (payload?.analysis) payload.analysis = patchAnalysis(payload.analysis);
    return payload;
  }

  window.fetch = async function hotAccuracyGuardsFetch(input, init = {}) {
    const body = requestBody(input, init);
    if (!body) return nativeFetch(input, init);

    const response = await nativeFetch(input, init);
    try {
      const raw = await response.clone().json();
      const patched = patchPayload(raw);
      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
    } catch (error) {
      console.warn('V-CHECK hot accuracy guards skipped:', error);
      return response;
    }
  };

  console.log('V-CHECK Hot accuracy guards v1.0 loaded');
})();
