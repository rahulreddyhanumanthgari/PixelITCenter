// Turns each square point sprite into a soft round point of light.
// Light theme (uLight = 1): light can't be added to a white page, so each
// point is drawn as ink instead (normal blending): its hue kept, whites and
// greys turned to a dark slate, its brightness used as opacity.

uniform float uLight;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // gl_PointCoord runs 0..1 across the sprite; measure from its centre.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Bright pinpoint core with a gentle falloff to the edge.
  float core = 1.0 - smoothstep(0.0, 0.5, d);
  float glow = pow(core, 2.4);

  if (uLight > 0.5) {
    float m = max(max(vColor.r, vColor.g), vColor.b);
    vec3 hue = vColor / max(m, 1e-3);
    // 0 for white/grey, 1 for a pure hue.
    float sat = 1.0 - min(min(hue.r, hue.g), hue.b);
    // Vivid on white: push hues toward full saturation, then deepen a touch
    // so orange stays orange and yellow reads as gold (not pale on white).
    float lo = min(min(hue.r, hue.g), hue.b);
    vec3 vivid = (hue - lo) / max(1.0 - lo, 1e-3);
    vivid = mix(hue, vivid, 0.6) * mix(0.95, 0.8, vivid.g * (1.0 - vivid.b));
    vec3 ink = mix(vec3(0.12, 0.15, 0.24), vivid, smoothstep(0.12, 0.5, sat));
    // A firmer, more opaque dot than the soft glow used on dark.
    float solid = pow(core, 1.1);
    gl_FragColor = vec4(ink, clamp(pow(m, 0.4) * 2.0, 0.0, 1.0) * solid * vAlpha);
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
