import { describe, it, expect } from 'vitest';
import { generateProblems, formatProblem, type Problem, type ProblemKind } from './challenge';

/** Allowed point values per kind — mirrors the generators in challenge.ts. */
const POINTS: Record<ProblemKind, number[]> = {
  mul: [3],
  div: [3],
  chain: [3, 5],
  equation: [4],
  word: [10],
};

/** Parse a signed integer that may be wrapped in parentheses / use U+2212. */
function parseSigned(s: string): number {
  return Number(s.replace(/[()]/g, '').replace(/−/g, '-'));
}

/** Split "a <op> b" on the spaced operator and return both operands. */
function operands(prompt: string, op: string): [number, number] {
  const idx = prompt.indexOf(` ${op} `);
  return [parseSigned(prompt.slice(0, idx)), parseSigned(prompt.slice(idx + op.length + 2))];
}

/** Recompute a chain's answer from its prompt: start ± each real give/receive. */
function evalChain(prompt: string): number {
  let total = Number(prompt.match(/a (\d+)/)![1]); // the starting amount
  for (const m of prompt.matchAll(/en (donne|perd|reçoit|gagne|trouve) (\d+)/g)) {
    const x = Number(m[2]);
    total += m[1] === 'donne' || m[1] === 'perd' ? -x : x;
  }
  return total;
}

describe('generateProblems', () => {
  it('is deterministic for a given seed', () => {
    expect(generateProblems(12345, 20)).toEqual(generateProblems(12345, 20));
  });

  it('produces different sequences for different seeds', () => {
    expect(generateProblems(1, 20)).not.toEqual(generateProblems(2, 20));
  });

  it('generates the requested count', () => {
    expect(generateProblems(7, 50)).toHaveLength(50);
  });

  it('mixes all five exercise types', () => {
    const kinds = new Set(generateProblems(999, 400).map((p) => p.kind));
    expect(kinds).toEqual(new Set<ProblemKind>(['mul', 'div', 'chain', 'equation', 'word']));
  });

  it('assigns a valid point value to each kind, with an integer answer', () => {
    for (const p of generateProblems(2024, 400)) {
      expect(POINTS[p.kind]).toContain(p.points);
      expect(Number.isInteger(p.answer)).toBe(true);
      expect(p.prompt.length).toBeGreaterThan(0);
    }
  });

  it('multiplies operands in [-12, 12]', () => {
    for (const p of generateProblems(4141, 400)) {
      if (p.kind !== 'mul') continue;
      const [a, b] = operands(p.prompt, '×');
      for (const n of [a, b]) {
        expect(n).toBeGreaterThanOrEqual(-12);
        expect(n).toBeLessThanOrEqual(12);
      }
      expect(p.answer).toBe(a * b);
    }
  });

  it('divides exactly, dividend in [-100, 100]', () => {
    for (const p of generateProblems(5252, 400)) {
      if (p.kind !== 'div') continue;
      const [a, b] = operands(p.prompt, '÷');
      expect(b).not.toBe(0);
      expect(Number.isInteger(a / b)).toBe(true);
      expect(Math.abs(a)).toBeLessThanOrEqual(100);
      expect(p.answer).toBe(a / b);
    }
  });

  it('chains: answer is the net of real gains/losses, distractors ignored', () => {
    for (const p of generateProblems(4242, 400)) {
      if (p.kind !== 'chain') continue;
      expect(evalChain(p.prompt)).toBe(p.answer);
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.prompt.endsWith('?')).toBe(true);
    }
  });

  it('plain chains (3 pts) mix at least one gain and one loss', () => {
    for (const p of generateProblems(777, 400)) {
      if (p.kind !== 'chain' || p.points !== 3) continue;
      expect(/en (donne|perd) \d+/.test(p.prompt)).toBe(true);
      expect(/en (reçoit|gagne|trouve) \d+/.test(p.prompt)).toBe(true);
    }
  });

  it('trap chains (5 pts) slip in a distractor clause', () => {
    for (const p of generateProblems(888, 400)) {
      if (p.kind !== 'chain' || p.points !== 5) continue;
      expect(/doit|de son côté/.test(p.prompt)).toBe(true);
    }
  });

  it('builds equations ax ± b = c with an integer root and a,b in [1,9]', () => {
    for (const p of generateProblems(31337, 400)) {
      if (p.kind !== 'equation') continue;
      const [lhs, rhs] = p.prompt.split(' = ');
      const m = lhs.match(/^(\d*)x ([+−]) (\d+)$/);
      expect(m).not.toBeNull();
      const a = m![1] === '' ? 1 : Number(m![1]);
      const sign = m![2] === '+' ? 1 : -1;
      const b = Number(m![3]);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
      expect(a * p.answer + sign * b).toBe(parseSigned(rhs));
    }
  });

  it('gives worded problems a positive integer answer', () => {
    for (const p of generateProblems(56789, 400)) {
      if (p.kind !== 'word') continue;
      expect(p.answer).toBeGreaterThan(0);
      expect(p.prompt.endsWith('?')).toBe(true);
    }
  });
});

describe('generateProblems (easy mode)', () => {
  it('is deterministic for a given seed', () => {
    expect(generateProblems(12345, 20, 'easy')).toEqual(generateProblems(12345, 20, 'easy'));
  });

  it('differs from medium for the same seed', () => {
    expect(generateProblems(12345, 40, 'easy')).not.toEqual(generateProblems(12345, 40, 'medium'));
  });

  it('never produces equations', () => {
    const kinds = new Set(generateProblems(999, 400, 'easy').map((p) => p.kind));
    expect(kinds.has('equation')).toBe(false);
  });

  it('still mixes multiplication, division, chains and words', () => {
    const kinds = new Set(generateProblems(999, 400, 'easy').map((p) => p.kind));
    expect(kinds).toEqual(new Set<ProblemKind>(['mul', 'div', 'chain', 'word']));
  });

  it('multiplies operands in [-5, 5]', () => {
    for (const p of generateProblems(4141, 400, 'easy')) {
      if (p.kind !== 'mul') continue;
      const [a, b] = operands(p.prompt, '×');
      for (const n of [a, b]) {
        expect(n).toBeGreaterThanOrEqual(-5);
        expect(n).toBeLessThanOrEqual(5);
      }
    }
  });

  it('divides exactly with a dividend magnitude ≤ 30 and divisor magnitude ≤ 5', () => {
    for (const p of generateProblems(5252, 400, 'easy')) {
      if (p.kind !== 'div') continue;
      const [a, b] = operands(p.prompt, '÷');
      expect(Math.abs(a)).toBeLessThanOrEqual(30);
      expect(Math.abs(b)).toBeLessThanOrEqual(5);
      expect(p.answer).toBe(a / b);
    }
  });

  it('produces only plain (trap-free, 3-point) chains', () => {
    for (const p of generateProblems(4242, 400, 'easy')) {
      if (p.kind !== 'chain') continue;
      expect(p.points).toBe(3);
      expect(/doit|de son côté/.test(p.prompt)).toBe(false);
      expect(evalChain(p.prompt)).toBe(p.answer);
    }
  });

  it('keeps worded answers positive integers', () => {
    for (const p of generateProblems(56789, 400, 'easy')) {
      if (p.kind !== 'word') continue;
      expect(p.answer).toBeGreaterThan(0);
      expect(Number.isInteger(p.answer)).toBe(true);
      expect(p.prompt.endsWith('?')).toBe(true);
    }
  });
});

describe('formatProblem', () => {
  it('returns the pre-rendered statement', () => {
    const p: Problem = { kind: 'equation', prompt: '2x − 6 = 4', answer: 5, points: 4 };
    expect(formatProblem(p)).toBe('2x − 6 = 4');
  });
});
