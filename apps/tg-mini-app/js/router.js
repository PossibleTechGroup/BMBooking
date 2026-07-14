const Router = (() => {
  let currentRoute = null;
  let routes = {};
  let beforeHooks = [];
  let history = [];

  function register(name, renderFn) {
    routes[name] = renderFn;
  }

  function addBeforeHook(fn) {
    beforeHooks.push(fn);
  }

  async function navigate(name, params = {}) {
    for (const hook of beforeHooks) {
      const result = hook(name, params);
      if (result === false) return;
    }

    TG.hideMainButton();

    if (currentRoute && currentRoute !== name) {
      history.push(currentRoute);
    }

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
