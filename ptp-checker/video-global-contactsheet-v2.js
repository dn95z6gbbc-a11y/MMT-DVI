(() => {
  const API_URL='https://functions.yandexcloud.net/d4ejdq5v5too7egeop63';
  const SHEET_SIZE=4;

  if(window.__VCHECK_GLOBAL_CONTACT_SHEET_BRIDGE_V2__)return;
  window.__VCHECK_GLOBAL_CONTACT_SHEET_BRIDGE_V2__=true;

  const nativeFetch=window.fetch.bind(window);

  function formatTime(value){
    const seconds=Number(value);
    if(!Number.isFinite(seconds))return '--:--';
    const total=Math.max(0,seconds);
    const minutes=Math.floor(total/60);
    const secs=(total-minutes*60).toFixed(2).padStart(5,'0');
    return `${String(minutes).padStart(2,'0')}:${secs}`;
  }

  function loadImage(frame){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('Не удалось собрать контактный лист.'));
      image.src=`data:${frame?.mimeType||'image/jpeg'};base64,${frame?.imageBase64||''}`;
    });
  }

  function drawContained(ctx,image,x,y,w,h){
    ctx.fillStyle='#111827';
    ctx.fillRect(x,y,w,h);
    const scale=Math.min(w/image.naturalWidth,h/image.naturalHeight);
    const dw=image.naturalWidth*scale;
    const dh=image.naturalHeight*scale;
    const dx=x+(w-dw)/2;
    const dy=y+(h-dh)/2;
    ctx.drawImage(image,dx,dy,dw,dh);
  }

  function isRespondentTargeting(frames){
    const valid=(Array.isArray(frames)?frames:[]).filter(frame=>frame?.imageBase64);
    if(valid.length<8)return false;

    let closePairs=0;
    let checkedPairs=0;
    for(let i=0;i+1<valid.length;i+=2){
      const a=Number(valid[i]?.timeSeconds);
      const b=Number(valid[i+1]?.timeSeconds);
      if(!Number.isFinite(a)||!Number.isFinite(b))continue;
      checkedPairs++;
      if(Math.abs(b-a)<=4.5)closePairs++;
    }

    return checkedPairs>=4 && closePairs>=Math.max(3,Math.ceil(checkedPairs*0.6));
  }

  async function makeRegularSheet(group,sheetIndex){
    const columns=2;
    const rows=2;
    const cellWidth=640;
    const cellHeight=360;
    const labelHeight=30;
    const canvas=document.createElement('canvas');
    canvas.width=columns*cellWidth;
    canvas.height=rows*cellHeight;
    const ctx=canvas.getContext('2d',{alpha:false});

    ctx.fillStyle='#0f172a';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const images=await Promise.all(group.map(loadImage));

    for(let i=0;i<group.length;i++){
      const frame=group[i]||{};
      const image=images[i];
      const column=i%columns;
      const row=Math.floor(i/columns);
      const x=column*cellWidth;
      const y=row*cellHeight;

      drawContained(ctx,image,x,y,cellWidth,cellHeight-labelHeight);

      ctx.fillStyle='#ffffff';
      ctx.fillRect(x,y+cellHeight-labelHeight,cellWidth,labelHeight);
      ctx.fillStyle='#111827';
      ctx.font='bold 18px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textBaseline='middle';
      const frameIndex=Number.isFinite(Number(frame.index))?Number(frame.index):sheetIndex*SHEET_SIZE+i;
      ctx.fillText(
        `Кадр ${frameIndex+1} · ${formatTime(frame.timeSeconds)}`,
        x+12,
        y+cellHeight-labelHeight/2
      );
    }

    const dataUrl=canvas.toDataURL('image/jpeg',0.78);
    return {
      index:Number.isFinite(Number(group[0]?.index))?Number(group[0].index):sheetIndex,
      timeSeconds:Number.isFinite(Number(group[0]?.timeSeconds))?Number(group[0].timeSeconds):null,
      imageBase64:dataUrl.replace(/^data:image\/jpeg;base64,/,''),
      mimeType:'image/jpeg'
    };
  }

  async function makeRespondentSheet(group,sheetIndex){
    const columns=2;
    const rows=2;
    const cellWidth=640;
    const cellHeight=340;
    const headerHeight=54;
    const labelHeight=38;
    const canvas=document.createElement('canvas');
    canvas.width=columns*cellWidth;
    canvas.height=headerHeight+rows*cellHeight;
    const ctx=canvas.getContext('2d',{alpha:false});

    ctx.fillStyle='#0f172a';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#ffffff';
    ctx.font='bold 22px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.textBaseline='middle';
    ctx.fillText(
      'РЕСПОНДЕНТЫ: два соседних кадра относятся к одному эпизоду ответа',
      18,
      headerHeight/2
    );

    const images=await Promise.all(group.map(loadImage));

    for(let i=0;i<group.length;i++){
      const frame=group[i]||{};
      const image=images[i];
      const column=i%columns;
      const row=Math.floor(i/columns);
      const x=column*cellWidth;
      const y=headerHeight+row*cellHeight;
      const episodeNumber=sheetIndex*2+Math.floor(i/2)+1;
      const position=i%2===0?'начало ответа':'середина ответа';

      drawContained(ctx,image,x,y,cellWidth,cellHeight-labelHeight);

      ctx.fillStyle='#ffffff';
      ctx.fillRect(x,y+cellHeight-labelHeight,cellWidth,labelHeight);
      ctx.fillStyle='#111827';
      ctx.font='bold 18px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ctx.textBaseline='middle';
      ctx.fillText(
        `Эпизод ответа ${episodeNumber} · ${position} · ${formatTime(frame.timeSeconds)}`,
        x+12,
        y+cellHeight-labelHeight/2
      );
    }

    const dataUrl=canvas.toDataURL('image/jpeg',0.82);
    return {
      index:sheetIndex,
      timeSeconds:Number.isFinite(Number(group[0]?.timeSeconds))?Number(group[0].timeSeconds):null,
      imageBase64:dataUrl.replace(/^data:image\/jpeg;base64,/,''),
      mimeType:'image/jpeg'
    };
  }

  async function makeRegularSheets(frames){
    const valid=(Array.isArray(frames)?frames:[])
      .filter(frame=>frame?.imageBase64)
      .slice(0,24);

    const sheets=[];
    for(let i=0;i<valid.length;i+=SHEET_SIZE){
      sheets.push(await makeRegularSheet(valid.slice(i,i+SHEET_SIZE),sheets.length));
    }
    return sheets;
  }

  async function makeRespondentSheets(frames){
    const valid=(Array.isArray(frames)?frames:[])
      .filter(frame=>frame?.imageBase64)
      .slice(0,24);

    const sheets=[];
    for(let i=0;i<valid.length;i+=SHEET_SIZE){
      sheets.push(await makeRespondentSheet(valid.slice(i,i+SHEET_SIZE),sheets.length));
    }
    return sheets;
  }

  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:String(input?.url||'');
      if(url===API_URL&&init?.body){
        const body=JSON.parse(String(init.body));
        if(body?.action==='videoGlobalVision'&&Array.isArray(body.frames)&&body.frames.length>6){
          const respondentMode=isRespondentTargeting(body.frames);
          const sheets=respondentMode
            ?await makeRespondentSheets(body.frames)
            :await makeRegularSheets(body.frames);

          if(sheets.length>=2){
            console.info(
              respondentMode
                ?`V-CHECK respondent vision: ${body.frames.length} кадров собраны в ${sheets.length} листов с попарной разметкой эпизодов.`
                :`V-CHECK global vision: ${body.frames.length} кадров собраны в ${sheets.length} контактных листов.`
            );
            body.frames=sheets;
            init={...init,body:JSON.stringify(body)};
          }
        }
      }
    }catch(error){
      console.warn('V-CHECK contact-sheet bridge skipped:',error);
    }

    return nativeFetch(input,init);
  };
})();