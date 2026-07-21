export function extractToken(responseText) {
  const trimmed = responseText.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") {
      return parsed.trim();
    }
    if (parsed && typeof parsed === "object") {
      const token =
        parsed.token || parsed.jwt || parsed.access_token || parsed.accessToken;
      if (typeof token === "string") return token.trim();
    }
  } catch {
    // Response is plain text, not JSON.
  }

  return trimmed.replace(/^"+|"+$/g, "").trim();
}

export function isJwtFormat(token) {
  if (typeof token !== "string" || !token) return false;
  if (/["'\s]/.test(token)) return false;
  const parts = token.split(".");
  return (
    parts.length === 3 &&
    parts.every((part) => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part))
  );
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function parseJwtPayload(token) {
  if (!isJwtFormat(token)) return null;

  try {
    return JSON.parse(decodeBase64Url(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function getUserIdFromToken(token) {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const hasuraClaims = payload["https://hasura.io/jwt/claims"];
  if (hasuraClaims?.["x-hasura-user-id"]) {
    return Number(hasuraClaims["x-hasura-user-id"]);
  }

  return Number(payload.id ?? payload.sub ?? payload.userId) || null;
}
