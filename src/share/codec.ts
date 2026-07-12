import type { Challenge } from '../game/challenge';

// A challenge is tiny (a seed + an optional score to beat), so the token is just
// the seed in base36, optionally followed by ".<score base36>" when there is a
// score to beat — a handful of characters. The '.' is absent from the base64url
// alphabet and every legacy "v1" token starts with uppercase base64, so the
// compact and legacy forms are always unambiguous when decoding; previously
// shared links keep working via the legacy fallback.

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromUrlSafe(s: string): string {
  return s.replace(/-/g, '+').replace(/_/g, '/');
}

// --- Compact seed form: "<seed base36>" or "<seed base36>.<score base36>" ---
const COMPACT_RE = /^([0-9a-z]+)(?:\.([0-9a-z]+))?$/;

function encodeCompact(seed: number, scoreToBeat: number | null): string {
  const s = (seed >>> 0).toString(36);
  return scoreToBeat == null ? s : `${s}.${scoreToBeat.toString(36)}`;
}

function decodeCompact(token: string): Challenge | null {
  const m = COMPACT_RE.exec(token);
  if (!m) return null;
  const seed = parseInt(m[1], 36);
  if (!Number.isSafeInteger(seed)) return null;
  const scoreToBeat = m[2] === undefined ? null : parseInt(m[2], 36);
  if (scoreToBeat !== null && !Number.isSafeInteger(scoreToBeat)) return null;
  return { seed, scoreToBeat };
}

function encodeLegacy(c: Challenge): string {
  const payload = JSON.stringify(['v1', c.seed, c.scoreToBeat]);
  return toUrlSafe(btoa(unescape(encodeURIComponent(payload))));
}

function decodeLegacy(token: string): Challenge | null {
  try {
    const json = decodeURIComponent(escape(atob(fromUrlSafe(token))));
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data) || data[0] !== 'v1') return null;
    const [, seed, scoreToBeat] = data as [string, unknown, unknown];
    if (typeof seed !== 'number' || !Number.isFinite(seed)) return null;
    if (scoreToBeat !== null && typeof scoreToBeat !== 'number') return null;
    return { seed, scoreToBeat };
  } catch {
    return null;
  }
}

/** Encode a challenge into a compact URL-safe token. */
export function encodeChallenge(c: Challenge): string {
  const scoreOk =
    c.scoreToBeat == null || (Number.isSafeInteger(c.scoreToBeat) && c.scoreToBeat >= 0);
  if (Number.isSafeInteger(c.seed) && c.seed >= 0 && scoreOk) {
    return encodeCompact(c.seed, c.scoreToBeat);
  }
  return encodeLegacy(c);
}

/** Decode a challenge token; returns null on corrupt or unexpected input. */
export function decodeChallenge(token: string): Challenge | null {
  if (!token) return null;
  return decodeCompact(token) ?? decodeLegacy(token);
}
