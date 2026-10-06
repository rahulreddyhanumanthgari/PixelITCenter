import { mulberry32 } from "../random";

/**
 * Light theme hero (the "landing page" reference): the vortex traced from the
 * reference image, cube by cube (scripts in docs/decisions.md). The file
 * holds every cube's place, size and colour in reference pixels (1672x941).
 *
 * Local units: 1 = 480 reference px (the vortex's outer radius), origin at
 * the vortex centre (1170, 470), y up. JourneyScene places and sizes it.
 */
export const VORTEX_URL = "/light/hero-vortex.bin";
export const VORTEX_REF = {
  width: 1672,
  height: 941,
  cx: 1170,
  cy: 470,
  unit: 480,
} as const;

export interface VortexData {
  count: number;
  x: Float32Array;
  y: Float32Array;
  size: Float32Array;
  tall: Float32Array;
  color: Float32Array;
  accent: Uint8Array;
}

export async function loadLightVortex(): Promise<VortexData> {
  const res = await fetch(VORTEX_URL);
  if (!res.ok) throw new Error(`vortex ${res.status}`);
  const view = new DataView(await res.arrayBuffer());
  const count = view.getUint16(0, true);
  const paletteCount = view.getUint8(2);
  const palette = new Float32Array(paletteCount * 3);
  for (let i = 0; i < paletteCount * 3; i++)
    palette[i] = view.getUint8(3 + i) / 255;
  const data: VortexData = {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    size: new Float32Array(count),
    tall: new Float32Array(count),
    color: new Float32Array(count * 3),
    accent: new Uint8Array(count),
  };
  let o = 3 + paletteCount * 3;
  for (let i = 0; i < count; i++, o += 8) {
    data.x[i] = view.getUint16(o, true) / 32;
    data.y[i] = view.getUint16(o + 2, true) / 32;
    data.size[i] = view.getUint8(o + 4) / 10;
    data.tall[i] = view.getUint8(o + 5) / 50;
    const c = view.getUint8(o + 6) * 3;
    data.color.set(palette.subarray(c, c + 3), i * 3);
    data.accent[i] = view.getUint8(o + 7);
  }
  return data;
}

export interface VortexForm {
  /** xyz per particle, local units, sorted by height like every other form. */
  positions: Float32Array;
  /** sRGB colour per particle. */
  color: Float32Array;
  /** [width (local units), height / width, accent] per particle. */
  shape: Float32Array;
}

/**
 * The traced cubes as a form for `count` particles. Fewer particles (phones):
 * a random share, cubes enlarged to keep the coverage. More: the spare
 * particles sit hidden (size 0) inside random cubes.
 */
export function buildLightVortexForm(
  data: VortexData,
  count: number,
  seed = 7,
): VortexForm {
  const rand = mulberry32(seed);
  const n = data.count;
  const picks = new Int32Array(count);
  let grow = 1;
  if (count >= n) {
    for (let i = 0; i < count; i++)
      picks[i] = i < n ? i : -1 - Math.floor(rand() * n);
  } else {
    // Keep every accent, then a random share of the rest.
    const order: number[] = [];
    const rest: number[] = [];
    for (let i = 0; i < n; i++) (data.accent[i] ? order : rest).push(i);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    const take = count - order.length;
    for (let i = 0; i < count; i++)
      picks[i] = i < order.length ? order[i] : rest[i - order.length];
    grow = Math.min(Math.sqrt(rest.length / Math.max(take, 1)), 2.2);
  }

  const { cx, cy, unit } = VORTEX_REF;
  const positions = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const shape = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const hidden = picks[i] < 0;
    const k = hidden ? -1 - picks[i] : picks[i];
    const accent = data.accent[k] === 1;
    positions[i * 3] = (data.x[k] - cx) / unit;
    positions[i * 3 + 1] = -(data.y[k] - cy) / unit;
    // Depth only orders overlaps: lower cubes are nearer, accents in front.
    positions[i * 3 + 2] = accent
      ? 0.09
      : 0.05 * ((data.y[k] - cy) / cy) + (rand() - 0.5) * 0.004;
    color.set(data.color.subarray(k * 3, k * 3 + 3), i * 3);
    shape[i * 3] = hidden ? 0 : (data.size[k] * (accent ? 1 : grow)) / unit;
    shape[i * 3 + 1] = data.tall[k];
    shape[i * 3 + 2] = accent ? 1 : 0;
  }

  // Same particle order as every other form: by height, lightly shuffled.
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    minY = Math.min(minY, positions[i * 3 + 1]);
    maxY = Math.max(maxY, positions[i * 3 + 1]);
  }
  const range = Math.max(maxY - minY, 1e-6);
  const keys = new Float32Array(count);
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    keys[i] = (positions[i * 3 + 1] - minY) / range + (rand() - 0.5) * 0.18;
    order[i] = i;
  }
  order.sort((a, b) => keys[a] - keys[b]);
  const out: VortexForm = {
    positions: new Float32Array(count * 3),
    color: new Float32Array(count * 3),
    shape: new Float32Array(count * 3),
  };
  for (let j = 0; j < count; j++) {
    const i = order[j];
    out.positions.set(positions.subarray(i * 3, i * 3 + 3), j * 3);
    out.color.set(color.subarray(i * 3, i * 3 + 3), j * 3);
    out.shape.set(shape.subarray(i * 3, i * 3 + 3), j * 3);
  }
  return out;
}
