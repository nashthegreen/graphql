import { withBase, stripBase } from "./base.js";
import { isAuthenticated } from "./token.js";
import { views } from "./dom.js";
import { loadProfile } from "./profile.js";

export function showView(name) {
  Object.values(views).forEach((view) => view?.classList.add("hidden"));
  views[name]?.classList.remove("hidden");
}

export function resolveRoute(path = location.pathname) {
  const route = stripBase(path);

  if (route === "/profile") {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }
    showView("profile");
    loadProfile();
    return;
  }

  if (route === "/login" || route === "/") {
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
  const route = path.startsWith("/") ? path : `/${path}`;
  const url = withBase(route);

  if (replace) {
    history.replaceState({ path: route }, "", url);
  } else {
    history.pushState({ path: route }, "", url);
  }

  resolveRoute(route);
}
