const AppointmentsView = (() => {
  let appointments = [];
  let loading = true;
  let filterStatus = 'all';

  const ICON = {
    arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    tag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    phone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    building: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    card: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--success)"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--danger)"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    stethoscope: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
  };

  async function render(container) {
    TG.hideMainButton();

    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="appts-back">
          ${ICON.arrowLeft}
          <span>Home</span>
        </button>
        <h1 class="view-header-title">Appointments</h1>
        <div class="view-header-spacer"></div>
      </div>
      <div class="sub-tabs" id="status-tabs">
        ${['all', 'pending', 'accepted', 'completed', 'declined'].map(s =>
          `<div class="sub-tab ${filterStatus === s ? 'active' : ''}" data-filter="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</div>`
        ).join('')}
      </div>
      <div id="appointments-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    `;

    container.querySelector('#appts-back').addEventListener('click', () => Router.goBack());

    container.querySelectorAll('[data-filter]').forEach(tab => {
      tab.addEventListener('click', () => {
        filterStatus = tab.dataset.filter;
        container.querySelectorAll('[data-filter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderList(container);
      });
    });

    try {
      appointments = await API.getMyAppointments();
      loading = false;
      renderList(container);
    } catch (err) {
      loading = false;
      container.querySelector('#appointments-list').innerHTML =
        `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  function renderList(container) {
    const list = container.querySelector('#appointments-list');
    const filtered = filterStatus === 'all'
      ? appointments
      : appointments.filter(a => a.status === filterStatus);

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.stethoscope}</div>
          <h3>No appointments</h3>
          <p>Book your first appointment to get started</p>
        </div>`;
      return;
    }

    list.innerHTML = filtered.map(a => `
      <div class="appointment-card">
        <div class="top">
          <span class="doctor-name">${a.doctor?.fullName || 'Doctor'}</span>
          <span class="badge badge-${a.status}">${a.status}</span>
        </div>
        <div class="detail" style="display:flex;align-items:center;gap:6px">
          ${ICON.calendar}
          ${a.dateTime ? TimeUtils.formatDate(new Date(a.dateTime)) : ''}
        </div>
        <div class="detail" style="display:flex;align-items:center;gap:6px">
          ${ICON.clock}
          ${a.dateTime ? TimeUtils.formatTime(new Date(a.dateTime)) : ''}
        </div>
        ${a.issueCategory ? `<div class="detail" style="display:flex;align-items:center;gap:6px">${ICON.tag} ${a.issueCategory}</div>` : ''}
        ${a.fee ? `<div class="detail" style="display:flex;align-items:center;gap:6px">${ICON.card} ${a.fee} ETB ${a.isPaid ? `${ICON.check} Paid` : `${ICON.x} Unpaid`}</div>` : ''}
        ${a.doctor?.hospital?.name ? `<div class="detail" style="display:flex;align-items:center;gap:6px;font-weight:600">${ICON.building} ${a.doctor.hospital.name}</div>` : ''}
        ${a.doctor?.hospital?.address ? `<div class="detail" style="display:flex;align-items:center;gap:6px;color:var(--text-secondary)">${a.doctor.hospital.phone ? ICON.phone : ''} ${a.doctor.hospital.address}</div>` : ''}
        ${a.doctor?.hospital?.phone ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:6px">${ICON.phone} Registration: ${a.doctor.hospital.phone}</span>
          <a class="btn btn-outline btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:5px" href="tel:${a.doctor.hospital.phone}">${ICON.phone} Call</a>
        </div>` : ''}
        ${a.doctor?.hospital?.receptionistPhone ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:6px">${ICON.phone} Reception: ${a.doctor.hospital.receptionistPhone}</span>
          <a class="btn btn-outline btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:5px" href="tel:${a.doctor.hospital.receptionistPhone}">${ICON.phone} Call</a>
        </div>` : ''}
      </div>
    `).join('');
  }

  return { render };
})();
