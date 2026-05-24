import { aabbOverlap } from '../src/physics.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('aabbOverlap - edge cases', () => {
  it('returns false on corner touch (diagonal)', () => {
    const a = { x: 0, y: 0, w: 1, h: 1 };
    const b = { x: 1, y: 1, w: 1, h: 1 };
    assert.equal(aabbOverlap(a, b), false);
  });

  it('returns true with partial overlap', () => {
    const a = { x: 0, y: 0, w: 2, h: 2 };
    const b = { x: 1, y: 1, w: 2, h: 2 };
    assert.equal(aabbOverlap(a, b), true);
  });

  it('returns true when one box is nested inside another', () => {
    const outer = { x: 0, y: 0, w: 10, h: 10 };
    const inner = { x: 2, y: 2, w: 1, h: 1 };
    assert.equal(aabbOverlap(outer, inner), true);
  });

  it('returns false when separated on x-axis', () => {
    const a = { x: 0, y: 0, w: 1, h: 1 };
    const b = { x: 2, y: 0, w: 1, h: 1 };
    assert.equal(aabbOverlap(a, b), false);
  });

  it('returns false when separated on y-axis', () => {
    const a = { x: 0, y: 0, w: 1, h: 1 };
    const b = { x: 0, y: 2, w: 1, h: 1 };
    assert.equal(aabbOverlap(a, b), false);
  });
});
