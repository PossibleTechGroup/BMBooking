const AppointmentsView = (() => {
  let appointments = [];
  let loading = true;
  let filterStatus = 'all';

  async function render(container) {
    TG.hideMainButton();

    container.innerHTML = `
      <div class="header">
        <div class="header-back" id="appts-back">← Home</div>
        <h1>Appointments</h1>
        <div></div>
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

    container.querySelector('#appts-back').addEventListener('click', () => Router.navigate('home'));

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
      list.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h3>No appointments</h3><p>Book your first appointment to get started</p></div>';
      return;
    }

    list.innerHTML = filtered.map(a => `
      <div class="appointment-card">
        <div class="top">
          <span class="doctor-name">${a.doctor?.fullName || 'Doctor'}</span>
          <span class="badge badge-${a.status}">${a.status}</span>
        </div>
        <div class="detail">📅 ${a.dateTime ? TimeUtils.formatDate(new Date(a.dateTime)) : ''}</div>
        <div class="detail">⏰ ${a.dateTime ? TimeUtils.formatTime(new Date(a.dateTime)) : ''}</div>
        ${a.issueCategory ? `<div class="detail">🏷️ ${a.issueCategory}</div>` : ''}
        ${a.fee ? `<div class="detail">💰 ${a.fee} ETB ${a.isPaid ? '✅ Paid' : '❌ Unpaid'}</div>` : ''}
      </div>
    `).join('');
  }

  return { render };
})();
