(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const WINDOW_SECONDS = 8;

  if (window.__VCHECK_VIDEO_TIMELINE_V1__) return;
  window.__VCHECK_VIDEO_TIMELINE_V1__ = '1.0';

  const nativeFetch = window.fetch.bind(window);
  let subtitleSegments = [];

  function parseEnvelope(value) {
    if (value && typeof value.body === 'string') {
      try {
        return JSON.parse(value.body);
      } catch (_) {}
    }
    return value || {};
  }

  function normalizeSegments(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map((item, index) => {
        const startSeconds = Number(item?.startSeconds);
        const endSeconds = Number(item?.endSeconds);
        const text = String(item?.text || '').trim();

        if (
          !Number.isFinite(startSeconds) ||
          !Number.isFinite(endSeconds) ||
          endSeconds < startSeconds ||
          !text
        ) {
          return null;
        }

        return {
          index,
          startSeconds,
          endSeconds,
          text
        };
      })
      .filter(Boolean);
  }

  function speechAround(timeSeconds) {
    const time = Number(timeSeconds);
    if (!Number.isFinite(time)) return [];

    const from = time - WINDOW_SECONDS;
    const to = time + WINDOW_SECONDS;

    return subtitleSegments
      .filter(segment =>
        segment.endSeconds >= from &&
        segment.startSeconds <= to
      )
      .slice(0, 10)
      .map(segment => ({
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        text: segment.text,
        activeAtFrame:
          segment.startSeconds <= time &&
          segment.endSeconds >= time
      }));
  }

  function buildTimeline(observations) {
    const frames = Array.isArray(observations?.frames)
      ? observations.frames
      : [];

    return frames
      .map((frame, index) => {
        const time = Number(
          frame?.time ?? frame?.timeSeconds
        );

        if (!Number.isFinite(time)) return null;

        return {
          index,
          timeSeconds: time,
          frameType: frame?.frameType || 'unknown',
          shotType: frame?.shotType || 'unknown',
          personOnCamera: frame?.personOnCamera === true,
          nameLowerThirdVisible:
            frame?.nameLowerThirdVisible === true,
          journalistLikelySpeakingToCamera:
            frame?.journalistLikelySpeakingToCamera || 'unknown',
          visualDescription:
            String(frame?.visualDescription || '').trim(),
          visualEvidence:
            Array.isArray(frame?.evidence)
              ? frame.evidence.slice(0, 4)
              : [],
          nearbySpeech: speechAround(time)
        };
      })
      .filter(Boolean);
  }

  function enrichObservations(observations) {
    const base = {
      ...(observations || {})
    };

    const timeline = buildTimeline(base);

    return {
      ...base,
      transcriptSegmentsCount: subtitleSegments.length,
      timelineWindowSeconds: WINDOW_SECONDS,
      timelineAvailable: timeline.length > 0,
      timeline
    };
  }

  window.fetch = async function(input, init) {
    let action = '';
    let url = '';
    let nextInit = init;

    try {
      url =
        typeof input === 'string'
          ? input
          : String(input?.url || '');

      if (url === API_URL && init?.body) {
        const body = JSON.parse(String(init.body));
        action = String(body?.action || '');

        if (
          action === 'analyzeMaterial' &&
          subtitleSegments.length
        ) {
          body.mediaObservations =
            enrichObservations(body.mediaObservations);

          body.videoObservations =
            enrichObservations(body.videoObservations);

          const timelineNote =
            `Доступна таймкодированная расшифровка: ` +
            `${subtitleSegments.length} речевых сегментов. ` +
            `Для каждого обработанного стоп-кадра приложена речь ` +
            `примерно за ${WINDOW_SECONDS} секунд до и после кадра. ` +
            `Используй эту карту для сопоставления того, что видно ` +
            `и что звучит в тот же момент. Не считай близость по времени ` +
            `доказательством личности говорящего без дополнительных признаков.`;

          body.sourceNote = [
            String(body.sourceNote || '').trim(),
            timelineNote
          ]
            .filter(Boolean)
            .join(' ');

          nextInit = {
            ...init,
            body: JSON.stringify(body)
          };
        }
      }
    } catch (_) {}

    const response = await nativeFetch(input, nextInit);

    if (url === API_URL && action === 'videoSubtitles') {
      try {
        const raw = await response.clone().json();
        const data = parseEnvelope(raw);
        subtitleSegments = normalizeSegments(data?.segments);
        window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__ =
          subtitleSegments;
      } catch (_) {
        subtitleSegments = [];
        window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__ = [];
      }
    }

    if (url === API_URL && action === 'analyzeMaterial') {
      try {
        const source = nextInit?.body
          ? JSON.parse(String(nextInit.body))
          : null;

        const timeline =
          source?.mediaObservations?.timeline || [];

        window.__VCHECK_VIDEO_TIMELINE__ =
          Array.isArray(timeline)
            ? timeline
            : [];
      } catch (_) {}
    }

    return response;
  };

  console.log('V-CHECK video timeline v1 loaded');
})();
