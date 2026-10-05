// Turns each square point sprite into a soft round point of light.
//
// Light theme (uLight = 1): light can't be added to a white page, so each
// point is drawn as a solid dot in the sun's palette with normal blending
// (see below); no glow.

uniform float uLight;

varying vec3 vColor;
varying float vAlpha;
varying float vWhite; // light theme: 1 = a white dot

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  // gl_PointCoord runs 0..1 across the sprite; measure from its centre.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Bright pinpoint core with a gentle falloff to the edge.
  float core = 1.0 - smoothstep(0.0, 0.5, d);
  float glow = pow(core, 2.4);

  if (uLight > 0.5) {
    // Light theme: the sun's palette (owner's choice). Each shape's hot core
    // (orange) → sun yellow #FFDF22, its red-orange band → orange #FF7E2E,
    // its blues → sunset red #FF6352, pale points → orange. The sun's white
    // and whitish-yellow (#FFFFFF, #FFFBE0) are left out: they vanish on a
    // white page. Each dot takes one colour, never a blend; drawn solid.
    float m = max(max(vColor.r, vColor.g), vColor.b);
    vec3 h = vColor / max(m, 1e-3);
    float sat = 1.0 - min(min(h.r, h.g), h.b);
    float blueness = smoothstep(-0.05, 0.3, h.b - h.r);
    vec3 sun = toLinear(vec3(1.0, 0.875, 0.133));       // #FFDF22
    vec3 orange = toLinear(vec3(1.0, 0.494, 0.18));     // #FF7E2E
    vec3 sunset = toLinear(vec3(1.0, 0.388, 0.322));    // #FF6352
    vec3 warm = h.g > 0.33 ? sun : orange;
    vec3 ink = blueness > 0.5 ? sunset : warm;
    if (sat < 0.25) ink = orange;
    float a = clamp(pow(m, 0.3) * 2.6, 0.0, 1.0);
    // White dots (Services): drawn as white pearls so they read on the peach page.
    if (vWhite > 0.5) {
      // A white pearl: bright centre, a soft warm shadow ring as its edge.
      vec3 rim = toLinear(vec3(0.9, 0.6, 0.45));
      vec3 pearl = mix(vec3(1.0), rim, smoothstep(0.26, 0.44, d));
      float pa = 1.0 - smoothstep(0.44, 0.5, d);
      gl_FragColor = vec4(pearl, pa * clamp(vAlpha * 1.6, 0.0, 1.0));
      return;
    }
    gl_FragColor = vec4(ink, a * (1.0 - smoothstep(0.34, 0.5, d)) * clamp(vAlpha * 1.4, 0.0, 1.0));
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
