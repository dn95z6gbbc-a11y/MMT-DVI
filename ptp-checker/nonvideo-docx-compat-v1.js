// V-CHECK DOCX compatibility v1: restore Mammoth lazily after v30 strips CDN scripts at startup.
(() => {
  if (window.__VCHECK_DOCX_COMPAT_V1__) return;
  window.__VCHECK_DOCX_COMPAT_V1__ = '1.0';

  const TEXT_FORMATS = new Set(['article','report_event','report_theme','interview','profile','factcheck']);
  let mammothPromise = null;

  function formatKey() {
    return String(document.getElementById('format')?.value || '');
  }

  function loadMammoth() {
    if (window.mammoth?.extractRawText) return Promise.resolve(true);
    if (mammothPromise) return mammothPromise;

    mammothPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Mammoth did not load'));
      (document.head || document.documentElement).appendChild(script);
    }).catch(error => {
      console.warn('V-CHECK DOCX module did not load:', error);
      mammothPromise = null;
      return false;
    });

    return mammothPromise;
  }

  function maybePreload() {
    if (TEXT_FORMATS.has(formatKey())) loadMammoth();
  }

  // Text is the default format in the form, so start loading only after the UI is already ready.
  setTimeout(maybePreload, 0);
  document.getElementById('format')?.addEventListener('change', maybePreload);

  // If the user selects DOCX before Mammoth has finished loading, the original reader can fail once.
  // After Mammoth is ready, replay that one file-change event so the original material/text metadata is rebuilt.
  document.addEventListener('change', event => {
    const input = event.target;
    if (input?.id !== 'materialFile') return;
    const file = input.files?.[0];
    if (!file || !/\.docx$/i.test(file.name || '')) return;
    if (input.dataset.vcheckDocxReplay === 'done') return;

    loadMammoth().then(ok => {
      if (!ok || !input.files?.[0]) return;
      if (input.dataset.vcheckDocxReplay === 'done') return;
      input.dataset.vcheckDocxReplay = 'done';
      input.dispatchEvent(new Event('change', {bubbles:true}));
    });
  }, true);

  console.log('V-CHECK DOCX compatibility v1.0 loaded');
})();
