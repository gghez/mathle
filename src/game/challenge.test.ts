import { describe, it, expect } from 'vitest';
import { generateProblems, formatProblem } from './challenge';

describe('generateProblems', () => {
  it('is deterministic for a given seed', () => {
    const a = generateProblems(12345, 20);
    const b = generateProblems(12345, 20);
    expect(a).toEqual(b);
  });

  it('produces different sequences for different seeds', () => {
    const a = generateProblems(1, 20);
    const b = generateProblems(2, 20);
    expect(a).not.toEqual(b);
  });

  it('generates the requested count', () => {
    expect(generateProblems(7, 50)).toHaveLength(50);
  });

  it('always carries the correct answer', () => {
    for (const p of generateProblems(999, 100)) {
      const expected = p.op === '+' ? p.a + p.b : p.op === '-' ? p.a - p.b : p.a * p.b;
      expect(p.answer).toBe(expected);
    }
  });

  it('never yields a negative subtraction answer', () => {
    for (const p of generateProblems(4242, 200)) {
      if (p.op === '-') expect(p.answer).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('formatProblem', () => {
  it('renders operator and operands', () => {
    expect(formatProblem({ a: 7, b: 8, op: '×', answer: 56 })).toBe('7 × 8');
  });
});
