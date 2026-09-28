// Ambient star field: tiny, dim points floating in a deep volume behind the
// main particles. Shares particle.frag.glsl with the main system.

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;     // 1 = full motion, small under reduced motion
uniform vec2 uPointer;     // eased pointer, -1..1 (0 when inactive)
uniform float uField;      // 0..1, how scattered the main particles are right now

attribute vec3 aColor;
attribute float aRandom;
attribute float aScale;
attribute float aDepth;    // 0 near … 1 far

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

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = max(uSize * aScale * uPixelRatio / -mvPosition.z, 1.0);

  // Far = dimmer. The field lifts a little while the main object is
  // scattered, so the space reads through the transition.
  float depthDim = mix(1.0, 0.45, aDepth);
  float twinkle = 0.7 + 0.3 * sin(uTime * (0.3 + aRandom * 0.8) + phase * 7.0) * uMotion;
  vColor = aColor * depthDim * twinkle * (1.0 + uField * 0.7);
  vAlpha = 1.0;
}
