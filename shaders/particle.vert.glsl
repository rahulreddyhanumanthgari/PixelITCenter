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

void main() {
  vec3 A = position;
  vec3 B = aTarget;

  // --- per-particle timing ------------------------------------------------
  // Delays blend pure randomness with a coarse noise field, so neighbouring
  // particles tend to peel away (and land) together — organic, not uniform.
  float clumpOut = snoise(A * 0.75 + 3.1) * 0.5 + 0.5;
  float clumpIn = snoise(B * 0.75 - 5.3) * 0.5 + 0.5;
  float delayOut = mix(aDelay, clumpOut, 0.55) * OUT_SPREAD;
  float delayIn = IN_START + mix(aRandom, clumpIn, 0.55) * IN_SPREAD;

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
  float size = uSize * aScale * stageSize;
  gl_PointSize = clamp(size * uPixelRatio / depth, 1.0, 28.0 * uPixelRatio);

  // Near particles brighter, far ones dimmer; a soft twinkle on top. Spread
  // out, the field has far fewer overlapping points than a form, so it gets a
  // brightness lift to stay clearly visible.
  float depthFade = clamp(1.0 - (depth - uFocusDepth) * 0.2, 0.35, 1.4);
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.8 + aRandom * 2.2) + aRandom * 40.0) * uMotion;
  vColor = aColor * depthFade * twinkle * (1.0 + push * 0.6 + flight * 0.25 + field * 0.6) * stageLevel;
  vColor = mix(vColor, uAccent * length(vColor) * 0.75, clamp(stageAccent, 0.0, 0.6));
  vAlpha = clamp(depthFade, 0.0, 1.0);
}
