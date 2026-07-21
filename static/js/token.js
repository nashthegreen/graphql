import { TOKEN_KEY } from "./constants.js";
import { getUserIdFromToken, isJwtValid } from "./jwt.js";

export const appState = {
  token: null,
  userId: null,
};

export function getToken() {
  return appState.token || localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  const cleaned = String(token || "").trim();

  if (!isJwtValid(cleaned)) {
    clearToken();
    return false;
  }

  appState.token = cleaned;
  localStorage.setItem(TOKEN_KEY, cleaned);
  appState.userId = getUserIdFromToken(cleaned);
  return true;
}

export function clearToken() {
  appState.token = null;
  appState.userId = null;
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  const token = getToken();
  if (!isJwtValid(token)) {
    if (token) clearToken();
    return false;
  }
  return true;
}
