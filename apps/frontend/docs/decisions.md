# Decisions

## Stack (from the modernization plan, section 03)

Next.js App Router + TypeScript + Tailwind CSS v4 + shadcn/ui. Hosting (AWS
Amplify), analytics and Terraform are not set up yet — `infrastructure/` will be
added when hosting is decided. The portal is a separate application and must not
live in this repo (plan, section 02).

## Two candidate designs

The team compares two designs on the real site before choosing one: the
particle site in the dark, and the same site in daylight (the light design
follows the "Light Theme Live Team Recreation Pack": same cinematic
universe, bright atmosphere, navy type, controlled orange and blue
particles). A separate teal/editorial light design was tried first and
removed once that brief arrived.

- **Folders.** `themes/core/` is the shared site (everything described
  below). `themes/dark/` holds the dark colours; `themes/light/` holds the
  daylight colours and `LightSky`. A section that needs a light-only
  treatment adds its component or styles under `themes/light/`.
- **Separate root layouts.** `app/(dark)/layout.tsx` and
  `app/(light)/layout.tsx` each load `core.css` plus their own colours, and
  set `<html data-theme>` (dark also gets `.dark` for shadcn). `useTheme()`
  (`themes/core/lib/theme.ts`) reads that attribute; it never changes during
  a page's life. Moving between the designs is a full page load, which
  Next.js does anyway across root layouts. With no single root layout, the
  404 page is `app/global-not-found.tsx` (`experimental.globalNotFound`).
- **Replaces the sun/moon toggle.** The old header toggle (localStorage +
  a before-paint script) is gone; the Design switch is the only control.
- **Choosing.** `DesignSwitch` writes the `pixelit-design` cookie and loads
  `/` again (a navigation, not `reload()`, which would restore the old
  page's scroll position). A `beforeFiles` rewrite in `next.config.ts` serves
  `/light` at `/` when the cookie is `light`. Both pages remain static, and
  the right design is in the first HTML, so nothing flashes. Search engines
  never carry the cookie, so they always see the dark design at `/`; the
  light page's canonical is `/`.
- **Visibility.** The switch shows by default; `NEXT_PUBLIC_DESIGN_SWITCH=off`
  hides it.
- **Removal.** See the README ("Two designs, one switch").

The light design's details are under "Light theme (bright, premium)" below.

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

**Hero colours.** The hero uses the same palette as every other form.
`heroField` returns a live `lane` for each particle, coloured with
`ringColor`:

- the hot rim and inner disc are orange;
- a red-orange band follows, then blue to deep blue outward;
- falling particles warm up as they spiral in;
- streams are blue with a few orange sparks;
- outer space is deep blue.

Hues are normalised, with brightness = 0.25 + 0.35 × glow, capped at 1.25,
plus 3% cream highlights. The per-particle rocket colours with a glow
multiplier of up to about 5× washed it toward white.

### Scroll → form position

There is one scrubbed ScrollTrigger per transition (four). Their 0→1 values
add up to a form position, from 0 (hero field) to 5 (About's galaxy). It is
reversible, and it holds wherever the visitor stops. The hero is not pinned.

| Transition | Runs while |
|---|---|
| Hero field → Services | The Services section arrives (top 96% → 18%; phones 100% → 50%) |
| Each later form | Its section's top moves from 96% to 14% of the viewport |

Each story section is at least one screen tall on desktop, so every form
holds before the next one starts.

### One transition feel for the whole journey

Every step uses the same morph: break out → drifting field → re-form. What
made hero → Services and How We Work → About feel better was that the whole
system changes size while its particles are scattered:

- hero → Services shrinks about 2× → 1×;
- How We Work → About grows about 1× → 1.6×;
- the field therefore rushes across the screen.

The three story-to-story steps (Services → Staffing → Why → How We Work)
kept one size. They now get the same sweep from `STORY_FLIGHT.swell` (1.6).
The root scale is multiplied by `1 + 0.6 · sin(π · progress within the
transition)`:

- the scattered field swells out and gathers back in;
- it is exactly 1 at both ends, so each settled shape keeps its size;
- the handoff and the galaxy transitions are excluded, since they already
  change size.

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
- **Particles.** The final form is the solar system (see "How We Work
  (current version)" below). Its planets read `uStage` directly.

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

### About Us: particle spiral galaxy (the journey's last form)

About's content is centred and framed by a spiral galaxy seen almost face-on,
after the swirling-galaxy reference. The galaxy is the journey's final live
form (`galaxy`, kind 5, `galaxy()` in `particle.vert.glsl`). It is not a
separate system, so How We Work hands over to About with the same morph as
every other step: the planets break out into a drifting field, and the field
re-forms into the galaxy. (It used to be its own `ParticleVortex`, drawn on
top of the planets, so the two merged.)

- **Transition.**
  - About is the trigger for the last step (`TRANSITIONS.intoAbout`). On
    desktop it runs over "top 96%" → "top 14%".
  - Phones use "top 42%" → "top -25%", so the morph starts once the pinned
    particle band has released.
  - While it runs, `ParticleSystem` glides the whole system from the story
    placement to About's centre and size (`L.galaxy`, measured from
    `[data-galaxy-anchor]`). It then follows About as the page scrolls.
- **Shape.**
  - *Arms (70%):* two main arms, plus two fainter ones between them. Each is
    a trailing log spiral (`GALAXY_WIND` 2.7), about 1¼ turns, and wide
    (strands spread over 0.14 + 0.55 × radius).
  - *Movement:* each arm particle streams inward along its arm over
    40–100 s and is consumed at the core, then starts again.
  - *Core (12%):* a dense, fast, slightly wound disc.
  - *Field (18%):* sparse points drifting between the arms.
  - *Rotation:* the pattern turns slowly (`GALAXY_SPIN`).
  - *Tilt:* baked into the shader (`GALAXY_TILT`).
  - *No extra data:* each particle's role comes from hashes of its own random
    attributes.
- **Colours.** The site palette in radial bands, as pure hues:
  - cream core;
  - orange, then red-orange;
  - blue to deep-blue rim;
  - a few cream sparkles.
- **Background for About → Contact.** About, Proof Points and Contact sit
  in one transparent `[data-galaxy-region]` (`app/page.tsx`). Its first
  child, `[data-galaxy-anchor]` (sticky, `h-[100svh]` with `-mb-[100svh]`),
  pins the galaxy to the centre of the screen while the region scrolls, then
  lets it leave with the region as the footer arrives.
  - The particle layer stays on until the region has scrolled away.
  - The footer wrapper is opaque, so the galaxy never shows through it.
  - `GALAXY_VIEW.reach` (0.6 of the width / 0.74 of the height) runs the rim
    well past the edges.
  - Particles dim behind whichever `[data-galaxy-content]` block is nearest
    the middle of the screen (About's content, the Proof Points heading). The
    cards are opaque already.
- **Ending: a sun rising over the footer.** An empty `[data-galaxy-outro]`
  (20svh, after Contact's reduced bottom padding) closes the region after Contact, so the ending plays in open space
  rather than behind the Contact card.
  - *Driver:* scrolling through the outro sets `L.galaxyCollapse` from 0 (its
    top enters the screen) to 1 (the region ends, i.e. the footer's top
    reaches the bottom of the screen). `ParticleSystem` eases it into
    `uCollapse`.
  - *Collapse:* the arms wind tighter and everything is pulled into a small
    sun (radius 0.24): cream centre, orange edge. Brightness and point size
    drop as the particles pile up, so it stays a sun rather than a white-out.
    It pulses once at 0.8, then keeps a steady glow.
  - *Horizon:* while it forms, the sun sinks onto the footer's top edge.
    `uSunOffset` = the region's bottom minus the galaxy centre, in local
    units (`L.galaxy.horizon`). The opaque footer hides its lower half and
    carries it up like a rising sun.
  - Scrolling back up rebuilds the galaxy.
- **Stars bend around it.** `ParticleSystem` reports gravity each frame
  (`onGravity` → `Atmosphere`). Strength = the galaxy transition × how
  centred About is on screen.
- **Readability: contrast, not patches.** Dark boxes behind text (a
  per-block dimming, even at 4%) looked like black spots and were removed.
  Instead:
  - the whole galaxy sits back evenly: `GALAXY_DIM` 0.55 outside, easing to
    `GALAXY_CORE_DIM` 0.2 toward the core, where the text sits;
  - the text over it is brighter: `[data-galaxy-region]` raises
    `--text-primary` / `-secondary` / `-muted`;
  - the dimming lifts only as the ending sun reaches the footer's edge, so
    it never lights up behind the Contact text but still glows at the end.
  - while the galaxy is being pulled in, it passes behind the Contact text,
    so it is kept at 25% until it settles.

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

### How We Work (current version): particle solar system

- **Layout.** The content is centred (`storySectionClass("center")`, with
  `STORY_SIDES[3] = 0.5`). The pinned `[data-process-content]` block holds:
  - the heading (`reveal={false}`: the scroll choreography measures where an
    element leaves the screen, which a pinned heading never does, so it
    would fade while still in view);
  - the 01–04 index (the orange progress line is removed);
  - one step panel at a time.

  The particles sit large around and behind that block.
- **Shape.** `forms/solarSystem.ts` is a live form (kind 4) and contains:
  - four planets: 01 Discover upper-left, 02 Plan lower-left, 03 Deliver
    lower-right, 04 Support upper-right;
  - each with its own size, band colours, ring and atmosphere;
  - curved trails joining them, with a lead-in and lead-out off-screen;
  - sparse dust.

  The generator stores per-particle parameters `[stage, role, a, b, c]` in
  `aStage` / `aStageCenter`. Alignment reorders particles, so
  `annotateSolarSystem` matches each one back by position.
- **Shader (`solarSystem()`).** It places every particle each frame:
  - planets spin about tilted axes;
  - rings orbit faster near the planet, so their clumps slowly shear;
  - trails are Hermite curves through the planets, made of braided strands
    that flow along them;
  - bodies are banded and lit from the content side, with the far side dark;
  - the body hides ring and atmosphere particles behind it.

  Desktop and phone-band layouts are two constant tables, mixed by
  `uSolarPhone`. `uProtect5` dims particles behind the step content.
- **Progress (`uStage` 0…4).** Planets light up cumulatively:
  - dim, cool silhouette until reached;
  - active (brightest, slightly larger, breathing atmosphere);
  - completed (stays lit);
  - at the end all four glow.

  The trail is orange behind the front and blue ahead of it. Between planets,
  a bright comet with a tail carries the energy to the next planet and
  arrives as that step's text fades in.
- **Text.** Panels cross over with a fade and a slight vertical move
  (`ProcessProgress`).
- **GLSL gotchas.**
  - `pow(x, 2.0)` with a negative `x` is undefined (NaN on SwiftShader), so
    squares are written out.
  - `active` is a reserved word.
  - The live-form `if / else if` chain must test kind 4 first; otherwise it
    falls into the ring-stream branch.

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
| `generateRocketParticles.ts` | No longer shown. Its per-part colouring is still the source of the site's particle palette (`heroField.colorize`) |
| `forms/*.ts` | `ringStream` (Services: huge off-screen-left ring of lanes; the shader flows and colours it), `torusFlow` (Why: thick dotted torus lattice; the shader flows it), `earth` (Staffing: real continents from `landMask.ts`, coastlines, haze, dotted shell), `solarSystem` (How We Work: planets, rings, trails, dust; the shader places them) |
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

## Typography

The particles are dynamic; the typography is deliberately stable, precise
and restrained so it frames them rather than competing with them.

- **Families.** `--font-display` is Space Grotesk (500/600/700),
  replacing the condensed Oswald, and `--font-sans` is Inter. There are no
  others (Sora was tried on the hero and rejected).
- **Hero headline** (`.hero-title`). Two levels:
  - `.hero-kicker`: TECHNOLOGY & TALENT, the same size as the statement,
    600, a softer white, and the statement's natural tracking (no stretched
    spacing); only the "&" is orange.
  - `.hero-statement`: BUILT FOR / WHAT'S NEXT, 700, white. It is the
    primary line, with explicit line breaks.

  There is no shadow or glow. The black hole's calm centre (a larger
  `HERO_FIELD.voidRadius`) frames the content instead. Hero particles are
  exactly the other forms' palette (`ringColor`: orange, red-orange, blue, deep blue) at the same brightness ceiling (1.25); the calm centre is `voidRadius` 0.27 of the width (0.7 max on phones).
  The intro has one orange phrase, which never breaks across lines. The
  statement is one line from md up. The entrance is line by line.
- **No long dashes** (—) in visible copy; they read as machine-written.
  Hyphens inside words (long-term, right-fit) are fine.
- **Classes** (`styles/globals.css`, `@layer components`). Use these instead of
  one-off heading styles.
  - `type-display-xl`: hero. 700, uppercase, line-height 0.95, tracking
    -0.025em.
  - `type-display-lg`: section headings. 700, uppercase, line-height 1.02,
    tracking -0.02em, balanced wrapping.
  - `type-heading`: card and subsection titles. 600, sentence case.
  - `type-subheading`: small card titles.
  - `type-body`: line-height 1.65, secondary grey, max 62ch, pretty
    wrapping.
  - `type-body-sm`: card descriptions, muted.
  - `type-eyebrow`: 14→17px (fluid), 600, tracking 0.14em, orange. The
    Proof Points section has none.
  - `type-label`: quiet 12px uppercase labels.
  - `type-nav`: 15px, 500.

  Sizes are fluid `clamp()` tokens (`--text-display-xl` …), so tablets and
  phones get their own sizes rather than a shrunk desktop.
- **Colours.** `--text-primary` (near-white), `--text-secondary`,
  `--text-muted`, `--accent-orange`, `--accent-blue`. White stays the main
  text colour. Orange is kept for labels, active states, important words and
  progress.
- **Important words.** In heading copy (`content/site.ts`), `*word*` marks
  one strategically important word and ` | ` marks a preferred line break
  (from `sm` up). `HeadingText` renders these.
  - The word gets `.highlight`: colour only (orange by default;
    `data-tone="blue"` or `"white"`). No glow, gradient, shadow or
    background.
  - `::selection` is a quiet orange, not the browser's blue blocks.
- **Entrance motion.** `StoryChoreography` is timed, not scrubbed, and plays
  when an element reaches 88% of the screen. Order sets the sequence:
  - *Eyebrow:* fade + a 10px rise.
  - *Heading:* word by word via its `[data-word]` spans, stagger 0.045 s,
    rising 20px from `blur(4px)` over 0.8 s (`power3.out`). A highlighted
    word enters white; its accent colour resolves about 150 ms after it
    lands.
  - *Description, then cards:* delayed fade + rise.
  - *Once:* each entrance plays once, then the content stays. Scrolling
    back up never hides or replays it (an earlier reverse-and-replay read as
    content vanishing).
  - *Never:* letter-by-letter, typewriter, bounce, glitch or continuous
    motion.
  - *Exit:* none. The old scrubbed exit (drift up and dim) was removed.
  - *Pinned headers* (`revealExit={false}`, the How We Work heading) take
    their entrance from their section.
  - *Reduced motion:* a plain fade.
- **How We Work steps.** Waiting steps are muted. The active step has an
  orange number and a white title. Completed steps settle to secondary grey
  with a check. Colours ease over 500 ms.
- **Navigation** (`NavLinks`). 15px / 500 in secondary grey, with a hover
  colour change. The section in view gets `aria-current` and a small orange
  dot.

## Cards

One quiet, editorial card language for the whole site: Services, Staffing,
Why and Testimonials. (How We Work, Careers and Contact are open text.)
Earlier outlined "SaaS" cards and a technical-panel version with icons were
rejected; this is their replacement.

- **Look** (`.card` in `styles/globals.css`).
  - The surface is almost the page colour: `--card-bg` is
    `rgb(10 14 22 / 0.35)`.
  - Corners are 4px, and there is no outline or shadow.
  - The edges are a top hairline and a left hairline that fades downward
    (`--card-edge`).
  - The one decoration is a short orange accent line over the top edge.
- **Hover.** The surface gets slightly lighter, the title brighter, and the
  accent longer. Nothing moves, scales or glows.
- **Service panels** (`ServiceCard`, `.card--panel`), top to bottom:
  - a large, light orange number;
  - the title, the strongest element;
  - a partial accent line (orange, alternating with orange-to-blue);
  - the description, narrow (34ch) and muted;
  - a tiny uppercase label bottom right (`label` in `content/site.ts`).

  The grid has generous gaps. There are no icons and no cursor light (both
  removed).

## Footer: the closing scene

`components/layout/Footer.tsx` and the `.footer-*` styles in `globals.css`:

- **Top.** Logo and description on the left; Services, Company and Contact on
  the right, with generous space.
  - Labels are blue-grey with a short orange dash.
  - Links are muted and turn white on hover, with a small orange tick beside
    them; the text itself never moves.
  - The email is set in the display face and is the most prominent contact
    item.
- **Wordmark.** A giant PIXEL IT CENTER (`.footer-wordmark`):
  - white at 4% with a faint outline, so it is discovered rather than shouted;
  - centred and sized (`min(13.6vw, 22rem)`) so the whole name fits the
    screen width;
  - it fades and rises in once (data-reveal).
- **Particles.** Sparse dust around the wordmark: 110 tiny white / blue /
  orange dots, denser toward the bottom, drifting very slowly with CSS.
- **Background.** Opaque, so the galaxy's sun rests on the footer's top
  edge, with faint blue and orange glows at the bottom.

## Light theme (bright, premium)

The same scroll-driven particle world, translated to a light atmosphere.
Every scrubbed transition, pinned section and rotation is shared with the
dark theme; only colour and blending change. (Two earlier versions, an
ink-on-white and a blue sky, were replaced.)

- **How it is shown.** It is the light design of the Design switch (see
  "Two candidate designs"): `app/(light)` sets `data-theme="light"` and loads
  `themes/light/light.css`.
- **Hero** (`themes/light/hero/`, passed to `Home` as its `hero`). After the
  pack's hero references: the approved headline, copy and CTAs centred above
  one large sculptural object, the particle globe, in a white → `#F3F8FE`
  atmosphere with a soft blue glow, and three still floating cards
  (`hero.cards` in `content/site.ts`; md and up).
  - *Globe* (`GlobeScene`): the core earth form's particles (continents,
    coastlines, haze, dotted orbital shell) in navy / blue / electric blue
    with ~7% orange, no glow, over a soft white lit sphere so it reads as a
    solid object. The Earth turns clockwise, the shell the other way;
    scrolling the hero adds a slow extra turn and a slight lift. It renders
    only while on screen; reduced motion stops the turning.
  - *Hand-off*: the journey layer (whose first form is the dark design's
    black hole) is hidden during the hero and fades in as Services arrives,
    so its particles are seen gathering into the Services ring.
- **Services, Staffing, Why, How We Work.** The pack's targets for these are
  the shared forms (ring stream + numbered editorial panels, particle Earth,
  halo with the content in its opening, four-planet solar system), so they
  are unchanged. Light cards are near-solid white (`--card-bg` 0.88) with an
  almost invisible edge, so particles never run through the text.
- **About** (pack page 5: particles gathering and separating). In light only,
  about one in nine of the galaxy's particles is drawn as a large, soft,
  translucent bubble of varied size (`vBubble` in `particle.vert.glsl` /
  `particle.frag.glsl`, gated by `uLight` and the galaxy weight, so bubbles
  grow out of the morph and shrink back). The stars' shader sets it to 0.
- **Contact** ("one calm large particle object"): `ContactOrb`, passed to
  `Home` as `contactBackdrop`: the hero globe's dotted orbital shell alone,
  large, turning slowly behind the centred text (renders only on screen).
- **Footer.** The wordmark is sized past the viewport (19vw) so it is
  cropped at both edges, on `#F8FAFC`.
- **Palette.**

  | Role | Colour |
  |---|---|
  | Background | `#F8FAFC` |
  | Primary text | `#0B1B33` |
  | Secondary text | `#64748B` |
  | Accent | `#FF6B1A` |
  | Technology blue | `#1677FF` |

  Cards are near-white and translucent, with navy hairlines.
- **Sky** (`LightSky`):
  - a white → `#F3F8FE` gradient, cooler at the rim;
  - soft blue and faint warm light drifting slowly;
  - fine navy / blue dust.
- **Particles.** `particle.frag.glsl` (`uLight`) draws each point as a
  coloured dot with normal blending, and bloom is off. The light palette:
  - orange → `#FF6B1A`, red-orange → deep orange;
  - blue → `#1677FF` / electric blue, deep blue → deep navy;
  - whites → soft steel blue.

  Brightness becomes opacity, so text-protect dimming makes particles
  fainter behind text in both themes. Dots are 1.3× larger.
- **Black hole speed.** The disc rotates about 30% slower (`omega` 0.38,
  was 0.55), with slower infall and streams.

## Content

**Source: the live pixelitcenter.com.** The live site's facts and wording
are used where they exist, lightly edited for length and grammar:

- *Contact:* phone +1 (336) 944-6562; 189 Tarleton Dr, Fuquay Varina,
  NC 27526; info@pixelitcenter.com; LinkedIn.
- *Services:* AI; Cloud (AWS / Azure / GCP); Cybersecurity; Big Data
  Analytics; DevOps; QA Automation; Networking Solutions; Project
  Management; Business Analysis.
- *About:* the body, mission and a shortened vision.
- *Why:* the recruiters' technical backgrounds and matching on
  competence, skills and personality.
- *Staffing:* direct hire uses the live site's tailored-selection line.
- *Testimonials:* word for word.

The hero, section headings, How We Work, Careers and Contact wording are our
own. The live hero tagline ("Expect Nothing Less Than Exceptional Service")
was not used.


All copy is in `content/site.ts` and is placeholder text. Client logos,
testimonials, contact details and any figures need business approval before
launch.
