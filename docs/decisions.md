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

rocket → sphere → Services (radial dotted ring) → Staffing (a network
globe) → Why us (segmented block ring) → How we work (four-stage path).

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
globe and the path face the reader.

**Phones.** Once the band is pinned (`data-stuck`), it turns opaque so text
scrolling beneath it is hidden. The layer then moves above the page (`z-20`)
with a `clip-path` matching the band. Before that, the band is see-through
and the layer stays behind. The hero form sits at the band's centre, so
nothing jumps at the handoff.

### How We Work: stepped process

The final form (the process path) lights up step by step as the visitor
scrolls the four steps (Discover, Plan, Deliver, Support).

- **Text.** `ProcessProgress` gives each step a ScrollTrigger that scrubs
  0→1 while the step passes 58% of the viewport. The sum (0 = Discover
  active … 4 = all done) goes into the shared `lib/processProgress.ts`. Steps
  get `data-state` (`inactive` / `active` / `completed`), which drives the
  styling: dimmed, full emphasis with the accent number, or ✓. This works
  with or without WebGL.
- **Particles.** `annotateProcessStages` gives every particle of the process
  form an `aStage = (stage, isNode)` attribute:
  - node particles get the node index;
  - path particles get their position along the process in stage units.

  The shader reads `uStage`:
  - *Upcoming nodes:* dim.
  - *The active node:* brighter, slightly larger, with gentle movement.
  - *Completed nodes:* steady and a little brighter.
  - *The path:* lights up behind a bright moving front, the stream of
    particles travelling between stages.

  `uStageMix` fades these effects in only as the process form lands, so
  earlier forms are unaffected.

### Presentation layer

These are enhancements on top of the journey. None of them change the forms
or the morph.

- **Ambient star field** (`StarField`, `lib/particles/stars.ts`,
  `shaders/stars.vert.glsl`). It is a second `THREE.Points` in the same
  canvas: white/off-white points spread through real depth (z −2.5 … −26,
  mostly far).
  - Far points are dim; near ones are slightly larger and move more.
  - It drifts very slowly, and shifts a little with the eased pointer.
  - It brightens slightly while the main particles are scattered. The main
    system reports this `field` amount every frame through `onBlend`.
- **Camera** (`CameraRig` in `JourneyScene`). It drifts a tiny amount with the
  pointer and eases back a little while particles are scattered. It is off
  with reduced motion and halved on phones.
- **Alternating composition** (desktop). The story anchor spans the whole
  story area. Each section takes 52% of the width on the side opposite its
  particles (`storySectionClass(side)`). The particles glide between the
  left and right slots during each transition (`LayoutState.sides`,
  `STORY_SIDES`):

  | Section | Particles |
  |---|---|
  | Services | Right |
  | Staffing | Left |
  | Why us | Right |
  | How we work | Left |

  Phones and tablets (below `lg`) keep the band. The band detection now uses
  the layout breakpoint instead of the device tier, which fixes tablets.
- **Content choreography** (`StoryChoreography`). Any `[data-reveal="n"]`
  inside the story is animated:
  - *Order:* label 0, heading 1, text 2, content 3 and up. Higher orders
    start slightly later.
  - *Enter:* a 18–26px rise, plus a 6px blur clearing on the header items.
  - *Exit:* a slight drift up, fading to 12% opacity.

  Everything is scrubbed and reverses. Reduced motion gets a fade-in only.

### About Us: particle orbit

About has no character figure; it uses abstract geometry instead. A large 3D
orbital ring of particles (`lib/particles/orbit.ts`, `shaders/orbit.vert.glsl`,
`components/orbit/ParticleOrbit.tsx`) sits in the same journey canvas, over the
empty `[data-orbit-anchor]` slot.

- **Shape.** A slightly organic ring: uneven density around it, gentle
  warps out of its plane, and a soft halo.
- **Motion.**
  - Particles travel slowly around the ring; about 6% move faster.
  - A rare few (0.4%) leave the ring toward the viewer, grow and brighten,
    then return.
  - The whole ring drifts slightly.
- **Pointer.** Slight tilt, parallax and a ripple. It never follows the
  cursor.
- **Entrance.** Scroll-scrubbed: particles gather from deep in space into the
  ring.
- **Colour.** Mostly white/off-white, with about 7% tinted in the rocket
  accents.
- **Counts.** 16k desktop / 11k tablet / 7k mobile. All tunables are in
  `ORBIT_CONFIG`.

About is transparent, so the orbit and star field show through. The journey
layer stays on until About has scrolled past.

### How We Work (current version)

- **Shape.** The process form is a straight particle path (`forms/process.ts`):
  a dotted spine, a soft stream, two faint parallel rails, and exactly four
  checkpoints (a small dense core plus a thin ring).
- **Scroll.** A single ScrollTrigger over the pinned `[data-process-track]`
  scrubs progress 0→4 (`ProcessProgress`). It drives:
  - the 01–04 index states (`data-state`);
  - one step panel at a time on the right, crossing over at each checkpoint:
    the old panel drifts left and fades, the new one comes in from the right,
    staggered number → title → text;
  - the particles (`lib/processProgress`).
- **Shader.**
  - Active checkpoints grow about 15% around their own centre (the
    `aStageCenter` attribute).
  - A small brightness and size wave passes through a checkpoint as it is
    reached.
  - The stream front carries energy only between checkpoints and settles at
    the end.
  - Accents use the rocket orange (`uAccent`).

### Space

- **Background.** The page background is the dark environment throughout.
  Section panels and colour glows were removed (the contact card no longer
  has glow blobs).
- **Stars.** The star field is denser in the distance, and has two
  "travellers". They alternate, so at most one is visible at a time: every
  ~26s it drifts in from depth, passes by and recedes.

### Engine

**`lib/particles/`** (independent of site content)

| File | Role |
|---|---|
| `generateRocketParticles.ts` | Rocket from Lathe (ogive nose), Cylinder (body, nozzle), Extrude (4 fins), Sphere/Torus (porthole) + a volume exhaust plume; also its per-part colours |
| `forms/*.ts` | `services`, `globe` (dotted continents from a noise land-mask on a lat/long dot grid, inside a geodesic network cage), `segmentedRing`, `process` |
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
