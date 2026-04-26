import React from "react";

interface BorderBeamProps {
  duration?: number;
  size?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  duration = 8,
  size = 200,
  colorFrom = "#a855f7",
  colorTo = "#3b82f6",
  delay = 0,
}) => {
  return (
    <>
      <div
        className="pointer-events-none absolute -inset-[3px] rounded-[inherit]"
        style={{
          "--duration": `${duration}s`,
          "--size": `${size}px`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties}
      >
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background: `conic-gradient(from 90deg at 50% 50%, transparent 0%, ${colorFrom} 20%, ${colorTo} 25%, transparent 30%, transparent 100%)`,
            animation: `border-beam-rotate ${duration}s linear infinite`,
            animationDelay: `var(--delay)`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "3px",
          }}
        />
      </div>
      <style>{`
        @keyframes border-beam-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};
