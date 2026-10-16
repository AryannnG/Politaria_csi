# POLITARIA City World

A modular React Three Fiber city renderer for the POLITARIA MERN project. This deliverable owns the 3D world and its visual response to game state. The simulation, MongoDB persistence, API, campaign rules, and primary game UI remain outside this renderer.

## Run the renderer

```sh
npm install
npm run dev
```

The default entry includes a small visual-state switcher for reviewing the renderer's state mappings. Remove `App.jsx`'s demonstration chrome and render `<CityWorld cityState={gameState} />` inside the team's existing React page when integrating.

## Renderer boundary

`src/game/city/CityWorld.jsx` exports the scene entry point:

```jsx
<CityWorld
  cityState={gameState}
  selectedId={selectedBuildingId}
  onSelect={(building) => setSelectedBuildingId(building.id)}
/>
```

The component reads state and draws the scene. It does not issue API calls, mutate game state, advance turns, or calculate outcomes. Pass the canonical state from the app's existing React store/query layer; do not add a second simulation store for the scene. `onSelect` returns `{ id, name, description, level, status }` so the host UI can open its own asset panel.

### Visual fields

| Input field | Visual result |
| --- | --- |
| `city.buildings[].id/type/level/status` | Stable asset placement and model tier. Hospital and clinic levels expand the care campus; school levels signal larger facilities; residential and commercial levels add height. Parks add mature trees and a fountain as they grow. An explicit asset `level` wins; if absent, healthcare, education, environment and infrastructure sector scores provide a visual tier fallback. |
| `city.constructionSites: string[]` | Scaffold frames appear around matching asset IDs. |
| `city.roadLevel` (0–4) | Roads widen with capacity; levels 3–4 add green cycle lanes. |
| `city.trafficLevel` (0–100) | More moving vehicles populate streets; high demand slows traffic and adds red congestion cues. |
| `city.pollutionLevel` (0–100) | Haze, smoke and an industrial warning outline grow as pollution rises. If omitted, the renderer derives an approximate visual value from `sectors.environment`. |
| `city.unrestLevel` (0–100) | A small public gathering and warning outline appear around City Hall as unrest rises. If omitted, a display cue is derived from `sectors.governance`. |
| `sectors.environment` | Tree palette and pollution fallback. Lower environmental health desaturates the surrounding ground. |
| `sectors.infrastructure` | Fallback road tier, when `city.roadLevel` is absent. |

Example payload shape:

```js
{
  month: 8,
  year: 1,
  sectors: { healthcare: 52, infrastructure: 48, environment: 68, governance: 62 },
  city: {
    trafficLevel: 36,
    pollutionLevel: 24,
    roadLevel: 1,
    constructionSites: ['hospital-central'],
    buildings: [
      { id: 'hospital-central', type: 'hospital', level: 2, status: 'under-construction' }
    ]
  }
}
```

Levels and visual metrics are display inputs only. The backend remains authoritative for costs, effects, duration and final game state. Existing built-in lot IDs can be overridden with server-provided levels and status. New assets render when the placement system supplies `position: { x, z }` (world units) and a supported `type`: `hospital`, `clinic`, `school`, `commercial`, `civic`, `residential`, `apartment`, `market`, `industry`, `park`, `police`, `fire`, `transport`, `power`, `water`, `culture`, `stadium`, or `monument`. Optional `width`, `depth`, and `height` tune the footprint. Coordinates are clamped to the compact MVP map. This keeps the renderer lightweight while allowing the city to develop and the asset catalog to grow.

## World interaction

- Left-drag orbits the isometric camera.
- Right-drag pans across the map.
- Scroll or pinch zooms from district view toward individual assets.
- Click a building to emit its asset data via `onSelect`.
- `cityworld:reset-camera` restores the starting view.
- Low-poly repeated trees, road markings and building windows use instancing; the initial world is compact, and scene resolution is capped at 1.6 device pixel ratio for browser performance.

## MERN integration

This is standard React client code and is compatible with a MERN application. This standalone preview uses React 19 with Fiber 9 and Drei 10. If the main frontend is already on React 18, match that app's installed versions when integrating: Fiber 8 pairs with React 18, while Fiber 9 pairs with React 19. Keep the renderer under the existing frontend's `src/game/city/` directory and render `CityWorld` where the team's game page owns the scene. The component boundary accepts ordinary JSON-shaped state, so the Express/MongoDB team only needs to return the stable city state alongside the rest of the game state. It does not require a separate backend, database model, or API route.
