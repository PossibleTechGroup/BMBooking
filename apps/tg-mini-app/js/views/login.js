const LoginView = (() => {
  let state = {
    step: 'phone',
    phone: '',
    otp: ['', '', '', '', '', ''],
    otpSent: false,
    otpAttempted: false,
    otpErrorType: null,
    isRegistrationMode: true,
    loading: false,
    error: null,
  };

  function renderPhone(container) {
    container.innerHTML = `
      <div class="header"><h1>BM</h1></div>
      <p class="text-hint mb-16">Enter your phone number to get started</p>
      <div class="input-group phone-input-group">
        <label>Phone Number</label>
        <div class="input-field ${state.error ? 'error' : ''}">
          <span class="prefix">+251</span>
          <input type="tel" id="login-phone" placeholder="912 345 678" maxlength="9" value="${state.phone}" inputmode="numeric" />
        </div>
      </div>
      <div id="login-error"></div>
      <button class="btn btn-primary mt-8" id="login-continue-btn" ${!state.phone || state.phone.length < 9 ? 'disabled' : ''}>
        ${state.loading ? 'Sending OTP...' : 'Continue'}
      </button>
    `;

    const input = container.querySelector('#login-phone');
    const btn = container.querySelector('#login-continue-btn');
    const errorEl = container.querySelector('#login-error');

    if (state.error) {
      errorEl.innerHTML = `<div class="alert alert-error">${state.error}</div>`;
    }

    input.addEventListener('input', (e) => {
      state.phone = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = state.phone;
      btn.disabled = state.phone.length < 9;
      state.error = null;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !btn.disabled) handleRequestOtp(container);
    });

    btn.addEventListener('click', () => handleRequestOtp(container));
    setTimeout(() => input.focus(), 300);
  }

  async function handleRequestOtp(container) {
    const phone = `+251${state.phone}`;
    state.loading = true;
    state.error = null;
    render(container);

    try {
      await API.requestOtp(phone, 'patient', true);
      state.otpSent = true;
      state.loading = false;
      state.step = 'otp';
      render(container);
    } catch (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('exist')) {
        try {
          await API.requestOtp(phone, 'patient', false);
          state.isRegistrationMode = false;
          state.otpSent = true;
          state.loading = false;
          state.step = 'otp';
          render(container);
          return;
        } catch (err2) {
          state.error = err2.message;
          state.loading = false;
          render(container);
          return;
        }
      }
      state.error = err.message;
      state.loading = false;
      render(container);
    }
  }

  function renderOtp(container) {
    container.innerHTML = `
      <div class="header">
        <div class="header-back" id="otp-back">← Back</div>
        <h1>Verify OTP</h1>
        <div></div>
      </div>
      <p class="text-hint mb-16">Enter the 6-digit code sent to +251${state.phone}</p>
      <div class="otp-container" id="otp-boxes">
        ${Array.from({length: 6}, (_, i) =>
          `<input type="tel" class="otp-input-box ${state.otp[i] ? 'filled' : ''}" id="otp-${i}" maxlength="1" value="${state.otp[i] || ''}" inputmode="numeric" pattern="[0-9]" data-idx="${i}" />`
        ).join('')}
      </div>
      <div id="login-error"></div>
      <button class="btn btn-primary" id="otp-verify-btn" ${state.otp.some(d => !d) ? 'disabled' : ''}>
        ${state.loading ? 'Verifying...' : 'Verify'}
      </button>
      <div class="text-center mt-16">
        <a href="#" id="change-phone-link">Change phone number</a>
      </div>
    `;

    const errorEl = container.querySelector('#login-error');
    if (state.error) errorEl.innerHTML = `<div class="alert alert-error">${state.error}</div>`;

    const inputs = container.querySelectorAll('.otp-input-box');
    const btn = container.querySelector('#otp-verify-btn');

    container.querySelector('#otp-back').addEventListener('click', () => {
      state.step = 'phone';
      state.otp = ['', '', '', '', '', ''];
      state.error = null;
      render(container);
    });

    container.querySelector('#change-phone-link').addEventListener('click', (e) => {
      e.preventDefault();
      state.step = 'phone';
      state.otp = ['', '', '', '', '', ''];
      state.otpSent = false;
      state.error = null;
      render(container);
    });

    function focusNext(idx) {
      if (idx < 5) {
        const next = container.querySelector(`#otp-${idx + 1}`);
        if (next) next.focus();
      }
    }

    function focusPrev(idx) {
      if (idx > 0) {
        const prev = container.querySelector(`#otp-${idx - 1}`);
        if (prev) prev.focus();
      }
    }

    function checkComplete() {
      btn.disabled = state.otp.some(d => !d);
    }

    inputs.forEach((input) => {
      const idx = parseInt(input.dataset.idx);

      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
        e.target.value = val;
        state.otp[idx] = val;
        input.classList.toggle('filled', !!val);
        checkComplete();
        if (val) focusNext(idx);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !state.otp[idx]) {
          focusPrev(idx);
        }
        if (e.key === 'Enter' && !btn.disabled) {
          handleVerifyOtp(container);
        }
      });

      input.addEventListener('focus', () => {
        input.classList.add('focused');
      });

      input.addEventListener('blur', () => {
        input.classList.remove('focused');
      });
    });

    btn.addEventListener('click', () => handleVerifyOtp(container));
    setTimeout(() => {
      const first = container.querySelector('#otp-0');
      if (first) first.focus();
    }, 400);
  }

  async function handleVerifyOtp(container) {
    const code = state.otp.join('');
    if (code.length < 6 || state.loading) return;
    const phone = `+251${state.phone}`;
    state.loading = true;
    state.error = null;

    try {
      const data = await API.verifyOtp(phone, code, 'patient', state.isRegistrationMode);
      Store.setToken(data.token);
      Store.setUser(data.user);
      state.loading = false;

      const hasProfile = data.user.patientProfile != null;
      await Router.navigate(hasProfile ? 'home' : 'setup');
    } catch (err) {
      state.error = err.message;
      state.loading = false;
      render(container);
    }
  }

  function render(container) {
    if (state.step === 'phone' && state.otpSent && !state.loading) {
      state.step = 'otp';
    }

    TG.hideMainButton();

    if (state.step === 'phone') {
      renderPhone(container);
    } else {
      renderOtp(container);
    }
  }

  return { render };
})();
