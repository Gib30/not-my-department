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
  it('does nothing when called from WIN state', () => {
    const won = onWin(createGameState());
    const result = onRespawn(won);
    assert.equal(result.status, GameStatus.WIN);
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

describe('troll flag preservation', () => {
  it('flags set before death are preserved after death and respawn', () => {
    let s = createGameState();
    s = { ...s, zone4CounterTampered: true, checkpointToastShown: true };
    s = onDeath(s);
    assert.equal(s.zone4CounterTampered, true);
    assert.equal(s.checkpointToastShown, true);
    s = onRespawn(s);
    assert.equal(s.zone4CounterTampered, true);
    assert.equal(s.checkpointToastShown, true);
  });
  it('createGameState initialises all troll flags to false', () => {
    const s = createGameState();
    assert.equal(s.zone4CounterTampered, false);
    assert.equal(s.checkpointToastShown, false);
    assert.equal(s.fakeBannerShown, false);
  });
});

describe('counter divergence', () => {
  it('deathsDisplayed and attemptsReal increment independently from a diverged baseline', () => {
    let s = createGameState();
    // Simulate the zone4 counter tamper: bump deathsDisplayed by 3 manually
    s = { ...s, deathsDisplayed: s.deathsDisplayed + 3 };
    assert.equal(s.deathsDisplayed, 3);
    assert.equal(s.attemptsReal, 0);
    // Now die once — both should increment by 1 from their respective baselines
    s = onDeath(s);
    assert.equal(s.deathsDisplayed, 4);
    assert.equal(s.attemptsReal, 1);
  });
});
