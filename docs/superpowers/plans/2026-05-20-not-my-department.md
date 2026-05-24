# Not My Department — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-level 2.5D browser platformer in Three.js where Gerald, an ordinary office worker, suffers through a trolling platformer that lies, cheats, and attacks its own UI.

**Architecture:** Vanilla JS ES modules, no build step. Three.js via CDN importmap. Pure-logic modules (physics, state, platforms) are testable with Node's built-in test runner. Three.js rendering wired in main.js. HTML overlay handles all meta-UI trolling.

**Tech Stack:** Three.js r160 (CDN), Vanilla JS ES modules, Node built-in `node:test` for unit tests, GitHub Pages for hosting.

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | Shell, importmap, canvas mount, UI overlay DOM |
| `style.css` | UI overlay styles (counter, banners, toasts, pause, win screen) |
| `src/main.js` | Entry point, Three.js scene init, game loop, input wiring |
| `src/physics.js` | Gravity, jump impulse, AABB collision — no Three.js dependency |
| `src/state.js` | Game state machine, attempt/death counters — no Three.js dependency |
| `src/platforms.js` | Platform data for all 5 zones, active/collidable logic |
| `src/gerald.js` | Gerald's Three.js mesh, quest marker, death animation |
| `src/camera.js` | Camera sequences per zone (zone 2 drift, zone 4 sine) |
| `src/ui.js` | Death counter, fake banners, checkpoint toast, pause menu |
| `tests/physics.test.js` | Unit tests for physics functions |
| `tests/state.test.js` | Unit tests for state machine |
| `tests/platforms.test.js` | Unit tests for platform active/collidable logic |

---

## Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `src/main.js`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Not My Department</title>
  <link rel="stylesheet" href="style.css">
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
    }
  }
  </script>
</head>
<body>
  <canvas id="game"></canvas>

  <!-- UI Overlay -->
  <div id="ui">
    <div id="death-counter">Deaths: 0</div>
    <div id="zone-label"></div>
  </div>

  <!-- Toasts & Banners (hidden by default) -->
  <div id="checkpoint-toast" class="toast hidden">CHECKPOINT SAVED ✓</div>
  <div id="fake-banner" class="banner hidden">
    <h1>LEVEL COMPLETE 🎉</h1>
    <button id="claim-btn">CLAIM REWARD</button>
  </div>

  <!-- Pause Menu -->
  <div id="pause-menu" class="hidden">
    <h2>PAUSED</h2>
    <button id="resume-btn">Resume</button>
  </div>

  <!-- Win Screen -->
  <div id="win-screen" class="hidden">
    <h1>"Finally. I'm 3 hours late."</h1>
    <p id="win-deaths"></p>
    <button id="share-btn">Share your suffering</button>
  </div>

  <!-- Dialogue Bubble -->
  <div id="dialogue" class="hidden"></div>

  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body { background: #000; overflow: hidden; font-family: 'Segoe UI', sans-serif; }

#game { display: block; width: 100vw; height: 100vh; }

#ui {
  position: fixed; top: 16px; left: 16px;
  color: #fff; text-shadow: 1px 1px 2px #000;
  pointer-events: none; z-index: 10;
}

#death-counter { font-size: 1.2rem; font-weight: bold; }
#zone-label { font-size: 0.85rem; color: #ddd; margin-top: 4px; }

.hidden { display: none !important; }

.toast {
  position: fixed; bottom: 24px; right: 24px;
  background: #27ae60; color: #fff;
  padding: 12px 20px; border-radius: 8px;
  font-size: 1rem; font-weight: bold;
  z-index: 20; animation: fadeout 3s forwards;
}

@keyframes fadeout {
  0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; }
}

.banner {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 30; color: #fff; gap: 24px;
}

.banner h1 { font-size: 3rem; }

.banner button, #pause-menu button {
  padding: 14px 36px; font-size: 1.2rem;
  background: #e74c3c; color: #fff;
  border: none; border-radius: 8px; cursor: pointer;
}

#pause-menu {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 30; color: #fff; gap: 20px;
}

#pause-menu h2 { font-size: 2.5rem; }
#pause-menu button { background: #2ecc71; }

#win-screen {
  position: fixed; inset: 0;
  background: linear-gradient(135deg, #87CEEB, #98D8C8);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 40; gap: 20px; text-align: center;
}

#win-screen h1 { font-size: 2.2rem; color: #1a1a2e; }
#win-screen p { font-size: 1.3rem; color: #333; }
#share-btn {
  padding: 14px 36px; font-size: 1.1rem;
  background: #3498db; color: #fff;
  border: none; border-radius: 8px; cursor: pointer;
}

#dialogue {
  position: fixed; bottom: 80px; left: 50%;
  transform: translateX(-50%);
  background: #fff; color: #333;
  padding: 10px 18px; border-radius: 12px;
  font-size: 1rem; font-style: italic;
  border: 2px solid #ccc; z-index: 15;
  pointer-events: none;
  animation: fadeout 2.5s forwards;
}
```

- [ ] **Step 3: Create `src/main.js` with a basic Three.js scene**

```js
import * as THREE from 'three';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 40, 80);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 4, 14);
camera.lookAt(0, 1, 0);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(10, 20, 10);
scene.add(sun);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

- [ ] **Step 4: Open `index.html` in a browser (drag to browser or `npx serve .`)**

Expected: Blue sky background, no errors in console.

- [ ] **Step 5: Commit**

```bash
git init
git add index.html style.css src/main.js
git commit -m "feat: scaffold Three.js scene"
```

---

## Task 2: Physics Module

**Files:**
- Create: `src/physics.js`
- Create: `tests/physics.test.js`

- [ ] **Step 1: Create `tests/physics.test.js` (failing — module doesn't exist yet)**

```js
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
node --test tests/physics.test.js
```

Expected: Error — `Cannot find module '../src/physics.js'`

- [ ] **Step 3: Create `src/physics.js`**

```js
export const GRAVITY = 0.018;
export const JUMP_SPEED = 0.32;
export const MOVE_SPEED = 0.12;

export const PLAYER_SIZE = { w: 0.8, h: 1.8 };

export function applyGravity(vel) {
  return { x: vel.x, y: vel.y - GRAVITY };
}

export function applyMovement(pos, vel) {
  return { x: pos.x + vel.x, y: pos.y + vel.y };
}

export function createJumpVelocity(vel) {
  return { x: vel.x, y: JUMP_SPEED };
}

export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Resolves landing on top of a platform. Only resolves downward collisions.
export function resolvePlatformCollision(pos, vel, size, platform) {
  const playerBox = { x: pos.x - size.w / 2, y: pos.y, w: size.w, h: size.h };
  const platBox = { x: platform.x - platform.w / 2, y: platform.y, w: platform.w, h: platform.h };

  if (!aabbOverlap(playerBox, platBox)) return { pos, vel, landed: false };

  // Only resolve if falling (vel.y <= 0) and feet were near or above platform top
  const platTop = platform.y + platform.h;
  if (vel.y <= 0 && pos.y >= platTop - 0.25) {
    return {
      pos: { x: pos.x, y: platTop },
      vel: { x: vel.x, y: 0 },
      landed: true,
    };
  }
  return { pos, vel, landed: false };
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
node --test tests/physics.test.js
```

Expected: `✓ 8 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/physics.js tests/physics.test.js
git commit -m "feat: physics module with AABB collision"
```

---

## Task 3: Game State Module

**Files:**
- Create: `src/state.js`
- Create: `tests/state.test.js`

- [ ] **Step 1: Create `tests/state.test.js`**

```js
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
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
node --test tests/state.test.js
```

- [ ] **Step 3: Create `src/state.js`**

```js
export const GameStatus = {
  PLAYING: 'PLAYING',
  DEAD: 'DEAD',
  WIN: 'WIN',
  PAUSED: 'PAUSED',
};

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
```

- [ ] **Step 4: Run tests — should pass**

```bash
node --test tests/state.test.js
```

Expected: `✓ 6 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/state.js tests/state.test.js
git commit -m "feat: game state machine"
```

---

## Task 4: Platform Data + Active Logic

**Files:**
- Create: `src/platforms.js`
- Create: `tests/platforms.test.js`

- [ ] **Step 1: Create `tests/platforms.test.js`**

```js
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
  it('SPIKE platform is never collidable (kills via overlap, not landing)', () => {
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
```

- [ ] **Step 2: Run test — confirm fails**

```bash
node --test tests/platforms.test.js
```

- [ ] **Step 3: Create `src/platforms.js`**

```js
export const PlatformType = {
  SOLID: 'SOLID',     // always there, always collidable
  FAKE: 'FAKE',       // vanishes 200ms after first contact
  NARROW: 'NARROW',   // solid but 50% standard width
  SPIKE: 'SPIKE',     // invisible, kills on overlap
  MEMORY: 'MEMORY',   // solid until attemptsReal >= 20, then gone
};

export const PLATFORM_W = 3.5;
export const PLATFORM_H = 0.4;

function p(x, y, type = PlatformType.SOLID, opts = {}) {
  return {
    id: opts.id ?? `p_${x}_${y}`,
    x, y,
    w: opts.w ?? PLATFORM_W,
    h: PLATFORM_H,
    type,
    touched: false,
    zone: opts.zone ?? 1,
  };
}

function spike(x, y, id) {
  return { id, x, y, w: 0.6, h: 0.4, type: PlatformType.SPIKE, touched: false, zone: 4 };
}

export const LEVEL_PLATFORMS = [
  // ── Zone 1: Tutorial Lie (x: 0–20) ──
  p(0,   0, PlatformType.SOLID,  { id: 'z1_0',    zone: 1 }),
  p(5,   0, PlatformType.SOLID,  { id: 'z1_1',    zone: 1 }),
  p(10,  0, PlatformType.SOLID,  { id: 'z1_2',    zone: 1 }),
  p(15,  0, PlatformType.SOLID,  { id: 'z1_3',    zone: 1 }),
  p(20,  0, PlatformType.SOLID,  { id: 'z1_4',    zone: 1 }),
  p(25,  0, PlatformType.FAKE,   { id: 'z1_fake', zone: 1 }), // THE LIE

  // ── Zone 2: The Commute (x: 30–62) — camera rotates here ──
  p(30,  0,   PlatformType.SOLID,  { id: 'z2_0', zone: 2 }),
  p(35,  1.5, PlatformType.SOLID,  { id: 'z2_1', zone: 2 }),
  p(40,  0.5, PlatformType.SOLID,  { id: 'z2_2', zone: 2 }),
  p(45,  2,   PlatformType.NARROW, { id: 'z2_narrow', zone: 2, w: PLATFORM_W * 0.5 }),
  p(50,  0,   PlatformType.SOLID,  { id: 'z2_4', zone: 2 }),
  p(55,  1,   PlatformType.SOLID,  { id: 'z2_5', zone: 2 }),
  p(60,  0,   PlatformType.SOLID,  { id: 'z2_6', zone: 2 }),
  p(65,  0,   PlatformType.SOLID,  { id: 'z2_7', zone: 2 }),

  // ── Zone 3: The Pattern (x: 70–115) ──
  // Rep 1: short(4), short(4), long(7), short(4) — all solid
  p(70,  0, PlatformType.SOLID,  { id: 'z3_r1_0', zone: 3 }),
  p(75,  0, PlatformType.SOLID,  { id: 'z3_r1_1', zone: 3 }),
  p(80,  0, PlatformType.SOLID,  { id: 'z3_r1_2', zone: 3 }),
  p(88,  0, PlatformType.SOLID,  { id: 'z3_r1_3', zone: 3 }),
  p(93,  0, PlatformType.SOLID,  { id: 'z3_r1_4', zone: 3 }),
  // Rep 2: same rhythm — all solid
  p(98,  0, PlatformType.SOLID,  { id: 'z3_r2_0', zone: 3 }),
  p(103, 0, PlatformType.SOLID,  { id: 'z3_r2_1', zone: 3 }),
  p(108, 0, PlatformType.SOLID,  { id: 'z3_r2_2', zone: 3 }),
  p(116, 0, PlatformType.SOLID,  { id: 'z3_r2_3', zone: 3 }),
  p(121, 0, PlatformType.SOLID,  { id: 'z3_r2_4', zone: 3 }),
  // Rep 3: platform index 3 (id z3_r3_3) is MEMORY — gone at attempt 20
  p(126, 0, PlatformType.SOLID,  { id: 'z3_r3_0', zone: 3 }),
  p(131, 0, PlatformType.SOLID,  { id: 'z3_r3_1', zone: 3 }),
  p(136, 0, PlatformType.SOLID,  { id: 'z3_r3_2', zone: 3 }),
  p(144, 0, PlatformType.MEMORY, { id: 'z3_memory', zone: 3 }), // THE TRAP
  p(149, 0, PlatformType.SOLID,  { id: 'z3_r3_4', zone: 3 }),

  // ── Zone 4: The Inbox (x: 155–185) ──
  p(155, 0,   PlatformType.SOLID, { id: 'z4_0', zone: 4 }),
  spike(157.5, 0.4, 'z4_spike1'),
  p(161, 1,   PlatformType.SOLID, { id: 'z4_1', zone: 4 }),
  spike(163.5, 1.4, 'z4_spike2'),
  p(167, 0,   PlatformType.SOLID, { id: 'z4_2', zone: 4 }),
  spike(169.5, 0.4, 'z4_spike3'),
  // Zone 3 pattern repeat — but platform index 1 is FAKE (not index 3)
  p(173, 0, PlatformType.SOLID, { id: 'z4_r1_0', zone: 4 }),
  p(178, 0, PlatformType.FAKE,  { id: 'z4_fake', zone: 4 }), // platform 2 is fake now
  p(183, 0, PlatformType.SOLID, { id: 'z4_r1_2', zone: 4 }),
  p(191, 0, PlatformType.SOLID, { id: 'z4_r1_3', zone: 4 }),
  p(196, 0, PlatformType.SOLID, { id: 'z4_r1_4', zone: 4 }),

  // ── Zone 5: The Exit (x: 202–222) ──
  p(202, 0, PlatformType.SOLID, { id: 'z5_0', zone: 5 }),
  p(207, 0, PlatformType.SOLID, { id: 'z5_1', zone: 5 }), // fake banner triggers when reaching this
  p(213, 0, PlatformType.SOLID, { id: 'z5_2', zone: 5 }),
  p(218, 0, PlatformType.SOLID, { id: 'z5_3', zone: 5 }),
  // Door at x: 223 (collision zone, not a platform)
];

export function isPlatformCollidable(platform, attemptsReal) {
  switch (platform.type) {
    case PlatformType.SOLID:
    case PlatformType.NARROW:
      return true;
    case PlatformType.FAKE:
      return !platform.touched;
    case PlatformType.MEMORY:
      return attemptsReal < 20;
    case PlatformType.SPIKE:
      return false; // handled via overlap kill, not landing
    default:
      return false;
  }
}

export function isPlatformVisible(platform, attemptsReal) {
  switch (platform.type) {
    case PlatformType.SOLID:
    case PlatformType.NARROW:
      return true;
    case PlatformType.FAKE:
      return !platform.touched;
    case PlatformType.MEMORY:
      return attemptsReal < 20;
    case PlatformType.SPIKE:
      return false;
    default:
      return false;
  }
}

export function getZoneForX(x) {
  if (x < 28)  return 1;
  if (x < 68)  return 2;
  if (x < 153) return 3;
  if (x < 200) return 4;
  return 5;
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
node --test tests/platforms.test.js
```

Expected: `✓ all tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/platforms.js tests/platforms.test.js
git commit -m "feat: platform data + active/visible logic"
```

---

## Task 5: Gerald's Mesh

**Files:**
- Create: `src/gerald.js`

*(No unit tests — Three.js geometry. Test visually.)*

- [ ] **Step 1: Create `src/gerald.js`**

```js
import * as THREE from 'three';

export function createGerald(scene) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 }); // dark suit
  const skinMat = new THREE.MeshLambertMaterial({ color: 0xf0c08a }); // skin
  const shirtMat = new THREE.MeshLambertMaterial({ color: 0xecf0f1 }); // white shirt
  const briefcaseMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // brown

  // Body (torso)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), bodyMat);
  torso.position.set(0, 0.9, 0);
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.45), skinMat);
  head.position.set(0, 1.65, 0);
  group.add(head);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.28, 0.6, 0.32);
  const legL = new THREE.Mesh(legGeo, bodyMat);
  legL.position.set(-0.2, 0.3, 0);
  group.add(legL);
  const legR = new THREE.Mesh(legGeo, bodyMat);
  legR.position.set(0.2, 0.3, 0);
  group.add(legR);

  // Briefcase
  const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), briefcaseMat);
  briefcase.position.set(0.55, 0.7, 0);
  group.add(briefcase);

  // Quest marker (!) — yellow billboard-ish sprite using a thin box
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.05), markerMat);
  marker.position.set(0, 2.4, 0);
  group.add(marker);

  group.position.set(0, 0, 0);
  scene.add(group);

  return {
    group,
    marker,
    briefcase,
    // Reset all death-state transforms
    resetPose() {
      group.rotation.set(0, 0, 0);
      group.scale.set(1, 1, 1);
      briefcase.position.set(0.55, 0.7, 0);
    },
    // Quick death tumble — call once on death
    playDeathAnimation() {
      group.rotation.z = (Math.random() > 0.5 ? 1 : -1) * Math.PI * 0.4;
      briefcase.position.set(1.2 + Math.random(), 1.2, 0.3);
    },
  };
}
```

- [ ] **Step 2: Add Gerald to `src/main.js` and verify visually**

Add at the top of `src/main.js`:
```js
import { createGerald } from './gerald.js';
```

After the lighting setup in `src/main.js`:
```js
const gerald = createGerald(scene);
gerald.group.position.set(0, 0.5, 0);
```

- [ ] **Step 3: Open browser — should see a blocky office worker on screen**

- [ ] **Step 4: Commit**

```bash
git add src/gerald.js src/main.js
git commit -m "feat: Gerald character mesh"
```

---

## Task 6: Render Platforms + Movement

**Files:**
- Modify: `src/main.js`
- Create: `src/renderer.js`

- [ ] **Step 1: Create `src/renderer.js` — builds Three.js meshes from platform data**

```js
import * as THREE from 'three';
import { isPlatformVisible } from './platforms.js';

const platformMat = new THREE.MeshLambertMaterial({ color: 0x4CAF50 }); // green — same for all visible platforms incl. NARROW

// Returns a map: platform.id -> THREE.Mesh
export function buildPlatformMeshes(platforms, scene) {
  const meshMap = {};
  for (const plat of platforms) {
    if (plat.type === 'SPIKE') continue; // spikes are invisible — no mesh

    const mat = platformMat; // NARROW uses same color — looks identical, just narrower
    const geo = new THREE.BoxGeometry(plat.w, plat.h, 1.2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(plat.x, plat.y + plat.h / 2, 0);
    scene.add(mesh);
    meshMap[plat.id] = mesh;
  }
  return meshMap;
}

export function syncPlatformVisibility(platforms, meshMap, attemptsReal) {
  for (const plat of platforms) {
    const mesh = meshMap[plat.id];
    if (!mesh) continue;
    mesh.visible = isPlatformVisible(plat, attemptsReal);
  }
}
```

- [ ] **Step 2: Add input tracking + full movement loop to `src/main.js`**

Replace the entire contents of `src/main.js` with:

```js
import * as THREE from 'three';
import { createGerald } from './gerald.js';
import { LEVEL_PLATFORMS, isPlatformCollidable, getZoneForX, PlatformType } from './platforms.js';
import { buildPlatformMeshes, syncPlatformVisibility } from './renderer.js';
import { createGameState, onDeath, onRespawn, onWin, onPause, onResume, GameStatus } from './state.js';
import { applyGravity, applyMovement, createJumpVelocity, resolvePlatformCollision, MOVE_SPEED, PLAYER_SIZE } from './physics.js';

// ── Scene setup ──
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 60, 100);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 4, 14);
camera.lookAt(0, 1, 0);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(10, 20, 10);
scene.add(sun);

// Ground plane (visual, not collision)
const groundGeo = new THREE.PlaneGeometry(500, 20);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(100, -5, 0);
scene.add(ground);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Game objects ──
const gerald = createGerald(scene);
const meshMap = buildPlatformMeshes(LEVEL_PLATFORMS, scene);
let platforms = LEVEL_PLATFORMS.map(p => ({ ...p })); // mutable copies

// ── Game state ──
let state = createGameState();
let pos = { x: 0, y: 0.4 };
let vel = { x: 0, y: 0 };
let onGround = false;

const SPAWN = { x: 0, y: 0.4 };

// ── Input ──
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Escape') handlePause();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function handlePause() {
  if (state.status === GameStatus.PLAYING) {
    state = onPause(state);
    // 10% chance pause kills Gerald
    if (Math.random() < 0.10) {
      state = onRespawn(state); // unpause first so death can proceed
      triggerDeath();
      return;
    }
    document.getElementById('pause-menu').classList.remove('hidden');
  } else if (state.status === GameStatus.PAUSED) {
    resumeGame();
  }
}

document.getElementById('resume-btn').addEventListener('click', resumeGame);

function resumeGame() {
  state = onResume(state);
  document.getElementById('pause-menu').classList.add('hidden');
}

// ── Death & Respawn ──
const DIALOGUES = [
  "Is this the break room?",
  "I just need to clock in.",
  "This wasn't in my contract.",
  "HR will hear about this.",
  "I have a 9am meeting!",
];

function triggerDeath() {
  if (state.status !== GameStatus.PLAYING) return;
  state = onDeath(state);
  gerald.playDeathAnimation();
  showDialogue(DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)]);
  updateDeathCounter();
  // Reset fake platforms on respawn
  setTimeout(() => {
    platforms = LEVEL_PLATFORMS.map(p => ({ ...p }));
    pos = { ...SPAWN };
    vel = { x: 0, y: 0 };
    onGround = false;
    gerald.resetPose();
    state = onRespawn(state);
  }, 600);
}

function updateDeathCounter() {
  document.getElementById('death-counter').textContent = `Deaths: ${state.deathsDisplayed}`;
}

function showDialogue(text) {
  const el = document.getElementById('dialogue');
  el.textContent = `"${text}"`;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth; // reflow to restart animation
  el.style.animation = '';
  setTimeout(() => el.classList.add('hidden'), 2500);
}

// ── Win ──
document.getElementById('claim-btn').addEventListener('click', () => {
  document.getElementById('fake-banner').classList.add('hidden');
  triggerDeath();
});

document.getElementById('share-btn').addEventListener('click', () => {
  const text = `I just beat "Not My Department" with ${state.deathsDisplayed} deaths. Gerald made it to work. HR has been notified. 💼`;
  navigator.clipboard.writeText(text).catch(() => {});
  alert('Copied to clipboard!');
});

function triggerWin() {
  state = onWin(state);
  document.getElementById('win-deaths').textContent = `You died ${state.deathsDisplayed} times. HR has been notified.`;
  document.getElementById('win-screen').classList.remove('hidden');
}

// ── Main game loop ──
let lastZone = 1;
let fakeBannerTriggered = false;

function update() {
  if (state.status !== GameStatus.PLAYING) return;

  // Horizontal movement
  vel.x = 0;
  if (keys['ArrowLeft']  || keys['KeyA']) vel.x = -MOVE_SPEED;
  if (keys['ArrowRight'] || keys['KeyD']) vel.x =  MOVE_SPEED;

  // Jump
  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && onGround) {
    vel = createJumpVelocity(vel);
    onGround = false;
  }

  // Physics
  vel = applyGravity(vel);
  pos = applyMovement(pos, vel);
  onGround = false;

  // Platform collision
  for (const plat of platforms) {
    if (!isPlatformCollidable(plat, state.attemptsReal)) continue;
    const result = resolvePlatformCollision(pos, vel, PLAYER_SIZE, plat);
    if (result.landed) {
      pos = result.pos;
      vel = result.vel;
      onGround = true;
      // Mark FAKE platforms as touched
      if (plat.type === PlatformType.FAKE && !plat.touched) {
        plat.touched = true;
        setTimeout(() => triggerDeath(), 150); // fall through 150ms later
      }
    }
  }

  // Spike overlap check
  for (const plat of platforms) {
    if (plat.type !== PlatformType.SPIKE) continue;
    const playerBox = { x: pos.x - PLAYER_SIZE.w / 2, y: pos.y, w: PLAYER_SIZE.w, h: PLAYER_SIZE.h };
    const spikeBox  = { x: plat.x - plat.w / 2, y: plat.y, w: plat.w, h: plat.h };
    if (
      playerBox.x < spikeBox.x + spikeBox.w && playerBox.x + playerBox.w > spikeBox.x &&
      playerBox.y < spikeBox.y + spikeBox.h && playerBox.y + playerBox.h > spikeBox.y
    ) {
      triggerDeath();
      return;
    }
  }

  // Death by falling
  if (pos.y < -6) { triggerDeath(); return; }

  // Clamp left boundary
  if (pos.x < -1) pos.x = -1;

  // Win condition — door at x: 223
  if (pos.x > 222) { triggerWin(); return; }

  // Zone tracking + triggers
  const zone = getZoneForX(pos.x);
  if (zone !== lastZone) {
    lastZone = zone;
    document.getElementById('zone-label').textContent = `Zone ${zone}`;
    if (zone === 3 && !state.checkpointToastShown) {
      state.checkpointToastShown = true;
      showCheckpointToast();
    }
  }

  // Zone 4 death counter tamper
  if (zone === 4 && !state.zone4CounterTampered) {
    state.zone4CounterTampered = true;
    state.deathsDisplayed += 3;
    updateDeathCounter();
  }

  // Zone 5 fake banner — trigger when reaching z5_1 platform area
  if (pos.x > 207 && !fakeBannerTriggered) {
    fakeBannerTriggered = true;
    document.getElementById('fake-banner').classList.remove('hidden');
  }

  // Update Three.js
  gerald.group.position.set(pos.x, pos.y, 0);
  syncPlatformVisibility(platforms, meshMap, state.attemptsReal);
}

function showCheckpointToast() {
  const toast = document.getElementById('checkpoint-toast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function animate() {
  requestAnimationFrame(animate);
  update();

  // Camera follows Gerald on X, stays fixed Y/Z
  camera.position.x += (gerald.group.position.x - camera.position.x) * 0.08;
  camera.lookAt(gerald.group.position.x, 1.5, 0);

  renderer.render(scene, camera);
}
animate();
```

- [ ] **Step 3: Open browser — Gerald should move with arrow keys, jump with Space, fall off platforms**

- [ ] **Step 4: Commit**

```bash
git add src/main.js src/renderer.js
git commit -m "feat: movement, collision, death/respawn loop"
```

---

## Task 7: Camera Module (Zones 2 & 4)

**Files:**
- Create: `src/camera.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create `src/camera.js`**

```js
// Deterministic camera sequences for zone 2 and zone 4.
// All state is per-attempt — reset on death.

export function createCameraController(camera) {
  let zone2Active = false;
  let zone2Timer = 0;
  const ZONE2_DURATION = 240; // frames (~4 seconds at 60fps)
  const ZONE2_MAX_OFFSET = 3.5;

  let zone4Active = false;
  let zone4Timer = 0;

  return {
    reset() {
      zone2Active = false;
      zone2Timer = 0;
      zone4Active = false;
      zone4Timer = 0;
    },

    activateZone2() {
      if (!zone2Active) { zone2Active = true; zone2Timer = 0; }
    },

    activateZone4() {
      zone4Active = true;
    },

    // Call once per frame with geraldX
    update(geraldX) {
      let xOffset = 0;

      if (zone2Active && zone2Timer < ZONE2_DURATION) {
        zone2Timer++;
        // Ease out: offset grows fast then plateaus — disorienting on landing
        const t = zone2Timer / ZONE2_DURATION;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        xOffset = eased * ZONE2_MAX_OFFSET;
      }

      if (zone4Active) {
        zone4Timer++;
        // Slow sine drift — 6-second loop
        xOffset = Math.sin(zone4Timer * (Math.PI * 2) / 360) * 2.0;
      }

      // Smooth follow on X + troll offset
      const targetX = geraldX + xOffset;
      camera.position.x += (targetX - camera.position.x) * 0.06;
      camera.lookAt(camera.position.x, 1.5, 0);
    },
  };
}
```

- [ ] **Step 2: Wire camera controller in `src/main.js`**

Add at the top imports in `src/main.js`:
```js
import { createCameraController } from './camera.js';
```

After the `gerald` declaration in `src/main.js`:
```js
const camController = createCameraController(camera);
```

Inside `triggerDeath()`, before `setTimeout`, add:
```js
camController.reset();
fakeBannerTriggered = false;
```

At the end of the `update()` function (before the closing `}`), add:
```js
// Zone camera activations
if (lastZone === 2) camController.activateZone2();
if (lastZone === 4) camController.activateZone4();
```

In `animate()`, replace the two camera lines:
```js
// REMOVE these two lines:
camera.position.x += (gerald.group.position.x - camera.position.x) * 0.08;
camera.lookAt(gerald.group.position.x, 1.5, 0);
// REPLACE with:
camController.update(gerald.group.position.x);
```

- [ ] **Step 3: Play into Zone 2 in browser — camera should drift right mid-jump**

- [ ] **Step 4: Commit**

```bash
git add src/camera.js src/main.js
git commit -m "feat: zone 2 camera drift and zone 4 sine"
```

---

## Task 8: Win Screen + Share + Door Mesh

**Files:**
- Modify: `src/main.js`
- Modify: `src/renderer.js`

- [ ] **Step 1: Add BREAK ROOM door mesh in `src/renderer.js`**

Add this export to `src/renderer.js`:

```js
export function buildDoorMesh(scene) {
  const doorGroup = new THREE.Group();

  const doorMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const doorBody = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, 0.3), doorMat);
  doorBody.position.set(0, 1.75, 0);
  doorGroup.add(doorBody);

  // Glowing frame
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.35), frameMat);
  frameTop.position.set(0, 3.6, 0);
  doorGroup.add(frameTop);

  // Sign
  const signMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.1), signMat);
  sign.position.set(0, 2.5, 0.25);
  doorGroup.add(sign);

  doorGroup.position.set(223, 0, 0);
  scene.add(doorGroup);
  return doorGroup;
}
```

- [ ] **Step 2: Add door to `src/main.js`**

Add import:
```js
import { buildPlatformMeshes, syncPlatformVisibility, buildDoorMesh } from './renderer.js';
```

After the `meshMap` line:
```js
buildDoorMesh(scene);
```

- [ ] **Step 3: Manually walk Gerald to the door and verify win screen appears**

Expected: Win screen with `"Finally. I'm 3 hours late."` and death count.

- [ ] **Step 4: Verify share button copies text to clipboard**

- [ ] **Step 5: Commit**

```bash
git add src/main.js src/renderer.js
git commit -m "feat: break room door + win screen"
```

---

## Task 9: Full Playthrough Verification

*(Manual testing — no code changes unless bugs found)*

- [ ] **Step 1: Zone 1 test — platform 6 must vanish on contact and kill Gerald**

Walk to the last green platform before Zone 2. Step on it. Expected: Gerald falls through and dies within 200ms. Dialogue shows.

- [ ] **Step 2: Zone 2 test — camera drifts mid-jump**

Enter Zone 2. Jump toward the narrow platform. Expected: camera drifts right ~3 units over 4 seconds, disorienting landing aim.

- [ ] **Step 3: Zone 3 test — pattern consistent first 19 attempts**

Play to Zone 3 and count deaths to 19. All platforms in Rep 3 should be solid. On attempt 20, the 4th platform of Rep 3 (`z3_memory`) must be gone and invisible.

- [ ] **Step 4: Checkpoint toast test — must appear exactly once on Zone 3 entry**

Enter Zone 3. Toast: "CHECKPOINT SAVED ✓" appears. Exit to Zone 2, re-enter Zone 3. Toast must NOT appear again.

- [ ] **Step 5: Zone 4 test — three spike kills**

Walk slowly through Zone 4. Step on the platforms with invisible spikes — death must trigger.

- [ ] **Step 6: Zone 4 fake banner test**

The Zone 4 fake platform (`z4_fake`) must vanish on contact and kill Gerald.

- [ ] **Step 7: Death counter tamper — Zone 4**

Note death count before Zone 4. Enter Zone 4. Counter must jump by +3 once.

- [ ] **Step 8: Zone 5 fake banner**

Walk past the Zone 5 second platform. "LEVEL COMPLETE 🎉" banner must appear. Click "CLAIM REWARD" — Gerald must die. Banner disappears.

- [ ] **Step 9: Pause kill test**

Spam Escape 20+ times in Zone 2. At least one press should kill Gerald (10% chance per press — statistically guaranteed within 20+ presses).

- [ ] **Step 10: Complete the game legitimately**

Walk all the way to the door at x:223. Win screen appears.

- [ ] **Step 11: Commit any bug fixes found**

```bash
git add -p
git commit -m "fix: playthrough bug fixes"
```

---

## Task 10: GitHub Pages Deploy

- [ ] **Step 1: Create a GitHub repo and push**

```bash
git remote add origin https://github.com/YOUR_USERNAME/not-my-department.git
git push -u origin main
```

- [ ] **Step 2: Enable GitHub Pages**

Go to repo Settings → Pages → Source: Deploy from branch `main`, folder `/` (root). Save.

- [ ] **Step 3: Wait ~60 seconds, then open the Pages URL**

Expected: Game loads, Gerald appears, all zones work.

- [ ] **Step 4: Update share button URL in `src/main.js`**

Replace the share text with the actual GitHub Pages URL:
```js
const text = `I beat "Not My Department" with ${state.deathsDisplayed} deaths 💼 Play: https://YOUR_USERNAME.github.io/not-my-department/`;
```

- [ ] **Step 5: Commit + push**

```bash
git add src/main.js
git commit -m "feat: share button with live URL"
git push
```

---

## Out of Scope (not in this plan)

- Sound / Web Audio API (optional stretch — add after if desired)
- Mobile touch controls
- Leaderboard
- Multiple levels
