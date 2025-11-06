/* ============================================
   ALAB Energiesysteme Contact Form - Step Flow
   ============================================ */
(function () {
  'use strict';

  // ---- State ----
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

  // ---- Config ----
  const CONFIG = {
    defaultCenter: { lat: 48.0446, lng: 10.4897 }, // Mindelheim
    mapOptions: {
      zoom: 19,
      mapTypeId: 'satellite',
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      tilt: 0
    }
  };

  // ---- Fehlertexte ----
  const ERRORS = {
    required: 'Dieses Feld ist erforderlich.',
    email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    phone: 'Bitte geben Sie eine gültige Telefonnummer ein.',
    minLength: (min) => `Mindestens ${min} Zeichen erforderlich.`,
    address: 'Bitte wählen Sie eine gültige Adresse aus.',
    privacy: 'Bitte stimmen Sie der Datenschutzerklärung zu.'
  };

  // ---- DOM-Cache ----
  const elements = {
    form: null,
    addressSearch: null,
    successMessage: null,
    submitButton: null,
    hiddenFields: {},
    steps: {}
  };

  // ---------------- Init ----------------
  function init() {
    cacheElements();
    if (!elements.form) {
      console.error('Contact form not found');
      return;
    }
    setupEventListeners();
    setupFormValidation();

    
  }

  function cacheElements() {
    elements.form = document.getElementById('contactForm');
    elements.addressSearch = document.getElementById('addressSearch');
    elements.successMessage = document.getElementById('successMessage');
    elements.submitButton = elements.form?.querySelector('.alab-contact__submit');

    // Steps 1..4
    for (let i = 1; i <= 4; i++) {
      elements.steps[`step${i}`] = document.getElementById(`step${i}`);
    }
    // Step 5 (Success)
    elements.steps['step5'] = document.getElementById('successMessage');

    // Hidden Fields
    ['latitude', 'longitude', 'formatted_address', 'postal_code', 'locality', 'route', 'street_number', 'country']
      .forEach(id => elements.hiddenFields[id] = document.getElementById(id));
  }

  function setupEventListeners() {
    // Submit
    elements.form.addEventListener('submit', handleFormSubmit);

    // Inline-Validation
    const inputs = elements.form.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input), { passive: true });
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) validateField(input);
      }, { passive: true });
    });

    // Datenschutz-Häkchen
    const privacyCheckbox = document.getElementById('privacy');
    privacyCheckbox?.addEventListener('change', () => validateField(privacyCheckbox));

    // Adresseingabe – sauberer Flow
    if (elements.addressSearch) {
      // Eingabe löscht alte Place-Daten, damit nichts "klebt"
      elements.addressSearch.addEventListener('input', () => {
        state.selectedPlace = null;
        for (const k in elements.hiddenFields) elements.hiddenFields[k].value = '';
        clearFieldError(elements.addressSearch);
      });

      // Blur zeigt ggfs. Fehlermeldung
      elements.addressSearch.addEventListener('blur', () => {
        if (!elements.hiddenFields.latitude?.value) {
          showFieldError(elements.addressSearch, ERRORS.address);
        } else {
          clearFieldError(elements.addressSearch);
        }
      });

      // Enter ohne Auswahl → Geocoder-Fallback
      elements.addressSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handlePlaceSelect();
        }
      });
    }
  }

  // ---------------- Google Callback ----------------
  window.initGoogleMaps = function () {
    if (!window.google?.maps) {
      console.error('Google Maps API failed to load');
      alert('Google Maps konnte nicht geladen werden. Bitte laden Sie die Seite neu.');
      return;
    }
    initAutocomplete();
  };

  // ---------------- Places Autocomplete ----------------
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
    if (!window.google?.maps) {
      console.warn('Google Maps not loaded yet');
      return;
    }

    const place = state.autocomplete?.getPlace?.();

    // Enter ohne Auswahl → place hat keine Geometrie → Geocoder-Fallback
    if (!place?.geometry?.location) {
      const raw = elements.addressSearch.value.trim();
      if (!raw) {
        showFieldError(elements.addressSearch, ERRORS.address);
        return;
      }
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: raw, componentRestrictions: { country: 'DE' } },
        (results, status) => {
          if (status === 'OK' && results[0]) {
            clearFieldError(elements.addressSearch);
            state.selectedPlace = results[0];
            const addressData = extractAddressComponents(results[0]);
            populateHiddenFields(addressData);
            goToStep(2);
            setTimeout(() => initializeMap(results[0].geometry.location), 100);
          } else {
            showFieldError(elements.addressSearch, ERRORS.address);
          }
        }
      );
      return;
    }

    // Normalfall: Auswahl aus der Liste
    clearFieldError(elements.addressSearch);
    state.selectedPlace = place;
    const addressData = extractAddressComponents(place);
    populateHiddenFields(addressData);
    goToStep(2);
    setTimeout(() => initializeMap(place.geometry.location), 100);
  }

  // ---------------- Map & Zeichnen ----------------
  function initializeMap(location) {
    const mapElement = document.getElementById('mainMap');
    if (!window.google?.maps || !mapElement) return;

    state.map = new google.maps.Map(mapElement, { ...CONFIG.mapOptions, center: location });

    // Marker (drag → Koordinaten aktualisieren)
    if (state.marker) state.marker.setMap(null);
    state.marker = new google.maps.Marker({ map: state.map, position: location, draggable: true });
    google.maps.event.addListener(state.marker, 'dragend', handleMarkerDragEnd);

    if (!google.maps.drawing) {
      console.error('Google Maps Drawing library not loaded');
      alert('Das Zeichentool konnte nicht geladen werden. Bitte nutzen Sie die manuelle Eingabe.');
      return;
    }

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON]
      },
      polygonOptions: {
        fillColor: '#E6C23C',
        fillOpacity: 0.4,
        strokeColor: '#E6C23C',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        editable: true,
        draggable: false
      }
    });

    drawingManager.setMap(state.map);

    google.maps.event.addListener(drawingManager, 'polygoncomplete', function (polygon) {
      drawingManager.setDrawingMode(null);
      if (state.polygon) state.polygon.setMap(null);
      state.polygon = polygon;
      calculateRoofArea(polygon);

      polygon.getPath().addListener('set_at', () => calculateRoofArea(polygon));
      polygon.getPath().addListener('insert_at', () => calculateRoofArea(polygon));
      polygon.getPath().addListener('remove_at', () => calculateRoofArea(polygon));
    });
  }

  function calculateRoofArea(polygon) {
    if (!window.google?.maps?.geometry) return;
    const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
    state.roofArea = Math.round(area);
    const el = document.getElementById('roofSizeDisplay');
    if (el) el.textContent = `${state.roofArea} m²`;
  }

  function handleMarkerDragEnd() {
    if (!state.marker) return;
    const pos = state.marker.getPosition();
    const lat = pos.lat();
    const lng = pos.lng();
    if (elements.hiddenFields.latitude) elements.hiddenFields.latitude.value = lat;
    if (elements.hiddenFields.longitude) elements.hiddenFields.longitude.value = lng;
    reverseGeocode(lat, lng);
  }

  function reverseGeocode(lat, lng) {
    if (!window.google?.maps) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const data = extractAddressComponents(results[0]);
        data.latitude = lat;
        data.longitude = lng;
        populateHiddenFields(data);
      }
    });
  }

  // ---------------- Helpers ----------------
  function extractAddressComponents(place) {
    const components = place.address_components || [];
    const data = {
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      formatted_address: place.formatted_address || '',
      postal_code: '',
      locality: '',
      route: '',
      street_number: '',
      country: ''
    };
    const map = {
      street_number: 'street_number',
      route: 'route',
      locality: 'locality',
      postal_code: 'postal_code',
      country: 'country'
    };
    components.forEach(c => {
      const type = c.types[0];
      if (map[type]) data[map[type]] = c.long_name;
    });
    return data;
  }

  function populateHiddenFields(data) {
    Object.keys(data).forEach(k => {
      if (elements.hiddenFields[k]) elements.hiddenFields[k].value = data[k];
    });
  }

  function goToStep(stepNumber) {
    Object.values(elements.steps).forEach(step => step?.classList.remove('alab-contact__step--active'));
    const target = elements.steps[`step${stepNumber}`];
    if (target) {
      target.classList.add('alab-contact__step--active');
      state.currentStep = stepNumber;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (stepNumber === 2 && state.map) {
        setTimeout(() => google.maps.event.trigger(state.map, 'resize'), 150);
      }
    }
  }

  function toggleManualInput() {
    const checkbox = document.getElementById('manualInput');
    const manualInput = document.getElementById('manualRoofSize');
    const roofSizeDisplay = document.getElementById('roofSizeDisplay');

    if (checkbox && checkbox.checked) {
      manualInput.style.display = 'block';
      roofSizeDisplay.style.display = 'none';
      manualInput.focus();
      manualInput.addEventListener('input', function () {
        state.roofArea = parseInt(this.value, 10) || 0;
      });
    } else {
      manualInput.style.display = 'none';
      roofSizeDisplay.style.display = 'block';
    }
  }

  function calculateConsumption() {
    const persons = parseInt(document.getElementById('persons')?.value, 10) || 4;
    const livingArea = parseInt(document.getElementById('livingArea')?.value, 10) || 160;
    const warmwater = document.getElementById('warmwater')?.checked || false;
    const heatpump = document.getElementById('heatpump')?.checked || false;
    const ecar = document.getElementById('ecar')?.checked || false;

    let consumption = 1000 + persons * 500 + livingArea * 10;
    if (warmwater) consumption += 800;
    if (heatpump) consumption += 3000;
    if (ecar) consumption += 2500;

    state.consumption = consumption;
    const el = document.getElementById('consumptionValue');
    if (el) el.textContent = `${consumption.toLocaleString('de-DE')} kWh`;
  }

  function setupFormValidation() {
    // Platzhalter für individuelle Regeln – HTML5 ist via novalidate deaktiviert
  }

  function validateField(field) {
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    const type = field.type;
    const id = field.id;
    let error = '';

    if (field.required && ((type !== 'checkbox' && !value) || (type === 'checkbox' && !field.checked))) {
      error = (type === 'checkbox') ? ERRORS.privacy : ERRORS.required;
    }

    if (!error && value && type === 'email' && !isValidEmail(field.value)) error = ERRORS.email;
    if (!error && value && type === 'tel' && !isValidPhone(field.value)) error = ERRORS.phone;

    const minLength = parseInt(field.getAttribute('minlength'), 10);
    if (!error && minLength && field.value.trim().length < minLength) error = ERRORS.minLength(minLength);

    if (id === 'addressSearch' && !elements.hiddenFields.latitude?.value) error = ERRORS.address;

    if (error) { showFieldError(field, error); return false; }
    clearFieldError(field); return true;
  }

  function validateForm() {
    const inputs = elements.form.querySelectorAll('input:not([type="hidden"]), textarea');
    let isValid = true;
    inputs.forEach(i => { if (!validateField(i)) isValid = false; });
    return isValid;
  }

  function showFieldError(field, message) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('is-invalid');
    const errorId = field.getAttribute('aria-describedby');
    const el = document.getElementById(errorId);
    if (el) el.textContent = message;
  }

  function clearFieldError(field) {
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('is-invalid');
    const errorId = field.getAttribute('aria-describedby');
    const el = document.getElementById(errorId);
    if (el) el.textContent = '';
  }

  // ---------------- Submit ----------------
  function handleFormSubmit(e) {
    e.preventDefault();
    if (state.isSubmitting) return;

    if (!validateForm()) {
      const firstInvalid = elements.form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    state.isSubmitting = true;
    elements.submitButton.classList.add('is-loading');
    elements.submitButton.disabled = true;

    const data = collectFormData();

    // TODO: echten Endpoint verwenden
    setTimeout(() => handleSubmitSuccess(data), 1200);
  }

  function collectFormData() {
    const formData = new FormData(elements.form);
    const data = {};
    for (const [k, v] of formData.entries()) data[k] = v;
    return data;
  }

  function handleSubmitSuccess(data) {
    console.log('Form submitted:', data);
    goToStep(5); // Success-Step anzeigen
    sendTrackingEvents();
    state.isSubmitting = false;
    elements.submitButton.classList.remove('is-loading');
    elements.submitButton.disabled = false;
  }

  function sendTrackingEvents() {
    window.dataLayer?.push({ event: 'contact_form_sent', form_location: 'alab-contact' });

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'contact_form_sent', form_location: 'alab-contact' }, '*');
    }

    window.dispatchEvent(new CustomEvent('contact_form_sent', { detail: { form_location: 'alab-contact' } }));
  }

  // ---------------- Utils ----------------
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function isValidPhone(phone) {
    const re = /^[\d\s\+\-\(\)\/]+$/;
    const cleaned = phone.replace(/\s/g, '');
    return re.test(phone) && cleaned.length >= 6 && cleaned.length <= 20;
  }

  // ---------------- Boot ----------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API (für Buttons in deinem HTML)
  window.ALAB_CONTACT_APP = {
    goToStep,
    toggleManualInput,
    calculateConsumption,
    state
  };
})();
