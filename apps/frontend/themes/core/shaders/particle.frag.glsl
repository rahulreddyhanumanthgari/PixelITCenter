// Turns each square point sprite into a soft round point of light.
//
// Light theme (uLight = 1): the light material layer. The same particles
// (same forms, motion and colour roles as dark) drawn on white, normal
// blending, as small lit spheres in a material palette with hierarchy
// (after the owner's reference). Each particle keeps its dark-theme role and
// picks, by its own hash, from weighted colour families:
//   warm role (orange core)  -> ~50% cream, ~42% orange family, ~8% gold
//   cream highlights          -> gold
//   blue role (secondary)     -> ~50% cream, ~42% cyan family, ~8% charcoal
//   deep blue (structure)     -> soft grey, cream, ~25% charcoal
//   white / pale (dust)       -> soft grey / cream, faint (background)
// Material: sphere shading (key light upper left, darker limb), varied
// brightness and gloss per particle. Depth of field from the vertex shader:
// background particles soft, smaller-cored, paler and fainter; foreground
// sharp and a little more saturated.

uniform float uLight;

varying vec3 vColor;
varying float vAlpha;
varying float vRand;   // light theme: per-particle hash (colour pick, material variation)
varying float vBlur;   // light theme: depth-of-field blur, 0 = in focus
varying float vFar;    // light theme: -1 foreground ... 0 focus ... 1 background

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
    float r1 = fract(vRand * 13.37);
    float r2 = fract(vRand * 71.13);
    float r3 = fract(vRand * 5.71);

    vec3 cream = r2 < 0.45 ? toLinear(vec3(0.957, 0.945, 0.918))     // #F4F1EA
               : r2 < 0.8 ? toLinear(vec3(0.91, 0.898, 0.867))      // #E8E5DD
               : toLinear(vec3(0.851, 0.843, 0.816));               // #D9D7D0
    vec3 orange = r2 < 0.4 ? toLinear(vec3(0.976, 0.451, 0.086))     // #F97316
                : r2 < 0.8 ? toLinear(vec3(1.0, 0.541, 0.165))      // #FF8A2A
                : toLinear(vec3(0.961, 0.62, 0.043));               // #F59E0B
    vec3 gold = r2 < 0.5 ? toLinear(vec3(0.984, 0.749, 0.141))       // #FBBF24
              : toLinear(vec3(0.957, 0.769, 0.188));                // #F4C430
    vec3 cyan = r2 < 0.35 ? toLinear(vec3(0.259, 0.776, 0.765))      // #42C6C3
              : r2 < 0.7 ? toLinear(vec3(0.212, 0.749, 0.765))      // #36BFC3
              : toLinear(vec3(0.357, 0.784, 0.773));                // #5BC8C5
    vec3 charcoal = r2 < 0.6 ? toLinear(vec3(0.122, 0.161, 0.216))   // #1F2937
                  : toLinear(vec3(0.067, 0.094, 0.153));            // #111827
    vec3 grey = r2 < 0.5 ? toLinear(vec3(0.796, 0.835, 0.882))       // #CBD5E1
              : toLinear(vec3(0.722, 0.753, 0.784));                // #B8C0C8

    vec3 ink;
    float faint = 1.0;   // background roles are less prominent
    if (sat < 0.22) {
      ink = r1 < 0.7 ? grey : cream;
      faint = 0.5;
    } else if (warmth > 0.25) {
      if (h.g > 0.62) ink = gold;
      else ink = r1 < 0.5 ? cream : (r1 < 0.92 ? orange : gold);
    } else if (h.g < 0.2) {
      ink = r1 < 0.25 ? charcoal : (r1 < 0.65 ? grey : cream);
      faint = r1 < 0.25 ? 1.0 : 0.7;
    } else {
      ink = r1 < 0.5 ? cream : (r1 < 0.92 ? cyan : charcoal);
    }

    // Depth of field: the sphere fills k of the sprite; the rest is blur.
    float blur = vBlur;
    float k = 1.0 / (1.0 + blur * 0.9);
    vec2 pc = (gl_PointCoord - 0.5) * 2.0;
    float rr = length(pc);
    vec2 q = pc / k;
    float qq = min(dot(q, q), 1.0);
    vec3 n = vec3(q.x, -q.y, sqrt(1.0 - qq));
    vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
    float diff = max(dot(n, L), 0.0);
    float gloss = r3 < 0.55 ? 1.0 : 0.35;                           // some glossy, some matte
    float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0) * 0.32 * gloss;
    float bright = 0.9 + 0.18 * fract(vRand * 3.17);
    vec3 col = ink * bright * (0.58 + 0.5 * diff) + vec3(1.0) * spec;

    // Background: blurred spheres lose their shading, saturation and weight;
    // foreground: a touch more saturation.
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    float back = clamp(vFar, 0.0, 1.0);
    col = mix(col, vec3(lum), back * 0.35);
    col = mix(col, ink * bright * 0.95, clamp(blur, 0.0, 1.0) * 0.6);
    col = mix(vec3(lum), col, 1.0 + 0.12 * clamp(-vFar, 0.0, 1.0));
    float soft = 0.03 + 0.6 * clamp(blur, 0.0, 1.0) * k;
    float shape = 1.0 - smoothstep(max(k - soft, 0.0), min(k + soft, 1.0), rr);
    float a = clamp(pow(m, 0.4) * 1.9, 0.0, 1.0) * faint * mix(1.0, 0.45, clamp(blur, 0.0, 1.0));
    gl_FragColor = vec4(col, a * shape * vAlpha);
    return;
  }

  // Additive blending: alpha scales how much light this particle adds.
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
