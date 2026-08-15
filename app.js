/* loader: v0.4.2 base → v0.5 learning → v0.5.1 MPGU examples → v0.6 RANEPA */
(function(){
  const base=document.createElement('script');
  base.src='app-v042.js?v=042';
  base.onload=()=>{
    const v05=document.createElement('script');
    v05.src='v05.js?v=050';
    v05.onload=()=>{
      const v051=document.createElement('script');
      v051.src='v051.js?v=052';
      v051.onload=()=>{
        const v06=document.createElement('script');
        v06.src='v06.js?v=060';
        document.body.appendChild(v06);
      };
      document.body.appendChild(v051);
    };
    document.body.appendChild(v05);
  };
  document.body.appendChild(base);
})();
