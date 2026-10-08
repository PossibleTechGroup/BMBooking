const ProfileView = (() => {
  const NOTIF_KEY = 'bm_notifications';
  const PRIVACY_KEY = 'bm_privacy';

  const DEFAULT_NOTIFICATIONS = {
    appointmentReminders: true,
    doctorMessages: true,
    healthTips: false,
  };

  const DEFAULT_PRIVACY = {
    shareMedicalHistory: true,
    showProfileToDoctors: true,
    analytics: false,
  };

  // Same set as apps/mobile/components/LanguagePicker.tsx
  const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'am', label: 'Amharic (አማርኛ)' },
    { code: 'om', label: 'Oromo (Afaan Oromoo)' },
  ];

  const ICON = {
    edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    chevronRight: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    gender: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    blood: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 8 4 12.5 4 15a8 8 0 0 0 16 0c0-2.5-2.5-7-8-13z"/></svg>',
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    doc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>',
    logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  };

  let containerRef = null;
  let patientProfile = null;
  let loadError = false;
  let langOpen = false;
  let notifications = null;
  let privacy = null;

  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadJSON(key, defaults) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return Object.assign({}, defaults);
      return Object.assign({}, defaults, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function initialsOf(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async function render(container) {
    containerRef = container;
    TG.hideMainButton();
    langOpen = false;
    patientProfile = null;
    loadError = false;
    notifications = loadJSON(NOTIF_KEY, DEFAULT_NOTIFICATIONS);
    privacy = loadJSON(PRIVACY_KEY, DEFAULT_PRIVACY);

    container.innerHTML = `
      <div class="view-header">
        <div class="bm-brand"><img src="/bm-booking.png" alt="BM" /><span class="bm-brand-title">BM</span></div>
      </div>
      <h1 class="screen-title">${esc(I18n.t('profile'))}</h1>
      <div id="profile-content">
        <div class="loading pf-loading"><div class="spinner"></div><span>${esc(I18n.t('loading'))}</span></div>
      </div>
    `;

    try {
      patientProfile = await API.getPatientProfile();
      if (patientProfile) Store.setProfile(patientProfile);
    } catch (err) {
      loadError = true;
      patientProfile = Store.getProfile();
    }

    renderBody();
  }

  function renderBody() {
    const content = containerRef && containerRef.querySelector('#profile-content');
    if (!content) return;

    const screenTitle = containerRef.querySelector('.screen-title');
    if (screenTitle) screenTitle.textContent = I18n.t('profile');

    const user = Store.getUser();
    const name = patientProfile?.fullName || user?.fullName || 'User';
    const phone = user?.phone || '';
    const dob = patientProfile?.dateOfBirth || '';
    const gender = patientProfile?.gender || '';
    const blood = patientProfile?.bloodType || '';
    const emergency = patientProfile?.emergencyContact || '';

    let dobDisplay = I18n.t('notSet');
    if (dob) {
      try {
        const dobDate = dob.includes('T') ? new Date(dob) : new Date(dob + 'T12:00:00');
        if (!isNaN(dobDate.getTime())) dobDisplay = TimeUtils.formatDate(dobDate);
      } catch (e) {}
    }

    const displayPhone = phone || I18n.t('notSet');
    const currentLang = I18n.getLanguage();
    const langLabel = (LANGS.find(l => l.code === currentLang) || LANGS[0]).label;
    const currentTimeFormat = TimeUtils.getFormat();
    const currentCalendarFormat = TimeUtils.getCalendarFormat();

    content.innerHTML = `
      ${loadError ? `<div class="alert alert-error">${esc(I18n.t('errorGeneric'))}</div>` : ''}

      <div class="profile-header">
        <div class="profile-avatar-circle">${esc(initialsOf(name))}</div>
        <div class="profile-name">${esc(name)}</div>
        <div class="profile-phone">${esc(displayPhone)}</div>
      </div>

      <div class="card">
        <button class="card-row pf-nav-row" id="pf-edit-row">
          <span class="pf-nav-left">
            ${ICON.edit}
            <span class="pf-nav-text">
              <span class="pf-nav-title">${esc(I18n.t('editProfile'))}</span>
              <span class="pf-nav-sub">${esc(I18n.t('editProfileSub'))}</span>
            </span>
          </span>
          ${ICON.chevronRight}
        </button>
      </div>

      <div class="card">
        <div class="card-section-title">${esc(I18n.t('personalInformation'))}</div>
        <div class="profile-row">
          <span class="profile-row-left">${ICON.calendar}<span class="label">${esc(I18n.t('dateOfBirth'))}</span></span>
          <span class="profile-row-value">${esc(dobDisplay)}</span>
        </div>
        <div class="profile-row">
          <span class="profile-row-left">${ICON.gender}<span class="label">${esc(I18n.t('gender'))}</span></span>
          <span class="profile-row-value">${esc(gender || I18n.t('notSet'))}</span>
        </div>
        <div class="profile-row">
          <span class="profile-row-left">${ICON.blood}<span class="label">${esc(I18n.t('bloodType'))}</span></span>
          <span class="profile-row-value">${esc(blood || I18n.t('notSet'))}</span>
        </div>
        <div class="profile-row">
          <span class="profile-row-left">${ICON.phone}<span class="label">${esc(I18n.t('emergency'))}</span></span>
          <span class="profile-row-value">${esc(emergency || I18n.t('notSet'))}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-section-title">${esc(I18n.t('preferences'))}</div>

        <div class="pref-label">${esc(I18n.t('timeFormat'))}</div>
        <div class="pref-toggle-row">
          <button class="pref-toggle ${currentTimeFormat !== 'ethiopian' ? 'active' : ''}" id="pf-time-western">
            ${ICON.clock}${esc(I18n.t('standardAmPm'))}
          </button>
          <button class="pref-toggle ${currentTimeFormat === 'ethiopian' ? 'active' : ''}" id="pf-time-ethiopian">
            ${ICON.clock}${esc(I18n.t('ethiopian'))}
          </button>
        </div>

        <div class="pref-label">${esc(I18n.t('calendar'))}</div>
        <div class="pref-toggle-row">
          <button class="pref-toggle ${currentCalendarFormat !== 'ethiopian' ? 'active' : ''}" id="pf-cal-gregorian">
            ${ICON.calendar}${esc(I18n.t('gregorian'))}
          </button>
          <button class="pref-toggle ${currentCalendarFormat === 'ethiopian' ? 'active' : ''}" id="pf-cal-ethiopian">
            ${ICON.calendar}${esc(I18n.t('ethiopian'))}
          </button>
        </div>

        <div class="pref-label">${esc(I18n.t('language'))}</div>
        <div class="pf-lang-row">
          <div class="card-row">
            <span class="pf-nav-left">
              ${ICON.globe}
              <span class="pf-nav-text">
                <span class="pf-nav-title">${esc(I18n.t('language'))}</span>
              </span>
            </span>
            <span class="lang-wrapper">
              <button class="lang-btn" id="pf-lang-toggle">
                ${ICON.globe} ${esc(langLabel)} ${ICON.chevronDown}
              </button>
              <span class="lang-dropdown ${langOpen ? 'open' : ''}" id="pf-lang-dropdown">
                ${LANGS.map(l => `
                  <button class="lang-option ${l.code === currentLang ? 'active' : ''}" data-lang="${l.code}">${esc(l.label)}</button>
                `).join('')}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-section-title">${esc(I18n.t('notifications'))}</div>
        ${switchRow('notif', 'appointmentReminders', I18n.t('appointmentReminders'), I18n.t('appointmentRemindersSub'), notifications.appointmentReminders)}
        ${switchRow('notif', 'doctorMessages', I18n.t('doctorMessages'), I18n.t('doctorMessagesSub'), notifications.doctorMessages)}
        ${switchRow('notif', 'healthTips', I18n.t('healthTips'), I18n.t('healthTipsSub'), notifications.healthTips)}
      </div>

      <div class="card">
        <div class="card-section-title">${esc(I18n.t('privacy'))}</div>
        ${switchRow('privacy', 'shareMedicalHistory', I18n.t('shareMedicalHistory'), I18n.t('shareMedicalHistorySub'), privacy.shareMedicalHistory)}
        ${switchRow('privacy', 'showProfileToDoctors', I18n.t('doctorProfileAccess'), I18n.t('doctorProfileAccessSub'), privacy.showProfileToDoctors)}
        ${switchRow('privacy', 'analytics', I18n.t('usageAnalytics'), I18n.t('usageAnalyticsSub'), privacy.analytics)}

        <div class="pref-label">${esc(I18n.t('legal'))}</div>
        <button class="card-row pf-nav-row" data-href="${esc(API.BASE)}/api/legal/privacy">
          <span class="pf-nav-left">
            ${ICON.shield}
            <span class="pf-nav-text">
              <span class="pf-nav-title">${esc(I18n.t('privacyPolicy'))}</span>
              <span class="pf-nav-sub">${esc(I18n.t('privacyPolicySub'))}</span>
            </span>
          </span>
          ${ICON.chevronRight}
        </button>
        <button class="card-row pf-nav-row" data-href="${esc(API.BASE)}/api/legal/terms">
          <span class="pf-nav-left">
            ${ICON.doc}
            <span class="pf-nav-text">
              <span class="pf-nav-title">${esc(I18n.t('termsOfService'))}</span>
              <span class="pf-nav-sub">${esc(I18n.t('termsOfServiceSub'))}</span>
            </span>
          </span>
          ${ICON.chevronRight}
        </button>
      </div>

      <div class="pf-disclaimer">
        <span class="pf-disclaimer-icon">${ICON.info}</span>
        <span class="pf-disclaimer-content">
          <span class="pf-disclaimer-title">${esc(I18n.t('disclaimerTitle'))}</span>
          <span class="pf-disclaimer-body">${esc(I18n.t('disclaimerBody'))}</span>
        </span>
      </div>

      <div class="card pf-account-card">
        <div class="card-section-title">${esc(I18n.t('accountSettings'))}</div>
        <button class="btn btn-logout" id="pf-logout-btn">
          ${ICON.logout}
          <span>${esc(I18n.t('logout'))}</span>
        </button>
      </div>

      <div class="pf-version">BM Hub v1.0.4</div>
    `;

    bindEvents(content);
  }

  function switchRow(group, key, title, subtitle, on) {
    return `
      <div class="card-row pf-switch-row">
        <span class="pf-switch-text">
          <span class="pf-switch-title">${esc(title)}</span>
          <span class="pf-switch-sub">${esc(subtitle)}</span>
        </span>
        <button class="pf-switch ${on ? 'on' : ''}" data-group="${group}" data-key="${key}"
                role="switch" aria-checked="${on ? 'true' : 'false'}" aria-label="${esc(title)}">
          <span class="pf-switch-thumb"></span>
        </button>
      </div>
    `;
  }

  function onDocumentClick() {
    if (langOpen) {
      langOpen = false;
      const dd = containerRef && containerRef.querySelector('#pf-lang-dropdown');
      if (dd) dd.classList.remove('open');
    }
  }

  function bindEvents(content) {
    const editRow = content.querySelector('#pf-edit-row');
    if (editRow) {
      editRow.addEventListener('click', () => Router.navigate('setup', { isEdit: true }));
    }

    const setTime = (format) => { TimeUtils.setFormat(format); renderBody(); };
    const setCalendar = (format) => { TimeUtils.setCalendarFormat(format); renderBody(); };

    content.querySelector('#pf-time-western')?.addEventListener('click', () => setTime('western'));
    content.querySelector('#pf-time-ethiopian')?.addEventListener('click', () => setTime('ethiopian'));
    content.querySelector('#pf-cal-gregorian')?.addEventListener('click', () => setCalendar('gregorian'));
    content.querySelector('#pf-cal-ethiopian')?.addEventListener('click', () => setCalendar('ethiopian'));

    const langToggle = content.querySelector('#pf-lang-toggle');
    const langDropdown = content.querySelector('#pf-lang-dropdown');
    if (langToggle && langDropdown) {
      langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        langOpen = !langOpen;
        langDropdown.classList.toggle('open', langOpen);
      });
      content.querySelectorAll('.lang-option').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          langOpen = false;
          I18n.setLanguage(btn.getAttribute('data-lang'));
          renderBody();
        });
      });
    }

    document.removeEventListener('click', onDocumentClick);
    document.addEventListener('click', onDocumentClick);

    content.querySelectorAll('.pf-switch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.getAttribute('data-group');
        const key = btn.getAttribute('data-key');
        if (group === 'notif') {
          notifications[key] = !notifications[key];
          saveJSON(NOTIF_KEY, notifications);
        } else {
          privacy[key] = !privacy[key];
          saveJSON(PRIVACY_KEY, privacy);
        }
        renderBody();
      });
    });

    content.querySelectorAll('[data-href]').forEach((btn) => {
      btn.addEventListener('click', () => TG.openLink(btn.getAttribute('data-href')));
    });

    content.querySelector('#pf-logout-btn')?.addEventListener('click', async () => {
      const confirmed = await TG.showConfirm(I18n.t('logoutConfirm'));
      if (confirmed) {
        Store.clearAuth();
        Router.navigate('login');
      }
    });
  }

  return { render };
})();
