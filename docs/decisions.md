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

**No WebGL.** `ParticleCanvas` checks for WebGL before rendering, and
`SceneErrorBoundary` catches any other WebGL failure. Either way only the
canvas is dropped — without this, a WebGL error takes down the whole page.

### Particle morph

The same particles morph between forms (rocket → sphere today) as the hero
is scrolled: breakup → scatter → floating field → attraction → reassembly →
hold. They never fade — every particle physically travels.

**Engine** (`lib/particles/`, independent of site content)

| File | Role |
|---|---|
| `generateRocketParticles.ts` | Rocket from Lathe (ogive nose), Cylinder (body, nozzle), Extrude (4 fins), Sphere/Torus (porthole) + a volume exhaust plume; also its per-part colours |
| `geometryToParticles.ts` | `geometryToParticlePositions` (area-weighted surface sampling, seeded), `geometryEdgesToParticlePositions` (points along triangle edges → wireframe look), merge/transform helpers |
| `forms/*.ts` | Section story forms: `services` (radial dotted ring), `handshake`, `segmentedRing`, `process` |
| `generateTarget.ts` | `FORMS` registry, `alignByHeight`, colour schemes (`colorsForSequence`, `monochromeColors`) |
| `stars.ts`, `palette.ts`, `random.ts` | Background stars, colours, seeded PRNG |

**Shared components** (`components/particles/`): `ParticleSystem` (one
`THREE.Points` + shader, configured by a `ParticleLook`), `ParticleCanvas`
(camera, bloom, WebGL check, pauses off-screen), `MorphController`
(`resolveMorph` for hold/transition timelines, `resolveFormPosition` for a
0..N form position), `hooks.ts` (device tier, reduced motion, pointer) and
`SceneErrorBoundary`. The hero and the section story are both built from
these.

**Adding a form:** add a generator to `FORMS`, then list it in
`MORPH_SEQUENCE` (`components/hero/morph-sequence.ts`) or `STORY_FORMS`
(`components/story/story-config.ts`). The hero's pinned scroll length grows
automatically.

### Section particle story

One persistent particle system runs beside the Services, Staffing &
Consulting, Why Pixel IT Center and How We Work sections. The same particles
morph through four forms and stop on the last one:

radial dotted ring → 3D wireframe handshake → segmented block ring →
connected four-stage process path.

- **Layout** (`components/story/ParticleStory.tsx`). On desktop the sections
  sit in the left column and the canvas is sticky in the right column. On
  phones the canvas is a sticky band under the header, with the text
  scrolling beneath it. Either way, particles never sit on top of text.
- **Scroll.** There is one ScrollTrigger per transition. Each scrubs 0→1 as
  the next section's top moves from 92% to 22% of the viewport. Their sum is
  the form position (0 = Services … 3 = How we work). It is reversible, and it
  holds wherever the visitor stops.
- **Holding.** Each section is at least a screen tall on desktop, so each form
  holds before the next one assembles.
- **Look.** Monochrome white/off-white points (`monochromeColors`), with
  about 5% of particles faintly tinted with the brand orange or blue. The
  forms sway rather than spin, so the handshake always faces the reader.
  Bloom uses a high threshold and low intensity.
- **Quality tiers:**

  | Tier | Particles | DPR cap |
  |---|---|---|
  | Desktop | 55k | 2 |
  | Tablet | 30k | 1.75 |
  | Mobile | 14k | 1.5 |

  Bloom and scatter also drop per tier.
- **Two canvases.** The hero and the story each have a canvas. Only the
  visible one renders; the other is paused by IntersectionObserver.

**Shared particle order.** Every form is sorted by height (with jitter), so
particle *i* sits at a similar height in each form. Colours are fixed per
particle, taken from the first form. So the rocket's orange plume becomes the
bottom of the sphere and its blue nose the top — the viewer can follow the
material between forms.

**GPU side** (`shaders/particle.vert.glsl`). Attributes: `position` (current
form), `aTarget` (next form), `aColor`, `aRandom`, `aDelay`, `aScatterDir`,
`aScatterDistance`, `aNoiseOffset`, `aScale`. JavaScript drives one number,
`uProgress` (0..1). The shader turns it into each particle's own progress:

- *Departure:* staggered over `[0, 0.48]`. The delay blends random with a
  coarse noise field, so clumps peel off together.
- *Field:* `0.48–0.52` — everything is out in the field.
- *Arrival:* staggered over `[0.52, 1]`.
- *Flight paths:* `mix(start, end, easeInOutCubic(p))` plus a sideways offset
  of `sin(πp)`, so particles curve.
- *Noise:* high in flight, tiny at rest, so landing particles "lock" into
  place.

At `uProgress` 0 a particle is exactly at A, and at 1 exactly at B. That makes
chained forms seamless and scrubbing fully reversible.

**CPU side** (`components/hero/ParticleController.ts`).

- `resolveMorph()` maps scroll progress to *hold F0 · F0→F1 · hold F1 · …*.
  It is a pure function, so reverse scrolling retraces it exactly.
- `ParticleController` copies new form data into `position` / `aTarget` only
  when the form pair changes. That happens at a boundary where both look
  identical, so the swap is invisible.

**Scroll.** The hero section is `100svh` plus 180vh for each transition, with a
sticky inner viewport. GSAP ScrollTrigger scrubs 0→1 across it (start
`top top`, end `bottom bottom`). `useFrame` eases it once more before feeding
the controller.

**Per-frame work.** `useFrame` only updates a handful of uniforms and
rotations. There is no React state per frame, and no per-particle JavaScript.
The pointer and scroll values live in refs.

**Interaction.** The pointer is tracked on `window`, because the HTML layer
covers the canvas. It is eased and drives tilt, parallax and a local push.
It never drives the morph.

**Performance.**
- *Desktop:* 60k particles.
- *Mobile tier* (width < 768, or a coarse pointer on a ≤ 4-core device):
  18k particles, scatter at 0.7×, weaker bloom, and DPR capped at 1.5.
- *Off-screen:* rendering stops (`frameloop="never"`) via IntersectionObserver.

**Reduced motion.** Noise, rotation and wobble drop to 15%. Scatter drops to
35% and curves to 20%, so the transition is a gentle cloud. The pointer push
is disabled.

**Cleanup.** Geometry and materials are disposed on unmount. The
EffectComposer disposes its own passes.

**Known noise.** three r0.186 logs a `THREE.Clock` deprecation warning. It
comes from inside React Three Fiber, not from our code.

## Content

All copy is in `content/site.ts` and is placeholder text. Client logos,
testimonials, contact details and any figures need business approval before
launch.
