/**
 * Provider marks, drawn to each owner's own artwork.
 *
 * These are trademarks, and the branding guidelines that cover them are
 * specific: the Google G keeps its four colours and its proportions and is
 * never redrawn in a house style; the Apple logo is used as supplied, in black
 * or white, with clear space around it. Approximating either is both a licence
 * problem and the exact thing that makes a sign-in row look counterfeit — a
 * hand-traced G is recognisable as wrong at a glance even to someone who
 * cannot say why.
 *
 * So the two paths below are the standard published outlines rather than
 * something drawn to match this app's 1.5px stroke set. They are the one place
 * in the product where the house icon grammar does not apply, and that is
 * correct: they are not our marks.
 *
 * InBody is a wordmark, and I do not have their vector. It is set in type and
 * labelled as a placeholder rather than faked — before this ships, the real
 * asset has to come from InBody's brand kit along with the API approval.
 */

export function GoogleMark({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      style={{ display: "block", flex: "none" }}
    >
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

export function AppleMark({ size = 18, color = "#000" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      style={{ display: "block", flex: "none" }}
    >
      <path d="M17.05 12.53c-.02-2.4 1.96-3.55 2.05-3.61-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.75 0-1.91-.85-3.14-.83-1.61.02-3.1.94-3.93 2.38-1.68 2.91-.43 7.21 1.2 9.57.8 1.16 1.75 2.45 3 2.41 1.21-.05 1.66-.78 3.12-.78 1.46 0 1.87.78 3.14.75 1.3-.02 2.12-1.18 2.91-2.34.92-1.34 1.3-2.64 1.32-2.71-.03-.01-2.53-.97-2.55-3.85z" />
      <path d="M14.67 5.4c.66-.8 1.11-1.92.99-3.03-.95.04-2.11.63-2.79 1.43-.61.71-1.15 1.85-1.01 2.94 1.07.08 2.15-.54 2.81-1.34z" />
    </svg>
  );
}

/** Placeholder — see the note at the top of this file. */
export function InBodyMark({ size = 18 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        flex: "none",
        width: size,
        height: size,
        lineHeight: `${size}px`,
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 800,
        fontSize: size * 0.72,
        letterSpacing: "-0.06em",
        color: "#0B63CE",
      }}
    >
      iB
    </span>
  );
}

export function ProviderMark({ id, size }) {
  if (id === "google") return <GoogleMark size={size} />;
  if (id === "apple") return <AppleMark size={size} />;
  return <InBodyMark size={size} />;
}
