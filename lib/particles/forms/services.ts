import { transformPositions } from "../geometryToParticles";
import type { Rand } from "../random";

/**
 * Services — a radial "sunburst" ring: an open centre surrounded by dotted
 * spokes of varying length, grouped into segments with gaps, drawn as crisp
 * dots (tight particle clusters) plus a little fine dust for depth.
 */
const SHAPE = {
  innerRadius: 0.95,
  maxSpoke: 1.25,
  minSpoke: 0.25,
  slots: 150,
  dotSpacing: 0.075,
  /** Spokes are drawn as 1–3 parallel dotted lines this far apart. */
  laneGap: 0.034,
  dotJitter: 0.011,
  dustShare: 0.1,
  depth: 0.28,
} as const;

interface Dot {
  x: number;
  y: number;
  z: number;
}

export function generateServicesParticles(count: number, rand: Rand): Float32Array {
  const dots: Dot[] = [];
  const TAU = Math.PI * 2;

  // Segments: runs of 6–14 spokes separated by 1–3 empty slots.
  let slot = 0;
  let segmentLeft = 0;
  let segmentLength = 1;
  let segmentBias = 0;
  while (slot < SHAPE.slots) {
    if (segmentLeft === 0) {
      slot += 1 + Math.floor(rand() * 3);
      segmentLength = segmentLeft = 6 + Math.floor(rand() * 9);
      segmentBias = rand();
      continue;
    }
    const theta = (slot / SHAPE.slots) * TAU;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // Spoke length: a smooth swell across the segment plus per-spoke jitter.
    const along = 1 - Math.abs((segmentLeft - segmentLength / 2) / (segmentLength / 2));
    const length =
      SHAPE.minSpoke +
      (SHAPE.maxSpoke - SHAPE.minSpoke) * Math.min(1, 0.35 * segmentBias + 0.45 * along + 0.35 * rand());
    const lanes = 1 + Math.floor(rand() * 3);
    // Some spokes start a little further out, giving a ragged inner edge.
    const start = SHAPE.innerRadius + (rand() < 0.3 ? rand() * 0.18 : 0);
    const spokeZ = (rand() - 0.5) * 0.12;

    for (let lane = 0; lane < lanes; lane++) {
      const side = (lane - (lanes - 1) / 2) * SHAPE.laneGap;
      const laneLength = length * (0.75 + rand() * 0.25);
      for (let r = start; r < start + laneLength; r += SHAPE.dotSpacing) {
        // Occasional missing dots break the lines up like the reference.
        if (rand() < 0.08) continue;
        const x = cos * r - sin * side;
        const y = sin * r + cos * side;
        // Gentle dish: the outer rim sits slightly forward of the centre.
        const z = spokeZ + ((r - SHAPE.innerRadius) / SHAPE.maxSpoke) * SHAPE.depth;
        dots.push({ x, y, z });
      }
    }
    slot += 1;
    segmentLeft -= 1;
  }

  const out = new Float32Array(count * 3);
  const dotParticles = Math.floor(count * (1 - SHAPE.dustShare));
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    if (i < dotParticles) {
      const d = dots[i % dots.length];
      out[j] = d.x + (rand() - 0.5) * SHAPE.dotJitter * 2;
      out[j + 1] = d.y + (rand() - 0.5) * SHAPE.dotJitter * 2;
      out[j + 2] = d.z + (rand() - 0.5) * SHAPE.dotJitter * 2;
    } else {
      // Fine dust through the ring volume.
      const theta = rand() * TAU;
      const r = SHAPE.innerRadius + Math.pow(rand(), 1.4) * SHAPE.maxSpoke;
      out[j] = Math.cos(theta) * r;
      out[j + 1] = Math.sin(theta) * r;
      out[j + 2] = (rand() - 0.5) * 0.35 + ((r - SHAPE.innerRadius) / SHAPE.maxSpoke) * SHAPE.depth;
    }
  }
  // Face the viewer, tipped back a little so the depth reads.
  return transformPositions(out, [-0.35, 0.3, 0]);
}
