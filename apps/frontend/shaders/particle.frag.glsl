// Turns each square point sprite into a soft round point of light.

varying vec3 vColor;
varying float vAlpha;

void main() {
  // gl_PointCoord runs 0..1 across the sprite; measure from its centre.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Bright pinpoint core with a gentle falloff to the edge.
  float core = 1.0 - smoothstep(0.0, 0.5, d);
  float glow = pow(core, 2.4);

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
