/* loader: v0.4.2 base → v0.5 learning → v0.5.1 MPGU examples → v0.6 RANEPA → v0.7 adaptive route → v0.7.1 label fix → v0.8 media ecosystem → v0.8.1 sequential gate → v0.9 interview + GITR → v0.9.1 simulations → v0.10 infrastructure */
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
              v08.onload=()=>{
                const v081=document.createElement('script');
                v081.src='v081.js?v=081';
                v081.onload=()=>{
                  const v09=document.createElement('script');
                  v09.src='v09.js?v=090';
                  v09.onload=()=>{
                    const v091=document.createElement('script');
                    v091.src='v091.js?v=091';
                    v091.onload=()=>{
                      const v010=document.createElement('script');
                      v010.src='v010.js?v=010';
                      v010.onload=()=>{
                        const fix=document.createElement('script');
                        fix.src='v010-fix.js?v=0101';
                        fix.onload=()=>{
                          const extra=document.createElement('script');
                          extra.src='v010-extra.js?v=0102';
                          document.body.appendChild(extra);
                        };
                        document.body.appendChild(fix);
                      };
                      document.body.appendChild(v010);
                    };
                    document.body.appendChild(v091);
                  };
                  document.body.appendChild(v09);
                };
                document.body.appendChild(v081);
              };
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
