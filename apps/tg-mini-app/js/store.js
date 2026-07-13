const Store = (() => {
  const KEYS = {
    TOKEN: 'bm_token',
    USER: 'bm_user',
    PROFILE: 'bm_profile',
  };

  return {
    getToken() {
      return localStorage.getItem(KEYS.TOKEN);
    },

    setToken(token) {
      localStorage.setItem(KEYS.TOKEN, token);
    },

    getUser() {
      try {
        const raw = localStorage.getItem(KEYS.USER);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },

    setUser(user) {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    },

    getProfile() {
      try {
        const raw = localStorage.getItem(KEYS.PROFILE);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },

    setProfile(profile) {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    },

    clear() {
      localStorage.removeItem(KEYS.TOKEN);
      localStorage.removeItem(KEYS.USER);
      localStorage.removeItem(KEYS.PROFILE);
    },

    clearAuth() {
      localStorage.removeItem(KEYS.TOKEN);
      localStorage.removeItem(KEYS.USER);
    },
  };
})();
