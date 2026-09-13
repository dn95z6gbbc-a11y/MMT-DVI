// V-CHECK speech-role bridge v1: enrich story analysis with standup/sync/voiceover episodes.
(() => {
  if (window.__VCHECK_SPEECH_ROLES_V1__) return;
  window.__VCHECK_SPEECH_ROLES_V1__ = '1.1';

  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS = new Set(['story_event', 'story_theme']);
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

    let raw = {};
    try {
      raw = await response.json();
    } catch (_) {
      throw new Error('speech_roles_bad_response');
    }

    const data = parseEnvelope(raw);
    if (!response.ok || data?.ok === false || !data?.analysis) {
      throw new Error(data?.error || `speech_roles_http_${response.status}`);
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

    const observations = body.mediaObservations || body.videoObservations || {};

    try {
      setProgress('Определяем, где стендап, синхроны и закадровый текст…');

      const roles = await analyzeSpeechRoles(segments, observations);

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
        speechRoleUncertain: Array.isArray(roles?.uncertain) ? roles.uncertain : []
      };

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
      setProgress('Роли речи определены. Собираем итоговый анализ сюжета…');
    } catch (error) {
      console.warn('V-CHECK speech-role analysis failed:', error);
      body.sourceNote = `${String(body.sourceNote || '').trim()} Анализ ролей речи не завершён; не делай уверенных выводов о числе синхронов или объёме закадрового текста без других прямых данных.`.trim();
    }

    return nativeFetch(input, {
      ...init,
      body: JSON.stringify(body)
    });
  };
})();
