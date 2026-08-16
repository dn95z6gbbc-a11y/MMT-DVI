/* MMT ДВИ v0.12.6 — location semantics: MGIK discoverable under Moscow, actual campus in Khimki */
(function setupV0126(){
  const UNIS=window.MMT_UNIVERSITIES;if(!UNIS?.mgik)return;
  const u=UNIS.mgik;
  u.city='Москва';
  u.location='Химки, Московская область';
  u.locationDisplay='Москва · кампус в Химках';
  u.locationNote='Фактически институт находится в Химках, ближайшем Подмосковье. В каталоге MMT ДВИ он относится к московскому региону, чтобы абитуриент не потерял его при поиске вузов Москвы.';

  const screen=document.getElementById(u.screen);
  if(screen){
    const eye=screen.querySelector('.eye');if(eye)eye.textContent='Москва · кампус в Химках';
    const lead=screen.querySelector('.uni25Lead');
    if(lead&&!document.getElementById('mgik-location-note')){
      const n=document.createElement('div');n.id='mgik-location-note';n.className='notice';n.innerHTML='<b>География:</b> институт находится в Химках, Московская область, рядом с Москвой. В фильтре приложения МГИК показывается среди московских вузов.';
      lead.insertAdjacentElement('afterend',n);
    }
  }

  const city=document.getElementById('v10City');
  if(city){
    const current=state.v10Catalog?.city||'all';
    const cities=[...new Set(Object.values(UNIS).map(x=>x.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
    city.innerHTML='<option value="all">Все города</option>'+cities.map(c=>`<option value="${c}">${c}</option>`).join('');
    city.value=cities.includes(current)?current:'all';
    if(!cities.includes(current)&&state.v10Catalog)state.v10Catalog.city='all';
  }

  if(typeof window.renderV10==='function')window.renderV10();
})();
