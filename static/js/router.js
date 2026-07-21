import { isAuthenticated } from "./token.js";
import { views } from "./dom.js";
import { loadProfile } from "./profile.js";

export function showView(name) {
  Object.values(views).forEach((view) => view?.classList.add("hidden"));
  views[name]?.classList.remove("hidden");
}

export function resolveRoute(path = location.pathname) {
  if (path === "/profile") {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }
    showView("profile");
    loadProfile();
    return;
  }

  if (path === "/login" || path === "/") {
    if (isAuthenticated()) {
      navigate("/profile", { replace: true });
      return;
    }
    showView("login");
    return;
  }

  navigate("/login", { replace: true });
}

export function navigate(path, { replace = false } = {}) {
  const url = path.startsWith("/") ? path : `/${path}`;

  if (replace) {
    history.replaceState({ path: url }, "", url);
  } else {
    history.pushState({ path: url }, "", url);
  }

  resolveRoute(url);
}
