"use strict";

// Project Vice: Mobile — browser prototype.
// Distances are world units; movement and physics use seconds.
// Model assumed to face local +Z, as in the previous project.

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;

const CONFIG = {
  modelURL: "Mainmc1.glb",
  modelScale: 1,
  modelYawOffset: 0,       // Change to Math.PI if the model faces backward.
  playerRadius: 0.38,
  walkSpeed: 3.6,
  runSpeed: 7,
  jumpSpeed: 6.5,
  gravity: 20,
  cameraDistance: 3.15,   // Closer third-person view.
  cameraHeight: 1.45,
  shoulder: 0.48,
  mapLimit: 110
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ab9d5);
scene.fog = new THREE.Fog(0x8ab9d5, 65, 150);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.08, 240
);

const renderer = new THREE.WebGLRenderer({
  canvas: $("game"),
  antialias: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xdcefff, 0x5c6551, 0.95));

const sun = new THREE.DirectionalLight(0xffefd7, 0.85);
sun.position.set(35, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {
  left: -45, right: 45, top: 45, bottom: -45,
  near: 1, far: 140
});
sun.shadow.bias = -0.0004;
scene.add(sun);

// Shared geometry/materials reduce resource usage.
// They do not, by themselves, combine draw calls.
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map();

function material(color) {
  if (!materials.has(color)) {
    materials.set(color, new THREE.MeshLambertMaterial({ color }));
  }
  return materials.get(color);
}

function box(parent, x, y, z, w, h, d, color, shadow = false) {
  const mesh = new THREE.Mesh(boxGeometry, material(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const solids = [];
const cameraObstacles = [];
const bulletObjects = [];
const cars = [];
const targets = [];

function addSolid(x, z, w, d) {
  solids.push({
    minX: x - w / 2, maxX: x + w / 2,
    minZ: z - d / 2, maxZ: z + d / 2
  });
}

// --------------------------------------------------
// CITY: roads occupy cell boundaries; buildings do not.
// --------------------------------------------------

const ground = box(scene, 0, -0.15, 0, 240, 0.3, 240, 0x485245);
bulletObjects.push(ground);

const cell = 36;
const roadWidth = 10;
const palette = [
  0xd58b93, 0x84bec1, 0xccb878,
  0xa49ac5, 0x95bd98, 0xdba283
];

for (let i = -3; i <= 3; i++) {
  const p = i * cell;
  box(scene, p, -0.04, 0, roadWidth, 0.08, 226, 0x343a42);
  box(scene, 0, -0.035, p, 226, 0.07, roadWidth, 0x343a42);

  for (let n = -105; n <= 105; n += 9) {
    // Skip intersections.
    if (Math.abs(n - Math.round(n / cell) * cell) < 6) continue;
    box(scene, p, 0.012, n, 0.12, 0.02, 3, 0xe5dba5);
    box(scene, n, 0.014, p, 3, 0.02, 0.12, 0xe5dba5);
  }
}

for (let row = -3; row < 3; row++) {
  for (let col = -3; col < 3; col++) {
    const cx = col * cell + cell / 2;
    const cz = row * cell + cell / 2;

    // Decorative low sidewalk slab. Collision remains at ground level.
    box(scene, cx, 0.035, cz, 26, 0.07, 26, 0xa7a99f);

    for (const ox of [-6, 6]) {
      for (const oz of [-6, 6]) {
        const h = 6 + Math.random() * 17;
        const w = 8 + Math.random() * 1.5;
        const d = 8 + Math.random() * 1.5;
        const x = cx + ox;
        const z = cz + oz;

        const building = box(
          scene, x, h / 2, z, w, h, d,
          palette[Math.floor(Math.random() * palette.length)], true
        );
        addSolid(x, z, w, d);
        cameraObstacles.push(building);
        bulletObjects.push(building);
      }
    }
  }
}

// Low-poly trees at selected sidewalk corners.
const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.25, 2.3, 5);
const leafGeometry = new THREE.ConeGeometry(1.2, 2.7, 6);

for (let i = 0; i < 24; i++) {
  const col = i % 6 - 3;
  const row = Math.floor(i / 6) - 2;
  const x = col * cell + 6.6;
  const z = row * cell + 6.6;

  const trunk = new THREE.Mesh(trunkGeometry, material(0x76503b));
  trunk.position.set(x, 1.15, z);
  const leaf = new THREE.Mesh(leafGeometry, material(0x42815b));
  leaf.position.set(x, 3, z);
  scene.add(trunk, leaf);
  bulletObjects.push(trunk, leaf);
  addSolid(x, z, 0.5, 0.5);
}

// --------------------------------------------------
// TARGET DUMMIES: shooting test objects, not combat AI.
// --------------------------------------------------

function createTarget(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  box(group, 0, 0.55, 0, 0.22, 1.1, 0.22, 0x6c5a42);
  box(group, 0, 1.3, 0, 0.8, 1, 0.35, 0xcc6d56);
  box(group, 0, 2, 0, 0.4, 0.4, 0.4, 0xf1d4a7);

  const target = { group, health: 3, respawn: 0 };
  group.traverse(node => {
    if (node.isMesh) node.userData.target = target;
  });
  targets.push(target);
  bulletObjects.push(group);
}

createTarget(-2, -15);
createTarget(2, -23);
createTarget(-3, -31);

// --------------------------------------------------
// PROCEDURAL CARS, INCLUDING A HINGED DRIVER DOOR.
// --------------------------------------------------

function createCar(x, z, yaw, color) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  scene.add(group);

  box(group, 0, 0.65, 0, 1.9, 0.65, 3.8, color, true);
  box(group, 0, 1.43, -0.15, 1.7, 0.13, 1.8, color, true);
  box
