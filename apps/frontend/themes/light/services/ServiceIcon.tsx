/**
 * Flat service icons for the light Services tiles: two or three simple shapes
 * overlapping: the main one in the card colour (orange), the second in soft
 * navy — the site's orange / navy pairing.
 */
/** The one colour of every card on the light site: vivid orange (the light palette). */
export const CARD_COLOR = "#fd5901";

export type IconName =
  | "spark"
  | "cloud"
  | "shield"
  | "bars"
  | "loop"
  | "check"
  | "nodes"
  | "people"
  | "clock"
  | "briefcase"
  | "layers"
  | "pie"
  | "diamond";

export function ServiceIcon({
  name,
  color,
}: {
  name: IconName;
  color: string;
}) {
  const solid = { fill: color };
  // The site's pairing: orange for the main shape, soft navy for the second.
  const softInk = "#041327";
  const soft = { fill: softInk, opacity: 0.16 };
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="light-svc__icon">
      {name === "spark" && (
        <>
          <circle cx="26" cy="36" r="16" {...soft} />
          <path
            d="M40 10 L44 22 L56 26 L44 30 L40 42 L36 30 L24 26 L36 22 Z"
            {...solid}
          />
        </>
      )}
      {name === "cloud" && (
        <>
          <circle cx="40" cy="26" r="13" {...soft} />
          <path
            d="M18 48 a10 10 0 0 1 0-20 a14 14 0 0 1 26 4 a8 8 0 0 1 2 16 Z"
            {...solid}
          />
        </>
      )}
      {name === "shield" && (
        <>
          <path
            d="M28 10 L48 17 L48 33 C48 45 39 52 28 56 C17 52 8 45 8 33 L8 17 Z"
            {...soft}
          />
          <path
            d="M36 18 L54 24 L54 37 C54 47 46 53 36 56 C26 53 18 47 18 37 L18 24 Z"
            {...solid}
          />
        </>
      )}
      {name === "bars" && (
        <>
          <rect x="10" y="30" width="12" height="24" rx="3" {...soft} />
          <rect x="26" y="18" width="12" height="36" rx="3" {...solid} />
          <rect x="42" y="8" width="12" height="46" rx="3" {...soft} />
        </>
      )}
      {name === "loop" && (
        <>
          <circle
            cx="24"
            cy="32"
            r="14"
            fill="none"
            stroke={softInk}
            strokeWidth="7"
            opacity="0.2"
          />
          <circle
            cx="40"
            cy="32"
            r="14"
            fill="none"
            stroke={color}
            strokeWidth="7"
          />
        </>
      )}
      {name === "check" && (
        <>
          <rect x="10" y="16" width="34" height="34" rx="5" {...soft} />
          <path
            d="M18 32 L28 42 L54 14"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {name === "nodes" && (
        <>
          <path
            d="M18 18 L46 26 L26 48 Z"
            fill="none"
            stroke={softInk}
            strokeWidth="3"
            opacity="0.2"
          />
          <circle cx="18" cy="18" r="9" {...soft} />
          <circle cx="46" cy="26" r="11" {...solid} />
          <circle cx="26" cy="48" r="9" {...solid} />
        </>
      )}
      {name === "people" && (
        <>
          <circle cx="22" cy="22" r="9" {...soft} />
          <path d="M6 52 a16 16 0 0 1 32 0 Z" {...soft} />
          <circle cx="40" cy="24" r="10" {...solid} />
          <path d="M22 56 a18 18 0 0 1 36 0 Z" {...solid} />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="28" cy="34" r="20" {...soft} />
          <circle
            cx="36"
            cy="28"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="6"
          />
          <path
            d="M36 18 L36 28 L44 33"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
      {name === "briefcase" && (
        <>
          <rect x="8" y="22" width="40" height="28" rx="5" {...soft} />
          <rect x="16" y="28" width="40" height="28" rx="5" {...solid} />
          <path
            d="M28 28 L28 22 a4 4 0 0 1 4-4 L40 18 a4 4 0 0 1 4 4 L44 28"
            fill="none"
            stroke={color}
            strokeWidth="4"
          />
        </>
      )}
      {name === "layers" && (
        <>
          <path d="M12 22 L32 10 L52 22 L32 34 Z" {...solid} />
          <path
            d="M12 34 L32 46 L52 34"
            fill="none"
            stroke={softInk}
            strokeWidth="6"
            strokeLinejoin="round"
            opacity="0.2"
          />
          <rect x="16" y="46" width="32" height="10" rx="5" {...solid} />
        </>
      )}
      {name === "pie" && (
        <>
          <circle cx="28" cy="34" r="20" {...soft} />
          <path d="M34 10 A22 22 0 0 1 56 32 L34 32 Z" {...solid} />
        </>
      )}
      {name === "diamond" && (
        <>
          <path d="M24 14 L42 32 L24 50 L6 32 Z" {...soft} />
          <path d="M40 14 L58 32 L40 50 L22 32 Z" {...solid} />
        </>
      )}
    </svg>
  );
}
