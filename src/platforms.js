export const PlatformType = Object.freeze({
  SOLID: 'SOLID',     // always there, always collidable
  FAKE: 'FAKE',       // vanishes 150ms after first contact
  NARROW: 'NARROW',   // solid but 50% standard width — same color (looks identical)
  SPIKE: 'SPIKE',     // invisible, kills on overlap
  MEMORY: 'MEMORY',   // solid until attemptsReal >= 20, then gone
});

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
  // ── Zone 1: Tutorial Lie (x: 0–25) ──
  p(0,   0, PlatformType.SOLID, { id: 'z1_0',    zone: 1 }),
  p(5,   0, PlatformType.SOLID, { id: 'z1_1',    zone: 1 }),
  p(10,  0, PlatformType.SOLID, { id: 'z1_2',    zone: 1 }),
  p(15,  0, PlatformType.SOLID, { id: 'z1_3',    zone: 1 }),
  p(20,  0, PlatformType.SOLID, { id: 'z1_4',    zone: 1 }),
  p(25,  0, PlatformType.FAKE,  { id: 'z1_fake', zone: 1 }), // THE LIE

  // ── Zone 2: The Commute (x: 30–65) — camera drifts here ──
  p(30,  0,   PlatformType.SOLID,   { id: 'z2_0',      zone: 2 }),
  p(35,  1.5, PlatformType.SOLID,   { id: 'z2_1',      zone: 2 }),
  p(40,  0.5, PlatformType.SOLID,   { id: 'z2_2',      zone: 2 }),
  p(45,  2,   PlatformType.NARROW,  { id: 'z2_narrow', zone: 2, w: PLATFORM_W * 0.5 }),
  p(50,  0,   PlatformType.SOLID,   { id: 'z2_4',      zone: 2 }),
  p(55,  1,   PlatformType.SOLID,   { id: 'z2_5',      zone: 2 }),
  p(60,  0,   PlatformType.SOLID,   { id: 'z2_6',      zone: 2 }),
  p(65,  0,   PlatformType.SOLID,   { id: 'z2_7',      zone: 2 }),

  // ── Zone 3: The Pattern (x: 70–149) ──
  // Rep 1: all solid
  p(70,  0, PlatformType.SOLID, { id: 'z3_r1_0', zone: 3 }),
  p(75,  0, PlatformType.SOLID, { id: 'z3_r1_1', zone: 3 }),
  p(80,  0, PlatformType.SOLID, { id: 'z3_r1_2', zone: 3 }),
  p(88,  0, PlatformType.SOLID, { id: 'z3_r1_3', zone: 3 }),
  p(93,  0, PlatformType.SOLID, { id: 'z3_r1_4', zone: 3 }),
  // Rep 2: all solid
  p(98,  0, PlatformType.SOLID, { id: 'z3_r2_0', zone: 3 }),
  p(103, 0, PlatformType.SOLID, { id: 'z3_r2_1', zone: 3 }),
  p(108, 0, PlatformType.SOLID, { id: 'z3_r2_2', zone: 3 }),
  p(116, 0, PlatformType.SOLID, { id: 'z3_r2_3', zone: 3 }),
  p(121, 0, PlatformType.SOLID, { id: 'z3_r2_4', zone: 3 }),
  // Rep 3: platform index 3 is MEMORY — gone at attempt 20+
  p(126, 0, PlatformType.SOLID,  { id: 'z3_r3_0', zone: 3 }),
  p(131, 0, PlatformType.SOLID,  { id: 'z3_r3_1', zone: 3 }),
  p(136, 0, PlatformType.SOLID,  { id: 'z3_r3_2', zone: 3 }),
  p(144, 0, PlatformType.MEMORY, { id: 'z3_memory', zone: 3 }), // THE TRAP
  p(149, 0, PlatformType.SOLID,  { id: 'z3_r3_4', zone: 3 }),

  // ── Zone 4: The Inbox (x: 155–196) ──
  p(155, 0,   PlatformType.SOLID, { id: 'z4_0', zone: 4 }),
  spike(157.5, 0.4, 'z4_spike1'),
  p(161, 1,   PlatformType.SOLID, { id: 'z4_1', zone: 4 }),
  spike(163.5, 1.4, 'z4_spike2'),
  p(167, 0,   PlatformType.SOLID, { id: 'z4_2', zone: 4 }),
  spike(169.5, 0.4, 'z4_spike3'),
  // Zone 3 pattern repeat — platform index 1 is FAKE (not index 3)
  p(173, 0, PlatformType.SOLID, { id: 'z4_r1_0', zone: 4 }),
  p(178, 0, PlatformType.FAKE,  { id: 'z4_fake', zone: 4 }), // platform 2 fake
  p(183, 0, PlatformType.SOLID, { id: 'z4_r1_2', zone: 4 }),
  p(191, 0, PlatformType.SOLID, { id: 'z4_r1_3', zone: 4 }),
  p(196, 0, PlatformType.SOLID, { id: 'z4_r1_4', zone: 4 }),

  // ── Zone 5: The Exit (x: 202–218) ──
  p(202, 0, PlatformType.SOLID, { id: 'z5_0', zone: 5 }),
  p(207, 0, PlatformType.SOLID, { id: 'z5_1', zone: 5 }), // fake banner triggers here
  p(213, 0, PlatformType.SOLID, { id: 'z5_2', zone: 5 }),
  p(218, 0, PlatformType.SOLID, { id: 'z5_3', zone: 5 }),
  // Door at x: 223 (not a platform — win collision handled in game loop)
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
      return false; // kills via overlap check, not landing
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
