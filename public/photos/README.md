# Photos

Drop your memory photos in **this folder** (`public/photos/`).

Then reference them by file name (no path) in `src/data/locations.json`:

```json
{
  "place": "Lisbon",
  "lat": 38.72,
  "lng": -9.14,
  "photos": ["lisbon1.jpg", "lisbon2.jpg"],
  "message": "..."
}
```

A file named `lisbon1.jpg` here is served at `/photos/lisbon1.jpg` — the app
builds that path for you. Any common image type works (`.jpg`, `.png`,
`.webp`, `.heic` won't render in most browsers, so convert those first).

Until a photo exists, the card shows a friendly placeholder telling you which
file to drop in — nothing breaks.
