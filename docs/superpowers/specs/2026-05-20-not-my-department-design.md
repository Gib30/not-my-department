# Not My Department — Game Design Spec
*Date: 2026-05-20*

## Overview

A 2.5D browser platformer built with Three.js. Deceptively cheerful visuals — bright sky, green platforms, sunshine — hiding a brutally unfair level that lies, cheats, and attacks the player's UI. The character is Gerald, an ordinary office worker who does not belong here and knows it.

**Scope:** One level MVP. Ship it, get feedback, iterate.

---

## Core Pillars

| Pillar | Description |
|--------|-------------|
| **World Lies** | Platforms vanish, spikes are invisible, "safe" areas kill you |
| **Camera as Enemy** | Three.js camera rotates, zooms, and drifts to destroy spatial awareness |
| **Memory Traps** | Consistent patterns that break once — on attempt 20+, after you've built muscle memory |
| **Meta UI Seasoning** | Fake banners, lying death counter, dangerous pause menu — sprinkled, not constant |

---

## Character — Gerald

- Low-poly humanoid in suit and tie, briefcase in hand
- Yellow `!` quest marker floating above his head at all times
- Dialogue bubbles on death: *"Is this the break room?"*, *"I just need to clock in."*, *"This wasn't in my contract."*
- Death animation: briefcase flies off, papers scatter, Gerald ragdolls
- No health bar — one hit kills, instant respawn at level start (no checkpoints)

---

## Level Structure — "The Commute"

One linear level, left to right. Five zones, each introducing a mechanic.

### Zone 1 — Tutorial Lie
- 6 platforms, honest controls, no tricks
- Teaches: move (arrow keys / WASD), jump (Space), pause (Escape)
- Platform 6 (right before zone 2 entrance) vanishes on contact
- First death. Sets the tone immediately.
- Camera: static, safe angle

### Zone 2 — The Commute
- 8 platforms over a void
- Camera slowly rotates 15° clockwise over 4 seconds while Gerald is mid-jump
- What looks like a safe landing zone is angled wrong by arrival
- Camera resets on death — so each attempt starts fresh but the rotation triggers again at the same moment
- One platform is visually identical to the others but 40% narrower (Three.js geometry, same texture)

### Zone 3 — The Pattern
- 5 platforms in an arcing rhythm: short gap, short gap, long gap, short gap
- Repeats 3 times in a row — perfectly consistent, totally safe
- On internal attempt 20 or later (tracked silently, never shown to player): platform 4 of the 3rd repetition is missing
- "CHECKPOINT SAVED" notification fires once entering this zone — there are no checkpoints

### Zone 4 — The Inbox
- All three core mechanics active simultaneously
- Camera drifts left 10° and back on a 6-second loop
- 3 invisible spike traps on platforms that look clean
- The Zone 3 pattern appears again — but platform 2 is now fake (not platform 4)
- Death counter in corner randomly adds +3 once during this zone

### Zone 5 — The Exit
- Short final stretch, 4 platforms
- Fake "LEVEL COMPLETE 🎉" banner fires 2 platforms before the actual end
- Banner has a large "CLAIM REWARD" button — clicking it kills Gerald instantly
- The real exit: a glowing door labelled "BREAK ROOM"
- Reaching it triggers genuine win screen with Gerald's dialogue: *"Finally. I'm 3 hours late."*

---

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Rendering | Three.js | Platforms, character, lighting, camera control |
| Game logic | Vanilla JS | Physics, collision, state machine, two counters: `deathsDisplayed` (shown, can be tampered) and `attemptsReal` (internal, never shown) |
| UI overlay | HTML + CSS | Death counter, fake banners, dialogue bubbles, pause menu |
| Audio | Web Audio API | Optional: boing sound on fake platform, sad trombone on death |
| Hosting | GitHub Pages | Free, instant shareable link |

**No framework.** Single `index.html` + `game.js` + `style.css`. Keeps it fast to build and easy to tweak.

---

## Physics (simple, not realistic)

- Gravity: constant downward pull
- Jump: fixed impulse, no variable height (reduces skill ceiling, increases troll effectiveness)
- Movement: fixed horizontal speed, no acceleration curve
- Collision: AABB against platform bounding boxes
- Off-screen fall: instant death, no fall animation needed

---

## Camera System

- Default: orthographic-ish perspective, locked behind Gerald
- Zone 2: `THREE.PerspectiveCamera` rotates on Z axis via `tween.js` or manual lerp
- Zone 4: camera drifts on X axis in a sine wave
- All camera moves are deterministic (not random) — same on every attempt, but feel surprising

---

## Meta UI Troll Details

| Trigger | Effect |
|---------|--------|
| Zone 3 entry | "CHECKPOINT SAVED ✓" toast — lies |
| Death #1 | Counter shows "Deaths: 1" — normal |
| Zone 4, any death | Counter shows deaths + 3 once (e.g. "Deaths: 14" when it's actually 11) |
| Zone 5, 2 platforms before end | Fake "LEVEL COMPLETE 🎉" banner with "CLAIM REWARD" button |
| Clicking "CLAIM REWARD" | Instant death, banner disappears, Gerald resets |
| Pause menu | 10% chance of killing Gerald on open |

---

## Win Condition

Gerald reaches the "BREAK ROOM" door at the end of Zone 5.

Win screen:
- Confetti (CSS)
- Gerald's dialogue: *"Finally. I'm 3 hours late."*
- Death count displayed: *"You died X times. HR has been notified."*
- Share button: copies a URL/tweet with death count

---

## File Structure

```
/
├── index.html          # Entry point, UI overlay elements
├── game.js             # Main game loop, zones, mechanics
├── style.css           # UI styling, fake banners, animations
└── assets/             # Optional: textures, sounds
```

---

## Out of Scope (v1)

- Multiple levels
- Leaderboard
- Mobile controls
- Custom character skins
- Actual checkpoints
- Sound (optional stretch)
