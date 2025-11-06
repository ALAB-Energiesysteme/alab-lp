// SCOPED Wizard (keine globalen Libs / kein Tailwind)
(function(){
  'use strict';

  // >>>> 1) KONFIG <<<<
  const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/yloo9gmjoxtsua7r2g5z6af9lqs0ei3y'; // <-- ersetzen
  const FORM_LOCATION = 'landingpage-pv-zuhause-kontakt';
  const SCROLL_OFFSET = 72; 

  // Icons (aus deiner Version übernommen)
  const icons = {
    reihenhaus:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 24V46H6V24L10 21L14 24Z" stroke="currentColor" stroke-width="2"/><path d="M8 46V36H12V46" stroke="currentColor" stroke-width="2"/><rect x="8" y="28" width="4" height="4" stroke="currentColor" stroke-width="2"/><path d="M30 24V46H22V24L26 21L30 24Z" stroke="currentColor" stroke-width="2"/><path d="M24 46V36H28V46" stroke="currentColor" stroke-width="2"/><rect x="24" y="28" width="4" height="4" stroke="currentColor" stroke-width="2"/><path d="M46 24V46H38V24L42 21L46 24Z" stroke="currentColor" stroke-width="2"/><path d="M40 46V36H44V46" stroke="currentColor" stroke-width="2"/><rect x="40" y="28" width="4" height="4" stroke="currentColor" stroke-width="2"/><path d="M14 25L22 25" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M30 25L38 25" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    doppelhaus:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 20V46H10V20L16 15L22 20Z" stroke="currentColor" stroke-width="2"/><path d="M12 46V36H20V46" stroke="currentColor" stroke-width="2"/><rect x="14" y="26" width="4" height="4" stroke="currentColor" stroke-width="2"/><path d="M38 20V46H26V20L32 15L38 20Z" stroke="currentColor" stroke-width="2"/><path d="M28 46V36H36V46" stroke="currentColor" stroke-width="2"/><rect x="30" y="26" width="4" height="4" stroke="currentColor" stroke-width="2"/><path d="M22 22L26 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    einfamilienhaus:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 24V46H18V24L30 15L42 24Z" stroke="currentColor" stroke-width="2"/><path d="M24 46V36H36V46" stroke="currentColor" stroke-width="2"/><rect x="28" y="28" width="4" height="4" stroke="currentColor" stroke-width="2"/><path d="M15 46H12V30L6 33V46H9" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    gewerbe:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 16V46H18V16H42Z" stroke="currentColor" stroke-width="2"/><path d="M24 46V36H36V46" stroke="currentColor" stroke-width="2"/><rect x="22" y="30" width="4" height="4" stroke="currentColor" stroke-width="2"/><rect x="34" y="30" width="4" height="4" stroke="currentColor" stroke-width="2"/><rect x="22" y="22" width="4" height="4" stroke="currentColor" stroke-width="2"/><rect x="34" y="22" width="4" height="4" stroke="currentColor" stroke-width="2"/><path d="M18 16L30 10L42 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    mehrfamilienhaus:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 20V46H16V20H44Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M22 46V36H38V46" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="20" y="30" width="4" height="4" stroke="currentColor" stroke-width="2"/><rect x="36" y="30" width="4" height="4" stroke="currentColor" stroke-width="2"/><rect x="20" y="24" width="4" height="4" stroke="currentColor" stroke-width="2"/><rect x="36" y="24" width="4" height="4" stroke="currentColor" stroke-width="2"/><path d="M16 20L30 14L44 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    satteldach:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 28V46H18V28L30 19L42 28Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M24 46V36H36V46" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="28" y="32" width="4" height="4" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M16 29L30 20L44 29" stroke="#E6C23C" stroke-width="2" stroke-linecap="round"/></svg>`,
    flachdach:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 24V46H18V24H42Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M24 46V36H36V46" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="28" y="30" width="4" height="4" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M18 24H42" stroke="#E6C23C" stroke-width="2" stroke-linecap="round"/></svg>`,
    pultdach:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 28V46H18V32L42 28Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M24 46V36H36V46" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="28" y="38" width="4" height="4" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M18 32L42 28" stroke="#E6C23C" stroke-width="2" stroke-linecap="round"/></svg>`,
    personen12:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="22" r="4" stroke="currentColor" stroke-width="2"/><path d="M28 38C28 33.5817 24.4183 30 20 30C15.5817 30 12 33.5817 12 38H28Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="40" cy="22" r="4" stroke="currentColor" stroke-width="2"/><path d="M48 38C48 33.5817 44.4183 30 40 30C35.5817 30 32 33.5817 32 38H48Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    personen34:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="24" r="3" stroke="currentColor" stroke-width="2"/><path d="M19 36C19 32.6863 16.7614 30 14 30C11.2386 30 9 32.6863 9 36H19Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="30" cy="22" r="4" stroke="currentColor" stroke-width="2"/><path d="M38 38C38 33.5817 34.4183 30 30 30C25.5817 30 22 33.5817 22 38H38Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="46" cy="24" r="3" stroke="currentColor" stroke-width="2"/><path d="M51 36C51 32.6863 48.7614 30 46 30C43.2386 30 41 32.6863 41 36H51Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    personen5p:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="22" r="4" stroke="currentColor" stroke-width="2"/><path d="M38 38C38 33.5817 34.4183 30 30 30C25.5817 30 22 33.5817 22 38H38Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="16" cy="24" r="3" stroke="currentColor" stroke-width="2"/><path d="M21 36C21 32.6863 18.7614 30 16 30C13.2386 30 11 32.6863 11 36H21Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="44" cy="24" r="3" stroke="currentColor" stroke-width="2"/><path d="M49 36C49 32.6863 46.7614 30 44 30C41.2386 30 39 32.6863 39 36H49Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    verteilt:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="30" r="4" fill="#E6C23C" stroke="#E6C23C" stroke-width="2"/><circle cx="30" cy="22" r="4" fill="#E6C23C" stroke="#E6C23C" stroke-width="2"/><circle cx="46" cy="30" r="4" fill="#E6C23C" stroke="#E6C23C" stroke-width="2"/><path d="M14 30C14 38.8366 21.1634 46 30 46C38.8366 46 46 38.8366 46 30" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/></svg>`,
    morgens:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="30" r="7" fill="#E6C23C" stroke="#E6C23C" stroke-width="2"/></svg>`,
    anderes:`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 24C22 20.6863 24.6863 18 28 18C31.3137 18 34 20.6863 34 24C34 26.5 32 29 30 31C28 29 26 26.5 26 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  const steps = [
    { key:'haustyp', title:'In welchem Haustyp wohnen Sie?', progress:10, cols:3,
      options:[
        {text:'Reihenhaus',icon:icons.reihenhaus},{text:'Doppelhaushälfte',icon:icons.doppelhaus},
        {text:'Einfamilienhaus',icon:icons.einfamilienhaus},{text:'Gewerbe',icon:icons.gewerbe},
        {text:'Mehrfamilienhaus',icon:icons.mehrfamilienhaus},{text:'Anderes',icon:icons.anderes}
      ]},
    { key:'dachform', title:'Welche Dachform hat Ihr Haus?', progress:30, cols:4,
      options:[
        {text:'Satteldach',icon:icons.satteldach},{text:'Flachdach',icon:icons.flachdach},
        {text:'Pultdach',icon:icons.pultdach},{text:'Anderes',icon:icons.anderes}
      ]},
    { key:'personen', title:'Wie viele Personen leben in Ihrem Haus?', progress:50, cols:4,
      options:[
        {text:'1–2',icon:icons.personen12},{text:'3–4',icon:icons.personen34},
        {text:'5 und mehr',icon:icons.personen5p},{text:'Weiß nicht',icon:icons.anderes}
      ]},
    { key:'stromnutzung', title:'Wann nutzen Sie den meisten Strom?', progress:70, cols:3,
      options:[
        {text:'Morgens & abends',icon:icons.morgens},{text:'Verteilt über den Tag',icon:icons.verteilt},
        {text:'Anderes',icon:icons.anderes}
      ]},
    { key:'kontakt', title:'Ihre Kontaktdaten', progress:90, isForm:true }
  ];

  let current = 0;
  const data = {};
  let showErrors = false;

  // DOM
  const $ = (sel)=>document.querySelector(sel);
  const grid = $('#kf-grid'), titleEl = $('#kf-title'),
        progressBar = $('#kf-progress-bar'), progressText = $('#kf-progress-text'),
        formBox = $('#kf-form'), thanks = $('#kf-thanks'), summary = $('#kf-summary'),
        btnPrev = $('#kf-prev'), btnNext = $('#kf-next');

  function render(){
    const step = steps[current];
    progressBar.style.width = `${step.progress}%`;
    progressText.textContent = `${step.progress}% geschafft`;

    titleEl.textContent = step.title;

    btnPrev.style.visibility = current===0 ? 'hidden':'visible';
    btnNext.disabled = !data[step.key];
    btnNext.textContent = step.isForm ? 'Absenden' : 'Weiter';

    if(step.isForm){
      grid.classList.add('is-hidden');
      formBox.classList.remove('is-hidden');
      formBox.innerHTML = formHTML();
      bindFormValidation();
      requestAnimationFrame(() => {
  const top = formBox.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
});
    }else{
      formBox.classList.add('is-hidden');
      grid.classList.remove('is-hidden');
      grid.style.gridTemplateColumns = `repeat(${Math.min(step.cols,3)},1fr)`;
      grid.innerHTML = '';
      step.options.forEach(opt=>{
        const card = document.createElement('button');
        card.className = 'alab-kf__card';
        card.innerHTML = `<div>${opt.icon}</div><div class="alab-kf__card-title">${opt.text}</div>`;
        if(data[step.key]===opt.text) card.classList.add('is-selected');
        card.addEventListener('click', ()=>{
          grid.querySelectorAll('.alab-kf__card').forEach(c=>c.classList.remove('is-selected'));
          card.classList.add('is-selected');
          data[step.key]=opt.text;
          btnNext.disabled = false;
          setTimeout(()=>next(),150);
        });
        grid.appendChild(card);
      });
    }
  }

  function formHTML(){
    return `
      <div class="alab-kf__form">
        <div class="alab-kf__form-row">
          <div class="alab-kf__field">
            <label class="alab-kf__label" for="kf-first">Vorname</label>
            <input class="alab-kf__input" id="kf-first" name="firstName" required minlength="2" value="${data.firstName||''}">
            <div class="alab-kf__error" id="err-first"></div>
          </div>
          <div class="alab-kf__field">
            <label class="alab-kf__label" for="kf-last">Nachname</label>
            <input class="alab-kf__input" id="kf-last" name="lastName" required minlength="2" value="${data.lastName||''}">
            <div class="alab-kf__error" id="err-last"></div>
          </div>
        </div>

        <div class="alab-kf__form-row">
          <div class="alab-kf__field">
            <label class="alab-kf__label" for="kf-street">Straße</label>
            <input class="alab-kf__input" id="kf-street" name="strasse" required value="${data.strasse||''}">
            <div class="alab-kf__error" id="err-street"></div>
          </div>
          <div class="alab-kf__field">
            <label class="alab-kf__label" for="kf-no">Hausnr.</label>
            <input class="alab-kf__input" id="kf-no" name="hausnummer" required value="${data.hausnummer||''}">
            <div class="alab-kf__error" id="err-no"></div>
          </div>
        </div>

        <div class="alab-kf__form-row">
          <div class="alab-kf__field">
            <label class="alab-kf__label" for="kf-plz">PLZ</label>
            <input class="alab-kf__input" id="kf-plz" name="plz" required pattern="^[0-9]{5}$" value="${data.plz||''}">
            <div class="alab-kf__hint">5-stellige PLZ</div>
            <div class="alab-kf__error" id="err-plz"></div>
          </div>
          <div class="alab-kf__field">
            <label class="alab-kf__label" for="kf-city">Ort</label>
            <input class="alab-kf__input" id="kf-city" name="ort" required value="${data.ort||''}">
            <div class="alab-kf__error" id="err-city"></div>
          </div>
        </div>

        <div class="alab-kf__form-row">
          <div class="alab-kf__field">
            <label class="alab-kf__label" for="kf-mail">E-Mail</label>
            <input class="alab-kf__input" id="kf-mail" name="email" type="email" required value="${data.email||''}">
            <div class="alab-kf__error" id="err-mail"></div>
          </div>
          <div class="alab-kf__field">
            <label class="alab-kf__label" for="kf-phone">Telefon (optional)</label>
            <input class="alab-kf__input" id="kf-phone" name="phone" value="${data.phone||''}">
          </div>
        </div>

        <label class="alab-kf__checkbox">
          <input type="checkbox" id="kf-privacy" ${data.privacy?'checked':''} required>
          <span>Ich habe die <a href="https://www.alabenergiesysteme.de/datenschutz/" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zu.</span>
        </label>
        <div class="alab-kf__error" id="err-privacy"></div>
      </div>
    `;
  }

 function bindFormValidation(){
  formBox.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      data[inp.name || inp.id.replace('kf-','')] = (inp.type==='checkbox') ? inp.checked : inp.value;
      validate({show:false}); // keine roten Fehler während der Eingabe
    }, {passive:true});
  });
  validate({show:false});
}

function validate({show=false} = {}){
  const get = id => formBox.querySelector('#'+id);
  let ok = true;

  const req = [
    ['kf-first','err-first','Bitte Vornamen eingeben (min. 2 Zeichen).', v=>v.trim().length>=2],
    ['kf-last','err-last','Bitte Nachnamen eingeben (min. 2 Zeichen).', v=>v.trim().length>=2],
    ['kf-street','err-street','Bitte Straße eingeben.', v=>v.trim().length>1],
    ['kf-no','err-no','Bitte Hausnummer eingeben.', v=>v.trim().length>=1],
    ['kf-plz','err-plz','Bitte gültige PLZ angeben (5 Ziffern).', v=>/^\d{5}$/.test(v)],
    ['kf-city','err-city','Bitte Ort eingeben.', v=>v.trim().length>1],
    ['kf-mail','err-mail','Bitte gültige E-Mail angeben.', v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)]
  ];

  const shouldShow = showErrors || show; // erst nach Absenden anzeigen

  req.forEach(([fid,eid,msg,fn])=>{
    const f = get(fid), e = get(eid);
    const okField = fn(f.value||'');
    ok = ok && okField;

    if(shouldShow){
      e.classList.toggle('is-visible', !okField);
      e.textContent = okField ? '' : msg;
    }else{
      e.classList.remove('is-visible');
      e.textContent = '';
    }
  });

  const priv = get('kf-privacy');
  const ePriv = get('err-privacy');
  const privOk = !!priv?.checked;
  ok = ok && privOk;

  if(shouldShow){
    ePriv.classList.toggle('is-visible', !privOk);
    ePriv.textContent = privOk ? '' : 'Bitte stimmen Sie der Datenschutzerklärung zu.';
  }else{
    ePriv.classList.remove('is-visible');
    ePriv.textContent = '';
  }

  // Vor erstem Absenden: Button nicht sperren
  btnNext.disabled = shouldShow ? !ok : false;

  return ok;
}


  function next(){
    if(current < steps.length-1){ current++; render(); }
    else submit(); // falls doch mal ausgelöst
  }
  function prev(){ if(current>0){ current--; render(); } }

async function submit(){
  // Fehleranzeige aktivieren und validieren
  showErrors = true;
  if(steps[current].isForm && !validate({show:true})){
    // optional: zum ersten Fehler scrollen
    const firstErr = formBox.querySelector('.alab-kf__error.is-visible');
    if(firstErr){ firstErr.scrollIntoView({behavior:'smooth', block:'center'}); }
    return;
  }
      progressBar.style.width = '100%';
  progressText.textContent = '100% geschafft';

    // Payload
    const payload = {
      ...data,
      form_location: FORM_LOCATION,
      ts: new Date().toISOString()
    };

    // Loading state
    btnNext.disabled = true; btnNext.textContent = 'Senden…';

    // Send to Make
    try{
      if(!MAKE_WEBHOOK_URL.includes('DEIN_WEBHOOK_HIER')){
        await fetch(MAKE_WEBHOOK_URL, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
      }
    }catch(err){
      console.error('Make-Submit Fehler:', err);
    }

    // Tracking
    if(window.dataLayer){
      window.dataLayer.push({event:'pvFormSubmitted','GL - form_location':FORM_LOCATION,payload});
      window.dataLayer.push({event:'contact_form_sent',form_location:FORM_LOCATION,payload});
    }
    if(window.parent !== window){
      window.parent.postMessage({type:'pvFormSubmitted','GL - form_location':FORM_LOCATION,payload}, '*');
    }

    // UI: Danke
    $('#kf-stepper').querySelectorAll('.alab-kf__form, .alab-kf__grid, #kf-title').forEach(n=>n.classList.add('is-hidden'));
    thanks.classList.remove('is-hidden');

    // Summary
    const labels = {
      haustyp:'Haustyp', dachform:'Dachform', personen:'Personen im Haushalt', stromnutzung:'Stromnutzung',
      firstName:'Vorname', lastName:'Nachname', strasse:'Straße', hausnummer:'Hausnummer',
      plz:'PLZ', ort:'Ort', email:'E-Mail', phone:'Telefon'
    };
    summary.innerHTML = '';
    Object.entries(payload).forEach(([k,v])=>{
      if(labels[k] && v){
        const li = document.createElement('li');
        li.textContent = `${labels[k]}: ${v}`;
        summary.appendChild(li);
      }
    });

    // Reset button
    btnPrev.style.visibility = 'hidden';
    btnNext.textContent = 'Fertig';
  }

  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', ()=> steps[current].isForm ? submit() : next());

  // Start
  render();
})();
