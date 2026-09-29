// Particle morph. Every particle travels from its spot in form A (`position`)
// to its spot in form B (`aTarget`) through a shared scatter cloud:
//
//   A ──breakup──▶ curved path out ──▶ drifting field ──▶ curved path in ──▶ B
//
// uProgress (0..1) is the only thing JavaScript drives. Every particle turns it
// into its own local progress using its own delays, so particles leave and
// arrive in waves instead of all at once. At uProgress 0 a particle is
// exactly at A and at 1 exactly at B, so chaining forms is seamless and
// scrubbing backwards retraces the same path.

#define PI 3.141592653589793

uniform float uTime;
uniform float uProgress;        // current A → B transition
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;          // 1 = full motion, ~0.1 = reduced motion
uniform float uScatter;         // scales how far the cloud spreads
uniform float uCurve;           // strength of the curved trajectories
uniform float uFormNoise;       // idle shimmer while a form holds
uniform float uFieldNoise;      // drift while particles are in flight
uniform float uNoiseScale;
uniform float uMouseInfluence;
uniform float uMouseRadius;
uniform float uFocusDepth;
uniform vec3 uMouse;            // pointer, in the particles' local space
uniform float uStage;           // How We Work progress: 0 = Discover active … 4 = all done
uniform float uFlowFrom;        // live form being left: 0 none, 1 torus (Why), 2 ring stream (Services), 3 Earth, 4 solar system, 5 galaxy (About)
uniform float uFlowTo;          // live form being arrived at (same codes)
uniform vec4 uProtect2;         // Services content box in NDC (dims the ring stream behind text)
uniform vec4 uProtect3;         // Staffing content box in NDC (dims the Earth behind text)
uniform float uEarthScale;      // extra display scale for the Staffing Earth
uniform vec4 uProtect4;         // Why content box in NDC (dims the torus behind text)
uniform float uTorusScale;      // Why torus display scale (smaller in the phone band)
uniform float uSolarPhone;      // 1 = solar system in its compact phone-band layout
uniform vec4 uProtect5;         // How We Work step content box in NDC (dims particles behind text)
uniform float uSkyTheme;        // 1 = light (blue-sky) theme: gold / coral / ice palette
uniform float uCollapse;        // galaxy ending: 0 = galaxy … 1 = a sun on the footer's edge
uniform float uSunOffset;       // local y from the galaxy centre down to the footer's top edge
uniform float uHeroField;       // 1 while the current "from" form is the hero gravity field
uniform vec4 uProtect;          // hero text box in NDC: centre xy, half-size zw
uniform float uProtectFloor;    // brightness left for particles behind the hero text

attribute vec3 aTarget;
attribute vec3 aColor;
attribute float aRandom;
attribute float aDelay;
attribute vec3 aScatterDir;
attribute float aScatterDistance;
attribute vec3 aNoiseOffset;
attribute float aScale;
attribute vec2 aStage;          // solar system: (stage, role) — see solarSystem()
attribute vec3 aStageCenter;    // solar system: the role's coordinates

varying vec3 vColor;
varying float vAlpha;

// Timing of one transition, in uProgress units. Departures all finish before
// arrivals start, leaving a short moment where everything is a floating field.
const float OUT_SPREAD = 0.28;  // departure delays range over this
const float OUT_LENGTH = 0.20;  // each particle's own departure time
const float IN_START = 0.52;
const float IN_SPREAD = 0.28;
const float IN_LENGTH = 0.20;

// --- 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT) -----------------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 flowNoise(vec3 q) {
  return vec3(snoise(q), snoise(q + vec3(0.0, 17.1, 3.7)), snoise(q + vec3(31.7, 5.3, 0.0)));
}
// ---------------------------------------------------------------------------

float easeInOutCubic(float x) {
  return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
}

/** A unit vector perpendicular to `dir`, chosen per particle. */
vec3 sideways(vec3 dir, vec3 seed) {
  vec3 s = cross(dir, normalize(seed + vec3(1e-3, 2e-3, 3e-3)));
  float len = length(s);
  return len > 1e-4 ? s / len : normalize(cross(dir, vec3(0.0, 1.0, 0.0001)));
}

// --- landing hero: a black hole made of the journey particles -------------
// Live position of this particle in the hero's black hole, built from its
// existing random attributes. Its role follows the colour it already has,
// so orange concentrates in the accretion disc without recolouring anything:
//   orange → dense accretion disc around a large empty void (some spiral in
//            and are consumed at the void's edge, then re-enter at the rim)
//   white  → hot highlights along the disc's inner edge, and the disc
//   blue   → curved gravitational streams further out, and sparse outer space
// Units: 1 = the void's radius (JourneyScene sizes it in pixels).
const float HERO_VOID = 1.0;
const float HERO_DISC_OUT = 2.0;

vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }

vec3 heroField(out float visible, out float glow, out float grow, out float lane) {
  float h3 = fract(aNoiseOffset.x * 0.1591549);
  float h4 = fract(aNoiseOffset.y * 0.1591549);
  float h5 = fract(aNoiseOffset.z * 0.1591549);
  float h6 = fract(aScatterDistance * 3.71);
  float warmth = (aColor.r - aColor.b) / (aColor.r + aColor.g + aColor.b + 1e-3);
  bool orange = warmth > 0.12;
  bool blue = warmth < -0.18;

  float t = uTime * uMotion;
  float r;
  float th;
  float y;
  visible = 1.0;
  glow = 1.0;
  grow = 1.0;
  lane = 0.7;

  // Role: 0 disc, 1 hot inner rim, 2 stream, 3 outer space.
  float role = orange ? (h6 < 0.22 ? 1.0 : h6 < 0.9 ? 0.0 : h6 < 0.96 ? 2.0 : 3.0)
    : blue ? (h6 < 0.6 ? 2.0 : h6 < 0.8 ? 0.0 : 3.0)
    : (h6 < 0.22 ? 1.0 : h6 < 0.45 ? 0.0 : 3.0);

  if (role < 1.5) {
    // Accretion disc: dense near the inner edge, thinning outward. Kepler-ish
    // speeds, so the inner disc visibly outruns the outer.
    float r0 = role < 0.5
      ? HERO_VOID * (1.05 + pow(h4, 2.4) * (HERO_DISC_OUT - 1.05))
      : HERO_VOID * (1.02 + pow(h4, 2.0) * 0.14);
    float omega = 0.38 * pow(r0, -1.5) * (0.85 + aDelay * 0.3);
    r = r0;
    th = h5 * 6.2831853 + t * omega;
    // About a third of the disc is falling in: spiral from its orbit to just
    // inside the void edge, faster and tighter, then vanish; re-enter at the
    // rim (never inside the core) as the cycle wraps.
    if (role < 0.5 && h3 < 0.35) {
      float life = fract(t / (26.0 + aRandom * 36.0) + aDelay);
      float fall = pow(life, 1.8);
      r = mix(r0, HERO_VOID * 0.6, fall);
      th += 2.2 * fall * fall;
      visible = smoothstep(0.0, 0.06, life) * smoothstep(HERO_VOID * 0.62, HERO_VOID * 1.02, r);
    }
    y = (aScatterDir.y * 0.07 + 0.02 * sin(t * 0.5 + aRandom * 30.0)) * r;
    // Brightest at the inner edge; the rim is the hottest.
    float inner = 1.0 - smoothstep(HERO_VOID, HERO_DISC_OUT, r);
    glow = (1.0 + 1.8 * inner) * (role > 0.5 ? 1.7 : 1.0);
    grow = 1.15 + 0.35 * inner;
    // Palette band by live radius: the hot rim and inner disc orange, a
    // red-orange band, then blue to deep blue outward. Falling particles
    // warm up as they spiral in.
    float rf = clamp((r - HERO_VOID) / (HERO_DISC_OUT - HERO_VOID), 0.0, 1.0);
    // Bands like the other forms: orange inside, red-orange, then blue from
    // about the middle of the disc outward.
    lane = role > 0.5 ? 0.05 + 0.15 * h4 : mix(0.1, 1.0, pow(rf, 0.55));
  } else if (role < 2.5) {
    // Streams: three curved arms (log spirals) flowing inward toward the disc.
    float arm = floor(h4 * 3.0);
    float s = fract(h5 - t / (58.0 + aRandom * 42.0));
    r = HERO_VOID * (HERO_DISC_OUT + s * 3.2);
    th = arm * 2.0943951 + 1.9 * log(r) + (aScatterDir.x * 0.22 + aScatterDir.z * 0.1) * (0.6 + s) + t * 0.1;
    y = aScatterDir.y * 0.18 * r;
    visible = smoothstep(0.0, 0.08, s) * (1.0 - smoothstep(0.85, 1.0, s));
    glow = 1.0;
    // Streams: blue, deepening outward, with a few orange sparks.
    lane = h3 < 0.06 ? 0.15 : 0.6 + 0.35 * s;
  } else {
    // Outer space: sparse, dim, slow.
    r = HERO_VOID * (HERO_DISC_OUT + 0.4 + h4 * 4.0);
    th = h5 * 6.2831853 + t * 0.02;
    y = aScatterDir.y * 0.5 * r;
    glow = 0.3;
    grow = 0.7;
    lane = 0.7 + 0.3 * h4;
  }
  vec3 p = vec3(cos(th) * r, y, sin(th) * r);
  return rotX(p, aScatterDir.x * 0.04);
}

// --- Why Pixel IT Center: particles flowing through a thick torus ----------
// Recovers a particle's torus coordinates from its (untilted) form position,
// moves it around the ring (major orbit) and around the tube (minor orbit),
// then tilts the whole torus, which slowly precesses. Pure function of time:
// no resets. Keep TORUS_R / TORUS_r in sync with TORUS_FLOW (torusFlow.ts).
const float TORUS_R = 3.65;

vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }

vec3 torusFlow(vec3 p, out float band) {
  float t = uTime * uMotion;
  float d = length(p.xz);
  float u = atan(p.z, p.x);
  vec2 q = vec2(d - TORUS_R, p.y);
  float rt = length(q);
  float v = atan(q.y, q.x);
  // Minor orbit: particles roll through the tube. Major orbit: they travel
  // round the ring, the inner side a little faster (a gentle shear). Small
  // bounded per-particle drift keeps it organic without smearing the lattice.
  // (Drift phase comes from the dot's own place, so a dot's particles move
  // together and stay crisp.)
  float seed = floor(u * 40.0) * 1.7 + floor(v * 20.0) * 3.1;
  // Calm: a slow roll through the tube, a slow drift round the ring, and
  // barely-there per-dot movement — noticeable only after a few seconds.
  v += t * 0.07;
  u += t * (0.035 + 0.01 * cos(v)) + 0.004 * sin(t * 0.5 + seed);
  rt *= 1.0 + 0.01 * sin(t * 0.7 + seed * 1.3);
  float dd = TORUS_R + rt * cos(v);
  // Colour band from the live tube angle: 0 on the inner edge (facing the
  // content), 1 on the outer edge — same banding as the Services stream.
  band = 0.5 + 0.5 * cos(v);
  vec3 f = vec3(cos(u) * dd, rt * sin(v), sin(u) * dd);
  // Centred halo seen at a gentle angle, so its opening frames the content;
  // the tilt breathes very slowly.
  f = rotX(f, 0.8 + 0.03 * sin(t * 0.05));
  f = rotZ(f, 0.04 * sin(t * 0.04 + 1.3));
  return rotY(f, 0.05 * sin(t * 0.03)) * uTorusScale;
}

// --- Services: a huge ring of particle streams ------------------------------
// The ring's centre is off-screen left; only its arc crosses the view. Each
// particle keeps its lane and flows along it (inner lanes faster), sweeping
// up from the lower left, round, and back to the upper left. Keep RING_* in
// sync with RING_STREAM (ringStream.ts).
const float RING_CX = -3.4;
const float RING_IN = 2.0;
const float RING_OUT = 4.3;
// Display: the ring is drawn much larger than it is generated (as if far
// closer to the camera). Its top-left extreme is anchored at RING_ANCHOR, so
// changing RING_SCALE grows/shrinks it toward the right and bottom while the
// top-left edge stays put on screen. (Anchor = where the top-left sat at
// scale 2.4255 with the centre at x -7.6.)
const float RING_SCALE = 2.4255;
const float RING_TILT = 0.52;
const vec2 RING_ANCHOR = vec2(-18.0296, 5.1823);

vec3 ringStream(vec3 p, out float lane, out float arcVis) {
  float t = uTime * uMotion;
  vec2 rel = vec2(p.x - RING_CX, p.z);
  float r = length(rel);
  float a = atan(rel.y, rel.x);
  lane = p.y > 0.3 ? 1.1 : clamp((r - RING_IN) / (RING_OUT - RING_IN), 0.0, 1.0);
  // Flow along the visible arc only (from the near side at the bottom, round
  // the right, to the far side at the top), then wrap back off-screen left —
  // every particle is spent where it can be seen, so the stream stays dense.
  const float ARC_HALF = 1.7;
  float speed = 0.16 * pow(r / RING_IN, -1.2) * (0.9 + 0.2 * aRandom);
  float phase = fract(a / 6.2831853 + t * speed / (2.0 * ARC_HALF));
  a = ARC_HALF - phase * 2.0 * ARC_HALF;
  arcVis = smoothstep(0.0, 0.1, phase) * (1.0 - smoothstep(0.9, 1.0, phase));
  float y = p.y + 0.02 * sin(t * 0.8 + aRandom * 30.0);
  vec3 f = vec3(cos(a) * r, y, sin(a) * r) * RING_SCALE;
  // Tilt the ring toward the viewer so near lanes arc below, far lanes above.
  f = rotX(f, RING_TILT);
  // Place the ring so its leftmost / topmost extreme lands on the anchor.
  float reach = RING_OUT * RING_SCALE;
  f.x += RING_ANCHOR.x + reach;
  f.y += RING_ANCHOR.y - sin(RING_TILT) * reach;
  return f;
}

// Lane colours, from the reference: inner cream, orange, red; outer blue to
// deep navy. Orange / blue / white are the site palette (linear); the red is
// taken from the reference image.
vec3 ringColor(float lane) {
  // Solid colour bands across the stream, like the reference: orange inside,
  // a red-orange edge, then blue to deep blue outside. Bands (not per-dot
  // mixing) keep colours readable — alternating orange/blue dots blend into
  // grey-white at viewing distance.
  vec3 orange = vec3(1.0, 0.32, 0.05);
  vec3 red = vec3(0.9, 0.08, 0.02);
  vec3 blue = vec3(0.07, 0.26, 1.0);
  vec3 deep = vec3(0.04, 0.1, 0.62);
  vec3 c = mix(orange, red, smoothstep(0.34, 0.46, lane));
  c = mix(c, blue, smoothstep(0.5, 0.58, lane));
  return mix(c, deep, smoothstep(0.78, 1.0, lane));
}

// --- Staffing: a particle Earth in a counter-rotating dotted shell ---------
// The Earth (and its haze) turns one way about its axis; the outer shell
// turns the other way about a slightly different axis, so the layers seem
// to circle past each other. Both are tilted like the real Earth. Keep
// EARTH_SPLIT in sync with EARTH.split (forms/earth.ts).
const float EARTH_R = 1.65;
const float EARTH_SPLIT = 2.1;

vec3 earthSpin(vec3 p, out float shell, out float facing) {
  float t = uTime * uMotion;
  shell = step(EARTH_SPLIT, length(p));
  vec3 f;
  if (shell > 0.5) {
    // Outer shell: slower, and the opposite way.
    f = rotY(p, -t * 0.035);
    f = rotX(f, 0.32);
  } else {
    // Earth: a slow planet spin (~105 s a turn), starting on the Atlantic.
    f = rotY(p, t * 0.06 - 1.1);
  }
  // Axial tilt, and tipped a little toward the viewer.
  f = rotZ(f, 0.41);
  f = rotX(f, 0.22);
  // 1 on the hemisphere facing the camera (+z), 0 on the far side.
  facing = smoothstep(-0.25, 0.35, f.z / max(length(f), 1e-3));
  return f * uEarthScale;
}

// --- How We Work: the particle solar system ---------------------------------
// Four planets (01 Discover … 04 Support) joined by curved particle trails in
// sparse dust. Every particle is placed here, each frame, from its
// parameters (forms/solarSystem.ts): aStage = (stage, role), aStageCenter =
// the role's coordinates. Planets spin, rings turn, trails flow; uStage
// (0 … 4) lights the planets cumulatively and sends an energy stream along
// the trail to the planet being reached.
//
// Planet centre xyz + radius. Desktop: around the centred step content.
// Phone band: a compact wave. (SOLAR.planets in the form mirrors the desktop
// values for approximate placement only.)
const vec4 SOLAR_DESK[4] = vec4[4](
  vec4(-3.75, 1.45, 0.2, 0.58),
  vec4(-2.7, -1.85, -0.4, 0.44),
  vec4(2.75, -1.6, 0.15, 0.74),
  vec4(3.95, 1.55, -0.3, 0.5)
);
const vec4 SOLAR_PHONE[4] = vec4[4](
  vec4(-2.2, 0.85, 0.1, 0.46),
  vec4(-0.75, -0.95, -0.2, 0.36),
  vec4(0.8, 0.8, 0.1, 0.54),
  vec4(2.2, -0.9, -0.2, 0.4)
);
// Trail direction through each planet (Hermite tangents).
const vec3 SOLAR_TAN_DESK[4] = vec3[4](
  vec3(0.6, -3.0, 0.0), vec3(3.2, -1.0, 0.2), vec3(2.4, 2.4, -0.2), vec3(0.8, 2.8, 0.0)
);
const vec3 SOLAR_TAN_PHONE[4] = vec3[4](
  vec3(1.7, 0.0, 0.0), vec3(1.7, 0.0, 0.0), vec3(1.7, 0.0, 0.0), vec3(1.7, 0.0, 0.0)
);
// Per planet: axis tilt toward the viewer (x) and sideways (z), spin speed.
// The rings lie on each planet's equator, so the tilts vary their angles.
const vec3 SOLAR_SPIN[4] = vec3[4](
  vec3(0.42, 0.35, 0.09), vec3(0.14, -0.45, 0.13), vec3(0.5, -0.22, 0.06), vec3(0.3, 0.75, 0.1)
);
// Palette: warm white, Pixel IT orange / red-orange, blue, deep blue.
const vec3 S_CREAM = vec3(1.0, 0.86, 0.66);
const vec3 S_ORANGE = vec3(1.0, 0.32, 0.05);
const vec3 S_RED = vec3(1.0, 0.09, 0.02);
const vec3 S_BLUE = vec3(0.07, 0.26, 1.0);
const vec3 S_DEEP = vec3(0.04, 0.1, 0.62);
// Body bands (two colours), ring and atmosphere for each planet.
const vec3 SOLAR_BODY_A[4] = vec3[4](S_CREAM, S_BLUE, S_ORANGE, S_BLUE);
const vec3 SOLAR_BODY_B[4] = vec3[4](S_ORANGE, S_CREAM, S_RED, S_DEEP);
const vec3 SOLAR_RING[4] = vec3[4](S_BLUE, S_CREAM, S_ORANGE, S_ORANGE);
const vec3 SOLAR_ATMO[4] = vec3[4](S_CREAM, S_BLUE, S_ORANGE, S_BLUE);

// A knot of the trail: 0 = lead-in start, 1–4 = planets, 5 = lead-out end.
// xyz = place, w = planet radius (0 for the ends); m = tangent.
vec4 solarKnot(int i, out vec3 m) {
  if (i == 0) {
    m = mix(vec3(2.6, -1.6, 0.0), vec3(1.7, 0.0, 0.0), uSolarPhone);
    return vec4(mix(vec3(-6.8, 3.9, -0.5), vec3(-3.9, -0.9, -0.3), uSolarPhone), 0.0);
  }
  if (i == 5) {
    m = mix(vec3(2.6, 1.6, 0.0), vec3(1.7, 0.0, 0.0), uSolarPhone);
    return vec4(mix(vec3(6.8, 3.9, -0.5), vec3(3.9, 0.85, -0.3), uSolarPhone), 0.0);
  }
  m = mix(SOLAR_TAN_DESK[i - 1], SOLAR_TAN_PHONE[i - 1], uSolarPhone);
  return mix(SOLAR_DESK[i - 1], SOLAR_PHONE[i - 1], uSolarPhone);
}

vec3 solarSystem(out vec3 col, out float sizeK) {
  float t = uTime * uMotion;
  float s = uStage;
  float stage = aStage.x;
  float role = aStage.y;
  vec3 q = aStageCenter;

  // --- trails ---------------------------------------------------------------
  if (role < 0.5) {
    // Particles drift along their segment (and wrap), so the paths flow.
    float seg = floor(stage + 1.0);
    float u = fract(stage + 1.0 + t * 0.012 * (0.5 + q.z));
    int i = int(seg + 0.5);
    vec3 m0;
    vec3 m1;
    vec4 k0 = solarKnot(i, m0);
    vec4 k1 = solarKnot(i + 1, m1);
    float u2 = u * u;
    float u3 = u2 * u;
    vec3 p = (2.0 * u3 - 3.0 * u2 + 1.0) * k0.xyz + (u3 - 2.0 * u2 + u) * m0
           + (-2.0 * u3 + 3.0 * u2) * k1.xyz + (u3 - u2) * m1;
    vec3 d = (6.0 * u2 - 6.0 * u) * k0.xyz + (3.0 * u2 - 4.0 * u + 1.0) * m0
           + (-6.0 * u2 + 6.0 * u) * k1.xyz + (3.0 * u2 - 2.0 * u) * m1;
    vec3 side = normalize(vec3(-d.y, d.x, 0.0) + 1e-5);
    // Braided strands, wider between planets and pinched at them, with a
    // slow organic weave.
    float width = mix(0.04, 0.26, pow(max(sin(PI * u), 0.0), 0.7)) * mix(1.0, 0.65, uSolarPhone);
    float tw = u * 5.0 + t * 0.12 + q.z * 0.6;
    vec2 off = vec2(cos(tw) * q.x - sin(tw) * q.y * 0.45, sin(tw) * q.x + cos(tw) * q.y * 0.45);
    off.x += 0.35 * sin(u * 9.0 + t * 0.35 + q.z * 6.2831);
    p += (side * off.x + vec3(0.0, 0.0, off.y)) * width;
    // Fade out where the trail runs into a planet.
    float nearP = 1e3;
    if (k0.w > 0.0) nearP = min(nearP, length(p - k0.xyz) / k0.w);
    if (k1.w > 0.0) nearP = min(nearP, length(p - k1.xyz) / k1.w);
    float fade = smoothstep(1.05, 1.7, nearP);
    // Lit (orange) behind the progress front, cool blue ahead of it; while
    // moving between planets a bright stream with a tail carries the energy.
    float qs = seg - 1.0 + u;
    float lit = smoothstep(qs - 0.03, qs + 0.03, s);
    float energy = sin(PI * fract(s)) * step(s, 3.0);
    float dq = s - qs;
    float dh = dq / 0.035;
    float comet = dq >= 0.0 ? exp(-dq / 0.2) : exp(-dh * dh);
    float front = clamp(comet * energy, 0.0, 1.0);
    col = mix(S_BLUE * 0.28, mix(S_ORANGE, S_CREAM, 0.2 + 0.35 * q.z) * 0.7, lit);
    col = mix(col, mix(S_ORANGE, S_CREAM, smoothstep(0.5, 1.0, comet)) * 1.25, front);
    col *= fade;
    sizeK = 1.1 + front * 1.0;
    return p;
  }

  // --- dust -----------------------------------------------------------------
  if (role > 3.5) {
    vec3 p = q * mix(vec3(1.0), vec3(0.55, 0.62, 1.0), uSolarPhone);
    p += 0.06 * vec3(sin(t * 0.07 + q.y * 3.0), cos(t * 0.06 + q.x * 2.0), 0.0);
    col = mix(S_CREAM, S_BLUE, step(0.5, fract(aRandom * 5.0))) * (0.12 + 0.2 * fract(aRandom * 17.0));
    sizeK = 0.55;
    return p;
  }

  // --- planets: body (1), ring (2), atmosphere (3) ----------------------------
  int k = int(stage + 0.5);
  float fk = float(k);
  vec4 c = mix(SOLAR_DESK[k], SOLAR_PHONE[k], uSolarPhone);
  vec3 spin = SOLAR_SPIN[k];
  // Cumulative: dim until reached, current while its step is shown, then
  // stays lit; at the end all four glow. A small wave as each is reached.
  float on = smoothstep(fk - 0.12, fk - 0.02, s);
  float done = smoothstep(fk + 0.9, fk + 0.98, s);
  float current = max(on * (1.0 - done), smoothstep(3.85, 3.98, s));
  // (Squares written out: pow() of a negative base is undefined in GLSL.)
  float dh = (s - fk) / 0.08;
  float hit = step(0.5, fk) * exp(-dh * dh);
  float level = min(mix(0.3, 1.0, on) + current * 0.25 + hit * 0.3, 1.3);

  // Rings orbit faster near the planet (so their clumps slowly shear); the
  // atmosphere turns slower than the body.
  float ringR = max(length(q.xz), 1.0);
  float speed = role > 2.5 ? 0.5 : role > 1.5 ? 1.8 / pow(ringR, 1.5) : 1.0;
  vec3 lp = q * c.w * (1.0 + 0.06 * current + 0.05 * hit);
  if (role > 2.5) lp *= 1.0 + 0.04 * current * sin(t * 1.3 + fk);
  vec3 f = rotY(lp, t * spin.z * speed + fk * 1.9);
  f = rotX(f, spin.x);
  f = rotZ(f, spin.y);

  vec3 hue;
  if (role < 1.5) {
    // Banded surface with drifting storms; lit from the content side (the
    // "sun" sits behind the centred text), far side dark.
    vec3 n = normalize(f + 1e-5);
    float band = 0.5 + 0.5 * sin(q.y * 7.0 + snoise(q * 1.7 + fk * 3.1) * 2.2);
    hue = mix(SOLAR_BODY_A[k], SOLAR_BODY_B[k], smoothstep(0.25, 0.75, band));
    if (fract(aRandom * 13.0) > 0.97) hue = S_CREAM;
    vec3 L = normalize(vec3(-c.x, -c.y, 2.4));
    float shade = mix(0.16, 1.0, smoothstep(-0.3, 0.8, dot(n, L)));
    hue *= shade * mix(0.1, 1.0, smoothstep(-0.2, 0.25, n.z));
    sizeK = 1.7;
  } else if (role < 2.5) {
    hue = SOLAR_RING[k];
    if (k == 2 && ringR > 1.8) hue = S_BLUE;   // Deliver's outer ring
    hue *= 0.85;
    sizeK = 1.25;
  } else {
    float h = clamp((length(q) - 1.0) / 0.55, 0.0, 1.0);
    hue = SOLAR_ATMO[k] * mix(0.55, 0.12, h) * (1.0 + 0.4 * current);
    sizeK = 1.0;
  }
  // The body hides ring and atmosphere passing behind it.
  if (role > 1.5) {
    float behind = step(f.z, 0.0) * (1.0 - smoothstep(c.w * 0.9, c.w * 1.02, length(f.xy)));
    hue *= 1.0 - 0.94 * behind;
  }
  // Not yet reached: a quiet silhouette, cooled toward blue-grey.
  vec3 cool = vec3(0.35, 0.42, 0.6) * max(max(hue.r, hue.g), hue.b);
  hue = mix(cool, hue, mix(0.25, 1.0, on));
  col = hue * level;
  sizeK *= mix(0.85, 1.0, on) * (1.0 + 0.1 * current);
  return c.xyz + f;
}

// --- About Us: particle spiral galaxy (live form, kind 5) -------------------
// Seen almost face-on, framing the centred About content: a bright core, two
// main arms (two fainter ones between them) and a sparse field. Arm
// particles stream inward along their arm and are consumed at the core, then
// start again at the rim. Each particle's role comes from hashes of its own
// random attributes, so the form needs no extra data. Colours: the site
// palette in radial bands (cream core → orange → red-orange → blue rim).
const float GALAXY_OUTER = 3.9;   // = GALAXY_VIEW.outer (journey-config.ts)
const float GALAXY_CORE = 0.34;
const float GALAXY_WIND = 2.7;    // arm winding: radians per e-fold of radius
const float GALAXY_SPIN = 0.045;  // pattern rotation (rad/s)
const vec2 GALAXY_TILT = vec2(1.38, 0.16);  // x: π/2 would be exactly face-on
const float GALAXY_DIM = 0.55;       // overall brightness behind the text sections
const float GALAXY_CORE_DIM = 0.2;   // the dense core and inner arms, dimmed more

float galaxyHash(float k) {
  return fract(sin(aRandom * 127.1 + aDelay * 311.7 + aScatterDistance * 17.3 + k * 74.7) * 43758.5453);
}

vec3 galaxy(out vec3 col, out float sizeK) {
  float t = uTime * uMotion;
  float kind = galaxyHash(1.0);          // < 0.7 arm, < 0.82 core, else field
  float g2 = galaxyHash(2.0);
  float g3 = galaxyHash(3.0);
  float g4 = galaxyHash(4.0);
  float g5 = galaxyHash(5.0);
  float g6 = galaxyHash(6.0);
  float g7 = galaxyHash(7.0);
  float gauss = (g5 + g6 + g7 - 1.5) / 1.5;
  float r;
  float th;
  float vis = 1.0;
  float lane = 0.0;

  if (kind < 0.7) {
    // Arms: two main arms half a turn apart, the fainter pair between them.
    // Fine strands across each arm (the streaks) plus a softer diffuse glow;
    // the arms widen outward.
    bool secondary = g2 < 0.28;
    float arm = (g3 < 0.5 ? 0.0 : PI) + (secondary ? PI * 0.5 + 0.35 : 0.0);
    lane = g4 < 0.72 ? (floor(g5 * 7.0) - 3.0) / 3.0 + (g6 - 0.5) * 0.12 : gauss * 1.6;
    if (secondary) lane *= 1.3;
    // 40–100 s from the rim to the core, along the trailing spiral.
    float life = fract(t / (40.0 + g7 * 60.0) + g2 * 7.3);
    float rn = 1.0 - life;
    r = mix(GALAXY_CORE * 0.55, GALAXY_OUTER * 1.1, rn);
    th = arm - GALAXY_WIND * log(r / GALAXY_CORE) + lane * (0.14 + 0.55 * rn) + t * GALAXY_SPIN;
    // Born softly at the rim, consumed at the core.
    vis = smoothstep(0.0, 0.05, life) * smoothstep(GALAXY_CORE * 0.55, GALAXY_CORE * 1.15, r);
    sizeK = 1.35;
  } else if (kind < 0.82) {
    // Core: a dense disc, faster toward the centre, slightly wound.
    r = GALAXY_CORE * 1.15 * pow(g4, 0.75);
    th = g3 * 6.2831853 + t * (0.12 + 0.3 * (1.0 - r / GALAXY_CORE)) - 1.5 * log(r / GALAXY_CORE + 0.05);
    sizeK = 1.5;
  } else {
    // Field: sparse points drifting slowly between the arms.
    r = GALAXY_OUTER * 1.15 * sqrt(g4);
    th = g3 * 6.2831853 + t * GALAXY_SPIN * 0.7;
    sizeK = 1.0;
  }

  float rn = r / GALAXY_OUTER;
  vec3 c = mix(S_CREAM, S_ORANGE, smoothstep(0.1, 0.3, rn));
  c = mix(c, S_RED, smoothstep(0.45, 0.62, rn));
  c = mix(c, S_BLUE, smoothstep(0.66, 0.82, rn));
  c = mix(c, S_DEEP, smoothstep(0.88, 1.08, rn));
  float level;
  if (kind < 0.7) {
    level = (abs(lane) > 1.2 ? 0.6 : 1.15) * (1.0 - 0.5 * smoothstep(0.8, 1.1, rn));
    if (aRandom > 0.97) { c = S_CREAM; level = 1.2; }
  } else if (kind < 0.82) {
    c = mix(S_CREAM, S_ORANGE, smoothstep(0.55, 1.0, r / GALAXY_CORE) * 0.5);
    level = 1.25;
  } else {
    c = aRandom > 0.8 ? S_CREAM : mix(S_BLUE, S_DEEP, aRandom);
    level = 0.35;
  }
  // The galaxy sits behind four text sections, so it is dimmed evenly
  // (the dense core most) while the text over it is brightened — they
  // separate by contrast, not by dark patches. The ending sun below keeps
  // its full glow: the dimming lifts only as it reaches the footer's edge.
  // Dimmer toward the centre, where the text sits.
  float sitBack = kind >= 0.7 && kind < 0.82 ? GALAXY_CORE_DIM : mix(GALAXY_CORE_DIM, GALAXY_DIM, smoothstep(0.05, 0.4, rn));
  col = c * level * vis * mix(sitBack, 1.0, smoothstep(0.75, 1.0, uCollapse));

  // Ending (uCollapse, after Contact): the arms wind tighter and everything
  // is pulled into a small sun (cream centre, orange edge). Brightness and
  // size drop as the particles pile up, so it stays a sun, not a white-out.
  // It pulses once, then settles, glowing, onto the footer's top edge
  // (uSunOffset), where the footer hides its lower half and carries it up
  // like a rising sun.
  float pull = smoothstep(0.0, 0.75, uCollapse);
  th += pull * 5.0 * (0.25 + rn);
  r = r * pow(1.0 - pull, 1.4) + 0.24 * pull * g4 * g4;
  float dp = (uCollapse - 0.8) / 0.05;
  float pulse = exp(-dp * dp);
  float glow = smoothstep(0.75, 1.0, uCollapse);
  col = mix(col, mix(S_CREAM, S_ORANGE, g4 * 0.8) * vis, pull * 0.8);
  col *= mix(1.0, 0.1, pull * pull) * (1.0 + 4.0 * pulse + 3.0 * glow);
  // While it is pulled in it passes behind the Contact text: keep it faint
  // then, and let it glow only as it settles on the footer's edge.
  col *= mix(1.0, 0.25, smoothstep(0.3, 0.6, uCollapse) * (1.0 - glow));
  sizeK *= mix(1.0, 0.6, pull) * (1.0 + 1.2 * pulse);

  vec3 p = vec3(cos(th) * r, gauss * (kind < 0.82 && kind >= 0.7 ? 0.04 : 0.08) * (0.4 + rn) * (1.0 - pull), sin(th) * r);
  // Same orientation as a group rotated (x, 0, z) in three.js (XYZ order).
  p = rotX(rotZ(p, GALAXY_TILT.y), GALAXY_TILT.x);
  // The sun sinks onto the footer's edge as it forms.
  p.y += uSunOffset * smoothstep(0.35, 1.0, uCollapse);
  return p;
}

// Light (blue-sky) theme palette: the three colours that stand out best on
// the teal-blue sky. Every particle keeps its brightness and role; only its
// hue is mapped: orange → gold, red-orange → coral, blue → ice white,
// cream/white → white.
vec3 skyRemap(vec3 c) {
  float m = max(max(c.r, c.g), c.b);
  if (m < 1e-4) return c;
  vec3 h = c / m;
  vec3 gold = vec3(1.0, 0.68, 0.08);
  vec3 coral = vec3(1.0, 0.3, 0.18);
  vec3 ice = vec3(0.86, 0.96, 1.0);
  float sat = 1.0 - min(min(h.r, h.g), h.b);
  float blueness = smoothstep(0.0, 0.35, h.b - h.r);
  vec3 warm = mix(coral, gold, smoothstep(0.12, 0.3, h.g));
  vec3 target = mix(warm, ice, blueness);
  target = mix(vec3(1.0), target, smoothstep(0.15, 0.5, sat));
  // Capped below the point where additive overlap and bloom turn the
  // colours white on the bright sky.
  return target * min(m, 0.8);
}

void main() {
  vec3 A = position;
  vec3 B = aTarget;

  // In the hero, the start point is the particle's live place in the field,
  // so leaving the hero, particles break straight out of the flow.
  float heroVisible = 1.0;
  float heroGlow = 1.0;
  float heroGrow = 1.0;
  float heroLane = 0.7;
  if (uHeroField > 0.5) A = heroField(heroVisible, heroGlow, heroGrow, heroLane);

  // --- per-particle timing ------------------------------------------------
  // Delays blend pure randomness with a coarse noise field, so neighbouring
  // particles tend to peel away (and land) together — organic, not uniform.
  // (Uses the static form position so delays stay fixed in the moving field.)
  float clumpOut = snoise(position * 0.75 + 3.1) * 0.5 + 0.5;
  float clumpIn = snoise(aTarget * 0.75 - 5.3) * 0.5 + 0.5;
  float delayOut = mix(aDelay, clumpOut, 0.55) * OUT_SPREAD;
  float delayIn = IN_START + mix(aRandom, clumpIn, 0.55) * IN_SPREAD;

  // Flowing torus: its live positions replace the static form, so particles
  // land on (and leave from) the moving structure. Delays above use the
  // static positions, so they stay fixed.
  float laneA = 0.0;
  float laneB = 0.0;
  float bandA = 0.0;
  float bandB = 0.0;
  float arcA = 1.0;
  float arcB = 1.0;
  float shellA = 0.0;
  float shellB = 0.0;
  float faceA = 1.0;
  float faceB = 1.0;
  // How We Work solar system: placed live, so it spins and flows.
  vec3 solarCol = vec3(0.0);
  float solarSize = 1.0;
  vec3 sp = vec3(0.0);
  if ((uFlowFrom > 3.5 && uFlowFrom < 4.5) || (uFlowTo > 3.5 && uFlowTo < 4.5)) sp = solarSystem(solarCol, solarSize);
  // About galaxy: placed live, so it turns and streams inward.
  vec3 galaxyCol = vec3(0.0);
  float galaxySize = 1.0;
  vec3 gp = vec3(0.0);
  if (uFlowFrom > 4.5 || uFlowTo > 4.5) gp = galaxy(galaxyCol, galaxySize);
  if (uFlowFrom > 4.5) A = gp;
  else if (uFlowFrom > 3.5) A = sp;
  else if (uFlowFrom > 2.5) A = earthSpin(A, shellA, faceA);
  else if (uFlowFrom > 1.5) A = ringStream(A, laneA, arcA);
  else if (uFlowFrom > 0.5) A = torusFlow(A, bandA);
  if (uFlowTo > 4.5) B = gp;
  else if (uFlowTo > 3.5) B = sp;
  else if (uFlowTo > 2.5) B = earthSpin(B, shellB, faceB);
  else if (uFlowTo > 1.5) B = ringStream(B, laneB, arcB);
  else if (uFlowTo > 0.5) B = torusFlow(B, bandB);

  float outLocal = clamp((uProgress - delayOut) / OUT_LENGTH, 0.0, 1.0);
  float inLocal = clamp((uProgress - delayIn) / IN_LENGTH, 0.0, 1.0);
  float eOut = easeInOutCubic(outLocal);
  float eIn = easeInOutCubic(inLocal);

  // 1 while this particle is out in the field, 0 when it's part of a form.
  float field = eOut * (1.0 - eIn);
  // 1 mid-flight, 0 at rest — drives the extra turbulence along the paths.
  float flight = max(sin(PI * eOut), sin(PI * eIn));

  // --- scatter position ---------------------------------------------------
  // Partly radial from the form, partly random, so the cloud doesn't just
  // inflate from the centre.
  vec3 radial = normalize(A + vec3(1e-4));
  vec3 dir = normalize(mix(radial, aScatterDir, 0.65));
  vec3 S = A * 0.35 + dir * aScatterDistance * uScatter;

  // The cloud slowly swirls and drifts while particles are in it.
  float swirl = uTime * 0.05 * (0.4 + aRandom) * uMotion;
  float cs = cos(swirl);
  float sn = sin(swirl);
  S.xz = mat2(cs, -sn, sn, cs) * S.xz;
  S += flowNoise(S * 0.3 + aNoiseOffset * 0.2 + uTime * 0.04 * uMotion) * 0.5 * uScatter;

  // --- curved trajectories ------------------------------------------------
  float bend = uCurve * (0.4 + aRandom);
  vec3 outPath = mix(A, S, eOut) + sideways(normalize(S - A + 1e-4), aNoiseOffset - PI) * sin(PI * eOut) * bend;
  vec3 pos = mix(outPath, B, eIn) + sideways(normalize(B - S + 1e-4), dir) * sin(PI * eIn) * bend * 0.8;

  // --- noise --------------------------------------------------------------
  // Tiny shimmer at rest, more drift in the field and along the paths. As a
  // particle lands, flight → 0 so it settles and "locks" into the new form.
  float noiseAmp = uFormNoise + (field * 0.35 + flight) * uFieldNoise;
  pos += flowNoise(pos * uNoiseScale + vec3(uTime * 0.2, 0.0, 0.0)) * noiseAmp * uMotion;

  // Gentle breathing of the assembled form.
  float breathe = sin(uTime * 0.55 + pos.y * 1.4) * 0.012 * uMotion * (1.0 - field);
  pos *= 1.0 + breathe;

  // --- pointer push -------------------------------------------------------
  vec3 away = pos - uMouse;
  float dist = length(away);
  float push = 1.0 - smoothstep(0.0, uMouseRadius, dist);
  push *= push;
  pos += (away / max(dist, 1e-4)) * push * uMouseInfluence;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float depth = max(-mvPosition.z, 0.5);
  // Hero: consumed particles shrink and vanish at the void's edge; the effect
  // hands back to normal as particles leave for Services.
  float heroW = uHeroField * (1.0 - eOut);
  float heroSize = mix(1.0, (0.4 + 0.6 * heroVisible) * heroGrow, heroW);
  // Services ring stream: closer to the camera, so slightly larger points.
  float ringNear = step(1.5, uFlowFrom) * step(uFlowFrom, 2.5) * (1.0 - eOut)
                 + step(1.5, uFlowTo) * step(uFlowTo, 2.5) * eIn;
  float earthNear = step(2.5, uFlowFrom) * step(uFlowFrom, 3.5) * (1.0 - eOut)
                  + step(2.5, uFlowTo) * step(uFlowTo, 3.5) * eIn;
  float earthFace = step(2.5, uFlowFrom) * step(uFlowFrom, 3.5) * (1.0 - eOut) > 0.0 ? faceA : faceB;
  // Why halo (torus): particles 50% larger.
  float torusNear = step(0.5, uFlowFrom) * step(uFlowFrom, 1.5) * (1.0 - eOut)
                  + step(0.5, uFlowTo) * step(uFlowTo, 1.5) * eIn;
  // How We Work solar system: size per role (planets, rings, trail, dust).
  float solarW = step(3.5, uFlowFrom) * step(uFlowFrom, 4.5) * (1.0 - eOut)
               + step(3.5, uFlowTo) * step(uFlowTo, 4.5) * eIn;
  float galaxyW = step(4.5, uFlowFrom) * (1.0 - eOut) + step(4.5, uFlowTo) * eIn;
  float size = uSize * aScale * heroSize * mix(1.0, 2.8, ringNear)
             * mix(1.0, mix(0.7, 1.12, earthFace) * 1.6, earthNear)
             * mix(1.0, 1.5, torusNear)
             * mix(1.0, solarSize, solarW)
             * mix(1.0, galaxySize, galaxyW);
  gl_PointSize = clamp(size * uPixelRatio / depth, 1.0, 28.0 * uPixelRatio);

  // Near particles brighter, far ones dimmer; a soft twinkle on top. Spread
  // out, the field has far fewer overlapping points than a form, so it gets a
  // brightness lift to stay clearly visible.
  float depthFade = clamp(1.0 - (depth - uFocusDepth) * 0.2, 0.35, 1.4);
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.8 + aRandom * 2.2) + aRandom * 40.0) * uMotion;
  vColor = aColor * depthFade * twinkle * (1.0 + push * 0.6 + flight * 0.25 + field * 0.6);
  vAlpha = clamp(depthFade, 0.0, 1.0);

  // Flowing torus reads mostly white; each particle keeps a trace of its
  // own orange/blue, so accents travel with the flow.
  float torusW = step(0.5, uFlowFrom) * step(uFlowFrom, 1.5) * (1.0 - eOut)
               + step(0.5, uFlowTo) * step(uFlowTo, 1.5) * eIn;
  if (torusW > 0.001) {
    // Why halo: the Services stream's exact colours and brightness — orange
    // on the inner edge, red-orange band, blue to deep blue outside; pure
    // normalised hues at full brightness (see the Services block below).
    float tFrom = step(0.5, uFlowFrom) * step(uFlowFrom, 1.5) * (1.0 - eOut);
    vec3 th = ringColor(tFrom > 0.0 ? bandA : bandB);
    if (fract(aRandom * 13.0) > 0.97) th = vec3(1.0, 0.86, 0.66);
    th /= max(max(th.r, th.g), max(th.b, 1e-3));
    // Keep the opening calm around the centred content.
    vec2 nd4 = gl_Position.xy / gl_Position.w;
    vec2 d4 = abs(nd4 - uProtect4.xy) / max(uProtect4.zw, vec2(1e-3));
    float box4 = pow(pow(d4.x, 4.0) + pow(d4.y, 4.0), 0.25);
    float protect4 = mix(0.35, 1.0, smoothstep(0.85, 1.15, box4));
    vColor = mix(vColor, th * 0.95 * protect4, torusW);
  }

  // Services ring stream: lane colours (fixed per particle, so they travel
  // with the flow), fading into the dark toward the right and dimmed behind
  // the centred content.
  float ringFrom = step(1.5, uFlowFrom) * step(uFlowFrom, 2.5) * (1.0 - eOut);
  float ringW = ringFrom + step(1.5, uFlowTo) * step(uFlowTo, 2.5) * eIn;
  if (ringW > 0.001) {
    float lane = ringFrom > 0.0 ? laneA : laneB;
    float arcVis = ringFrom > 0.0 ? arcA : arcB;
    // Hue from the particle's band; a few cream highlights.
    vec3 hue = ringColor(min(lane, 1.0));
    if (fract(aRandom * 13.0) > 0.97) hue = vec3(1.0, 0.86, 0.66);
    if (lane > 1.05) hue = ringColor(fract(aRandom * 7.0));  // sparks
    // Keep colours pure: normalise so the strongest channel is 1, then cap
    // the brightness below 1. Anything brighter clips per channel and the
    // tone mapping pulls it toward white — that washed the colours out.
    hue /= max(max(hue.r, hue.g), max(hue.b, 1e-3));
    // Full brightness, evenly across the stream (no depth/twinkle dimming).
    // Kept close to 1: much higher and tone mapping starts whitening.
    float bright = 1.25;
    vec2 nd = gl_Position.xy / gl_Position.w;
    float rightFade = 1.0 - smoothstep(-0.05, 0.5, nd.x);
    vec2 d2 = abs(nd - uProtect2.xy) / max(uProtect2.zw, vec2(1e-3));
    float box2 = pow(pow(d2.x, 4.0) + pow(d2.y, 4.0), 0.25);
    float protect2 = mix(0.45, 1.0, smoothstep(0.85, 1.15, box2));
    vec3 ringOut = hue * bright * rightFade * protect2 * arcVis;
    vColor = mix(vColor, ringOut, ringW);
  }

  // Staffing Earth: mostly white (each particle keeps a trace of its accent),
  // the shell a little dimmer than the planet, dimmed behind the content.
  float earthFrom = step(2.5, uFlowFrom) * step(uFlowFrom, 3.5) * (1.0 - eOut);
  float earthW = earthFrom + step(2.5, uFlowTo) * step(uFlowTo, 3.5) * eIn;
  if (earthW > 0.001) {
    float shell = earthFrom > 0.0 ? shellA : shellB;
    float facing = earthFrom > 0.0 ? faceA : faceB;
    // The far side fades (the shell less so), so the continents facing the
    // viewer read clearly, like the reference.
    float side = mix(mix(0.12, 1.0, facing), mix(0.45, 1.0, facing), shell);
    // Same colours and brightness as the Services stream (ringColor bands,
    // pure normalised hues at 1.25): orange land, red-orange coastlines,
    // blue ocean and haze, blue to deep blue shell, a few cream highlights.
    // Each layer's role comes from its radius band (see forms/earth.ts), so
    // colours stay put on the planet.
    vec3 sp = earthFrom > 0.0 ? position : aTarget;
    float rn = length(sp) / EARTH_R;
    float warm = smoothstep(0.1, 0.9, sin(sp.x * 2.3 + sp.y * 1.7) * 0.5 + sin(sp.z * 3.1 - sp.y * 2.4) * 0.5);
    vec3 ec;
    if (shell > 0.5) {
      ec = ringColor(0.62 + 0.38 * aRandom);                  // shell: blue → deep blue
    } else if (rn < 0.994) {
      ec = ringColor(0.6);                                     // ocean: blue
    } else if (rn < 1.005) {
      ec = ringColor(0.1 + 0.3 * (1.0 - warm));                // land: orange → red-orange
    } else if (rn < 1.015) {
      ec = ringColor(0.44);                                    // coastline: red-orange
    } else {
      ec = ringColor(0.7);                                     // haze: blue
    }
    if (fract(aRandom * 13.0) > 0.97) ec = vec3(1.0, 0.86, 0.66);  // cream highlights
    ec /= max(max(ec.r, ec.g), max(ec.b, 1e-3));
    ec *= 1.25 * side;
    vec2 nd3 = gl_Position.xy / gl_Position.w;
    vec2 d3 = abs(nd3 - uProtect3.xy) / max(uProtect3.zw, vec2(1e-3));
    float box3 = pow(pow(d3.x, 4.0) + pow(d3.y, 4.0), 0.25);
    float protect3 = mix(0.4, 1.0, smoothstep(0.85, 1.15, box3));
    vColor = mix(vColor, ec * mix(1.0, 0.75, shell) * protect3, earthW);
  }

  // How We Work solar system: its own colours (see solarSystem), a soft
  // twinkle, dimmed behind the centred step content.
  if (solarW > 0.001) {
    vec2 nd5 = gl_Position.xy / gl_Position.w;
    vec2 d5 = abs(nd5 - uProtect5.xy) / max(uProtect5.zw, vec2(1e-3));
    float box5 = pow(pow(d5.x, 4.0) + pow(d5.y, 4.0), 0.25);
    float protect5 = mix(0.3, 1.0, smoothstep(0.85, 1.15, box5));
    vColor = mix(vColor, solarCol * twinkle * protect5, solarW);
  }

  // About galaxy: its own colours (see galaxy) and a soft twinkle. No dark
  // boxes behind text: the whole galaxy is dimmed evenly instead (in
  // galaxy()), and the text over it is brighter (globals.css).
  if (galaxyW > 0.001) {
    vColor = mix(vColor, galaxyCol * twinkle, galaxyW);
  }

  // Hero: keep the centred text calm — particles projected behind it dim.
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 dp = abs(ndc - uProtect.xy) / max(uProtect.zw, vec2(1e-3));
  float box = pow(pow(dp.x, 4.0) + pow(dp.y, 4.0), 0.25);
  float protect = mix(uProtectFloor, 1.0, smoothstep(0.85, 1.2, box));
  // Same palette and brightness rules as the other forms (see the Services
  // block): ringColor bands as pure hues, brightness from the glow but
  // capped at 1.25 so tone mapping never washes it white; a few cream
  // highlights.
  // Hero colours: exactly the other forms' palette (ringColor bands —
  // orange, red-orange, blue, deep blue) with the same cream highlights.
  vec3 heroHue = ringColor(heroLane);
  if (fract(aRandom * 13.0) > 0.97) heroHue = vec3(1.0, 0.86, 0.66);
  heroHue /= max(max(heroHue.r, heroHue.g), max(heroHue.b, 1e-3));
  // Same brightness ceiling as the Services ring and the Earth (1.25).
  float heroBright = min(0.3 + 0.4 * heroGlow, 1.25);
  vColor = mix(vColor, heroHue * heroBright * twinkle * heroVisible * protect, heroW);
  vAlpha *= mix(1.0, heroVisible, heroW);

  // Light theme: remap to the blue-sky palette (see skyRemap).
  if (uSkyTheme > 0.5) vColor = skyRemap(vColor);
}
