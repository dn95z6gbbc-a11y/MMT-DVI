// V-CHECK: first unified video report (formal + transcript + visual AI).
// Prototype stage: the current test video is linked to its Cloud Video subtitles by file name.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const TEST_VIDEO_IDS = {
    'Стрит тест.mp4': 'vplvturpy67z22dg7om4'
  };
  let running = false;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const html = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function selectedFormat() {
    const el = document.getElementById('format');
    return el ? String(el.value || '') : '';
  }

  function isVideoFormat() {
    const key = selectedFormat();
    try {
      return Boolean(window.FORMATS?.[key]?.type === 'video');
    } catch (_) {
      return ['story_event','story_theme','street','hot','live'].includes(key);
    }
  }

  function currentFile() {
    return document.getElementById('materialFile')?.files?.[0] || null;
  }

  function parseEnvelope(envelope) {
    if (envelope && typeof envelope.body === 'string') {
      try { return JSON.parse(envelope.body); } catch (_) { return envelope; }
    }
    return envelope;
  }

  async function api(payload) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const raw = await response.json();
    const data = parseEnvelope(raw);
    if (!response.ok || data?.ok === false) {
      const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
      error.payload = data;
      throw error;
    }
    return data;
  }

  function vttToText(vtt) {
    const lines = String(vtt || '').replace(/\r/g, '').split('\n');
    const cues = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line === 'WEBVTT' || /^NOTE\b/i.test(line)) continue;
      if (/^\d+$/.test(line)) continue;
      if (/\d{2}:\d{2}(?::\d{2})?[.,]\d{3}\s+-->\s+/.test(line)) continue;
      const clean = line.replace(/<[^>]+>/g, '').trim();
      if (!clean) continue;
      if (cues[cues.length - 1] !== clean) cues.push(clean);
    }
    return cues.join('\n');
  }

  async function waitForFrames(timeoutMs = 35000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const state = window.__VCHECK_VIDEO_FRAMES_STATE__;
      const frames = Array.isArray(window.__VCHECK_VIDEO_FRAMES__) ? window.__VCHECK_VIDEO_FRAMES__ : [];
      if (state && !state.running && frames.length >= 6) return frames;
      if (document.visibilityState === 'hidden') {
        await new Promise(resolve => {
          const fn = () => {
            if (document.visibilityState !== 'hidden') {
              document.removeEventListener('visibilitychange', fn);
              resolve();
            }
          };
          document.addEventListener('visibilitychange', fn);
        });
      }
      await sleep(350);
    }
    throw new Error('Не удалось дождаться стоп-кадров видео.');
  }

  async function ensureVision(timeoutMs = 120000) {
    if (window.VCHECK_VIDEO_VISION?.checked) return window.VCHECK_VIDEO_VISION;

    const startFind = Date.now();
    let button = null;
    while (Date.now() - startFind < 10000) {
      button = document.querySelector('.vcheck-vision-btn');
      if (button) break;
      await sleep(250);
    }
    if (!button) throw new Error('Кнопка визуального ИИ не успела подключиться.');

    if (!button.disabled) button.click();
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.VCHECK_VIDEO_VISION?.checked) return window.VCHECK_VIDEO_VISION;
      await sleep(500);
    }
    throw new Error('Визуальный анализ занимает слишком много времени.');
  }

  function compactVision(vision) {
    const frames = Array.isArray(vision?.frames) ? vision.frames : [];
    return {
      sampling: '8 стоп-кадров по всей длине ролика; отсутствие признака на выборке НЕ доказывает, что его нет во всём видео',
      checkedFrames: vision?.checked || 0,
      failedFrames: vision?.failed || 0,
      counts: vision?.counts || {},
      peopleFrames: vision?.person || 0,
      nameLowerThirdFrames: vision?.lowerThird || 0,
      subtitleOrTextFrames: vision?.subtitles || 0,
      logoFrames: vision?.logo || 0,
      locationTextFrames: vision?.locationText || 0,
      frames: frames.filter(x => x?.analysis).map(x => ({
        time: x.time,
        frameType: x.analysis.frameType,
        frameTypeConfidence: x.analysis.frameTypeConfidence,
        personOnCamera: Boolean(x.analysis.personOnCamera),
        nameLowerThirdVisible: Boolean(x.analysis.lowerThirdVisible),
        subtitlesVisible: Boolean(x.analysis.subtitlesVisible),
        logoVisible: Boolean(x.analysis.logoVisible),
        locationTextVisible: Boolean(x.analysis.locationTextVisible),
        shotType: x.analysis.shotType || 'unknown',
        journalistLikelySpeakingToCamera: x.analysis.journalistLikelySpeakingToCamera || 'unknown',
        visualDescription: x.analysis.visualDescription || '',
        evidence: Array.isArray(x.analysis.evidence) ? x.analysis.evidence.slice(0, 4) : [],
        uncertain: Array.isArray(x.analysis.uncertain) ? x.analysis.uncertain.slice(0, 3) : []
      }))
    };
  }

  function ensureProgressBox() {
    let box = document.getElementById('vcheckUnifiedVideoProgress');
    if (box) return box;
    const report = document.getElementById('report');
    if (!report) return null;
    box = document.createElement('div');
    box.id = 'vcheckUnifiedVideoProgress';
    box.style.cssText = 'margin:12px 0;padding:13px 15px;border:1px solid #dbe3ee;border-radius:14px;background:#f8fafc;color:#334155;font-size:13px';
    const pdfArea = document.getElementById('pdfArea');
    if (pdfArea) pdfArea.appendChild(box);
    else report.prepend(box);
    return box;
  }

  function setProgress(text, tone = 'normal') {
    const box = ensureProgressBox();
    if (!box) return;
    const tones = {
      normal: ['#f8fafc','#dbe3ee','#334155'],
      ok: ['#f0fdf4','#bbf7d0','#166534'],
      bad: ['#fff1f2','#fecdd3','#9f1239']
    };
    const [bg,border,color] = tones[tone] || tones.normal;
    box.style.background = bg;
    box.style.borderColor = border;
    box.style.color = color;
    box.innerHTML = `<b>Видео: содержательная ИИ-проверка</b><br>${html(text)}`;
  }

  function statusLabel(status) {
    return ({ok:'Соблюдено',problem:'Проблема',warning:'Нужно внимание',unknown:'Не удалось определить'})[status] || status || 'Проверка';
  }

  function statusClass(status) {
    if (status === 'ok') return 'vcheck-ai-ok';
    if (status === 'problem') return 'vcheck-ai-problem';
    if (status === 'warning') return 'vcheck-ai-warning';
    return 'vcheck-ai-unknown';
  }

  function ensureReportStyles() {
    if (document.getElementById('vcheckUnifiedVideoStyles')) return;
    const style = document.createElement('style');
    style.id = 'vcheckUnifiedVideoStyles';
    style.textContent = `
      #vcheckUnifiedVideoReport{margin-top:12px;border:1px solid #fed7aa;background:#fffaf5;border-radius:17px;padding:18px;color:#334155}
      #vcheckUnifiedVideoReport h3{margin:0 0 4px;color:#111827;font-size:20px}
      #vcheckUnifiedVideoReport .vr-sub{color:#64748b;font-size:13px;margin-bottom:14px}
      #vcheckUnifiedVideoReport .vr-overall{border:1px solid #fed7aa;background:#fff;border-radius:13px;padding:13px;margin-bottom:12px}
      #vcheckUnifiedVideoReport .vr-check{display:grid;grid-template-columns:minmax(145px,.55fr) 1.45fr;gap:14px;border-top:1px solid #f1e5da;padding:12px 0}
      #vcheckUnifiedVideoReport .vr-check:first-of-type{border-top:0}
      #vcheckUnifiedVideoReport .vr-title{font-weight:850;color:#1f2937}
      #vcheckUnifiedVideoReport .vr-pill{display:inline-block;margin-top:5px;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:850}
      #vcheckUnifiedVideoReport .vcheck-ai-ok{background:#dcfce7;color:#166534}
      #vcheckUnifiedVideoReport .vcheck-ai-problem{background:#ffe4e6;color:#9f1239}
      #vcheckUnifiedVideoReport .vcheck-ai-warning{background:#fef3c7;color:#92400e}
      #vcheckUnifiedVideoReport .vcheck-ai-unknown{background:#e2e8f0;color:#475569}
      #vcheckUnifiedVideoReport .vr-finding{font-weight:700;color:#334155}
      #vcheckUnifiedVideoReport .vr-evidence{font-size:12px;color:#64748b;margin-top:5px}
      #vcheckUnifiedVideoReport .vr-action{font-size:13px;color:#9a3412;margin-top:5px}
      #vcheckUnifiedVideoReport .vr-block{margin-top:12px;border:1px solid #f1e5da;background:#fff;border-radius:13px;padding:13px}
      #vcheckUnifiedVideoReport .vr-block h4{margin:0 0 7px;color:#9a3412}
      #vcheckUnifiedVideoReport ul,#vcheckUnifiedVideoReport ol{margin:6px 0;padding-left:20px}
      @media(max-width:680px){#vcheckUnifiedVideoReport .vr-check{grid-template-columns:1fr;gap:6px}}
    `;
    document.head.appendChild(style);
  }

  function renderAiReport(payload, transcript, vision) {
    ensureReportStyles();
    const analysis = payload?.analysis || {};
    const pdfArea = document.getElementById('pdfArea');
    const final = document.getElementById('final');
    if (!pdfArea) return;

    let root = document.getElementById('vcheckUnifiedVideoReport');
    if (!root) {
      root = document.createElement('section');
      root.id = 'vcheckUnifiedVideoReport';
      if (final) pdfArea.insertBefore(root, final);
      else pdfArea.appendChild(root);
    }

    const checks = Array.isArray(analysis.checks) ? analysis.checks : [];
    const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
    const fixes = Array.isArray(analysis.priorityFixes) ? analysis.priorityFixes : [];
    const teacher = Array.isArray(analysis.teacherReview) ? analysis.teacherReview : [];

    root.innerHTML = `
      <h3>Глубокий ИИ-анализ видео</h3>
      <div class="vr-sub">Расшифровка Cloud Video + ${Number(vision?.checked || 0)} визуальных стоп-кадров Qwen · ИИ не заменяет преподавателя.</div>
      <div class="vr-overall"><b>Общий вывод</b><br>${html(analysis?.overall?.summary || 'ИИ-анализ выполнен.')}</div>
      ${checks.map(item => `
        <div class="vr-check">
          <div><div class="vr-title">${html(item.title || item.id || 'Проверка')}</div><span class="vr-pill ${statusClass(item.status)}">${html(statusLabel(item.status))}</span></div>
          <div>
            <div class="vr-finding">${html(item.finding || '')}</div>
            ${Array.isArray(item.evidence) && item.evidence.length ? `<div class="vr-evidence"><b>Основание:</b> ${item.evidence.slice(0,3).map(html).join(' · ')}</div>` : ''}
            ${item.recommendation ? `<div class="vr-action"><b>Что сделать:</b> ${html(item.recommendation)}</div>` : ''}
          </div>
        </div>`).join('')}
      ${strengths.length ? `<div class="vr-block"><h4>Сильные стороны</h4><ul>${strengths.map(x => `<li>${html(x)}</li>`).join('')}</ul></div>` : ''}
      ${fixes.length ? `<div class="vr-block"><h4>Что исправить в первую очередь</h4><ol>${fixes.map(x => `<li><b>${html(x.problem || '')}</b>${x.how ? ` — ${html(x.how)}` : ''}</li>`).join('')}</ol></div>` : ''}
      ${teacher.length ? `<div class="vr-block"><h4>Что должен проверить преподаватель</h4><ul>${teacher.map(x => `<li>${html(x)}</li>`).join('')}</ul></div>` : ''}
      <div class="vr-block"><h4>Рекомендация перед сдачей</h4>${html(analysis.finalRecommendation || 'Сопоставьте замечания ИИ с исходным видео перед сдачей.')}</div>
    `;

    if (final && analysis.finalRecommendation) {
      final.textContent = analysis.finalRecommendation;
    }

    // Add the AI section to copy/share text used by the existing app.
    try {
      const aiText = [
        '', 'ГЛУБОКИЙ ИИ-АНАЛИЗ ВИДЕО',
        analysis?.overall?.summary || '',
        ...checks.map(x => `— ${x.title || x.id}: ${x.finding || ''}`),
        strengths.length ? `\nСИЛЬНЫЕ СТОРОНЫ\n${strengths.map(x => '— ' + x).join('\n')}` : '',
        fixes.length ? `\nИСПРАВИТЬ В ПЕРВУЮ ОЧЕРЕДЬ\n${fixes.map(x => '— ' + (x.problem || '') + (x.how ? ': ' + x.how : '')).join('\n')}` : '',
        teacher.length ? `\nПРОВЕРИТЬ ПРЕПОДАВАТЕЛЮ\n${teacher.map(x => '— ' + x).join('\n')}` : '',
        analysis.finalRecommendation ? `\nРЕКОМЕНДАЦИЯ\n${analysis.finalRecommendation}` : ''
      ].filter(Boolean).join('\n');
      if (typeof reportText !== 'undefined') reportText += `\n${aiText}`;
    } catch (_) {}

    root.scrollIntoView({behavior:'smooth', block:'start'});
  }

  async function getTranscript(file) {
    const videoId = TEST_VIDEO_IDS[file?.name || ''];
    if (!videoId) {
      throw new Error('На этом тестовом этапе автоматическая расшифровка подключена к файлу «Стрит тест.mp4». Следующим шагом подключим автоматическую загрузку любого видео в Cloud Video.');
    }
    const data = await api({action:'videoSubtitles', videoId});
    if (!data?.transcriptReady || !data?.subtitleText) {
      throw new Error('Cloud Video пока не вернул готовую расшифровку этого ролика.');
    }
    return {
      videoId,
      transcript: vttToText(data.subtitleText),
      subtitleRaw: data.subtitleText
    };
  }

  async function runUnifiedVideoReport() {
    if (running || !isVideoFormat()) return;
    const file = currentFile();
    if (!file) return;
    running = true;

    const submit = document.querySelector('#form button[type="submit"]');
    const oldText = submit?.textContent || 'Проверить материал';
    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Проверяем видео…';
    }

    try {
      setProgress('Готовим визуальные данные…');
      await waitForFrames();

      setProgress('Проверяем 8 стоп-кадров через Qwen…');
      const vision = await ensureVision();

      setProgress('Получаем расшифровку речи из Cloud Video…');
      const speech = await getTranscript(file);
      if (!speech.transcript.trim()) throw new Error('Расшифровка оказалась пустой.');

      setProgress('Объединяем речь, визуальные признаки и требования выбранного формата через YandexGPT…');
      const durationSeconds = Number.isFinite(window.material?.duration) ? Math.round(window.material.duration) : null;
      const mediaObservations = compactVision(vision);
      const payload = await api({
        action: 'analyzeMaterial',
        format: selectedFormat(),
        transcript: speech.transcript,
        annotation: document.getElementById('annotation')?.value || '',
        significance: document.getElementById('significance')?.value || '',
        aiElement: document.getElementById('aiElement')?.value || '',
        aiPlace: document.getElementById('aiPlace')?.value || '',
        durationSeconds,
        mediaObservations,
        videoObservations: mediaObservations,
        sourceNote: 'Для смыслового анализа доступна расшифровка речи и выборка из 8 стоп-кадров. Не утверждай отсутствие визуального элемента только потому, что он не попал в выборку. Не делай выводов о качестве звука или динамике монтажа без прямых данных.'
      });

      if (!payload?.ai || !payload?.analysis) throw new Error('YandexGPT не вернул структурированный видеоотчёт.');
      renderAiReport(payload, speech.transcript, vision);
      setProgress('Единый отчёт готов: формальные требования + расшифровка + визуальный ИИ.', 'ok');
    } catch (error) {
      console.error('V-CHECK unified video report failed', error);
      setProgress(error?.message || 'Не удалось выполнить содержательную проверку видео.', 'bad');
    } finally {
      running = false;
      if (submit) {
        submit.disabled = false;
        submit.textContent = oldText;
      }
    }
  }

  // The original app listener still builds the formal report first.
  // This later listener enriches the same report with the unified AI section.
  function bind() {
    const form = document.getElementById('form');
    if (!form || form.dataset.vcheckUnifiedVideo === '1') return;
    form.dataset.vcheckUnifiedVideo = '1';
    form.addEventListener('submit', () => {
      if (!isVideoFormat()) return;
      setTimeout(runUnifiedVideoReport, 50);
    });
    form.addEventListener('reset', () => {
      const root = document.getElementById('vcheckUnifiedVideoReport');
      if (root) root.remove();
      const progress = document.getElementById('vcheckUnifiedVideoProgress');
      if (progress) progress.remove();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();
