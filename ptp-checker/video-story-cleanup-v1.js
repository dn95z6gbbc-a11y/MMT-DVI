// V-CHECK story cleanup v1: remove contradictions after reliable story speech-role confirmation.
(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const STORY_FORMATS=new Set(['story_event','story_theme']);

  if(window.__VCHECK_STORY_CLEANUP_V1__)return;
  window.__VCHECK_STORY_CLEANUP_V1__='1.0';

  const nativeFetch=window.fetch.bind(window);

  function requestBody(input,init){
    try{
      const url=typeof input==='string'?input:String(input?.url||'');
      if(url!==API_URL||!init?.body)return null;
      const body=JSON.parse(String(init.body));
      return body?.action==='analyzeMaterial'?body:null;
    }catch(_){
      return null;
    }
  }

  function isExtraSyncReview(value){
    const text=String(value||'').toLowerCase().replace(/ё/g,'е');
    return /синхрон/.test(text)&&/(дополн|добав|недостат|проверить наличие)/.test(text);
  }

  function patchAnalysis(analysis,format){
    if(!analysis||typeof analysis!=='object'||!STORY_FORMATS.has(format))return analysis;

    const roles=window.__VCHECK_SPEECH_ROLE_ANALYSIS__||null;
    const syncCount=Number(roles?.syncCount);
    const differentSpeakers=Number(roles?.confirmedDifferentSyncSpeakers);
    const classifiedSegments=Number(roles?.classifiedSegments);
    const totalSegments=Number(roles?.totalSegments);

    const syncReliable=
      Number.isFinite(syncCount)&&
      Number.isFinite(differentSpeakers)&&
      Number.isFinite(classifiedSegments)&&
      classifiedSegments>0&&
      (!Number.isFinite(totalSegments)||classifiedSegments>=totalSegments);

    const syncConfirmed=syncReliable&&syncCount>=3&&differentSpeakers>=3;

    if(syncConfirmed&&Array.isArray(analysis.teacherReview)){
      analysis.teacherReview=analysis.teacherReview.filter(item=>!isExtraSyncReview(item));
    }

    if(syncConfirmed&&Array.isArray(analysis.priorityFixes)){
      analysis.priorityFixes=analysis.priorityFixes.filter(item=>{
        const text=`${item?.problem||''} ${item?.why||''} ${item?.how||''}`;
        return !isExtraSyncReview(text);
      });
    }

    return analysis;
  }

  function patchPayload(payload,format){
    if(!payload||typeof payload!=='object')return payload;

    if(typeof payload.body==='string'){
      try{
        const inner=JSON.parse(payload.body);
        if(inner?.analysis)inner.analysis=patchAnalysis(inner.analysis,format);
        return {...payload,body:JSON.stringify(inner)};
      }catch(_){
        return payload;
      }
    }

    if(payload?.analysis){
      return {...payload,analysis:patchAnalysis(payload.analysis,format)};
    }

    return payload;
  }

  window.fetch=async function(input,init){
    const body=requestBody(input,init);
    const response=await nativeFetch(input,init);
    if(!body)return response;

    try{
      const raw=await response.clone().json();
      const format=String(body.format||document.getElementById('format')?.value||'');
      const patched=patchPayload(raw,format);
      return new Response(JSON.stringify(patched),{
        status:response.status,
        statusText:response.statusText,
        headers:new Headers(response.headers)
      });
    }catch(error){
      console.warn('V-CHECK story cleanup skipped:',error);
      return response;
    }
  };

  console.log('V-CHECK story cleanup v1.0 loaded');
})();
