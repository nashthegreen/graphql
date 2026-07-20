import { TOKEN_KEY } from "./constants.js";
import { getUserIdFromToken, isJwtFormat } from "./jwt.js";
import { appState } from "./state.js";

export function getToken() {
  return appState.token || localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  const cleaned = String(token || "").trim();

  if (!isJwtFormat(cleaned)) {
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
  return isJwtFormat(token);
}
