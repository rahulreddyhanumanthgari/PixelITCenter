// About Us: the journey particles under gravity. Appearance deliberately
// matches particle.vert.glsl (same point size rule, depth fade, twinkle and
// colours); only the motion is different. Shares particle.frag.glsl.

uniform float uTime;
uniform float uEnter;        // 0 = gravity off … 1 = field established
uniform float uSize;         // = the journey particle size
uniform float uPixelRatio;
uniform float uMotion;       // 1 = full motion, small under reduced motion
uniform float uFocusDepth;
uniform vec2 uPointer;       // eased pointer, -1..1
uniform vec4 uProtect;       // content box in NDC: centre xy, half-size zw
uniform float uProtectFloor; // brightness left behind the content

attribute float aR0;
attribute float aAngle;
attribute float aOmega;
attribute float aRate;
attribute float aPhase;
attribute float aHeight;
attribute float aIncline;
attribute float aNode;
attribute float aRandom;
attribute float aScale;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

const float HORIZON = 0.45;  // radius where particles are consumed
const float ARRIVAL = 0.14;  // share of an infaller's life spent arriving

vec3 rotateX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
vec3 rotateY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }

void main() {
  bool infaller = aRate > 0.0;
  float life = infaller ? fract(uTime * aRate * uMotion + aPhase) : 0.0;

  // Arrival: an infaller first drifts in from deep space behind the field…
  float arrive = infaller ? smoothstep(0.0, ARRIVAL, life) : 1.0;
  // …then its radius falls slowly, then fast: the pull accelerates inward.
  float fall = infaller ? clamp((life - ARRIVAL) / (1.0 - ARRIVAL), 0.0, 1.0) : 0.0;
  float rn = pow(1.0 - fall, 0.55);
  float inflow = 1.0 - rn;
  float r = aR0 * rn * (1.0 + 0.02 * sin(uTime * 0.4 * uMotion + aRandom * 30.0));

  // Orbit, with a twist that tightens the curve as the particle falls in.
  float th = aAngle + uTime * aOmega * uMotion + 1.6 * inflow / (rn + 0.2);
  vec3 pos = vec3(cos(th) * r, aHeight * (0.35 + 0.65 * rn), sin(th) * r);
  // Each orbit leans its own way; the lean flattens near the centre.
  pos = rotateY(rotateX(pos, aIncline * rn), aNode);
  // Arriving particles come up from deep behind the field (-y faces away).
  pos.y -= (1.0 - arrive) * (7.0 + aRandom * 6.0);
  // Pointer: a faint ripple through the field.
  pos.y += 0.05 * (uPointer.x * sin(th) - uPointer.y * cos(th)) * uMotion;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  // Entering About: gravity takes hold of particles drifting in from depth.
  float local = clamp((uEnter - aRandom * 0.4) / 0.6, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - local, 3.0);
  mvPosition.z -= (1.0 - e) * (6.0 + aRandom * 8.0);
  gl_Position = projectionMatrix * mvPosition;

  float depth = max(-mvPosition.z, 0.5);
  // Consumed: shrink and vanish at the centre. Slightly larger and brighter
  // on the way in — the same subtle emphasis the journey particles use.
  float horizon = smoothstep(HORIZON * 0.25, HORIZON, r);
  float size = uSize * aScale * (0.4 + 0.6 * horizon) * (1.0 + inflow * 0.25);
  gl_PointSize = clamp(size * uPixelRatio / depth, 1.0, 28.0 * uPixelRatio);

  // Calm centre: particles projected behind the content are dimmed.
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 d = abs(ndc - uProtect.xy) / max(uProtect.zw, vec2(1e-3));
  float box = pow(pow(d.x, 4.0) + pow(d.y, 4.0), 0.25);
  float protect = mix(uProtectFloor, 1.0, smoothstep(0.85, 1.2, box));

  // Same brightness rules as the journey particles.
  float depthFade = clamp(1.0 - (depth - uFocusDepth) * 0.2, 0.35, 1.4);
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.8 + aRandom * 2.2) + aRandom * 40.0) * uMotion;
  vColor = aColor * depthFade * twinkle * (1.0 + inflow * 0.3) * horizon * protect;
  vAlpha = clamp(depthFade, 0.0, 1.0) * horizon * e;
}
