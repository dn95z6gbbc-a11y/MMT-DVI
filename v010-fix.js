/* v0.10 compatibility: old diagnostic target name → current diagnostics screen */
(function(){
  document.addEventListener('click',function(e){
    const t=e.target.closest('[data-go="trialCenter"]');
    if(!t)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(typeof go==='function')go('diagnostics');
  },true);
})();
