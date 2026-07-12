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

  it('encodes as a tiny "seed.score" token', () => {
    const token = encodeChallenge({ seed: 123456, scoreToBeat: 17 });
    expect(token).toMatch(/^[0-9a-z]+\.[0-9a-z]+$/);
    expect(token.length).toBeLessThan(10);
  });

  it('encodes a seed with no score to beat as a bare seed', () => {
    const token = encodeChallenge({ seed: 999, scoreToBeat: null });
    expect(token).toMatch(/^[0-9a-z]+$/);
    expect(decodeChallenge(token)).toEqual({ seed: 999, scoreToBeat: null });
  });

  it('is far shorter than the legacy base64 form', () => {
    const c = { seed: 2 ** 31 - 1, scoreToBeat: 42 };
    const compact = encodeChallenge(c);
    const legacy = btoa(
      unescape(encodeURIComponent(JSON.stringify(['v1', c.seed, c.scoreToBeat]))),
    );
    expect(compact.length).toBeLessThan(legacy.length / 2);
  });

  it('still decodes a legacy v1 token (backward compatible)', () => {
    const legacy = btoa(unescape(encodeURIComponent(JSON.stringify(['v1', 123456, 17]))));
    expect(decodeChallenge(legacy)).toEqual({ seed: 123456, scoreToBeat: 17 });
  });
});
