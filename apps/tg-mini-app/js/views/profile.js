const ProfileView = (() => {
  let patientProfile = null;
  let loading = true;

  const ICON = {
    arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    user: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    gender: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    blood: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 8 4 12.5 4 15a8 8 0 0 0 16 0c0-2.5-2.5-7-8-13z"/></svg>',
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  };

  async function render(container) {
    TG.hideMainButton();

    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="profile-back">
          ${ICON.arrowLeft}
          <span>Home</span>
        </button>
        <h1 class="view-header-title">Profile</h1>
        <button class="view-header-icon" id="profile-edit-btn">
          ${ICON.edit}
        </button>
      </div>
      <div id="profile-content">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    `;

    container.querySelector('#profile-back').addEventListener('click', () => Router.goBack());
    container.querySelector('#profile-edit-btn').addEventListener('click', () => Router.navigate('setup', { isEdit: true }));

    try {
      patientProfile = await API.getPatientProfile();
      loading = false;
      renderProfile(container);
    } catch (err) {
      loading = false;
      patientProfile = null;
      renderProfile(container);
    }
  }

  function renderProfile(container) {
    const user = Store.getUser();
    const content = container.querySelector('#profile-content');

    const name = patientProfile?.fullName || user?.fullName || 'Patient';
    const phone = user?.phone || '';
    const dob = patientProfile?.dateOfBirth || '';
    const gender = patientProfile?.gender || '';
    const blood = patientProfile?.bloodType || '';
    const emergency = patientProfile?.emergencyContact || '';

    const currentTimeFormat = TimeUtils.getFormat();
    const currentCalendarFormat = TimeUtils.getCalendarFormat();

    let dobDisplay = 'Not set';
    if (dob) {
      try {
        const dobDate = dob.includes('T') ? new Date(dob) : new Date(dob + 'T12:00:00');
        if (!isNaN(dobDate.getTime())) {
          dobDisplay = currentCalendarFormat === 'ethiopian'
            ? TimeUtils.formatEthiopianCalendarDate(dobDate, 'medium')
            : dobDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      } catch (e) {}
    }

    const displayPhone = phone
      ? (phone.startsWith('+251') ? phone : `+251${phone}`)
      : 'Not set';

    content.innerHTML = `
      <div class="profile-header">
        <div class="profile-name">${name}</div>
        <div class="profile-phone">${displayPhone}</div>
      </div>

      <div class="card">
        <div class="card-section-title">Personal Information</div>
        <div class="profile-row">
          <span class="profile-row-left">
            ${ICON.calendar}
            <span class="label">Date of Birth</span>
          </span>
          <span class="profile-row-value">${dobDisplay}</span>
        </div>
        <div class="profile-row">
          <span class="profile-row-left">
            ${ICON.gender}
            <span class="label">Gender</span>
          </span>
          <span class="profile-row-value">${gender || 'Not set'}</span>
        </div>
        <div class="profile-row">
          <span class="profile-row-left">
            ${ICON.blood}
            <span class="label">Blood Type</span>
          </span>
          <span class="profile-row-value">${blood || 'Not set'}</span>
        </div>
        <div class="profile-row">
          <span class="profile-row-left">
            ${ICON.phone}
            <span class="label">Emergency</span>
          </span>
          <span class="profile-row-value">${emergency || 'Not set'}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-section-title">Preferences</div>

        <div class="pref-label">Time Format</div>
        <div class="pref-toggle-row">
          <button
            id="btn-time-western"
            class="pref-toggle ${currentTimeFormat !== 'ethiopian' ? 'active' : ''}"
          >
            <span>${ICON.clock}</span>
            Standard (AM/PM)
          </button>
          <button
            id="btn-time-ethiopian"
            class="pref-toggle ${currentTimeFormat === 'ethiopian' ? 'active' : ''}"
          >
            <span>${ICON.clock}</span>
            Ethiopian
          </button>
        </div>

        <div class="pref-label">Calendar</div>
        <div class="pref-toggle-row">
          <button
            id="btn-cal-gregorian"
            class="pref-toggle ${currentCalendarFormat !== 'ethiopian' ? 'active' : ''}"
          >
            <span>${ICON.calendar}</span>
            Gregorian
          </button>
          <button
            id="btn-cal-ethiopian"
            class="pref-toggle ${currentCalendarFormat === 'ethiopian' ? 'active' : ''}"
          >
            <span>${ICON.calendar}</span>
            Ethiopian
          </button>
        </div>
      </div>

      <button class="btn btn-logout" id="logout-btn">
        ${ICON.logout}
        <span>Logout</span>
      </button>
    `;

    content.querySelector('#btn-time-western').addEventListener('click', () => {
      TimeUtils.setFormat('western');
      renderProfile(container);
    });
    content.querySelector('#btn-time-ethiopian').addEventListener('click', () => {
      TimeUtils.setFormat('ethiopian');
      renderProfile(container);
    });

    content.querySelector('#btn-cal-gregorian').addEventListener('click', () => {
      TimeUtils.setCalendarFormat('gregorian');
      renderProfile(container);
    });
    content.querySelector('#btn-cal-ethiopian').addEventListener('click', () => {
      TimeUtils.setCalendarFormat('ethiopian');
      renderProfile(container);
    });

    content.querySelector('#logout-btn').addEventListener('click', async () => {
      const confirmed = await TG.showConfirm('Are you sure you want to logout?');
      if (confirmed) {
        Store.clearAuth();
        Router.navigate('login');
      }
    });
  }

  return { render };
})();
