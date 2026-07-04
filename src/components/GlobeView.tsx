import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import type { MemoryPin } from "../types";
import { COUNTRIES, countryId, type CountryFeature } from "../lib/countries";

interface Props {
  pins: MemoryPin[];
  visited: Set<string>;
  onToggleCountry: (id: string) => void;
  onOpenMemory: (pin: MemoryPin) => void;
  /** When true (a card/overlay is open) auto-rotation is suspended. */
  paused: boolean;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function GlobeView({
  pins,
  visited,
  onToggleCountry,
  onOpenMemory,
  paused,
}: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [ready, setReady] = useState(false);

  // idle bookkeeping for auto-rotate
  const interactingRef = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const applyAutoRotate = useCallback(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate =
      !prefersReducedMotion && !pausedRef.current && !interactingRef.current;
  }, []);

  // Re-evaluate rotation whenever the paused state flips.
  useEffect(() => {
    applyAutoRotate();
  }, [paused, applyAutoRotate]);

  // A glowing dark-glass globe material — no external earth texture needed.
  const globeMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color("#0e1230"),
      emissive: new THREE.Color("#1a1f4d"),
      emissiveIntensity: 0.55,
      shininess: 12,
      specular: new THREE.Color("#2b2f66"),
    });
    return mat;
  }, []);

  const onGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.7;
    controls.minDistance = 150;
    controls.maxDistance = 650;

    const onStart = () => {
      interactingRef.current = true;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      applyAutoRotate();
    };
    const onEnd = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      // resume slow auto-rotation after a few idle seconds
      idleTimer.current = setTimeout(() => {
        interactingRef.current = false;
        applyAutoRotate();
      }, 3500);
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.6 }, 0);
    applyAutoRotate();
    setReady(true);
  }, [applyAutoRotate]);

  const handlePolygonClick = useCallback(
    (polygon: object) => {
      onToggleCountry(countryId(polygon as CountryFeature));
    },
    [onToggleCountry]
  );

  const handlePointClick = useCallback(
    (point: object) => {
      const pin = point as MemoryPin;
      const globe = globeRef.current;
      if (globe) {
        interactingRef.current = true;
        applyAutoRotate();
        globe.pointOfView({ lat: pin.lat, lng: pin.lng, altitude: 1.35 }, 1100);
        window.setTimeout(() => onOpenMemory(pin), 1150);
      } else {
        onOpenMemory(pin);
      }
    },
    [onOpenMemory, applyAutoRotate]
  );

  // Colour accessors depend on `visited`; new function identities on change
  // make react-globe.gl re-evaluate the polygon colours.
  const capColor = useCallback(
    (f: object) =>
      visited.has(countryId(f as CountryFeature))
        ? "rgba(167, 139, 250, 0.75)"
        : "rgba(40, 46, 92, 0.55)",
    [visited]
  );
  const sideColor = useCallback(
    (f: object) =>
      visited.has(countryId(f as CountryFeature))
        ? "rgba(139, 110, 240, 0.25)"
        : "rgba(30, 34, 70, 0.2)",
    [visited]
  );
  const altitude = useCallback(
    (f: object) => (visited.has(countryId(f as CountryFeature)) ? 0.014 : 0.006),
    [visited]
  );

  return (
    <div className="globe-holder">
      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={globeMaterial}
        atmosphereColor="#8b7be8"
        atmosphereAltitude={0.24}
        onGlobeReady={onGlobeReady}
        // ── countries (visited mode) ──────────────────────────────
        polygonsData={COUNTRIES}
        polygonCapColor={capColor}
        polygonSideColor={sideColor}
        polygonStrokeColor={() => "rgba(150, 160, 220, 0.28)"}
        polygonAltitude={altitude}
        polygonsTransitionDuration={300}
        polygonLabel={(f: object) =>
          `<div style="font-family:Poppins,sans-serif;font-size:12px;color:#e7e3ff;background:rgba(10,12,28,.85);padding:4px 10px;border-radius:8px;border:1px solid rgba(167,139,250,.4)">${
            (f as CountryFeature).properties?.name ?? ""
          }</div>`
        }
        onPolygonClick={handlePolygonClick}
        // ── memory pins ───────────────────────────────────────────
        pointsData={pins}
        pointLat={(d: object) => (d as MemoryPin).lat}
        pointLng={(d: object) => (d as MemoryPin).lng}
        pointColor={() => "#ffd45e"}
        pointAltitude={0.02}
        pointRadius={0.8}
        pointLabel={(d: object) =>
          `<div style="font-family:Caveat,cursive;font-size:18px;color:#ffe6a1;background:rgba(10,12,28,.85);padding:3px 12px;border-radius:10px;border:1px solid rgba(255,212,94,.5)">${
            (d as MemoryPin).place
          }</div>`
        }
        onPointClick={handlePointClick}
        // ── pulsing gold rings under each pin ─────────────────────
        ringsData={pins}
        ringLat={(d: object) => (d as MemoryPin).lat}
        ringLng={(d: object) => (d as MemoryPin).lng}
        ringColor={() => (t: number) => `rgba(255, 212, 94, ${1 - t})`}
        ringMaxRadius={2.6}
        ringPropagationSpeed={1.4}
        ringRepeatPeriod={1400}
      />
      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#8a90c0",
            fontSize: "0.9rem",
            letterSpacing: "0.5px",
          }}
        >
          spinning up the world…
        </div>
      )}
    </div>
  );
}
