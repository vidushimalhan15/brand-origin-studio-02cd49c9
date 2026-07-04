import { useCallback, useEffect, useRef, useState } from "react";
import Landing from "./components/Landing";
import GlobeView from "./components/GlobeView";
import MemoryCard from "./components/MemoryCard";
import FinalOverlay from "./components/FinalOverlay";
import { useVisited } from "./hooks/useVisited";
import type { MemoryPin } from "./types";
import rawLocations from "./data/locations.json";

const PINS = rawLocations as MemoryPin[];
const pinKey = (p: MemoryPin) => `${p.place}@${p.lat},${p.lng}`;

export default function App() {
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [activePin, setActivePin] = useState<MemoryPin | null>(null);
  const [showFinal, setShowFinal] = useState(false);

  const { visited, toggle, count } = useVisited();

  // Which memory pins have been opened at least once.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const openedRef = useRef(opened);
  openedRef.current = opened;

  const startGlobe = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => setStarted(true), 650);
  }, []);

  const openMemory = useCallback((pin: MemoryPin) => {
    setActivePin(pin);
    setOpened((prev) => {
      const next = new Set(prev);
      next.add(pinKey(pin));
      return next;
    });
  }, []);

  const closeMemory = useCallback(() => {
    setActivePin(null);
    // If every memory has now been seen, reveal the closing message.
    if (PINS.length > 0 && openedRef.current.size >= PINS.length) {
      window.setTimeout(() => setShowFinal(true), 450);
    }
  }, []);

  const replay = useCallback(() => {
    setShowFinal(false);
    setOpened(new Set());
  }, []);

  // Guard against the globe attempting WebGL where it's unsupported.
  const [webglOk] = useState(() => {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.title = "The world, according to us ✨";
  }, []);

  const openedCount = opened.size;

  return (
    <>
      <div className="starfield" />

      {started && webglOk && (
        <div className="stage">
          <GlobeView
            pins={PINS}
            visited={visited}
            onToggleCountry={toggle}
            onOpenMemory={openMemory}
            paused={activePin !== null || showFinal}
          />

          <div className="counter">
            <span className="dot" />
            Countries visited:&nbsp;<b>{count}</b>
          </div>

          {PINS.length > 0 && (
            <div className="pin-progress">
              <span className="gold">✦</span> Memories opened {openedCount} / {PINS.length}
              {openedCount === 0 && " — tap a gold pin"}
            </div>
          )}
        </div>
      )}

      {started && !webglOk && (
        <div className="final">
          <h2>Oh no</h2>
          <p>
            This little world needs WebGL, which your browser has turned off. Try another
            browser or device — the memories are waiting.
          </p>
        </div>
      )}

      {!started && <Landing leaving={leaving} onStart={startGlobe} />}

      {activePin && <MemoryCard pin={activePin} onClose={closeMemory} />}

      {showFinal && <FinalOverlay onReplay={replay} />}
    </>
  );
}
