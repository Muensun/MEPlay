import { describe, expect, it } from 'vitest';
import { seededShuffle } from './gridOrder';

const ITEMS = Array.from({ length: 30 }, (_, i) => `MW${i}`);

describe('seededShuffle', () => {
  it('is stable across calls for the same seed', () => {
    expect(seededShuffle(ITEMS, 'user_abc')).toEqual(seededShuffle(ITEMS, 'user_abc'));
  });

  it('differs between different seeds', () => {
    expect(seededShuffle(ITEMS, 'user_abc')).not.toEqual(seededShuffle(ITEMS, 'user_xyz'));
  });

  it('is a permutation — same items, same length', () => {
    const shuffled = seededShuffle(ITEMS, 'user_abc');
    expect(shuffled).toHaveLength(ITEMS.length);
    expect([...shuffled].sort()).toEqual([...ITEMS].sort());
  });
});
