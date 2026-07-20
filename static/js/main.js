import { bindAuthEvents, checkSession } from "./auth.js";
import { resolveRoute } from "./router.js";
import { bindTabs } from "./tabs.js";

function initApp() {
  bindAuthEvents();
  bindTabs();
  checkSession();

  window.addEventListener("popstate", () => {
    resolveRoute(location.pathname);
  });
}

initApp();
