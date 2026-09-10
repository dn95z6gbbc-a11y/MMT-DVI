(function(){
  const FRAME_ID='app';

  function repairReadyState(){
    const frame=document.getElementById(FRAME_ID);
    const d=frame?.contentDocument;
    if(!d)return;

    const button=d.getElementById('vcheckVisionButton');
    const status=d.getElementById('vcheckVisionStatus');
    if(!button||!status)return;

    const frames=Array.isArray(window.__VCHECK_VIDEO_FRAMES__)
      ? window.__VCHECK_VIDEO_FRAMES__
      : [];

    const text=String(status.textContent||'');
    const waiting=
      text.startsWith('Готовим кадры:') ||
      text.startsWith('Сначала дождитесь') ||
      text.startsWith('Сейчас готово кадров:');

    if(frames.length===12 && waiting){
      button.disabled=false;
      status.textContent='12 кадров готовы. Можно запустить тест зрения.';
    }
  }

  function attach(){
    const frame=document.getElementById(FRAME_ID);
    const d=frame?.contentDocument;
    if(!d)return;

    const box=d.getElementById('vcheckVideoFrames');
    if(box){
      const observer=new MutationObserver(repairReadyState);
      observer.observe(box,{childList:true,subtree:true,characterData:true});
    }

    d.addEventListener('change',event=>{
      if(event.target?.id==='materialFile'){
        setTimeout(repairReadyState,150);
        setTimeout(repairReadyState,500);
        setTimeout(repairReadyState,1200);
      }
    },true);

    const timer=setInterval(repairReadyState,300);
    setTimeout(()=>clearInterval(timer),30000);
    repairReadyState();
  }

  const frame=document.getElementById(FRAME_ID);
  if(!frame)return;
  if(frame.contentDocument?.readyState==='complete')attach();
  frame.addEventListener('load',attach);
})();
