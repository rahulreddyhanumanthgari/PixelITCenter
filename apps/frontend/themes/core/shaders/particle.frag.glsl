// Turns each square point sprite into a soft round point of light.

varying vec3 vColor;
varying float vAlpha;
varying float vOpacity; // light version: overall opacity (the About galaxy is see-through)
uniform float uLight; // 1 in the light version (<html data-theme="light">)

void main() {
  // gl_PointCoord runs 0..1 across the sprite; measure from its centre.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Light version: each particle is a small voxel cube (as in the owner's
  // light reference), seen from slightly above: a lit top face, a mid left
  // face and a darker right face, all in its colour from the reference
  // palette (lightInk in the vertex shaders, which move the dark brightness —
  // fades, text protection — into vAlpha).
  if (uLight > 0.5) {
    vec2 p = gl_PointCoord - 0.5;
    p.y = -p.y;
    const float R = 0.48;              // hexagon (cube outline) radius
    const float C = 0.8660254 * R;     // half width
    float ax = abs(p.x);
    // Outside the cube's hexagonal outline.
    if (ax > C || abs(p.y) > R - 0.5773503 * ax) discard;
    vec3 face;
    if (p.y > 0.5773503 * ax - 0.0) {
      face = mix(vColor, vec3(1.0), 0.28);   // top: lit
    } else if (p.x < 0.0) {
      face = vColor;                          // left
    } else {
      face = vColor * 0.7;                    // right: in shade
    }
    // Full opacity: cubes are solid. Only real fades (far side, depth,
    // arrivals) thin them out; the fade behind text is off in light (it left
    // a white halo round the content; see the protect* factors).
    float vis = smoothstep(0.3, 0.62, vAlpha);
    gl_FragColor = vec4(face, vis * vOpacity);
    return;
  }

  // Bright pinpoint core with a gentle falloff to the edge.
  float core = 1.0 - smoothstep(0.0, 0.5, d);
  float glow = pow(core, 2.4);

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
