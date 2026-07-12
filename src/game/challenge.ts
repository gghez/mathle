import { mulberry32 } from '../core/rng';

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER GAME — mental arithmetic.
//
// This module stands in for the real Mathle concept (to be defined). It exists
// only so the full pipeline is exercisable end-to-end: a challenge is a single
// integer `seed`, from which an unbounded, deterministic stream of problems is
// derived. Two players opening the same challenge link get the exact same
// problems in the exact same order — no backend, everything rides in the seed.
//
// When the real concept lands, replace `Problem` / `generateProblems` with the
// real puzzle model. The rest of the app (challenge = seed + scoreToBeat,
// timer, engine, share, history) is concept-agnostic and should carry over.
// ─────────────────────────────────────────────────────────────────────────────

export type Op = '+' | '-' | '×';

export interface Problem {
  a: number;
  b: number;
  op: Op;
  /** The correct numeric answer. */
  answer: number;
}

/** A shareable challenge: everything needed to replay it rides in the seed. */
export interface Challenge {
  seed: number;
  /** Score to beat when the challenge came from a share link; null otherwise. */
  scoreToBeat: number | null;
}

/** Length of a round, in seconds. */
export const ROUND_SECONDS = 60;

/** How many problems to pre-generate — comfortably more than a round allows. */
const PROBLEM_POOL = 300;

/** Integer in [min, max] drawn from the PRNG. */
function intBetween(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function makeProblem(rng: () => number): Problem {
  const op: Op = (['+', '-', '×'] as const)[intBetween(rng, 0, 2)];
  if (op === '×') {
    const a = intBetween(rng, 2, 9);
    const b = intBetween(rng, 2, 9);
    return { a, b, op, answer: a * b };
  }
  if (op === '-') {
    // Keep the answer non-negative by ordering the operands.
    const x = intBetween(rng, 1, 20);
    const y = intBetween(rng, 1, 20);
    const [a, b] = x >= y ? [x, y] : [y, x];
    return { a, b, op, answer: a - b };
  }
  const a = intBetween(rng, 1, 20);
  const b = intBetween(rng, 1, 20);
  return { a, b, op, answer: a + b };
}

/**
 * Deterministically derive the round's problems from a seed. The same seed
 * always yields the same sequence, so a shared challenge is perfectly
 * reproducible on any device.
 */
export function generateProblems(seed: number, count: number = PROBLEM_POOL): Problem[] {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, () => makeProblem(rng));
}

/** Human-readable form of a problem, e.g. "7 × 8". */
export function formatProblem(p: Problem): string {
  return `${p.a} ${p.op} ${p.b}`;
}
