import { describe, it, expect, beforeEach } from 'vitest';
import { saveGame, listGames, clearHistory } from './store';

describe('history store', () => {
  beforeEach(() => {
    clearHistory();
  });

  it('persists the answers given so a game can be reviewed later', () => {
    saveGame({ seed: 42, score: 12, answered: 3, scoreToBeat: null, given: [7, -2, 10] });
    const [record] = listGames();
    expect(record.given).toEqual([7, -2, 10]);
    expect(record.seed).toBe(42);
  });

  it('accepts a record without answers (older format)', () => {
    saveGame({ seed: 1, score: 0, answered: 0, scoreToBeat: null });
    const [record] = listGames();
    expect(record.given).toBeUndefined();
  });

  it('lists games most recent first', () => {
    saveGame({ seed: 1, score: 1, answered: 1, scoreToBeat: null });
    saveGame({ seed: 2, score: 2, answered: 1, scoreToBeat: null });
    const games = listGames();
    expect(games.map((g) => g.seed)).toEqual([2, 1]);
  });
});
