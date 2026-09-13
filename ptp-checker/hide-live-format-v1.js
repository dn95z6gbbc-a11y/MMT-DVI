// V-CHECK: прямой эфир сознательно не проверяем автоматически.
(() => {
  if (window.__VCHECK_HIDE_LIVE_FORMAT_V1__) return;
  window.__VCHECK_HIDE_LIVE_FORMAT_V1__ = '1.0';

  function removeLiveOption() {
    const select = document.getElementById('format');
    if (!select) return;

    const liveOption = [...select.options].find(option => option.value === 'live');
    if (liveOption) liveOption.remove();

    if (select.value === 'live') {
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  removeLiveOption();
  setTimeout(removeLiveOption, 0);

  console.log('V-CHECK live format hidden');
})();
