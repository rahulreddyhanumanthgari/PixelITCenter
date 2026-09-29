// Ambient star field: tiny, dim points floating in a deep volume behind the
// main particles. Shares particle.frag.glsl with the main system.

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;     // 1 = full motion, small under reduced motion
uniform vec2 uPointer;     // eased pointer, -1..1 (0 when inactive)
uniform float uField;      // 0..1, how scattered the main particles are right now
uniform float uGravity;    // 0..1, About Us gravity well strength
uniform vec2 uGravityCenter;
uniform float uSwirl;      // accumulated swirl time (advances only under gravity)

attribute vec3 aColor;
attribute float aRandom;
attribute float aScale;
attribute float aDepth;    // 0 near … 1 far
attribute float aTraveler; // 0 = ambient; 1, 2 = the rare travellers

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 pos = position;
  float phase = aRandom * 6.2831;
  float nearness = 1.0 - aDepth;

  // Very slow floating: each point drifts on its own small loop, and the
  // whole volume creeps sideways and toward the camera almost imperceptibly.
  pos.x += sin(uTime * 0.035 + phase) * (0.25 + nearness * 0.2) * uMotion;
  pos.y += cos(uTime * 0.03 + phase * 1.3) * (0.18 + nearness * 0.15) * uMotion;
  pos.z += sin(uTime * 0.02 + phase * 0.7) * 0.4 * uMotion;
  pos.x += uTime * 0.012 * uMotion * (0.3 + nearness);

  // Parallax: near points shift a little more than far ones.
  pos.xy -= uPointer * (0.08 + nearness * 0.35) * uMotion;

  // Gravity (About Us): the same stars bend around the invisible centre —
  // they swirl, faster nearer the centre, and are drawn slightly inward.
  if (uGravity > 0.001 && aTraveler < 0.5) {
    vec2 rel = pos.xy - uGravityCenter;
    float d = length(rel);
    float ang = uSwirl * 0.06 / (0.5 + d * 0.12) + uGravity * 0.35 / (1.0 + d * 0.25);
    float c = cos(ang);
    float s = sin(ang);
    rel = mat2(c, s, -s, c) * rel;
    rel *= 1.0 - uGravity * 0.12 / (1.0 + d * 0.15);
    pos.xy = uGravityCenter + rel;
  }

  // Traveller: one slightly larger point occasionally drifts in from deep in
  // the field, passes by and recedes. The two travellers alternate, so at
  // most one is ever moving; otherwise they are invisible.
  float travel = 0.0;
  if (aTraveler > 0.5) {
    float period = 26.0;
    float cycle = fract(uTime / period + (aTraveler - 1.0) * 0.5);
    float t = clamp(cycle / 0.45, 0.0, 1.0);
    travel = sin(3.14159265 * t) * step(cycle, 0.45);
    float side = aTraveler > 1.5 ? -1.0 : 1.0;
    pos = vec3(side * mix(1.5, 5.5, t), mix(-1.2, 1.6, t) * side, mix(-24.0, 1.5, sin(1.5707963 * t)));
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = max(uSize * aScale * (1.0 + travel * 1.2) * uPixelRatio / -mvPosition.z, 1.0);

  // Far = dimmer. The field lifts a little while the main object is
  // scattered, so the space reads through the transition.
  float depthDim = mix(1.0, 0.45, aDepth);
  float twinkle = 0.7 + 0.3 * sin(uTime * (0.3 + aRandom * 0.8) + phase * 7.0) * uMotion;
  vColor = aColor * depthDim * twinkle * (1.0 + uField * 0.7);
  vAlpha = 1.0;
  if (aTraveler > 0.5) {
    vColor = vec3(0.95, 0.96, 1.0) * travel * 0.9 * uMotion;
    vAlpha = travel;
  }
}
