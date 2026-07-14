const SetupView = (() => {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const ICON = {
    arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
  };

  let state = {
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodType: '',
    emergencyPhone: '',
    loading: false,
    error: null,
    isEdit: false,
  };

  function resetState() {
    state = {
      fullName: '',
      dateOfBirth: '',
      gender: 'Male',
      bloodType: '',
      emergencyPhone: '',
      loading: false,
      error: null,
      isEdit: false,
    };
  }

  async function render(container, params) {
    TG.hideMainButton();

    const isEdit = params?.isEdit || false;

    if (isEdit && !state.isEdit) {
      resetState();
      state.isEdit = true;
      try {
        const profile = await API.getPatientProfile();
        if (profile) {
          state.fullName = profile.fullName || '';
          state.dateOfBirth = profile.dateOfBirth || '';
          state.gender = profile.gender || 'Male';
          state.bloodType = profile.bloodType || '';
          if (profile.emergencyContact) {
            state.emergencyPhone = profile.emergencyContact.replace('+251', '');
          }
        }
      } catch (e) {}
    } else if (!isEdit) {
      resetState();
    }

    const title = state.isEdit ? 'Edit Profile' : 'Complete Profile';
    const subtitle = state.isEdit ? 'Update your information' : 'Tell us a bit about yourself';

    container.innerHTML = `
      <div class="view-header">
        <button class="view-header-back" id="setup-back">
          ${ICON.arrowLeft}
          <span>Back</span>
        </button>
        <h1 class="view-header-title">${title}</h1>
        <div class="view-header-spacer"></div>
      </div>
      <p class="text-hint mb-16">${subtitle}</p>
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
        <div id="eth-calendar-display" style="display:none"></div>
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
        ${state.loading ? 'Saving...' : (state.isEdit ? 'Save Changes' : 'Save & Continue')}
      </button>
    `;

    if (state.error) {
      container.querySelector('#setup-error').innerHTML =
        `<div class="alert alert-error">${state.error}</div>`;
    }

    container.querySelector('#setup-back').addEventListener('click', () => Router.goBack());

    if (state.dateOfBirth && TimeUtils.getCalendarFormat() === 'ethiopian') {
      updateEthDisplay(container);
    }

    container.querySelector('#setup-name').addEventListener('input', (e) => {
      state.fullName = e.target.value;
      state.error = null;
    });

    container.querySelector('#setup-dob').addEventListener('change', (e) => {
      state.dateOfBirth = e.target.value;
      state.error = null;
      updateEthDisplay(container);
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

  function updateEthDisplay(container) {
    const ethDisplay = container.querySelector('#eth-calendar-display');
    if (!ethDisplay) return;
    if (state.dateOfBirth && TimeUtils.getCalendarFormat() === 'ethiopian') {
      ethDisplay.innerHTML = `
        <div style="display:flex;align-items:center;gap:5px;margin-top:4px;font-size:12px;color:var(--hint-color,#888);">
          ${ICON.calendar}
          <span>${TimeUtils.formatEthiopianCalendarDate(new Date(state.dateOfBirth + 'T12:00:00'), 'medium')}</span>
        </div>`;
      ethDisplay.style.display = 'block';
    } else {
      ethDisplay.style.display = 'none';
    }
  }

  async function handleSave() {
    if (!state.fullName.trim() || !state.dateOfBirth) {
      state.error = 'Full name and date of birth are required';
      const container = document.getElementById('screen-setup');
      render(container, { isEdit: state.isEdit });
      return;
    }

    state.loading = true;
    state.error = null;
    const container = document.getElementById('screen-setup');
    render(container, { isEdit: state.isEdit });

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
      state.isEdit = false;
      Router.goBack();
    } catch (err) {
      state.error = err.message;
      state.loading = false;
      render(container, { isEdit: state.isEdit });
    }
  }

  return { render };
})();
