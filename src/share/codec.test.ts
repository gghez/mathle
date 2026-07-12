import { describe, it, expect } from 'vitest';
import { encodeChallenge, decodeChallenge } from './codec';

describe('challenge codec', () => {
  it('round-trips a challenge', () => {
    const c = { seed: 123456, scoreToBeat: 17 };
    expect(decodeChallenge(encodeChallenge(c))).toEqual(c);
  });

  it('round-trips a null scoreToBeat', () => {
    const c = { seed: 999, scoreToBeat: null };
    expect(decodeChallenge(encodeChallenge(c))).toEqual(c);
  });

  it('produces a URL-safe token (no +, /, =)', () => {
    const token = encodeChallenge({ seed: 2 ** 31 - 1, scoreToBeat: 42 });
    expect(token).not.toMatch(/[+/=]/);
  });

  it('returns null on garbage input', () => {
    expect(decodeChallenge('not-a-token')).toBeNull();
    expect(decodeChallenge('')).toBeNull();
  });

  it('rejects an unknown version', () => {
    const bad = btoa(JSON.stringify(['v9', 1, 2]));
    expect(decodeChallenge(bad)).toBeNull();
  });
});
