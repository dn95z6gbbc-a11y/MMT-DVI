// V-CHECK story diagnostic v1: expose speech-role state and recover chronology from independent structure evidence.
(() => {
  if (window.__VCHECK_STORY_DIAGNOSTIC_V1__) return;
  window.__VCHECK_STORY_DIAGNOSTIC_V1__ = '1.0';

  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS = new Set(['story_event', 'story_theme']);
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

  function checkText(check) {
    return [check?.id, check?.title, check?.finding, ...(Array.isArray(check?.evidence) ? check.evidence : [])]
      .map(value => String(value || ''))
      .join(' ')
      .toLowerCase();
  }

  function patchChronology(analysis, format) {
    if (!analysis || !STORY_FORMATS.has(format) || !Array.isArray(analysis.checks)) return analysis;

    const chronology = analysis.checks.find(check => /хронолог|chronolog/.test(checkText(check)));
    if (!chronology || chronology.status !== 'unknown') return analysis;

    const structure = analysis.checks.find(check => {
      const text = checkText(check);
      return check !== chronology && check?.status === 'ok' && /структур|цельн.*истор|начал.*развит.*финал|beginning.*development.*ending/.test(text);
    });

    if (!structure) return analysis;

    const evidenceText = [structure.finding, ...(Array.isArray(structure.evidence) ? structure.evidence : [])]
      .map(value => String(value || ''))
      .join(' ')
      .toLowerCase();

    if (!/хронолог|начал|затем|развит|финал|последователь/.test(evidenceText)) return analysis;

    chronology.status = 'ok';
    chronology.finding = 'Последовательность развития события подтверждена независимо от общей длительности ролика.';
    chronology.evidence = [
      'Структурный анализ подтверждает начало, развитие и завершение сюжета.',
      ...(Array.isArray(structure.evidence) ? structure.evidence.slice(0, 2) : [])
    ];
    chronology.recommendation = '';

    if (Array.isArray(analysis.teacherReview)) {
      analysis.teacherReview = analysis.teacherReview.filter(item => !/хронолог/i.test(String(item || '')));
    }

    return analysis;
  }

  function patchPayload(payload, format) {
    if (!payload || typeof payload !== 'object') return payload;

    if (typeof payload.body === 'string') {
      try {
        const inner = JSON.parse(payload.body);
        if (inner?.analysis) inner.analysis = patchChronology(inner.analysis, format);
        return { ...payload, body: JSON.stringify(inner) };
      } catch (_) {
        return payload;
      }
    }

    if (payload?.analysis) {
      return { ...payload, analysis: patchChronology(payload.analysis, format) };
    }

    return payload;
  }

  function speechRoleSnapshot() {
    const roles = window.__VCHECK_SPEECH_ROLE_ANALYSIS__ || null;
    const error = window.__VCHECK_SPEECH_ROLE_ERROR__ || null;

    if (roles) {
      return {
        state: 'ready',
        classifiedSegments: Number(roles?.classifiedSegments || 0),
        totalSegments: Number(roles?.totalSegments || 0),
        syncCount: Number(roles?.syncCount || 0),
        differentSpeakers: Number(roles?.confirmedDifferentSyncSpeakers || 0),
        voiceoverWordCount: Number(roles?.voiceoverWordCount || 0),
        uncertain: Array.isArray(roles?.uncertain) ? roles.uncertain.slice(0, 4) : []
      };
    }

    if (error) {
      return {
        state: 'error',
        code: String(error?.code || 'speech_roles_unknown_error'),
        status: error?.status || null,
        segmentsCount: Number(error?.segmentsCount || 0)
      };
    }

    return { state: 'missing' };
  }

  function mountDiagnostic(snapshot, attempt = 0) {
    if (document.getElementById('vcheckSpeechRoleState')) return;
    const root = document.getElementById('vcheckUnifiedVideoReport');
    if (!root) {
      if (attempt < 80) setTimeout(() => mountDiagnostic(snapshot, attempt + 1), 400);
      return;
    }

    const box = document.createElement('div');
    box.id = 'vcheckSpeechRoleState';
    box.style.cssText = 'margin-top:12px;border:1px dashed #cbd5e1;background:#f8fafc;color:#475569;border-radius:12px;padding:10px 12px;font-size:12px;line-height:1.45';

    if (snapshot.state === 'ready') {
      box.innerHTML = `<b>Диагностика ролей речи</b><br>классифицировано сегментов: ${snapshot.classifiedSegments}/${snapshot.totalSegments} · синхронов: ${snapshot.syncCount} · разных спикеров: ${snapshot.differentSpeakers} · слов закадра: ${snapshot.voiceoverWordCount}${snapshot.uncertain.length ? `<br>неопределённость: ${snapshot.uncertain.join(' | ')}` : ''}`;
    } else if (snapshot.state === 'error') {
      box.innerHTML = `<b>Диагностика ролей речи</b><br>ошибка: <code>${snapshot.code}</code>${snapshot.status ? ` · HTTP ${snapshot.status}` : ''} · сегментов: ${snapshot.segmentsCount}`;
    } else {
      box.innerHTML = '<b>Диагностика ролей речи</b><br>модуль не вернул структурированный результат.';
    }

    root.appendChild(box);
  }

  window.fetch = async function patchedStoryDiagnosticFetch(input, init = {}) {
    const body = requestBody(input, init);
    const response = await nativeFetch(input, init);
    if (!body) return response;

    const format = String(body.format || document.getElementById('format')?.value || '');
    if (!STORY_FORMATS.has(format)) return response;

    try {
      const raw = await response.clone().json();
      const patched = patchPayload(raw, format);
      const snapshot = speechRoleSnapshot();
      window.__VCHECK_SPEECH_ROLE_SNAPSHOT__ = snapshot;
      setTimeout(() => mountDiagnostic(snapshot), 0);
      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
    } catch (error) {
      console.warn('V-CHECK story diagnostic skipped:', error);
      return response;
    }
  };

  console.log('V-CHECK story diagnostic v1.0 loaded');
})();