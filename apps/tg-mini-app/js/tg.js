const TG = (() => {
  let webapp = null;
  let ready = false;

  function loadTelegramSDK() {
    return new Promise((resolve) => {
      if (window.Telegram?.WebApp) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[src*="telegram-web-app.js"]');
      if (existing) {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', resolve);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
      setTimeout(resolve, 5000);
    });
  }

  async function init() {
    await loadTelegramSDK();
    webapp = window.Telegram?.WebApp || null;
    if (!webapp) {
      console.warn('Telegram WebApp SDK not available (running outside Telegram?)');
      return;
    }
    webapp.ready();
    webapp.expand();
    ready = true;

    document.documentElement.classList.toggle('dark', webapp.colorScheme === 'dark');
    syncThemeColors();

    webapp.onEvent('themeChanged', () => {
      document.documentElement.classList.toggle('dark', webapp.colorScheme === 'dark');
      syncThemeColors();
    });

    webapp.onEvent('viewportChanged', () => {
      webapp.expand();
    });

    webapp.MainButton.onClick(() => {
      const event = new CustomEvent('tg-main-button');
      document.dispatchEvent(event);
    });

    if (webapp.BackButton) {
      webapp.BackButton.onClick(() => {
        Router.goBack();
      });
    }

    if (webapp.disableVerticalSwipes) {
      try { webapp.disableVerticalSwipes(); } catch { }
    }
  }

  function close() {
    webapp?.close();
  }

  function showMainButton(text, callback) {
    if (!webapp) return;
    webapp.MainButton.setText(text);
    webapp.MainButton.show();
    webapp.MainButton.enable();
    if (callback) {
      const handler = () => {
        callback();
        document.removeEventListener('tg-main-button', handler);
      };
      document.addEventListener('tg-main-button', handler);
    }
  }

  function hideMainButton() {
    webapp?.MainButton.hide();
  }

  function showBackButton() {
    webapp?.BackButton?.show();
  }

  function hideBackButton() {
    webapp?.BackButton?.hide();
  }

  function showAlert(msg) {
    webapp?.showAlert(msg);
  }

  function showConfirm(msg) {
    return webapp?.showConfirm(msg) ?? Promise.resolve(true);
  }

  function openLink(url) {
    webapp?.openLink(url);
  }

  function sendData(data) {
    webapp?.sendData(JSON.stringify(data));
  }

  function expand() {
    webapp?.expand();
  }

  return {
    init,
    close,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    showAlert,
    showConfirm,
    openLink,
    sendData,
    expand,
    get ready() { return ready; },
    get webapp() { return webapp; },
    get colorScheme() { return webapp?.colorScheme || 'light'; },
    get platform() { return webapp?.platform || 'unknown'; },
  };
})();
