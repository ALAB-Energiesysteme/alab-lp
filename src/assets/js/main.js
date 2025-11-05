// UTM/GCLID einsammeln
(function fillAttribution(){
  const p=new URLSearchParams(location.search);
  const set=(id)=>{const el=document.getElementById(id); if(el && p.get(id)) el.value=p.get(id)};
  ["gclid","utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(set);
})();

// Submit-Handler (Make Webhook + Tracking)
async function handleLeadSubmit(e){
  e.preventDefault();
  const form=e.currentTarget;
  const btn=form.querySelector('button[type="submit"]');
  btn.disabled=true;

  const data=new FormData(form);
  // page context (pv-zuhause | pv-gewerbe)
  data.append('form_location', document.body.getAttribute('data-location') || 'lp');

  try{
    const res = await fetch('https://hook.eu2.make.com/yloo9gmjoxtsua7r2g5z6af9lqs0ei3y', {
      method:'POST',
      body:data,
      mode:'no-cors' // Make akzeptiert; wir erwarten keine Antwort
    });

    // Datalayer Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event:'pvFormSubmitted',
      'GL - form_location': document.body.getAttribute('data-location') || 'lp'
    });

    form.reset();
    form.classList.add('submitted');
    const thanks = form.querySelector('[data-thanks]');
    if(thanks){ thanks.hidden=false; }

  }catch(err){
    alert('Senden fehlgeschlagen. Bitte erneut versuchen oder anrufen.');
    btn.disabled=false;
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('form[data-make]').forEach(f=>f.addEventListener('submit',handleLeadSubmit));
});
