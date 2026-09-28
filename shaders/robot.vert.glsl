// About Us particle robot. Each particle belongs to a body part; the CPU
// passes one joint transform per part (head, torso, left arm, right arm,
// legs), so the robot articulates without any per-particle JavaScript.
// Shares particle.frag.glsl with the other particle systems.

uniform mat4 uPart[5];      // 0 head (+eyes), 1 torso, 2 left arm, 3 right arm, 4 legs
uniform vec2 uEyeOffset;    // eye glance within the face plane
uniform float uTime;
uniform float uEnter;       // 0 = dispersed cloud … 1 = assembled robot
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;      // 1 = full motion, small under reduced motion
uniform float uHover;       // 0..1 cursor proximity
uniform vec3 uCursor;       // cursor, in robot space
uniform float uFocusDepth;
uniform vec3 uAccent;

attribute vec3 aNormal;
attribute float aPart;
attribute float aBright;
attribute float aRandom;
attribute float aScale;
attribute vec3 aScatter;

varying vec3 vColor;
varying float vAlpha;

float easeOutCubic(float x) { return 1.0 - pow(1.0 - x, 3.0); }

void main() {
  int part = int(aPart + 0.5);
  bool isEye = part == 1;
  int idx = part <= 1 ? 0 : part - 1;

  vec3 p = position;
  if (isEye) p.xy += uEyeOffset;
  mat4 m = uPart[idx];
  vec3 pos = (m * vec4(p, 1.0)).xyz;
  vec3 n = normalize(mat3(m) * aNormal);

  // Tiny shimmer so the surface never looks frozen.
  float ph = aRandom * 6.2831;
  pos += 0.006 * uMotion * vec3(sin(uTime * 1.3 + ph), cos(uTime * 1.1 + ph * 1.7), sin(uTime * 0.9 + ph * 2.3));

  // Hover: particles near the cursor lift very slightly off the surface.
  float near = 1.0 - smoothstep(0.0, 0.9, distance(pos, uCursor));
  pos += n * 0.035 * uHover * near * uMotion;

  // Entrance: each particle gathers from its own scatter offset, staggered.
  float local = clamp((uEnter - aRandom * 0.35) / 0.65, 0.0, 1.0);
  float e = easeOutCubic(local);
  pos += aScatter * (1.0 - e);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float depth = max(-mvPosition.z, 0.5);

  // Silhouette: surfaces seen edge-on read brighter and slightly larger, so
  // the outline stays crisp.
  vec3 viewN = normalize(normalMatrix * n);
  vec3 toCam = normalize(-mvPosition.xyz);
  float rim = pow(1.0 - abs(dot(viewN, toCam)), 2.0);
  if (isEye) rim = 0.0;

  float size = uSize * aScale * (1.0 + rim * 0.5) * (isEye ? 1.25 : 1.0);
  gl_PointSize = clamp(size * uPixelRatio / depth, 1.0, 22.0 * uPixelRatio);

  float depthFade = clamp(1.0 - (depth - uFocusDepth) * 0.25, 0.45, 1.3);
  float level = aBright * (0.55 + rim * 0.8) * depthFade * (1.0 + near * uHover * 0.5);
  vec3 base = mix(vec3(0.95, 0.965, 1.0), vec3(0.9, 0.905, 0.92), aRandom);
  vec3 color = isEye ? mix(vec3(1.0), uAccent, 0.18) * 1.9 : base * level;
  vColor = color * mix(0.35, 1.0, e);
  vAlpha = mix(0.4, 1.0, e);
}
