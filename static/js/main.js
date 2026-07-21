import { bindAuthEvents, checkSession } from "./auth.js";
import { resolveRoute } from "./router.js";

function initApp() {
  bindAuthEvents();
  checkSession();

  window.addEventListener("popstate", () => {
    resolveRoute(location.pathname);
  });
}

initApp();
