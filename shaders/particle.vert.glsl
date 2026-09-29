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
uniform float uStage;           // process progress: 0 = Discover active … 4 = all done
uniform float uStageMix;        // 0 = no stage effects, 1 = fully on (process form)
uniform vec3 uAccent;           // rocket accent, for active checkpoints
uniform float uFlowFrom;        // live form being left: 0 none, 1 torus (Why), 2 ring stream (Services)
uniform float uFlowTo;          // live form being arrived at (same codes)
uniform vec4 uProtect2;         // Services content box in NDC (dims the ring stream behind text)
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
attribute vec2 aStage;          // (stage position, isNode) on the process form
attribute vec3 aStageCenter;    // checkpoint centre (checkpoint particles only)

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

vec3 heroField(out float visible, out float glow, out float grow) {
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
    float omega = 0.55 * pow(r0, -1.5) * (0.85 + aDelay * 0.3);
    r = r0;
    th = h5 * 6.2831853 + t * omega;
    // About a third of the disc is falling in: spiral from its orbit to just
    // inside the void edge, faster and tighter, then vanish; re-enter at the
    // rim (never inside the core) as the cycle wraps.
    if (role < 0.5 && h3 < 0.35) {
      float life = fract(t / (18.0 + aRandom * 26.0) + aDelay);
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
  } else if (role < 2.5) {
    // Streams: three curved arms (log spirals) flowing inward toward the disc.
    float arm = floor(h4 * 3.0);
    float s = fract(h5 - t / (40.0 + aRandom * 30.0));
    r = HERO_VOID * (HERO_DISC_OUT + s * 3.2);
    th = arm * 2.0943951 + 1.9 * log(r) + (aScatterDir.x * 0.22 + aScatterDir.z * 0.1) * (0.6 + s) + t * 0.1;
    y = aScatterDir.y * 0.18 * r;
    visible = smoothstep(0.0, 0.08, s) * (1.0 - smoothstep(0.85, 1.0, s));
    glow = 1.0;
  } else {
    // Outer space: sparse, dim, slow.
    r = HERO_VOID * (HERO_DISC_OUT + 0.4 + h4 * 4.0);
    th = h5 * 6.2831853 + t * 0.03;
    y = aScatterDir.y * 0.5 * r;
    glow = 0.3;
    grow = 0.7;
  }
  vec3 p = vec3(cos(th) * r, y, sin(th) * r);
  return rotX(p, aScatterDir.x * 0.04);
}

// --- Why Pixel IT Center: particles flowing through a thick torus ----------
// Recovers a particle's torus coordinates from its (untilted) form position,
// moves it around the ring (major orbit) and around the tube (minor orbit),
// then tilts the whole torus, which slowly precesses. Pure function of time:
// no resets. Keep TORUS_R / TORUS_r in sync with TORUS_FLOW (torusFlow.ts).
const float TORUS_R = 1.3;

vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }

vec3 torusFlow(vec3 p) {
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
  v += t * 0.22;
  u += t * (0.09 + 0.035 * cos(v)) + 0.01 * sin(t * 0.6 + seed);
  rt *= 1.0 + 0.012 * sin(t * 0.9 + seed * 1.3);
  float dd = TORUS_R + rt * cos(v);
  vec3 f = vec3(cos(u) * dd, rt * sin(v), sin(u) * dd);
  // Seen at an angle like the reference; the tilt slowly precesses.
  f = rotX(f, 0.78 + 0.12 * sin(t * 0.07));
  f = rotZ(f, 0.55 + 0.1 * sin(t * 0.05 + 1.3));
  return rotY(f, -0.35 + 0.08 * sin(t * 0.04));
}

// --- Services: a huge ring of particle streams ------------------------------
// The ring's centre is off-screen left; only its arc crosses the view. Each
// particle keeps its lane and flows along it (inner lanes faster), sweeping
// up from the lower left, round, and back to the upper left. Keep RING_* in
// sync with RING_STREAM (ringStream.ts).
const float RING_CX = -3.4;
const float RING_IN = 2.0;
const float RING_OUT = 6.2;

vec3 ringStream(vec3 p, out float lane) {
  float t = uTime * uMotion;
  vec2 rel = vec2(p.x - RING_CX, p.z);
  float r = length(rel);
  float a = atan(rel.y, rel.x);
  lane = p.y > 0.3 ? 1.1 : clamp((r - RING_IN) / (RING_OUT - RING_IN), 0.0, 1.0);
  // Flow: near side (bottom) round the right to the far side (top).
  a -= t * 0.16 * pow(r / RING_IN, -1.2) * (0.9 + 0.2 * aRandom);
  float y = p.y + 0.02 * sin(t * 0.8 + aRandom * 30.0);
  vec3 f = vec3(cos(a) * r, y, sin(a) * r);
  // Tilt the ring toward the viewer so near lanes arc below, far lanes above.
  f = rotX(f, 0.52);
  f.x += RING_CX;
  return f;
}

// Lane colours, from the reference: inner cream, orange, red; outer blue to
// deep navy. Orange / blue / white are the site palette (linear); the red is
// taken from the reference image.
vec3 ringColor(float lane) {
  vec3 cream = vec3(0.98, 0.86, 0.66);
  vec3 orange = vec3(1.0, 0.195, 0.028);
  vec3 red = vec3(0.8, 0.04, 0.012);
  vec3 blue = vec3(0.043, 0.2, 1.0);
  vec3 navy = vec3(0.012, 0.035, 0.16);
  vec3 c = mix(cream, orange, smoothstep(0.08, 0.26, lane));
  c = mix(c, red, smoothstep(0.26, 0.4, lane));
  c = mix(c, blue, smoothstep(0.42, 0.56, lane));
  return mix(c, navy, smoothstep(0.72, 1.0, lane));
}

void main() {
  vec3 A = position;
  vec3 B = aTarget;

  // In the hero, the start point is the particle's live place in the field,
  // so leaving the hero, particles break straight out of the flow.
  float heroVisible = 1.0;
  float heroGlow = 1.0;
  float heroGrow = 1.0;
  if (uHeroField > 0.5) A = heroField(heroVisible, heroGlow, heroGrow);

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
  if (uFlowFrom > 1.5) A = ringStream(A, laneA);
  else if (uFlowFrom > 0.5) A = torusFlow(A);
  if (uFlowTo > 1.5) B = ringStream(B, laneB);
  else if (uFlowTo > 0.5) B = torusFlow(B);

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

  // --- process stages -----------------------------------------------------
  // Only on the final process form (uStageMix). A node is active while the
  // progress is within its step, completed after it; path particles light up
  // once the progress front has passed them, and a bright stream (the front)
  // travels along the path from one stage to the next.
  float q = aStage.x;
  float isNode = aStage.y;
  float passed = smoothstep(q - 0.04, q + 0.04, uStage);
  float nodeOn = isNode * smoothstep(q - 0.06, q + 0.02, uStage);
  float nodeDone = isNode * smoothstep(q + 0.86, q + 0.97, uStage);
  float nodeActive = nodeOn * (1.0 - nodeDone);
  // The stream only carries energy while moving between checkpoints: it
  // fades out as a checkpoint is reached and settles at the end.
  float energy = sin(3.14159265 * fract(uStage)) * step(uStage, 3.999);
  float front = (1.0 - isNode) * exp(-pow((q - uStage) / 0.09, 2.0)) * energy;
  // A small wave passes through a checkpoint the moment it is reached.
  float hit = isNode * exp(-pow((uStage - q) / 0.07, 2.0));
  // Active checkpoints grow a little (~115%) about their own centre.
  vec3 fromCenter = pos - aStageCenter;
  pos += fromCenter * (0.15 * nodeActive + 0.1 * hit) * uStageMix * isNode;
  pos += 0.012 * nodeActive * uStageMix * uMotion * vec3(
    sin(uTime * 1.4 + aNoiseOffset.x),
    cos(uTime * 1.2 + aNoiseOffset.y),
    sin(uTime * 1.6 + aNoiseOffset.z)
  );
  float pathLevel = mix(0.3, 0.75, passed) + front * 0.9;
  float nodeLevel = mix(0.4, 0.95, nodeDone) + nodeActive * 0.4 + hit * 0.5;
  float stageLevel = mix(1.0, mix(pathLevel, nodeLevel, isNode), uStageMix);
  float stageSize = mix(1.0, 1.0 + nodeActive * 0.12 + front * 0.2, uStageMix);
  float stageAccent = uStageMix * (isNode * (nodeActive * 0.4 + hit * 0.3) + front * 0.25);

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
  float size = uSize * aScale * stageSize * heroSize;
  gl_PointSize = clamp(size * uPixelRatio / depth, 1.0, 28.0 * uPixelRatio);

  // Near particles brighter, far ones dimmer; a soft twinkle on top. Spread
  // out, the field has far fewer overlapping points than a form, so it gets a
  // brightness lift to stay clearly visible.
  float depthFade = clamp(1.0 - (depth - uFocusDepth) * 0.2, 0.35, 1.4);
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.8 + aRandom * 2.2) + aRandom * 40.0) * uMotion;
  vColor = aColor * depthFade * twinkle * (1.0 + push * 0.6 + flight * 0.25 + field * 0.6) * stageLevel;
  vColor = mix(vColor, uAccent * length(vColor) * 0.75, clamp(stageAccent, 0.0, 0.6));
  vAlpha = clamp(depthFade, 0.0, 1.0);

  // Flowing torus reads mostly white; each particle keeps a trace of its
  // own orange/blue, so accents travel with the flow.
  float torusW = step(0.5, uFlowFrom) * step(uFlowFrom, 1.5) * (1.0 - eOut)
               + step(0.5, uFlowTo) * step(uFlowTo, 1.5) * eIn;
  float lum = dot(vColor, vec3(0.3, 0.5, 0.2));
  vColor = mix(vColor, vec3(0.95, 0.96, 1.0) * lum * 1.15, 0.58 * torusW);

  // Services ring stream: lane colours (fixed per particle, so they travel
  // with the flow), fading into the dark toward the right and dimmed behind
  // the centred content.
  float ringFrom = step(1.5, uFlowFrom) * (1.0 - eOut);
  float ringW = ringFrom + step(1.5, uFlowTo) * eIn;
  if (ringW > 0.001) {
    float lane = ringFrom > 0.0 ? laneA : laneB;
    vec3 rc = ringColor(min(lane, 1.0)) * (0.75 + 0.6 * aRandom);
    if (lane > 1.05) rc = mix(vec3(0.95, 0.96, 1.0), ringColor(aRandom * 0.6), step(0.5, fract(aRandom * 7.0)));
    vec2 nd = gl_Position.xy / gl_Position.w;
    float rightFade = 1.0 - smoothstep(0.1, 0.75, nd.x);
    vec2 d2 = abs(nd - uProtect2.xy) / max(uProtect2.zw, vec2(1e-3));
    float box2 = pow(pow(d2.x, 4.0) + pow(d2.y, 4.0), 0.25);
    float protect2 = mix(0.45, 1.0, smoothstep(0.85, 1.15, box2));
    vec3 ringOut = rc * depthFade * twinkle * rightFade * protect2 * 2.3;
    vColor = mix(vColor, ringOut, ringW);
  }

  // Hero: keep the centred text calm — particles projected behind it dim.
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 dp = abs(ndc - uProtect.xy) / max(uProtect.zw, vec2(1e-3));
  float box = pow(pow(dp.x, 4.0) + pow(dp.y, 4.0), 0.25);
  float protect = mix(uProtectFloor, 1.0, smoothstep(0.85, 1.2, box));
  vColor *= mix(1.0, heroGlow * heroVisible * protect, heroW);
  vAlpha *= mix(1.0, heroVisible, heroW);
}
