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
    // Maximum vividness on white: hues pushed all the way to full
    // saturation (yellow only deepened slightly so it never turns pale).
    float lo = min(min(hue.r, hue.g), hue.b);
    vec3 vivid = (hue - lo) / max(1.0 - lo, 1e-3);
    vivid *= mix(1.0, 0.9, vivid.g * vivid.r * (1.0 - vivid.b));
    vec3 ink = mix(vec3(0.12, 0.15, 0.24), vivid, smoothstep(0.12, 0.45, sat));
    float strength = clamp(pow(m, 0.35) * 2.2, 0.0, 1.0);
    // A solid, saturated centre inside a soft glow of the same colour: the
    // light-mode equivalent of the dark theme's bloom.
    float centre = 1.0 - smoothstep(0.14, 0.22, d);
    float halo = exp(-d * d * 22.0) * 0.55;
    float a = max(centre, halo) * strength * vAlpha;
    // The centre is the pure colour; the glow is a slightly lighter tint.
    vec3 c = mix(mix(ink, vec3(1.0), 0.12), ink, centre);
    gl_FragColor = vec4(c, a);
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
