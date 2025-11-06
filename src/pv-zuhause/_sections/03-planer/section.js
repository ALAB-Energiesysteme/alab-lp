/* ============================================
   ALAB Energiesysteme Contact Form - Step Flow
   ============================================ */
(function () {
  'use strict';
// >>> HIER DEINE MAKE WEBHOOK URL EINTRAGEN <<<
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/yloo9gmjoxtsua7r2g5z6af9lqs0ei3y'; 

  const state = {
    currentStep: 1,
    map: null,
    marker: null,
    polygon: null,
    autocomplete: null,
    selectedPlace: null,
    roofArea: 0,
    consumption: 3440,
    isSubmitting: false
  };

  const CONFIG = {
    defaultCenter: { lat: 48.0446, lng: 10.4897 },
    mapOptions: {
      zoom: 19, mapTypeId: 'satellite', disableDefaultUI: false,
      zoomControl: true, streetViewControl: false, mapTypeControl: true,
      fullscreenControl: false, gestureHandling: 'greedy', tilt: 0
    }
  };
  async function sendToMake(payload) {
  const url = MAKE_WEBHOOK_URL;
  const json = JSON.stringify(payload);

  // 1) Normales fetch (mit CORS + keepalive)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      mode: 'cors',
      keepalive: true
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn('fetch → Make fehlgeschlagen:', e);
  }

  // 2) Fallback: sendBeacon (super robust bei Tab-Schließen/Navi)
  try {
    const blob = new Blob([json], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) {
      return true;
    }
  } catch (e) {
    console.warn('sendBeacon → Make fehlgeschlagen:', e);
  }

  // 3) Letzter Fallback: FormData ohne CORS-Leserechte
  try {
    const fd = new FormData();
    fd.append('payload', json);
    await fetch(url, { method: 'POST', body: fd, mode: 'no-cors', keepalive: true });
    // no-cors gibt uns keinen Status zurück – wir gehen von OK aus
    return true;
  } catch (e) {
    console.error('Alle Make-Sendeversuche fehlgeschlagen:', e);
  }

  return false;
}


  const ERRORS = {
    required: 'Dieses Feld ist erforderlich.',
    email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    phone: 'Bitte geben Sie eine gültige Telefonnummer ein.',
    minLength: (min) => `Mindestens ${min} Zeichen erforderlich.`,
    address: 'Bitte wählen Sie eine gültige Adresse aus.',
    privacy: 'Bitte stimmen Sie der Datenschutzerklärung zu.'
  };

  const elements = {
    form: null,
    addressSearch: null,
    successMessage: null,
    submitButton: null,
    hiddenFields: {},
    steps: {}
  };

  function init() {
    cacheElements();
    if (!elements.form) return;
    setupEventListeners();
    setupFormValidation();
    initMobileReflow(); 
  }
function moveAddressUnderImage() {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const addr    = document.querySelector('.alab-contact__address-group');
  const img     = document.querySelector('.alab-contact__image-section');
  const header  = document.querySelector('.alab-contact__header');

  if (!addr || !img || !header) return;

  // einmalig Platzhalter merken, um später exakt zurückzusetzen
  if (!addr._placeholder) {
    addr._placeholder = document.createComment('addr-home');
    addr.parentNode.insertBefore(addr._placeholder, addr.nextSibling);
  }

  if (isMobile) {
    if (!addr.dataset.mobMoved) {
      // direkt NACH dem Bild einfügen
      img.insertAdjacentElement('afterend', addr);
      addr.dataset.mobMoved = '1';
      addr.classList.add('is-detached'); // <- für CSS-Reihenfolge
    }
  } else {
    if (addr.dataset.mobMoved) {
      // an ursprüngliche Stelle zurück
      addr._placeholder.parentNode.insertBefore(addr, addr._placeholder);
      addr.classList.remove('is-detached');
      delete addr.dataset.mobMoved;
    } else {
      // sicherstellen: Adresse bleibt unter dem Header
      header.insertAdjacentElement('afterend', addr);
    }
  }
}


// beim Start & bei Resize (mit leichtem Debounce)
function initMobileReflow() {
  moveAddressUnderImage();
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(moveAddressUnderImage, 150);
  });
}


  function cacheElements() {
    elements.form = document.getElementById('contactForm');
    elements.addressSearch = document.getElementById('addressSearch');
    elements.successMessage = document.getElementById('successMessage');
    elements.submitButton = elements.form?.querySelector('.alab-contact__submit');

    // Steps 1..5 (Step 5 = successMessage)
    for (let i = 1; i <= 5; i++) {
      const id = i === 5 ? 'successMessage' : `step${i}`;
      elements.steps[`step${i}`] = document.getElementById(id);
    }

    ['latitude','longitude','formatted_address','postal_code','locality','route','street_number','country']
      .forEach(id => elements.hiddenFields[id] = document.getElementById(id));
  }

  function setupEventListeners() {
    elements.form.addEventListener('submit', handleFormSubmit);

    const inputs = elements.form.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input), { passive: true });
      input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) validateField(input); }, { passive: true });
    });

    const privacy = document.getElementById('privacy');
    privacy?.addEventListener('change', () => validateField(privacy));
  }

  // Called by Google Maps callback
  window.initGoogleMaps = function () {
    if (!window.google?.maps) return;
    initAutocomplete();
  };

  function initAutocomplete() {
    if (!elements.addressSearch || !window.google?.maps?.places) return;

    state.autocomplete = new google.maps.places.Autocomplete(elements.addressSearch, {
      componentRestrictions: { country: 'de' },
      fields: ['address_components', 'geometry', 'formatted_address', 'name'],
      types: ['address']
    });

    state.autocomplete.addListener('place_changed', handlePlaceSelect);
  }

  function handlePlaceSelect() {
    const place = state.autocomplete.getPlace();
    if (!place.geometry?.location) {
      showFieldError(elements.addressSearch, ERRORS.address);
      return;
    }

    clearFieldError(elements.addressSearch);
    state.selectedPlace = place;

    const addressData = extractAddressComponents(place);
    populateHiddenFields(addressData);

    goToStep(2);
    setTimeout(() => initializeMap(place.geometry.location), 100);
  }

  function extractAddressComponents(place) {
    const comps = place.address_components || [];
    const data = {
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      formatted_address: place.formatted_address || '',
      postal_code: '', locality: '', route: '', street_number: '', country: ''
    };
    const map = { street_number:'street_number', route:'route', locality:'locality', postal_code:'postal_code', country:'country' };
    comps.forEach(c => { const t = c.types[0]; if (map[t]) data[map[t]] = c.long_name; });
    return data;
  }

  function populateHiddenFields(data) {
    Object.keys(data).forEach(k => { if (elements.hiddenFields[k]) elements.hiddenFields[k].value = data[k]; });
  }

  function initializeMap(location) {
    if (!window.google?.maps) return;
    const el = document.getElementById('mainMap'); if (!el) return;

    state.map = new google.maps.Map(el, { ...CONFIG.mapOptions, center: location });

    if (!window.google.maps.drawing) return;

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: { position: google.maps.ControlPosition.TOP_CENTER, drawingModes: [google.maps.drawing.OverlayType.POLYGON] },
      polygonOptions: { fillColor:'#E6C23C', fillOpacity:0.4, strokeColor:'#E6C23C', strokeOpacity:0.9, strokeWeight:2, editable:true, draggable:false }
    });
    drawingManager.setMap(state.map);

    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon) => {
      drawingManager.setDrawingMode(null);
      if (state.polygon) state.polygon.setMap(null);
      state.polygon = polygon;
      calculateRoofArea(polygon);
      const path = polygon.getPath();
      ['set_at','insert_at','remove_at'].forEach(evt => google.maps.event.addListener(path, evt, () => calculateRoofArea(polygon)));
    });
  }

  function calculateRoofArea(polygon) {
    if (!window.google?.maps?.geometry) return;
    const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
    state.roofArea = Math.round(area);
    const out = document.getElementById('roofSizeDisplay'); if (out) out.textContent = `${state.roofArea} m²`;
  }

  function goToStep(stepNumber, opts = {}) {
  const { scroll = false } = opts;          // standard: NICHT scrollen

  Object.values(elements.steps).forEach(step => step?.classList.remove('alab-contact__step--active'));
  const targetStep = elements.steps[`step${stepNumber}`];
  if (targetStep) {
    targetStep.classList.add('alab-contact__step--active');
    state.currentStep = stepNumber;

    if (scroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (stepNumber === 2 && state.map) {
      setTimeout(() => google.maps.event.trigger(state.map, 'resize'), 150);
    }
  }
}


  function toggleManualInput() {
    const checkbox = document.getElementById('manualInput');
    const manual = document.getElementById('manualRoofSize');
    const display = document.getElementById('roofSizeDisplay');

    if (checkbox?.checked) {
      manual.style.display = 'block';
      display.style.display = 'none';
      manual.focus();
      if (!manual._bound) {
        manual.addEventListener('input', function () { state.roofArea = parseInt(this.value, 10) || 0; });
        manual._bound = true;
      }
    } else {
      manual.style.display = 'none';
      display.style.display = 'block';
    }
  }

  function calculateConsumption() {
    const persons = parseInt(document.getElementById('persons')?.value) || 4;
    const living = parseInt(document.getElementById('livingArea')?.value) || 160;
    const warmwater = !!document.getElementById('warmwater')?.checked;
    const heatpump  = !!document.getElementById('heatpump')?.checked;
    const ecar      = !!document.getElementById('ecar')?.checked;

    let kwh = 1000 + (persons * 500) + (living * 10);
    if (warmwater) kwh += 800;
    if (heatpump)  kwh += 3000;
    if (ecar)      kwh += 2500;

    state.consumption = kwh;
    const el = document.getElementById('consumptionValue'); if (el) el.textContent = `${kwh.toLocaleString('de-DE')} kWh`;
  }

  function setupFormValidation() {}

  function validateField(field) {
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    let error = '';

    if (field.required && field.type !== 'checkbox' && !value) error = ERRORS.required;
    if (field.required && field.type === 'checkbox' && !value) error = ERRORS.privacy;

    if (!error && field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) error = ERRORS.email;
    if (!error && field.type === 'tel' && field.value) {
      const ok = /^[\d\s\+\-\(\)\/]+$/.test(field.value) && field.value.replace(/\s/g,'').length >= 6;
      if (!ok) error = ERRORS.phone;
    }

    const min = parseInt(field.getAttribute('minlength') || '0', 10);
    if (!error && min && field.value.length < min) error = ERRORS.minLength(min);

    if (field.id === 'addressSearch' && !elements.hiddenFields.latitude?.value) error = ERRORS.address;

    if (error) { showFieldError(field, error); return false; }
    clearFieldError(field); return true;
  }

  function validateForm() {
    const inputs = elements.form.querySelectorAll('input:not([type="hidden"]), textarea');
    let valid = true; inputs.forEach(i => { if (!validateField(i)) valid = false; }); return valid;
  }

  function showFieldError(field, msg) {
    field.setAttribute('aria-invalid','true'); field.classList.add('is-invalid');
    const id = field.getAttribute('aria-describedby'); const el = id && document.getElementById(id); if (el) el.textContent = msg;
  }

  function clearFieldError(field) {
    field.setAttribute('aria-invalid','false'); field.classList.remove('is-invalid');
    const id = field.getAttribute('aria-describedby'); const el = id && document.getElementById(id); if (el) el.textContent = '';
  }

// ⬇️ NEU: Minimal-Payload wie in Bild 2 + Source
function collectFormData() {
  const fd = new FormData(elements.form);
  const h  = elements.hiddenFields;

  return {
    // Adresse (nur die gewünschten Teile)
    "Postleitzahl":  h.postal_code?.value || "",
    "Ort":           h.locality?.value     || "",
    "Route":         h.route?.value        || "",
    "Hausnummer":    h.street_number?.value|| "",
    "Land":          h.country?.value      || "",

    // Kontakt
    "Vorname":       (fd.get("firstName") || "").trim(),
    "Nachname":      (fd.get("lastName")  || "").trim(),
    "E-Mail":        (fd.get("email")     || "").trim(),
    "Telefon":       (fd.get("phone")     || "").trim(),
    "Nachricht":     (fd.get("message")   || "").trim(),

    // Zustimmungen
    "Datenschutz":   fd.get("privacy") ? "an" : "aus",

    // Berechnungen
    "Dachfläche_m2": state.roofArea || 0,
    "Verbrauch_kWh": state.consumption || 0,

    // Quelle
    "Source": "Landingpage_pv-zuhause"
  };
}


 async function handleFormSubmit(event) {
  event.preventDefault();
  if (state.isSubmitting) return;

  // Validierung
  if (!validateForm()) {
    const firstInvalid = elements.form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // Loading
  state.isSubmitting = true;
  elements.submitButton.classList.add('is-loading');
  elements.submitButton.disabled = true;

  // Daten einsammeln
  const payload = collectFormData();

  // An Make senden
  const ok = await sendToMake(payload);

  if (ok) {
    // Erfolg
    handleSubmitSuccess(payload);
  } else {
    // Fehler sichtbar machen (Basic)
    alert('Die Anfrage konnte nicht übertragen werden. Bitte später erneut versuchen.');
    state.isSubmitting = false;
    elements.submitButton.classList.remove('is-loading');
    elements.submitButton.disabled = false;
  }
}


  function handleSubmitSuccess(data) {
    console.log('Form submitted:', data);
    goToStep(5);
    sendTrackingEvents();
    state.isSubmitting = false;
    elements.submitButton.classList.remove('is-loading'); elements.submitButton.disabled = false;
  }

  function sendTrackingEvents() {
    window.dataLayer && window.dataLayer.push({ event: 'contact_form_sent', form_location: 'alab-contact' });
    if (window.parent !== window) window.parent.postMessage({ type: 'contact_form_sent', form_location: 'alab-contact' }, '*');
    window.dispatchEvent(new CustomEvent('contact_form_sent', { detail: { form_location: 'alab-contact' } }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Public API
  window.ALAB_CONTACT_APP = { goToStep, toggleManualInput, calculateConsumption, state };

  // Drain der Maps-Callback-Queue, falls Google schneller war
  window.addEventListener('DOMContentLoaded', function () {
    if (window._mapsReadyQ?.length && typeof window.initGoogleMaps === 'function') {
      try { window.initGoogleMaps(); } catch(e) { console.error(e); }
      window._mapsReadyQ = [];
    }
  });

})();

