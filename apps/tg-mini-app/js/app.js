(function () {
  TG.init();

  Router.register('login', (el) => LoginView.render(el));
  Router.register('setup', (el) => SetupView.render(el));
  Router.register('home', (el) => HomeView.render(el));
  Router.register('doctors', (el) => DoctorsView.render(el));
  Router.register('doctor-detail', (el, params) => DoctorDetailView.render(el, params));
  Router.register('booking', (el, params) => BookingView.render(el, params));
  Router.register('appointments', (el) => AppointmentsView.render(el));
  Router.register('profile', (el) => ProfileView.render(el));

  Router.addBeforeHook((name) => {
    if (name === 'login') return true;
    if (!Store.getToken() && name !== 'login') {
      Router.navigate('login');
      return false;
    }
    return true;
  });

  const token = Store.getToken();
  const user = Store.getUser();

  if (token && user) {
    if (user.patientProfile) {
      Router.navigate('home');
    } else {
      API.getPatientProfile()
        .then(profile => {
          if (profile) {
            Store.setProfile(profile);
            Router.navigate('home');
          } else {
            Router.navigate('setup');
          }
        })
        .catch(() => Router.navigate('setup'));
    }
  } else {
    Router.navigate('login');
  }
})();
