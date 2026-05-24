import * as THREE from 'three';
import { isPlatformVisible } from './platforms.js';

// All visible platforms share the same green material — NARROW is same color (looks identical, just narrower)
const platformMat = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });

// Returns a map: platform.id -> THREE.Mesh
export function buildPlatformMeshes(platforms, scene) {
  const meshMap = {};
  for (const plat of platforms) {
    if (plat.type === 'SPIKE') continue; // spikes are invisible — no mesh

    const geo = new THREE.BoxGeometry(plat.w, plat.h, 1.2);
    const mesh = new THREE.Mesh(geo, platformMat);
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

export function buildDoorMesh(scene) {
  const doorGroup = new THREE.Group();

  const doorMat  = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });

  const doorBody = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, 0.3), doorMat);
  doorBody.position.set(0, 1.75, 0);
  doorGroup.add(doorBody);

  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.35), frameMat);
  frameTop.position.set(0, 3.6, 0);
  doorGroup.add(frameTop);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  sign.position.set(0, 2.5, 0.25);
  doorGroup.add(sign);

  doorGroup.position.set(223, 0, 0);
  scene.add(doorGroup);
  return doorGroup;
}
