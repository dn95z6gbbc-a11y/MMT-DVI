// V-CHECK: visual AI analysis for extracted video frames.
// This file is intentionally separate from index.html so the stable Safari page is not rebuilt.
(() => {
  const API_URL = 'https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  let running = false;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function getFrames() {
    return Array.from(document.querySelectorAll('[data-vcheck-frame]'));
  }

  function getFrameImage(el) {
    return el.querySelector('img');
  }

  function getFrameTime(el, index) {
    return el.getAttribute('data-time') || el.dataset.time || `кадр ${index + 1}`;
  }

  async function blobToBase64(blob) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('file_reader_failed'));
      reader.onload = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.readAsDataURL(blob);
    });
  }

  async function imageToBase64(img) {
    if (!img) throw new Error('frame_image_missing');
    if (img.src.startsWith('data:')) {
      const comma = img.src.indexOf(',');
      return img.src.slice(comma + 1);
    }
    const response = await fetch(img.src);
    if (!response.ok) throw new Error(`frame_fetch_${response.status}`);
    return await blobToBase64(await response.blob());
  }

  async function analyzeFrame(frameEl, index) {
    const img = getFrameImage(frameEl);
    const imageBase64 = await imageToBase64(img);
    const mimeType = img?.src?.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        action: 'videoVision',
        imageBase64,
        mimeType
      })
    });

    const envelope = await response.json();
    const payload = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope;
    if (!response.ok || !payload?.ok || !payload?.analysis) {
      throw new Error(payload?.error || `vision_http_${response.status}`);
    }
    return payload.analysis;
  }

  function renderResult(frameEl, analysis) {
    let box = frameEl.querySelector('.vcheck-frame-ai');
    if (!box) {
      box = document.createElement('div');
      box.className = 'vcheck-frame-ai';
      frameEl.appendChild(box);
    }
    const type = analysis.frameType || 'unknown';
    const lower = analysis.lowerThirdVisible ? 'титр: да' : 'титр: нет/неясно';
    box.textContent = `${type} · ${lower}`;
  }

  function summarize(results) {
    const ok = results.filter(r => r.analysis);
    const counts = {};
    let lowerThird = 0;
    let person = 0;
    for (const r of ok) {
      const t = r.analysis.frameType || 'unknown';
      counts[t] = (counts[t] || 0) + 1;
      if (r.analysis.lowerThirdVisible) lowerThird++;
      if (r.analysis.personOnCamera) person++;
    }
    return {checked: ok.length, failed: results.length - ok.length, counts, lowerThird, person, frames: results};
  }

  function ensureStyles() {
    if (document.getElementById('vcheckVisionStyles')) return;
    const style = document.createElement('style');
    style.id = 'vcheckVisionStyles';
    style.textContent = `
      .vcheck-vision-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}
      .vcheck-vision-btn{border:0;border-radius:12px;padding:10px 14px;font:inherit;font-weight:800;background:#111827;color:#fff;cursor:pointer}
      .vcheck-vision-btn:disabled{opacity:.48;cursor:not-allowed}
      .vcheck-vision-status{font-size:13px;color:#667085}
      .vcheck-frame-ai{font-size:10px;line-height:1.25;margin-top:4px;color:#475569}
      .vcheck-vision-summary{margin-top:10px;padding:12px;border:1px solid #dbe3ee;background:#f8fafc;border-radius:12px;font-size:13px;color:#334155}
    `;
    document.head.appendChild(style);
  }

  function attach() {
    ensureStyles();
    const frames = getFrames();
    if (!frames.length) return false;
    const host = frames[0].parentElement?.parentElement || frames[0].parentElement;
    if (!host || host.querySelector('.vcheck-vision-actions')) return true;

    const actions = document.createElement('div');
    actions.className = 'vcheck-vision-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vcheck-vision-btn';
    button.textContent = `Проверить ${frames.length} кадров ИИ`;
    const status = document.createElement('span');
    status.className = 'vcheck-vision-status';
    status.textContent = 'Кадры готовы для визуального анализа.';
    const summaryBox = document.createElement('div');
    summaryBox.className = 'vcheck-vision-summary';
    summaryBox.hidden = true;
    actions.append(button, status);
    host.append(actions, summaryBox);

    button.addEventListener('click', async () => {
      if (running) return;
      running = true;
      button.disabled = true;
      const currentFrames = getFrames();
      const results = [];
      try {
        for (let i = 0; i < currentFrames.length; i++) {
          status.textContent = `ИИ анализирует кадр ${i + 1} из ${currentFrames.length}…`;
          try {
            const analysis = await analyzeFrame(currentFrames[i], i);
            results.push({index: i, time: getFrameTime(currentFrames[i], i), analysis});
            renderResult(currentFrames[i], analysis);
          } catch (error) {
            results.push({index: i, time: getFrameTime(currentFrames[i], i), error: String(error?.message || error)});
          }
          await sleep(180);
        }
        const summary = summarize(results);
        window.VCHECK_VIDEO_VISION = summary;
        const types = Object.entries(summary.counts).map(([k,v]) => `${k}: ${v}`).join(' · ') || 'нет данных';
        summaryBox.hidden = false;
        summaryBox.innerHTML = `<b>Визуальная ИИ-проверка готова.</b><br>Проверено: ${summary.checked}; ошибок: ${summary.failed}.<br>${types}<br>Кадров с человеком: ${summary.person}; с нижним титром: ${summary.lowerThird}.`;
        status.textContent = `Готово: ${summary.checked} из ${currentFrames.length} кадров.`;
      } finally {
        running = false;
        button.disabled = false;
      }
    });
    return true;
  }

  const observer = new MutationObserver(() => attach());
  observer.observe(document.documentElement, {childList:true, subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
})();
