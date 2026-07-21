/**
 * App mount path for GitHub Pages project sites (`/repo-name`) or `''` at domain root.
 * Derived from this module's URL so it works without hardcoding the repo name.
 */
export const BASE_PATH = (() => {
  const root = new URL("../../", import.meta.url);
  let path = root.pathname;
  if (path.endsWith("/")) path = path.slice(0, -1);
  return path;
})();

/** Strip the deploy base from a location pathname → app route (`/`, `/login`, `/profile`). */
export function stripBase(pathname = location.pathname) {
  if (!BASE_PATH) return pathname || "/";
  if (pathname === BASE_PATH || pathname === `${BASE_PATH}/`) return "/";
  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length) || "/";
  }
  return pathname || "/";
}

/** Prefix an app route with the deploy base for history / links. */
export function withBase(path) {
  const route = path.startsWith("/") ? path : `/${path}`;
  if (route === "/") return BASE_PATH ? `${BASE_PATH}/` : "/";
  return `${BASE_PATH}${route}`;
}
