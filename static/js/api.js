import { GRAPHQL_URL, SIGNIN_URL } from "./constants.js";
import { extractToken, isJwtFormat } from "./jwt.js";
import { getToken } from "./token.js";

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

  if (!isJwtFormat(token)) {
    return {
      ok: false,
      error: "Sign in succeeded but the server returned an invalid token.",
    };
  }

  return { ok: true, token };
}

export async function graphqlRequest(query, variables = {}) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
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

  if (!res.ok) {
    throw new Error(data.message || "GraphQL request failed");
  }

  if (data.errors?.length) {
    return data;
  }

  return data;
}
