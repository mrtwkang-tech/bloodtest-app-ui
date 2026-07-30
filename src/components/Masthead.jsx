import SessionChips from "./SessionChips";
import Wordmark from "./Wordmark";
import { C, DIVIDER, T, fadeUp } from "../tokens";

/**
 * One row at the top of every screen.
 *
 * WHAT IT REPLACES. Four screens each carried three stacked rows: a bold
 * one-word heading, a grey sentence under it, and the round bar under that —
 * about 110px of chrome before any content, in the same shape every time.
 *
 * Two of those three rows were not earning it. The heading printed the exact
 * word that is highlighted in the tab bar at the bottom of the same screen, so
 * it spent seventy pixels restating something already on screen. And the grey
 * sentence was a tagline: "따로 보면 안 보이고 같이 봐야 보이는 것들" explains
 * what the tab IS, which a reader needs once and was being shown every visit.
 *
 * So: title on the left, round stepper on the right, hairline under, done. The
 * screen keeps its heading for orientation and for screen readers, but it now
 * costs one line instead of three.
 *
 * HOME IS THE EXCEPTION and takes the wordmark instead of a title. "홈" as a
 * heading would be the emptiest word in the product, and the front page is
 * where a name belongs. The heading stays in the markup as an aria-label so
 * the document still has one.
 */
export default function Masthead({
  title,
  brand = false,
  right,
  sel,
  onPickSession,
  delay = 0,
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 40,
        paddingBottom: 9,
        marginBottom: 14,
        boxShadow: DIVIDER,
        ...fadeUp(delay),
      }}
    >
      <h1
        aria-label={brand ? "Pedia" : undefined}
        style={{
          margin: 0,
          flex: 1,
          minWidth: 0,
          color: C.ink,
          ...(brand ? { lineHeight: 1 } : T.title2),
        }}
      >
        {brand ? <Wordmark /> : title}
      </h1>
      {sel != null && onPickSession && (
        <SessionChips sel={sel} onPick={onPickSession} />
      )}
      {right}
    </header>
  );
}

/** The profile chip that sits at the right of the home masthead. */
export function Avatar({ initial, size = 32 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: C.chipIdle,
        color: C.body,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...T.micro,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {initial}
    </span>
  );
}
