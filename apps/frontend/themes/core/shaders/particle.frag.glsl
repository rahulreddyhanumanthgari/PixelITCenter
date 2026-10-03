// Turns each square point sprite into a soft round point of light.
//
// Light theme (uLight = 1): light can't be added to a white page, so each
// point is drawn as a solid navy or orange dot with normal blending (see
// below); no glow.

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
    // Light theme: a mix of navy #0A192F and orange #FF5A1F, as bold as
    // possible on white. Warm hues (discs, land, hot bands) → orange; blues
    // and whites → navy; the bands in between blend the two. Dots are drawn
    // nearly opaque with a firm edge.
    float m = max(max(vColor.r, vColor.g), vColor.b);
    vec3 h = vColor / max(m, 1e-3);
    float blueness = smoothstep(-0.05, 0.3, h.b - h.r);
    vec3 navy = toLinear(vec3(0.039, 0.098, 0.184));    // #0A192F
    vec3 orange = toLinear(vec3(1.0, 0.353, 0.122));    // #FF5A1F
    vec3 ink = mix(orange, navy, blueness);
    float a = clamp(pow(m, 0.3) * 2.6, 0.0, 1.0);
    gl_FragColor = vec4(ink, a * (1.0 - smoothstep(0.32, 0.5, d)) * clamp(vAlpha * 1.4, 0.0, 1.0));
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
