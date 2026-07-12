import { describe, it, expect } from 'vitest';
import { GameEngine } from './engine';
import type { Problem } from './challenge';

const problems: Problem[] = [
  { a: 1, b: 2, op: '+', answer: 3 },
  { a: 5, b: 3, op: '-', answer: 2 },
  { a: 4, b: 2, op: '×', answer: 8 },
];

describe('GameEngine', () => {
  it('scores a point for a correct answer and advances', () => {
    const e = new GameEngine(problems);
    const r = e.submit(3);
    expect(r.correct).toBe(true);
    expect(e.score).toBe(1);
    expect(e.answered).toBe(1);
    expect(e.current).toEqual(problems[1]);
  });

  it('scores nothing for a wrong answer but still advances', () => {
    const e = new GameEngine(problems);
    const r = e.submit(99);
    expect(r.correct).toBe(false);
    expect(e.score).toBe(0);
    expect(e.answered).toBe(1);
    expect(e.current).toEqual(problems[1]);
  });

  it('accumulates score across submissions', () => {
    const e = new GameEngine(problems);
    e.submit(3); // correct
    e.submit(99); // wrong
    e.submit(8); // correct
    expect(e.score).toBe(2);
    expect(e.answered).toBe(3);
  });

  it('clamps at the last problem instead of overflowing', () => {
    const e = new GameEngine(problems);
    e.submit(3);
    e.submit(2);
    e.submit(8);
    expect(() => e.submit(0)).not.toThrow();
    expect(e.current).toEqual(problems[2]);
  });
});
