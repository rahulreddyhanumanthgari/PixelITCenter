/**
 * The light design's one object: a blue ribbed tube (thin fins stacked along
 * a path, after the owner's reference animation). Each section holds the tube
 * in its own shape (a "form"); scrolling morphs one form into the next.
 *
 * A form maps u (0 … 1 along the tube) to a point in world units on a screen
 * of W × H world units (the camera's view at z = 0). `wide` is a landscape
 * screen; on portrait screens the shapes move to the edges so text stays
 * clear, and large shapes crop naturally.
 */

export type Vec3 = [number, number, number];

export interface Form {
  /** Point on the tube's centre line. */
  at(u: number, W: number, H: number, wide: boolean): Vec3;
  /** Tube radius (fin radius) in world units. */
  radius(W: number, H: number, wide: boolean): number;
}

const TAU = Math.PI * 2;

/** Hero: a large arch rising from below the screen under the headline. */
const arch: Form = {
  at(u, W, H, wide) {
    const a = Math.PI + 0.42 - u * (Math.PI + 0.84);
    const rx = wide ? 0.6 * W : 0.8 * W;
    const ry = wide ? 0.6 * H : 0.42 * H;
    // Low enough to clear the headline, description and buttons.
    const cy = wide ? -0.86 * H : -0.66 * H;
    return [rx * Math.cos(a), cy + ry * Math.sin(a), 0.6 * Math.sin(Math.PI * u)];
  },
  radius: (W, H, wide) => (wide ? Math.min(0.11 * H, 0.08 * W) : 0.1 * W),
};

/** Services: a tall twisting column on the right, the services on the left. */
const columnRight: Form = {
  at(u, W, H, wide) {
    const x0 = wide ? 0.3 * W : 0.5 * W;
    return [x0 + 0.05 * W * Math.sin(TAU * 0.9 * u + 0.4), (0.72 - 1.44 * u) * H, 0.9 * Math.sin(TAU * u)];
  },
  radius: (W, H, wide) => (wide ? Math.min(0.09 * H, 0.07 * W) : 0.09 * W),
};

/**
 * Staffing: an orbit ring taller than the screen, so only its two sides show,
 * framing the content like brackets; its top and bottom pass off-screen.
 */
const orbit: Form = {
  at(u, W, H, wide) {
    const a = TAU * u + Math.PI / 2; // the seam (where the fins wrap) sits off-screen at the top
    const rx = wide ? 0.5 * W : 0.56 * W;
    return [rx * Math.cos(a), 0.72 * H * Math.sin(a), -1.2 * Math.sin(a)];
  },
  radius: (W, H, wide) => (wide ? Math.min(0.06 * H, 0.05 * W) : 0.07 * W),
};

/** Why: a spine down the left. */
const spineLeft: Form = {
  at(u, W, H, wide) {
    const x0 = wide ? -0.41 * W : -0.5 * W;
    return [x0 + 0.03 * W * Math.sin(TAU * 0.7 * u + 1.2), (-0.72 + 1.44 * u) * H, 0.7 * Math.sin(TAU * 0.8 * u)];
  },
  radius: (W, H, wide) => (wide ? Math.min(0.07 * H, 0.055 * W) : 0.08 * W),
};

/**
 * How we work: the tube runs horizontally across the screen, set back in
 * depth, weaving gently behind the heading and the four steps (the steps sit
 * in front of it), then carries on down into About.
 */
const behindProcess: Form = {
  at(u, W, H, wide) {
    const sway = (wide ? 0.1 : 0.06) * H;
    return [(-0.75 + 1.5 * u) * W, 0.02 * H + sway * Math.sin(TAU * 0.9 * u + 0.4), -2.4 + 0.8 * Math.sin(TAU * 0.6 * u)];
  },
  radius: (W, H, wide) => (wide ? Math.min(0.085 * H, 0.065 * W) : 0.1 * W),
};

/**
 * About (the reference's "agency" scene): a tall column on the right that
 * bows and twists through depth, the statement on the left.
 */
const aboutColumn: Form = {
  at(u, W, H, wide) {
    const x0 = wide ? 0.27 * W : 0.46 * W;
    const y = (0.78 - 1.56 * u) * H;
    return [x0 + 0.09 * W * Math.sin(Math.PI * u) - 0.04 * W * Math.sin(TAU * u), y, 1.6 * Math.sin(Math.PI * u) - 0.6];
  },
  radius: (W, H, wide) => (wide ? Math.min(0.088 * H, 0.068 * W) : 0.085 * W),
};

/** Careers: a curving column on the left, clear of the centred Careers text. */
const careersLeft: Form = {
  at(u, W, H, wide) {
    const x0 = wide ? -0.36 * W : -0.5 * W;
    return [x0 - 0.06 * W * Math.sin(Math.PI * u), (-0.78 + 1.56 * u) * H, 1.2 * Math.sin(Math.PI * u) - 0.4];
  },
  radius: (W, H, wide) => (wide ? Math.min(0.085 * H, 0.065 * W) : 0.085 * W),
};

/**
 * What clients say: an infinity loop (long-term partnership) lying behind the row of client cards
 * (its lobes behind the outer cards, its crossing behind the middle one).
 * The cards are solid, so every quote stays readable; the loop shows round
 * them, below the heading. The two strands cross at different depths.
 */
const infinityLoop: Form = {
  at(u, W, H, wide) {
    const t = Math.PI / 2 + TAU * u; // the ends meet at the crossing, hidden behind the middle card
    const d = 1 + Math.sin(t) * Math.sin(t);
    const a = wide ? 0.62 * W : 0.7 * W;
    const x = (a * Math.cos(t)) / d;
    const y = ((a * Math.sin(t) * Math.cos(t)) / d) * (wide ? 0.36 : 0.6);
    return [x, -0.2 * H + y, -1.2 + 1.0 * Math.sin(t)];
  },
  radius: (W, H, wide) => (wide ? Math.min(0.075 * H, 0.06 * W) : 0.075 * W),
};

/**
 * Contact: a vortex. The tube winds in from beyond the screen, tightening and
 * receding, and every turn ends in the centre, where it merges into the glass
 * core (RibbonScene's sphere, at the same point).
 */
export const EYE_CORE = { y: 0.02, z: -6 };
const eye: Form = {
  at(u, W, H) {
    const a = 0.3 + 2.3 * TAU * u;
    const r = Math.max(W, H) * 0.6 * Math.pow(1 - u, 1.1);
    return [r * Math.cos(a), r * 0.85 * Math.sin(a) + EYE_CORE.y * H, EYE_CORE.z * Math.pow(u, 0.7)];
  },
  radius: (W, H) => Math.min(0.085 * H, 0.068 * W),
};

/**
 * In page order. Anchors (see RibbonScene) pick the section each form
 * belongs to: hero, Services, Staffing, Why, How we work, About, Careers,
 * What clients say, Contact.
 */
export const FORMS: Form[] = [arch, columnRight, orbit, spineLeft, behindProcess, aboutColumn, careersLeft, infinityLoop, eye];

/** Index of the Contact eye (its glass sphere shows with it). */
export const EYE = FORMS.length - 1;
