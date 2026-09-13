// V-CHECK speech extra coverage v1: add exact speech-aligned frames for segments omitted by the first 24-frame pass.
(() => {
  if (window.__VCHECK_SPEECH_EXTRA_COVERAGE_V1__) return;
  window.__VCHECK_SPEECH_EXTRA_COVERAGE_V1__ = '1.0';

  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const EXTRA_MAX_FRAMES = 12;
  const CONCURRENCY = 2;
  const nativeFetch = window.fetch.bind(window);

  function parseEnvelope(value) {
    if (value && typeof value.body === 'string') {
      try { return JSON.parse(value.body); } catch (_) {}
    }
    return value || {};
  }

  function setProgress(text) {
    const box = document.getElementById('vcheckUnifiedVideoProgress');
    if (!box) return;
    box.innerHTML = `<b>Видео: содержательная ИИ-проверка</b><br>${String(text || '')}`;
  }

  async function directApi(body) {
    const response = await nativeFetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const rawText = await response.text();
    let raw = {};
    try { raw = rawText ? JSON.parse(rawText) : {}; } catch (_) {
      throw new Error('speech_extra_bad_response');
    }

    const data = parseEnvelope(raw);
    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || `speech_extra_http_${response.status}`);
    }
    return data;
  }

  function chooseExtraTargets(segments, timeline) {
    const covered = new Set(
      (Array.isArray(timeline) ? timeline : [])
        .filter(item => item?.speechAligned === true)
        .map(item => Number(item?.speechSegmentIndex))
        .filter(Number.isInteger)
    );

    const missing = (Array.isArray(segments) ? segments : [])
      .map((segment, index) => {
        const startSeconds = Number(segment?.startSeconds);
        const endSeconds = Number(segment?.endSeconds);
        if (
          covered.has(index) ||
          !Number.isFinite(startSeconds) ||
          !Number.isFinite(endSeconds) ||
          endSeconds <= startSeconds
        ) return null;
        return {
          segmentIndex: index,
          timeSeconds: Number(((startSeconds + endSeconds) / 2).toFixed(3))
        };
      })
      .filter(Boolean);

    if (missing.length <= EXTRA_MAX_FRAMES) return missing;

    const selected = [];
    const used = new Set();
    for (let i = 0; i < EXTRA_MAX_FRAMES; i++) {
      const position = Math.round(i * (missing.length - 1) / (EXTRA_MAX_FRAMES - 1));
      if (used.has(position)) continue;
      used.add(position);
      selected.push(missing[position]);
    }
    return selected;
  }

  async function buildExtraTimeline(segments, currentTimeline) {
    const source = window.__VCHECK_VIDEO_SOURCE__ || null;
    if (!source) return [];

    const targets = chooseExtraTargets(segments, currentTimeline);
    if (!targets.length) return [];

    const request = {
      action: 'extractVideoFrames',
      timesSeconds: targets.map(item => item.timeSeconds),
      includeBase64: true
    };

    if (source.kind === 'cloudVideo' && source.videoId) {
      request.videoId = source.videoId;
    } else if (source.objectKey) {
      request.objectKey = source.objectKey;
      if (Number.isFinite(Number(source.durationSeconds))) {
        request.durationSeconds = Number(source.durationSeconds);
      }
    } else {
      return [];
    }

    setProgress(`Уточняем речь: ещё ${targets.length} точечных стоп-кадров…`);
    const extracted = await directApi(request);
    const frames = Array.isArray(extracted?.frames) ? extracted.frames : [];
    if (!frames.length) return [];

    const results = new Array(frames.length);
    let next = 0;
    let done = 0;

    async function worker() {
      while (true) {
        const position = next++;
        if (position >= frames.length) return;

        const frame = frames[position] || {};
        const target = targets[position] || {};

        try {
          if (frame.error || !frame.imageBase64) continue;
          const response = await directApi({
            action: 'videoVision',
            imageBase64: frame.imageBase64,
            mimeType: frame.mimeType || 'image/jpeg'
          });
          const analysis = response?.analysis || {};
          results[position] = {
            index: position,
            timeSeconds: Number.isFinite(Number(frame.timeSeconds))
              ? Number(frame.timeSeconds)
              : Number(target.timeSeconds),
            frameType: String(analysis?.frameType || 'unknown'),
            shotType: String(analysis?.shotType || 'unknown'),
            personOnCamera: analysis?.personOnCamera === true,
            journalistLikelySpeakingToCamera: String(analysis?.journalistLikelySpeakingToCamera || 'unknown'),
            nameLowerThirdVisible: analysis?.lowerThirdVisible === true,
            visualDescription: String(analysis?.visualDescription || '').trim().slice(0, 500),
            visualEvidence: Array.isArray(analysis?.evidence)
              ? analysis.evidence.map(value => String(value).trim()).filter(Boolean).slice(0, 5)
              : [],
            speechAligned: true,
            speechSegmentIndex: Number.isInteger(Number(target.segmentIndex))
              ? Number(target.segmentIndex)
              : null
          };
        } catch (error) {
          console.warn('V-CHECK extra speech frame failed:', error);
        } finally {
          done++;
          setProgress(`Уточняем речь: ${done} из ${frames.length}…`);
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, frames.length) }, () => worker())
    );

    return results.filter(Boolean).sort((a, b) => a.timeSeconds - b.timeSeconds);
  }

  window.fetch = async function speechExtraCoverageFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    const method = String(init?.method || input?.method || 'GET').toUpperCase();

    if (url !== API_URL || method !== 'POST' || typeof init?.body !== 'string') {
      return nativeFetch(input, init);
    }

    let body;
    try { body = JSON.parse(init.body); } catch (_) {
      return nativeFetch(input, init);
    }

    if (body?.action !== 'analyzeSpeechRoles') {
      return nativeFetch(input, init);
    }

    const segments = Array.isArray(body?.segments) ? body.segments : [];
    const mediaObservations = body?.mediaObservations || {};
    const timeline = Array.isArray(mediaObservations?.timeline) ? mediaObservations.timeline : [];

    if (segments.length <= 24) {
      return nativeFetch(input, init);
    }

    try {
      const extraTimeline = await buildExtraTimeline(segments, timeline);
      if (extraTimeline.length) {
        const mergedTimeline = [...timeline, ...extraTimeline]
          .filter(item => Number.isFinite(Number(item?.timeSeconds)))
          .sort((a, b) => Number(a.timeSeconds) - Number(b.timeSeconds))
          .slice(0, 80);

        body.mediaObservations = {
          ...mediaObservations,
          timeline: mergedTimeline
        };

        const previousAligned = Array.isArray(window.__VCHECK_SPEECH_ALIGNED_TIMELINE__)
          ? window.__VCHECK_SPEECH_ALIGNED_TIMELINE__
          : [];

        const bySegment = new Map();
        for (const item of [...previousAligned, ...extraTimeline]) {
          const key = Number(item?.speechSegmentIndex);
          if (Number.isInteger(key)) bySegment.set(key, item);
        }
        window.__VCHECK_SPEECH_ALIGNED_TIMELINE__ = [...bySegment.values()]
          .sort((a, b) => Number(a.timeSeconds) - Number(b.timeSeconds));
      }
    } catch (error) {
      console.warn('V-CHECK extra speech coverage skipped:', error);
    }

    return nativeFetch(input, {
      ...init,
      body: JSON.stringify(body)
    });
  };

  console.log('V-CHECK speech extra coverage v1.0 loaded');
})();
