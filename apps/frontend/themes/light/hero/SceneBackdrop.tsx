/**
 * The light hero's landscape, after the owner's reference: a pale steel-blue
 * sky lightening toward a soft peach sunrise, misty mountain ranges left and
 * right, a calm lake below the horizon that mirrors them. Drawn as one SVG
 * (no image), cropped to fill the hero at any size. Decorative.
 */
export function SceneBackdrop() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#84a8c2" />
          <stop offset="0.3" stopColor="#a6c1d3" />
          <stop offset="0.55" stopColor="#cddbe4" />
          <stop offset="0.65" stopColor="#e9edee" />
        </linearGradient>
        <radialGradient id="sun" cx="760" cy="565" r="420" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fde4d3" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#f6dccf" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f6dccf" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8aaac1" />
          <stop offset="1" stopColor="#c9d8e3" />
        </linearGradient>
        <linearGradient id="near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5f86a2" />
          <stop offset="1" stopColor="#86a6bd" />
        </linearGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef2f3" stopOpacity="0" />
          <stop offset="1" stopColor="#eef2f3" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dce7ef" />
          <stop offset="0.18" stopColor="#bcd2e2" />
          <stop offset="0.6" stopColor="#92b7d2" />
          <stop offset="1" stopColor="#6e9dc2" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="reflect" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <clipPath id="below">
          <rect x="0" y="585" width="1440" height="315" />
        </clipPath>

        {/* The ranges, shared by the landscape and its reflection. */}
        <g id="ranges">
          <path
            d="M0 548 Q60 526 112 534 T204 504 Q244 490 284 497 Q334 486 384 511 Q444 531 524 540 Q604 551 664 585 L0 585 Z"
            fill="url(#far)"
          />
          <path d="M0 562 Q70 548 140 556 Q204 543 264 559 Q334 574 424 585 L0 585 Z" fill="url(#near)" />
          <path
            d="M820 585 Q880 560 940 548 Q990 531 1040 535 Q1100 515 1160 519 Q1220 509 1282 523 Q1362 540 1440 531 L1440 585 Z"
            fill="url(#far)"
          />
          <path d="M1058 585 Q1120 561 1180 555 Q1240 541 1300 547 Q1370 556 1440 551 L1440 585 Z" fill="url(#near)" />
          <rect x="0" y="530" width="1440" height="56" fill="url(#mist)" />
        </g>
      </defs>

      <rect width="1440" height="900" fill="url(#sky)" />
      <rect width="1440" height="900" fill="url(#sun)" />

      {/* Low clouds catching the sunrise. */}
      <g filter="url(#soft)" fill="#f7e7e0" opacity="0.85">
        <ellipse cx="300" cy="522" rx="130" ry="16" />
        <ellipse cx="440" cy="506" rx="90" ry="12" />
        <ellipse cx="180" cy="540" rx="80" ry="10" />
        <ellipse cx="1130" cy="528" rx="110" ry="12" opacity="0.6" />
      </g>

      <use href="#ranges" />

      {/* The lake, its mirrored ranges, the bright horizon and a few ripples. */}
      <rect x="0" y="585" width="1440" height="315" fill="url(#water)" />
      <g clipPath="url(#below)">
        <g transform="matrix(1 0 0 -1 0 1170)" opacity="0.5" filter="url(#reflect)">
          <use href="#ranges" />
        </g>
      </g>
      <rect x="0" y="582" width="1440" height="6" fill="#ffffff" opacity="0.6" filter="url(#reflect)" />
      {/* A dark spit of land on the left, at the water's edge. */}
      <path d="M0 594 Q60 586 130 590 Q190 593 236 600 Q200 604 120 605 Q60 606 0 604 Z" fill="#5b82a0" opacity="0.85" />
      <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.2">
        <line x1="120" y1="660" x2="520" y2="660" />
        <line x1="880" y1="690" x2="1320" y2="690" />
        <line x1="260" y1="740" x2="700" y2="740" />
        <line x1="760" y1="790" x2="1240" y2="790" />
      </g>
    </svg>
  );
}
