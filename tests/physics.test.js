import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyGravity, applyMovement, createJumpVelocity, aabbOverlap, resolvePlatformCollision, GRAVITY, JUMP_SPEED } from '../src/physics.js';

describe('applyGravity', () => {
  it('decreases y velocity by GRAVITY each frame', () => {
    const vel = { x: 0, y: 0 };
    const result = applyGravity(vel);
    assert.equal(result.y, -GRAVITY);
    assert.equal(result.x, 0);
  });
  it('does not mutate input', () => {
    const vel = { x: 0, y: 0.5 };
    applyGravity(vel);
    assert.equal(vel.y, 0.5);
  });
});

describe('createJumpVelocity', () => {
  it('sets y to JUMP_SPEED', () => {
    const vel = { x: 0.1, y: -0.3 };
    const result = createJumpVelocity(vel);
    assert.equal(result.y, JUMP_SPEED);
    assert.equal(result.x, 0.1);
  });
  it('does not mutate input', () => {
    const vel = { x: 0.1, y: -0.3 };
    createJumpVelocity(vel);
    assert.equal(vel.y, -0.3);
  });
});

describe('aabbOverlap', () => {
  it('returns true when boxes overlap', () => {
    const a = { x: 0, y: 0, w: 1, h: 1 };
    const b = { x: 0.5, y: 0.5, w: 1, h: 1 };
    assert.equal(aabbOverlap(a, b), true);
  });
  it('returns false when boxes do not overlap', () => {
    const a = { x: 0, y: 0, w: 1, h: 1 };
    const b = { x: 2, y: 0, w: 1, h: 1 };
    assert.equal(aabbOverlap(a, b), false);
  });
  it('returns false on edge touch (no overlap)', () => {
    const a = { x: 0, y: 0, w: 1, h: 1 };
    const b = { x: 1, y: 0, w: 1, h: 1 };
    assert.equal(aabbOverlap(a, b), false);
  });
});

describe('applyMovement', () => {
  it('adds velocity to position', () => {
    const pos = { x: 1, y: 2 };
    const vel = { x: 0.1, y: -0.2 };
    const result = applyMovement(pos, vel);
    assert.ok(Math.abs(result.x - 1.1) < 0.0001);
    assert.ok(Math.abs(result.y - 1.8) < 0.0001);
  });
  it('does not mutate input', () => {
    const pos = { x: 1, y: 2 };
    const vel = { x: 0.1, y: -0.2 };
    applyMovement(pos, vel);
    assert.equal(pos.x, 1);
    assert.equal(pos.y, 2);
  });
});

describe('resolvePlatformCollision', () => {
  const playerSize = { w: 0.8, h: 1.8 };
  const platform = { x: 0, y: 0, w: 4, h: 0.5 };

  it('lands player on top when falling onto platform', () => {
    const pos = { x: 0, y: 0.4 };
    const vel = { x: 0, y: -0.2 };
    const result = resolvePlatformCollision(pos, vel, playerSize, platform);
    assert.equal(result.landed, true);
    assert.equal(result.vel.y, 0);
    assert.equal(result.pos.y, platform.h);
  });
  it('does not land when moving upward through platform', () => {
    const pos = { x: 0, y: 0.2 };
    const vel = { x: 0, y: 0.3 };
    const result = resolvePlatformCollision(pos, vel, playerSize, platform);
    assert.equal(result.landed, false);
  });
  it('does not land when not overlapping', () => {
    const pos = { x: 10, y: 5 };
    const vel = { x: 0, y: -0.2 };
    const result = resolvePlatformCollision(pos, vel, playerSize, platform);
    assert.equal(result.landed, false);
  });
});
