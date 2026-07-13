const ProfileView = (() => {
  let patientProfile = null;
  let loading = true;

  async function render(container) {
    const user = Store.getUser();
    TG.hideMainButton();

    container.innerHTML = `
      <div class="header">
        <div class="header-back" id="profile-back">← Home</div>
        <h1>Profile</h1>
        <div></div>
      </div>
      <div id="profile-content">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    `;

    container.querySelector('#profile-back').addEventListener('click', () => Router.navigate('home'));

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

    const dobDisplay = dob
      ? (currentCalendarFormat === 'ethiopian'
          ? TimeUtils.formatEthiopianCalendarDate(new Date(`${dob}T12:00:00`), 'medium')
          : new Date(`${dob}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
      : 'Not set';

    content.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">👤</div>
        <div class="profile-name">${name}</div>
        <div class="profile-phone">${phone ? `+251${phone}` : ''}</div>
      </div>
      <div class="card">
        <div class="profile-row">
          <span class="label">Date of Birth</span>
          <span>${dobDisplay}</span>
        </div>
        <div class="profile-row">
          <span class="label">Gender</span>
          <span>${gender || 'Not set'}</span>
        </div>
        <div class="profile-row">
          <span class="label">Blood Type</span>
          <span>${blood || 'Not set'}</span>
        </div>
        <div class="profile-row">
          <span class="label">Emergency Contact</span>
          <span>${emergency || 'Not set'}</span>
        </div>
      </div>

      <div class="card mt-16">
        <div class="profile-row">
          <span class="label">Role</span>
          <span>Patient</span>
        </div>
      </div>

      <div class="card mt-16">
        <div style="padding: 4px 0 10px; font-size: 11px; font-weight: 700; color: var(--hint-color, #999); text-transform: uppercase; letter-spacing: 0.06em;">
          Time Format
        </div>
        <div style="display: flex; gap: 8px;">
          <button
            id="btn-time-western"
            style="
              flex: 1; padding: 10px 0; border-radius: 10px; border: 1.5px solid;
              font-size: 13px; font-weight: 600; cursor: pointer;
              border-color: ${currentTimeFormat !== 'ethiopian' ? 'var(--button-color, #2481cc)' : 'var(--hint-color, #ccc)'};
              background: ${currentTimeFormat !== 'ethiopian' ? 'rgba(36,129,204,0.10)' : 'transparent'};
              color: ${currentTimeFormat !== 'ethiopian' ? 'var(--button-color, #2481cc)' : 'var(--hint-color, #999)'};
            "
          >
            Standard (AM/PM)
          </button>
          <button
            id="btn-time-ethiopian"
            style="
              flex: 1; padding: 10px 0; border-radius: 10px; border: 1.5px solid;
              font-size: 13px; font-weight: 600; cursor: pointer;
              border-color: ${currentTimeFormat === 'ethiopian' ? '#7C3AED' : 'var(--hint-color, #ccc)'};
              background: ${currentTimeFormat === 'ethiopian' ? 'rgba(124,58,237,0.10)' : 'transparent'};
              color: ${currentTimeFormat === 'ethiopian' ? '#7C3AED' : 'var(--hint-color, #999)'};
            "
          >
            Ethiopian (ቀን/ሌሊት)
          </button>
        </div>

        <div style="padding: 14px 0 10px; font-size: 11px; font-weight: 700; color: var(--hint-color, #999); text-transform: uppercase; letter-spacing: 0.06em;">
          Calendar
        </div>
        <div style="display: flex; gap: 8px;">
          <button
            id="btn-cal-gregorian"
            style="
              flex: 1; padding: 10px 0; border-radius: 10px; border: 1.5px solid;
              font-size: 13px; font-weight: 600; cursor: pointer;
              border-color: ${currentCalendarFormat !== 'ethiopian' ? 'var(--button-color, #2481cc)' : 'var(--hint-color, #ccc)'};
              background: ${currentCalendarFormat !== 'ethiopian' ? 'rgba(36,129,204,0.10)' : 'transparent'};
              color: ${currentCalendarFormat !== 'ethiopian' ? 'var(--button-color, #2481cc)' : 'var(--hint-color, #999)'};
            "
          >
            Gregorian
          </button>
          <button
            id="btn-cal-ethiopian"
            style="
              flex: 1; padding: 10px 0; border-radius: 10px; border: 1.5px solid;
              font-size: 13px; font-weight: 600; cursor: pointer;
              border-color: ${currentCalendarFormat === 'ethiopian' ? '#7C3AED' : 'var(--hint-color, #ccc)'};
              background: ${currentCalendarFormat === 'ethiopian' ? 'rgba(124,58,237,0.10)' : 'transparent'};
              color: ${currentCalendarFormat === 'ethiopian' ? '#7C3AED' : 'var(--hint-color, #999)'};
            "
          >
            Ethiopian (እትዮጵያ)
          </button>
        </div>
      </div>

      <button class="btn btn-danger mt-16" id="logout-btn">Logout</button>
    `;

    // Time format toggle
    content.querySelector('#btn-time-western').addEventListener('click', () => {
      TimeUtils.setFormat('western');
      renderProfile(container);
    });
    content.querySelector('#btn-time-ethiopian').addEventListener('click', () => {
      TimeUtils.setFormat('ethiopian');
      renderProfile(container);
    });

    // Calendar format toggle
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
