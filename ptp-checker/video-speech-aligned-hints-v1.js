// V-CHECK speech-aligned hints v1: preserve exact segment↔frame mapping through backend compaction.
(() => {
  if (window.__VCHECK_SPEECH_ALIGNED_HINTS_V1__) return;
  window.__VCHECK_SPEECH_ALIGNED_HINTS_V1__ = '1.0';

  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function speechAlignedHintsFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    const method = String(init?.method || input?.method || 'GET').toUpperCase();

    if (
      url !== API_URL ||
      method !== 'POST' ||
      typeof init?.body !== 'string'
    ) {
      return nativeFetch(input, init);
    }

    let body;
    try {
      body = JSON.parse(init.body);
    } catch (_) {
      return nativeFetch(input, init);
    }

    if (body?.action !== 'analyzeSpeechRoles') {
      return nativeFetch(input, init);
    }

    const observations = body.mediaObservations || {};
    const timeline = Array.isArray(observations?.timeline)
      ? observations.timeline
      : [];

    if (!timeline.length) {
      return nativeFetch(input, init);
    }

    const enrichedTimeline = timeline.map(item => {
      const aligned = item?.speechAligned === true;
      const segmentIndex = Number(item?.speechSegmentIndex);

      if (!aligned || !Number.isInteger(segmentIndex) || segmentIndex < 0) {
        return item;
      }

      const prefix =
        `ТОЧНОЕ СООТВЕТСТВИЕ: этот стоп-кадр взят из середины речевого сегмента ${segmentIndex}.`;

      const evidence = Array.isArray(item?.visualEvidence)
        ? item.visualEvidence.map(value => String(value || '').trim()).filter(Boolean)
        : [];

      return {
        ...item,
        visualDescription:
          `${prefix} ${String(item?.visualDescription || '').trim()}`.trim(),
        visualEvidence: [
          `Кадр напрямую соответствует речевому сегменту ${segmentIndex}.`,
          ...evidence
        ].slice(0, 5)
      };
    });

    body.mediaObservations = {
      ...observations,
      timeline: enrichedTimeline,
      speechAlignedMappingAvailable: true
    };

    return nativeFetch(input, {
      ...init,
      body: JSON.stringify(body)
    });
  };

  console.log('V-CHECK speech-aligned hints v1.0 loaded');
})();
