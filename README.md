# The world, according to us 🌍✨

An interactive 3D globe birthday gift. Spin a glowing globe through a starry sky,
open glowing **gold memory pins** to relive places you've been together (photos +
a handwritten note), and light up **any other country in soft purple** to mark it
as somewhere still to go.

Built as a **100% client-side React app** — no backend, no API keys, no database.
Deploys to Vercel (or any static host) as-is.

- **Landing screen** → “Happy Birthday _[name]_. The world, according to us.” + a
  **Spin the globe** button.
- **Free drag rotation**, slow auto-rotation when idle, **pinch-zoom & touch** on
  mobile.
- **Memory pins** glow gold. Tap one → the globe zooms in, then a card opens with a
  **swipeable photo carousel** and your message in a handwritten font.
- **Visited mode** → tap any country to fill it purple. A top counter shows
  **“Countries visited: X”**, persisted with `localStorage` (falls back to in-memory
  if storage is blocked).
- **Final overlay** → once every memory pin has been opened, your closing message
  appears.

## Tech

React 18 · [react-globe.gl](https://github.com/vasturiano/react-globe.gl) (Three.js)
· Vite · TypeScript · [embla-carousel](https://www.embla-carousel.com/) for swipe.
Country shapes are bundled from `world-atlas` — nothing is fetched at runtime.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Make it yours (3 steps)

**1 — Your words.** Edit `src/config.ts`:

```ts
export const RECIPIENT_NAME = "My Love";           // "Happy Birthday <name>."
export const TAGLINE = "The world, according to us.";
export const CLOSING_MESSAGE = `Your closing message…`;  // shown after all pins opened
export const CLOSING_SIGNATURE = "— always, me";
```

**2 — Your memories.** Edit `src/data/locations.json`. Add as many entries as you like:

```json
{
  "place": "Lisbon",
  "lat": 38.72,
  "lng": -9.14,
  "photos": ["lisbon1.jpg", "lisbon2.jpg"],
  "message": "The tram down to Alfama, that impossible sunset over the river…"
}
```

**3 — Your photos.** Drop the image files into `public/photos/` using the exact names
you listed under `"photos"`. A pin named `"lisbon1.jpg"` loads from
`public/photos/lisbon1.jpg`. Until a photo exists, the card shows a friendly
placeholder telling you which file to add — nothing breaks.

> Tip: use `lat`/`lng` in decimal degrees (positive = N/E, negative = S/W).
> [latlong.net](https://www.latlong.net/) is handy for looking places up.

## Deploy to Vercel

This is a standard static Vite app, so there's nothing to configure:

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo.
3. Vercel auto-detects Vite (**Build:** `npm run build`, **Output:** `dist`). Click
   **Deploy**. Done — no environment variables needed.

Or from the CLI: `npm i -g vercel && vercel`.

## Project structure

```
public/
  photos/             ← your images go here
  favicon.svg
src/
  config.ts           ← name, tagline, closing message  (EDIT ME)
  data/locations.json ← memory pins                       (EDIT ME)
  types.ts
  lib/countries.ts    ← bundled world map -> globe polygons
  hooks/useVisited.ts ← localStorage-backed visited state
  components/
    Landing.tsx
    GlobeView.tsx     ← the globe (pins, rings, visited countries)
    MemoryCard.tsx    ← photo carousel + message
    FinalOverlay.tsx
  App.tsx
  main.tsx
  index.css
```
