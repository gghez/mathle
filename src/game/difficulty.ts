// ─────────────────────────────────────────────────────────────────────────────
// Difficulty preference — the mode the home screen starts a new game in.
//
// Persisted in localStorage (like the sound toggle) so the choice sticks across
// visits. This is only the *default* selection for a fresh game; a challenge
// link or a history replay carries its own difficulty regardless.
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_DIFFICULTY, type Difficulty } from './challenge';

const DIFFICULTY_KEY = 'mathle:difficulty';

/** The preferred mode for a new game, defaulting to medium. */
export function getPreferredDifficulty(): Difficulty {
  try {
    return localStorage.getItem(DIFFICULTY_KEY) === 'easy' ? 'easy' : DEFAULT_DIFFICULTY;
  } catch {
    return DEFAULT_DIFFICULTY;
  }
}

/** Persist the preferred mode for the next new game. */
export function setPreferredDifficulty(difficulty: Difficulty): void {
  try {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  } catch {
    // Storage unavailable (private mode): the in-session choice still applies.
  }
}
