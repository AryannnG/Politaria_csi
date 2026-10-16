import React, { useMemo, useState } from 'react';
import { CityWorld } from './game/city/CityWorld.jsx';
import { demoStates } from './data/initialCityState.js';

const states = [
  ['starting', 'Current city'],
  ['healthcare', 'Healthcare investment'],
  ['infrastructure', 'Road expansion'],
  ['crisis', 'Environmental crisis'],
];

export default function App() {
  const [scenario, setScenario] = useState('starting');
  const [selection, setSelection] = useState(null);
  const cityState = useMemo(() => demoStates[scenario], [scenario]);

  return (
    <main className="world-shell" id="world">
      <CityWorld cityState={cityState} onSelect={setSelection} selectedId={selection?.id} />
      <header className="world-header">
        <a className="brand" href="#world" aria-label="Politaria city world">
          <span className="brand-mark">P</span>
          <span><strong>POLITARIA</strong><small>THE LIVING CITY</small></span>
        </a>
        <div className="season-label"><span className="live-dot" /> CITY VIEW <i /> YEAR {String(cityState.year).padStart(2, '0')} · MONTH {String(cityState.month).padStart(2, '0')}</div>
        <div className="header-right"><span className="weather-icon">☀</span><span>Clear skies</span><b>26°</b></div>
      </header>

      <section className="scene-title" aria-label="Selected district">
        <span className="eyebrow">YOUR CITY, IN MOTION</span>
        <h1>{cityState.city.cityName ?? 'Northbank'}</h1>
        <p>{cityState.city.districtName ?? 'Capital District'} <span>·</span> Population {(cityState.city.population ?? 128430).toLocaleString()}</p>
      </section>

      <div className="world-tools" aria-label="World controls">
        <div className="tool-hint"><span className="mouse-glyph">⌖</span><span><b>DRAG</b> to orbit <i /> <b>SCROLL</b> to zoom <i /> <b>RIGHT DRAG</b> to pan</span></div>
        <button className="reset-camera" onClick={() => window.dispatchEvent(new Event('cityworld:reset-camera'))} aria-label="Reset camera">↗ <span>Reset view</span></button>
      </div>

      {selection && (
        <aside className="building-inspector">
          <button className="close-inspector" onClick={() => setSelection(null)} aria-label="Close building details">×</button>
          <span className="eyebrow">CITY ASSET · LEVEL {selection.level}</span>
          <h2>{selection.name}</h2>
          <p>{selection.description}</p>
          <span className={`asset-status ${selection.status === 'under-construction' ? 'building' : ['damaged', 'neglected', 'abandoned', 'disrupted'].includes(selection.status) ? 'warning' : ''}`}><i /> {selection.status === 'under-construction' ? 'Expansion underway' : ({ damaged: 'Damaged', neglected: 'Neglected', abandoned: 'Abandoned', disrupted: 'Service disrupted' }[selection.status] ?? 'Operational')}</span>
        </aside>
      )}

      <footer className="world-footer">
        <div className="district-breadcrumb"><span className="map-pin">⌖</span><span><small>VIEWING DISTRICT</small><b>Capital District</b></span></div>
        <div className="demo-switcher" aria-label="Renderer visual state examples">
          <span>VISUAL STATE</span>
          {states.map(([id, label]) => <button key={id} className={scenario === id ? 'active' : ''} onClick={() => { setScenario(id); setSelection(null); }}>{label}</button>)}
        </div>
        <div className="scale"><span /> 500 m</div>
      </footer>
    </main>
  );
}
