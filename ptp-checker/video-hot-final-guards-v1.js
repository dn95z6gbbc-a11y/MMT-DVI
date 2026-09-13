// V-CHECK hot final guards v1: evidence-first checks for short vertical news explainers.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';

  if (window.__VCHECK_HOT_FINAL_GUARDS_V1__) return;
  window.__VCHECK_HOT_FINAL_GUARDS_V1__ = '1.0';

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

  function isHostCheck(check) {
    const text = checkText(check);
    return /ведущ.*кадр|ведущий.*кадр|автор.*кадр|presenter.*frame/.test(text) && !/не состоит|только.*ведущ|перебив/.test(text);
  }

  function isHostOnlyCheck(check) {
    const text = checkText(check);
    return /не состоит.*ведущ|только.*ведущ|говорящ.*голов|перебив|визуальн.*черед|visual.*altern/.test(text);
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

    return {
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
      hostFrames,
      brollFrames,
      graphicFrames,
      interviewFrames,
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
    const hostFrames = Number(hotEvidence?.hostFrames || 0);
    const visualSupport =
      hotEvidence?.cutawaysConfirmed === true ||
      hotEvidence?.visualAlternationConfirmed === true ||
      Number(hotEvidence?.brollFrames || 0) + Number(hotEvidence?.graphicFrames || 0) >= 2;

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

      if (isHostCheck(check) && hostFrames >= 1) {
        check.status = 'ok';
        check.finding = 'Ведущий присутствует в кадре.';
        check.evidence = ['Визуальный анализ подтвердил кадры, где журналист обращается к зрителю.'];
        check.recommendation = '';
      }

      if (isHostOnlyCheck(check) && hostFrames >= 1 && visualSupport) {
        check.status = 'ok';
        check.finding = 'Ролик не состоит только из ведущего: есть визуальные перебивки и подтверждения.';
        check.evidence = ['Визуальный анализ подтвердил чередование ведущего с дополнительным визуальным материалом.'];
        check.recommendation = '';
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

    const review = Array.isArray(analysis.teacherReview) ? analysis.teacherReview : [];
    for (const check of checks) {
      if (check?.status !== 'unknown') continue;
      if (!isSourcesCheck(check) && !isFreshnessCheck(check)) continue;
      const item = `Проверить вручную: ${String(check?.title || check?.id || 'критерий')}`;
      if (!review.includes(item)) review.push(item);
    }
    analysis.teacherReview = review;

    if (Array.isArray(analysis.priorityFixes)) {
      analysis.priorityFixes = analysis.priorityFixes.filter(item => {
        const text = `${item?.problem || ''} ${item?.why || ''} ${item?.how || ''}`.toLowerCase();
        if (/источ/.test(text) && checks.some(check => isSourcesCheck(check) && check?.status === 'unknown')) return false;
        if (/свеж|недел|инфоповод/.test(text) && checks.some(check => isFreshnessCheck(check) && check?.status === 'unknown')) return false;
        return true;
      });
    }

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

  console.log('V-CHECK hot final guards v1.0 loaded');
})();
