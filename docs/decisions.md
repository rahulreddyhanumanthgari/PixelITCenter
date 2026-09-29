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
section. The same ~60k particles start as the landing hero's full-screen
gravity field, then physically morph through four forms and stop on the last
one:

hero gravity field → Services (ring of particle streams) → Staffing (a particle
Earth) → Why us (flowing particle torus) → How we work (four-stage path).

They never fade: every particle breaks away, scatters, drifts, curves back and
reassembles. Each particle keeps the rocket palette colour it has always had
(orange / blue / white, see below) through every form.

### Landing hero: black hole

There is no rocket. The whole hero viewport sits inside a black hole built
from the journey particles, with the centred content on top. The hero
section is transparent and has no panels or overlays.

- **Form 0 (`heroField`) is live motion, not a shape.** While it is the form
  being held or left (`uHeroField`), `particle.vert.glsl` replaces each
  particle's start point with its live position (`heroField()`), in units of
  the void's radius. Each particle's role follows the colour it already has,
  so orange concentrates in the disc without recolouring anything:

  | Colour | Roles |
  |---|---|
  | Orange | 68% accretion disc, 22% hot inner rim, the rest streams and outer space |
  | White | Inner rim, disc, sparse outer space |
  | Blue | Three curved log-spiral streams flowing inward from outside the disc, plus some disc and outer space |

- **The disc.** It runs from 1× to 2× the void's radius and is densest and
  brightest at its inner edge. Speeds are Kepler-like, so the inner disc
  outruns the outer.
- **Falling in.** About a third of the disc spirals from its orbit to just
  inside the void's edge, faster and tighter, then shrinks and vanishes. It
  re-enters on its orbit, never inside the core, so the void stays empty
  permanently.
- **Size.** The void's radius is the larger of 21% of the width or 30% of the
  height, capped at 45% of the width (`HERO_FIELD.voidRadius`). `HERO_LOOK`
  tips the disc back (`baseTilt` x 0.82), so it reads as an ellipse framing
  the headline.
- **Readability.** Particles projected behind `[data-hero-content]` drop to
  50% brightness (28% on phones) while the hero is showing.
- **Transition.** When Services arrives, particles break straight out of
  their orbits into the ring, and scrolling back reverses it.
- **Colours.** `heroField.colorize` gives each particle the exact colour the
  rocket used to give it, so the palette and every later form's colour
  layout are unchanged.

### Scroll → form position

There is one scrubbed ScrollTrigger per transition (four). Their 0→1 values
add up to a form position, from 0 (hero field) to 4 (process). It is
reversible, and it holds wherever the visitor stops. The hero is not pinned.

| Transition | Runs while |
|---|---|
| Hero field → Services | The Services section arrives (top 96% → 18%; phones 100% → 50%) |
| Each later form | Its section's top moves from 96% to 14% of the viewport |

Each story section is at least one screen tall on desktop, so every form
holds before the next one starts.

### Handoff: hero → story

During hero field → Services, the system glides from its hero placement to the
story slot. `ParticleStory` renders an empty, sticky
`[data-story-anchor]` for it:

- *Desktop:* the right column.
- *Phones:* a band under the header.

`JourneyScene` measures the anchor and converts pixels to world units. Look
values blend across the same transition, from `HERO_LOOK` to `STORY_LOOK`:
point size, noise, curve, pointer strength, tilt and bloom. The disc tips
from the hero's angle to face-on, so the globe and the path face the reader.

**Phones.** Once the band is pinned (`data-stuck`), it turns opaque so text
scrolling beneath it is hidden. The layer then moves above the page (`z-20`)
with a `clip-path` matching the band. Before that, the band is see-through
and the layer stays behind.

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

### About Us: gravity (same particles, different physics)

About's content is centred. Behind it, the journey's own particle language
enters a gravity well. The rule is: same appearance, different movement.

- **Same appearance.** The vortex particles
  (`lib/particles/vortex.ts`, `shaders/vortex.vert.glsl`,
  `components/vortex/ParticleVortex.tsx`) use:
  - the journey's rocket colour mix (`colorsForSequence("rocket", …)`);
  - the same size spread;
  - the same point size (`STORY_LOOK.particleSize`);
  - the same depth-fade, twinkle and alpha rules as `particle.vert.glsl`;
  - the shared `particle.frag.glsl`, canvas, camera and bloom.

  `VORTEX_CONFIG` holds only layout and motion tunables.
- **Movement.** Every particle has its own radius, speed (Kepler-like),
  phase and a slightly tilted orbit, so together they form one overlapping 3D
  field with no designed bands.
  - *Infallers (50%):* arrive from deep space behind the field and join the
    flow. They then spiral in, falling slowly and then fast, with a curve
    that tightens. They get slightly larger and brighter, then shrink and
    vanish at the centre.
  - *Continuous:* the cycle wraps, so the flow never empties.
- **The space itself bends.** The vortex reports its gravity strength and
  centre each frame (`onGravity` → `Atmosphere`). The shared star field then
  swirls around that centre, faster nearer it, and is drawn slightly inward.
  - *Strength:* scroll entrance × how centred About is on screen, so it
    eases in and relaxes as About leaves.
  - *No jumps:* the swirl angle only accumulates while gravity acts.
- **Void.** Nothing is drawn at the centre. It is dark because particles are
  consumed there.
- **Readability.** Particles projected behind `[data-about-content]` drop to
  30% brightness on wide screens and 42% on narrow ones.
- **Counts.** 26k desktop / 16k tablet / 10k mobile.

### Staffing & Consulting: particle Earth

The Staffing form (`earth`) is a dense particle Earth with real continents.

- **Continents.** `lib/particles/landMask.ts` is a 720×360 run-length land
  mask (12 KB). It was generated once from Natural Earth 1:50m land (the
  public-domain world-atlas package), with a scanline fill that unwraps
  rings across the date line.
- **Layers.** Each layer sits in its own radius band (relative to the Earth's
  radius, 1.65), so the shader can colour it:

  | Layer | Share | Radius |
  |---|---|---|
  | Land (area-weighted) | 54% | 0.998–1.002 |
  | Coastline | 17% | 1.008 |
  | Ocean | 8% | 0.99 |
  | Haze | 5% | 1.02–1.18 |
  | Dotted shell of latitude rows | Remainder | 2.35 |

- **Colour.** The Services stream's palette and brightness (`ringColor`,
  normalised hues at 1.25, times the far-side fade):

  | Layer | Colour |
  |---|---|
  | Land | Orange to red-orange |
  | Coastline | Red-orange |
  | Ocean and haze | Blue |
  | Shell | Blue to deep blue, at 0.75 |

  Plus 3% cream highlights. Dots are drawn 1.6× larger so the colours carry
  the same intensity as Services.
- **Motion** (`earthSpin()`, live kind 3).
  - *Earth:* turns about its own axis at 0.06 rad/s (about 105 s a turn),
    starting on the Atlantic.
  - *Shell:* turns the opposite way at 0.035 rad/s about a slightly different
    axis. Both carry the 23° axial tilt.
  - *Depth:* the facing hemisphere is larger and brighter; the far side is
    smaller and dimmer.
- **Readability.** Particles behind `[data-staffing-content]` dim to 40%
  (`uProtect3`).
- **Layout.** The content is centred (`storySectionClass("center")`).
  - *Desktop:* the Earth is drawn 1.45× larger (`EARTH_VIEW.scale`, via
    `uEarthScale`). `JourneyScene` places it from the screen's right edge, so
    25% of its diameter runs off-screen (`EARTH_VIEW.hiddenRight`) at any
    width. It overrides `STORY_SIDES[1]` each measure.
  - *Phones and tablets:* the Earth keeps its normal size in the band.

  The content and the Earth are independent.

### Services: ring of particle streams

The Services form (`ringStream`) is a huge ring of about 90 particle lanes
plus sparks. Its centre sits off-screen to the left of the particle slot, so
only its arc sweeps through the view. It is generated flat and untilted.
While it is being left or arrived at (`uFlowFrom` / `uFlowTo` = 2),
`particle.vert.glsl` (`ringStream()`) moves it:

- *Flow:* each particle travels along its own lane, inner lanes faster, from
  the lower left round and up to the upper left. The ring is tilted 0.52 rad
  toward the viewer.
- *Visible arc only:* particles travel just the visible ±1.7 rad arc, then
  wrap back off-screen with a fade at both ends. Every particle is spent
  where it can be seen, so the stream stays dense.
- *Scale:* the ring is drawn 2.4255× its generated size (`RING_SCALE`), centred
  with its top-left extreme anchored at `RING_ANCHOR` (resizing grows it right/down), with points 1.3× larger. This makes it look
  close to the camera, with its inner lanes reaching in behind the start of
  the centred content.
- *Colour:* solid bands across the stream, like the reference: orange
  inside, a red-orange edge, then blue to deep blue outside, plus 3% cream
  highlights. Bands, not per-dot mixing: alternating orange/blue dots blend
  into grey-white at viewing distance, and overlaps add up to white.
  - *Keeping colours pure:* each hue is normalised (strongest channel = 1)
    and brightness is capped below 1, because anything brighter clips and
    ACES tone mapping whitens it.
  - *Visibility:* full, even brightness (1.25; no depth or twinkle dimming), point size 2.8×, and density.
- *Density:* the ring spans lanes 2.0–4.3 (it was 6.2), so the same
  particles are about twice as dense. Sparks are down to 2.5%.
- *Fading:* it fades out toward the right, and dims to 45% behind
  `[data-services-content]` (`uProtect2`).

While Services is on screen, the system's sway and wobble are suppressed, so
the structure stays anchored and only the particles move. On desktop the
Services content is centred (`storySectionClass("center")`) and its
particles sit in the left slot (`STORY_SIDES[0] = 0`). Keep `RING_*` in the
shader in sync with `RING_STREAM`.

### Why Pixel IT Center: particle halo

The Why form (`torusFlow`) is a large, calm particle torus centred behind the
centred Why content, which sits inside its opening.

- **Geometry** (`forms/torusFlow.ts`). R 3.65, tube r 0.78, so the opening
  (R − r ≈ 2.9 units) holds the heading and four cards on desktop. An even
  dot lattice, two particles per dot, plus an inner volume for depth.
- **Motion** (`torusFlow()` in the shader). Slow roll through the tube
  (0.07 rad/s), slow drift round the ring (about 0.035 rad/s), barely-there
  per-dot drift. The tilt (about 46°) breathes by only a few hundredths of a
  radian. A pure function of time, with no resets.
- **Layout.** `STORY_SIDES[2] = 0.5` (centred). The content is centred in a
  720px-wide block (`[data-why-content]`); torus particles behind it dim to
  35% (`uProtect4`).
- **Phones and tablets.** The ring is drawn at 0.4× (`uTorusScale`) so the
  whole halo fits the pinned band.
- **Size.** Points are 1.5× the story size while the halo is on screen.
- **Colour.** The Services stream's exact bands and brightness
  (`ringColor`, normalised hues), at slightly lower brightness (0.95).
  - *Bands:* orange on the inner edge facing the content, a red-orange band,
    blue to deep blue on the outer edge, plus 3% cream highlights.
  - *How it's driven:* the band comes from the live tube angle
    (`band = 0.5 + 0.5·cos v`), so the colours stay fixed around the ring
    while particles roll through them.
- Keep `TORUS_R` in the shader in sync with `TORUS_FLOW.R`.

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
| `generateRocketParticles.ts` | No longer shown. Its per-part colouring is still the source of the site's particle palette (`heroField.colorize` and the About vortex) |
| `forms/*.ts` | `ringStream` (Services: huge off-screen-left ring of lanes; the shader flows and colours it), `torusFlow` (Why: thick dotted torus lattice; the shader flows it), `earth` (Staffing: real continents from `landMask.ts`, coastlines, haze, dotted shell), `process` |
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

**Adding a form:** add a generator to `FORMS`, list it in `JOURNEY_FORMS`, and
add a section with `data-story-section` inside `ParticleStory` to own it.

**Shared particle order.** Every form is sorted by height (with jitter), so
particle *i* sits at a similar height in each form. Colours are fixed per
particle (the rocket palette's height order), so orange ends up low in every form and
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
