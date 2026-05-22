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
