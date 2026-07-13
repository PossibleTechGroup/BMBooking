const DoctorsView = (() => {
  let allDoctors = [];
  let filteredDoctors = [];
  let searchQuery = '';

  async function render(container, params) {
    TG.hideMainButton();

    container.innerHTML = `
      <div class="header">
        <div class="header-back" id="doctors-back">← Home</div>
        <h1>Doctors</h1>
        <div></div>
      </div>
      <div class="search-bar">
        <span>🔍</span>
        <input type="text" id="doctor-search" placeholder="Search doctors..." value="${searchQuery}" />
      </div>
      <div id="doctors-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    `;

    container.querySelector('#doctors-back').addEventListener('click', () => Router.navigate('home'));

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
      list.innerHTML = '<div class="empty-state"><div class="icon">👨‍⚕️</div><h3>No doctors found</h3></div>';
      return;
    }

    list.innerHTML = filteredDoctors.map(d => `
      <div class="doctor-card" data-id="${d.id}">
        <div class="doctor-avatar">
          ${d.profilePicture ? `<img src="${d.profilePicture}" alt="${d.fullName}" />` : '👨‍⚕️'}
        </div>
        <div class="doctor-info">
          <h3>${d.fullName}</h3>
          <div class="specialty">${d.specialization || ''}</div>
          <div class="meta">
            <span>⭐ ${d.rating || '0'}</span>
            <span>${d.experienceYears || 0} yrs</span>
            <span>💰 ${d.hospital?.cardPrice || 0} ETB</span>
          </div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.doctor-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        Router.navigate('doctor-detail', { id });
      });
    });
  }

  return { render };
})();

// Doctor Detail View (inline since it's closely related)
const DoctorDetailView = (() => {
  let doctor = null;
  let schedules = [];

  async function render(container, params) {
    const id = params.id;
    TG.hideMainButton();

    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      doctor = await API.getAllDoctors().then(docs => docs.find(d => d.id === id));
      if (!doctor) throw new Error('Doctor not found');

      schedules = await API.getDoctorSchedules(id);

      container.innerHTML = `
        <div class="header">
          <div class="header-back" id="doc-back">← Doctors</div>
          <h1>Doctor</h1>
          <div></div>
        </div>

        <div class="doc-detail-header">
          <div class="avatar">
            ${doctor.profilePicture ? `<img src="${doctor.profilePicture}" alt="${doctor.fullName}" />` : '👨‍⚕️'}
          </div>
          <h2>${doctor.fullName}</h2>
          <div class="specialty">${doctor.specialization || ''}</div>
          <div class="rating">⭐ ${doctor.rating || '0'} (${doctor.totalReviews || 0} reviews)</div>
        </div>

        <div class="card">
          <div class="card-row">
            <span class="text-hint">Experience</span>
            <span>${doctor.experienceYears || 0} years</span>
          </div>
          <div class="card-row">
            <span class="text-hint">Fee</span>
            <span>💰 ${doctor.hospital?.cardPrice || 0} ETB</span>
          </div>
          <div class="card-row">
            <span class="text-hint">Clinic</span>
            <span>${doctor.clinicName || 'N/A'}</span>
          </div>
          <div class="card-row">
            <span class="text-hint">Location</span>
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

      container.querySelector('#doc-back').addEventListener('click', () => Router.navigate('doctors'));

      container.querySelector('#book-this-doctor').addEventListener('click', () => {
        Router.navigate('booking', { doctorId: id, doctor });
      });
    } catch (err) {
      container.innerHTML = `
        <div class="header">
          <div class="header-back" id="doc-back">← Doctors</div>
          <h1>Error</h1>
          <div></div>
        </div>
        <div class="alert alert-error">${err.message}</div>
      `;
      container.querySelector('#doc-back').addEventListener('click', () => Router.navigate('doctors'));
    }
  }

  return { render };
})();
