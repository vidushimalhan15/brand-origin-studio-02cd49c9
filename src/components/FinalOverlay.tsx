import { useMemo } from "react";
import { CLOSING_MESSAGE, CLOSING_SIGNATURE } from "../config";

export default function FinalOverlay({ onReplay }: { onReplay: () => void }) {
  // Pre-compute floating hearts once (positions/delays are static per mount).
  const hearts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        dur: 6 + Math.random() * 6,
        size: 14 + Math.random() * 22,
        key: i,
      })),
    []
  );

  return (
    <div className="final">
      {hearts.map((h) => (
        <span
          className="heart"
          key={h.key}
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.dur}s`,
            animationDelay: `${h.delay}s`,
          }}
        >
          ♥
        </span>
      ))}
      <h2>The world, according to us.</h2>
      <p>{CLOSING_MESSAGE}</p>
      {CLOSING_SIGNATURE && <div className="sig">{CLOSING_SIGNATURE}</div>}
      <button className="again" onClick={onReplay}>
        Explore the globe again
      </button>
    </div>
  );
}
