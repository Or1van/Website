import { Fragment } from "react";

/**
 * Renders text as masked letters for the "title" reveal (see Reveals.tsx). Words stay
 * unbreakable so the heading still wraps naturally; screen readers get the plain text.
 */
export function SplitText({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <Fragment key={w}>
            <span className="split-word">
              {Array.from(word).map((ch, i) => (
                <span key={i} className="split-mask">
                  <span className="split-char" data-split>
                    {ch}
                  </span>
                </span>
              ))}
            </span>
            {w < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </>
  );
}
