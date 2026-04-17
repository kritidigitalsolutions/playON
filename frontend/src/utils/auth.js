const TOKEN_KEY = "playon_admin_token";
const PROFILE_KEY = "playon_admin_profile";

const getSessionStore = () => window.sessionStorage;
const getLegacyStore = () => window.localStorage;

const removeKeyFromStores = (key) => {
  getSessionStore().removeItem(key);
  getLegacyStore().removeItem(key);
};

export const clearAdminSession = () => {
  removeKeyFromStores(TOKEN_KEY);
  removeKeyFromStores(PROFILE_KEY);
};

export const storeAdminSession = (token, admin) => {
  clearAdminSession();
  getSessionStore().setItem(TOKEN_KEY, token);

  if (admin) {
    getSessionStore().setItem(PROFILE_KEY, JSON.stringify(admin));
  }
};

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload?.exp) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    return true;
  }
};

export const getValidAdminToken = () => {
  const token = getSessionStore().getItem(TOKEN_KEY);

  if (!token) {
    removeKeyFromStores(TOKEN_KEY);
    removeKeyFromStores(PROFILE_KEY);
    return null;
  }

  if (isTokenExpired(token)) {
    clearAdminSession();
    return null;
  }

  return token;
};

export const getAdminProfile = () => {
  try {
    const rawProfile = getSessionStore().getItem(PROFILE_KEY);
    return rawProfile ? JSON.parse(rawProfile) : null;
  } catch (error) {
    removeKeyFromStores(PROFILE_KEY);
    return null;
  }
};

export { PROFILE_KEY, TOKEN_KEY };
