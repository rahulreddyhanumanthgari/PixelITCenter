# Decisions

## Stack (from the modernization plan, section 03)

Next.js App Router + TypeScript + Tailwind CSS v4 + shadcn/ui. Hosting (AWS
Amplify), analytics and Terraform are not set up yet — `infrastructure/` will be
added when hosting is decided. The portal is a separate application and must not
live in this repo (plan, section 02).

## Page rendering

Everything is a Server Component except:

- `components/hero/*` scene files — WebGL needs the browser
- `components/layout/HeaderShell.tsx` — solid header after scrolling
- `components/layout/MobileMenu.tsx` — open/close state

The homepage is statically prerendered. The hero `h1`, copy and CTAs are plain
server-rendered HTML, so SEO does not depend on the 3D scene.

## 3D hero

**Loading.** `HeroCanvasLoader` (client) loads `ParticleScene` with
`next/dynamic` and `ssr: false`. `ssr: false` is not allowed in Server Components
in the App Router, hence the small wrapper. three.js never runs on the server,
so there are no `window is not defined` or hydration errors.

**Rendering.** One `THREE.Points` with a `BufferGeometry` and a custom
`ShaderMaterial` — no per-particle React components or meshes.

- `geometry.ts` samples a twisted torus (ribbon cross-section, 3 half-twists)
  once per mount. It writes `position`, `aColor`, `aRandom`, `aScale` and
  `aRandomOffset`. Colours blend orange ↔ blue around the ring, with white
  highlights and a thin gold streak.
- `shaders/particle.vert.glsl` does all the motion on the GPU: simplex-noise
  flow, per-particle orbit, a breathing wave, and the pointer push. It also
  sets size by depth.
- `shaders/particle.frag.glsl` makes round, soft points using `gl_PointCoord`,
  with additive blending.
- `.glsl` files are imported as strings via `raw-loader` (turbopack rule in
  `next.config.ts`).

**Per-frame work.** `useFrame` only updates a handful of uniforms and
rotations. There is no React state per frame. The pointer and scroll values
live in refs.

**Interaction.**
- *Pointer:* tracked on `window`, because the HTML layer covers the canvas.
  It is eased toward its target, never mapped 1:1.
- *Scroll:* GSAP ScrollTrigger scrubs a 0→1 number across the hero, reverted
  on unmount.

**Performance.**
- *Mobile tier* (width < 768, or a coarse pointer on a ≤ 4-core device):
  14k particles instead of 48k, weaker bloom, and DPR capped at 1.5
  instead of 2.
- *Off-screen:* rendering stops (`frameloop="never"`) via IntersectionObserver.

**Reduced motion.** Noise, rotation, wobble and scroll movement drop to about
12%, and the pointer push is disabled.

**Cleanup.** Geometry and materials are disposed on unmount. The
EffectComposer disposes its own passes.

**Known noise.** three r0.186 logs a `THREE.Clock` deprecation warning. It
comes from inside React Three Fiber, not from our code.

## Content

All copy is in `content/site.ts` and is placeholder text. Client logos,
testimonials, contact details and any figures need business approval before
launch.
