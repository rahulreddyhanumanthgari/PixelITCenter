// Draws each point sprite as a small voxel cube, seen from slightly above: a
// lit top face, a mid left face and a darker right face, all in the
// particle's colour from the light palette (lightInk in the vertex shaders,
// which move the brightness — fades, depth, arrivals — into vAlpha).

varying vec3 vColor;
varying float vAlpha;
varying float vOpacity; // overall opacity (the About galaxy is see-through)

void main() {
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
  // Full opacity: cubes are solid; only real fades thin them out.
  float vis = smoothstep(0.3, 0.62, vAlpha);
  gl_FragColor = vec4(face, vis * vOpacity);
}
