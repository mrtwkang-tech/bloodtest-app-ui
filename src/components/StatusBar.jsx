import { useEffect, useState } from "react";

/**
 * The simulated device status bar. On a real phone it doubles as the notch
 * spacer, so its top padding tracks the safe-area inset.
 */
export default function StatusBar({ dark = false }) {
  const [clock, setClock] = useState(() => now());

  useEffect(() => {
    const id = setInterval(() => setClock(now()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "calc(15px + var(--safe-top)) 24px 4px",
        fontSize: 13,
        fontWeight: 700,
        flex: "none",
        color: dark ? "#fff" : "#16130F",
      }}
    >
      <span>{clock}</span>
      <span
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          fontSize: 10.5,
          fontWeight: 600,
        }}
      >
        <span>5G</span>
        <span>100%</span>
      </span>
    </div>
  );
}

function now() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}
