# Decisions

## Stack (from the modernization plan, section 03)

Next.js App Router + TypeScript + Tailwind CSS v4 + shadcn/ui. Hosting (AWS
Amplify), analytics and Terraform are not set up yet — `infrastructure/` will be
added when hosting is decided. The portal is a separate application and must not
live in this repo (plan, section 02).

## Page rendering

Everything is a Server Component except:

- `components/journey/*` and `components/particles/*` — WebGL needs the browser
- `components/sections/LogoMarquee.tsx` — hover detection on the moving strip
- `components/layout/HeaderShell.tsx` — solid header after scrolling
- `components/layout/MobileMenu.tsx` — open/close state

The homepage is statically prerendered. The hero `h1`, copy and CTAs are plain
server-rendered HTML, so SEO does not depend on the 3D scene.

## Particle journey (3D)

One particle system runs from the top of the page to the How We Work
section. The same ~60k particles physically morph through six forms and stop
on the last one:

rocket → sphere → Services (radial dotted ring) → Staffing (a wireframe
hand holding a globe) → Why us (segmented block ring) → How we work (four-stage path).

They never fade: every particle breaks away, scatters, drifts, curves back and
reassembles. Each particle keeps the rocket's colour (orange / blue / white)
through every form.

**Layer.** `JourneyLayer` is a fixed, full-screen layer (`z-0`) behind the
page. `main` is `z-10`.

- The hero, the client strip and the story sections are transparent, so the
  particles show through.
- Everything after the story is opaque, so it slides over the particles like
  a curtain. Past the story, the layer hides and rendering stops.

**Loading.** `JourneyLayer` loads `JourneyScene` with `next/dynamic` and
`ssr: false`. `ssr: false` must live in a Client Component in the App Router.
three.js never runs on the server; all page text is normal SSR HTML.

**No WebGL.** `ParticleCanvas` checks for WebGL first, and
`SceneErrorBoundary` catches any other failure. Only the particles are dropped —
without this, a WebGL error takes down the whole page.

### Scroll → form position

There is one scrubbed ScrollTrigger per transition (five). Their 0→1 values
add up to a form position, from 0 (rocket) to 5 (process). It is reversible,
and it holds wherever the visitor stops.

| Transition | Runs while |
|---|---|
| Rocket → sphere | The hero is pinned (18–82% of its extra 180vh) |
| Sphere → Services | The Services section arrives (top 96% → 18%; phones 100% → 50%) |
| Each later form | Its section's top moves from 96% to 14% of the viewport |

Each story section is at least one screen tall on desktop, so every form
holds before the next one starts.

### Handoff: hero → story

During sphere → Services, the system glides from its hero placement to the
story slot. `ParticleStory` renders an empty, sticky
`[data-story-anchor]` for it:

- *Desktop:* the right column.
- *Phones:* a band under the header.

`JourneyScene` measures the anchor and converts pixels to world units. Look
values blend across the same transition, from `HERO_LOOK` to `STORY_LOOK`:
point size, noise, curve, pointer strength, tilt and bloom. The hero's spin
slows and settles on a full turn, and a gentle sway takes over, so the
hand-and-globe and the path face the reader.

**Phones.** Once the band is pinned (`data-stuck`), it turns opaque so text
scrolling beneath it is hidden. The layer then moves above the page (`z-20`)
with a `clip-path` matching the band. Before that, the band is see-through
and the layer stays behind. The hero form sits at the band's centre, so
nothing jumps at the handoff.

### Engine

**`lib/particles/`** (independent of site content)

| File | Role |
|---|---|
| `generateRocketParticles.ts` | Rocket from Lathe (ogive nose), Cylinder (body, nozzle), Extrude (4 fins), Sphere/Torus (porthole) + a volume exhaust plume; also its per-part colours |
| `forms/*.ts` | `services`, `globeHand` (open hand under a globe: dotted continents from a noise land-mask on a lat/long dot grid, geodesic network cage, low-poly wireframe hand), `segmentedRing`, `process` |
| `geometryToParticles.ts` | `geometryToParticlePositions` (area-weighted surface sampling, seeded), `geometryEdgesToParticlePositions` (points along triangle edges → wireframe look), merge/transform helpers |
| `generateTarget.ts` | `FORMS` registry, `alignByHeight`, colours (`colorsForSequence`, `monochromeColors`) |
| `stars.ts`, `palette.ts`, `random.ts` | Background stars, colours, seeded PRNG |

**`components/particles/`**

- `ParticleSystem` — one `THREE.Points` plus shader, with look blending.
- `ParticleCanvas` — camera and bloom.
- `MorphController` — `resolveFormPosition`, plus attribute swaps.
- `hooks.ts` — device tier, reduced motion, pointer.
- `StarField` and `SceneErrorBoundary`.

**`components/journey/`**

- `journey-config.ts` — forms, looks, transitions, tiers. All tuning is here.
- `JourneyScene`, `JourneyLayer`.
- `layout.ts` — the hero pinned height, kept free of three.js for server use.

**Adding a form:** add a generator to `FORMS`, list it in `JOURNEY_FORMS`, and
add a section with `data-story-section` inside `ParticleStory` to own it.

**Shared particle order.** Every form is sorted by height (with jitter), so
particle *i* sits at a similar height in each form. Colours are fixed per
particle, so the rocket's orange plume ends up low in every later form and
its blue nose high. The viewer can follow the material.

**GPU side** (`shaders/particle.vert.glsl`). Attributes: `position` (current
form), `aTarget` (next form), `aColor`, `aRandom`, `aDelay`, `aScatterDir`,
`aScatterDistance`, `aNoiseOffset`, `aScale`. JavaScript drives one number,
`uProgress` (0..1). The shader turns it into each particle's own progress:

- *Departure:* staggered over `[0, 0.48]`, with clumps peeling off together.
- *Field:* `0.48–0.52` — everything is out in the field.
- *Arrival:* staggered over `[0.52, 1]`.
- *Flight paths:* `mix(start, end, easeInOutCubic(p))` plus a sideways
  `sin(πp)` offset, so particles curve.
- *Noise:* high in flight, tiny at rest, so particles "lock" into place.

At `uProgress` 0 a particle is exactly at A, and at 1 exactly at B.
`MorphController` swaps form data into `position` / `aTarget` only when the
pair changes, at a boundary where both look identical — so the swap is
invisible.

**Per-frame work.** `useFrame` only sets a few uniforms and transforms. There
is no React state per frame and no per-particle JavaScript. Pointer, scroll
and layout live in refs.

**Quality tiers** (`journey-config.ts`)

| Tier | Particles | DPR cap | Scatter |
|---|---|---|---|
| Desktop | 60k | 2 | 1× |
| Tablet | 34k | 1.75 | 0.85× |
| Mobile | 18k | 1.5 | 0.7× |

Bloom also drops per tier.

**Reduced motion.** Noise, rotation and wobble drop to 15%. Scatter drops to
35% and curves to 20%, so a transition is a gentle cloud. The pointer push is
disabled.

**Cleanup.** Geometry and materials are disposed on unmount. The
EffectComposer disposes its own passes. The layer's inline styles are reset.

**Known noise.** three r0.186 logs a `THREE.Clock` deprecation warning. It
comes from inside React Three Fiber, not from our code.

## Content

All copy is in `content/site.ts` and is placeholder text. Client logos,
testimonials, contact details and any figures need business approval before
launch.
