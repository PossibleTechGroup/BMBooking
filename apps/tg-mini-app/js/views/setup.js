const SetupView = (() => {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  let state = {
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodType: '',
    emergencyPhone: '',
    loading: false,
    error: null,
  };

  function render(container) {
    TG.hideMainButton();

    container.innerHTML = `
      <div class="header"><h1>Complete Profile</h1></div>
      <p class="text-hint mb-16">Tell us a bit about yourself</p>
      <div id="setup-error"></div>

      <div class="input-group">
        <label>Full Name *</label>
        <div class="input-field ${state.error && !state.fullName ? 'error' : ''}">
          <input type="text" id="setup-name" placeholder="Abebe Kebede" value="${escapeHtml(state.fullName)}" />
        </div>
      </div>

      <div class="input-group">
        <label>Date of Birth *</label>
        <div class="input-field ${state.error && !state.dateOfBirth ? 'error' : ''}">
          <input type="date" id="setup-dob" value="${state.dateOfBirth}" max="${new Date().toISOString().split('T')[0]}" />
        </div>
        ${state.dateOfBirth && TimeUtils.getCalendarFormat() === 'ethiopian' ? `
        <div style="display:flex;align-items:center;gap:5px;margin-top:4px;font-size:12px;color:var(--hint-color,#888);">
          <span>📅</span>
          <span>${TimeUtils.formatEthiopianCalendarDate(new Date(state.dateOfBirth + 'T12:00:00'), 'medium')}</span>
        </div>` : ''}
      </div>

      <div class="input-group">
        <label>Gender</label>
        <div class="chip-group-stretch">
          ${['Male', 'Female', 'Other'].map(g =>
            `<div class="chip ${state.gender === g ? 'selected' : ''}" data-gender="${g}">${g}</div>`
          ).join('')}
        </div>
      </div>

      <div class="input-group">
        <label>Blood Type (optional)</label>
        <div class="chip-group" id="blood-group">
          ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt =>
            `<div class="chip ${state.bloodType === bt ? 'selected' : ''}" data-blood="${bt}">${bt}</div>`
          ).join('')}
        </div>
      </div>

      <div class="input-group">
        <label>Emergency Contact (optional)</label>
        <div class="input-field">
          <span class="prefix">+251</span>
          <input type="tel" id="setup-emergency" placeholder="912 345 678" maxlength="9" value="${state.emergencyPhone}" />
        </div>
      </div>

      <button class="btn btn-primary mt-8" id="setup-save-btn">
        ${state.loading ? 'Saving...' : 'Save & Continue'}
      </button>
    `;

    if (state.error) {
      container.querySelector('#setup-error').innerHTML =
        `<div class="alert alert-error">${state.error}</div>`;
    }

    container.querySelector('#setup-name').addEventListener('input', (e) => {
      state.fullName = e.target.value;
      state.error = null;
    });

    container.querySelector('#setup-dob').addEventListener('change', (e) => {
      state.dateOfBirth = e.target.value;
      state.error = null;
      render(container);
    });

    container.querySelectorAll('[data-gender]').forEach(el => {
      el.addEventListener('click', () => {
        state.gender = el.dataset.gender;
        container.querySelectorAll('[data-gender]').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    container.querySelector('#blood-group')?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-blood]');
      if (!chip) return;
      const bt = chip.dataset.blood;
      state.bloodType = state.bloodType === bt ? '' : bt;
      container.querySelectorAll('[data-blood]').forEach(c => c.classList.remove('selected'));
      if (state.bloodType) chip.classList.add('selected');
    });

    container.querySelector('#setup-emergency').addEventListener('input', (e) => {
      state.emergencyPhone = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = state.emergencyPhone;
    });

    container.querySelector('#setup-save-btn').addEventListener('click', handleSave);
  }

  async function handleSave() {
    if (!state.fullName.trim() || !state.dateOfBirth) {
      state.error = 'Full name and date of birth are required';
      const container = document.getElementById('screen-setup');
      render(container);
      return;
    }

    state.loading = true;
    state.error = null;
    const container = document.getElementById('screen-setup');
    render(container);

    try {
      const data = {
        fullName: state.fullName.trim(),
        dateOfBirth: state.dateOfBirth,
        gender: state.gender,
        bloodType: state.bloodType || undefined,
        emergencyContact: state.emergencyPhone ? `+251${state.emergencyPhone}` : undefined,
      };

      await API.submitPatientProfile(data);
      const user = Store.getUser();
      if (user) {
        user.patientProfile = data;
        Store.setUser(user);
      }
      state.loading = false;
      try {
        await Router.navigate('home');
      } catch (e) {
        state.error = e.message;
        render(container);
      }
    } catch (err) {
      state.error = err.message;
      state.loading = false;
      render(container);
    }
  }

  return { render };
})();
