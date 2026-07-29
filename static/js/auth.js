import { signIn } from "./api.js";
import { getLoginEl } from "./dom.js";
import { mountView, navigate, resolveRoute } from "./router.js";
import { clearToken, getToken, setToken } from "./token.js";

function showLoginError(message) {
  const el = getLoginEl().error;
  if (el) el.textContent = message;
}

function clearLoginError() {
  const el = getLoginEl().error;
  if (el) el.textContent = "";
}

async function onLoginSubmit(e) {
  e.preventDefault();
  clearLoginError();

  const loginEl = getLoginEl();
  const identifier = loginEl.identifier?.value.trim() || "";
  const password = loginEl.password?.value || "";

  if (!identifier || !password) {
    showLoginError("Please enter your username or email and password.");
    return;
  }

  if (loginEl.submitBtn) loginEl.submitBtn.disabled = true;

  try {
    const { ok, token, error } = await signIn(identifier, password);

    if (!ok) {
      showLoginError(error);
      return;
    }

    if (!setToken(token)) {
      showLoginError(
        "Received an invalid or expired session token. Please try again.",
      );
      return;
    }

    loginEl.form?.reset();
    navigate("/profile", { replace: true });
  } catch {
    showLoginError("Unable to sign in. Please try again.");
  } finally {
    const btn = getLoginEl().submitBtn;
    if (btn) btn.disabled = false;
  }
}

export function logout() {
  clearToken();
  navigate("/login", { replace: true });
}

export function checkSession() {
  const stored = getToken();
  if (stored) setToken(stored);
  mountView("loading");
  resolveRoute(location.pathname);
}

/**
 * Mount the login view and bind its events. Cleanup runs on unmount.
 */
export function mountLogin() {
  mountView("login", {
    mount() {
      const { form } = getLoginEl();
      form?.addEventListener("submit", onLoginSubmit);
      clearLoginError();

      return () => {
        form?.removeEventListener("submit", onLoginSubmit);
      };
    },
  });
}

/** Bind global auth listeners once (session expiry). */
export function bindAuthEvents() {
  window.addEventListener("session-expired", logout);
}
