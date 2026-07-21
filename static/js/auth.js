import { signIn } from "./api.js";
import { loginEl, logoutBtn } from "./dom.js";
import { navigate, resolveRoute } from "./router.js";
import { clearToken, getToken, setToken } from "./token.js";

function showLoginError(message) {
  loginEl.error.textContent = message;
}

function clearLoginError() {
  loginEl.error.textContent = "";
}

function logout() {
  clearToken();
  loginEl.form.reset();
  clearLoginError();
  navigate("/login", { replace: true });
}

export function checkSession() {
  const stored = getToken();
  if (stored) setToken(stored);
  resolveRoute(location.pathname);
}

export function bindAuthEvents() {
  loginEl.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearLoginError();

    const identifier = loginEl.identifier.value.trim();
    const password = loginEl.password.value;

    if (!identifier || !password) {
      showLoginError("Please enter your username or email and password.");
      return;
    }

    loginEl.submitBtn.disabled = true;

    try {
      const { ok, token, error } = await signIn(identifier, password);

      if (!ok) {
        showLoginError(error);
        return;
      }

      if (!setToken(token)) {
        showLoginError("Received an invalid session token. Please try again.");
        return;
      }

      loginEl.form.reset();
      navigate("/profile", { replace: true });
    } catch {
      showLoginError("Unable to sign in. Please try again.");
    } finally {
      loginEl.submitBtn.disabled = false;
    }
  });

  logoutBtn?.addEventListener("click", logout);
}
