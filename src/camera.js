// Deterministic camera sequences for Zone 2 and Zone 4.
// All state is per-attempt — reset on death via reset().

export function createCameraController(camera) {
  let zone2Active = false;
  let zone2Timer  = 0;
  const ZONE2_DURATION   = 240; // frames (~4s at 60fps)
  const ZONE2_MAX_OFFSET = 3.5; // units right

  let zone4Active = false;
  let zone4Timer  = 0;

  return {
    reset() {
      zone2Active = false;
      zone2Timer  = 0;
      zone4Active = false;
      zone4Timer  = 0;
    },

    activateZone2() {
      if (!zone2Active) { zone2Active = true; zone2Timer = 0; }
    },

    activateZone4() {
      if (!zone4Active) { zone4Active = true; }
    },

    // Call once per frame with geraldX. Updates camera position.
    update(geraldX) {
      let xOffset = 0;

      if (zone2Active && zone2Timer < ZONE2_DURATION) {
        zone2Timer++;
        // Ease-out: grows fast then plateaus — disorienting on landing
        const t      = zone2Timer / ZONE2_DURATION;
        const eased  = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        xOffset = eased * ZONE2_MAX_OFFSET;
      }

      if (zone4Active) {
        zone4Timer++;
        // Slow 6-second sine drift
        xOffset = Math.sin(zone4Timer * (Math.PI * 2) / 360) * 2.0;
      }

      const targetX = geraldX + xOffset;
      camera.position.x += (targetX - camera.position.x) * 0.06;
      camera.lookAt(camera.position.x, 1.5, 0);
    },
  };
}
