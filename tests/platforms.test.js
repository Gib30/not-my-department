import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlatformType, isPlatformCollidable, isPlatformVisible, LEVEL_PLATFORMS } from '../src/platforms.js';

describe('isPlatformCollidable', () => {
  it('SOLID platform is always collidable', () => {
    const p = { type: PlatformType.SOLID, touched: false };
    assert.equal(isPlatformCollidable(p, 0), true);
    assert.equal(isPlatformCollidable(p, 50), true);
  });
  it('FAKE platform is collidable until touched', () => {
    const p = { type: PlatformType.FAKE, touched: false };
    assert.equal(isPlatformCollidable(p, 0), true);
    const touched = { ...p, touched: true };
    assert.equal(isPlatformCollidable(touched, 0), false);
  });
  it('MEMORY platform is collidable before attempt 20', () => {
    const p = { type: PlatformType.MEMORY, touched: false };
    assert.equal(isPlatformCollidable(p, 0), true);
    assert.equal(isPlatformCollidable(p, 19), true);
  });
  it('MEMORY platform is NOT collidable at attempt 20+', () => {
    const p = { type: PlatformType.MEMORY, touched: false };
    assert.equal(isPlatformCollidable(p, 20), false);
    assert.equal(isPlatformCollidable(p, 100), false);
  });
  it('SPIKE platform is never collidable', () => {
    const p = { type: PlatformType.SPIKE };
    assert.equal(isPlatformCollidable(p, 0), false);
  });
});

describe('isPlatformVisible', () => {
  it('SOLID is always visible', () => {
    assert.equal(isPlatformVisible({ type: PlatformType.SOLID, touched: false }, 0), true);
  });
  it('FAKE disappears when touched', () => {
    assert.equal(isPlatformVisible({ type: PlatformType.FAKE, touched: false }, 0), true);
    assert.equal(isPlatformVisible({ type: PlatformType.FAKE, touched: true }, 0), false);
  });
  it('MEMORY is visible before attempt 20', () => {
    assert.equal(isPlatformVisible({ type: PlatformType.MEMORY }, 19), true);
    assert.equal(isPlatformVisible({ type: PlatformType.MEMORY }, 20), false);
  });
  it('SPIKE is never visible', () => {
    assert.equal(isPlatformVisible({ type: PlatformType.SPIKE }, 0), false);
  });
});

describe('LEVEL_PLATFORMS', () => {
  it('has platforms across all 5 zones', () => {
    assert.ok(LEVEL_PLATFORMS.length > 20);
  });
  it('all platforms have required fields', () => {
    for (const p of LEVEL_PLATFORMS) {
      assert.ok('x' in p, `platform missing x`);
      assert.ok('y' in p, `platform missing y`);
      assert.ok('w' in p, `platform missing w`);
      assert.ok('h' in p, `platform missing h`);
      assert.ok('type' in p, `platform missing type`);
    }
  });
});
