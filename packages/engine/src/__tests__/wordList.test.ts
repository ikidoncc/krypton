import { describe, it, expect } from 'vitest';
import { pickWords, WORD_POOL } from '../wordList.js';

describe('pickWords', () => {
  it('returns exactly n words', () => {
    expect(pickWords(25)).toHaveLength(25);
    expect(pickWords(1)).toHaveLength(1);
    expect(pickWords(10)).toHaveLength(10);
  });

  it('returns no duplicate words', () => {
    const words = pickWords(25);
    const unique = new Set(words);
    expect(unique.size).toBe(25);
  });

  it('returns only words from the pool', () => {
    const pool = new Set(WORD_POOL);
    const words = pickWords(25);
    for (const word of words) {
      expect(pool.has(word)).toBe(true);
    }
  });

  it('throws when n exceeds pool size', () => {
    expect(() => pickWords(WORD_POOL.length + 1)).toThrow(RangeError);
  });

  it('produces different results on consecutive calls (statistical)', () => {
    const a = pickWords(25);
    const b = pickWords(25);
    // There is a vanishingly small chance these are equal by coincidence
    expect(a).not.toEqual(b);
  });
});
