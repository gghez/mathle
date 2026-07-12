import { describe, it, expect } from 'vitest';
import { GameEngine } from './engine';
import type { Problem } from './challenge';

const problems: Problem[] = [
  { kind: 'chain', prompt: 'Jade a 5 bonbons, en donne 3 et en gagne 1.', answer: 3, points: 3 },
  { kind: 'equation', prompt: '2x − 6 = 4', answer: 5, points: 4 },
  { kind: 'word', prompt: 'Combien de bonbons ?', answer: 8, points: 10 },
];

describe('GameEngine', () => {
  it("awards the problem's points for a correct answer and advances", () => {
    const e = new GameEngine(problems);
    const r = e.submit(3);
    expect(r.correct).toBe(true);
    expect(r.delta).toBe(3);
    expect(e.score).toBe(3);
    expect(e.answered).toBe(1);
    expect(e.current).toEqual(problems[1]);
  });

  it('rewards each kind with its own point value', () => {
    const e = new GameEngine(problems);
    e.submit(3); // chain → +3
    e.submit(5); // equation → +4
    e.submit(8); // word → +10
    expect(e.score).toBe(17);
  });

  it('loses a point on a wrong answer but still advances', () => {
    const e = new GameEngine(problems);
    e.submit(3); // +3 → 3
    const r = e.submit(99); // wrong → 2
    expect(r.correct).toBe(false);
    expect(r.delta).toBe(-1);
    expect(e.score).toBe(2);
    expect(e.answered).toBe(2);
    expect(e.current).toEqual(problems[2]);
  });

  it('never lets the score drop below zero', () => {
    const e = new GameEngine(problems);
    const r = e.submit(99); // wrong at score 0
    expect(r.delta).toBe(0);
    expect(e.score).toBe(0);
  });

  it('clamps at the last problem instead of overflowing', () => {
    const e = new GameEngine(problems);
    e.submit(3);
    e.submit(5);
    e.submit(8);
    expect(() => e.submit(0)).not.toThrow();
    expect(e.current).toEqual(problems[2]);
  });

  it('records every attempt for the end-of-game review', () => {
    const e = new GameEngine(problems);
    e.submit(3); // correct
    e.submit(42); // wrong
    expect(e.attempts).toEqual([
      { problem: problems[0], given: 3, correct: true },
      { problem: problems[1], given: 42, correct: false },
    ]);
  });
});
