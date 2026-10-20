# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [3.0.0] - 2026-10-20

Complete rewrite: Leaflet and plain JavaScript are replaced by OpenLayers, TypeScript and Vite. GPX files are still processed locally in the browser only.

### Added

- Fixed sidebar next to the map, collapsible with a sliding animation (the map does not move).
- Load several GPX files at once, from the device or from a URL.
- Cache icons per type, shown in a filter grouped by colour (traditional, multi, events, virtual/earth/webcam, mystery and others).
- Filters by difficulty and terrain (min/max ranges), and a switch to hide found caches.
- Search by geocode or name: centres the map on the cache and opens its popup.
- Popup with type, size, owner profile link, formatted date, difficulty/terrain and coordinates in degrees and decimal minutes, copied to the clipboard on click.
- Track and route display (`<trk>` and `<rte>`), included when fitting the map to the data.
- Optional geocode labels and perimeters around caches, and user geolocation.
- Distance scale on the map (metric).
- Tooltip with the cache name on hover.
- Basemap picker on the map with thumbnails: OSM Standard, OSM Humanitarian, CyclOSM, OpenTopoMap and Satellite (Esri).
- Display settings saved in the browser (`localStorage`): language, basemap, geocode labels, perimeters and sidebar state. Filters are not saved.
- Translations: English, French, German, Spanish and Italian.
- Unit tests with Vitest (`npm test`) for the GPX parser, the filters and the coordinate formatting.

### Changed

- Icons now come from [Lucide](https://lucide.dev), including the map controls.
- Waypoints that are not geocaches are ignored.
- The dark theme was removed.
- The page stays hidden until the interface is ready, to avoid a flash of unstyled content in development.
- Tooling: Biome for lint and formatting, TypeScript 7 compatible configuration (no `baseUrl`).

### Removed

- Carto Voyager and Stamen Terrain basemaps, which no longer work without an API key or are shut down.
- Remix Icon, which added about 2.9 MB to the build.

## [2.0.2]

Last release of the Leaflet version. See the git history for details.
