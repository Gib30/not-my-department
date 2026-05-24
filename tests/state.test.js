import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, onDeath, onRespawn, onWin, onPause, onResume, GameStatus } from '../src/state.js';

describe('createGameState', () => {
  it('starts in PLAYING state with zero counters', () => {
    const s = createGameState();
    assert.equal(s.status, GameStatus.PLAYING);
    assert.equal(s.attemptsReal, 0);
    assert.equal(s.deathsDisplayed, 0);
  });
});

describe('onDeath', () => {
  it('sets status to DEAD and increments both counters', () => {
    const s = onDeath(createGameState());
    assert.equal(s.status, GameStatus.DEAD);
    assert.equal(s.attemptsReal, 1);
    assert.equal(s.deathsDisplayed, 1);
  });
  it('does not mutate original state', () => {
    const s = createGameState();
    onDeath(s);
    assert.equal(s.status, GameStatus.PLAYING);
  });
});

describe('onRespawn', () => {
  it('sets status back to PLAYING', () => {
    const dead = onDeath(createGameState());
    const alive = onRespawn(dead);
    assert.equal(alive.status, GameStatus.PLAYING);
    assert.equal(alive.attemptsReal, 1);
  });
});

describe('onPause / onResume', () => {
  it('pause sets PAUSED, resume sets PLAYING', () => {
    const s = createGameState();
    assert.equal(onPause(s).status, GameStatus.PAUSED);
    assert.equal(onResume(onPause(s)).status, GameStatus.PLAYING);
  });
});

describe('onWin', () => {
  it('sets status to WIN', () => {
    assert.equal(onWin(createGameState()).status, GameStatus.WIN);
  });
});
