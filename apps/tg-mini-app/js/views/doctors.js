const DoctorsView = (() => {
  let allDoctors = [];
  let filteredDoctors = [];
  let searchQuery = '';
  let activeService = null;
  let activeHospital = null;
  let sortBy = 'rating';
  let userLocation = null;

  const ICON = {
    arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
    stethoscope: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
    star: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    card: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    navigate: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  };

  const SERVICES = [
    { key: 'family', label: 'Family Doctor', match: ['family', 'general', 'gp'] },
    { key: 'pediatric', label: 'Pediatrician', match: ['pediatric', 'child', 'paediat'] },
    { key: 'gynecology', label: 'Gynecologist', match: ['gynec', 'obstet'] },
    { key: 'dermatology', label: 'Dermatologist', match: ['dermat'] },
    { key: 'orthopedics', label: 'Orthopedics', match: ['orthop'] },
    { key: 'cardiology', label: 'Cardiologist', match: ['cardio'] },
    { key: 'neurology', label: 'Neurologist', match: ['neuro'] },
    { key: 'psychiatry', label: 'Psychiatry', match: ['psych'] },
    { key: 'ent', label: 'ENT', match: ['ent', 'otolaryn'] },
    { key: 'dentist', label: 'Dentist', match: ['dent'] },
  ];

  const EARTH_RADIUS_KM = 6371;
  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function getInitials(name) {
    if (!name) return 'DR';
    return name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
  }

  async function render(container, params) {
    TG.hideMainButton();
    if (params && params.service) {
      activeService = params.service;
    }
    if (params && params.hospitalId) {
      activeHospital = { id: Number(params.hospitalId), name: params.hospitalName || '' };
      activeService = null;
      searchQuery = '';
    } else {
      activeHospital = null;
    }

    container.innerHTML = '\n      <div class="view-header">\n        <div class="bm-brand"><img src="/bm-booking.png" alt="BM" /><span class="bm-brand-title">BM</span></div>\n        <button class="view-header-icon" id="doctors-profile-btn">\n          ' + ICON.user + '\n        </button>\n      </div>\n      <h1 class="screen-title">' + (I18n.t('doctors') || 'Doctors') + '</h1>\n      <div class="search-bar glass-surface">\n        ' + ICON.search + '\n        <input type="text" id="doctor-search" placeholder="' + (I18n.t('search') || 'Search') + '" value="' + searchQuery + '" />\n      </div>\n      <div class="docs-sort-row">\n        <button class="docs-sort-chip' + (sortBy === 'rating' ? ' active' : '') + '" data-sort="rating">' + ICON.star + ' Top Rated</button>\n        <button class="docs-sort-chip' + (sortBy === 'az' ? ' active' : '') + '" data-sort="az">A-Z</button>\n      </div>\n      <div class="docs-chips-row">\n        <div class="docs-chips">\n          <button class="docs-chip' + (!activeService ? ' active' : '') + '" data-service="all">' + (I18n.t('all') || 'All') + '</button>\n          ' + SERVICES.map(s => '\n            <button class="docs-chip' + (activeService === s.label ? ' active' : '') + '" data-service="' + s.label + '">' + s.label + '</button>\n          ').join('') + '\n        </div>\n      </div>\n      <div id="doctors-list">\n        <div class="loading"><div class="spinner"></div></div>\n      </div>\n    ';

    if (activeHospital) {
      container.querySelector('.screen-title').insertAdjacentHTML('afterend',
        '<div class="docs-hospital-bar">' +
          '<span class="docs-hospital-label">' + I18n.t('doctorsAt') + ' <strong>' + esc(activeHospital.name || ('#' + activeHospital.id)) + '</strong></span>' +
          '<button class="docs-hospital-clear" id="clear-hospital">' + I18n.t('allHospitals') + '</button>' +
        '</div>');
      var clearHospital = container.querySelector('#clear-hospital');
      if (clearHospital) {
        clearHospital.addEventListener('click', function() {
          activeHospital = null;
          var bar = container.querySelector('.docs-hospital-bar');
          if (bar) bar.parentNode.removeChild(bar);
          filterAndRender(container);
        });
      }
    }

    container.querySelector('#doctors-profile-btn').addEventListener('click', function() { Router.navigate('profile'); });

    container.querySelector('#doctor-search').addEventListener('input', function(e) {
      searchQuery = e.target.value;
      filterAndRender(container);
    });

    container.querySelectorAll('.docs-sort-chip').forEach(function(btn) {
      btn.addEventListener('click', function() {
        sortBy = btn.getAttribute('data-sort');
        filterAndRender(container);
      });
    });

    container.querySelectorAll('.docs-chip').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var svc = btn.getAttribute('data-service');
        if (svc === 'all') activeService = null;
        else activeService = svc;
        filterAndRender(container);
      });
    });

    try {
      allDoctors = await API.getAllDoctors('?t=' + Date.now());
    } catch (err) {
      try {
        allDoctors = await API.getAllDoctors();
      } catch (err2) {
        container.querySelector('#doctors-list').innerHTML = '<div class="alert alert-error">' + (err2.message || 'Failed to load doctors') + '</div>';
        return;
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos) { userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude }; filterAndRender(container); },
        function() { userLocation = null; filterAndRender(container); },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
    filterAndRender(container);
  }

  function getDoctorDistance(d) {
    if (!userLocation || !d.hospital) return null;
    if (d.hospital.latitude && d.hospital.longitude) {
      return haversineKm(userLocation.lat, userLocation.lon, d.hospital.latitude, d.hospital.longitude);
    }
    return null;
  }

  function filterAndRender(container) {
    var query = searchQuery.toLowerCase().trim();
    filteredDoctors = allDoctors.slice();
    if (activeHospital) {
      filteredDoctors = filteredDoctors.filter(function(d) {
        return d.hospital && d.hospital.id === activeHospital.id;
      });
    }
    if (query) {
      filteredDoctors = filteredDoctors.filter(function(d) {
        var specs = (d.specialization || (d.specializations || []).join(', ') || '').toLowerCase();
        return (d.fullName || '').toLowerCase().indexOf(query) !== -1 || specs.indexOf(query) !== -1 || (d.clinicName || '').toLowerCase().indexOf(query) !== -1;
      });
    }
    if (activeService) {
      var svcDef = SERVICES.find(function(s) { return s.label === activeService; });
      if (svcDef) {
        filteredDoctors = filteredDoctors.filter(function(d) {
          var specs = (d.specialization || (d.specializations || []).join(', ') || '').toLowerCase();
          return svcDef.match.some(function(k) { return specs.indexOf(k) !== -1; }) || specs.indexOf(activeService.toLowerCase()) !== -1;
        });
      }
    }

    filteredDoctors = filteredDoctors.slice().sort(function(a,b) {
      if (sortBy === 'az') {
        return (a.fullName || '').localeCompare(b.fullName || '');
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    var list = container.querySelector('#doctors-list');
    if (filteredDoctors.length === 0) {
      list.innerHTML = '\n        <div class="empty-state">\n          <div class="empty-state-icon">' + ICON.stethoscope + '</div>\n          <h3>' + (activeHospital ? I18n.t('noDoctorsAtHospital') : (I18n.t('noDoctorsFound') || 'No doctors found')) + '</h3>\n          <p>' + (I18n.t('tryDifferentSearch') || 'Try a different search term or browse all available doctors.') + '</p>\n        </div>';
      return;
    }

    list.innerHTML = filteredDoctors.map(function(d) {
      var initials = getInitials(d.fullName);
      var isAvailable = d.isAvailable !== false;
      var dist = getDoctorDistance(d);
      return '\n        <div class="doctor-card" data-id="' + d.id + '">\n          <div class="doctor-avatar">\n            ' + (d.profilePicture ? '<img src="' + d.profilePicture + '" alt="' + d.fullName + '" />' : '<span class="doctor-initials">' + initials + '</span>') + '\n          </div>\n          <div class="doctor-info">\n            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">\n              <h3 style="flex:1">' + d.fullName + '</h3>\n              <span class="chip chip-' + (isAvailable ? 'success' : 'warning') + '">' + (isAvailable ? I18n.t('available') : I18n.t('unavailable')) + '</span>\n            </div>\n            <div class="specialty">' + (d.specialization || (d.specializations ? d.specializations.join(', ') : '') || '') + '</div>\n            <div class="meta">\n              <span class="meta-item">' + ICON.star + ' ' + (d.rating || '0') + '</span>\n              <span class="meta-item">' + ICON.clock + ' ' + (d.experienceYears || 0) + ' yrs</span>\n              <span class="meta-item">' + ICON.card + ' ' + (d.hospital && d.hospital.cardPrice ? d.hospital.cardPrice : 0) + ' ETB</span>\n              ' + (dist ? '<span class="meta-item">' + ICON.navigate + ' ' + dist.toFixed(1) + ' km</span>' : '') + '\n            </div>\n          </div>\n          <div class="doctor-chevron">' + ICON.chevronRight + '</div>\n        </div>\n      ';
    }).join('');

    list.querySelectorAll('.doctor-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var id = parseInt(card.getAttribute('data-id'));
        Router.navigate('doctor-detail', { id: id });
      });
    });
  }

  return { render: render };
})();

const DoctorDetailView = (() => {
  const ICON = {
    arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    call: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    map: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    navigate: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  };

  const EARTH_RADIUS_KM = 6371;
  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function t(key) { return I18n.t(key); }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function getInitials(name) {
    if (!name) return 'DR';
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // Same behaviour as getAssetUrl in apps/mobile/constants/api.ts
  function assetUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return API.BASE + (path.charAt(0) === '/' ? path : '/' + path);
  }

  function isoDateOnly(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Port of apps/mobile/utils/availability.ts
  function computeAvailability(schedules) {
    const now = new Date();
    const candidates = [];
    for (const s of schedules || []) {
      if (s.isActive === false) continue;
      for (const slot of s.slots || []) {
        if (new Date(slot.startTime) <= now) continue;
        const booked = (slot._count && slot._count.bookings) || 0;
        const max = slot.maxPatients != null ? slot.maxPatients : 1;
        if (booked < max) candidates.push(slot);
      }
    }
    candidates.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const next = candidates[0] || null;
    return { isAvailable: !!next, nextAvailableSlot: next ? next.startTime : null };
  }

  function doctorFlagAvailability(doctor) {
    if (doctor && typeof doctor.isAvailable === 'boolean') {
      return { isAvailable: doctor.isAvailable, nextAvailableSlot: doctor.nextAvailableSlot ?? null };
    }
    return null;
  }

  // Mirrors apps/mobile/app/doctor/[id].tsx: schedules win, otherwise the
  // doctor's stored flag, otherwise null (no badge rendered).
  function resolveAvailability(doctor, schedules) {
    if (schedules && schedules.length > 0) return computeAvailability(schedules);
    return doctorFlagAvailability(doctor);
  }

  function formatSlot(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return TimeUtils.formatDate(d) + ', ' + TimeUtils.formatTime(d);
  }

  function headerMarkup() {
    return `
      <div class="view-header">
        <button class="view-header-back" id="dd-back">${ICON.arrowLeft}<span>${esc(t('doctors'))}</span></button>
        <div class="bm-brand"><img src="/bm-booking.png" alt="BM" /><span class="bm-brand-title">BM</span></div>
        <div class="view-header-spacer"></div>
      </div>
    `;
  }

  function bindHeader(container) {
    const back = container.querySelector('#dd-back');
    if (back) back.addEventListener('click', () => Router.goBack());
  }

  function availabilityMarkup(avail) {
    if (!avail) return '';
    return `<span class="chip chip-${avail.isAvailable ? 'success' : 'warning'}">${esc(avail.isAvailable ? t('availableNow') : t('busyNow'))}</span>`;
  }

  function nextSlotMarkup(avail) {
    if (!avail || !avail.nextAvailableSlot) return '';
    const when = formatSlot(avail.nextAvailableSlot);
    if (!when) return '';
    return `<div class="doc-next-slot">${ICON.clock}<span>${esc(t('nextAvailable'))}: ${esc(when)}</span></div>`;
  }

  async function render(container, params) {
    TG.hideMainButton();
    const rawId = params && (params.id != null ? params.id : params.doctorId);
    const id = rawId != null ? parseInt(rawId, 10) : NaN;

    container.innerHTML = headerMarkup() + '<div class="loading"><div class="spinner"></div></div>';
    bindHeader(container);

    if (isNaN(id)) {
      renderNotFound(container);
      return;
    }

    let doctor = null;
    let fetchError = null;
    try {
      doctor = await API.getDoctorDetail(id);
      if (!doctor) {
        const all = await API.getAllDoctors('?t=' + Date.now());
        doctor = (all || []).find(d => d.id === id) || null;
      }
    } catch (err) {
      fetchError = err;
    }

    if (fetchError) {
      renderFetchError(container, id, fetchError);
      return;
    }
    if (!doctor) {
      renderNotFound(container);
      return;
    }

    renderBody(container, id, doctor);
    loadSchedules(container, id, doctor);
    watchGeolocation(container, doctor);
  }

  function renderFetchError(container, id, err) {
    container.innerHTML = headerMarkup() + `
      <div class="alert alert-error">${esc(err.message || t('error'))}</div>
      <button class="btn btn-outline" id="dd-retry">${esc(t('retry'))}</button>
    `;
    bindHeader(container);
    container.querySelector('#dd-retry').addEventListener('click', () => render(container, { id: id }));
  }

  function renderNotFound(container) {
    container.innerHTML = headerMarkup() + `
      <div class="empty-state">
        <h3>${esc(t('doctorNotFound'))}</h3>
      </div>
      <button class="btn btn-outline" id="dd-goback">${esc(t('goBack'))}</button>
    `;
    bindHeader(container);
    const btn = container.querySelector('#dd-goback');
    if (btn) btn.addEventListener('click', () => Router.goBack());
  }

  function renderBody(container, id, doctor) {
    const specs = (doctor.specializations && doctor.specializations.length)
      ? doctor.specializations.join(', ')
      : (doctor.specialization || '');
    const avatarUrl = assetUrl(doctor.profilePicture);
    const initials = getInitials(doctor.fullName);
    const hospital = doctor.hospital || null;

    const appFeeAmount = hospital && hospital.serviceFee && hospital.serviceFee.amount ? hospital.serviceFee.amount : 1;
    const cardPriceAmount = hospital && hospital.cardPrice != null ? hospital.cardPrice : 0;
    const rating = doctor.rating || '0';
    const totalReviews = doctor.totalReviews || 0;
    const clinicName = (hospital && hospital.name) || doctor.clinicName || '—';
    const clinicAddress = (hospital && hospital.address) || doctor.clinicAddress || '—';
    const phone = hospital && hospital.phone ? hospital.phone : '';
    const lat = hospital ? parseFloat(hospital.latitude) : NaN;
    const lng = hospital ? parseFloat(hospital.longitude) : NaN;
    const hasCoords = !isNaN(lat) && !isNaN(lng);
    const bio = doctor.bio || t('noBioAvailable');
    const initialAvail = doctorFlagAvailability(doctor);

    container.innerHTML = headerMarkup() + `
      <div class="doc-summary">
        <div class="doc-avatar">
          ${avatarUrl
            ? `<img src="${esc(avatarUrl)}" alt="${esc(doctor.fullName)}" id="dd-avatar-img" />`
            : `<span class="doc-avatar-initials">${esc(initials)}</span>`}
        </div>
        <h2 class="doc-name">${esc(doctor.fullName || '')}</h2>
        <div class="doc-specs">${esc(specs)}</div>
        <div class="doc-avail-row" id="dd-availability">${availabilityMarkup(initialAvail)}</div>
        <div id="dd-next-slot">${nextSlotMarkup(initialAvail)}</div>
      </div>

      <div class="card doc-meta">
        <div class="card-row">
          <span class="text-hint">${esc(t('rating'))}</span>
          <span class="doc-rating-value">${ICON.star} ${esc(rating)} (${esc(totalReviews)} ${esc(t('reviews'))})</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('experience'))}</span>
          <span>${doctor.experienceYears != null ? esc(doctor.experienceYears) + ' ' + esc(t('years')) : '—'}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('languages'))}</span>
          <span>${doctor.languages && doctor.languages.length ? esc(doctor.languages.join(', ')) : '—'}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('appFee'))}</span>
          <span>${esc(t('etb'))} ${esc(appFeeAmount)}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('hospitalCardPrice'))}</span>
          <span>${esc(t('etb'))} ${esc(cardPriceAmount)}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('hospitalClinic'))}</span>
          <span>${esc(clinicName)}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('address'))}</span>
          <span>${esc(clinicAddress)}</span>
        </div>
        <div class="doc-bio">
          <div class="doc-card-title">${esc(t('aboutDoctor'))}</div>
          <p class="doc-bio-text">${esc(bio)}</p>
        </div>
      </div>

      ${hospital || doctor.clinicAddress ? `
      <div class="card doc-hospital">
        <div class="doc-card-title">${esc(t('hospitalLocation'))}</div>
        <div class="card-row">
          <span class="text-hint">${esc(t('facility'))}</span>
          <span>${esc(clinicName)}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${esc(t('address'))}</span>
          <span>${esc(clinicAddress)}</span>
        </div>
        ${phone ? `
        <div class="card-row">
          <span class="text-hint">${esc(t('phone'))}</span>
          <span>${esc(phone)}</span>
        </div>` : ''}
        <div id="dd-distance"></div>
        ${(phone || hasCoords) ? `
        <div class="doc-hospital-actions">
          ${phone ? `<a class="btn btn-outline" href="tel:${esc(phone)}">${ICON.call}${esc(t('call'))}</a>` : ''}
          ${hasCoords ? `<a class="btn btn-outline" href="https://www.google.com/maps/search/?api=1&amp;query=${lat},${lng}" target="_blank" rel="noopener">${ICON.map}${esc(t('directions'))}</a>` : ''}
        </div>` : ''}
      </div>` : ''}

      <div class="card doc-schedules">
        <div class="doc-card-title">${esc(t('availableSchedules'))}</div>
        <div id="dd-schedules-body" class="doc-sched-body"><div class="loading"><div class="spinner"></div></div></div>
      </div>

      <div class="doc-book-bar">
        <button class="btn btn-primary" id="dd-book">${esc(t('bookAppointment'))}</button>
      </div>
    `;

    bindHeader(container);

    const avatarImg = container.querySelector('#dd-avatar-img');
    if (avatarImg) {
      avatarImg.addEventListener('error', function() {
        const wrap = avatarImg.parentElement;
        if (wrap) wrap.innerHTML = `<span class="doc-avatar-initials">${esc(initials)}</span>`;
      });
    }

    container.querySelector('#dd-book').addEventListener('click', () => {
      Router.navigate('booking', { doctorId: id, doctor: doctor });
    });
  }

  async function loadSchedules(container, id, doctor) {
    const body = container.querySelector('#dd-schedules-body');
    if (!body) return;

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);

    try {
      const schedules = await API.getDoctorSchedules(id, isoDateOnly(from), isoDateOnly(to));
      const list = schedules || [];
      renderSchedules(body, list);
      applyAvailability(container, doctor, list);
    } catch (err) {
      body.innerHTML = `
        <div class="alert alert-error">${esc(err.message || t('error'))}</div>
        <button class="btn btn-outline" id="dd-sched-retry">${esc(t('retry'))}</button>
      `;
      const retry = body.querySelector('#dd-sched-retry');
      if (retry) retry.addEventListener('click', () => loadSchedules(container, id, doctor));
      applyAvailability(container, doctor, []);
    }
  }

  function applyAvailability(container, doctor, schedules) {
    const avail = resolveAvailability(doctor, schedules);
    const availEl = container.querySelector('#dd-availability');
    const slotEl = container.querySelector('#dd-next-slot');
    if (availEl) availEl.innerHTML = availabilityMarkup(avail);
    if (slotEl) slotEl.innerHTML = nextSlotMarkup(avail);
  }

  function renderSchedules(el, schedules) {
    if (!el) return;
    if (!schedules.length) {
      el.innerHTML = `<div class="empty-state doc-sched-empty"><p>${esc(t('noUpcomingSchedules'))}</p></div>`;
      return;
    }
    el.innerHTML = schedules.map(s => {
      const d = s.date ? new Date(s.date) : new Date();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const start = s.startTime ? s.startTime.substring(0, 5) : '08:00';
      const end = s.endTime ? s.endTime.substring(0, 5) : '17:00';
      const room = `(${t('room')} ${s.clinicRoom || 122})`;
      return `
        <div class="doc-sched-row">
          <div class="doc-sched-date">
            <span class="doc-sched-day">${esc(dayName)}</span>
            <span class="doc-sched-num">${esc(dayNum)}</span>
            <span class="doc-sched-month">${esc(monthName)}</span>
          </div>
          <div class="doc-sched-time">${ICON.clock}<span>${esc(start)} - ${esc(end)} ${esc(room)}</span></div>
        </div>
      `;
    }).join('');
  }

  function watchGeolocation(container, doctor) {
    if (!navigator.geolocation || !doctor.hospital) return;
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        updateDistance(container, doctor, { lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      function() {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }

  function updateDistance(container, doctor, loc) {
    const el = container.querySelector('#dd-distance');
    if (!el || !doctor.hospital) return;
    const lat = parseFloat(doctor.hospital.latitude);
    const lng = parseFloat(doctor.hospital.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    const km = Math.round(haversineKm(loc.lat, loc.lon, lat, lng) * 10) / 10;
    el.innerHTML = `<div class="doc-distance">${ICON.navigate}<span>${km.toFixed(1)} ${esc(t('kmAway'))}</span></div>`;
  }

  return { render };
})();
