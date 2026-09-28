// About Us orbit: particles circling a large, slightly organic 3D ring.
// Shares particle.frag.glsl with the other particle systems.

uniform float uTime;
uniform float uEnter;       // 0 = scattered deep in space … 1 = formed
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;      // 1 = full motion, small under reduced motion
uniform float uFocusDepth;
uniform vec2 uPointer;      // eased pointer, -1..1

attribute float aAngle;
attribute float aRadius;
attribute float aHeight;
attribute float aSpeed;
attribute float aRandom;
attribute float aScale;
attribute float aTravel;
attribute vec3 aColor;
attribute vec3 aScatter;

varying vec3 vColor;
varying float vAlpha;

#define PI 3.141592653589793

void main() {
  // Travel along the ring.
  float th = aAngle + uTime * aSpeed * uMotion;
  // Organic warps: the ring bends gently out of its plane and breathes.
  float warp = 0.12 * sin(2.0 * th + 0.8) + 0.05 * sin(5.0 * th + uTime * 0.2 * uMotion);
  float r = aRadius * (1.0 + 0.015 * sin(3.0 * th - uTime * 0.3 * uMotion));
  // Pointer: a very slight ripple across the ring.
  float ripple = 0.05 * (uPointer.x * sin(th) + uPointer.y * cos(th)) * uMotion;
  vec3 pos = vec3(cos(th) * r, aHeight + warp + ripple, sin(th) * r);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  // A rare few particles leave the ring toward the viewer and return.
  float boost = 0.0;
  if (aTravel > 0.5) {
    float period = 14.0 + aRandom * 10.0;
    float phase = fract(uTime * uMotion / period + aRandom);
    float t = clamp(phase / 0.35, 0.0, 1.0);
    boost = sin(PI * t) * step(phase, 0.35);
    mv.z += boost * 3.2;
    mv.x += boost * 0.4 * sin(aRandom * 20.0);
  }

  // Entrance: gather from deep space, staggered per particle.
  float local = clamp((uEnter - aRandom * 0.4) / 0.6, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - local, 3.0);
  mv.xyz += aScatter * (1.0 - e);

  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.5);
  gl_PointSize = clamp(uSize * aScale * (1.0 + boost * 0.8) * uPixelRatio / depth, 1.0, 20.0 * uPixelRatio);

  // Near brighter, far dimmer; faint twinkle.
  float depthFade = clamp(1.0 - (depth - uFocusDepth) * 0.2, 0.3, 1.35);
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.6 + aRandom * 1.8) + aRandom * 40.0) * uMotion;
  vColor = aColor * depthFade * twinkle * (1.0 + boost * 1.2) * mix(0.25, 1.0, e);
  vAlpha = mix(0.3, 1.0, e);
}
