const vcheckPolishFrame=document.getElementById('app');

function initVcheckPolish(){
  const d=vcheckPolishFrame?.contentDocument;
  if(!d||d.documentElement?.dataset?.vcheckPolish11==='1')return;
  d.documentElement.dataset.vcheckPolish11='1';
  const $=id=>d.getElementById(id);
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();

  const privacy=d.querySelector('.privacy div');
  if(privacy)privacy.innerHTML='<b>Проверка идёт в два слоя.</b><br>Формальные параметры проверяются автоматически. Текстовые материалы читает YandexGPT. Подкасты сначала расшифровывает SpeechKit, затем YandexGPT анализирует содержание по требованиям выбранного формата. Итоговое решение остаётся за преподавателем.';

  const aiBox=d.querySelector('.ai-box');
  if(aiBox)aiBox.innerHTML='<b>Одна кнопка — две проверки</b>Формальные требования проверяются автоматически. Текстовые материалы читает YandexGPT. Подкасты V-CHECK временно загружает для расшифровки через SpeechKit, после чего YandexGPT анализирует расшифровку. Видео пока проходят формальную проверку. Максимум файла — 100 МБ, максимум — 2 проверки в сутки.';

  function polishReport(){
    const report=$('report');
    if(!report||getComputedStyle(report).display==='none')return;

    const badCount=d.querySelectorAll('#bad li').length;
    const title=$('reportTitle');
    if(title&&badCount>0)title.textContent=`Найдено формальных нарушений: ${badCount}`;

    const panels=[...d.querySelectorAll('#aiResult .ai-panel')];
    for(const panel of panels){
      const heading=clean(panel.querySelector('h4')?.textContent);
      if(heading!=='Что должен проверить преподаватель')continue;
      const list=panel.querySelector('ul,ol');
      if(!list)continue;
      const items=[...list.querySelectorAll('li')];
      const texts=items.map(li=>clean(li.textContent));
      const hasSound=texts.some(x=>/саунд[- ]?дизайн/i.test(x)&&!/интро.*аутро/i.test(x));
      const hasIntro=texts.some(x=>/интро/i.test(x)&&!/аутро.*саунд/i.test(x));
      const hasOutro=texts.some(x=>/аутро/i.test(x)&&!/интро.*саунд/i.test(x));
      const seen=new Set();
      for(const li of items){
        const text=clean(li.textContent);
        const key=text.toLowerCase().replace(/^проверить вручную:\s*/,'').replace(/[«»"'.,:;!?()]/g,'').replace(/\s+/g,' ').trim();
        const combined=/интро/i.test(text)&&/аутро/i.test(text)&&/саунд[- ]?дизайн/i.test(text);
        if((combined&&hasSound&&hasIntro&&hasOutro)||seen.has(key))li.remove();
        else seen.add(key);
      }
    }
  }

  function listText(selector){
    return [...d.querySelectorAll(selector)].map(x=>clean(x.textContent)).filter(Boolean);
  }

  function buildPdf(){
    if(!window.pdfMake)throw new Error('Модуль PDF не загрузился.');
    polishReport();
    const title=clean($('reportTitle')?.textContent||'Результат V-CHECK');
    const meta=clean($('reportMeta')?.textContent||'');
    const bad=listText('#bad li');
    const good=listText('#good li');
    const content=[
      {text:'MMT V-CHECK',style:'brand'},
      {text:'Отчёт по проверке материала',style:'kicker'},
      {text:title,style:'h1'},
      {text:meta,style:'meta',margin:[0,0,0,14]},
      {text:'Формальная проверка',style:'h2'}
    ];

    if(bad.length){
      content.push({text:`Не соблюдено · ${bad.length}`,style:'badHead',margin:[0,6,0,4]});
      content.push({ul:bad.map(x=>({text:x,color:'#9f1239'})),margin:[8,0,0,9]});
    }else content.push({text:'Формальных нарушений не найдено.',color:'#166534',bold:true,margin:[0,5,0,9]});

    if(good.length){
      content.push({text:`Соблюдено · ${good.length}`,style:'goodHead',margin:[0,6,0,4]});
      content.push({ul:good.map(x=>({text:x,color:'#166534'})),margin:[8,0,0,12]});
    }

    const ai=$('aiResult');
    if(ai){
      content.push({text:'Глубокий ИИ-анализ',style:'h2',margin:[0,10,0,3]});
      const note=clean(ai.querySelector('.ai-note')?.textContent);
      if(note)content.push({text:note,style:'meta',margin:[0,0,0,8]});

      const overall=ai.querySelector('.ai-overall');
      if(overall){
        const overallText=clean(overall.textContent.replace(/^Общий вывод\s*/i,''));
        if(overallText)content.push({table:{widths:['*'],body:[[{text:[{text:'Общий вывод\n',bold:true},{text:overallText}],fillColor:'#fff7ed',color:'#7c2d12',margin:9}]]},layout:'noBorders',margin:[0,0,0,8]});
      }

      for(const row of ai.querySelectorAll('.ai-check')){
        const titleText=clean(row.querySelector('.ai-title')?.textContent||'Проверка');
        const status=clean(row.querySelector('.ai-status')?.textContent||'');
        const finding=clean(row.querySelector('.ai-finding')?.textContent||'');
        const details=[...row.querySelectorAll('.ai-evidence,.ai-rec')].map(x=>clean(x.textContent)).filter(Boolean);
        const parts=[finding,...details].filter(Boolean);
        content.push({table:{widths:[125,'*'],body:[[
          {stack:[{text:titleText,bold:true},{text:status,fontSize:8,margin:[0,4,0,0]}],fillColor:'#fafafa',margin:7},
          {text:parts.join('\n'),margin:7,color:'#334155'}
        ]]},layout:{hLineColor:()=> '#e5e7eb',vLineColor:()=> '#e5e7eb',hLineWidth:()=>0.5,vLineWidth:()=>0.5},margin:[0,0,0,6]});
      }

      for(const panel of ai.querySelectorAll('.ai-panel')){
        const heading=clean(panel.querySelector('h4')?.textContent);
        const items=[...panel.querySelectorAll('li')].map(x=>clean(x.textContent)).filter(Boolean);
        if(!heading||!items.length)continue;
        content.push({text:heading,style:'h3',margin:[0,10,0,4]});
        const ordered=panel.querySelector('ol');
        content.push(ordered?{ol:items,margin:[8,0,0,9]}:{ul:items,margin:[8,0,0,9]});
      }

      const finalRec=ai.querySelector('.ai-final');
      if(finalRec){
        const text=clean(finalRec.textContent.replace(/^Рекомендация перед сдачей\s*/i,''));
        if(text)content.push({table:{widths:['*'],body:[[{text:[{text:'Рекомендация перед сдачей\n',bold:true},{text}],fillColor:'#0c0c0c',color:'#fff',margin:9}]]},layout:'noBorders',margin:[0,8,0,8]});
      }
    }

    const final=clean($('final')?.textContent||'');
    if(final)content.push({text:final,style:'final',margin:[0,10,0,0]});
    content.push({text:'Результаты V-CHECK носят рекомендательный характер и не заменяют оценку преподавателя.',style:'foot',margin:[0,16,0,0]});

    return {
      pageSize:'A4',pageMargins:[42,42,42,46],content,
      defaultStyle:{font:'Roboto',fontSize:9.5,color:'#1f2937',lineHeight:1.25},
      styles:{
        brand:{fontSize:11,bold:true,color:'#e77946',characterSpacing:1.2},
        kicker:{fontSize:8,color:'#94a3b8',margin:[0,3,0,10]},
        h1:{fontSize:21,bold:true,color:'#111827',margin:[0,0,0,5]},
        h2:{fontSize:14,bold:true,color:'#111827',margin:[0,4,0,4]},
        h3:{fontSize:11,bold:true,color:'#111827'},
        meta:{fontSize:8,color:'#64748b'},
        badHead:{fontSize:10,bold:true,color:'#9f1239'},
        goodHead:{fontSize:10,bold:true,color:'#166534'},
        final:{fontSize:10,bold:true,color:'#111827',background:'#fff7ed'},
        foot:{fontSize:7.5,color:'#94a3b8'}
      },
      footer:(current,pageCount)=>({text:`MMT V-CHECK · ${current}/${pageCount}`,alignment:'right',fontSize:7,color:'#94a3b8',margin:[0,10,42,0]})
    };
  }

  function pdfBlob(){
    return new Promise((resolve,reject)=>{
      try{window.pdfMake.createPdf(buildPdf()).getBlob(blob=>blob&&blob.size>1000?resolve(blob):reject(new Error('PDF получился пустым.')));}
      catch(e){reject(e);}
    });
  }

  function replacePdfButtons(){
    const oldPdf=$('pdf');
    if(oldPdf&&!oldPdf.dataset.polish11){
      const btn=oldPdf.cloneNode(true);btn.dataset.polish11='1';oldPdf.replaceWith(btn);
      btn.addEventListener('click',async e=>{
        e.preventDefault();
        const old=btn.textContent;
        try{
          btn.disabled=true;btn.textContent='Готовим PDF…';
          const blob=await pdfBlob();
          const url=URL.createObjectURL(blob);
          const a=document.createElement('a');a.href=url;a.download='MMT-V-CHECK.pdf';a.style.display='none';document.body.appendChild(a);a.click();a.remove();
          setTimeout(()=>URL.revokeObjectURL(url),5000);
        }catch(err){alert(`Не удалось создать PDF: ${err?.message||'неизвестная ошибка'}`);}
        finally{btn.disabled=false;btn.textContent=old||'Скачать PDF';}
      });
    }

    const oldShare=$('share');
    if(oldShare&&!oldShare.dataset.polish11){
      const btn=oldShare.cloneNode(true);btn.dataset.polish11='1';oldShare.replaceWith(btn);
      btn.addEventListener('click',async e=>{
        e.preventDefault();
        try{
          const blob=await pdfBlob();
          const file=new File([blob],'MMT-V-CHECK.pdf',{type:'application/pdf'});
          if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({title:'MMT V-CHECK',text:'Результат проверки материала',files:[file]});
          else if(navigator.share)await navigator.share({title:'MMT V-CHECK',text:'Результат проверки материала'});
          else alert('На этом устройстве системная отправка недоступна. Скачайте PDF и отправьте его вручную.');
        }catch(err){if(err?.name!=='AbortError')alert(`Не удалось поделиться отчётом: ${err?.message||'неизвестная ошибка'}`);}
      });
    }
  }

  replacePdfButtons();
  const observer=new MutationObserver(()=>{
    polishReport();
    replacePdfButtons();
  });
  observer.observe(d.body,{childList:true,subtree:true,characterData:true});
  polishReport();
}

if(vcheckPolishFrame?.contentDocument?.readyState==='complete'||vcheckPolishFrame?.contentDocument?.readyState==='interactive')initVcheckPolish();
else vcheckPolishFrame?.addEventListener('load',initVcheckPolish);
