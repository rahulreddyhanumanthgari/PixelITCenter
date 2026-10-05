// Turns each square point sprite into a soft round point of light.
//
// Light theme (uLight = 1): the light material layer. The same particles
// (same forms, motion and colour roles as dark) are drawn on white with
// normal blending as small, softly lit beads in a strong palette after the
// owner's reference: each particle's dark-theme role colour maps to
//   orange / red-orange (the warm, primary role) -> orange #F26419 / #D9480F
//   blue (the secondary role)                    -> teal #0E9F9A
//   deep blue (depth / structure)                -> navy #12233F
//   cream highlights                             -> gold #F2B705
//   white / pale points                          -> charcoal-navy (they would vanish)
// Brightness becomes opacity, so the dark theme's dimming (depth, text
// protection, fades) carries over; each dot gets a gentle highlight and a
// darker limb for depth, never a glow.

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
    float warmth = h.r - h.b;
    vec3 orange = toLinear(vec3(0.949, 0.392, 0.098));   // #F26419
    vec3 ember = toLinear(vec3(0.851, 0.282, 0.059));    // #D9480F
    vec3 teal = toLinear(vec3(0.055, 0.624, 0.604));     // #0E9F9A
    vec3 navy = toLinear(vec3(0.071, 0.137, 0.247));     // #12233F
    vec3 gold = toLinear(vec3(0.949, 0.718, 0.02));      // #F2B705
    vec3 ink;
    if (sat < 0.22) ink = navy;                            // whites / pale points
    else if (warmth > 0.25) {
      // Warm roles: red-orange edge, orange body, cream highlights -> gold.
      ink = h.g > 0.62 ? gold : (h.g < 0.2 ? ember : orange);
    } else {
      // Cool roles: blue -> teal; the deepest blues -> navy.
      ink = h.g < 0.2 ? navy : teal;
    }
    // A small lit bead: highlight upper left, darker limb.
    vec2 pc = (gl_PointCoord - 0.5) * 2.0;
    vec3 n = vec3(pc.x, -pc.y, sqrt(max(0.0, 1.0 - dot(pc, pc))));
    float diff = max(dot(n, normalize(vec3(-0.45, 0.6, 0.66))), 0.0);
    vec3 shaded = ink * (0.72 + 0.38 * diff) + vec3(1.0) * pow(diff, 18.0) * 0.18;
    float a = clamp(pow(m, 0.4) * 1.9, 0.0, 1.0);
    gl_FragColor = vec4(shaded, a * (1.0 - smoothstep(0.38, 0.5, d)) * vAlpha);
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
