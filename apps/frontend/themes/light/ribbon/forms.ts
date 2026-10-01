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
    return [rx * Math.cos(a), -0.74 * H + ry * Math.sin(a), 0.6 * Math.sin(Math.PI * u)];
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
  radius: (W, H, wide) => (wide ? Math.min(0.13 * H, 0.09 * W) : 0.1 * W),
};

/** Contact: a deep spiral "eye", winding from beyond the screen into a tunnel. */
const eye: Form = {
  at(u, W, H) {
    const a = 0.3 + 2.5 * TAU * u;
    const r = Math.max(W, H) * (0.8 - 0.38 * Math.pow(u, 0.8)); // the eye stays open round the text
    return [r * Math.cos(a), r * 0.85 * Math.sin(a) + 0.02 * H, -9 * u];
  },
  radius: (W, H) => Math.min(0.1 * H, 0.08 * W),
};

/**
 * In page order. Anchors (see RibbonScene) pick the section each form
 * belongs to: hero, Services, Staffing, Why, How we work, About, Contact.
 */
export const FORMS: Form[] = [arch, columnRight, orbit, spineLeft, behindProcess, aboutColumn, eye];

/** Index of the Contact eye (its glass sphere shows with it). */
export const EYE = FORMS.length - 1;
