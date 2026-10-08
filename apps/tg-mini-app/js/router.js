const Router = (() => {
  let currentRoute = null;
  let routes = {};
  let beforeHooks = [];
  let history = [];
  let navigatingBack = false;

  // Bottom tab bar mirroring apps/mobile/app/(tabs)/_layout.tsx
  const TAB_ITEMS = [
    {
      route: 'home',
      label: 'Services',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
      activeIcon: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
    },
    {
      route: 'doctors',
      label: 'Doctors',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7.5" r="3.5"/><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1"/><path d="M16.5 4.6a3.5 3.5 0 0 1 0 5.8"/><path d="M18.5 13.2A5 5 0 0 1 21.5 18v2"/></svg>',
      activeIcon: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="7.5" r="4"/><path d="M9 13c-3.3 0-6 2.2-6 5v1h12v-1c0-2.8-2.7-5-6-5z"/><circle cx="17.5" cy="8" r="3"/><path d="M17.5 12.5c-.9 0-1.7.2-2.4.5 1.2 1 2 2.4 2.2 4h5.2v-1.2c0-2-2.1-3.3-5-3.3z"/></svg>',
    },
    {
      route: 'equipment',
      label: 'Equipment',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/><path d="M9.5 6.5V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/><path d="M9.5 3.5h-2M16.5 3.5h2M9.5 20.5h-2M16.5 20.5h2M3.5 9.5v-2M3.5 16.5v2M20.5 9.5v-2M20.5 16.5v2"/></svg>',
      activeIcon: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/><rect x="9.5" y="2.5" width="5" height="3" rx="1"/><rect x="1.5" y="7.5" width="3" height="5" rx="1"/><rect x="1.5" y="13.5" width="3" height="5" rx="1"/><rect x="19.5" y="7.5" width="3" height="5" rx="1"/><rect x="19.5" y="13.5" width="3" height="5" rx="1"/><rect x="9.5" y="18.5" width="5" height="3" rx="1"/></svg>',
    },
    {
      route: 'appointments',
      label: 'Appointments',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
      activeIcon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v2H5.5A2.5 2.5 0 0 0 3 6.5V19a2.5 2.5 0 0 0 2.5 2.5h13A2.5 2.5 0 0 0 21 19V6.5A2.5 2.5 0 0 0 18.5 4H17V2h-2v2H9V2H7zm12 8H5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V10z"/></svg>',
    },
    {
      route: 'profile',
      label: 'Profile',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5v-.8A5.7 5.7 0 0 1 10.2 14h3.6a5.7 5.7 0 0 1 5.7 5.7v.8"/></svg>',
      activeIcon: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4.5"/><path d="M12 13.5c-4.4 0-8 2.7-8 6.1V21h16v-1.4c0-3.4-3.6-6.1-8-6.1z"/></svg>',
    },
  ];

  const TAB_ROUTES = TAB_ITEMS.map((item) => item.route);

  function register(name, renderFn) {
    routes[name] = renderFn;
  }

  function addBeforeHook(fn) {
    beforeHooks.push(fn);
  }

  // Tab roots behave like the APK tab screens: no back affordance.
  const HIDE_BACK = ['home', 'login', 'onboarding', 'doctors', 'equipment', 'appointments', 'profile'];

  function ensureTabBar() {
    if (document.getElementById('bm-tab-bar')) return;
    const bar = document.createElement('nav');
    bar.id = 'bm-tab-bar';
    bar.className = 'tab-bar';
    bar.innerHTML = TAB_ITEMS.map((item) => `
      <button class="tab-item" data-route="${item.route}" aria-label="${item.label}">
        <span class="tab-icon">${item.icon}</span>
        <span class="tab-label">${item.label}</span>
      </button>`).join('');
    document.body.appendChild(bar);
    bar.querySelectorAll('.tab-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        if (route === currentRoute) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        // Tab switches reset the stack, like the APK tabs.
        history = [];
        navigate(route);
      });
    });
  }

  function updateTabBar(route) {
    const bar = document.getElementById('bm-tab-bar');
    if (!bar) return;
    const show = TAB_ROUTES.includes(route);
    bar.style.display = show ? 'flex' : 'none';
    document.body.classList.toggle('has-tab-bar', show);
    bar.querySelectorAll('.tab-item').forEach((btn) => {
      const active = btn.dataset.route === route;
      btn.classList.toggle('active', active);
      const icon = btn.querySelector('.tab-icon');
      const item = TAB_ITEMS.find((i) => i.route === btn.dataset.route);
      if (item) icon.innerHTML = active ? item.activeIcon : item.icon;
    });
  }

  async function navigate(name, params = {}) {
    for (const hook of beforeHooks) {
      const result = hook(name, params);
      if (result === false) return;
    }

    TG.hideMainButton();

    if (HIDE_BACK.includes(name)) {
      TG.hideBackButton();
    } else {
      TG.showBackButton();
    }

    if (!navigatingBack && currentRoute && currentRoute !== name) {
      history.push(currentRoute);
    }
    navigatingBack = false;

    const app = document.getElementById('app');
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));

    let el = document.getElementById(`screen-${name}`);
    if (!el) {
      el = document.createElement('div');
      el.id = `screen-${name}`;
      el.className = 'screen';
      app.appendChild(el);
    }

    el.classList.add('active');
    currentRoute = name;

    ensureTabBar();
    updateTabBar(name);

    const renderFn = routes[name];
    if (renderFn) {
      el.innerHTML = '';
      try {
        await renderFn(el, params);
      } catch (err) {
        el.innerHTML = `<div class="error-screen"><div class="alert alert-error">Something went wrong: ${err.message}</div></div>`;
        console.error('Router render error:', err);
      }
    }

    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      TG.expand();
    });
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  function goBack() {
    if (history.length > 0) {
      const prev = history.pop();
      navigatingBack = true;
      navigate(prev);
    } else {
      navigate('home');
    }
  }

  return {
    register,
    addBeforeHook,
    navigate,
    getCurrentRoute,
    goBack,
  };
})();
