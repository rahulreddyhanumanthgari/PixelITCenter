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
    vec3 ink = mix(vec3(0.12, 0.15, 0.24), hue * 0.9, smoothstep(0.15, 0.6, sat));
    // Dim points still need to read on white: lift faint ones strongly.
    gl_FragColor = vec4(ink, clamp(pow(m, 0.55) * 1.5, 0.0, 1.0) * glow * vAlpha);
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
