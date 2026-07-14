const DoctorsView = (() => {
  let allDoctors = [];
  let filteredDoctors = [];
  let searchQuery = '';

  const ICON = {
    arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
    stethoscope: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
    star: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    card: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    building: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    mapPin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  };

  async function render(container, params) {
    TG.hideMainButton();

    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="doctors-back">
          ${ICON.arrowLeft}
          <span>Home</span>
        </button>
        <h1 class="view-header-title">Doctors</h1>
        <div class="view-header-spacer"></div>
      </div>
      <div class="search-bar">
        ${ICON.search}
        <input type="text" id="doctor-search" placeholder="Search doctors..." value="${searchQuery}" />
      </div>
      <div id="doctors-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    `;

    container.querySelector('#doctors-back').addEventListener('click', () => Router.goBack());

    const searchInput = container.querySelector('#doctor-search');
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      filterAndRender(container);
    });

    try {
      allDoctors = await API.getAllDoctors();
      filterAndRender(container);
    } catch (err) {
      container.querySelector('#doctors-list').innerHTML =
        `<div class="alert alert-error">Failed to load doctors: ${err.message}</div>`;
    }
  }

  function filterAndRender(container) {
    const query = searchQuery.toLowerCase().trim();
    filteredDoctors = query
      ? allDoctors.filter(d =>
          d.fullName?.toLowerCase().includes(query) ||
          d.specialization?.toLowerCase().includes(query) ||
          d.clinicName?.toLowerCase().includes(query)
        )
      : allDoctors;

    const list = container.querySelector('#doctors-list');

    if (filteredDoctors.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.stethoscope}</div>
          <h3>No doctors found</h3>
        </div>`;
      return;
    }

    list.innerHTML = filteredDoctors.map(d => {
      const initials = d.fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      return `
        <div class="doctor-card" data-id="${d.id}">
          <div class="doctor-avatar">
            ${d.profilePicture ? `<img src="${d.profilePicture}" alt="${d.fullName}" />` : `<span class="doctor-initials">${initials}</span>`}
          </div>
          <div class="doctor-info">
            <h3>${d.fullName}</h3>
            <div class="specialty">${d.specialization || ''}</div>
            <div class="meta">
              <span class="meta-item">${ICON.star} ${d.rating || '0'}</span>
              <span class="meta-item">${ICON.clock} ${d.experienceYears || 0} yrs</span>
              <span class="meta-item">${ICON.card} ${d.hospital?.cardPrice || 0} ETB</span>
            </div>
          </div>
          <div class="doctor-chevron">${ICON.chevronRight}</div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.doctor-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        Router.navigate('doctor-detail', { id });
      });
    });
  }

  return { render };
})();

const DoctorDetailView = (() => {
  let doctor = null;
  let schedules = [];

  const ICON = {
    arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    stethoscope: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
    star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    card: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    building: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/></svg>',
    mapPin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  };

  async function render(container, params) {
    const id = params.id;
    TG.hideMainButton();

    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      doctor = await API.getAllDoctors().then(docs => docs.find(d => d.id === id));
      if (!doctor) throw new Error('Doctor not found');

      schedules = await API.getDoctorSchedules(id);
      const initials = doctor.fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

      container.innerHTML = `
        <div class="view-header">
          <button class="view-header-back" id="doc-back">
            ${ICON.arrowLeft}
            <span>Doctors</span>
          </button>
          <h1 class="view-header-title">Doctor</h1>
          <div class="view-header-spacer"></div>
        </div>

        <div class="doc-detail-header">
          <div class="avatar">
            ${doctor.profilePicture ? `<img src="${doctor.profilePicture}" alt="${doctor.fullName}" />` : `<span class="doctor-initials" style="font-size:24px">${initials}</span>`}
          </div>
          <h2>${doctor.fullName}</h2>
          <div class="specialty">${doctor.specialization || ''}</div>
          <div class="rating" style="display:flex;align-items:center;gap:4px;color:var(--text-secondary);font-size:14px">
            ${ICON.star} ${doctor.rating || '0'} (${doctor.totalReviews || 0} reviews)
          </div>
        </div>

        <div class="card">
          <div class="card-row">
            <span class="text-hint" style="display:flex;align-items:center;gap:6px">${ICON.clock} Experience</span>
            <span>${doctor.experienceYears || 0} years</span>
          </div>
          <div class="card-row">
            <span class="text-hint" style="display:flex;align-items:center;gap:6px">${ICON.card} Fee</span>
            <span>${doctor.hospital?.cardPrice || 0} ETB</span>
          </div>
          <div class="card-row">
            <span class="text-hint" style="display:flex;align-items:center;gap:6px">${ICON.building} Clinic</span>
            <span>${doctor.clinicName || 'N/A'}</span>
          </div>
          <div class="card-row">
            <span class="text-hint" style="display:flex;align-items:center;gap:6px">${ICON.mapPin} Location</span>
            <span>${doctor.clinicAddress || 'N/A'}</span>
          </div>
          ${doctor.bio ? `
          <div class="card-row" style="flex-direction:column;align-items:flex-start;gap:4px">
            <span class="text-hint">About</span>
            <span>${doctor.bio}</span>
          </div>` : ''}
        </div>

        <h3 style="font-size:16px;font-weight:600;margin:16px 0 8px">Available Schedules</h3>
        <div id="doc-schedules">
          ${schedules.length === 0
            ? '<p class="text-hint">No upcoming schedules available</p>'
            : schedules.map(s => `
              <div class="card" style="cursor:pointer" data-schedule='${JSON.stringify(s)}'>
                <div class="flex-between">
                  <span><strong>${s.date ? TimeUtils.formatDate(new Date(s.date)) : ''}</strong></span>
                  <span class="badge badge-${s.isActive ? 'accepted' : 'pending'}">${s.isActive ? 'Available' : 'Inactive'}</span>
                </div>
                <div class="text-hint mt-8">
                  ${s.startTime ? s.startTime.slice(0,5) : ''} - ${s.endTime ? s.endTime.slice(0,5) : ''}
                  ${s.clinicRoom ? `| Room ${s.clinicRoom}` : ''}
                </div>
              </div>
            `).join('')}
        </div>

        <button class="btn btn-primary mt-16" id="book-this-doctor">
          Book Appointment
        </button>
      `;

      container.querySelector('#doc-back').addEventListener('click', () => Router.goBack());

      container.querySelector('#book-this-doctor').addEventListener('click', () => {
        Router.navigate('booking', { doctorId: id, doctor });
      });
    } catch (err) {
      container.innerHTML = `
        <div class="view-header">
          <button class="view-header-back" id="doc-back">
            ${ICON.arrowLeft}
            <span>Doctors</span>
          </button>
          <h1 class="view-header-title">Error</h1>
          <div class="view-header-spacer"></div>
        </div>
        <div class="alert alert-error">${err.message}</div>
      `;
      container.querySelector('#doc-back').addEventListener('click', () => Router.goBack());
    }
  }

  return { render };
})();
