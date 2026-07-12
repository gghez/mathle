import type { Problem } from './challenge';

// ─────────────────────────────────────────────────────────────────────────────
// Round engine — scoring & validation.
//
// A correct answer earns the problem's points (3/3/3/4/5/10). A wrong answer
// costs 1 point, with the score floored at 0 (never negative). The engine is
// deliberately UI-free and synchronous so it can be unit-tested without a DOM.
// ─────────────────────────────────────────────────────────────────────────────

/** Penalty (in points) applied to a wrong answer. */
const WRONG_PENALTY = 1;

export interface SubmitResult {
  correct: boolean;
  /** The problem that was just answered. */
  problem: Problem;
  /** Signed change applied to the score (+points if correct, −penalty if not). */
  delta: number;
}

/** One graded answer, kept so the end screen can show a full review. */
export interface Attempt {
  problem: Problem;
  /** The value the player submitted. */
  given: number;
  correct: boolean;
}

/** Drives a round over a fixed, pre-generated list of problems. */
export class GameEngine {
  private index = 0;
  /** Points earned so far. */
  score = 0;
  /** How many problems the player has attempted. */
  answered = 0;
  /** Every graded answer, in order — powers the end-of-game review. */
  readonly attempts: Attempt[] = [];

  constructor(private readonly problems: Problem[]) {}

  /** The problem currently facing the player. */
  get current(): Problem {
    return this.problems[this.index];
  }

  /**
   * Submit an answer for the current problem and advance to the next one.
   * Correct → gain the problem's points; wrong → lose 1 point (floored at 0).
   */
  submit(value: number): SubmitResult {
    const problem = this.current;
    const correct = value === problem.answer;
    const before = this.score;
    if (correct) {
      this.score += problem.points;
    } else {
      this.score = Math.max(0, this.score - WRONG_PENALTY);
    }
    this.answered += 1;
    this.attempts.push({ problem, given: value, correct });
    this.index = Math.min(this.index + 1, this.problems.length - 1);
    return { correct, problem, delta: this.score - before };
  }
}
