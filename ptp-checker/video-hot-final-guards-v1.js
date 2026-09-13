// V-CHECK hot final guards v2: evidence-first checks for short vertical news explainers.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';

  if (window.__VCHECK_HOT_FINAL_GUARDS_V2__) return;
  window.__VCHECK_HOT_FINAL_GUARDS_V2__ = '2.0';

  const nativeFetch = window.fetch.bind(window);

  function requestBody(input, init) {
    try {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      if (url !== API_URL || !init?.body) return null;
      const body = JSON.parse(String(init.body));
      return body?.action === 'analyzeMaterial' && String(body?.format || '') === 'hot' ? body : null;
    } catch (_) {
      return null;
    }
  }

  function checkText(check) {
    return `${String(check?.id || '')} ${String(check?.title || '')} ${String(check?.finding || '')} ${(Array.isArray(check?.evidence) ? check.evidence.join(' ') : '')} ${String(check?.recommendation || '')}`.toLowerCase();
  }

  function isDurationCheck(check) {
    return /хронометраж|длительн|duration/.test(checkText(check));
  }

  function isVerticalCheck(check) {
    return /вертикал|ориентац.*видео|video.*orientation|orientation.*video/.test(checkText(check));
  }

  function isHostCheck(check) {
    const text = checkText(check);
    return /ведущ.*кадр|ведущий.*кадр|автор.*кадр|presenter.*frame/.test(text) && !/не состоит|только.*ведущ|перебив/.test(text);
  }

  function isHostOnlyCheck(check) {
    const text = checkText(check);
    return /не состоит.*ведущ|только.*ведущ|говорящ.*голов|перебив|визуальн.*черед|visual.*altern/.test(text);
  }

  function isVisualConfirmationCheck(check) {
    const text = checkText(check);
    return /визуальн.*подтверж|подтверж.*визуал|визуальн.*доказ|visual.*evidence/.test(text);
  }

  function isVisualMeaningCheck(check) {
    const text = checkText(check);
    return /визуал.*подтверж.*сказ|визуал.*сказан|визуал.*фон|картин.*подтверж.*реч|visual.*support.*speech|visual.*background/.test(text);
  }

  function isMontageRhythmCheck(check) {
    const text = checkText(check);
    return /монтаж.*ритм|ритм.*монтаж|editing.*rhythm|montage.*rhythm/.test(text);
  }

  function isSourcesCheck(check) {
    const text = checkText(check);
    return /независим.*источ|источ.*независим|ключев.*факт.*источ|двум.*источ|двух.*источ|2.*источ/.test(text);
  }

  function isFreshnessCheck(check) {
    const text = checkText(check);
    return /свеж|не старше.*недел|инфоповод.*недел|fresh|7.*дн/.test(text);
  }

  function sourceTokens(text) {
    const value = String(text || '');
    const found = new Set();

    const known = value.match(/\b(?:ТАСС|РБК|РИА(?:\s+Новости)?|Интерфакс|Reuters|Рейтер|Yonhap|BBC|CNN|AP|Associated\s+Press|AFP|Bloomberg|Forbes|Коммерсантъ|Ведомости|Известия|Медуза|The\s+Guardian|Washington\s+Post|New\s+York\s+Times)\b/gi) || [];
    for (const item of known) found.add(item.toLowerCase().replace(/\s+/g, ' '));

    const domains = value.match(/\b(?:[a-z0-9-]+\.)+(?:ru|com|org|net|io|news|рф)\b/gi) || [];
    for (const item of domains) found.add(item.toLowerCase());

    const quoted = [...value.matchAll(/[«“"]([^»”"]{2,50})[»”"]/g)]
      .map(match => String(match[1] || '').trim())
      .filter(Boolean);
    for (const item of quoted) {
      if (!/^(источник|публикация|новость|материал)$/i.test(item)) found.add(item.toLowerCase());
    }

    const caps = value.match(/\b[А-ЯЁA-Z]{2,12}\b/g) || [];
    for (const item of caps) {
      if (!/^(ИИ|СМИ|РФ|США|ЕС|ООН|МВД|МЧС|МО|РКН)$/i.test(item)) found.add(item.toLowerCase());
    }

    return [...found];
  }

  function hasTwoExplicitSources(check, hotEvidence) {
    const checkMaterial = [
      check?.finding,
      ...(Array.isArray(check?.evidence) ? check.evidence : [])
    ].join(' ');

    const visualMaterial = Array.isArray(hotEvidence?.sourceLikeVisuals)
      ? hotEvidence.sourceLikeVisuals.join(' ')
      : '';

    return sourceTokens(`${checkMaterial} ${visualMaterial}`).length >= 2;
  }

  function hasFreshnessEvidence(check) {
    const text = [check?.finding, ...(Array.isArray(check?.evidence) ? check.evidence : [])]
      .join(' ')
      .toLowerCase();

    return /\b(?:сегодня|вчера|позавчера)\b|\b\d{1,2}\s+(?:январ[яь]|феврал[яь]|март[а]?|апрел[яь]|ма[яй]|июн[яь]|июл[яь]|август[а]?|сентябр[яь]|октябр[яь]|ноябр[яь]|декабр[яь])\b|\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b|\b\d+\s+(?:день|дня|дней|час|часа|часов)\s+назад\b/.test(text);
  }

  function materialDimensions() {
    const meta = String(document.getElementById('materialMeta')?.textContent || '');
    const match = meta.match(/\b(\d{2,5})\s*[×xX]\s*(\d{2,5})\b/);
    if (match) {
      return { width: Number(match[1]), height: Number(match[2]) };
    }

    try {
      if (typeof material !== 'undefined') {
        const width = Number(material?.width);
        const height = Number(material?.height);
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
          return { width, height };
        }
      }
    } catch (_) {}

    return { width: 0, height: 0 };
  }

  function buildHotEvidence() {
    const vision = window.VCHECK_VIDEO_VISION || {};
    const frames = Array.isArray(vision?.frames) ? vision.frames : [];
    const good = frames.filter(item => item?.analysis && !item?.error);
    const segments = Array.isArray(window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__)
      ? window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__
      : [];

    const hostFrames = good.filter(item => {
      const a = item.analysis || {};
      return a.journalistLikelySpeakingToCamera === 'yes' || a.frameType === 'standup';
    }).length;

    const brollFrames = good.filter(item => item?.analysis?.frameType === 'broll').length;
    const graphicFrames = good.filter(item => item?.analysis?.frameType === 'graphic').length;
    const interviewFrames = good.filter(item => item?.analysis?.frameType === 'interview').length;

    const sourceLikeVisuals = good
      .filter(item => {
        const a = item.analysis || {};
        return a.frameType === 'graphic' || a.otherTextVisible === true || a.logoVisible === true || a.subtitlesVisible === true;
      })
      .map(item => {
        const a = item.analysis || {};
        return `${String(a.visualDescription || '')} ${(Array.isArray(a.evidence) ? a.evidence.join(' ') : '')}`.trim();
      })
      .filter(Boolean)
      .slice(0, 12);

    const explicitSourceFrames = sourceLikeVisuals.filter(text =>
      /скриншот|публикац|новостн.*сайт|страниц.*сайт|документ|стать[яи]|источник|reuters|tass|тасс|bbc|cnn|\bap\b|afp|bloomberg|рбк|риа|yonhap/i.test(text)
    ).length;

    const openingSegments = segments
      .filter(segment => Number(segment?.startSeconds) < 5.5)
      .slice(0, 6)
      .map(segment => ({
        startSeconds: Number(segment?.startSeconds),
        endSeconds: Number(segment?.endSeconds),
        text: String(segment?.text || '').trim().slice(0, 280)
      }));

    const source = window.__VCHECK_VIDEO_SOURCE__ || {};
    const durationSeconds = Number(source?.durationSeconds);
    const dimensions = materialDimensions();

    return {
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
      width: dimensions.width,
      height: dimensions.height,
      hostFrames,
      brollFrames,
      graphicFrames,
      interviewFrames,
      explicitSourceFrames,
      cutawaysConfirmed: vision?.cutawaysConfirmed === true,
      visualAlternationConfirmed: vision?.visualAlternationConfirmed === true,
      selectedFrames: Number(vision?.selectedFrames || 0),
      openingSegments,
      openingTranscript: openingSegments.map(item => item.text).join(' ').slice(0, 900),
      sourceLikeVisuals
    };
  }

  function ensureSentence(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    return /[.!?…]$/.test(text) ? text : `${text}.`;
  }

  function addTeacherReview(analysis, text) {
    if (!Array.isArray(analysis.teacherReview)) analysis.teacherReview = [];
    const normalized = String(text || '').trim();
    if (!normalized) return;
    const key = normalized.toLowerCase().replace(/^проверить вручную:\s*/i, '').replace(/^необходимо проверить\s*/i, '');
    const exists = analysis.teacherReview.some(item => {
      const candidate = String(item || '').toLowerCase().replace(/^проверить вручную:\s*/i, '').replace(/^необходимо проверить\s*/i, '');
      return candidate === key || candidate.includes(key) || key.includes(candidate);
    });
    if (!exists) analysis.teacherReview.push(normalized);
  }

  function dedupeTeacherReview(analysis) {
    if (!Array.isArray(analysis.teacherReview)) return;
    const result = [];
    const keys = [];
    for (const item of analysis.teacherReview) {
      const text = String(item || '').trim();
      if (!text) continue;
      const key = text.toLowerCase()
        .replace(/^проверить вручную:\s*/i, '')
        .replace(/^необходимо проверить\s*/i, '')
        .replace(/^проверить\s*/i, '')
        .replace(/[.:;]+$/g, '')
        .trim();
      if (keys.some(existing => existing === key || existing.includes(key) || key.includes(existing))) continue;
      keys.push(key);
      result.push(text);
    }
    analysis.teacherReview = result;
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
      analysis.finalRecommendation = 'Перед сдачей проверьте вручную пункты, которые V-CHECK не смог подтвердить автоматически.';
    } else {
      analysis.finalRecommendation = 'Материал соответствует автоматически проверяемым требованиям формата; финальное решение остаётся за преподавателем.';
    }
  }

  function syncOverallStatus(analysis) {
    if (!analysis?.overall || !Array.isArray(analysis?.checks)) return;
    const hasCriticalProblem = analysis.checks.some(check => check?.critical === true && check?.status === 'problem');
    const hasConcern = analysis.checks.some(check => ['problem', 'warning', 'unknown'].includes(check?.status));
    analysis.overall.status = hasCriticalProblem ? 'problem' : (hasConcern ? 'warning' : 'ok');
  }

  function patchAnalysis(analysis, hotEvidence) {
    if (!analysis || typeof analysis !== 'object') return analysis;
    const checks = Array.isArray(analysis.checks) ? analysis.checks : [];

    const duration = Number(hotEvidence?.durationSeconds);
    const width = Number(hotEvidence?.width || 0);
    const height = Number(hotEvidence?.height || 0);
    const hostFrames = Number(hotEvidence?.hostFrames || 0);
    const extraVisualFrames = Number(hotEvidence?.brollFrames || 0) + Number(hotEvidence?.graphicFrames || 0) + Number(hotEvidence?.interviewFrames || 0);
    const visualSupport =
      hotEvidence?.cutawaysConfirmed === true ||
      hotEvidence?.visualAlternationConfirmed === true ||
      extraVisualFrames >= 2;

    let visualUncertain = false;
    let montageUncertain = false;

    for (const check of checks) {
      if (isDurationCheck(check) && Number.isFinite(duration)) {
        if (duration > 90.05) {
          check.status = 'problem';
          check.finding = `Хронометраж превышает максимум формата: ${Math.round(duration)} сек. при требовании не более 90 сек.`;
          check.evidence = [`Фактическая длительность видео: ${Math.round(duration)} секунд.`];
          check.recommendation = 'Сократить ролик до 1 минуты 30 секунд, сохранив ключевое объяснение и доказательства.';
        } else {
          check.status = 'ok';
          check.finding = `Хронометраж соответствует требованию: ${Math.round(duration)} сек.`;
          check.evidence = [`Фактическая длительность видео: ${Math.round(duration)} секунд.`];
          check.recommendation = '';
        }
      }

      if (isVerticalCheck(check) && width > 0 && height > 0) {
        const vertical = height > width;
        check.status = vertical ? 'ok' : 'problem';
        check.finding = vertical
          ? `Ориентация видео вертикальная: ${width}×${height}.`
          : `Ориентация видео не вертикальная: ${width}×${height}.`;
        check.evidence = [`Метаданные видео: ${width}×${height}.`];
        check.recommendation = vertical ? '' : 'Экспортировать «Горячий разбор» в вертикальном формате.';
      }

      if (isHostCheck(check) && hostFrames >= 1) {
        check.status = 'ok';
        check.finding = 'Ведущий присутствует в кадре.';
        check.evidence = ['Визуальный анализ подтвердил кадры, где журналист обращается к зрителю.'];
        check.recommendation = '';
      }

      if (isHostOnlyCheck(check)) {
        if (hostFrames >= 1 && visualSupport) {
          check.status = 'ok';
          check.finding = 'Ролик не состоит только из ведущего: есть дополнительные планы, графика или визуальные вставки.';
          check.evidence = [`В выборке: b-roll — ${Number(hotEvidence?.brollFrames || 0)}, графика — ${Number(hotEvidence?.graphicFrames || 0)}, интервью — ${Number(hotEvidence?.interviewFrames || 0)}.`];
          check.recommendation = '';
        } else if (check?.status === 'problem') {
          check.status = 'unknown';
          check.finding = 'По выборке из отдельных стоп-кадров нельзя доказать, что ролик состоит только из ведущего: короткие перебивки могли не попасть в выборку.';
          check.evidence = [];
          check.recommendation = 'Проверить в готовом видео наличие визуальных перебивок.';
          addTeacherReview(analysis, 'Проверить вручную: визуальные перебивки');
          visualUncertain = true;
        }
      }

      if (isVisualConfirmationCheck(check)) {
        if (Number(hotEvidence?.explicitSourceFrames || 0) >= 1) {
          check.status = 'ok';
          check.finding = 'В выборке обнаружены кадры с признаками публикации, документа, сайта или другого визуального подтверждения.';
          check.evidence = [`Кадров с явными признаками визуального источника: ${Number(hotEvidence.explicitSourceFrames)}.`];
          check.recommendation = '';
        } else if (check?.status === 'problem') {
          check.status = 'unknown';
          check.finding = 'Отсутствие визуальных подтверждений нельзя доказать по 24 отдельным стоп-кадрам.';
          check.evidence = [];
          check.recommendation = 'Проверить в готовом видео наличие скриншотов, документов, фото, видео или других подтверждений инфоповода.';
          addTeacherReview(analysis, 'Проверить вручную: визуальные подтверждения');
          visualUncertain = true;
        }
      }

      if (isVisualMeaningCheck(check) && check?.status === 'problem' && !visualSupport) {
        check.status = 'unknown';
        check.finding = 'По выборке стоп-кадров нельзя надёжно определить, поддерживает ли визуал сказанное на всём протяжении ролика.';
        check.evidence = [];
        check.recommendation = 'Проверить в готовом видео, помогает ли визуал подтверждать и объяснять сказанное, а не только служит фоном.';
        addTeacherReview(analysis, 'Проверить вручную: соответствие визуала сказанному');
        visualUncertain = true;
      }

      if (isMontageRhythmCheck(check) && check?.status === 'problem' && !hotEvidence?.visualAlternationConfirmed) {
        check.status = 'unknown';
        check.finding = 'По равномерной выборке стоп-кадров нельзя надёжно измерить монтажный ритм готового ролика.';
        check.evidence = [];
        check.recommendation = 'Преподавателю проверить монтажный ритм по готовому видео.';
        addTeacherReview(analysis, 'Проверить вручную: монтажный ритм');
        montageUncertain = true;
      }

      if (isSourcesCheck(check) && check?.status === 'ok' && !hasTwoExplicitSources(check, hotEvidence)) {
        check.status = 'unknown';
        check.finding = 'Недостаточно конкретных доказательств, чтобы автоматически подтвердить два независимых источника ключевого факта.';
        check.evidence = [];
        check.recommendation = 'Проверить вручную, названы или показаны ли минимум два независимых источника, подтверждающих ключевой факт.';
      }

      if (isFreshnessCheck(check) && check?.status === 'ok' && !hasFreshnessEvidence(check)) {
        check.status = 'unknown';
        check.finding = 'Свежесть инфоповода нельзя надёжно подтвердить без конкретной даты или прямой временной привязки.';
        check.evidence = [];
        check.recommendation = 'Проверить дату инфоповода: на момент сдачи ему должно быть не больше недели.';
      }
    }

    for (const check of checks) {
      if (check?.status !== 'unknown') continue;
      if (isSourcesCheck(check) || isFreshnessCheck(check)) {
        addTeacherReview(analysis, `Проверить вручную: ${String(check?.title || check?.id || 'критерий')}`);
      }
    }

    if (Array.isArray(analysis.priorityFixes)) {
      analysis.priorityFixes = analysis.priorityFixes.filter(item => {
        const text = `${item?.problem || ''} ${item?.why || ''} ${item?.how || ''}`.toLowerCase();
        if (/источ/.test(text) && checks.some(check => isSourcesCheck(check) && check?.status === 'unknown')) return false;
        if (/свеж|недел|инфоповод/.test(text) && checks.some(check => isFreshnessCheck(check) && check?.status === 'unknown')) return false;
        if (visualUncertain && /говорящ.*голов|перебив|визуальн.*подтверж|визуальн.*элемент|визуал.*фон/.test(text)) return false;
        if (montageUncertain && /монтаж.*ритм|ритм.*монтаж/.test(text)) return false;
        return true;
      });
    }

    if (analysis.overall && typeof analysis.overall.summary === 'string' && (visualUncertain || montageUncertain)) {
      const parts = analysis.overall.summary.split(/(?<=[.!?])\s+/).filter(Boolean);
      const cleaned = parts.filter(part => {
        if (visualUncertain && /говорящ.*голов|визуальн.*состав|визуальн.*подтверж|визуал.*фон|перебив/i.test(part)) return false;
        if (montageUncertain && /монтаж.*ритм|ритм.*монтаж/i.test(part)) return false;
        return true;
      }).join(' ').trim();
      analysis.overall.summary = cleaned || 'Материал проанализирован по расшифровке и доступной визуальной выборке. Часть визуальных критериев требует проверки по готовому видео.';
    }

    dedupeTeacherReview(analysis);
    rebuildFinalRecommendation(analysis);
    syncOverallStatus(analysis);
    return analysis;
  }

  function patchPayload(payload, hotEvidence) {
    if (!payload || typeof payload !== 'object') return payload;

    if (typeof payload.body === 'string') {
      try {
        const inner = JSON.parse(payload.body);
        if (inner?.analysis) inner.analysis = patchAnalysis(inner.analysis, hotEvidence);
        return { ...payload, body: JSON.stringify(inner) };
      } catch (_) {
        return payload;
      }
    }

    if (payload?.analysis) {
      return { ...payload, analysis: patchAnalysis(payload.analysis, hotEvidence) };
    }

    return payload;
  }

  window.fetch = async function hotFinalGuardsFetch(input, init = {}) {
    const body = requestBody(input, init);
    if (!body) return nativeFetch(input, init);

    const hotEvidence = buildHotEvidence();
    const observations = body.mediaObservations || body.videoObservations || {};
    const enriched = { ...observations, hotEvidence };
    body.mediaObservations = enriched;
    body.videoObservations = enriched;

    const response = await nativeFetch(input, {
      ...init,
      body: JSON.stringify(body)
    });

    try {
      const raw = await response.clone().json();
      const patched = patchPayload(raw, hotEvidence);
      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
    } catch (error) {
      console.warn('V-CHECK hot final guards skipped:', error);
      return response;
    }
  };

  console.log('V-CHECK hot final guards v2.0 loaded');
})();
