(function () {
  // Ensure every required script actually loaded. A transient network/DNS
  // failure on any single <script> tag (e.g. js/i18n.js) otherwise crashes
  // views at render time with "X is not defined".
  var REQUIRED = [
    ['Store', 'js/store.js'],
    ['API', 'js/api.js'],
    ['I18n', 'js/i18n.js'],
    ['TG', 'js/tg.js'],
    ['Router', 'js/router.js'],
    ['OnboardingView', 'js/views/onboarding.js'],
    ['LoginView', 'js/views/login.js'],
    ['SetupView', 'js/views/setup.js'],
    ['HomeView', 'js/views/home.js'],
    ['AppointmentsView', 'js/views/appointments.js'],
    ['BookingView', 'js/views/booking.js'],
    ['ProfileView', 'js/views/profile.js'],
    ['DoctorsView', 'js/views/doctors.js'],
    ['EquipmentView', 'js/views/equipment.js'],
  ];

  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') === -1 ? '?' : '&') + 'retry=' + Date.now();
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }

  function exists(name) {
    // Globals are declared with top-level `const` (declarative bindings, not
    // window props), so a dynamic check needs eval'd typeof (never throws).
    try { return eval('typeof ' + name) !== 'undefined'; } catch (e) { return false; }
  }

  function ensureAll(attempt) {
    var missing = REQUIRED.filter(function (r) { return !exists(r[0]); });
    if (missing.length === 0) return Promise.resolve();
    if (attempt >= 3) {
      // Last resort: load whatever is left once more, then boot anyway.
      return Promise.all(missing.map(function (r) { return loadScript(r[1]); })).then(function () {});
    }
    return Promise.all(missing.map(function (r) { return loadScript(r[1]); })).then(function () {
      return new Promise(function (resolve) { setTimeout(resolve, 400 * attempt); }).then(function () {
        return ensureAll(attempt + 1);
      });
    });
  }

  function start() {
  if (typeof I18n === 'undefined') {
    window.I18n = {
      t: function (k) { return k; },
      setLanguage: function () {},
      getLanguage: function () { return 'en'; },
      getLanguages: function () { return [{ code: 'en', label: 'English' }]; },
    };
  }
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
  }

  ensureAll(1).then(start);
})();
