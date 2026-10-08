const AppointmentsView = (() => {
  const STATUS_TABS = ['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled'];

  let appointments = [];
  let loading = true;
  let loadError = null;
  let filterStatus = 'all';
  let containerRef = null;

  let reviewAppointment = null;
  let reviewTarget = 'doctor';
  let reviewRating = 5;
  let reviewSubmitting = false;

  const ICON = {
    user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    refresh: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>',
    calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    calendarEmpty: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    location: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    person: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.2 18.7a6.5 6.5 0 0 1 11.6 0"/></svg>',
    navigate: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    building: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    card: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    people: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    star: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    starOutline: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    starSm: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>',
  };

  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function t(key, fallback) {
    const value = I18n.t(key);
    if (!value || value === key) return fallback || key;
    return value;
  }

  function getInitials(name) {
    if (!name) return 'DR';
    return name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  function normalizeStatus(status) {
    let s = String(status || 'pending').toLowerCase();
    if (s === 'confirmed') s = 'accepted';
    return s;
  }

  function badgeClass(status) {
    const s = normalizeStatus(status);
    return ['pending', 'accepted', 'completed', 'declined', 'cancelled'].includes(s)
      ? `badge badge-${s}`
      : 'badge';
  }

  function mapsUrl(hospital) {
    if (typeof hospital.latitude !== 'number' || typeof hospital.longitude !== 'number') return '';
    const q = encodeURIComponent(hospital.name || `${hospital.latitude},${hospital.longitude}`);
    return `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}&query_place=${q}`;
  }

  async function render(container) {
    TG.hideMainButton();
    containerRef = container;
    filterStatus = 'all';
    appointments = [];
    loading = true;
    loadError = null;

    container.innerHTML = `
      <div class="view-header">
        <div class="bm-brand"><img src="/bm-booking.png" alt="BM" /><span class="bm-brand-title">BM</span></div>
        <div class="view-header-actions">
          <button class="view-header-icon" id="appts-refresh" aria-label="${esc(t('refresh', 'Refresh'))}">${ICON.refresh}</button>
          <button class="view-header-icon" id="appts-profile-btn">${ICON.user}</button>
        </div>
      </div>
      <h1 class="screen-title">${esc(t('myAppointments', 'My Appointments'))}</h1>
      <div class="sub-tabs appt-status-tabs" id="appt-status-tabs">
        ${STATUS_TABS.map(s => `
          <button class="sub-tab ${filterStatus === s ? 'active' : ''}" data-filter="${s}">${esc(t(s))}</button>
        `).join('')}
      </div>
      <div id="appointments-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
      <div class="appt-disclaimer">
        <span class="appt-disclaimer-icon">${ICON.info}</span>
        <span class="appt-disclaimer-content">
          <span class="appt-disclaimer-title">${esc(t('disclaimerTitle', 'Medical Disclaimer'))}</span>
          <span class="appt-disclaimer-body">${esc(t('disclaimerBody', 'BM Booking is strictly an appointment booking platform for physical healthcare facilities. We do not provide medical advice, diagnosis, or clinical treatments. Always consult a qualified physician for any health questions.'))}</span>
        </span>
      </div>
      <div class="appt-modal" id="appt-review-modal" aria-hidden="true">
        <div class="appt-modal-overlay" id="appt-review-overlay"></div>
        <div class="appt-modal-card">
          <div class="appt-modal-header">
            <h3>${esc(t('rateExperience', 'Rate your Experience'))}</h3>
            <button class="appt-modal-close" id="appt-review-close" aria-label="Close">${ICON.close}</button>
          </div>
          <div class="appt-modal-body">
            <p class="appt-modal-prompt" id="appt-review-prompt"></p>
            <div class="appt-stars" id="appt-stars"></div>
            <div class="input-field appt-comment-field">
              <textarea id="appt-comment" rows="3" placeholder="${esc(t('shareDetails', 'Share details of your visit (optional)...'))}"></textarea>
            </div>
            <button class="btn btn-primary" id="appt-submit-review">${esc(t('submitReview', 'Submit Review'))}</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#appts-profile-btn').addEventListener('click', () => Router.navigate('profile'));
    container.querySelector('#appts-refresh').addEventListener('click', () => fetchAppointments(true));

    container.querySelectorAll('[data-filter]').forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        if (filter === filterStatus) return;
        filterStatus = filter;
        container.querySelectorAll('[data-filter]').forEach(el => el.classList.toggle('active', el === tab));
        renderList();
        // APK keeps a pull-to-refresh on this screen: re-sync whenever the filter changes.
        fetchAppointments(false);
      });
    });

    const list = container.querySelector('#appointments-list');
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const apt = appointments.find(a => a.id === id);
      if (!apt) return;
      if (btn.dataset.action === 'cancel') handleCancel(apt);
      if (btn.dataset.action === 'rate') openReview(apt, btn.dataset.target);
    });

    container.querySelector('#appt-review-close').addEventListener('click', closeReview);
    container.querySelector('#appt-review-overlay').addEventListener('click', closeReview);
    container.querySelector('#appt-submit-review').addEventListener('click', submitReview);
    container.querySelector('#appt-stars').addEventListener('click', (e) => {
      const star = e.target.closest('[data-rating]');
      if (!star || reviewSubmitting) return;
      reviewRating = Number(star.dataset.rating);
      renderStars();
    });

    await fetchAppointments(true);
  }

  async function fetchAppointments(showSpinner) {
    const refreshBtn = containerRef && containerRef.querySelector('#appts-refresh');
    if (showSpinner) {
      loading = true;
      if (refreshBtn) refreshBtn.classList.add('spinning');
      renderList();
    }
    try {
      const data = await API.getMyAppointments();
      appointments = Array.isArray(data) ? data : [];
      loadError = null;
    } catch (err) {
      loadError = err.message || t('error', 'Error');
    } finally {
      loading = false;
      if (refreshBtn) refreshBtn.classList.remove('spinning');
      renderList();
    }
  }

  function renderList() {
    if (!containerRef) return;
    const list = containerRef.querySelector('#appointments-list');
    if (!list) return;

    if (loading && appointments.length === 0) {
      list.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      return;
    }

    const filtered = filterStatus === 'all'
      ? appointments
      : appointments.filter(a => normalizeStatus(a.status) === filterStatus);

    let html = '';

    if (loadError) {
      html += `<div class="alert alert-error">${esc(loadError)}</div>
        <button class="btn btn-outline btn-sm appt-retry" id="appt-retry">${esc(t('tryAgain', 'Try Again'))}</button>`;
    }

    if (filtered.length === 0) {
      if (!loadError) {
        html += `
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.calendarEmpty}</div>
          <h3>${esc(t('noAppointments', 'No appointments'))}</h3>
          <p>${esc(t('bookFirstAppointment', 'Book your first appointment to get started'))}</p>
          <button class="btn btn-primary appt-empty-cta" id="appt-find-doctors">${esc(t('findDoctors', 'Find Doctors'))}</button>
        </div>`;
      }
    } else {
      html += filtered.map(cardHtml).join('');
    }

    list.innerHTML = html;

    const retryBtn = list.querySelector('#appt-retry');
    if (retryBtn) retryBtn.addEventListener('click', () => fetchAppointments(true));
    const findBtn = list.querySelector('#appt-find-doctors');
    if (findBtn) findBtn.addEventListener('click', () => Router.navigate('doctors'));
  }

  function cardHtml(a) {
    const doctor = a.doctor || {};
    const hospital = doctor.hospital || {};
    const userId = (Store.getUser() || {}).id;
    const status = normalizeStatus(a.status);
    const hospitalName = hospital.name || doctor.clinicName || t('clinic', 'Clinic');
    const regPhone = hospital.phone || '';
    const receptionPhone = hospital.receptionistPhone || '';
    const address = hospital.address || '';
    const maps = mapsUrl(hospital);
    const date = a.dateTime ? new Date(a.dateTime) : new Date();
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    const timeStr = TimeUtils.formatTime(date);
    const specialty = doctor.specialization || doctor.specializations?.join(', ') || t('generalDoctor', 'General Doctor');
    const doctorName = doctor.fullName || t('doctor', 'Doctor');
    const fee = a.fee !== undefined && a.fee !== null && a.fee !== '' ? Number(a.fee) || a.fee : null;
    const forName = a.bookedBy && a.bookedBy.id === userId && a.patient?.patientProfile?.fullName
      ? a.patient.patientProfile.fullName
      : '';
    const avatar = doctor.profilePicture
      ? `<img src="${esc(doctor.profilePicture)}" alt="${esc(doctorName)}" onerror="this.outerHTML='<span>${esc(getInitials(doctorName))}</span>'" />`
      : esc(getInitials(doctorName));

    return `
      <div class="appointment-card appt-card">
        <div class="top">
          <div class="appt-head">
            <span class="appt-avatar">${avatar}</span>
            <div class="appt-head-text">
              <span class="doctor-name">${esc(doctorName)}</span>
              <span class="appt-specialty">${esc(specialty)}</span>
            </div>
          </div>
          <span class="${badgeClass(a.status)}">${esc(t(status, a.status))}</span>
        </div>

        <div class="appt-datetime">
          <span class="meta-item">${ICON.calendar} ${esc(dateStr)}</span>
          <span class="meta-item">${ICON.clock} ${esc(timeStr)}</span>
        </div>

        ${a.reason ? `<div class="appt-reason">${esc(a.reason)}</div>` : ''}

        <div class="appt-divider"></div>

        <div class="appt-hospital">${ICON.building} <span>${esc(hospitalName)}</span></div>

        ${address ? `<div class="detail appt-row">${ICON.location} ${esc(address)}</div>` : ''}

        ${regPhone ? `
          <a class="detail appt-row appt-call-row" href="tel:${esc(regPhone)}">
            ${ICON.phone}
            <span class="appt-call-label">${esc(t('registration', 'Registration'))}: ${esc(regPhone)}</span>
            <span class="appt-call-badge">${ICON.phone}</span>
          </a>` : ''}

        ${receptionPhone ? `
          <a class="detail appt-row appt-call-row" href="tel:${esc(receptionPhone)}">
            ${ICON.person}
            <span class="appt-call-label">${esc(t('reception', 'Reception'))}: ${esc(receptionPhone)}</span>
            <span class="appt-call-badge">${ICON.phone}</span>
          </a>` : ''}

        ${fee !== null ? `
          <div class="detail appt-row appt-fee">
            ${ICON.card} <span>${esc(fee)} ${esc(t('etb', 'ETB'))}</span>
            <span class="appt-pay ${a.isPaid ? 'appt-pay-yes' : 'appt-pay-no'}">
              ${a.isPaid ? ICON.check : ICON.x} ${esc(a.isPaid ? t('paid', 'Paid') : t('unpaid', 'Unpaid'))}
            </span>
          </div>` : ''}

        ${(regPhone || maps) ? `
          <div class="appt-actions">
            ${regPhone ? `<a class="btn btn-outline btn-sm" href="tel:${esc(regPhone)}">${ICON.phone} ${esc(t('callHospital', 'Call Hospital'))}</a>` : ''}
            ${maps ? `<a class="btn btn-outline btn-sm" href="${esc(maps)}" target="_blank" rel="noopener">${ICON.navigate} ${esc(t('directions', 'Directions'))}</a>` : ''}
          </div>` : ''}

        ${forName ? `
          <div class="appt-for">
            ${ICON.people} <span>${esc(t('for', 'For'))}: ${esc(forName)}</span>
          </div>` : ''}

        ${status === 'pending' ? `
          <div class="appt-actions">
            <button class="btn btn-outline btn-sm" data-action="cancel" data-id="${a.id}">${esc(t('cancel', 'Cancel'))}</button>
          </div>` : ''}

        ${status === 'completed' ? `
          <div class="appt-actions">
            <button class="btn btn-primary btn-sm" data-action="rate" data-target="doctor" data-id="${a.id}">
              ${ICON.starSm} ${esc(t('rateDoctor', 'Rate Doctor'))}
            </button>
            ${hospital.id ? `
              <button class="btn btn-outline btn-sm" data-action="rate" data-target="hospital" data-id="${a.id}">
                ${ICON.building} ${esc(t('rateHospital', 'Rate Hospital'))}
              </button>` : ''}
          </div>` : ''}
      </div>
    `;
  }

  async function handleCancel(apt) {
    const message = `${t('confirmCancel', 'Cancel Appointment')}\n${t('confirmCancelMsg', 'Are you sure you want to cancel this appointment?')}`;
    const confirmed = await TG.showConfirm(message);
    if (!confirmed) return;
    try {
      await API.cancelAppointment(apt.id);
      await fetchAppointments(false);
    } catch (err) {
      TG.showAlert(err.message || t('failedToCancel', 'Failed to cancel appointment'));
    }
  }

  function openReview(apt, target) {
    if (!containerRef) return;
    const modal = containerRef.querySelector('#appt-review-modal');
    const prompt = containerRef.querySelector('#appt-review-prompt');
    if (!modal || !prompt) return;
    reviewAppointment = apt;
    reviewTarget = target === 'hospital' ? 'hospital' : 'doctor';
    reviewRating = 5;
    const comment = containerRef.querySelector('#appt-comment');
    if (comment) comment.value = '';
    prompt.textContent = reviewTarget === 'hospital'
      ? t('howWasHospital', 'How was your experience with the hospital?')
      : t('howWasDoctor', 'How was your experience with the doctor?');
    renderStars();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeReview() {
    const modal = containerRef && containerRef.querySelector('#appt-review-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    reviewAppointment = null;
    if (reviewSubmitting) {
      reviewSubmitting = false;
      const btn = containerRef.querySelector('#appt-submit-review');
      if (btn) {
        btn.disabled = false;
        btn.textContent = t('submitReview', 'Submit Review');
      }
    }
  }

  function renderStars() {
    const wrap = containerRef.querySelector('#appt-stars');
    if (!wrap) return;
    wrap.innerHTML = [1, 2, 3, 4, 5].map(n => `
      <button class="appt-star ${n <= reviewRating ? 'active' : ''}" data-rating="${n}"
        aria-label="${n}" type="button">${n <= reviewRating ? ICON.star : ICON.starOutline}</button>
    `).join('');
  }

  async function submitReview() {
    const apt = reviewAppointment;
    if (!apt || reviewSubmitting) return;
    const hospital = (apt.doctor || {}).hospital || {};
    const commentEl = containerRef.querySelector('#appt-comment');
    const comment = commentEl ? commentEl.value.trim() : '';
    const body = { rating: reviewRating, appointmentId: apt.id };
    if (comment) body.comment = comment;
    if (reviewTarget === 'hospital') {
      if (!hospital.id) return;
      body.hospitalId = hospital.id;
    } else {
      body.doctorId = apt.doctorId;
    }

    const btn = containerRef.querySelector('#appt-submit-review');
    reviewSubmitting = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('loading', 'Loading...');
    }

    try {
      await API.createReview(body);
      closeReview();
      TG.showAlert(t('reviewSubmitted', 'Review submitted'));
      fetchAppointments(false);
    } catch (err) {
      TG.showAlert(err.message || t('error', 'Error'));
      if (btn) {
        btn.disabled = false;
        btn.textContent = t('submitReview', 'Submit Review');
      }
    } finally {
      reviewSubmitting = false;
    }
  }

  return { render };
})();
