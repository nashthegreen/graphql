import { GRAPHQL_URL, SIGNIN_URL } from "./constants.js";
import { extractToken, isJwtValid } from "./jwt.js";
import { clearToken, getToken } from "./token.js";

export class SessionExpiredError extends Error {
  constructor(message = "Session expired. Please sign in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

function isAuthFailure(status, data) {
  if (status === 401 || status === 403) return true;

  return (data.errors || []).some((err) => {
    const message = String(err.message || "").toLowerCase();
    return (
      message.includes("jwt") ||
      message.includes("unauthorized") ||
      message.includes("invalid token") ||
      /not\s+authenticated/.test(message)
    );
  });
}

function expireSession() {
  clearToken();
  window.dispatchEvent(new CustomEvent("session-expired"));
  throw new SessionExpiredError();
}

export async function signIn(identifier, password) {
  const credentials = btoa(`${identifier}:${password}`);

  const res = await fetch(SIGNIN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    return {
      ok: false,
      error: message || "Invalid username/email or password.",
    };
  }

  const token = extractToken(await res.text());

  if (!isJwtValid(token)) {
    return {
      ok: false,
      error: "Sign in succeeded but the server returned an invalid token.",
    };
  }

  return { ok: true, token };
}

export async function graphqlRequest(query, variables = {}) {
  const token = getToken();
  if (!isJwtValid(token)) {
    expireSession();
  }

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json().catch(() => ({}));

  if (isAuthFailure(res.status, data)) {
    expireSession();
  }

  if (!res.ok) {
    throw new Error(data.message || "GraphQL request failed");
  }

  if (data.errors?.length) {
    return data;
  }

  return data;
}
