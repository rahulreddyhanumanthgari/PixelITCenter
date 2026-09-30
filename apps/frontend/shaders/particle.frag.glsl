// Turns each square point sprite into a soft round point of light.
//
// Light theme (uLight = 1): light can't be added to a white page, so each
// point is drawn as a coloured dot with normal blending, in the light
// palette: orange → #FF6B1A, red-orange → deep orange, blue → #1677FF /
// electric blue, deep blue → deep navy, whites/creams → soft steel blue
// (pure white would vanish). Its brightness becomes its opacity; no glow.

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
    float m = max(max(vColor.r, vColor.g), vColor.b);
    vec3 h = vColor / max(m, 1e-3);
    float sat = 1.0 - min(min(h.r, h.g), h.b);
    float blueness = smoothstep(-0.05, 0.3, h.b - h.r);
    float depth = smoothstep(0.22, 0.14, h.g);          // only the deepest blues → navy
    vec3 orange = toLinear(vec3(1.0, 0.42, 0.1));      // #FF6B1A
    vec3 ember = toLinear(vec3(0.9, 0.3, 0.06));
    vec3 blue = toLinear(vec3(0.086, 0.467, 1.0));     // #1677FF
    vec3 electric = toLinear(vec3(0.2, 0.62, 1.0));
    vec3 navy = toLinear(vec3(0.043, 0.106, 0.2));     // #0B1B33
    vec3 soft = toLinear(vec3(0.62, 0.7, 0.82));
    vec3 warm = mix(ember, orange, smoothstep(0.12, 0.3, h.g));
    vec3 cool = mix(mix(electric, blue, smoothstep(0.2, 0.45, sat)), navy, depth * 0.85);
    vec3 ink = mix(warm, cool, blueness);
    ink = mix(soft, ink, smoothstep(0.12, 0.45, sat));
    float a = clamp(pow(m, 0.45) * 1.7, 0.0, 1.0);
    gl_FragColor = vec4(ink, a * pow(core, 1.3) * vAlpha);
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
