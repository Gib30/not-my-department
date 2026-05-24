import * as THREE from 'three';
import { createGerald } from './gerald.js';
import { LEVEL_PLATFORMS, isPlatformCollidable, getZoneForX, PlatformType } from './platforms.js';
import { buildPlatformMeshes, syncPlatformVisibility, buildDoorMesh } from './renderer.js';
import { createGameState, onDeath, onRespawn, onWin, onPause, onResume, GameStatus } from './state.js';
import { applyGravity, applyMovement, createJumpVelocity, resolvePlatformCollision, MOVE_SPEED, PLAYER_SIZE } from './physics.js';

// ── Scene ──
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

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(10, 20, 10);
scene.add(sun);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Game objects ──
const gerald = createGerald(scene);
const meshMap = buildPlatformMeshes(LEVEL_PLATFORMS, scene);
buildDoorMesh(scene);

// Working copies of platforms — reset on each death
let platforms = LEVEL_PLATFORMS.map(p => ({ ...p }));

// ── State ──
let state = createGameState();
let pos   = { x: 0, y: 0.4 };
let vel   = { x: 0, y: 0 };
let onGround = false;
const SPAWN = { x: 0, y: 0.4 };
let lastZone = 1;
let fakeBannerTriggered = false;

// ── Input ──
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Escape') handlePause();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Pause ──
function handlePause() {
  if (state.status === GameStatus.PLAYING) {
    // 10% chance pause itself kills Gerald
    if (Math.random() < 0.10) { triggerDeath(); return; }
    state = onPause(state);
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

// ── Dialogue ──
const DIALOGUES = [
  "Is this the break room?",
  "I just need to clock in.",
  "This wasn't in my contract.",
  "HR will hear about this.",
  "I have a 9am meeting!",
];

function showDialogue(text) {
  const el = document.getElementById('dialogue');
  el.textContent = `"${text}"`;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth; // force reflow to restart animation
  el.style.animation = '';
  setTimeout(() => el.classList.add('hidden'), 2500);
}

// ── Death counter ──
function updateDeathCounter() {
  document.getElementById('death-counter').textContent = `Deaths: ${state.deathsDisplayed}`;
}

// ── Death & Respawn ──
function triggerDeath() {
  if (state.status !== GameStatus.PLAYING) return;
  state = onDeath(state);
  gerald.playDeathAnimation();
  showDialogue(DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)]);
  updateDeathCounter();
  setTimeout(() => {
    platforms = LEVEL_PLATFORMS.map(p => ({ ...p }));
    pos = { ...SPAWN };
    vel = { x: 0, y: 0 };
    onGround = false;
    lastZone = 1;
    fakeBannerTriggered = false;
    gerald.resetPose();
    state = onRespawn(state);
    document.getElementById('zone-label').textContent = '';
  }, 600);
}

// ── Win ──
function triggerWin() {
  if (state.status !== GameStatus.PLAYING) return;
  state = onWin(state);
  document.getElementById('win-deaths').textContent =
    `You died ${state.deathsDisplayed} times. HR has been notified.`;
  document.getElementById('win-screen').classList.remove('hidden');
}

document.getElementById('claim-btn').addEventListener('click', () => {
  document.getElementById('fake-banner').classList.add('hidden');
  triggerDeath();
});

document.getElementById('share-btn').addEventListener('click', () => {
  const text = `I beat "Not My Department" with ${state.deathsDisplayed} deaths 💼 Gerald made it to work.`;
  navigator.clipboard.writeText(text).catch(() => {});
  alert('Copied to clipboard!');
});

// ── Meta UI ──
function showCheckpointToast() {
  const toast = document.getElementById('checkpoint-toast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ── Update (game logic — runs every frame) ──
function update() {
  if (state.status !== GameStatus.PLAYING) return;

  // Movement
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

  // Platform collision (landing only)
  for (const plat of platforms) {
    if (!isPlatformCollidable(plat, state.attemptsReal)) continue;
    const result = resolvePlatformCollision(pos, vel, PLAYER_SIZE, plat);
    if (result.landed) {
      pos = result.pos;
      vel = result.vel;
      onGround = true;
      // FAKE: mark touched, kill 150ms later
      if (plat.type === PlatformType.FAKE && !plat.touched) {
        plat.touched = true;
        setTimeout(triggerDeath, 150);
      }
    }
  }

  // Spike overlap kill
  for (const plat of platforms) {
    if (plat.type !== PlatformType.SPIKE) continue;
    const px = pos.x - PLAYER_SIZE.w / 2, pw = PLAYER_SIZE.w;
    const py = pos.y,                      ph = PLAYER_SIZE.h;
    const sx = plat.x - plat.w / 2,       sw = plat.w;
    const sy = plat.y,                     sh = plat.h;
    if (px < sx + sw && px + pw > sx && py < sy + sh && py + ph > sy) {
      triggerDeath(); return;
    }
  }

  // Fall death
  if (pos.y < -6) { triggerDeath(); return; }

  // Left wall
  if (pos.x < -1) pos.x = -1;

  // Win — door at x: 223
  if (pos.x > 222) { triggerWin(); return; }

  // Zone transitions
  const zone = getZoneForX(pos.x);
  if (zone !== lastZone) {
    lastZone = zone;
    document.getElementById('zone-label').textContent = `Zone ${zone}`;
    // Zone 3: lying checkpoint toast
    if (zone === 3 && !state.checkpointToastShown) {
      state.checkpointToastShown = true;
      showCheckpointToast();
    }
  }

  // Zone 4: death counter tamper (once)
  if (zone === 4 && !state.zone4CounterTampered) {
    state.zone4CounterTampered = true;
    state.deathsDisplayed += 3;
    updateDeathCounter();
  }

  // Zone 5: fake banner (once)
  if (pos.x > 207 && !fakeBannerTriggered) {
    fakeBannerTriggered = true;
    document.getElementById('fake-banner').classList.remove('hidden');
  }

  // Sync Three.js
  gerald.group.position.set(pos.x, pos.y, 0);
  syncPlatformVisibility(platforms, meshMap, state.attemptsReal);
}

// ── Animate ──
function animate() {
  requestAnimationFrame(animate);
  update();
  // Basic camera follow (zone-specific camera tricks added in Task 7)
  camera.position.x += (pos.x - camera.position.x) * 0.08;
  camera.lookAt(pos.x, 1.5, 0);
  renderer.render(scene, camera);
}
animate();
