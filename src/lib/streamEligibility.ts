/**
 * Stream eligibility: the single place that decides whether a stream may be offered
 * to ordinary users as playable.
 *
 * Records are never deleted or rewritten because of this. A record with no usable
 * stream keeps every field and stays available to catalog/internal tooling; it is
 * simply not "eligible", so public lists, search, featured strips, play buttons and
 * the sitemap leave it out.
 *
 * Eligibility describes what the DATA says. It is not a live health check:
 * a stream that fails at runtime (broadcaster outage, CORS, network) is reported by
 * the player at that moment and is never written back here as "permanently invalid".
 */

export type StreamState =
  /** URL present, well-formed, and not marked as disabled. */
  | "available"
  /** No URL in the record. */
  | "missing"
  /** A URL is present but is not a well-formed http(s) address. */
  | "invalid"
  /** http:// address. Browsers block it on an https page (mixed content). */
  | "insecure"
  /** The record is explicitly marked as not enabled (e.g. `catalog_only`). */
  | "not_enabled"
  /** The URL carries an access token whose expiry has passed. */
  | "expired"
  /** The URL is bound to one client/session (client-IP parameter, or a token that lives for under a day). */
  | "session_bound";

export interface StreamAssessment {
  state: StreamState;
  eligible: boolean;
  /** Short, factual, developer/admin-facing explanation. */
  reason: string;
}

export interface StreamInput {
  url?: string | null | undefined;
  /** Status as declared by the data owner, if any (e.g. "active", "catalog_only"). */
  declaredStatus?: string | null | undefined;
}

/** Declared statuses that mean "the owner has not enabled this stream". */
const NOT_ENABLED = new Set(["catalog_only", "disabled", "inactive", "offline", "retired"]);

/** A token that lives for less than this is treated as tied to one session. */
const MIN_DURABLE_TOKEN_SECONDS = 24 * 60 * 60;

function decodeJwtClaims(
  token: string,
): { exp?: number | undefined; iat?: number | undefined } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("utf8");
    const claims = JSON.parse(json) as { exp?: unknown; iat?: unknown };
    return {
      exp: typeof claims.exp === "number" ? claims.exp : undefined,
      iat: typeof claims.iat === "number" ? claims.iat : undefined,
    };
  } catch {
    return null;
  }
}

/** Looks for an expiry in JWT-style query tokens or a plain `exp`/`expires` epoch parameter. */
function tokenWindow(u: URL): { exp: number; iat?: number | undefined } | null {
  for (const value of u.searchParams.values()) {
    const claims = value.includes(".") ? decodeJwtClaims(value) : null;
    if (claims?.exp) return { exp: claims.exp, iat: claims.iat };
  }
  for (const key of ["exp", "expires", "expiry"]) {
    const raw = u.searchParams.get(key);
    if (raw && /^\d{10}$/.test(raw)) return { exp: Number(raw) };
  }
  return null;
}

export function isHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function assessStream(input: StreamInput, nowMs: number = Date.now()): StreamAssessment {
  const url = input.url?.trim();
  if (!url) return { state: "missing", eligible: false, reason: "No stream URL in the record." };
  if (!isHttpUrl(url))
    return {
      state: "invalid",
      eligible: false,
      reason: "Stream URL is not a valid http(s) address.",
    };

  const declared = input.declaredStatus?.trim().toLowerCase();
  if (declared && NOT_ENABLED.has(declared))
    return {
      state: "not_enabled",
      eligible: false,
      reason: `Record is marked "${declared}"; a stream URL is stored but not enabled for public use.`,
    };

  const u = new URL(url);
  if (u.protocol === "http:")
    return {
      state: "insecure",
      eligible: false,
      reason: "http:// streams are blocked by browsers on the https site (mixed content).",
    };

  const win = tokenWindow(u);
  if (win) {
    if (win.exp * 1000 <= nowMs)
      return {
        state: "expired",
        eligible: false,
        reason: "The access token in the URL has expired.",
      };
    if (win.iat && win.exp - win.iat < MIN_DURABLE_TOKEN_SECONDS)
      return {
        state: "session_bound",
        eligible: false,
        reason: "The URL carries a short-lived token, so it cannot be a durable public address.",
      };
  }
  if (u.searchParams.has("ip"))
    return {
      state: "session_bound",
      eligible: false,
      reason:
        "The URL is bound to one client IP address (ip= parameter) and will not work for other viewers.",
    };

  return { state: "available", eligible: true, reason: "Stream URL present and well-formed." };
}
