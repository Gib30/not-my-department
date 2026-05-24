import * as THREE from 'three';

export function createGerald(scene) {
  const group = new THREE.Group();

  const bodyMat      = new THREE.MeshLambertMaterial({ color: 0x2c3e50 }); // dark suit
  const skinMat      = new THREE.MeshLambertMaterial({ color: 0xf0c08a }); // skin
  const briefcaseMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // brown

  // Torso
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

  // Quest marker (!) — yellow thin box floating above
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
    resetPose() {
      group.rotation.set(0, 0, 0);
      group.scale.set(1, 1, 1);
      briefcase.position.set(0.55, 0.7, 0);
    },
    playDeathAnimation() {
      group.rotation.z = (Math.random() > 0.5 ? 1 : -1) * Math.PI * 0.4;
      briefcase.position.set(1.2 + Math.random(), 1.2, 0.3);
    },
  };
}
