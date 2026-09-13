// V-CHECK non-video engine v1: restores deep AI analysis for text formats and podcasts.
(() => {
  if (window.__VCHECK_NONVIDEO_ENGINE_V1__) return;
  window.__VCHECK_NONVIDEO_ENGINE_V1__ = '1.0';

  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const TEXT_FORMATS = new Set(['article','report_event','report_theme','interview','profile','factcheck']);
  const MAX_FILE_BYTES = 100 * 1024 * 1024;
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let running = false;
  let mammothPromise = null;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function clean(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function parseEnvelope(value) {
    if (value && typeof value.body === 'string') {
      try { return JSON.parse(value.body); } catch (_) {}
    }
    return value || {};
  }

  async function api(payload) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload),
      cache: 'no-store'
    });
    let raw = {};
    try { raw = await response.json(); }
    catch (_) { throw new Error('Сервер вернул непонятный ответ. Попробуйте ещё раз.'); }
    const data = parseEnvelope(raw);
    if (!response.ok || data?.ok === false) {
      const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
      error.payload = data;
      throw error;
    }
    return data;
  }

  function ensureUi() {
    if (!document.getElementById('vcheckNonvideoStyle')) {
      const style = document.createElement('style');
      style.id = 'vcheckNonvideoStyle';
      style.textContent = `
        #nonvideoStatus{display:none;margin:18px 0 0;border-radius:18px;padding:15px 17px;font-size:13px;line-height:1.5}
        #nonvideoStatus.info{display:block;background:rgba(237,121,70,.12);border:1px solid rgba(237,121,70,.28);color:#ffd5c3}
        #nonvideoStatus.ok{display:block;background:rgba(49,196,141,.10);border:1px solid rgba(49,196,141,.24);color:#b9f4dc}
        #nonvideoStatus.error{display:block;background:rgba(255,107,129,.10);border:1px solid rgba(255,107,129,.25);color:#ffc1cb}
        #nonvideoStatus b{color:inherit;font-weight:850}
        #nonvideoAiResult{margin:22px 0 0;border:1px solid rgba(12,12,12,.09);background:#fffdf9;border-radius:22px;padding:22px;color:#171a1f;box-shadow:0 18px 42px rgba(12,12,12,.07)}
        #nonvideoAiResult h3{margin:0;font-size:24px;letter-spacing:-.035em;color:#111318}
        #nonvideoAiResult .nv-note{margin:5px 0 18px;color:#737b85;font-size:13px}
        #nonvideoAiResult .nv-overall{padding:16px 17px;border-radius:17px;background:#f5efe8;border:1px solid rgba(237,121,70,.20);margin-bottom:8px;line-height:1.55}
        #nonvideoAiResult .nv-overall b{display:block;margin-bottom:5px}
        #nonvideoAiResult .nv-check{display:grid;grid-template-columns:minmax(190px,.8fr) 2fr;gap:18px;padding:17px 0;border-top:1px solid #ece6df}
        #nonvideoAiResult .nv-left{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}
        #nonvideoAiResult .nv-title{font-weight:850;color:#14171c}
        #nonvideoAiResult .nv-status{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:850;white-space:nowrap}
        #nonvideoAiResult .nv-status.ok{background:#dff7ec;color:#116245}
        #nonvideoAiResult .nv-status.warning{background:#fff0c9;color:#875400}
        #nonvideoAiResult .nv-status.problem{background:#ffe2e7;color:#951b35}
        #nonvideoAiResult .nv-status.unknown{background:#e8edf2;color:#53606f}
        #nonvideoAiResult .nv-finding{font-weight:650;color:#303640;line-height:1.5}
        #nonvideoAiResult .nv-evidence,#nonvideoAiResult .nv-rec{margin-top:7px;color:#68717d;font-size:13px;line-height:1.5}
        #nonvideoAiResult .nv-rec{color:#a34724}
        #nonvideoAiResult .nv-panel{margin-top:15px;padding:15px 17px;border-radius:17px;background:#f7f3ed;border:1px solid #e9e0d7}
        #nonvideoAiResult .nv-panel h4{margin:0 0 8px;color:#5d2b17}
        #nonvideoAiResult .nv-panel ul,#nonvideoAiResult .nv-panel ol{margin:0;padding-left:20px}
        #nonvideoAiResult .nv-panel li{margin:6px 0;line-height:1.45}
        #nonvideoAiResult .nv-final{margin-top:15px;padding:16px 17px;border-radius:17px;background:#11151b;color:#fff;line-height:1.5}
        @media(max-width:680px){#nonvideoAiResult{padding:18px}#nonvideoAiResult .nv-check{grid-template-columns:1fr;gap:7px}}
      `;
      document.head.appendChild(style);
    }

    let status = document.getElementById('nonvideoStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'nonvideoStatus';
      const materialBox = $('materialBox');
      if (materialBox) materialBox.insertAdjacentElement('afterend', status);
    }
    return status;
  }

  function setStatus(kind, html) {
    const status = ensureUi();
    status.className = kind || '';
    status.innerHTML = html || '';
  }

  function formatKey() {
    return String($('format')?.value || '');
  }

  function nonvideoKind() {
    const key = formatKey();
    if (TEXT_FORMATS.has(key)) return 'text';
    if (key === 'podcast') return 'audio';
    return '';
  }

  function currentFile() {
    return $('materialFile')?.files?.[0] || null;
  }

  function formatTitle() {
    const key = formatKey();
    try {
      if (typeof FORMATS !== 'undefined' && FORMATS?.[key]?.label) return FORMATS[key].label;
    } catch (_) {}
    return key === 'podcast' ? 'Подкаст' : 'Текстовый материал';
  }

  function aiLabel(status) {
    return status === 'ok' ? 'Соблюдено' : status === 'warning' ? 'Нужно внимание' : status === 'problem' ? 'Проблема' : 'Не удалось определить';
  }

  function normalizeStatus(value) {
    const status = String(value || 'unknown').toLowerCase();
    return ['ok','warning','problem','unknown'].includes(status) ? status : 'unknown';
  }

  function checksOf(analysis) {
    if (Array.isArray(analysis?.checks)) return analysis.checks;
    if (!analysis || typeof analysis !== 'object') return [];
    const skip = new Set(['overall','strengths','priorityFixes','teacherReview','finalRecommendation','editorialRisks','summary']);
    return Object.entries(analysis)
      .filter(([key,value]) => !skip.has(key) && value && typeof value === 'object' && !Array.isArray(value))
      .map(([key,value]) => ({title:value.title || key, ...value}));
  }

  function teacherItems(analysis) {
    const items = [];
    const seen = new Set();
    const add = value => {
      const text = clean(value);
      if (!text) return;
      const key = text.toLowerCase().replace(/^проверить вручную:\s*/,'').replace(/[«»"'.,:;!?()]/g,'').replace(/\s+/g,' ').trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      items.push(text);
    };
    for (const check of checksOf(analysis)) {
      if (normalizeStatus(check?.status) === 'unknown') add(`Проверить вручную: ${clean(check?.title || 'пункт')}`);
    }
    if (Array.isArray(analysis?.teacherReview)) analysis.teacherReview.forEach(add);
    return items;
  }

  function panel(box, title, items, ordered = false) {
    if (!Array.isArray(items) || !items.length) return;
    const el = document.createElement('div');
    el.className = 'nv-panel';
    const tag = ordered ? 'ol' : 'ul';
    el.innerHTML = `<h4>${esc(title)}</h4><${tag}>${items.map(item => {
      const text = typeof item === 'string' ? item : (item?.problem || item?.how || item?.why || item?.title || '');
      return `<li>${esc(clean(text))}</li>`;
    }).join('')}</${tag}>`;
    box.appendChild(el);
  }

  function renderAnalysis(analysis, kind) {
    const report = $('report');
    if (!report || !analysis) return;
    report.style.display = 'block';
    $('neutral') && ($('neutral').style.display = 'none');
    document.getElementById('nonvideoAiResult')?.remove();

    const box = document.createElement('div');
    box.id = 'nonvideoAiResult';
    const subtitle = kind === 'audio'
      ? 'SpeechKit + YandexGPT · ИИ не заменяет преподавателя.'
      : 'YandexGPT · разбор по инструктажу выбранного формата · ИИ не заменяет преподавателя.';
    box.innerHTML = `<h3>Глубокий ИИ-анализ</h3><p class="nv-note">${esc(formatTitle())} · ${esc(subtitle)}</p>`;

    const overall = analysis?.overall;
    const overallText = clean(overall?.summary || overall?.finding || overall?.comment || '');
    if (overallText) {
      const el = document.createElement('div');
      el.className = 'nv-overall';
      el.innerHTML = `<b>Общий вывод</b>${esc(overallText)}`;
      box.appendChild(el);
    }

    for (const check of checksOf(analysis)) {
      const status = normalizeStatus(check?.status);
      const evidence = Array.isArray(check?.evidence) ? check.evidence.map(clean).filter(Boolean) : (check?.evidence ? [clean(check.evidence)] : []);
      const el = document.createElement('div');
      el.className = 'nv-check';
      el.innerHTML = `
        <div class="nv-left"><span class="nv-title">${esc(clean(check?.title || 'Проверка'))}</span><span class="nv-status ${status}">${aiLabel(status)}</span></div>
        <div>
          <div class="nv-finding">${esc(clean(check?.finding || check?.comment || check?.explanation || ''))}</div>
          ${evidence.length ? `<div class="nv-evidence"><b>Основание:</b> ${esc(evidence.join(' · '))}</div>` : ''}
          ${clean(check?.recommendation) ? `<div class="nv-rec"><b>Что сделать:</b> ${esc(clean(check.recommendation))}</div>` : ''}
        </div>`;
      box.appendChild(el);
    }

    panel(box, 'Сильные стороны', analysis?.strengths, false);
    panel(box, 'Что исправить в первую очередь', analysis?.priorityFixes, true);
    panel(box, 'Что должен проверить преподаватель', teacherItems(analysis), false);

    const finalRecommendation = clean(analysis?.finalRecommendation || '');
    if (finalRecommendation) {
      const el = document.createElement('div');
      el.className = 'nv-final';
      el.innerHTML = `<b>Рекомендация перед сдачей</b><br>${esc(finalRecommendation)}`;
      box.appendChild(el);
    }

    const final = $('final');
    if (final) final.before(box); else report.appendChild(box);
    report.scrollIntoView({behavior:'smooth', block:'start'});

    try {
      const lines = ['MMT V-CHECK', formatTitle(), '', 'ГЛУБОКИЙ ИИ-АНАЛИЗ', ''];
      if (overallText) lines.push('ОБЩИЙ ВЫВОД', overallText, '');
      for (const check of checksOf(analysis)) {
        lines.push(`${clean(check?.title || 'Проверка')} — ${aiLabel(normalizeStatus(check?.status))}`);
        if (clean(check?.finding)) lines.push(clean(check.finding));
        if (Array.isArray(check?.evidence) && check.evidence.length) lines.push('Основание: ' + check.evidence.map(clean).filter(Boolean).join(' · '));
        if (clean(check?.recommendation)) lines.push('Что сделать: ' + clean(check.recommendation));
        lines.push('');
      }
      if (finalRecommendation) lines.push('РЕКОМЕНДАЦИЯ ПЕРЕД СДАЧЕЙ', finalRecommendation);
      if (typeof reportText !== 'undefined') reportText = lines.join('\n');
    } catch (_) {}
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Не удалось загрузить модуль чтения DOCX. Попробуйте TXT или MD.'));
      document.head.appendChild(script);
    });
  }

  async function ensureMammoth() {
    if (window.mammoth?.extractRawText) return;
    if (!mammothPromise) mammothPromise = loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
    await mammothPromise;
    if (!window.mammoth?.extractRawText) throw new Error('Модуль чтения DOCX не загрузился. Попробуйте TXT или MD.');
  }

  async function extractText(file) {
    if (!file) return '';
    if (/\.docx$/i.test(file.name || '')) {
      await ensureMammoth();
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({arrayBuffer});
      return String(result?.value || '').trim();
    }
    if (/\.(txt|md)$/i.test(file.name || '') || file.type === 'text/plain' || file.type === 'text/markdown') {
      return String(await file.text()).trim();
    }
    return '';
  }

  async function cancelReservation(fullName, group, reservationId, quotaDate) {
    if (!reservationId || !quotaDate) return;
    try { await api({action:'cancelUpload', fullName, group, reservationId, quotaDate}); } catch (_) {}
  }

  async function createAndUpload(file, fullName, group) {
    const contentType = file.type || (/\.docx$/i.test(file.name) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : /\.wav$/i.test(file.name) ? 'audio/wav' : /\.mp3$/i.test(file.name) ? 'audio/mpeg' : 'application/octet-stream');
    const created = await api({
      action:'createUpload',
      fullName,
      group,
      fileName:file.name,
      fileSize:file.size,
      contentType
    });
    const upload = await fetch(created.uploadUrl, {
      method:'PUT',
      headers:created.uploadHeaders || {'Content-Type':contentType},
      body:file
    });
    if (!upload.ok) {
      await cancelReservation(fullName, group, created.reservationId, created.quotaDate);
      throw new Error(`Хранилище вернуло ошибку ${upload.status}.`);
    }
    return {...created, contentType};
  }

  async function analyzeText(file, fullName, group, button) {
    setStatus('info', '<b>Подготавливаем текст к ИИ-анализу…</b>');
    if (button) button.textContent = 'Читаем текст…';
    const text = await extractText(file);
    if (!text) throw new Error('Не удалось извлечь текст. Для текстовой проверки используйте DOCX, TXT или MD.');

    if (button) button.textContent = 'Загружаем файл…';
    setStatus('info', `<b>Загружаем ${esc(file.name)}</b> во временное защищённое хранилище…`);
    const created = await createAndUpload(file, fullName, group);

    if (button) button.textContent = 'ИИ анализирует материал…';
    setStatus('info', '<b>YandexGPT читает материал и сверяет его с инструктажем выбранного формата…</b> Это может занять 10–40 секунд.');
    const result = await api({
      action:'analyzeMaterial',
      format:formatKey(),
      text,
      annotation:$('annotation')?.value || '',
      significance:$('significance')?.value || '',
      aiElement:$('aiElement')?.value || '',
      aiPlace:$('aiPlace')?.value || ''
    });
    renderAnalysis(result.analysis || {}, 'text');
    const remaining = Number.isFinite(created?.remainingToday) ? created.remainingToday : null;
    setStatus('ok', remaining === null
      ? '<b>Проверка завершена.</b> Формальный и глубокий ИИ-отчёт готовы.'
      : `<b>Проверка завершена.</b> Формальный и глубокий ИИ-отчёт готовы. На сегодня осталось проверок: <b>${remaining}</b>.`);
  }

  async function analyzePodcast(file, fullName, group, button) {
    if (!/\.(mp3|wav)$/i.test(file.name || '')) throw new Error('Подкаст должен быть в MP3 или WAV.');

    if (button) button.textContent = 'Загружаем подкаст…';
    setStatus('info', `<b>Загружаем ${esc(file.name)}</b> во временное защищённое хранилище…`);
    const created = await createAndUpload(file, fullName, group);

    if (button) button.textContent = 'Запускаем расшифровку…';
    setStatus('info', '<b>SpeechKit распознаёт речь.</b> После расшифровки YandexGPT автоматически проанализирует содержание. Это может занять несколько минут.');
    const started = await api({
      action:'startTranscription',
      objectKey:created.objectKey,
      fileName:file.name,
      contentType:created.contentType
    });
    if (!started?.operationId) throw new Error('SpeechKit не вернул идентификатор операции.');

    let transcription = null;
    const deadline = Date.now() + 15 * 60 * 1000;
    while (Date.now() < deadline) {
      if (button) button.textContent = 'Распознаём речь…';
      const current = await api({
        action:'getTranscription',
        operationId:started.operationId,
        format:'podcast',
        annotation:$('annotation')?.value || '',
        significance:$('significance')?.value || '',
        aiElement:$('aiElement')?.value || '',
        aiPlace:$('aiPlace')?.value || ''
      });
      if (current?.transcriptionReady) {
        transcription = current;
        break;
      }
      await sleep(5000);
    }
    if (!transcription) throw new Error('Расшифровка заняла больше 15 минут. Попробуйте повторить проверку позже.');
    if (!clean(transcription.transcript)) throw new Error('SpeechKit завершил работу, но не вернул расшифровку.');

    let result = transcription;
    if (!result.analysis) {
      if (button) button.textContent = 'ИИ анализирует подкаст…';
      setStatus('info', '<b>Расшифровка готова. YandexGPT анализирует содержание подкаста…</b>');
      const ai = await api({
        action:'analyzeMaterial',
        format:'podcast',
        transcript:result.transcript,
        durationSeconds:result.durationSeconds,
        audioObservations:result.audioObservations || {durationSeconds:result.durationSeconds},
        annotation:$('annotation')?.value || '',
        significance:$('significance')?.value || '',
        aiElement:$('aiElement')?.value || '',
        aiPlace:$('aiPlace')?.value || ''
      });
      result = {...result, ...ai};
    }

    renderAnalysis(result.analysis || {}, 'audio');
    const remaining = Number.isFinite(created?.remainingToday) ? created.remainingToday : null;
    setStatus('ok', remaining === null
      ? '<b>Проверка завершена.</b> Расшифровка и глубокий ИИ-отчёт готовы.'
      : `<b>Проверка завершена.</b> Расшифровка и глубокий ИИ-отчёт готовы. На сегодня осталось проверок: <b>${remaining}</b>.`);
  }

  async function run() {
    if (running) return;
    const kind = nonvideoKind();
    if (!kind) return;

    const file = currentFile();
    const fullName = clean($('name')?.value || '');
    const group = clean($('group')?.value || '');
    if (fullName.length < 4) { setStatus('error', '<b>Укажите имя и фамилию.</b>'); return; }
    if (!group) { setStatus('error', '<b>Выберите группу.</b>'); return; }
    if (!file) { setStatus('error', '<b>Загрузите готовый материал.</b>'); return; }
    if (file.size > MAX_FILE_BYTES) { setStatus('error', '<b>Файл больше 100 МБ.</b> Он не отправлен.'); return; }

    running = true;
    const button = $('form')?.querySelector('button[type="submit"]');
    const oldText = button?.textContent || 'Проверить материал';
    if (button) { button.disabled = true; button.textContent = 'Подготавливаем проверку…'; }

    try {
      if (kind === 'text') await analyzeText(file, fullName, group, button);
      else await analyzePodcast(file, fullName, group, button);
    } catch (error) {
      const payload = error?.payload || {};
      let message = error?.message || 'Попробуйте ещё раз.';
      if (payload?.error === 'daily_limit') message = 'На сегодня использованы обе проверки. Новые попытки будут доступны после 00:00 по Москве.';
      setStatus('error', `<b>Проверка не завершена.</b> ${esc(message)}`);
    } finally {
      running = false;
      if (button) { button.disabled = false; button.textContent = oldText; }
    }
  }

  ensureUi();

  const form = $('form');
  form?.addEventListener('submit', () => {
    const kind = nonvideoKind();
    if (!kind || running) return;
    setTimeout(run, 90);
  });

  $('format')?.addEventListener('change', () => {
    document.getElementById('nonvideoAiResult')?.remove();
    const status = ensureUi();
    status.className = '';
    status.innerHTML = '';
  });

  form?.addEventListener('reset', () => setTimeout(() => {
    document.getElementById('nonvideoAiResult')?.remove();
    const status = ensureUi();
    status.className = '';
    status.innerHTML = '';
  }, 0));

  console.log('V-CHECK non-video engine v1.0 loaded');
})();
