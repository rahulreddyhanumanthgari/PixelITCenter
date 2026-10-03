// Turns each square point sprite into a soft round point of light.
//
// Light theme (uLight = 1): light can't be added to a white page, so each
// point is drawn as a bright blue dot with normal blending (see below). Its
// brightness becomes its opacity; no glow.

uniform float uLight;

varying vec3 vColor;
varying float vAlpha;

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  // gl_PointCoord runs 0..1 across the sprite; measure from its centre.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Bright pinpoint core with a gentle falloff to the edge.
  float core = 1.0 - smoothstep(0.0, 0.5, d);
  float glow = pow(core, 2.4);

  if (uLight > 0.5) {
    // Light theme: every particle in the theme's bright blues (the light
    // design's #1D4ED8 … #93C5FD), no orange. Warm and mid hues become bright
    // blue, the deepest blues stay deep, whites become a pale sky blue.
    float m = max(max(vColor.r, vColor.g), vColor.b);
    vec3 h = vColor / max(m, 1e-3);
    float sat = 1.0 - min(min(h.r, h.g), h.b);
    float blueness = smoothstep(-0.05, 0.3, h.b - h.r);
    float depth = smoothstep(0.22, 0.14, h.g) * blueness;
    vec3 deep = toLinear(vec3(0.114, 0.306, 0.847));    // #1D4ED8
    vec3 mid = toLinear(vec3(0.145, 0.388, 0.922));     // #2563EB
    vec3 bright = toLinear(vec3(0.231, 0.51, 0.965));   // #3B82F6
    vec3 sky = toLinear(vec3(0.376, 0.647, 0.98));      // #60A5FA
    vec3 ink = mix(bright, mix(mid, deep, depth), blueness);
    ink = mix(sky, ink, smoothstep(0.12, 0.45, sat));
    float a = clamp(pow(m, 0.45) * 1.7, 0.0, 1.0);
    gl_FragColor = vec4(ink, a * pow(core, 1.3) * vAlpha);
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
