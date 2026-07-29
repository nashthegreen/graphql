import { withBase, stripBase } from "./base.js";
import { isAuthenticated } from "./token.js";
import { getApp } from "./dom.js";

let active = null;

/** @type {Record<string, () => void>} */
const pageMounts = {};

export function registerPages(handlers) {
  Object.assign(pageMounts, handlers);
}

export function unmountView() {
  if (!active) return;
  try {
    active.cleanup?.();
  } finally {
    getApp()?.replaceChildren();
    active = null;
  }
}

export function mountView(name, hooks = {}) {
  if (active?.name === name) return false;

  unmountView();

  const tpl = document.getElementById(`view-${name}`);
  const app = getApp();
  if (!tpl || !app) {
    console.error(`Missing template or app root for view "${name}"`);
    return false;
  }

  app.appendChild(tpl.content.cloneNode(true));

  const fromMount = hooks.mount?.();
  const cleanup =
    typeof fromMount === "function"
      ? fromMount
      : typeof hooks.unmount === "function"
        ? hooks.unmount
        : null;

  active = { name, cleanup };
  return true;
}

export function getActiveView() {
  return active?.name ?? null;
}

export function resolveRoute(path = location.pathname) {
  const route = stripBase(path);
  const authed = isAuthenticated();

  if (route === "/profile") {
    if (!authed) {
      navigate("/login", { replace: true });
      return;
    }
    pageMounts.profile?.();
    return;
  }

  if (route === "/login" || route === "/") {
    if (authed) {
      navigate("/profile", { replace: true });
      return;
    }
    pageMounts.login?.();
    return;
  }

  navigate(authed ? "/profile" : "/login", { replace: true });
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
