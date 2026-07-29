import { bindAuthEvents, checkSession, mountLogin } from "./auth.js";
import { mountProfile } from "./profile.js";
import { registerPages, resolveRoute } from "./router.js";

function initApp() {
  registerPages({
    login: mountLogin,
    profile: mountProfile,
  });

  bindAuthEvents();
  checkSession();

  window.addEventListener("popstate", () => {
    resolveRoute(location.pathname);
  });
}

initApp();
