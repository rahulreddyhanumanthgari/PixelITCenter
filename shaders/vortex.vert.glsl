// About Us: a spiral galaxy seen almost face-on (see lib/particles/vortex.ts).
// Same point size rule, depth fade and twinkle as particle.vert.glsl; colours
// are the site palette (cream core → orange → red-orange → blue rim), as pure
// hues at controlled brightness so tone mapping never washes them white.
// Shares particle.frag.glsl.

uniform float uTime;
uniform float uEnter;        // 0 = not formed … 1 = galaxy established
uniform float uSize;         // = the journey particle size
uniform float uPixelRatio;
uniform float uMotion;       // 1 = full motion, small under reduced motion
uniform float uFocusDepth;
uniform vec2 uPointer;       // eased pointer, -1..1
uniform vec4 uProtect;       // content box in NDC: centre xy, half-size zw
uniform float uProtectFloor; // brightness left behind the content

attribute float aKind;       // 0 arm, 1 core, 2 field
attribute float aArm;        // arm base angle (core/field: start angle)
attribute float aLane;       // offset across the arm (strands)
attribute float aRate;       // arm: fall cycles per second
attribute float aPhase;
attribute float aHeight;
attribute float aRandom;
attribute float aScale;

varying vec3 vColor;
varying float vAlpha;

const float OUTER = 3.9;     // = VORTEX.outer
const float CORE = 0.34;     // core radius
const float WIND = 2.7;      // arm winding: radians per e-fold of radius
const float SPIN = 0.045;    // pattern rotation (rad/s)

const vec3 CREAM = vec3(1.0, 0.9, 0.76);
const vec3 ORANGE = vec3(1.0, 0.32, 0.05);
const vec3 RED = vec3(1.0, 0.09, 0.02);
const vec3 BLUE = vec3(0.07, 0.26, 1.0);
const vec3 DEEP = vec3(0.04, 0.1, 0.62);

void main() {
  float t = uTime * uMotion;
  float r;
  float th;
  float vis = 1.0;

  if (aKind < 0.5) {
    // Arm: fall from the rim to the core along the (trailing) spiral, so the
    // arms keep their shape while particles swirl inward.
    float life = fract(t * aRate + aPhase);
    float rn = 1.0 - life;
    r = mix(CORE * 0.55, OUTER * 1.1, rn);
    th = aArm - WIND * log(r / CORE) + aLane * (0.1 + 0.38 * rn) + t * SPIN;
    // Born softly at the rim, consumed at the core.
    vis = smoothstep(0.0, 0.05, life) * smoothstep(CORE * 0.55, CORE * 1.15, r);
  } else if (aKind < 1.5) {
    // Core: a dense disc, faster toward the centre, slightly wound.
    r = CORE * 1.15 * pow(aPhase, 0.75);
    th = aArm + t * (0.12 + 0.3 * (1.0 - r / CORE)) - 1.5 * log(r / CORE + 0.05);
  } else {
    // Field: sparse points drifting slowly between the arms.
    r = OUTER * 1.15 * sqrt(aPhase);
    th = aArm + t * SPIN * 0.7;
  }

  float rn = r / OUTER;
  vec3 pos = vec3(cos(th) * r, aHeight * (0.4 + rn), sin(th) * r);
  // Pointer: a faint ripple through the disc.
  pos.y += 0.05 * (uPointer.x * sin(th) - uPointer.y * cos(th)) * uMotion;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  // Entering About: particles settle in from depth as the section arrives.
  float local = clamp((uEnter - aRandom * 0.4) / 0.6, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - local, 3.0);
  mvPosition.z -= (1.0 - e) * (6.0 + aRandom * 8.0);
  gl_Position = projectionMatrix * mvPosition;

  float depth = max(-mvPosition.z, 0.5);
  float size = uSize * aScale * (aKind < 0.5 ? 1.35 : aKind < 1.5 ? 1.5 : 1.0);
  gl_PointSize = clamp(size * uPixelRatio / depth, 1.0, 28.0 * uPixelRatio);

  // Colour: radial palette, like the reference's white core and warm arms,
  // in the site's colours; a few cream sparkles through the arms.
  vec3 c = mix(CREAM, ORANGE, smoothstep(0.1, 0.3, rn));
  c = mix(c, RED, smoothstep(0.45, 0.62, rn));
  c = mix(c, BLUE, smoothstep(0.66, 0.82, rn));
  c = mix(c, DEEP, smoothstep(0.88, 1.08, rn));
  float level;
  if (aKind < 0.5) {
    // Strands brighter than the diffuse share; arms fade out at the rim.
    level = (abs(aLane) > 1.2 ? 0.6 : 1.15) * (1.0 - 0.5 * smoothstep(0.8, 1.1, rn));
    if (aRandom > 0.97) { c = CREAM; level = 1.2; }
  } else if (aKind < 1.5) {
    c = mix(CREAM, ORANGE, smoothstep(0.55, 1.0, r / CORE) * 0.5);
    level = 1.25;
  } else {
    c = aRandom > 0.8 ? CREAM : mix(BLUE, DEEP, aRandom);
    level = 0.35;
  }

  // Calm centre: particles projected behind the content are dimmed.
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 d = abs(ndc - uProtect.xy) / max(uProtect.zw, vec2(1e-3));
  float box = pow(pow(d.x, 4.0) + pow(d.y, 4.0), 0.25);
  float protect = mix(uProtectFloor, 1.0, smoothstep(0.85, 1.2, box));

  float depthFade = clamp(1.0 - (depth - uFocusDepth) * 0.2, 0.35, 1.4);
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.8 + aRandom * 2.2) + aRandom * 40.0) * uMotion;
  vColor = c * level * twinkle * vis * protect;
  vAlpha = clamp(depthFade, 0.0, 1.0) * vis * e;
}
