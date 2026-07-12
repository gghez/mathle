import type { Challenge } from '../game/challenge';

// A challenge is tiny (a seed + a score to beat), so the token stays short.
// Versioned so the payload shape can evolve without breaking old links.

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromUrlSafe(s: string): string {
  return s.replace(/-/g, '+').replace(/_/g, '/');
}

/** Encode a challenge into a compact URL-safe token. */
export function encodeChallenge(c: Challenge): string {
  const payload = JSON.stringify(['v1', c.seed, c.scoreToBeat]);
  return toUrlSafe(btoa(unescape(encodeURIComponent(payload))));
}

/** Decode a challenge token; returns null on corrupt or unexpected input. */
export function decodeChallenge(token: string): Challenge | null {
  try {
    if (!token) return null;
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
