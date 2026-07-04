/** A single memory location shown as a glowing gold pin on the globe. */
export interface MemoryPin {
  /** Human-readable place name, e.g. "Lisbon". */
  place: string;
  /** Latitude in degrees. */
  lat: number;
  /** Longitude in degrees. */
  lng: number;
  /**
   * Photo file names living in /public/photos/.
   * e.g. ["lisbon1.jpg", "lisbon2.jpg"] -> /photos/lisbon1.jpg …
   */
  photos: string[];
  /** Personal message shown in the memory card, handwritten-style. */
  message: string;
}
