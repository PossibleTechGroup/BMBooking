const HomeView = (() => {
  let doctors = [];
  let hospitals = [];
  let userLocation = null;
  let locating = false;

  const ICON = {
    user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    stethoscope: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
    calendar: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>',
    equipment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/><line x1="12" y1="11" x2="12" y2="17"/></svg>',
    star: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    card: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
    navigate: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    business: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    medical: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
    arrowForward: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>',
  };

  const SERVICES = [
    { key: 'family', label: 'Family Doctor', icon: 'stethoscope' },
    { key: 'pediatric', label: 'Pediatrician', icon: 'stethoscope' },
    { key: 'gynecology', label: 'Gynecologist', icon: 'stethoscope' },
    { key: 'dermatology', label: 'Dermatologist', icon: 'stethoscope' },
    { key: 'orthopedics', label: 'Orthopedics', icon: 'stethoscope' },
    { key: 'cardiology', label: 'Cardiologist', icon: 'stethoscope' },
    { key: 'neurology', label: 'Neurologist', icon: 'stethoscope' },
    { key: 'psychiatry', label: 'Psychiatry', icon: 'stethoscope' },
    { key: 'ent', label: 'ENT', icon: 'stethoscope' },
    { key: 'dentist', label: 'Dentist', icon: 'stethoscope' },
  ];

  const EARTH_RADIUS_KM = 6371;
  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getInitials(name) {
    if (!name) return 'DR';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  function render(container) {
    const user = Store.getUser();
    TG.hideMainButton();

    const profile = Store.getProfile();
    const fullName = (profile && profile.fullName) || (user && user.fullName) || '';
    const firstName = fullName ? fullName.split(' ')[0] : 'Guest';
    const langLabel = I18n.getLanguages().find(l => l.code === I18n.getLanguage()) ? I18n.getLanguages().find(l => l.code === I18n.getLanguage()).label : 'EN';
    const languages = I18n.getLanguages();
    const currentLang = I18n.getLanguage();

    container.innerHTML = '\n      <div class="view-header">\n        <div class="bm-brand"><img src="/bm-booking.png" alt="BM" /><span class="bm-brand-title">BM</span></div>\n        <div class="view-header-actions">\n        <div class="lang-wrapper">\n          <button class="lang-btn" id="lang-toggle">\n            ' + ICON.globe + ' ' + langLabel + ' ' + ICON.chevronDown + '\n          </button>\n          <div class="lang-dropdown" id="lang-dropdown">\n            ' + languages.map(l => '\n              <button class="lang-option' + (l.code === currentLang ? ' active' : '') + '" data-lang="' + l.code + '">\n                ' + l.label + '\n              </button>\n            ').join('') + '\n          </div>\n        </div>\n        <button class="view-header-icon" id="home-profile-btn">\n          ' + ICON.user + '\n        </button>\n        </div>\n      </div>\n\n      <p class="home-greeting">' + I18n.t('welcomeBack') + ' <strong id="home-greet-name">' + firstName + '</strong></p>\n\n      <div class="home-search-section" id="search-section">\n        <div class="search-bar glass-surface">\n          ' + ICON.search + '\n          <input type="text" id="home-search" placeholder="' + I18n.t('searchHospitals') + '" />\n        </div>\n        <button class="btn btn-primary home-near-me" id="near-me-btn">\n          ' + ICON.navigate + ' ' + (locating ? I18n.t('nearMeLoading') : I18n.t('nearMe')) + '\n        </button>\n      </div>\n      <div class="home-near-active" id="near-active" style="display:none">\n        <div class="chip">\n          ' + ICON.navigate + ' ' + I18n.t('nearMeLoading') + '\n        </div>\n        <button class="home-show-all" id="show-all-btn">' + I18n.t('showAll') + '</button>\n      </div>\n\n      <h3 class="section-title">' + I18n.t('services') + '</h3>\n      <div class="home-services">\n        ' + SERVICES.map(s => '\n          <div class="home-service-tile" data-service="' + s.label + '">\n            <div class="home-service-icon">' + ICON.stethoscope + '</div>\n            <div class="home-service-label">' + s.label + '</div>\n          </div>\n        ').join('') + '\n        <div class="home-service-tile" data-service="">\n          <div class="home-service-icon" style="border:1px solid var(--border);background:var(--surface)">' + ICON.search + '</div>\n          <div class="home-service-label">' + I18n.t('more') + '</div>\n        </div>\n      </div>\n\n      <h3 class="section-title">' + I18n.t('hospitals') + '</h3>\n      <div id="home-hospitals">\n        <div class="loading"><div class="spinner"></div></div>\n      </div>\n\n      <h3 class="section-title">' + I18n.t('featuredDoctors') + '</h3>\n      <div id="featured-doctors">\n        <div class="loading"><div class="spinner"></div></div>\n      </div>\n    ';

    container.querySelector('#home-profile-btn').addEventListener('click', function() { Router.navigate('profile'); });
    container.querySelectorAll('.home-service-tile').forEach(function(tile) {
      tile.addEventListener('click', function() {
        var svc = tile.getAttribute('data-service');
        if (svc) Router.navigate('doctors', { service: svc });
        else Router.navigate('doctors');
      });
    });

    var langToggle = container.querySelector('#lang-toggle');
    var langDropdown = container.querySelector('#lang-dropdown');
    if (langToggle) {
      langToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        langDropdown.classList.toggle('open');
      });
    }
    container.querySelectorAll('.lang-option').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        I18n.setLanguage(btn.getAttribute('data-lang'));
        if (langDropdown) langDropdown.classList.remove('open');
        render(container);
      });
    });
    document.addEventListener('click', function() { if (langDropdown) langDropdown.classList.remove('open'); });

    container.querySelector('#near-me-btn').addEventListener('click', function() { requestLocation(container); });
    container.querySelector('#show-all-btn').addEventListener('click', function() { userLocation = null; renderHospitals(container); });

    var searchInput = container.querySelector('#home-search');
    searchInput.addEventListener('input', function() { renderHospitals(container, searchInput.value); });

    loadData(container);

    if (!fullName) {
      API.getPatientProfile().then(function(p) {
        if (p && p.fullName) {
          Store.setProfile(p);
          var nameEl = container.querySelector('#home-greet-name');
          if (nameEl) nameEl.textContent = p.fullName.split(' ')[0];
        }
      }).catch(function() {});
    }
  }

  function requestLocation(container) {
    if (locating) return;
    locating = true;
    renderHospitals(container);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          locating = false;
          renderHospitals(container);
        },
        function() {
          locating = false;
          renderHospitals(container);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      locating = false;
      renderHospitals(container);
    }
  }

  function renderHospitals(container, searchQuery) {
    if (searchQuery === undefined) searchQuery = '';
    var searchSection = container.querySelector('#search-section');
    var nearActive = container.querySelector('#near-active');
    if (userLocation) {
      if (searchSection) searchSection.style.display = 'none';
      if (nearActive) nearActive.style.display = 'flex';
    } else {
      if (searchSection) searchSection.style.display = 'flex';
      if (nearActive) nearActive.style.display = 'none';
    }

    var list = hospitals.slice();
    if (userLocation) {
      list = list.map(function(h) {
        if (h.latitude && h.longitude) {
          return Object.assign({}, h, { __distance: haversineKm(userLocation.lat, userLocation.lon, h.latitude, h.longitude) });
        }
        return Object.assign({}, h, { __distance: null });
      }).filter(function(h) { return h.__distance !== null; }).sort(function(a,b) { return a.__distance - b.__distance; });
    } else {
      var q = (searchQuery || '').trim().toLowerCase();
      if (q) {
        list = list.filter(function(h) { return (h.name||'').toLowerCase().indexOf(q) !== -1 || (h.address||'').toLowerCase().indexOf(q) !== -1; });
      }
    }

    var el = container.querySelector('#home-hospitals');
    if (list.length === 0) {
      el.innerHTML = '\n        <div class="empty-state">\n          <div class="empty-state-icon">' + ICON.business + '</div>\n          <h3>' + I18n.t('noHospitalsFound') + '</h3>\n        </div>';
      return;
    }

    el.innerHTML = list.map(function(h) {
      var count = h.doctorCount || (h.doctors && h.doctors.length) || 0;
      var distHtml = '';
      if (h.__distance != null) {
        distHtml = '<span class="meta-item" style="color:var(--primary)">' + ICON.navigate + ' ' + I18n.t('distanceKm').replace('{{km}}', h.__distance.toFixed(1)) + '</span>';
      }
      var ratingHtml = '';
      if (h.rating) {
        ratingHtml = '<span class="meta-item">' + ICON.star + ' ' + h.rating + '</span>';
      }
      var imgHtml = '';
      if (h.image) {
        var src = h.image;
        if (src.indexOf('http') !== 0 && typeof API !== 'undefined' && API.BASE) src = API.BASE + src;
        imgHtml = '<img src="' + src + '" alt="' + (h.name||'') + '" />';
      } else {
        imgHtml = ICON.business;
      }
      return '\n        <div class="card home-hospital-card" data-id="' + h.id + '">\n          <div class="home-hospital-avatar">\n            ' + imgHtml + '\n          </div>\n          <div class="doctor-info">\n            <h3>' + (h.name||'') + '</h3>\n            <div class="specialty" style="margin-bottom:4px">' + (h.address||'—') + '</div>\n            <div class="meta">\n              <span class="meta-item">' + ICON.medical + ' ' + I18n.t('doctorsCount').replace('{{n}}', count) + '</span>\n              ' + distHtml + '\n              ' + ratingHtml + '\n            </div>\n          </div>\n          <div class="doctor-chevron">' + ICON.arrowForward + '</div>\n        </div>\n      ';
    }).join('');

    el.querySelectorAll('.home-hospital-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var hid = parseInt(card.getAttribute('data-id'), 10);
        var hosp = null;
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === hid) { hosp = list[i]; break; }
        }
        Router.navigate('doctors', { hospitalId: hid, hospitalName: hosp ? hosp.name : '' });
      });
    });
  }

  function getDoctorDistance(d) {
    if (!userLocation || !d.hospital) return null;
    if (d.hospital.latitude && d.hospital.longitude) {
      return haversineKm(userLocation.lat, userLocation.lon, d.hospital.latitude, d.hospital.longitude);
    }
    return null;
  }

  function renderDoctors(container) {
    var el = container.querySelector('#featured-doctors');
    var featured = doctors.slice(0, 5);
    if (featured.length === 0) {
      el.innerHTML = '\n        <div class="empty-state">\n          <div class="empty-state-icon">' + ICON.stethoscope + '</div>\n          <h3>' + I18n.t('noDoctorsAvailable') + '</h3>\n          <p>' + I18n.t('checkBackLater') + '</p>\n        </div>';
      return;
    }

    el.innerHTML = featured.map(function(d) {
      var initials = getInitials(d.fullName);
      var isAvailable = d.isAvailable !== false;
      var dist = getDoctorDistance(d);
      return '\n        <div class="doctor-card" data-id="' + d.id + '">\n          <div class="doctor-avatar">\n            ' + (d.profilePicture ? '<img src="' + d.profilePicture + '" alt="' + d.fullName + '" />' : '<span class="doctor-initials">' + initials + '</span>') + '\n          </div>\n          <div class="doctor-info">\n            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">\n              <h3 style="flex:1">' + d.fullName + '</h3>\n              <span class="chip chip-' + (isAvailable ? 'success' : 'warning') + '">' + (isAvailable ? I18n.t('available') : I18n.t('unavailable')) + '</span>\n            </div>\n            <div class="specialty">' + (d.specialization || (d.specializations ? d.specializations.join(', ') : '') || '') + '</div>\n            <div class="meta">\n              <span class="meta-item">' + ICON.star + ' ' + (d.rating || '0') + '</span>\n              <span class="meta-item">' + ICON.clock + ' ' + (d.experienceYears || 0) + ' yrs</span>\n              <span class="meta-item">' + ICON.card + ' ' + (d.hospital && d.hospital.cardPrice ? d.hospital.cardPrice : 0) + ' ETB</span>\n              ' + (dist ? '<span class="meta-item">' + ICON.navigate + ' ' + dist.toFixed(1) + ' km</span>' : '') + '\n            </div>\n          </div>\n          <div class="doctor-chevron">' + ICON.chevronRight + '</div>\n        </div>\n      ';
    }).join('');

    el.querySelectorAll('.doctor-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var id = parseInt(card.getAttribute('data-id'));
        Router.navigate('doctor-detail', { id: id });
      });
    });
  }

  async function loadData(container) {
    try {
      var docRes = await API.getAllDoctors();
      var hospRes = [];
      try { hospRes = await API.getAllHospitals(); } catch (e) { hospRes = []; }
      doctors = docRes || [];
      hospitals = hospRes || [];
      renderDoctors(container);
      renderHospitals(container);
    } catch (err) {
      var docEl = container.querySelector('#featured-doctors');
      var hospEl = container.querySelector('#home-hospitals');
      if (docEl) docEl.innerHTML = '<div class="alert alert-error">Failed to load doctors: ' + err.message + '</div>';
      if (hospEl) hospEl.innerHTML = '<div class="alert alert-error">Failed to load hospitals</div>';
    }
  }

  return { render: render };
})();