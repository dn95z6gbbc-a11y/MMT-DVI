// Loads the visual AI module after the stable page is ready.
(() => {
  const s = document.createElement('script');
  s.src = './vision-ui.js?build=20260910-vision1';
  s.defer = true;
  document.head.appendChild(s);
})();
