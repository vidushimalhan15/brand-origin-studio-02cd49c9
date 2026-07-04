import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
// world-atlas ships TopoJSON. countries-110m is ~110KB — small enough to bundle,
// so the globe needs zero network requests and works fully offline / on Vercel.
import worldTopo from "world-atlas/countries-110m.json";

export interface CountryProps {
  name: string;
}

export type CountryFeature = Feature<Geometry, CountryProps> & { id: string | number };

// Convert TopoJSON -> GeoJSON FeatureCollection once at module load.
const collection = feature(
  worldTopo as unknown as Parameters<typeof feature>[0],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (worldTopo as any).objects.countries
) as unknown as { features: CountryFeature[] };

export const COUNTRIES: CountryFeature[] = collection.features;

/** Stable unique key for a country feature (numeric ISO code, falls back to name). */
export function countryId(f: CountryFeature): string {
  return String(f.id ?? f.properties?.name ?? "");
}
