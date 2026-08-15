/* loader: v0.4.2 base → v0.5 learning → v0.5.1 MPGU examples → v0.6 RANEPA → v0.7 adaptive route → v0.7.1 label fix → v0.8 media ecosystem */
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
        v06.onload=()=>{
          const v07=document.createElement('script');
          v07.src='v07.js?v=070';
          v07.onload=()=>{
            const v071=document.createElement('script');
            v071.src='v071.js?v=071';
            v071.onload=()=>{
              const v08=document.createElement('script');
              v08.src='v08.js?v=080';
              document.body.appendChild(v08);
            };
            document.body.appendChild(v071);
          };
          document.body.appendChild(v07);
        };
        document.body.appendChild(v06);
      };
      document.body.appendChild(v051);
    };
    document.body.appendChild(v05);
  };
  document.body.appendChild(base);
})();
