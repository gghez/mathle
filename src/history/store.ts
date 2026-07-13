import { DEFAULT_DIFFICULTY, type Difficulty } from '../game/challenge';

/** A completed game, as logged to the local history. */
export interface GameRecord {
  id: string;
  /** ISO timestamp of when the game ended. */
  playedAt: string;
  /** Seed of the challenge played — enough to replay the exact same round. */
  seed: number;
  score: number;
  /** How many problems the player attempted. */
  answered: number;
  /** Score to beat if this was a challenge, null for a plain game. */
  scoreToBeat: number | null;
  /**
   * The mode the round was played in. Needed alongside the seed to regenerate
   * the exact problems for a replay or review. Optional so records saved before
   * this field remain valid — they default to medium (the only prior mode).
   */
  difficulty?: Difficulty;
  /**
   * The answers the player gave, in order. Combined with the seed (which
   * regenerates the exact problems) this is enough to rebuild a full review.
   * Optional so records saved before this field remain valid.
   */
  given?: number[];
}

/** A record's difficulty, defaulting to medium for pre-difficulty entries. */
export function recordDifficulty(record: GameRecord): Difficulty {
  return record.difficulty ?? DEFAULT_DIFFICULTY;
}

const STORAGE_KEY = 'mathle:history';
// Bound storage growth: drop the oldest entries past this count.
const MAX_ENTRIES = 200;

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readAll(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GameRecord[]) : [];
  } catch {
    // Corrupt data or storage unavailable (private browsing, disabled, etc.):
    // history is a non-critical enhancement, so fail quiet with an empty list.
    return [];
  }
}

function writeAll(records: GameRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage full or unavailable — drop silently rather than break the game.
  }
}

/** All logged games, most recent first. */
export function listGames(): GameRecord[] {
  return readAll().sort((a, b) => b.playedAt.localeCompare(a.playedAt));
}

/** Log a completed game and return the stored record. */
export function saveGame(record: Omit<GameRecord, 'id' | 'playedAt'>): GameRecord {
  const full: GameRecord = { ...record, id: randomId(), playedAt: new Date().toISOString() };
  const records = [full, ...readAll()].slice(0, MAX_ENTRIES);
  writeAll(records);
  return full;
}

/** Remove a single game from the history. */
export function deleteGame(id: string): void {
  writeAll(readAll().filter((r) => r.id !== id));
}

/** Wipe the whole history. */
export function clearHistory(): void {
  writeAll([]);
}
