(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const WINDOW_SECONDS = 5;
  const MAX_SPEECH_PER_FRAME = 3;

  if (window.__VCHECK_VIDEO_TIMELINE_V1__) return;
  window.__VCHECK_VIDEO_TIMELINE_V1__ = '1.1';

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

  function distanceToSegment(segment, time) {
    if (segment.startSeconds <= time && segment.endSeconds >= time) {
      return 0;
    }

    return Math.min(
      Math.abs(segment.startSeconds - time),
      Math.abs(segment.endSeconds - time)
    );
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
      .sort(
        (a, b) =>
          distanceToSegment(a, time) -
          distanceToSegment(b, time)
      )
      .slice(0, MAX_SPEECH_PER_FRAME)
      .map(segment => ({
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        text: segment.text.slice(0, 220),
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
            String(frame?.visualDescription || '')
              .trim()
              .slice(0, 260),
          nearbySpeech: speechAround(time)
        };
      })
      .filter(Boolean);
  }

  function compactFrame(frame) {
    if (!frame || typeof frame !== 'object') return frame;

    return {
      time: frame.time ?? frame.timeSeconds ?? null,
      frameType: frame.frameType || 'unknown',
      personOnCamera: frame.personOnCamera === true,
      nameLowerThirdVisible:
        frame.nameLowerThirdVisible === true,
      subtitlesVisible: frame.subtitlesVisible === true,
      logoVisible: frame.logoVisible === true,
      locationTextVisible: frame.locationTextVisible === true,
      shotType: frame.shotType || 'unknown',
      journalistLikelySpeakingToCamera:
        frame.journalistLikelySpeakingToCamera || 'unknown',
      visualDescription:
        String(frame.visualDescription || '')
          .trim()
          .slice(0, 260),
      evidence:
        Array.isArray(frame.evidence)
          ? frame.evidence
              .slice(0, 2)
              .map(item => String(item || '').slice(0, 180))
          : []
    };
  }

  function enrichObservations(observations) {
    const originalFrames =
      Array.isArray(observations?.frames)
        ? observations.frames
        : [];

    const base = {
      ...(observations || {}),
      frames: originalFrames.map(compactFrame)
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
            `Для каждого стоп-кадра приложены до ${MAX_SPEECH_PER_FRAME} ближайших ` +
            `реплик в окне примерно ±${WINDOW_SECONDS} секунд. ` +
            `Используй карту для сопоставления изображения и речи. ` +
            `Не считай близость по времени доказательством личности ` +
            `говорящего без дополнительных признаков.`;

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

  console.log('V-CHECK video timeline v1.1 loaded');
})();