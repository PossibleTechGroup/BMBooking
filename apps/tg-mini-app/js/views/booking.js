const BookingView = (() => {
  const PENDING_KEY = 'bk_pending_payment';
  let paymentPollTimer = null;

  const ICON = {
    arrowLeft: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    card: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  };

  function stopPaymentPoll() {
    if (paymentPollTimer) {
      clearInterval(paymentPollTimer);
      paymentPollTimer = null;
    }
  }

  function startPaymentPoll(container) {
    stopPaymentPoll();
    paymentPollTimer = setInterval(async () => {
      try {
        const r = await API.verifyTelebirr(state.totalPayable);
        if (r?.data?.paid) {
          stopPaymentPoll();
          state.paymentDone = true;
          state.step = 4;
          renderConfirm(container);
          showStep(container);
        }
      } catch {}
    }, 3500);
  }

  let state = {
    step: 0,
    doctor: null,
    doctorId: null,
    bookingFor: 'myself',
    otherPatient: { fullName: '', phone: '', gender: 'male', dateOfBirth: '', bloodType: '' },
    categories: [],
    selectedCategory: null,
    recommendations: null,
    schedules: [],
    scheduleDates: [],
    selectedDateId: '',
    slotsForDate: [],
    selectedSlot: null,
    referralUrls: [],
    totalPayable: 0,
    cardFee: 0,
    includeCardFee: false,
    paymentDone: false,
    loading: false,
    error: null,
    createdAppointment: null,
  };

  const STEPS = ['sponsor', 'category', 'datetime', 'payment', 'confirm', 'success'];

  function t(key) { return I18n.t(key); }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function reset() {
    state = {
      step: 0,
      doctor: null,
      doctorId: null,
      bookingFor: 'myself',
      otherPatient: { fullName: '', phone: '', gender: 'male', dateOfBirth: '', bloodType: '' },
      categories: [],
      selectedCategory: null,
      recommendations: null,
      schedules: [],
      scheduleDates: [],
      selectedDateId: '',
      slotsForDate: [],
      selectedSlot: null,
      referralUrls: [],
      totalPayable: 0,
      cardFee: 0,
      includeCardFee: false,
      paymentDone: false,
      loading: false,
      error: null,
      createdAppointment: null,
    };
  }

  // Fee math — mirrors apps/mobile/app/modal.tsx:
  // serviceFeeAmount from hospital.serviceFee.amount (default 1.0),
  // cardFeeAmount from hospital.cardPrice (default 0.0).
  function serviceFeeAmount() {
    const amount = state.doctor?.hospital?.serviceFee?.amount;
    if (amount) return parseFloat(amount);
    return 1.0;
  }

  function cardFeeAmount() {
    const price = state.doctor?.hospital?.cardPrice;
    if (price) return parseFloat(price);
    return 0.0;
  }

  function recomputeTotals() {
    state.cardFee = cardFeeAmount();
    state.totalPayable = serviceFeeAmount() + (state.includeCardFee ? state.cardFee : 0);
  }

  function savePending() {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({
        doctorId: state.doctorId,
        bookingFor: state.bookingFor,
        otherPatient: state.otherPatient,
        selectedCategory: state.selectedCategory,
        categories: state.categories,
        selectedDateId: state.selectedDateId,
        selectedSlot: state.selectedSlot,
        totalPayable: state.totalPayable,
        cardFee: state.cardFee,
        includeCardFee: state.includeCardFee,
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

  function openPaymentUrl(amount) {
    const url = `${API.TELEBIRR}/?amount=${encodeURIComponent(String(amount))}&src=tg`;
    if (TG.webapp) {
      TG.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  function renderDots(container) {
    const total = STEPS.length - 1;
    container.querySelector('#step-dots').innerHTML = Array.from({ length: total }, (_, i) =>
      `<div class="step-dot ${i < state.step ? 'done' : ''} ${i === state.step ? 'active' : ''}"></div>`
    ).join('');
  }

  function showStep(container) {
    container.querySelectorAll('.booking-step').forEach(el => el.classList.remove('active'));
    const el = container.querySelector(`#step-${STEPS[state.step]}`);
    if (el) el.classList.add('active');
    renderDots(container);
    TG.expand();
  }

  function buildSkeleton(container) {
    container.innerHTML = `
      <div class="header">
        <div class="header-back" id="booking-back">${ICON.arrowLeft} ${t('cancel')}</div>
        <h1>${t('bookAppointment')}</h1>
        <div></div>
      </div>
      <div id="step-dots" class="step-indicator"></div>
      <div id="booking-error"></div>

      <div id="step-sponsor" class="booking-step"></div>
      <div id="step-category" class="booking-step"></div>
      <div id="step-datetime" class="booking-step"></div>
      <div id="step-payment" class="booking-step"></div>
      <div id="step-confirm" class="booking-step"></div>
      <div id="step-success" class="booking-step"></div>
    `;

    container.querySelector('#booking-back').addEventListener('click', () => {
      if (state.step > 0 && state.step < 5) {
        state.step--;
        showStep(container);
      } else {
        Router.goBack();
      }
    });
  }

  async function render(container, params) {
    TG.hideMainButton();
    stopPaymentPoll();

    const pending = loadPending();
    if (pending && pending.doctorId) {
      clearPending();
      const resumed = await resumePendingPayment(container, params, pending);
      if (resumed) return;
    }

    reset();
    state.doctorId = params.doctorId;
    state.doctor = params.doctor || null;

    buildSkeleton(container);

    renderSponsor(container);
    showStep(container);
  }

  // ─── Resume after Telebirr redirect ───
  async function resumePendingPayment(container, params, pending) {
    state.doctorId = pending.doctorId || params.doctorId;
    state.bookingFor = pending.bookingFor || 'myself';
    state.otherPatient = pending.otherPatient || { fullName: '', phone: '', gender: 'male', dateOfBirth: '', bloodType: '' };
    state.selectedCategory = pending.selectedCategory || null;
    state.categories = pending.categories || [];
    state.selectedDateId = pending.selectedDateId || '';
    state.selectedSlot = pending.selectedSlot || null;
    state.totalPayable = pending.totalPayable || 0;
    state.cardFee = pending.cardFee || 0;
    state.includeCardFee = pending.includeCardFee || false;
    state.step = 4;

    try {
      state.doctor = params.doctor || await API.getDoctorDetail(state.doctorId);
    } catch {}

    buildSkeleton(container);

    try {
      const r = await API.verifyTelebirr(state.totalPayable);
      if (r?.data?.paid) {
        state.paymentDone = true;
        state.step = 4;
        renderConfirm(container);
        showStep(container);
        return true;
      }
    } catch {}

    state.paymentDone = false;
    state.loading = false;
    state.step = 3;
    renderPaymentWaiting(container);
    showStep(container);
    return true;
  }

  function renderPaymentWaiting(container) {
    stopPaymentPoll();
    const el = container.querySelector('#step-payment');
    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('payment')}</h3>
      <div class="card">
        <div class="payment-row total">
          <span>${t('total')}</span>
          <span><strong>${state.totalPayable} ${t('etb')}</strong></span>
        </div>
      </div>
      <p class="text-hint mt-8" style="font-size:13px">${t('waitingPayment')}</p>
      <p class="text-hint" style="font-size:13px" id="pay-auto-hint">${t('autoCheckPayment')}</p>
      <button class="btn btn-primary mt-16" id="pay-verify-btn">${t('verifyPaymentAgain')}</button>
      <button class="btn btn-outline mt-8" id="pay-retry-btn">${t('openingTelebirr')}</button>
    `;

    el.querySelector('#pay-verify-btn').addEventListener('click', async () => {
      const btn = el.querySelector('#pay-verify-btn');
      btn.textContent = t('booking');
      btn.disabled = true;
      try {
        const r = await API.verifyTelebirr(state.totalPayable);
        if (r?.data?.paid) {
          stopPaymentPoll();
          state.paymentDone = true;
          state.step = 4;
          renderConfirm(container);
          showStep(container);
        } else {
          btn.textContent = t('verifyPaymentAgain');
          btn.disabled = false;
          TG.showAlert(t('waitingPayment'));
        }
      } catch (err) {
        btn.textContent = t('verifyPaymentAgain');
        btn.disabled = false;
        state.error = err.message;
        showError(container);
      }
    });

    el.querySelector('#pay-retry-btn').addEventListener('click', () => {
      savePending();
      openPaymentUrl(state.totalPayable);
      TG.showAlert(t('waitingPayment'));
    });

    startPaymentPoll(container);
  }

  // ─── Step 0: Sponsor ───
  function renderSponsor(container) {
    const el = container.querySelector('#step-sponsor');
    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('whoIsThisFor')}</h3>
      <div class="chip-group-stretch mb-16">
        <div class="chip ${state.bookingFor === 'myself' ? 'selected' : ''}" data-booking="myself">${t('myself')}</div>
        <div class="chip ${state.bookingFor === 'someone_else' ? 'selected' : ''}" data-booking="someone_else">${t('someoneElse')}</div>
      </div>
      <div id="other-patient-fields" class="${state.bookingFor === 'someone_else' ? '' : 'hidden'}">
        <div class="input-group">
          <label>${t('fullName')} *</label>
          <div class="input-field">
            <input type="text" id="other-name" placeholder="${t('fullName')}" value="${esc(state.otherPatient.fullName)}" />
          </div>
        </div>
        <div class="input-group">
          <label>${t('phone')} *</label>
          <div class="input-field">
            <span class="prefix">+251</span>
            <input type="tel" id="other-phone" placeholder="912 345 678" maxlength="9" value="${esc(state.otherPatient.phone)}" />
          </div>
        </div>
        <div class="input-group">
          <label>${t('gender')}</label>
          <div class="chip-group-stretch">
            ${['male', 'female'].map(g =>
              `<div class="chip ${state.otherPatient.gender === g ? 'selected' : ''}" data-ogender="${g}">${t(g)}</div>`
            ).join('')}
          </div>
        </div>
        <div class="input-group">
          <label>${t('dateOfBirth')}</label>
          <div class="input-field">
            <input type="date" id="other-dob" value="${esc(state.otherPatient.dateOfBirth)}" />
          </div>
          ${state.otherPatient.dateOfBirth && TimeUtils.getCalendarFormat() === 'ethiopian' ? `
          <div id="other-dob-eth-hint" style="display:flex;align-items:center;gap:5px;margin-top:4px;font-size:12px;color:var(--hint,#888);">
            ${ICON.calendar}
            <span>${esc(TimeUtils.formatEthiopianCalendarDate(new Date(state.otherPatient.dateOfBirth + 'T12:00:00'), 'medium'))}</span>
          </div>` : '<div id="other-dob-eth-hint"></div>'}
        </div>
      </div>
      <button class="btn btn-primary mt-16" id="sponsor-next">${t('continue')}</button>
    `;

    container.querySelectorAll('[data-booking]').forEach(el => {
      el.addEventListener('click', () => {
        state.bookingFor = el.dataset.booking;
        container.querySelectorAll('[data-booking]').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        const fields = container.querySelector('#other-patient-fields');
        fields.classList.toggle('hidden', state.bookingFor === 'myself');
      });
    });

    if (state.bookingFor === 'someone_else') {
      container.querySelector('#other-name')?.addEventListener('input', (e) => { state.otherPatient.fullName = e.target.value; });
      container.querySelector('#other-phone')?.addEventListener('input', (e) => { state.otherPatient.phone = e.target.value.replace(/[^0-9]/g, ''); e.target.value = state.otherPatient.phone; });
      container.querySelectorAll('[data-ogender]').forEach(el => {
        el.addEventListener('click', () => {
          state.otherPatient.gender = el.dataset.ogender;
          container.querySelectorAll('[data-ogender]').forEach(c => c.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
      container.querySelector('#other-dob')?.addEventListener('change', (e) => {
        state.otherPatient.dateOfBirth = e.target.value;
        const hintEl = container.querySelector('#other-dob-eth-hint');
        if (hintEl && state.otherPatient.dateOfBirth && TimeUtils.getCalendarFormat() === 'ethiopian') {
          const ethStr = TimeUtils.formatEthiopianCalendarDate(new Date(state.otherPatient.dateOfBirth + 'T12:00:00'), 'medium');
          hintEl.innerHTML = `${ICON.calendar}<span>${esc(ethStr)}</span>`;
          hintEl.style.display = 'flex';
        } else if (hintEl) {
          hintEl.innerHTML = '';
        }
      });
    }

    container.querySelector('#sponsor-next').addEventListener('click', () => {
      if (state.bookingFor === 'someone_else' && (!state.otherPatient.fullName || !state.otherPatient.phone)) {
        state.error = t('missingPatientInfo');
        showError(container);
        return;
      }
      state.error = null;
      showError(container);
      state.step = 1;
      loadCategories(container);
    });
  }

  // ─── Step 1: Category ───
  async function loadCategories(container) {
    state.loading = true;
    const el = container.querySelector('#step-category');
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    showStep(container);

    try {
      state.categories = await API.getCategories();
      state.loading = false;
      renderCategories(container);
    } catch (err) {
      state.loading = false;
      el.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
    }
  }

  function renderCategories(container) {
    const el = container.querySelector('#step-category');
    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('selectIssueCategory')}</h3>
      <div class="chip-group" id="category-chips">
        ${state.categories.map(c =>
          `<div class="chip ${state.selectedCategory === c.key ? 'selected' : ''}" data-cat="${c.key}">${esc(c.label)}</div>`
        ).join('')}
      </div>
      <div id="recommendations-box"></div>
      <button class="btn btn-primary mt-16" id="category-next">${t('continue')}</button>
    `;

    el.querySelector('#category-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-cat]');
      if (!chip) return;
      state.selectedCategory = chip.dataset.cat;
      el.querySelectorAll('[data-cat]').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      loadRecs(container);
    });

    el.querySelector('#category-next').addEventListener('click', () => {
      if (!state.selectedCategory) {
        state.error = t('selectIssueCategory');
        showError(container);
        return;
      }
      state.error = null;
      showError(container);
      renderDateTime(container);
    });

    if (state.selectedCategory) loadRecs(container);
  }

  async function loadRecs(container) {
    try {
      state.recommendations = await API.getRecommendations(state.selectedCategory);
      const box = container.querySelector('#recommendations-box');
      if (state.recommendations?.documents?.length > 0) {
        box.innerHTML = `
          <div class="card mt-16">
            <p class="text-hint" style="font-size:13px;margin-bottom:8px"><strong>Recommended documents:</strong></p>
            <ul style="padding-left:16px;font-size:13px;color:var(--hint)">
              ${state.recommendations.documents.map(d => `<li>${esc(d.label)}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    } catch {}
  }

  // ─── Step 2: Date/Time ───
  // Mirrors fetchDoctorScheduleSlots in apps/mobile/store/slices/appointmentSlice.ts:
  // GET /api/doctors/:id/schedules (14-day window first, then unbounded like the APK),
  // each schedule carries its concrete `slots` (ScheduleSlot rows with _count.bookings).
  function dateIdOf(value) {
    return new Date(value).toISOString().slice(0, 10);
  }

  function isPastDate(dateId) {
    if (!dateId) return false;
    return new Date(`${dateId}T23:59:59.999`).getTime() < Date.now();
  }

  function buildScheduleDates(schedules) {
    const raw = (schedules || []).map(s => {
      const d = new Date(s.date);
      return { id: dateIdOf(d), label: TimeUtils.formatDate(d), date: d };
    });
    return raw.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
  }

  function buildFallbackDates() {
    // APK fallback: next 7 days when the doctor has no slot table.
    const out = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push({ id: dateIdOf(d), label: TimeUtils.formatDate(d), date: d });
    }
    return out;
  }

  function slotsForDateId(dateId) {
    const daySchedules = state.schedules.filter(s => s.date && dateIdOf(s.date) === dateId);
    const all = daySchedules.flatMap(s => (Array.isArray(s.slots) ? s.slots : []));
    all.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return all;
  }

  function slotIsPast(slot) {
    const start = new Date(slot.startTime).getTime();
    return !isNaN(start) && start <= Date.now();
  }

  function slotIsFull(slot) {
    const maxPatients = slot.maxPatients;
    const booked = slot._count?.bookings ?? 0;
    return typeof maxPatients === 'number' && maxPatients > 0 && booked >= maxPatients;
  }

  async function fetchSchedules() {
    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const windowed = await API.getDoctorSchedules(
        state.doctorId,
        dateIdOf(from),
        dateIdOf(to),
      );
      if (Array.isArray(windowed) && windowed.length > 0) return windowed;
    } catch {}
    try {
      // APK parity: fetchDoctorScheduleSlots without a range (all future schedules).
      return await API.getDoctorSchedules(state.doctorId);
    } catch (err) {
      throw err;
    }
  }

  function renderDateTime(container) {
    const el = container.querySelector('#step-datetime');
    state.step = 2;
    state.loading = true;
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    showStep(container);

    fetchSchedules()
      .then(schedules => {
        state.loading = false;
        state.schedules = (schedules || []).filter(s => s.isActive !== false);
        state.scheduleDates = buildScheduleDates(state.schedules);
        if (state.scheduleDates.length === 0) state.scheduleDates = buildFallbackDates();

        if (!state.scheduleDates.some(d => d.id === state.selectedDateId)) {
          const firstUsable = state.scheduleDates.find(d => !isPastDate(d.id)) || state.scheduleDates[0];
          state.selectedDateId = firstUsable ? firstUsable.id : '';
        }
        state.selectedSlot = null;
        renderDateTimeBody(container);
      })
      .catch(err => {
        state.loading = false;
        el.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
      });
  }

  function renderDateTimeBody(container) {
    const el = container.querySelector('#step-datetime');
    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('selectDateTime')}</h3>
      <p class="bk-label">${t('date')}</p>
      <div class="bk-date-row" id="date-row">
        ${state.scheduleDates.map(d => {
          const past = isPastDate(d.id);
          return `<div class="chip ${state.selectedDateId === d.id ? 'selected' : ''} ${past ? 'bk-disabled' : ''}" data-date-id="${d.id}">${esc(d.label)}</div>`;
        }).join('')}
      </div>
      <p class="bk-label mt-16">${t('availableSlots')}</p>
      <div id="slots-box"></div>
      <button class="btn btn-primary mt-16" id="datetime-next" ${state.selectedSlot ? '' : 'disabled'}>
        ${t('continue')}
      </button>
    `;

    el.querySelectorAll('[data-date-id]').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('bk-disabled')) return;
        state.selectedDateId = chip.dataset.dateId;
        state.selectedSlot = null;
        el.querySelectorAll('[data-date-id]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        el.querySelector('#datetime-next').disabled = true;
        renderSlotsBox(container);
      });
    });

    el.querySelector('#datetime-next').addEventListener('click', () => {
      if (!state.selectedDateId) {
        state.error = t('missingDate');
        showError(container);
        return;
      }
      if (!state.selectedSlot) {
        state.error = t('selectSlot');
        showError(container);
        return;
      }
      state.error = null;
      showError(container);
      state.step = 3;
      renderPayment(container);
      showStep(container);
    });

    renderSlotsBox(container);
  }

  function renderSlotsBox(container) {
    const el = container.querySelector('#step-datetime');
    const box = el.querySelector('#slots-box');
    if (!box) return;

    const slots = state.selectedDateId && state.schedules.length
      ? slotsForDateId(state.selectedDateId)
      : [];
    state.slotsForDate = slots;

    if (slots.length === 0) {
      box.innerHTML = `<div class="empty-state bk-empty"><p>${t('noAvailableSlots')}</p></div>`;
      return;
    }

    box.innerHTML = `<div class="slot-grid">${slots.map(slot => {
      const full = slotIsFull(slot);
      const past = slotIsPast(slot);
      const disabled = full || past;
      const selected = state.selectedSlot && state.selectedSlot.id === slot.id;
      const booked = slot._count?.bookings ?? 0;
      const max = slot.maxPatients;
      let meta = '';
      if (full) {
        meta = t('slotFull');
      } else if (!past && typeof max === 'number' && max > 0) {
        meta = t('slotLeft').replace('{{n}}', String(Math.max(0, max - booked)));
      }
      return `
        <div class="slot-chip ${selected ? 'selected' : ''} ${disabled ? 'full' : ''}" data-slot-id="${slot.id}" role="button" aria-disabled="${disabled}">
          <span class="slot-time">${esc(TimeUtils.formatTime(new Date(slot.startTime)))}</span>
          ${meta ? `<span class="slot-meta">${esc(meta)}</span>` : ''}
        </div>
      `;
    }).join('')}</div>`;

    box.querySelectorAll('[data-slot-id]').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('full')) return;
        const id = Number(chip.dataset.slotId);
        const slot = slots.find(s => s.id === id);
        if (!slot || slotIsFull(slot) || slotIsPast(slot)) return;
        state.selectedSlot = slot;
        box.querySelectorAll('.slot-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        el.querySelector('#datetime-next').disabled = false;
      });
    });
  }

  // ─── Step 3: Payment ───
  function renderPayment(container) {
    const el = container.querySelector('#step-payment');
    state.step = 3;
    recomputeTotals();
    const serviceFee = serviceFeeAmount();

    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('payment')}</h3>
      <div class="card">
        <div class="payment-row">
          <span>${t('appServiceFee')}</span>
          <span>${serviceFee.toFixed(2)} ${t('etb')}</span>
        </div>
        ${state.cardFee > 0 ? `
        <div class="payment-row">
          <span>${t('hospitalCardPrice')}</span>
          <span>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="card-fee-toggle" ${state.includeCardFee ? 'checked' : ''} />
              ${state.cardFee.toFixed(2)} ${t('etb')}
            </label>
          </span>
        </div>` : ''}
        <div class="payment-row total">
          <span>${t('totalAmount')}</span>
          <span id="total-amount">${state.totalPayable.toFixed(2)} ${t('etb')}</span>
        </div>
      </div>
      <p class="text-hint mt-8" style="font-size:13px">${t('youWillBeRedirected')}</p>
      <button class="btn btn-primary mt-16" id="payment-pay-btn">
        ${esc(t('payAndConfirm').replace('{{amount}}', state.totalPayable.toFixed(2)))}
      </button>
    `;

    const toggle = el.querySelector('#card-fee-toggle');
    if (toggle) {
      toggle.addEventListener('change', () => {
        state.includeCardFee = toggle.checked;
        recomputeTotals();
        el.querySelector('#total-amount').textContent = `${state.totalPayable.toFixed(2)} ${t('etb')}`;
        el.querySelector('#payment-pay-btn').textContent = t('payAndConfirm').replace('{{amount}}', state.totalPayable.toFixed(2));
      });
    }

    el.querySelector('#payment-pay-btn').addEventListener('click', () => handlePayment(container));
  }

  async function handlePayment(container) {
    if (state.totalPayable === 0) {
      state.paymentDone = true;
      state.step = 4;
      renderConfirm(container);
      showStep(container);
      return;
    }

    savePending();
    openPaymentUrl(state.totalPayable);
    await new Promise(resolve => setTimeout(resolve, 3000));
    renderPaymentWaiting(container);
  }

  function selectedDateLabel() {
    if (!state.selectedDateId) return '';
    return TimeUtils.formatDate(new Date(`${state.selectedDateId}T12:00:00`));
  }

  function selectedTimeLabel() {
    if (!state.selectedSlot?.startTime) return '';
    return TimeUtils.formatTime(new Date(state.selectedSlot.startTime));
  }

  // ─── Step 4: Confirm ───
  function renderConfirm(container) {
    const el = container.querySelector('#step-confirm');
    state.step = 4;

    const dateStr = selectedDateLabel() || t('date');
    const timeStr = selectedTimeLabel();

    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('confirmAppointment')}</h3>
      <div class="card">
        <div class="card-row">
          <span class="text-hint">${t('doctor')}</span>
          <span><strong>${esc(state.doctor?.fullName || '')}</strong></span>
        </div>
        <div class="card-row">
          <span class="text-hint">${t('date')}</span>
          <span>${esc(dateStr)}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${t('time')}</span>
          <span>${esc(timeStr)}</span>
        </div>
        ${state.selectedCategory ? `
        <div class="card-row">
          <span class="text-hint">${t('category')}</span>
          <span>${esc(state.categories.find(c => c.key === state.selectedCategory)?.label || state.selectedCategory)}</span>
        </div>` : ''}
        <div class="card-row">
          <span class="text-hint">${t('bookingFor')}</span>
          <span>${esc(state.bookingFor === 'myself' ? t('myself') : state.otherPatient.fullName)}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${t('payment')}</span>
          <span>${state.paymentDone ? `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--success)">&check; ${t('paid')} (${state.totalPayable} ${t('etb')})</span>` : `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--danger)">&cross; ${t('notPaid')}</span>`}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${t('amount')}</span>
          <span><strong>${state.totalPayable} ${t('etb')}</strong></span>
        </div>
      </div>

      <button class="btn btn-primary mt-8" id="confirm-submit-btn" ${state.loading ? 'disabled' : ''}>
        ${state.loading ? t('booking') : t('confirmAndBook')}
      </button>
    `;

    el.querySelector('#confirm-submit-btn').addEventListener('click', () => submitBooking(container));
    showStep(container);
  }

  async function submitBooking(container) {
    if (!state.selectedDateId || !state.selectedSlot) {
      state.error = state.selectedDateId ? t('selectSlot') : t('missingDate');
      showError(container);
      return;
    }

    state.loading = true;
    const btn = container.querySelector('#confirm-submit-btn');
    if (btn) btn.textContent = t('booking');

    try {
      // Same dateTime construction as modal.tsx: date chip id + HH:MM from the slot.
      const timePart = state.selectedSlot.startTime?.slice(11, 16);
      const dateTime = timePart
        ? `${state.selectedDateId}T${timePart}:00.000Z`
        : `${state.selectedDateId}T09:00:00.000Z`;

      // Payload parity with apps/mobile/app/modal.tsx handlePayAndConfirm:
      // isPaid after Telebirr verification, paidCardFee flag, paymentMethod
      // derived from the card option, slotId is a ScheduleSlot id.
      const payload = {
        doctorId: state.doctorId,
        dateTime,
        fee: state.totalPayable,
        issueCategory: state.selectedCategory,
        slotId: state.selectedSlot.id,
        paymentMethod: state.includeCardFee ? 'card' : 'service_fee',
        paidCardFee: state.includeCardFee,
        isPaid: true,
      };

      if (state.bookingFor === 'someone_else' && state.otherPatient.fullName) {
        payload.otherPatientDetails = {
          fullName: state.otherPatient.fullName,
          phone: state.otherPatient.phone ? `+251${state.otherPatient.phone}` : '',
          gender: state.otherPatient.gender || 'male',
          dateOfBirth: state.otherPatient.dateOfBirth || undefined,
          bloodType: state.otherPatient.bloodType || undefined,
        };
      }

      const appointment = await API.createAppointment(payload);
      clearPending();
      state.createdAppointment = appointment;
      state.loading = false;
      state.error = null;
      showError(container);
      state.step = 5;
      renderSuccess(container);
      showStep(container);
    } catch (err) {
      state.loading = false;
      state.error = err.message;
      if (btn) btn.textContent = t('confirmAndBook');
      showError(container);
    }
  }

  // ─── Step 5: Success ───
  function renderSuccess(container) {
    const el = container.querySelector('#step-success');
    const dateStr = selectedDateLabel();
    const timeStr = selectedTimeLabel();
    el.innerHTML = `
      <div class="success-screen">
        <div class="check-icon">&check;</div>
        <h2>${t('appointmentBooked')}</h2>
        <p>${t('appointmentSubmitted')}</p>
        <div class="card text-center">
          ${state.createdAppointment ? `
            <p>${t('appointmentId')}: <strong>#${esc(state.createdAppointment.id ?? state.createdAppointment.appointment?.id ?? '')}</strong></p>
            <p class="text-hint mt-8">${esc(state.doctor?.fullName || '')}</p>
            ${dateStr ? `<p class="text-hint">${esc(dateStr)}${timeStr ? ' ' + esc(timeStr) : ''}</p>` : ''}
          ` : ''}
        </div>
        <button class="btn btn-primary mt-16" id="success-home-btn">${t('backToHome')}</button>
        <button class="btn btn-secondary mt-8" id="success-appts-btn">${t('viewAppointments')}</button>
      </div>
    `;

    el.querySelector('#success-home-btn').addEventListener('click', () => Router.navigate('home'));
    el.querySelector('#success-appts-btn').addEventListener('click', () => Router.navigate('appointments'));
  }

  function showError(container) {
    const el = container.querySelector('#booking-error');
    if (el) {
      el.innerHTML = state.error ? `<div class="alert alert-error">${esc(state.error)}</div>` : '';
    }
  }

  return { render };
})();
