// V-CHECK speech-role bridge v1: enrich story analysis with standup/sync/voiceover episodes.
(() => {
  if (window.__VCHECK_SPEECH_ROLES_V1__) return;
  window.__VCHECK_SPEECH_ROLES_V1__ = '1.4';

  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS = new Set(['story_event', 'story_theme']);
  const SPEECH_ALIGNED_MAX_FRAMES = 24;
  const SPEECH_ALIGNED_CONCURRENCY = 2;
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
    try {
      raw = rawText ? JSON.parse(rawText) : {};
    } catch (_) {
      const error = new Error('speech_aligned_bad_response');
      error.status = response.status;
      error.payload = { raw: rawText.slice(0, 1200) };
      throw error;
    }

    const data = parseEnvelope(raw);
    if (!response.ok || data?.ok === false) {
      const error = new Error(data?.error || `speech_aligned_http_${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  }

  function clearDiagnostic() {
    window.__VCHECK_SPEECH_ROLE_ERROR__ = null;
    document.getElementById('vcheckSpeechRoleDiagnostic')?.remove();
  }

  function mountDiagnosticWhenReady(code, status, segmentsCount, attempt = 0) {
    if (!window.__VCHECK_SPEECH_ROLE_ERROR__) return;
    if (document.getElementById('vcheckSpeechRoleDiagnostic')) return;

    const root = document.getElementById('vcheckUnifiedVideoReport');
    if (!root) {
      if (attempt < 60) {
        setTimeout(() => mountDiagnosticWhenReady(code, status, segmentsCount, attempt + 1), 500);
      }
      return;
    }

    const box = document.createElement('div');
    box.id = 'vcheckSpeechRoleDiagnostic';
    box.style.cssText = 'margin-top:12px;border:1px solid #fecaca;background:#fff1f2;color:#991b1b;border-radius:12px;padding:11px 13px;font-size:12px;line-height:1.45';
    box.innerHTML = `<b>Техническая диагностика V-CHECK</b><br>Модуль ролей речи: <code>${code}</code>${status ? ` · HTTP ${status}` : ''} · сегментов расшифровки: ${segmentsCount}.`;
    root.appendChild(box);
  }

  function showDiagnostic(error, segments) {
    const code = String(error?.message || 'speech_roles_unknown_error');
    const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : null;
    const payload = error?.payload || null;
    const segmentsCount = Array.isArray(segments) ? segments.length : 0;

    window.__VCHECK_SPEECH_ROLE_ERROR__ = {
      code,
      status,
      segmentsCount,
      payload,
      at: new Date().toISOString()
    };

    console.warn('V-CHECK speech-role diagnostic:', window.__VCHECK_SPEECH_ROLE_ERROR__);
    setProgress(`Модуль ролей речи не завершился: ${code}. Основной отчёт продолжаем собирать.`);
    mountDiagnosticWhenReady(code, status, segmentsCount);
  }

  function selectSpeechTargets(segments) {
    const valid = (Array.isArray(segments) ? segments : [])
      .map((segment, index) => {
        const startSeconds = Number(segment?.startSeconds);
        const endSeconds = Number(segment?.endSeconds);
        if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || endSeconds <= startSeconds) return null;
        return {
          segmentIndex: index,
          timeSeconds: Number(((startSeconds + endSeconds) / 2).toFixed(3))
        };
      })
      .filter(Boolean);

    if (valid.length <= SPEECH_ALIGNED_MAX_FRAMES) return valid;

    const selected = [];
    const used = new Set();
    for (let i = 0; i < SPEECH_ALIGNED_MAX_FRAMES; i++) {
      const position = Math.round(i * (valid.length - 1) / (SPEECH_ALIGNED_MAX_FRAMES - 1));
      if (used.has(position)) continue;
      used.add(position);
      selected.push(valid[position]);
    }
    return selected;
  }

  async function analyzeSpeechAlignedFrames(segments) {
    const source = window.__VCHECK_VIDEO_SOURCE__ || null;
    if (!source) return [];

    const targets = selectSpeechTargets(segments);
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

    setProgress(`Сопоставляем речь с кадрами: готовим ${targets.length} точечных стоп-кадров…`);
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
          if (frame.error || !frame.imageBase64) {
            throw new Error(frame.error || 'speech_aligned_frame_missing');
          }

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
            speechSegmentIndex: Number.isInteger(Number(target.segmentIndex)) ? Number(target.segmentIndex) : null
          };
        } catch (error) {
          console.warn('V-CHECK speech-aligned frame failed:', error);
        } finally {
          done++;
          setProgress(`Сопоставляем речь с кадрами: ${done} из ${frames.length}…`);
        }
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(SPEECH_ALIGNED_CONCURRENCY, frames.length) },
        () => worker()
      )
    );

    const timeline = results
      .filter(Boolean)
      .sort((a, b) => a.timeSeconds - b.timeSeconds);

    window.__VCHECK_SPEECH_ALIGNED_TIMELINE__ = timeline;
    return timeline;
  }

  async function analyzeSpeechRoles(segments, mediaObservations) {
    const response = await nativeFetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyzeSpeechRoles',
        segments,
        mediaObservations
      }),
      cache: 'no-store'
    });

    const rawText = await response.text();
    let raw = {};
    try {
      raw = rawText ? JSON.parse(rawText) : {};
    } catch (_) {
      const error = new Error('speech_roles_bad_response');
      error.status = response.status;
      error.payload = { raw: rawText.slice(0, 1200) };
      throw error;
    }

    const data = parseEnvelope(raw);
    if (!response.ok || data?.ok === false || !data?.analysis) {
      const error = new Error(data?.error || `speech_roles_http_${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data.analysis;
  }

  window.fetch = async function patchedSpeechRoleFetch(input, init = {}) {
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

    if (
      body?.action !== 'analyzeMaterial' ||
      !STORY_FORMATS.has(String(body?.format || ''))
    ) {
      return nativeFetch(input, init);
    }

    const segments = Array.isArray(window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__)
      ? window.__VCHECK_VIDEO_SUBTITLE_SEGMENTS__
      : [];

    if (!segments.length) {
      return nativeFetch(input, init);
    }

    clearDiagnostic();
    const observations = body.mediaObservations || body.videoObservations || {};

    try {
      let roleObservations = observations;

      try {
        const alignedTimeline = await analyzeSpeechAlignedFrames(segments);
        if (alignedTimeline.length) {
          const existingTimeline = Array.isArray(observations?.timeline)
            ? observations.timeline
            : [];

          roleObservations = {
            ...observations,
            timeline: [...existingTimeline, ...alignedTimeline]
              .filter(item => Number.isFinite(Number(item?.timeSeconds)))
              .sort((a, b) => Number(a.timeSeconds) - Number(b.timeSeconds))
              .slice(0, 80)
          };
        }
      } catch (error) {
        console.warn('V-CHECK speech-aligned analysis skipped:', error);
      }

      setProgress('Определяем, где стендап, синхроны и закадровый текст…');
      const roles = await analyzeSpeechRoles(segments, roleObservations);

      const speechEvidence = {
        speechRolesAvailable: true,
        speechRoleAnalysis: roles,
        speechEpisodes: Array.isArray(roles?.speechEpisodes) ? roles.speechEpisodes : [],
        standupEpisodeCount: Number(roles?.standupCount || 0),
        confirmedSyncCount: Number(roles?.syncCount || 0),
        confirmedDifferentSyncSpeakers: Number(roles?.confirmedDifferentSyncSpeakers || 0),
        syncSpeakerGroups: Array.isArray(roles?.syncSpeakerGroups) ? roles.syncSpeakerGroups : [],
        voiceoverWordCount: Number(roles?.voiceoverWordCount || 0),
        voiceoverText: String(roles?.voiceoverText || ''),
        classifiedSpeechSegments: Number(roles?.classifiedSegments || 0),
        totalSpeechSegments: Number(roles?.totalSegments || segments.length),
        speechRoleUncertain: Array.isArray(roles?.uncertain) ? roles.uncertain : [],
        speechAlignedFrames: Array.isArray(window.__VCHECK_SPEECH_ALIGNED_TIMELINE__)
          ? window.__VCHECK_SPEECH_ALIGNED_TIMELINE__.length
          : 0
      };

      // В итоговый analyzeMaterial не прокидываем расширенную timeline,
      // чтобы снова не раздувать контекст YandexGPT. Точечные кадры нужны
      // только модулю определения ролей речи.
      const enriched = {
        ...observations,
        ...speechEvidence
      };

      body.mediaObservations = enriched;
      body.videoObservations = enriched;
      body.audioObservations = {
        ...(body.audioObservations || {}),
        ...speechEvidence
      };

      body.sourceNote = `${String(body.sourceNote || '').trim()} Доступна отдельная структурированная карта ролей речи с таймкодами. Для требований к стендапу, количеству синхронов, числу разных спикеров и объёму закадрового текста используй поля speechRoleAnalysis, standupEpisodeCount, confirmedSyncCount, confirmedDifferentSyncSpeakers и voiceoverWordCount. speechEpisodes можно использовать для оценки порядка речевых эпизодов. Не подменяй синхроны вопросами журналиста и не считай неопределённые эпизоды подтверждёнными.`.trim();

      window.__VCHECK_SPEECH_ROLE_ANALYSIS__ = roles;
      window.__VCHECK_SPEECH_ROLE_ERROR__ = null;
      setProgress('Роли речи определены. Собираем итоговый анализ сюжета…');
    } catch (error) {
      showDiagnostic(error, segments);
      body.sourceNote = `${String(body.sourceNote || '').trim()} Анализ ролей речи не завершён; не делай уверенных выводов о числе синхронов или объёме закадрового текста без других прямых данных.`.trim();
    }

    return nativeFetch(input, {
      ...init,
      body: JSON.stringify(body)
    });
  };
})();
