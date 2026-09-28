import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mulberry32, type Rand } from "./random";

/**
 * About Us — a friendly particle robot. Built from simple primitives that are
 * only used as a source for surface samples: nothing solid is ever rendered.
 * Every particle knows its body part, so the shader can articulate the head,
 * torso, arms and legs separately (see shaders/robot.vert.glsl).
 *
 * Units: the robot is ~4.3 tall, centred on the origin, facing +z.
 */

export const ROBOT_PART = { head: 0, eyes: 1, torso: 2, armL: 3, armR: 4, legs: 5 } as const;
export const ROBOT_PART_COUNT = 6;

/** Joint pivots (robot space) the CPU rotates parts around. */
export const ROBOT_PIVOTS = {
  neck: new THREE.Vector3(0, 0.78, 0),
  waist: new THREE.Vector3(0, -0.62, 0),
  shoulderL: new THREE.Vector3(-0.78, 0.5, 0),
  shoulderR: new THREE.Vector3(0.78, 0.5, 0),
} as const;

export const ROBOT_HEIGHT = 4.3;

const HEAD_Y = 1.55;
const FACE_Z = 0.6;
const SCREEN = { halfW: 0.52, halfH: 0.4, radius: 0.13 } as const;
const EYES = { x: 0.24, y: HEAD_Y + 0.03, radius: 0.105 } as const;

interface Piece {
  geometry: THREE.BufferGeometry;
  part: number;
  /** Density multiplier: >1 for features that must read clearly. */
  weight: number;
  brightness: number;
  /** Drop surface samples that fall on the face screen (keeps it dark). */
  maskScreen?: boolean;
}

const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 4, r);
const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 6, 14);
const sphere = (r: number) => new THREE.SphereGeometry(r, 18, 12);

function placed(g: THREE.BufferGeometry, x: number, y: number, z: number, rotZ = 0, rotX = 0): THREE.BufferGeometry {
  return g.rotateX(rotX).rotateZ(rotZ).translate(x, y, z);
}

function pieces(): Piece[] {
  const list: Piece[] = [
    // Head
    { geometry: placed(rbox(1.5, 1.3, 1.2, 0.3), 0, HEAD_Y, 0), part: ROBOT_PART.head, weight: 1.35, brightness: 1, maskScreen: true },
    { geometry: placed(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 20), -0.8, HEAD_Y, 0, Math.PI / 2), part: ROBOT_PART.head, weight: 1.5, brightness: 1 },
    { geometry: placed(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 20), 0.8, HEAD_Y, 0, Math.PI / 2), part: ROBOT_PART.head, weight: 1.5, brightness: 1 },
    // Neck, torso, chest
    { geometry: placed(new THREE.CylinderGeometry(0.16, 0.18, 0.3, 16), 0, 0.82, 0), part: ROBOT_PART.torso, weight: 0.8, brightness: 0.8 },
    { geometry: placed(rbox(1.25, 1.3, 0.85, 0.26), 0, 0.02, 0), part: ROBOT_PART.torso, weight: 0.85, brightness: 0.95 },
  ];
  // Arms (shoulder, upper arm, elbow, forearm, hand) — mirrored.
  for (const side of [-1, 1] as const) {
    const part = side < 0 ? ROBOT_PART.armL : ROBOT_PART.armR;
    const x = side * 0.8;
    list.push(
      { geometry: placed(sphere(0.23), side * 0.8, 0.5, 0), part, weight: 1.3, brightness: 1 },
      { geometry: placed(capsule(0.13, 0.42), side * 0.9, 0.08, 0.0, side * 0.14), part, weight: 1, brightness: 0.95 },
      { geometry: placed(sphere(0.14), side * 0.95, -0.22, 0.04), part, weight: 1.2, brightness: 1 },
      { geometry: placed(capsule(0.12, 0.36), side * 0.97, -0.52, 0.13, side * 0.04, -0.3), part, weight: 1, brightness: 0.95 },
      { geometry: placed(rbox(0.22, 0.26, 0.2, 0.07), x + side * 0.18, -0.86, 0.22), part, weight: 1.6, brightness: 1.05 },
    );
  }
  // Hips, legs (upper, knee, lower), feet.
  list.push({ geometry: placed(rbox(0.95, 0.28, 0.62, 0.12), 0, -0.78, 0), part: ROBOT_PART.legs, weight: 0.9, brightness: 0.85 });
  for (const side of [-1, 1] as const) {
    const x = side * 0.28;
    list.push(
      { geometry: placed(capsule(0.15, 0.28), x, -1.08, 0), part: ROBOT_PART.legs, weight: 0.95, brightness: 0.9 },
      { geometry: placed(sphere(0.16), x, -1.33, 0.02), part: ROBOT_PART.legs, weight: 1.2, brightness: 1 },
      { geometry: placed(capsule(0.14, 0.3), x, -1.62, 0.02), part: ROBOT_PART.legs, weight: 0.95, brightness: 0.9 },
      { geometry: placed(rbox(0.38, 0.2, 0.55, 0.08), x, -1.98, 0.1), part: ROBOT_PART.legs, weight: 1.5, brightness: 1.05 },
    );
  }
  return list;
}

function area(g: THREE.BufferGeometry): number {
  const ng = g.index ? g.toNonIndexed() : g;
  const p = ng.getAttribute("position").array as ArrayLike<number>;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let sum = 0;
  for (let i = 0; i < p.length; i += 9) {
    a.set(p[i], p[i + 1], p[i + 2]);
    b.set(p[i + 3], p[i + 4], p[i + 5]);
    c.set(p[i + 6], p[i + 7], p[i + 8]);
    sum += b.sub(a).cross(c.sub(a)).length() / 2;
  }
  if (ng !== g) ng.dispose();
  return sum;
}

function onScreen(x: number, y: number, z: number): boolean {
  return z > FACE_Z - 0.12 && Math.abs(x) < SCREEN.halfW && Math.abs(y - HEAD_Y) < SCREEN.halfH;
}

export interface RobotParticles {
  positions: Float32Array;
  normals: Float32Array;
  parts: Float32Array;
  brightness: Float32Array;
  count: number;
}

/** Samples the robot into `count` particles with normals and body-part ids. */
export function generateRobotParticles(count: number, seed = 42): RobotParticles {
  const rand: Rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const parts = new Float32Array(count);
  const brightness = new Float32Array(count);
  let w = 0;
  const put = (x: number, y: number, z: number, nx: number, ny: number, nz: number, part: number, b: number) => {
    if (w >= count) return;
    positions.set([x, y, z], w * 3);
    normals.set([nx, ny, nz], w * 3);
    parts[w] = part;
    brightness[w] = b;
    w++;
  };

  // Fixed shares for the features that make it read as a robot.
  const eyeCount = Math.floor(count * 0.035);
  const frameCount = Math.floor(count * 0.06);
  const chestCount = Math.floor(count * 0.01);

  // Eyes: two filled discs just in front of the screen.
  for (let i = 0; i < eyeCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const a = rand() * Math.PI * 2;
    const r = EYES.radius * Math.sqrt(rand());
    put(side * EYES.x + Math.cos(a) * r, EYES.y + Math.sin(a) * r, FACE_Z + 0.03, 0, 0, 1, ROBOT_PART.eyes, 1);
  }
  // Screen frame: a rounded-rectangle outline around the face display,
  // sampled evenly along its length.
  const { halfW, halfH, radius } = SCREEN;
  const frame = new THREE.Shape();
  frame.moveTo(-halfW + radius, halfH);
  frame.lineTo(halfW - radius, halfH);
  frame.absarc(halfW - radius, halfH - radius, radius, Math.PI / 2, 0, true);
  frame.lineTo(halfW, -halfH + radius);
  frame.absarc(halfW - radius, -halfH + radius, radius, 0, -Math.PI / 2, true);
  frame.lineTo(-halfW + radius, -halfH);
  frame.absarc(-halfW + radius, -halfH + radius, radius, -Math.PI / 2, -Math.PI, true);
  frame.lineTo(-halfW, halfH - radius);
  frame.absarc(-halfW + radius, halfH - radius, radius, Math.PI, Math.PI / 2, true);
  const outline = frame.getSpacedPoints(600);
  for (let i = 0; i < frameCount; i++) {
    const f = rand() * (outline.length - 1);
    const a = outline[Math.floor(f)];
    const b = outline[Math.min(Math.floor(f) + 1, outline.length - 1)];
    const t = f - Math.floor(f);
    const j = 0.014;
    put(
      a.x + (b.x - a.x) * t + (rand() - 0.5) * j,
      HEAD_Y + a.y + (b.y - a.y) * t + (rand() - 0.5) * j,
      FACE_Z + 0.01,
      0, 0, 1,
      ROBOT_PART.head,
      1.15,
    );
  }
  // Chest lights: three small dots.
  for (let i = 0; i < chestCount; i++) {
    const k = i % 3;
    const a = rand() * Math.PI * 2;
    const r = 0.035 * Math.sqrt(rand());
    put(-0.13 + k * 0.13 + Math.cos(a) * r, 0.36 + Math.sin(a) * r, 0.44, 0, 0, 1, ROBOT_PART.torso, 1.3);
  }

  // Surfaces: the rest, shared by area × density weight.
  const list = pieces();
  const weights = list.map((p) => area(p.geometry) * p.weight);
  const total = weights.reduce((s, x) => s + x, 0);
  const remaining = count - w;
  const pos = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  list.forEach((piece, idx) => {
    const n = idx === list.length - 1 ? count - w : Math.round((remaining * weights[idx]) / total);
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(piece.geometry)) as MeshSurfaceSampler & {
      setRandomGenerator(r: () => number): MeshSurfaceSampler;
    };
    sampler.setRandomGenerator(rand);
    sampler.build();
    let made = 0;
    let guard = 0;
    while (made < n && guard < n * 20) {
      guard++;
      sampler.sample(pos, nrm);
      // The face display stays dark: only a faint scatter of glass points.
      if (piece.maskScreen && onScreen(pos.x, pos.y, pos.z) && rand() > 0.06) continue;
      put(pos.x, pos.y, pos.z, nrm.x, nrm.y, nrm.z, piece.part, piece.brightness);
      made++;
    }
    piece.geometry.dispose();
  });
  // Safety: fill any rounding gap by repeating existing particles.
  while (w < count) {
    const j = Math.floor(rand() * Math.max(w, 1));
    put(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2], normals[j * 3], normals[j * 3 + 1], normals[j * 3 + 2], parts[j], brightness[j]);
  }
  return { positions, normals, parts, brightness, count };
}
