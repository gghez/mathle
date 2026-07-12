import type { Problem } from './challenge';

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER ENGINE — one correct answer scores one point.
//
// Scoring and validation are intentionally trivial. When the real concept is
// defined, this is where its rules live. The engine is deliberately UI-free and
// synchronous so it can be unit-tested without a DOM.
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitResult {
  correct: boolean;
  /** The problem that was just answered. */
  problem: Problem;
}

/** Drives a round over a fixed, pre-generated list of problems. */
export class GameEngine {
  private index = 0;
  /** Points earned so far (one per correct answer). */
  score = 0;
  /** How many problems the player has attempted. */
  answered = 0;

  constructor(private readonly problems: Problem[]) {}

  /** The problem currently facing the player. */
  get current(): Problem {
    return this.problems[this.index];
  }

  /**
   * Submit an answer for the current problem and advance to the next one.
   * A correct answer scores a point.
   */
  submit(value: number): SubmitResult {
    const problem = this.current;
    const correct = value === problem.answer;
    if (correct) this.score += 1;
    this.answered += 1;
    this.index = Math.min(this.index + 1, this.problems.length - 1);
    return { correct, problem };
  }
}
