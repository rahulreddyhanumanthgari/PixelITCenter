import * as THREE from "three";
import { geometryToParticlePositions } from "./geometryToParticles";
import { mulberry32, smoothstep } from "./random";
import { PALETTE_LINEAR, pushColor } from "./palette";

// Rocket anatomy in model units, built upright along +Y and then shifted so
// the whole silhouette (plume included) is centred on the origin.
const BODY = { bottom: -1.2, top: 1.2, radiusTop: 0.5, radiusBottom: 0.56 };
const NOSE = { height: 1.35 };
const WINDOW = { y: 0.5, radius: 0.2 };
const NOZZLE = { height: 0.34, radiusTop: 0.3, radiusBottom: 0.42 };
const PLUME = { length: 1.5, radius: 0.36 };
const Y_SHIFT = 0.25;

const NOZZLE_BOTTOM = BODY.bottom - NOZZLE.height;
const FIN_OUTER = 1.18;

/** Share of particles given to each part (sums to 1). */
const SHARES = {
  body: 0.33,
  nose: 0.16,
  window: 0.05,
  fins: 0.18,
  nozzle: 0.06,
  plume: 0.22,
} as const;

function noseGeometry(): THREE.BufferGeometry {
  // Ogive profile: full body radius at the base, curving to a point.
  const pts: THREE.Vector2[] = [];
  const steps = 32;
  for (let k = 0; k <= steps; k++) {
    const s = k / steps;
    const r = BODY.radiusTop * Math.pow(Math.cos((s * Math.PI) / 2), 0.75);
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), BODY.top + NOSE.height * s));
  }
  return new THREE.LatheGeometry(pts, 64);
}

function windowGeometry(): THREE.BufferGeometry {
  // A shallow dome plus a rim, on the front (+Z) of the body.
  const dome = new THREE.SphereGeometry(WINDOW.radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.rotateX(Math.PI / 2);
  dome.scale(1, 1, 0.45);
  const rim = new THREE.TorusGeometry(WINDOW.radius + 0.03, 0.028, 8, 48);
  const z = (BODY.radiusTop + BODY.radiusBottom) / 2 - 0.02;
  dome.translate(0, WINDOW.y, z);
  rim.translate(0, WINDOW.y, z + 0.01);
  const merged = mergeTwo(dome, rim);
  dome.dispose();
  rim.dispose();
  return merged;
}

function finGeometry(angle: number): THREE.BufferGeometry {
  // Swept fin in the (radial, y) plane, attached along the lower body.
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.3);
  shape.lineTo(FIN_OUTER - BODY.radiusBottom, -0.95);
  shape.lineTo(FIN_OUTER - BODY.radiusBottom, -1.45);
  shape.lineTo(0, -1.2);
  shape.closePath();
  const fin = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false });
  fin.translate(BODY.radiusBottom - 0.02, 0, -0.025);
  fin.rotateY(angle);
  return fin;
}

/** Joins two non-indexed position-only geometries. */
function mergeTwo(a: THREE.BufferGeometry, b: THREE.BufferGeometry): THREE.BufferGeometry {
  const pa = (a.index ? a.toNonIndexed() : a).getAttribute("position").array as Float32Array;
  const pb = (b.index ? b.toNonIndexed() : b).getAttribute("position").array as Float32Array;
  const merged = new Float32Array(pa.length + pb.length);
  merged.set(pa, 0);
  merged.set(pb, pa.length);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(merged, 3));
  return g;
}

/**
 * A recognisable 3D rocket made only of points: ogive nose, cylindrical body,
 * porthole, four swept fins, engine nozzle and an exhaust plume.
 */
export function generateRocketParticles(count: number, seed = 11): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);

  const counts = {
    body: Math.floor(count * SHARES.body),
    nose: Math.floor(count * SHARES.nose),
    window: Math.floor(count * SHARES.window),
    fins: Math.floor(count * SHARES.fins),
    nozzle: Math.floor(count * SHARES.nozzle),
    plume: 0,
  };
  counts.plume = count - (counts.body + counts.nose + counts.window + counts.fins + counts.nozzle);

  let offset = 0;
  const sample = (geometry: THREE.BufferGeometry, n: number) => {
    geometryToParticlePositions(geometry, n, rand, out, offset);
    offset += n;
    geometry.dispose();
  };

  const body = new THREE.CylinderGeometry(
    BODY.radiusTop,
    BODY.radiusBottom,
    BODY.top - BODY.bottom,
    64,
    1,
    true,
  );
  sample(body, counts.body);
  sample(noseGeometry(), counts.nose);
  sample(windowGeometry(), counts.window);

  // Split fin particles evenly across four fins at 45° so the porthole is clear.
  const perFin = Math.floor(counts.fins / 4);
  for (let f = 0; f < 4; f++) {
    const n = f === 3 ? counts.fins - perFin * 3 : perFin;
    sample(finGeometry(Math.PI / 4 + (f * Math.PI) / 2), n);
  }

  const nozzle = new THREE.CylinderGeometry(
    NOZZLE.radiusTop,
    NOZZLE.radiusBottom,
    NOZZLE.height,
    48,
    1,
    true,
  );
  nozzle.translate(0, BODY.bottom - NOZZLE.height / 2, 0);
  sample(nozzle, counts.nozzle);

  // Exhaust plume: a volume of points, densest right under the nozzle.
  for (let i = 0; i < counts.plume; i++) {
    const t = Math.pow(rand(), 1.7);
    const maxR = PLUME.radius * (1 - t * 0.75);
    const r = maxR * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    const j = (offset + i) * 3;
    out[j] = Math.cos(a) * r;
    out[j + 1] = NOZZLE_BOTTOM - t * PLUME.length;
    out[j + 2] = Math.sin(a) * r;
  }

  for (let i = 0; i < count; i++) out[i * 3 + 1] += Y_SHIFT;
  return out;
}

/**
 * Colours for particles laid out as a rocket: blue/white nose, bright white
 * porthole, warm orange body with a white-lit side, blue fins, glowing plume.
 * Classification is by position, so it works on any ordering of the points.
 */
export function colorRocketParticles(positions: Float32Array, seed = 5): Float32Array {
  const rand = mulberry32(seed);
  const count = positions.length / 3;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  const tmp = new THREE.Color();
  const { orange, gold, white, blue, deepBlue } = PALETTE_LINEAR;
  const windowZ = BODY.radiusTop;

  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1] - Y_SHIFT;
    const z = positions[i * 3 + 2];
    const radius = Math.hypot(x, z);
    let brightness = 1;

    if (y < NOZZLE_BOTTOM - 0.01) {
      // Plume: white-gold near the nozzle cooling to orange at the tail.
      const hot = 1 - smoothstep(0, PLUME.length, NOZZLE_BOTTOM - y);
      c.copy(orange).lerp(gold, 0.3 + hot * 0.5).lerp(white, hot * hot * 0.55);
      brightness = 0.9 + hot * 0.9;
    } else if (y < BODY.bottom) {
      c.copy(orange).lerp(deepBlue, 0.25 * rand());
      brightness = 0.8;
    } else if (radius > BODY.radiusBottom + 0.05) {
      // Fins: cool blues, a little brighter towards the tips.
      c.copy(blue).lerp(deepBlue, rand() * 0.6).lerp(white, rand() < 0.08 ? 0.6 : 0);
      brightness = 0.8 + smoothstep(BODY.radiusBottom, FIN_OUTER, radius) * 0.4;
    } else if (Math.hypot(x, y - WINDOW.y) < WINDOW.radius + 0.07 && z > windowZ * 0.6) {
      c.copy(white).lerp(blue, rand() * 0.25);
      brightness = 1.5;
    } else if (y > BODY.top) {
      c.copy(white).lerp(blue, 0.35 + rand() * 0.45);
      brightness = 1.05;
    } else {
      // Body: warm, with a lit side facing +X so the cylinder reads as 3D.
      const lit = smoothstep(0.1, 1, x / Math.max(radius, 0.001));
      c.copy(orange).lerp(gold, rand() * 0.6);
      tmp.copy(white);
      c.lerp(tmp, lit * 0.6);
      if (rand() < 0.1) c.lerp(blue, 0.7);
    }

    const sparkle = rand();
    brightness *= sparkle > 0.97 ? 1.7 : sparkle < 0.22 ? 0.5 : 0.8 + rand() * 0.3;
    pushColor(colors, i, c, brightness);
  }
  return colors;
}
