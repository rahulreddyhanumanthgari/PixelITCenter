// About Us gravitational vortex. Particles orbit an invisible centre; the
// infallers spiral inward over their lifetime, accelerate, and are consumed
// at the event horizon, then re-enter from the outer field. Everything is a
// function of time, so the flow is continuous with no CPU work per particle.
// Shares particle.frag.glsl with the other particle systems.

uniform float uTime;
uniform float uEnter;        // 0 = deep in space … 1 = established
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;       // 1 = full motion, small under reduced motion
uniform float uFocusDepth;
uniform vec2 uPointer;       // eased pointer, -1..1
uniform vec4 uProtect;       // content box in NDC: centre xy, half-size zw
uniform float uProtectFloor; // brightness left behind the content
uniform vec3 uAccent;

attribute float aR0;
attribute float aAngle;
attribute float aOmega;
attribute float aRate;
attribute float aPhase;
attribute float aHeight;
attribute float aRandom;
attribute float aScale;
attribute float aWarm;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

const float HORIZON = 0.42;  // radius where particles are consumed

void main() {
  bool infaller = aRate > 0.0;
  float life = infaller ? fract(uTime * aRate * uMotion + aPhase) : 0.0;

  // Radius falls slowly at first, then fast: the pull accelerates inward.
  float rn = infaller ? pow(1.0 - life, 0.55) : 1.0;
  float r = aR0 * rn;
  float inflow = 1.0 - rn;

  // Orbit + a twist that grows as the particle falls in, so its path curves
  // ever more tightly around the centre.
  float th = aAngle + uTime * aOmega * uMotion + 1.6 * inflow / (rn + 0.2);
  r *= 1.0 + 0.02 * sin(uTime * 0.4 * uMotion + aRandom * 30.0);
  float y = aHeight * (0.35 + 0.65 * rn) + 0.04 * sin(uTime * 0.3 * uMotion + aRandom * 20.0);
  // Pointer: a faint ripple through the field.
  y += 0.06 * (uPointer.x * sin(th) - uPointer.y * cos(th)) * uMotion;
  vec3 pos = vec3(cos(th) * r, y, sin(th) * r);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  // Entrance: the field starts deep in space and moves into place, staggered.
  float local = clamp((uEnter - aRandom * 0.4) / 0.6, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - local, 3.0);
  mv.z -= (1.0 - e) * (6.0 + aRandom * 8.0);

  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.5);

  // Event horizon: particles shrink and vanish as they reach the centre.
  float horizon = smoothstep(HORIZON * 0.25, HORIZON, r);
  // New particles ease in at the outer edge when their life cycle wraps.
  float birth = infaller ? smoothstep(0.0, 0.05, life) : 1.0;

  float size = uSize * aScale * (0.45 + 0.55 * horizon) * (1.0 + inflow * 0.3);
  gl_PointSize = clamp(size * uPixelRatio / depth, 1.0, 20.0 * uPixelRatio);

  // Keep the text calm: particles projected behind the content are dimmed.
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 d = abs(ndc - uProtect.xy) / max(uProtect.zw, vec2(1e-3));
  float box = pow(pow(d.x, 4.0) + pow(d.y, 4.0), 0.25);
  float protect = mix(uProtectFloor, 1.0, smoothstep(0.85, 1.2, box));

  // Brighter and a touch warmer as they fall in; far = dimmer.
  float depthFade = clamp(1.0 - (depth - uFocusDepth) * 0.2, 0.3, 1.35);
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.6 + aRandom * 1.8) + aRandom * 40.0) * uMotion;
  vec3 color = mix(aColor, uAccent * length(aColor) * 0.8, aWarm * inflow * inflow * 0.6);
  float level = (1.6 + inflow * 1.4) * horizon * birth * depthFade * twinkle * protect;
  vColor = color * level * mix(0.2, 1.0, e);
  vAlpha = mix(0.3, 1.0, e) * horizon * birth;
}
