/* loader: keep v0.4.2 base, then layer v0.5 */
(function(){
  const base=document.createElement('script');
  base.src='app-v042.js?v=042';
  base.onload=()=>{
    const next=document.createElement('script');
    next.src='v05.js?v=050';
    document.body.appendChild(next);
  };
  document.body.appendChild(base);
})();
