export const GameStatus = Object.freeze({
  PLAYING: 'PLAYING',
  DEAD: 'DEAD',
  WIN: 'WIN',
  PAUSED: 'PAUSED',
});

export function createGameState() {
  return {
    status: GameStatus.PLAYING,
    attemptsReal: 0,
    deathsDisplayed: 0,
    // Troll flags — each fires once
    zone4CounterTampered: false,
    checkpointToastShown: false,
    fakeBannerShown: false,
  };
}

export function onDeath(state) {
  return {
    ...state,
    status: GameStatus.DEAD,
    attemptsReal: state.attemptsReal + 1,
    deathsDisplayed: state.deathsDisplayed + 1,
  };
}

export function onRespawn(state) {
  if (state.status !== GameStatus.DEAD) return state;
  return { ...state, status: GameStatus.PLAYING };
}

export function onWin(state) {
  return { ...state, status: GameStatus.WIN };
}

export function onPause(state) {
  return { ...state, status: GameStatus.PAUSED };
}

export function onResume(state) {
  return { ...state, status: GameStatus.PLAYING };
}
