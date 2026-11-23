// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: reaction-bar.spec.ts
// Tests the counting rule behind the optimistic update (applyReaction):
// no component, no API. Run: `npm test` in web/.
// ──────────────────────────────────────────────────────────────────────

import { ReactionSummary } from '../blog.model';
import { applyReaction } from './reaction-bar';

const start: ReactionSummary = { counts: { like: 4, love: 0, insightful: 1 }, mine: ['insightful'] };

describe('applyReaction', () => {
  it('adding: +1 and it becomes mine, without changing the old object', () => {
    const after = applyReaction(start, 'like', true);
    expect(after.counts.like).toBe(5);
    expect(after.mine).toEqual(['insightful', 'like']);
    expect(start.counts.like).toBe(4); // the old summary is untouched (needed for undo)
  });

  it('removing: -1, never below 0, and adding something already mine changes nothing', () => {
    expect(applyReaction(start, 'insightful', false)).toEqual({ counts: { like: 4, love: 0, insightful: 0 }, mine: [] });
    expect(applyReaction({ counts: { like: 0, love: 0, insightful: 0 }, mine: ['like'] }, 'like', false).counts.like).toBe(0);
    expect(applyReaction(start, 'insightful', true)).toBe(start);
  });
});
