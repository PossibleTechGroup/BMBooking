const EquipmentView = (() => {
  const PENDING_KEY = 'eq_pending_payment';

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

  function savePending() {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({
        equipmentId: state.selectedEquipment?.id,
        date: state.date,
        notes: state.notes,
        totalPayable: state.totalPayable,
        slot: state.selectedSlot,
      }));
    } catch {}
  }

  function loadPending() {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function clearPending() {
    try { localStorage.removeItem(PENDING_KEY); } catch {}
  }

  async function render(container) {
    reset();
    TG.hideMainButton();

    const pending = loadPending();
    if (pending && pending.equipmentId) {
      clearPending();
      await resumePendingPayment(container, pending);
      return;
    }

    renderList(container);
  }

  async function resumePendingPayment(container, pending) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px;color:var(--hint)">Verifying payment...</p></div>';

    try {
      const equipment = await API.getEquipmentDetail(pending.equipmentId);
      if (!equipment) { renderList(container); return; }
      state.selectedEquipment = equipment;
      state.date = pending.date;
      state.notes = pending.notes || '';
      state.totalPayable = pending.totalPayable;

      const verifyRes = await API.verifyTelebirr(pending.totalPayable);
      if (verifyRes?.paid) {
        state.paymentDone = true;
        confirmBooking(container);
      } else {
        container.innerHTML = `
          <div class="view-header">
            <button class="view-header-back" id="eq-resume-back">${ICON.back} Back</button>
            <h1 class="view-header-title">Payment</h1>
            <div class="view-header-spacer"></div>
          </div>
          <div class="card">
            <div class="payment-row">
              <span>Equipment</span>
              <span><strong>${equipment.name}</strong></span>
            </div>
            <div class="payment-row">
              <span>Date</span>
              <span>${new Date(pending.date + 'T12:00:00').toLocaleDateString('en-US')}</span>
            </div>
            <div class="payment-row total">
              <span>Total</span>
              <span>${pending.totalPayable} ETB</span>
            </div>
          </div>
          <p style="color:var(--hint);font-size:13px;margin:12px 0">Complete the Telebirr payment, then press the button below.</p>
          <button class="btn btn-primary mt-8" id="eq-resume-retry">
            Retry — Open Payment Again
          </button>
          <button class="btn btn-outline mt-8" id="eq-resume-verify">
            I Already Paid — Verify Now
          </button>
        `;
        container.querySelector('#eq-resume-back').addEventListener('click', () => renderDetail(container, equipment));
        container.querySelector('#eq-resume-retry').addEventListener('click', () => {
          openPaymentUrl(pending.totalPayable);
          savePending();
          renderResumeVerify(container, pending);
        });
        container.querySelector('#eq-resume-verify').addEventListener('click', async () => {
          const btn = container.querySelector('#eq-resume-verify');
          btn.textContent = 'Checking...';
          btn.disabled = true;
          const r = await API.verifyTelebirr(pending.totalPayable);
          if (r?.paid) {
            state.paymentDone = true;
            confirmBooking(container);
          } else {
            btn.textContent = 'I Already Paid — Verify Now';
            btn.disabled = false;
            TG.showAlert('Payment not detected yet. Please wait a moment and try again.');
          }
        });
      }
    } catch (err) {
      container.innerHTML = `<div class="card" style="padding:24px;text-align:center"><h2>Something went wrong</h2><p style="color:var(--hint);margin:12px 0">${err.message}</p><button class="btn btn-primary mt-16" onclick="Router.navigate('home')">Go Home</button></div>`;
    }
  }

  function renderResumeVerify(container, pending) {
    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-rv-back">${ICON.back} Back</button>
        <h1 class="view-header-title">Payment</h1>
        <div class="view-header-spacer"></div>
      </div>
      <div class="card" style="text-align:center;padding:24px">
        <div class="spinner" style="margin:0 auto"></div>
        <h3 style="margin-top:16px">Waiting for payment...</h3>
        <p style="color:var(--hint);margin-top:8px;font-size:13px">Complete payment in the Telebirr page, then come back here.</p>
        <p style="color:var(--hint);margin-top:4px;font-size:13px">Amount: <strong>${pending.totalPayable} ETB</strong></p>
      </div>
      <button class="btn btn-primary mt-16" id="eq-rv-verify">
        I Completed Payment — Verify
      </button>
    `;
    container.querySelector('#eq-rv-back').addEventListener('click', () => {
      clearPending();
      renderDetail(container, state.selectedEquipment);
    });
    container.querySelector('#eq-rv-verify').addEventListener('click', async () => {
      const btn = container.querySelector('#eq-rv-verify');
      btn.textContent = 'Checking...';
      btn.disabled = true;
      const r = await API.verifyTelebirr(pending.totalPayable);
      if (r?.paid) {
        clearPending();
        state.paymentDone = true;
        confirmBooking(container);
      } else {
        btn.textContent = 'I Completed Payment — Verify';
        btn.disabled = false;
        TG.showAlert('Payment not detected yet. Make sure you completed the payment, then try again in a few seconds.');
      }
    });
  }

  function openPaymentUrl(amount) {
    const url = `${API.TELEBIRR}/?amount=${encodeURIComponent(String(amount))}`;
    if (TG.webapp) {
      TG.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  async function renderList(container) {
    state.step = 'list';
    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="eq-back">${ICON.back} Home</button>
        <h1 class="view-header-title">Equipment</h1>
        <div class="view-header-spacer"></div>
      </div>
      <div class="search-bar glass-surface">
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
    state.totalPayable = item.price ? parseFloat(item.price) : (item.dailyRate ? parseFloat(item.dailyRate) : 0);

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
        ${(item.price || item.dailyRate) ? `
        <div class="card-row">
          <span class="text-hint">Price</span>
          <span><strong>${item.price || item.dailyRate} ETB</strong></span>
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

  function renderPayment(container) {
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
        Pay ${state.totalPayable} ETB via Telebirr
      </button>
    `;

    container.querySelector('#eq-pay-back').addEventListener('click', () => renderDetail(container, state.selectedEquipment));
    container.querySelector('#eq-pay-btn').addEventListener('click', async () => {
      savePending();
      openPaymentUrl(state.totalPayable);
      renderResumeVerify(container, { totalPayable: state.totalPayable });
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
          <span style="color:var(--success);display:inline-flex;align-items:center;gap:4px">${ICON.check} Paid (${state.totalPayable} ETB)</span>
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
