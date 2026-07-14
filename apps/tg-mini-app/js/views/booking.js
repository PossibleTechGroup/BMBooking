const BookingView = (() => {
  let state = {
    step: 0,
    doctor: null,
    doctorId: null,
    bookingFor: 'myself',
    otherPatient: { fullName: '', phone: '', gender: 'male', dateOfBirth: '', bloodType: '' },
    categories: [],
    selectedCategory: null,
    recommendations: null,
    selectedSchedule: null,
    selectedSlot: null,
    date: '',
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
      selectedSchedule: null,
      selectedSlot: null,
      date: '',
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

  async function render(container, params) {
    reset();
    state.doctorId = params.doctorId;
    state.doctor = params.doctor || null;

    TG.hideMainButton();

    container.innerHTML = `
      <div class="header">
        <div class="header-back" id="booking-back">&larr; ${t('cancel')}</div>
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
      if (state.step > 0) {
        state.step--;
        showStep(container);
      } else {
        Router.goBack();
      }
    });

    renderSponsor(container);
    showStep(container);
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
            <input type="text" id="other-name" placeholder="${t('fullName')}" value="${state.otherPatient.fullName}" />
          </div>
        </div>
        <div class="input-group">
          <label>${t('phone')} *</label>
          <div class="input-field">
            <span class="prefix">+251</span>
            <input type="tel" id="other-phone" placeholder="912 345 678" maxlength="9" value="${state.otherPatient.phone}" />
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
            <input type="date" id="other-dob" value="${state.otherPatient.dateOfBirth}" />
          </div>
          ${state.otherPatient.dateOfBirth && TimeUtils.getCalendarFormat() === 'ethiopian' ? `
          <div id="other-dob-eth-hint" style="display:flex;align-items:center;gap:5px;margin-top:4px;font-size:12px;color:var(--hint-color,#888);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
            <span>${TimeUtils.formatEthiopianCalendarDate(new Date(state.otherPatient.dateOfBirth + 'T12:00:00'), 'medium')}</span>
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
          hintEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg><span>${ethStr}</span>`;
          hintEl.style.display = 'flex';
        } else if (hintEl) {
          hintEl.innerHTML = '';
        }
      });
    }

    container.querySelector('#sponsor-next').addEventListener('click', () => {
      if (state.bookingFor === 'someone_else' && !state.otherPatient.fullName) {
        state.error = t('pleaseFillName');
        showError(container);
        return;
      }
      state.error = null;
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
      el.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  function renderCategories(container) {
    const el = container.querySelector('#step-category');
    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('selectIssueCategory')}</h3>
      <div class="chip-group" id="category-chips">
        ${state.categories.map(c =>
          `<div class="chip ${state.selectedCategory === c.key ? 'selected' : ''}" data-cat="${c.key}">${c.label}</div>`
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
              ${state.recommendations.documents.map(d => `<li>${d.label}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    } catch {}
  }

  // ─── Step 2: Date/Time ───
  function renderDateTime(container) {
    const el = container.querySelector('#step-datetime');
    state.step = 2;
    state.loading = true;
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    showStep(container);

    API.getDoctorSchedules(state.doctorId)
      .then(schedules => {
        state.loading = false;
        const activeSchedules = schedules.filter(s => s.isActive !== false);
        el.innerHTML = `
          <h3 style="margin-bottom:16px">${t('selectDateTime')}</h3>
          ${activeSchedules.length === 0
            ? `<p class="text-hint">${t('noSchedules')}</p>`
            : activeSchedules.map(s => `
              <div class="card" data-schedule-id="${s.id}" style="cursor:pointer;${state.selectedSchedule?.id === s.id ? 'border-color:var(--link)' : ''}">
                <div class="flex-between">
                  <span><strong>${s.date ? TimeUtils.formatDate(new Date(s.date)) : ''}</strong></span>
                  <span class="text-hint">${s.startTime?.slice(0,5) || ''} - ${s.endTime?.slice(0,5) || ''}</span>
                </div>
                ${s.clinicRoom ? `<div class="text-hint mt-8" style="display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${t('room')} ${s.clinicRoom}</div>` : ''}
              </div>
            `).join('')}
          <button class="btn btn-primary mt-16" id="datetime-next" ${!state.selectedSchedule ? 'disabled' : ''}>
            ${t('continue')}
          </button>
        `;

        el.querySelectorAll('[data-schedule-id]').forEach(card => {
          card.addEventListener('click', () => {
            const id = parseInt(card.dataset.scheduleId);
            state.selectedSchedule = activeSchedules.find(s => s.id === id);
            el.querySelectorAll('[data-schedule-id]').forEach(c => c.style.borderColor = '');
            card.style.borderColor = 'var(--link)';
            el.querySelector('#datetime-next').disabled = false;
          });
        });

        el.querySelector('#datetime-next').addEventListener('click', () => {
          state.step = 3;
          renderPayment(container);
          showStep(container);
        });
      })
      .catch(err => {
        state.loading = false;
        el.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      });
  }

  // ─── Step 3: Payment ───
  function renderPayment(container) {
    const el = container.querySelector('#step-payment');
    state.step = 3;
    state.cardFee = state.doctor?.hospital?.cardPrice ? parseFloat(state.doctor.hospital.cardPrice) : 0;
    const consultationFee = state.doctor?.baseHourlyRate ? parseFloat(state.doctor.baseHourlyRate) : 0;
    state.totalPayable = consultationFee + (state.includeCardFee ? state.cardFee : 0);

    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('payment')}</h3>
      <div class="card">
        <div class="payment-row">
          <span>${t('consultationFee')}</span>
          <span>${consultationFee} ${t('etb')}</span>
        </div>
        ${state.cardFee > 0 ? `
        <div class="payment-row">
          <span>${t('hospitalCardFee')}</span>
          <span>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="card-fee-toggle" ${state.includeCardFee ? 'checked' : ''} />
              ${state.cardFee} ${t('etb')}
            </label>
          </span>
        </div>` : ''}
        <div class="payment-row total">
          <span>${t('total')}</span>
          <span id="total-amount">${state.totalPayable} ${t('etb')}</span>
        </div>
      </div>
      <p class="text-hint mt-8" style="font-size:13px">${t('youWillBeRedirected')}</p>
      <button class="btn btn-primary mt-16" id="payment-pay-btn">
        Pay ${state.totalPayable} ${t('etb')}
      </button>
    `;

    const toggle = el.querySelector('#card-fee-toggle');
    if (toggle) {
      toggle.addEventListener('change', () => {
        state.includeCardFee = toggle.checked;
        const consultFee = state.doctor?.baseHourlyRate ? parseFloat(state.doctor.baseHourlyRate) : 0;
        state.totalPayable = consultFee + (state.includeCardFee ? state.cardFee : 0);
        el.querySelector('#total-amount').textContent = `${state.totalPayable} ${t('etb')}`;
        el.querySelector('#payment-pay-btn').textContent = `Pay ${state.totalPayable} ${t('etb')}`;
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

    state.loading = true;
    const payBtn = container.querySelector('#payment-pay-btn');
    if (payBtn) payBtn.textContent = t('openingTelebirr');

    try {
      const checkoutUrl = `${API.TELEBIRR}/?amount=${encodeURIComponent(String(state.totalPayable))}`;
      TG.openLink(checkoutUrl);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const verifyRes = await API.verifyTelebirr(state.totalPayable);
      state.paymentDone = verifyRes?.paid === true;

      if (state.paymentDone) {
        state.step = 4;
        renderConfirm(container);
        showStep(container);
      } else {
        state.loading = false;
        if (payBtn) payBtn.textContent = `Pay ${state.totalPayable} ${t('etb')}`;
        const el = container.querySelector('#step-payment');
        const alert = document.createElement('div');
        alert.className = 'alert alert-info mt-8';
        alert.textContent = t('waitingPayment');
        el.insertBefore(alert, payBtn);

        const verifyAgain = document.createElement('button');
        verifyAgain.className = 'btn btn-outline mt-8';
        verifyAgain.textContent = t('verifyPaymentAgain');
        verifyAgain.addEventListener('click', async () => {
          verifyAgain.textContent = '...';
          verifyAgain.disabled = true;
          try {
            const r = await API.verifyTelebirr(state.totalPayable);
            if (r?.paid) {
              state.paymentDone = true;
              state.step = 4;
              renderConfirm(container);
              showStep(container);
            }
          } catch {} finally {
            verifyAgain.textContent = t('verifyPaymentAgain');
            verifyAgain.disabled = false;
          }
        });
        el.insertBefore(verifyAgain, payBtn.nextSibling);
      }
    } catch (err) {
      state.loading = false;
      if (payBtn) payBtn.textContent = `Pay ${state.totalPayable} ${t('etb')}`;
      state.error = err.message;
      showError(container);
    }
  }

  // ─── Step 4: Confirm ───
  function renderConfirm(container) {
    const el = container.querySelector('#step-confirm');
    state.step = 4;

    const dateStr = state.selectedSchedule?.date
      ? new Date(state.selectedSchedule.date).toLocaleDateString('en-US')
      : 'Selected date';
    const timeStr = state.selectedSchedule?.startTime
      ? state.selectedSchedule.startTime.slice(0, 5)
      : '';

    el.innerHTML = `
      <h3 style="margin-bottom:16px">${t('confirmAppointment')}</h3>
      <div class="card">
        <div class="card-row">
          <span class="text-hint">${t('doctor')}</span>
          <span><strong>${state.doctor?.fullName || ''}</strong></span>
        </div>
        <div class="card-row">
          <span class="text-hint">${t('date')}</span>
          <span>${dateStr}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${t('time')}</span>
          <span>${timeStr}</span>
        </div>
        ${state.selectedCategory ? `
        <div class="card-row">
          <span class="text-hint">${t('category')}</span>
          <span>${state.categories.find(c => c.key === state.selectedCategory)?.label || state.selectedCategory}</span>
        </div>` : ''}
        <div class="card-row">
          <span class="text-hint">${t('bookingFor')}</span>
          <span>${state.bookingFor === 'myself' ? t('myself') : state.otherPatient.fullName}</span>
        </div>
        <div class="card-row">
          <span class="text-hint">${t('payment')}</span>
          <span>${state.paymentDone ? `<span style="display:inline-flex;align-items:center;gap:4px;color:#027A48">&check; ${t('paid')} (${state.totalPayable} ${t('etb')})</span>` : `<span style="display:inline-flex;align-items:center;gap:4px;color:#E53935">&cross; ${t('notPaid')}</span>`}</span>
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
    state.loading = true;
    const btn = container.querySelector('#confirm-submit-btn');
    if (btn) btn.textContent = t('booking');

    try {
      const scheduleDate = state.selectedSchedule?.date || new Date().toISOString().split('T')[0];
      const startTime = state.selectedSchedule?.startTime || '00:00';
      const timePart = startTime.includes('T') ? startTime.split('T')[1] : `${startTime}:00.000Z`;
      const dateTime = startTime.includes('T') ? startTime : `${scheduleDate}T${timePart}`;

      const payload = {
        doctorId: state.doctorId,
        dateTime,
        issueCategory: state.selectedCategory,
        fee: state.totalPayable,
        slotId: state.selectedSchedule?.id || undefined,
        paymentMethod: 'service_fee',
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
      state.createdAppointment = appointment;
      state.loading = false;
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
    el.innerHTML = `
      <div class="success-screen">
        <div class="check-icon">&check;</div>
        <h2>${t('appointmentBooked')}</h2>
        <p>${t('appointmentSubmitted')}</p>
        <div class="card text-center">
          ${state.createdAppointment ? `
            <p>${t('appointmentId')}: <strong>#${state.createdAppointment.id}</strong></p>
            <p class="text-hint mt-8">${state.doctor?.fullName || ''}</p>
            ${state.selectedSchedule?.date ? `<p class="text-hint">${new Date(state.selectedSchedule.date).toLocaleDateString('en-US')} at ${state.selectedSchedule.startTime?.slice(0,5) || ''}</p>` : ''}
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
    if (el && state.error) {
      el.innerHTML = `<div class="alert alert-error">${state.error}</div>`;
    }
  }

  return { render };
})();
