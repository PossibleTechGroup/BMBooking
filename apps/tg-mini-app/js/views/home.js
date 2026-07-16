const HomeView = (() => {
  let doctors = [];
  let loading = true;

  const ICON = {
    user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    stethoscope: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
    calendar: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>',
    equipment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/><line x1="12" y1="11" x2="12" y2="17"/></svg>',
    plus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    star: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    card: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  };

  function render(container) {
    const user = Store.getUser();
    TG.hideMainButton();

    const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

    const langLabel = I18n.getLanguages().find(l => l.code === I18n.getLanguage())?.label || 'EN';
    const languages = I18n.getLanguages();
    const currentLang = I18n.getLanguage();

    container.innerHTML = `
      <div class="view-header">
        <div class="lang-wrapper">
          <button class="lang-btn" id="lang-toggle">
            ${ICON.globe} ${langLabel} ${ICON.chevronDown}
          </button>
          <div class="lang-dropdown" id="lang-dropdown">
            ${languages.map(l => `
              <button class="lang-option${l.code === currentLang ? ' active' : ''}" data-lang="${l.code}">
                ${l.label}
              </button>
            `).join('')}
          </div>
        </div>
        <h1 class="view-header-title">BM Booking</h1>
        <button class="view-header-icon" id="home-profile-btn">
          ${ICON.user}
        </button>
      </div>
      <p class="home-greeting">${I18n.t('welcomeBack')} <strong>${firstName}</strong></p>

      <div class="quick-actions">
        <div class="quick-action" id="action-doctors">
          <div class="quick-action-icon">${ICON.stethoscope}</div>
          <div class="label">${I18n.t('findDoctors')}</div>
        </div>
        <div class="quick-action" id="action-appointments">
          <div class="quick-action-icon">${ICON.calendar}</div>
          <div class="label">${I18n.t('appointments')}</div>
        </div>
        <div class="quick-action" id="action-equipment">
          <div class="quick-action-icon">${ICON.equipment}</div>
          <div class="label">${I18n.t('equipment')}</div>
        </div>
        <div class="quick-action" id="action-profile">
          <div class="quick-action-icon">${ICON.user}</div>
          <div class="label">${I18n.t('myProfile')}</div>
        </div>
      </div>

      <h3 class="section-title">${I18n.t('featuredDoctors')}</h3>
      <div id="featured-doctors">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    `;

    container.querySelector('#home-profile-btn').addEventListener('click', () => Router.navigate('profile'));
    container.querySelector('#action-doctors').addEventListener('click', () => Router.navigate('doctors'));
    container.querySelector('#action-appointments').addEventListener('click', () => Router.navigate('appointments'));
    container.querySelector('#action-equipment').addEventListener('click', () => Router.navigate('equipment'));
    container.querySelector('#action-profile').addEventListener('click', () => Router.navigate('profile'));

    // Language dropdown
    const langToggle = container.querySelector('#lang-toggle');
    const langDropdown = container.querySelector('#lang-dropdown');
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('open');
    });
    container.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        I18n.setLanguage(btn.dataset.lang);
        langDropdown.classList.remove('open');
        render(container);
      });
    });
    document.addEventListener('click', () => langDropdown.classList.remove('open'));

    loadDoctors(container);
  }

  async function loadDoctors(container) {
    try {
      doctors = await API.getAllDoctors();
      const featured = doctors.slice(0, 5);
      const el = container.querySelector('#featured-doctors');

      if (featured.length === 0) {
        el.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">${ICON.stethoscope}</div>
            <h3>${I18n.t('noDoctorsAvailable')}</h3>
            <p>${I18n.t('checkBackLater')}</p>
          </div>`;
        return;
      }

      el.innerHTML = featured.map(d => {
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

      el.querySelectorAll('.doctor-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = parseInt(card.dataset.id);
          Router.navigate('doctor-detail', { id });
        });
      });
    } catch (err) {
      const el = container.querySelector('#featured-doctors');
      el.innerHTML = `<div class="alert alert-error">Failed to load doctors: ${err.message}</div>`;
    }
  }

  return { render };
})();
