(function () {
  TG.init();

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  });

  Router.register('onboarding', (el) => OnboardingView.render(el));
  Router.register('login', (el) => LoginView.render(el));
  Router.register('setup', (el) => SetupView.render(el));
  Router.register('home', (el) => HomeView.render(el));
  Router.register('doctors', (el) => DoctorsView.render(el));
  Router.register('doctor-detail', (el, params) => DoctorDetailView.render(el, params));
  Router.register('booking', (el, params) => BookingView.render(el, params));
  Router.register('appointments', (el) => AppointmentsView.render(el));
  Router.register('equipment', (el) => EquipmentView.render(el));
  Router.register('profile', (el) => ProfileView.render(el));

  Router.addBeforeHook((name) => {
    if (name === 'login' || name === 'onboarding') return true;
    if (!Store.getToken() && name !== 'login') {
      Router.navigate('login');
      return false;
    }
    return true;
  });

  function resumeOrHome() {
    let pending = null;
    try {
      const raw = localStorage.getItem('bk_pending_payment');
      if (raw) pending = JSON.parse(raw);
    } catch {}
    if (pending && pending.doctorId) {
      Router.navigate('booking', { doctorId: pending.doctorId });
      return;
    }
    Router.navigate('home');
  }

  const token = Store.getToken();
  const user = Store.getUser();
  const onboarded = localStorage.getItem('bm_onboarded');

  if (token && user) {
    if (user.patientProfile) {
      resumeOrHome();
    } else {
      API.getPatientProfile()
        .then(profile => {
          if (profile) {
            Store.setProfile(profile);
            resumeOrHome();
          } else {
            Router.navigate('setup');
          }
        })
        .catch(() => Router.navigate('setup'));
    }
  } else if (!onboarded) {
    Router.navigate('onboarding');
  } else {
    Router.navigate('login');
  }
})();
