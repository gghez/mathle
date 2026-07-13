import { DEFAULT_DIFFICULTY, type Challenge, type Difficulty } from '../game/challenge';

// A challenge is tiny (a seed + an optional score to beat + a difficulty), so
// the token is just the seed in base36, optionally followed by ".<score base36>"
// when there is a score to beat, then "~e" when the mode is easy — a handful of
// characters. The default 'medium' mode carries no marker, so links shared
// before difficulty existed (and every fresh medium link) stay byte-identical.
// Neither '.' nor '~' is in the base64url alphabet and every legacy "v1" token
// starts with uppercase base64, so the compact and legacy forms are always
// unambiguous when decoding; previously shared links keep working via the
// legacy fallback.

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromUrlSafe(s: string): string {
  return s.replace(/-/g, '+').replace(/_/g, '/');
}

// --- Compact seed form: "<seed base36>" + optional ".<score base36>" + "~e" ---
const COMPACT_RE = /^([0-9a-z]+)(?:\.([0-9a-z]+))?(?:~([em]))?$/;

/** Map a difficulty to its one-letter token marker (medium is unmarked). */
const DIFF_CODE: Record<Difficulty, string> = { easy: 'e', medium: 'm' };
const DIFF_BY_CODE: Record<string, Difficulty> = { e: 'easy', m: 'medium' };

function encodeCompact(seed: number, scoreToBeat: number | null, difficulty: Difficulty): string {
  const s = (seed >>> 0).toString(36);
  const body = scoreToBeat == null ? s : `${s}.${scoreToBeat.toString(36)}`;
  // Only the non-default mode gets a marker, keeping medium links unchanged.
  return difficulty === DEFAULT_DIFFICULTY ? body : `${body}~${DIFF_CODE[difficulty]}`;
}

function decodeCompact(token: string): Challenge | null {
  const m = COMPACT_RE.exec(token);
  if (!m) return null;
  const seed = parseInt(m[1], 36);
  if (!Number.isSafeInteger(seed)) return null;
  const scoreToBeat = m[2] === undefined ? null : parseInt(m[2], 36);
  if (scoreToBeat !== null && !Number.isSafeInteger(scoreToBeat)) return null;
  const difficulty = m[3] === undefined ? DEFAULT_DIFFICULTY : DIFF_BY_CODE[m[3]];
  return { seed, scoreToBeat, difficulty };
}

function encodeLegacy(c: Challenge): string {
  const payload = JSON.stringify(['v1', c.seed, c.scoreToBeat, c.difficulty]);
  return toUrlSafe(btoa(unescape(encodeURIComponent(payload))));
}

function decodeLegacy(token: string): Challenge | null {
  try {
    const json = decodeURIComponent(escape(atob(fromUrlSafe(token))));
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data) || data[0] !== 'v1') return null;
    const [, seed, scoreToBeat, difficulty] = data as [string, unknown, unknown, unknown];
    if (typeof seed !== 'number' || !Number.isFinite(seed)) return null;
    if (scoreToBeat !== null && typeof scoreToBeat !== 'number') return null;
    // Pre-difficulty v1 tokens have no 4th field → default to medium.
    const mode: Difficulty = difficulty === 'easy' ? 'easy' : DEFAULT_DIFFICULTY;
    return { seed, scoreToBeat, difficulty: mode };
  } catch {
    return null;
  }
}

/** Encode a challenge into a compact URL-safe token. */
export function encodeChallenge(c: Challenge): string {
  const scoreOk =
    c.scoreToBeat == null || (Number.isSafeInteger(c.scoreToBeat) && c.scoreToBeat >= 0);
  if (Number.isSafeInteger(c.seed) && c.seed >= 0 && scoreOk) {
    return encodeCompact(c.seed, c.scoreToBeat, c.difficulty);
  }
  return encodeLegacy(c);
}

/** Decode a challenge token; returns null on corrupt or unexpected input. */
export function decodeChallenge(token: string): Challenge | null {
  if (!token) return null;
  return decodeCompact(token) ?? decodeLegacy(token);
}
