import { Fragment } from "react";

/**
 * Heading copy with two small markers:
 * - `*word*` — a strategically important word, rendered with `.highlight`
 * - ` | ` — a preferred line break (from `sm` up; phones wrap naturally)
 *
 * Each word is its own inline-block `[data-word]` span, so the scroll
 * choreography can reveal a heading word by word (never letter by letter).
 * Screen readers still get the plain sentence.
 */
export function HeadingText({ text }: { text: string }) {
  const lines = text.split(" | ");
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br aria-hidden="true" className="hidden sm:inline" />}
          {line.split(/(\*[^*]+\*)/g).map((part, pi) => {
            if (!part) return null;
            const highlighted = part.startsWith("*") && part.endsWith("*");
            const words = (highlighted ? part.slice(1, -1) : part).split(/(\s+)/);
            return words.map((w, wi) =>
              /^\s+$/.test(w) || w === "" ? (
                w ? " " : null
              ) : (
                <span
                  key={`${pi}-${wi}`}
                  data-word
                  className={highlighted ? "highlight inline-block" : "inline-block"}
                >
                  {w}
                </span>
              ),
            );
          })}
          {li < lines.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}
