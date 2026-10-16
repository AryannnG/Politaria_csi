import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { catalogApi, citiesApi } from "../services/api.js";
import { toCityWorldState } from "../game/city/normalizeCity.js";
import { useFullscreen } from "../game/city/useFullscreen.js";
import { useAuth } from "../state/AuthContext.jsx";
import mayorPortrait from "../3e4bce5db1b2d8032d893e9af87616ec.jpg";

const CityWorld = lazy(() => import("../game/city/CityWorld.jsx").then((module) => ({ default: module.CityWorld })));
const SECTORS = [
  ["economy", "Economy"], ["healthcare", "Health"], ["education", "Education"],
  ["infrastructure", "Roads"], ["environment", "Nature"], ["governance", "Civic"],
];
const BUILD_PRIORITY = ["clinic", "school", "park", "factory", "power_plant", "transit_line"];

const money = (value) => `₹${Number(value || 0).toLocaleString()}`;

function formatEffects(effects = {}) {
  const labels = { treasury: "TRE", population: "POP", economy: "ECO", healthcare: "HLT", education: "EDU", infrastructure: "INF", environment: "ENV", governance: "GOV", approval: "APR" };
  return Object.entries(effects).filter(([key, value]) => value && labels[key]).map(([key, value]) => `${labels[key]}${value > 0 ? "+" : "−"}${key === "treasury" ? money(Math.abs(value)) : Math.abs(value)}`).join("  ");
}

function BuildSymbol({ id = "community_center" }) {
  const paths = {
    clinic: <><path d="M12 4v16M4 12h16"/><circle cx="12" cy="12" r="9"/></>, hospital: <><path d="M12 4v16M4 12h16"/><path d="M4 20h16"/></>, school: <><path d="m3 10 9-6 9 6M5 10v10h14V10M9 20v-6h6v6"/><path d="M9 11h.01M15 11h.01"/></>, university: <><path d="m3 10 9-6 9 6M5 10h14M7 11v6m5-6v6m5-6v6M3 20h18"/></>,
    power_plant: <><path d="M13 2 5 13h6l-1 9 9-12h-6z"/></>, park: <><path d="M12 3 7 11h3l-5 6h6v4h2v-4h6l-5-6h3z"/></>, factory: <><path d="M3 20V9l6 4V9l6 4V6h6v14zM17 9h1m-1 4h1"/></>, transit_line: <><rect x="4" y="4" width="16" height="15" rx="3"/><path d="M7 9h10m-9 6h.01m8 0h.01M8 22l2-3m6 3-2-3"/></>, transit_terminal: <><path d="M3 19h18M5 19V8h14v11M8 8V5h8v3M8 12h8m-8 3h8"/></>, police_station: <><path d="m12 3 8 3v5c0 5-3 8-8 10-5-2-8-5-8-10V6z"/><path d="M12 7v8m-4-4h8"/></>, fire_station: <><path d="M12 3c2 4-2 5 1 8 1-2 2-3 2-4 4 3 5 8 2 11-3 4-10 3-12-1-2-4 0-8 4-11-1 4 1 5 2 6 2-3 1-6 1-9z"/></>, water_works: <><path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12z"/><path d="M9 16c.4 1.4 1.4 2.2 3 2.4"/></>, innovation_hub: <><path d="M8 18h8m-7 3h6m-3-18a7 7 0 0 0-4 12c1 .7 1 1.5 1 2h6c0-.5 0-1.3 1-2a7 7 0 0 0-4-12z"/></>, recycling_center: <><path d="m8 5 3-2 3 5h-3M17 10l4 2-3 5-2-3M9 17H4l-1-4 3-1"/><path d="M11 8 7 15m6 2h4m-8-1 2 3"/></>, community_center: <><path d="m3 11 9-7 9 7M5 10v10h14V10M9 20v-6h6v6"/></>,
  };
  return <svg className="building-symbol" viewBox="0 0 24 24" aria-hidden="true">{paths[id] || paths.community_center}</svg>;
}

function ApprovalMark({ value = 50 }) {
  const approval = Number(value) || 0;
  const mouth = approval < 50 ? "M8 17q4-5 8 0" : approval < 65 ? "M8 16h8" : "M8 15q4 5 8 0";
  return <svg className="approval-symbol" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13"/><path d="M11 13h.01M21 13h.01"/><path d={mouth}/></svg>;
}

function ResourceMark({ type }) {
  return type === "treasury"
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2z"/><path d="M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1h-4"/></svg>;
}

function CrisisMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 44 24 24 44 4 24z"/><circle cx="24" cy="24" r="12"/><path d="M24 16v10m0 6h.01"/></svg>;
}

function SystemSymbol({ name }) {
  const paths = {
    economy: <><path d="M4 19V5h16v14z"/><path d="M8 15v-3m4 3V8m4 7v-5"/></>,
    healthcare: <><path d="M12 4v16M4 12h16"/><circle cx="12" cy="12" r="9"/></>,
    education: <><path d="M3 8h18v12H3zM6 4h12v4H6z"/><path d="M7 12h.01M11 12h.01m4 0h2m-10 4h10"/></>,
    infrastructure: <><path d="M3 18h18M6 18V9l6-4 6 4v9"/><path d="M9 18v-5h6v5"/></>,
    environment: <><path d="M20 4C10 4 5 8 5 15c0 3 2 5 5 5 7 0 10-7 10-16z"/><path d="M4 21c3-5 7-8 12-11"/></>,
    governance: <><path d="m12 3 8 4v5c0 4-3 7-8 9-5-2-8-5-8-9V7z"/><path d="M8 12h8m-4-4v8"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function rewardSummary(reward = {}) {
  const parts = [];
  if (reward.treasury) parts.push(`${money(reward.treasury)} reward`);
  if (reward.buildingId) parts.push(`free ${reward.buildingId.replaceAll("_", " ")}`);
  if (Object.keys(reward.effects || {}).length) parts.push(formatEffects(reward.effects));
  return parts.join(" · ");
}

function missionDescription(mission) {
  const target = Number(mission.target);
  if (!Number.isFinite(target) || !mission.description) return mission.description || "Campaign objective";
  const display = target.toLocaleString();
  return mission.description.replace(/\d[\d,]*/, display);
}

function initialQuality() {
  try {
    const saved = localStorage.getItem("politaria-world-quality");
    if (["low", "medium", "high"].includes(saved)) return saved;
    return window.matchMedia?.("(max-width: 700px)").matches ? "low" : "medium";
  } catch { return "medium"; }
}

function WorldLoader({ message = "Preparing your city" }) {
  return <main className="city-loading-screen" role="status" aria-live="polite"><div className="city-loader-mark">P</div><p>POLITARIA</p><strong>{message}</strong><span className="city-loader-track"><i /></span></main>;
}

function AnimatedValue({ value, format }) {
  const [shown, setShown] = useState(Number(value || 0));
  const previous = useRef(Number(value || 0));
  const [direction, setDirection] = useState("");
  useEffect(() => {
    const target = Number(value || 0);
    const start = previous.current;
    if (target === start) return undefined;
    setDirection(target > start ? "up" : "down");
    const began = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - began) / 620);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(start + (target - start) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else { previous.current = target; window.setTimeout(() => setDirection(""), 380); }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <strong className={direction ? `count-pop count-${direction}` : "count-pop"}>{format(shown)}</strong>;
}

function SectorGauge({ stat, value }) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));
  const color = score > 60 ? "#92d77a" : score >= 35 ? "#f0c365" : "#ef806d";
  return <div className={`sector-gauge ${score < 25 ? "sector-danger" : ""}`} title={`${stat[1]} ${Math.round(score)}%`} aria-label={`${stat[1]} ${Math.round(score)} percent`}>
    <span className="gauge-ring" style={{ "--gauge-color": color, "--gauge-value": `${score}%` }}><i><SystemSymbol name={stat[0]} /></i></span><small>{stat[1]}</small><b>{Math.round(score)}</b>
  </div>;
}

function MissionCard({ mission, month, onOpen }) {
  const remaining = Math.max(0, Number(mission.deadlineMonth ?? (mission.startedOnMonth + (mission.deadlineMonths || 0))) - Number(month));
  const progress = mission.status === "completed" ? 100 : Math.max(0, Math.min(100, Number(mission.progressPercent || 0)));
  return <button className="quest-card" onClick={onOpen} title={`${missionDescription(mission)}. ${remaining} months remaining.`}>
    <span className="quest-star">★</span><span className="quest-copy"><strong>{mission.name || mission.missionId}</strong><small>{remaining} MO LEFT · {rewardSummary(mission.reward)}</small><i className="quest-track"><i style={{ width: `${progress}%` }} /></i></span><b>{progress}%</b>
  </button>;
}

function MissionSheet({ missions, month, onClose }) {
  return <div className="game-modal-backdrop sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="game-sheet agenda-sheet" role="dialog" aria-modal="true" aria-label="Mayor's missions"><button className="sheet-close" onClick={onClose} aria-label="Close missions">×</button><p className="hud-kicker">MAYOR'S AGENDA</p><h2>City missions</h2><div className="agenda-list">{missions.map((mission) => <article key={`${mission.missionId}-${mission.startedOnMonth}`} className={`agenda-item agenda-${mission.status}`}><div><strong>{mission.name || mission.missionId}</strong><span>{mission.status === "active" ? `${Math.max(0, Number(mission.deadlineMonth || month) - month)} months left` : mission.status}</span></div><p>{missionDescription(mission)}</p>{mission.status === "active" && <div className="quest-track"><i style={{ width: `${Math.max(0, Math.min(100, mission.progressPercent || 0))}%` }} /></div>}<small>★ {rewardSummary(mission.reward)}</small></article>)}</div><button className="hud-secondary" onClick={onClose}>Back to city</button></section></div>;
}

function ActionSheet({ title, kicker, onClose, children, className = "" }) {
  return <div className="game-modal-backdrop sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`game-sheet ${className}`} role="dialog" aria-modal="true" aria-label={title}><button className="sheet-close" onClick={onClose} aria-label="Close">×</button><p className="hud-kicker">{kicker}</p><h2>{title}</h2>{children}</section></div>;
}

export default function CityReadyPage() {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const gameRootRef = useRef(null);
  const recapTimer = useRef(null);
  const toastTimer = useRef(null);
  const { isFullscreen, supported: fullscreenSupported, toggleFullscreen } = useFullscreen(gameRootRef);
  const [city, setCity] = useState(null);
  const [catalog, setCatalog] = useState({ buildings: [], policies: [], missions: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedMapBuilding, setSelectedMapBuilding] = useState(null);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [quality, setQuality] = useState(initialQuality);
  const [sheet, setSheet] = useState("");
  const [toast, setToast] = useState("");
  const [recap, setRecap] = useState(null);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const oldHtml = document.documentElement.style.overflow;
    const oldBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = oldHtml; document.body.style.overflow = oldBody; window.clearTimeout(recapTimer.current); window.clearTimeout(toastTimer.current); };
  }, []);
  useEffect(() => { try { localStorage.setItem("politaria-world-quality", quality); } catch { /* storage is optional */ } }, [quality]);

  const load = useCallback(async () => {
    setError(""); setLoading(true);
    try {
      const [cityResult, buildingsResult, policiesResult, missionsResult] = await Promise.all([citiesApi.get(cityId), catalogApi.buildings(), catalogApi.policies(), catalogApi.missions()]);
      setCity(cityResult.city);
      setCatalog({ buildings: buildingsResult.buildings, policies: policiesResult.policies, missions: missionsResult.missions });
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, [cityId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!city) return;
    try { if (!localStorage.getItem(`politaria-tour-${city._id}`)) setTourStep(1); }
    catch { /* storage is optional */ }
  }, [city?._id]);

  const worldState = useMemo(() => toCityWorldState(city, catalog.buildings), [city, catalog.buildings]);
  const dismissToast = useCallback(() => { window.clearTimeout(toastTimer.current); setToast(""); }, []);

  async function perform(action, { monthChange = false, success = "Decision recorded" } = {}) {
    setError(""); setBusy(true); setToast("");
    try {
      const result = await action();
      if (result?.city) {
        setCity(result.city);
        if (monthChange) {
          window.dispatchEvent(new CustomEvent("cityworld:month-change", { detail: { month: result.city.month, status: result.city.status } }));
          const newMonth = Number(result.city.month);
          const entries = (result.city.log || []).filter((entry) => Number(entry.month) === newMonth).slice(-6);
          setRecap({ month: newMonth, entries });
          window.clearTimeout(recapTimer.current);
          recapTimer.current = window.setTimeout(() => setRecap(null), 3200);
        } else {
          setToast(success);
          window.clearTimeout(toastTimer.current);
          toastTimer.current = window.setTimeout(() => setToast(""), 2600);
        }
      }
      return result;
    } catch (requestError) {
      setError(requestError.message || "Could not complete that action.");
      window.dispatchEvent(new CustomEvent("cityworld:action-error", { detail: { message: requestError.message } }));
      return null;
    } finally { setBusy(false); }
  }

  if (loading) return <WorldLoader message="Opening your city" />;
  if (!city) return <main className="city-loading-screen"><div className="city-load-error"><Link className="back-link" to="/cities">← Back to your cities</Link><p className="form-error game-load-error" role="alert">{error || "This city could not be loaded."}</p></div></main>;

  const stats = city.stats || {};
  const pendingEvent = city.pendingEvents?.[0];
  const activePolicies = new Set((city.activePolicies || []).map((item) => item.policyId));
  const missionDefinitions = new Map(catalog.missions.map((mission) => [mission.id, mission]));
  const missions = (city.missions || []).map((mission) => ({ ...missionDefinitions.get(mission.missionId), ...mission }));
  const activeMissions = missions.filter((mission) => mission.status === "active").slice(0, 2);
  const gameOver = city.status !== "active";
  const trayBuildings = BUILD_PRIORITY.map((id) => catalog.buildings.find((building) => building.id === id)).filter(Boolean);
  const additionalBuildings = catalog.buildings.filter((building) => !BUILD_PRIORITY.includes(building.id));

  const handleBuildingSelect = (building) => {
    setSelectedMapBuilding(building);
    if (building?.focus) window.dispatchEvent(new CustomEvent("cityworld:focus-camera", { detail: building.focus }));
  };
  const cycleQuality = () => setQuality((current) => current === "low" ? "medium" : current === "medium" ? "high" : "low");
  const closeTour = () => {
    setTourStep(0);
    try { localStorage.setItem(`politaria-tour-${city._id}`, "seen"); } catch { /* storage is optional */ }
  };

  return <section ref={gameRootRef} className={`city-game city-quality-${quality} ${pendingEvent ? "city-in-crisis" : ""} ${busy ? "city-is-busy" : ""}`} aria-label={`${city.name} city game`}>
    <div className="city-world-fill"><Suspense fallback={<WorldLoader message="Building the city" />}><CityWorld cityState={worldState} onSelect={handleBuildingSelect} selectedId={selectedMapBuilding?.id} quality={quality} /></Suspense></div>

    <div className="world-hud">
      <header className="hud-top">
        <div className="mayor-chip">
          <img src={mayorPortrait} alt="Mayor" />
          <div><strong>{city.name}</strong><span>MONTH {city.month} · {city.status === "active" ? `CHALLENGE TIER ${Math.floor(Number(city.month || 0) / 20) + 1}` : city.status.toUpperCase()}</span></div>
          <span className={`approval-face ${Number(stats.approval) < 50 ? "approval-angry" : Number(stats.approval) < 60 ? "approval-neutral" : Number(stats.approval) < 75 ? "approval-smile" : "approval-happy"}`} title={`Public approval ${Math.round(stats.approval || 0)}%`}><ApprovalMark value={stats.approval} /><small>{Math.round(stats.approval || 0)}%</small></span>
        </div>
        <div className="resource-pills"><div className="resource-pill treasury-pill"><span><ResourceMark type="treasury" /></span><AnimatedValue value={stats.treasury} format={money} /></div><div className="resource-pill"><span><ResourceMark type="population" /></span><AnimatedValue value={stats.population} format={(value) => Number(value || 0).toLocaleString()} /></div></div>
        <div className="hud-top-actions"><button className="hud-icon-button" onClick={() => setSheet("settings")} aria-label="Settings" title="Settings">⚙</button><button className="hud-icon-button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} title={fullscreenSupported ? "Fullscreen (F)" : "Full viewport (F)"}>{isFullscreen ? "↙" : "⛶"}</button><button className="hud-icon-button" onClick={() => { signOut(); navigate("/", { replace: true }); }} aria-label="Log out" title="Log out">⇥</button></div>
      </header>

      <aside className="sector-dock" aria-label="City systems">{SECTORS.map((stat) => <SectorGauge key={stat[0]} stat={stat} value={stats[stat[0]]} />)}</aside>

      <aside className="quest-dock" aria-label="Active missions"><div className="quest-dock-heading"><span>✦ MAYOR'S MISSIONS</span><button onClick={() => setSheet("missions")} aria-label="All missions">•••</button></div>{activeMissions.length ? activeMissions.map((mission) => <MissionCard key={`${mission.missionId}-${mission.startedOnMonth}`} mission={mission} month={city.month} onOpen={() => setSheet("missions")} />) : <button className="quest-empty" onClick={() => setSheet("missions")}>No active missions · open agenda</button>}</aside>

      <div className="world-toolbar"><button className="hud-small-button" onClick={() => window.dispatchEvent(new Event("cityworld:reset-camera"))}>⌖ <span>RE-CENTER</span></button><button className="hud-small-button" onClick={cycleQuality} title="Change graphics quality">◌ <span>{quality.toUpperCase()}</span></button><span className="camera-hint">DRAG TO EXPLORE · PINCH / SCROLL TO ZOOM</span></div>

      <div className="build-dock" aria-label="Build menu"><span className="dock-label">BUILD</span>{trayBuildings.map((building) => <button className="build-tile" key={building.id} disabled={busy || gameOver || Number(stats.treasury) < building.cost} onClick={() => setSelectedBuild(building)} title={`${building.name} · ${money(building.cost)}`}><i><BuildSymbol id={building.id} /></i><small>{building.name}</small><b>{money(building.cost)}</b></button>)}<button className="build-more" onClick={() => setSheet("buildings")} aria-label="More buildings">＋<small>MORE</small></button></div>

      <div className="hud-actions"><button className="policy-orb" onClick={() => setSheet("policies")} aria-label="Open policies"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4m1 1h12l-3 4 3 4H6"/></svg></span><small>POLICIES</small></button><button className="month-cta" disabled={busy || gameOver || Boolean(pendingEvent)} onClick={() => perform(() => citiesApi.advanceMonth(cityId), { monthChange: true })}><span className="month-cta-icon">{busy ? <i className="hud-spinner" /> : pendingEvent ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg>}</span><span>{busy ? "TURNING THE MONTH" : pendingEvent ? "RESOLVE THE CRISIS" : "NEXT MONTH"}</span><small>{pendingEvent ? "A crisis needs your decision" : "Collect · Maintain · Grow"}</small></button><button className="hud-small-button tax-shortcut" onClick={() => setSheet("finance")} aria-label="Open city finances">₹ <span>TAX {city.taxRate}%</span></button></div>
    </div>

    {error && <button className="game-toast game-toast-error" onClick={() => setError("")} role="alert"><CrisisMark /> {error}<span>×</span></button>}
    {!error && toast && <button className="game-toast" onClick={dismissToast} role="status">✦ {toast}<span>×</span></button>}
    {recap && <div className={`month-recap ${recap.entries.some((entry) => entry.type === "milestone") ? "recap-milestone" : ""}`} role="status"><strong>{recap.entries.some((entry) => entry.type === "milestone") ? "✦ CITY LEGACY · " : "MONTH "}{recap.month}{recap.entries.some((entry) => entry.type === "milestone") ? " · SURVIVAL REWARD" : " · CITY REPORT"}</strong><button onClick={() => setRecap(null)} aria-label="Dismiss month report">×</button>{recap.entries.length ? recap.entries.map((entry, index) => <p key={`${entry.type}-${index}`} className={`recap-${entry.type}`}>{entry.type === "revenue" ? "＋" : entry.type === "expense" ? "−" : entry.type === "milestone" ? "✦" : "•"} {entry.message}</p>) : <p>The city has moved into a new month.</p>}</div>}
    {city.warnings?.length > 0 && city.status === "active" && <div className="danger-pip" title={city.warnings.join(" ")}><CrisisMark /> CITY ALERT <span>{city.warnings.length}</span></div>}

    {pendingEvent && <div className="crisis-backdrop"><section className="crisis-reveal" role="dialog" aria-modal="true" aria-labelledby="crisis-title"><div className="crisis-art"><span><CrisisMark /></span><i>{pendingEvent.category || "CITY CRISIS"} · MONTH {pendingEvent.triggeredOnMonth}</i></div><p className="hud-kicker">THE CITY NEEDS YOU</p><h2 id="crisis-title">{pendingEvent.title}</h2><p className="crisis-description">{pendingEvent.description}</p><p className="crisis-deliberation">Choose your response. The city will live with the consequences.</p><div className="crisis-choice-grid">{pendingEvent.choices.map((choice, index) => <button className="crisis-choice" key={choice.id} disabled={busy || gameOver} onClick={() => perform(() => citiesApi.resolveEvent(cityId, pendingEvent.eventId, choice.id), { success: "Crisis response carried out" })}><span className="choice-number">0{index + 1}</span><strong>{choice.label}</strong><b>{busy ? "Working…" : "ISSUE DIRECTIVE  →"}</b></button>)}</div></section></div>}

    {gameOver && <div className={`game-modal-backdrop outcome-backdrop outcome-${city.status}`}><section className="outcome-modal" role="dialog" aria-modal="true"><div className="outcome-stars">{city.status === "won" ? "★ ★ ★" : "✦"}</div><p className="hud-kicker">MAYORAL TERM · MONTH {city.outcome?.month ?? city.month}</p><h2>{city.status === "won" ? "THE CITY THRIVES" : "YOUR TERM IS OVER"}</h2><p>{city.outcome?.reason || city.outcomeReason}</p>{city.outcome && <div className="outcome-score"><strong>{city.outcome.score}</strong><span>SCORE</span><b>{"★".repeat(city.outcome.stars)}{"☆".repeat(3 - city.outcome.stars)}</b></div>}{city.outcome?.failingStat && <div className="failing-stat"><CrisisMark /> WHAT WENT WRONG <strong>{city.outcome.failingStat}</strong></div>}<div className="outcome-actions"><button className="month-cta" onClick={async () => { const result = await perform(() => citiesApi.restart(cityId), { success: "New term started" }); if (result?.city?._id) navigate(`/cities/${result.city._id}`, { replace: true }); }}>PLAY AGAIN</button><Link className="hud-secondary" to="/cities">BACK TO CITIES</Link></div></section></div>}

    {selectedBuild && <ActionSheet title={`Build ${selectedBuild.name}?`} kicker="NEW CITY PROJECT" onClose={() => setSelectedBuild(null)} className="build-confirm-sheet"><div className="build-confirm-icon"><BuildSymbol id={selectedBuild.id} /></div><p className="build-confirm-copy">This project changes the city and contributes to its {selectedBuild.category || "public services"}.</p><div className="build-cost-row"><span>PROJECT COST</span><strong>{money(selectedBuild.cost)}</strong><span>MONTHLY UPKEEP</span><strong>{money(selectedBuild.upkeep)}</strong></div><div className="sheet-actions"><button className="hud-secondary" onClick={() => setSelectedBuild(null)}>Not now</button><button className="month-cta compact-cta" disabled={busy || gameOver || Number(stats.treasury) < selectedBuild.cost} onClick={async () => { const projectName = selectedBuild.name; const result = await perform(() => citiesApi.build(cityId, selectedBuild.id), { success: `${projectName} construction started` }); if (result) setSelectedBuild(null); }}>START CONSTRUCTION · {money(selectedBuild.cost)}</button></div></ActionSheet>}

    {sheet === "buildings" && <ActionSheet title="Choose a city project" kicker="PUBLIC WORKS" onClose={() => setSheet("")} className="catalog-sheet"><div className="building-catalog">{additionalBuildings.concat(trayBuildings).map((building) => <button className="catalog-building" key={building.id} disabled={busy || gameOver || Number(stats.treasury) < building.cost} onClick={() => { setSheet(""); setSelectedBuild(building); }}><i><BuildSymbol id={building.id} /></i><span><strong>{building.name}</strong><small>{money(building.cost)} · {money(building.upkeep)}/mo</small></span><b>＋</b></button>)}</div></ActionSheet>}

    {sheet === "policies" && <ActionSheet title="Set the city's direction" kicker="CITY POLICIES" onClose={() => setSheet("")} className="catalog-sheet"><div className="policy-catalog">{catalog.policies.map((policy) => <article className="policy-card" key={policy.id}><div><strong>{policy.name}</strong><small>{policy.monthlyCost ? `${money(policy.monthlyCost)} / month upkeep` : "No monthly upkeep"}</small><small>{formatEffects(policy.monthlyEffects)}</small></div><button className={activePolicies.has(policy.id) ? "policy-toggle is-active" : "policy-toggle"} disabled={busy || gameOver} onClick={() => perform(() => activePolicies.has(policy.id) ? citiesApi.revokePolicy(cityId, policy.id) : citiesApi.enactPolicy(cityId, policy.id), { success: activePolicies.has(policy.id) ? "Policy repealed" : "Policy enacted" })}>{activePolicies.has(policy.id) ? "ON" : "ENACT"}</button></article>)}</div></ActionSheet>}

    {sheet === "finance" && <ActionSheet title="City finances" kicker="TREASURY & TAX" onClose={() => setSheet("")}><p className="sheet-summary">Tax brings income to the treasury. Higher rates can slow the economy and reduce confidence.</p><label className="tax-control">TAX RATE <strong>{city.taxRate}%</strong><select aria-label="Set city tax rate" value={city.taxRate} disabled={busy || gameOver} onChange={(event) => perform(() => citiesApi.updateTaxRate(cityId, Number(event.target.value)), { success: "Tax rate updated" })}>{[0, 5, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}</select></label><div className="finance-recent">{(city.log || []).slice(-4).reverse().map((entry, index) => <p key={`${entry.month}-${index}`}><small>MONTH {entry.month}</small>{entry.message}</p>)}</div></ActionSheet>}

    {sheet === "missions" && <MissionSheet missions={missions.slice().reverse()} month={city.month} onClose={() => setSheet("")} />}
    {sheet === "settings" && <ActionSheet title="City settings" kicker="YOUR GAME" onClose={() => setSheet("")}><div className="settings-rows"><label>WORLD QUALITY<select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><button className="hud-secondary" onClick={() => { setSheet(""); setTourStep(1); }}>Show the city tour</button><button className="hud-secondary" onClick={() => { setSheet(""); navigate("/cities"); }}>Save & return to campaigns</button></div></ActionSheet>}
    {sheet === "leave" && <ActionSheet title="Leave this city?" kicker="YOUR CITY IS SAVED" onClose={() => setSheet("")}><p className="sheet-summary">Your progress is saved. You can return to this city from campaigns.</p><div className="sheet-actions"><button className="hud-secondary" onClick={() => setSheet("")}>Stay here</button><button className="month-cta compact-cta" onClick={() => { setSheet(""); navigate("/cities"); }}>CAMPAIGNS</button><button className="hud-secondary" onClick={() => { setSheet(""); signOut(); navigate("/", { replace: true }); }}>LOG OUT</button></div></ActionSheet>}
    {tourStep > 0 && <div className="tour-backdrop"><section className="tour-card" role="dialog" aria-modal="true"><p className="hud-kicker">MAYOR'S QUICK TOUR · {tourStep}/4</p><h2>{["Your city, at a glance", "Watch the city's systems", "Build a living city", "Take the next month"] [tourStep - 1]}</h2><p>{["This world is your city. Drag to orbit, zoom in, and tap a building to inspect it.", "The gauges show the health of your economy, healthcare, education, roads, nature, and civic services.", "Start a project from the build tray. Its construction and effects appear in the world.", "Choose a mission, make a decision, then advance time. Crises pause the calendar until you respond."][tourStep - 1]}</p><div className="tour-actions"><button className="hud-secondary" onClick={closeTour}>SKIP TOUR</button><button className="month-cta compact-cta" onClick={() => tourStep === 4 ? closeTour() : setTourStep(tourStep + 1)}>{tourStep === 4 ? "LET'S PLAY" : "NEXT →"}</button></div></section></div>}

    {selectedMapBuilding && <button className="map-selection-chip" onClick={() => setSelectedMapBuilding(null)}><span>⌂</span><span><strong>{selectedMapBuilding.name}</strong><small>{selectedMapBuilding.description}</small></span><b>×</b></button>}
  </section>;
}
