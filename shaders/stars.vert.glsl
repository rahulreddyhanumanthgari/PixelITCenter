// Faint background stars: tiny, dim, drifting very slowly.
// Shares particle.frag.glsl with the sculpture.

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;

attribute vec3 aColor;
attribute float aRandom;
attribute float aScale;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 pos = position;
  float phase = aRandom * 6.2831;
  pos.x += sin(uTime * 0.03 + phase) * 0.35 * uMotion;
  pos.y += cos(uTime * 0.025 + phase) * 0.25 * uMotion;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = max(uSize * aScale * uPixelRatio / -mvPosition.z, 1.0);

  float twinkle = 0.65 + 0.35 * sin(uTime * (0.4 + aRandom) + phase * 7.0) * uMotion;
  vColor = aColor * twinkle;
  vAlpha = 1.0;
}
