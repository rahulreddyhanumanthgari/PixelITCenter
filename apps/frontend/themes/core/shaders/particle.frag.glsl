// Turns each square point sprite into a soft round point of light.
//
// Light theme (uLight = 1), per the Light Pixel Master Specification: every
// particle is a small voxel pixel (a cube seen slightly from above: a lit
// top face, a mid left face, a darker right face) in the locked palette
// chosen in the vertex shader (vInk). Normal blending, no glow. Brightness
// becomes opacity, so the journey's fades and text protection carry over.
// Depth of field: out-of-focus pixels grow soft and flatten.

uniform float uLight;

varying vec3 vColor;
varying float vAlpha;
varying vec3 vInk;
varying float vRand;   // light theme: per-particle hash (colour pick, material variation)
varying float vBlur;   // light theme: depth-of-field blur, 0 = in focus
varying float vFar;    // light theme: -1 foreground ... 0 focus ... 1 background

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  // gl_PointCoord runs 0..1 across the sprite; measure from its centre.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Bright pinpoint core with a gentle falloff to the edge.
  float core = 1.0 - smoothstep(0.0, 0.5, d);
  float glow = pow(core, 2.4);

  if (uLight > 0.5) {
    float m = max(max(vColor.r, vColor.g), vColor.b);
    float blur = clamp(vBlur, 0.0, 1.5);
    float k = 1.0 / (1.0 + blur * 0.9);
    vec2 pc = (gl_PointCoord - 0.5) * 2.0;
    pc.y = -pc.y;
    vec2 q = pc / k;
    // Isometric cube outline (a hexagon), inside where edge <= 1.
    float edge = max(abs(q.x) / 0.866, abs(q.y) + abs(q.x) * 0.577);
    float soft = 0.05 + 0.5 * clamp(blur, 0.0, 1.0);
    float shape = 1.0 - smoothstep(1.0 - soft, 1.0 + soft * 0.5, edge);
    if (shape <= 0.001) discard;
    vec3 base = toLinear(vInk) * (0.94 + 0.12 * fract(vRand * 3.17));
    float face = q.y > 0.577 * abs(q.x) ? 1.1 : (q.x < 0.0 ? 0.86 : 0.66);
    vec3 col = base * face;
    col = mix(col, base * 0.92, clamp(blur, 0.0, 1.0) * 0.7);
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(lum), clamp(vFar, 0.0, 1.0) * 0.25);
    float a = clamp(m * 2.6, 0.0, 1.0) * mix(1.0, 0.55, clamp(blur, 0.0, 1.0));
    gl_FragColor = vec4(col, a * shape * vAlpha);
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
