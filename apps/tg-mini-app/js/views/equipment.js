const EquipmentView = (() => {
  let state = {
    step: 'list',
    searchQuery: '',
    equipment: [],
    categories: [],
    selectedCategory: null,
    selectedEquipment: null,
    date: '',
    availableSlots: [],
    selectedSlot: null,
    notes: '',
    totalPayable: 0,
    paymentDone: false,
    loading: false,
    error: null,
    createdBooking: null,
  };

  const ICON = {
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    location: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  };

  const CATEGORY_LABELS = {
    MRI: 'MRI', CT_SCAN: 'CT Scan', DIALYSIS: 'Dialysis',
    ULTRASOUND: 'Ultrasound', XRAY: 'X-Ray', VENTILATOR: 'Ventilator',
    ECG: 'ECG', MAMMOGRAPHY: 'Mammography', DEFIBRILLATOR: 'Defibrillator', OTHER: 'Other',
  };

  function reset() {
    state = {
      step: 'list', searchQuery: '', equipment: [], categories: [],
      selectedCategory: null, selectedEquipment: null, date: '',
      availableSlots: [], selectedSlot: null, notes: '', totalPayable: 0,
      paymentDone: false, loading: false, error: null, createdBooking: null,
    };
  }

  function render(container) {
    reset();
    TG.hideMainButton();
    renderList(container);
  }

  async function renderList(container) {
    state.step = 'list';
    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-back">${ICON.back} Home</button>
        <h1 class="view-header-title">Equipment</h1>
        <div class="view-header-spacer"></div>
      </div>
      <div class="search-bar">
        ${ICON.search}
        <input type="text" id="eq-search" placeholder="Search equipment..." value="${state.searchQuery}" />
      </div>
      <div id="eq-categories" class="sub-tabs mb-16"></div>
      <div id="eq-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    `;

    container.querySelector('#eq-back').addEventListener('click', () => Router.goBack());
    container.querySelector('#eq-search').addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
    });
    container.querySelector('#eq-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadEquipment(container);
    });

    try {
      state.categories = await API.getEquipmentCategories();
      const catEl = container.querySelector('#eq-categories');
      catEl.innerHTML = `
        <div class="sub-tab ${!state.selectedCategory ? 'active' : ''}" data-cat="">All</div>
        ${state.categories.map(c => `
          <div class="sub-tab ${state.selectedCategory === c.category ? 'active' : ''}" data-cat="${c.category}">
            ${CATEGORY_LABELS[c.category] || c.category} (${c._count.id})
          </div>
        `).join('')}
      `;
      catEl.querySelectorAll('[data-cat]').forEach(tab => {
        tab.addEventListener('click', () => {
          state.selectedCategory = tab.dataset.cat || null;
          catEl.querySelectorAll('[data-cat]').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          loadEquipment(container);
        });
      });
    } catch {}

    loadEquipment(container);
  }

  async function loadEquipment(container) {
    const el = container.querySelector('#eq-list');
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      state.equipment = await API.searchEquipment({
        query: state.searchQuery || undefined,
        category: state.selectedCategory || undefined,
      });

      if (state.equipment.length === 0) {
        el.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">${ICON.search}</div>
            <h3>No equipment found</h3>
            <p>Try a different search or category</p>
          </div>
        `;
        return;
      }

      el.innerHTML = state.equipment.map(item => `
        <div class="doctor-card" data-id="${item.id}">
          <div class="doctor-avatar" style="background:var(--secondary-bg)">
            <span style="font-size:11px;font-weight:600;color:var(--link);text-align:center;line-height:1.2">${CATEGORY_LABELS[item.category] || item.category}</span>
          </div>
          <div class="doctor-info">
            <h3>${item.name}</h3>
            <div class="specialty">${item.hospital?.name || ''}</div>
            <div class="meta">
              ${item.hospital?.address ? `<span class="meta-item">${ICON.location} ${item.hospital.address.substring(0, 30)}</span>` : ''}
            </div>
          </div>
          <div class="doctor-chevron">${ICON.chevronRight}</div>
        </div>
      `).join('');

      el.querySelectorAll('.doctor-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = parseInt(card.dataset.id);
          const item = state.equipment.find(e => e.id === id);
          if (item) renderDetail(container, item);
        });
      });
    } catch (err) {
      el.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  function renderDetail(container, item) {
    state.step = 'detail';
    state.selectedEquipment = item;
    state.totalPayable = item.dailyRate ? parseFloat(item.dailyRate) : 0;

    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-detail-back">${ICON.back} Back</button>
        <h1 class="view-header-title">Equipment</h1>
        <div class="view-header-spacer"></div>
      </div>
      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div class="doctor-avatar" style="background:var(--secondary-bg);width:48px;height:48px">
            <span style="font-size:10px;font-weight:600;color:var(--link)">${CATEGORY_LABELS[item.category] || item.category}</span>
          </div>
          <div>
            <h2 style="font-size:18px;font-weight:700">${item.name}</h2>
            <div class="specialty" style="font-size:13px;color:var(--hint)">${item.hospital?.name || ''}</div>
          </div>
        </div>
        ${item.description ? `<p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">${item.description}</p>` : ''}
        <div class="card-row">
          <span class="text-hint">Status</span>
          <span class="badge ${item.isOperational ? 'badge-completed' : 'badge-declined'}">${item.isOperational ? 'Operational' : 'Unavailable'}</span>
        </div>
        ${item.dailyRate ? `
        <div class="card-row">
          <span class="text-hint">Daily Rate</span>
          <span><strong>${item.dailyRate} ETB</strong></span>
        </div>` : ''}
        ${item.hospital?.address ? `
        <div class="card-row">
          <span class="text-hint">Location</span>
          <span>${item.hospital.address}</span>
        </div>` : ''}
      </div>

      <div class="card mt-8">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">Book This Equipment</h3>
        <div class="input-group">
          <label>Select Date</label>
          <div class="input-field">
            <input type="date" id="eq-date" min="${new Date().toISOString().split('T')[0]}" value="${state.date}" />
          </div>
        </div>
        <div class="input-group">
          <label>Notes (optional)</label>
          <div class="input-field">
            <textarea id="eq-notes" placeholder="Any additional notes..." rows="2">${state.notes}</textarea>
          </div>
        </div>
        ${state.totalPayable > 0 ? `
        <div class="payment-row total">
          <span>Total</span>
          <span>${state.totalPayable} ETB</span>
        </div>` : ''}
      </div>

      <button class="btn btn-primary mt-16" id="eq-book-btn" ${!state.date || !item.isOperational ? 'disabled' : ''}>
        ${!item.isOperational ? 'Currently Unavailable' : 'Book Now'}
      </button>
    `;

    container.querySelector('#eq-detail-back').addEventListener('click', () => renderList(container));

    const dateInput = container.querySelector('#eq-date');
    dateInput.addEventListener('change', (e) => {
      state.date = e.target.value;
      const bookBtn = container.querySelector('#eq-book-btn');
      if (bookBtn) bookBtn.disabled = !state.date || !item.isOperational;
    });

    const notesInput = container.querySelector('#eq-notes');
    if (notesInput) {
      notesInput.addEventListener('input', (e) => { state.notes = e.target.value; });
    }

    container.querySelector('#eq-book-btn').addEventListener('click', () => {
      if (state.totalPayable > 0) {
        renderPayment(container);
      } else {
        confirmBooking(container);
      }
    });
  }

  async function renderPayment(container) {
    state.step = 'payment';

    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-pay-back">${ICON.back} Back</button>
        <h1 class="view-header-title">Payment</h1>
        <div class="view-header-spacer"></div>
      </div>
      <div class="card">
        <div class="payment-row">
          <span>Equipment Rental</span>
          <span>${state.selectedEquipment.name}</span>
        </div>
        <div class="payment-row">
          <span>Date</span>
          <span>${new Date(state.date + 'T12:00:00').toLocaleDateString('en-US')}</span>
        </div>
        <div class="payment-row total">
          <span>Total</span>
          <span>${state.totalPayable} ETB</span>
        </div>
      </div>
      <p class="text-hint mt-8" style="font-size:13px">You will be redirected to Telebirr to complete payment</p>
      <button class="btn btn-primary mt-16" id="eq-pay-btn">
        Pay ${state.totalPayable} ETB
      </button>
    `;

    container.querySelector('#eq-pay-back').addEventListener('click', () => renderDetail(container, state.selectedEquipment));
    container.querySelector('#eq-pay-btn').addEventListener('click', async () => {
      const payBtn = container.querySelector('#eq-pay-btn');
      payBtn.textContent = 'Opening Telebirr...';
      payBtn.disabled = true;

      try {
        const checkoutUrl = `${API.TELEBIRR}/?amount=${encodeURIComponent(String(state.totalPayable))}`;
        TG.openLink(checkoutUrl);

        await new Promise(resolve => setTimeout(resolve, 3000));

        const verifyRes = await API.verifyTelebirr(state.totalPayable);
        state.paymentDone = verifyRes?.paid === true;

        if (state.paymentDone) {
          confirmBooking(container);
        } else {
          payBtn.textContent = `Pay ${state.totalPayable} ETB`;
          payBtn.disabled = false;
          const verifyAgain = document.createElement('button');
          verifyAgain.className = 'btn btn-outline mt-8';
          verifyAgain.textContent = 'Verify Payment Again';
          verifyAgain.addEventListener('click', async () => {
            verifyAgain.textContent = 'Checking...';
            verifyAgain.disabled = true;
            try {
              const r = await API.verifyTelebirr(state.totalPayable);
              if (r?.paid) {
                state.paymentDone = true;
                confirmBooking(container);
              }
            } catch {} finally {
              verifyAgain.textContent = 'Verify Payment Again';
              verifyAgain.disabled = false;
            }
          });
          container.querySelector('#eq-pay-btn').parentNode.insertBefore(verifyAgain, payBtn.nextSibling);
        }
      } catch (err) {
        payBtn.textContent = `Pay ${state.totalPayable} ETB`;
        payBtn.disabled = false;
        state.error = err.message;
        const errEl = document.createElement('div');
        errEl.className = 'alert alert-error mt-8';
        errEl.textContent = err.message;
        container.querySelector('#eq-pay-btn').parentNode.insertBefore(errEl, payBtn);
      }
    });
  }

  async function confirmBooking(container) {
    state.step = 'confirm';
    const dateStr = new Date(state.date + 'T12:00:00').toLocaleDateString('en-US');

    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-confirm-back">${ICON.back} Back</button>
        <h1 class="view-header-title">Confirm</h1>
        <div class="view-header-spacer"></div>
      </div>
      <div class="card">
        <div class="card-row">
          <span class="text-hint">Equipment</span>
          <span><strong>${state.selectedEquipment.name}</strong></span>
        </div>
        <div class="card-row">
          <span class="text-hint">Hospital</span>
          <span>${state.selectedEquipment.hospital?.name || ''}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">Date</span>
          <span>${dateStr}</span>
        </div>
        ${state.totalPayable > 0 ? `
        <div class="card-row">
          <span class="text-hint">Payment</span>
          <span style="color:#027A48;display:inline-flex;align-items:center;gap:4px">${ICON.check} Paid (${state.totalPayable} ETB)</span>
        </div>` : ''}
        ${state.notes ? `
        <div class="card-row">
          <span class="text-hint">Notes</span>
          <span>${state.notes}</span>
        </div>` : ''}
      </div>
      <button class="btn btn-primary mt-16" id="eq-confirm-btn">
        Confirm Booking
      </button>
    `;

    container.querySelector('#eq-confirm-back').addEventListener('click', () => {
      if (state.totalPayable > 0) renderPayment(container);
      else renderDetail(container, state.selectedEquipment);
    });

    container.querySelector('#eq-confirm-btn').addEventListener('click', async () => {
      const btn = container.querySelector('#eq-confirm-btn');
      btn.textContent = 'Booking...';
      btn.disabled = true;

      try {
        const dateTime = `${state.date}T${state.selectedSlot || '09:00'}:00.000Z`;
        const booking = await API.createEquipmentBooking({
          equipmentId: state.selectedEquipment.id,
          dateTime,
          notes: state.notes || undefined,
          fee: state.totalPayable || undefined,
        });
        state.createdBooking = booking;
        renderSuccess(container);
      } catch (err) {
        btn.textContent = 'Confirm Booking';
        btn.disabled = false;
        state.error = err.message;
        const errEl = document.createElement('div');
        errEl.className = 'alert alert-error mt-8';
        errEl.textContent = err.message;
        btn.parentNode.insertBefore(errEl, btn);
      }
    });
  }

  function renderSuccess(container) {
    state.step = 'success';
    const dateStr = new Date(state.date + 'T12:00:00').toLocaleDateString('en-US');

    container.innerHTML = `
      <div class="success-screen">
        <div class="check-icon">${ICON.check}</div>
        <h2>Equipment Booked!</h2>
        <p>Your booking request has been submitted.</p>
        <div class="card text-center">
          ${state.createdBooking ? `
            <p>Booking ID: <strong>#${state.createdBooking.id}</strong></p>
          ` : ''}
          <p class="text-hint mt-8">${state.selectedEquipment.name}</p>
          <p class="text-hint">${dateStr}</p>
        </div>
        <button class="btn btn-primary mt-16" id="eq-success-home">Back to Home</button>
        <button class="btn btn-secondary mt-8" id="eq-success-list">Browse More</button>
      </div>
    `;

    container.querySelector('#eq-success-home').addEventListener('click', () => Router.navigate('home'));
    container.querySelector('#eq-success-list').addEventListener('click', () => renderList(container));
  }

  return { render };
})();
