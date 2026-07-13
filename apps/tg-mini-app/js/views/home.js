const HomeView = (() => {
  let doctors = [];
  let loading = true;

  function render(container) {
    const user = Store.getUser();
    TG.hideMainButton();

    container.innerHTML = `
      <div class="header">
        <h1>BM Booking</h1>
        <div style="font-size:14px;color:var(--hint);cursor:pointer" id="home-profile-btn">👤</div>
      </div>
      <p style="font-size:18px;font-weight:600;margin-bottom:16px">
        Welcome${user?.fullName ? ', ' + user.fullName.split(' ')[0] : ''} 👋
      </p>

      <div class="quick-actions">
        <div class="quick-action" id="action-doctors">
          <div class="icon">👨‍⚕️</div>
          <div class="label">Find Doctors</div>
        </div>
        <div class="quick-action" id="action-appointments">
          <div class="icon">📅</div>
          <div class="label">Appointments</div>
        </div>
        <div class="quick-action" id="action-profile">
          <div class="icon">👤</div>
          <div class="label">My Profile</div>
        </div>
        <div class="quick-action" id="action-new-booking">
          <div class="icon">➕</div>
          <div class="label">New Booking</div>
        </div>
      </div>

      <h3 style="font-size:16px;font-weight:600;margin:16px 0 12px">Featured Doctors</h3>
      <div id="featured-doctors">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    `;

    container.querySelector('#home-profile-btn').addEventListener('click', () => Router.navigate('profile'));
    container.querySelector('#action-doctors').addEventListener('click', () => Router.navigate('doctors'));
    container.querySelector('#action-appointments').addEventListener('click', () => Router.navigate('appointments'));
    container.querySelector('#action-profile').addEventListener('click', () => Router.navigate('profile'));
    container.querySelector('#action-new-booking').addEventListener('click', () => Router.navigate('doctors'));

    loadDoctors(container);
  }

  async function loadDoctors(container) {
    try {
      doctors = await API.getAllDoctors();
      const featured = doctors.slice(0, 5);
      const el = container.querySelector('#featured-doctors');

      if (featured.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="icon">👨‍⚕️</div><h3>No doctors yet</h3><p>Check back later</p></div>';
        return;
      }

      el.innerHTML = featured.map(d => `
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
