import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../state/AuthContext.jsx";

function CityHallScene() {
  return <div className="mayor-world" role="img" aria-label="A mayor reviews city plans in a city hall overlooking a growing city">
    <svg className="mayor-city-map" viewBox="0 0 720 500" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cityDawn" x2="0" y2="1"><stop stopColor="#aec7bf"/><stop offset="1" stopColor="#e4d5b6"/></linearGradient>
        <linearGradient id="river" x2="0" y2="1"><stop stopColor="#769d9a"/><stop offset="1" stopColor="#a7c4b5"/></linearGradient>
        <pattern id="mapBlocks" width="92" height="76" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
          <path d="M6 7h26v18H6zM49 4h34v24H49zM9 42h21v27H9zM45 42h39v27H45z" fill="#c6b795" stroke="#988e76" strokeWidth="1.4"/>
          <path d="M11 11h5v5h-5zM20 11h6v5h-6zM54 9h8v5h-8zM68 9h8v5h-8zM13 47h5v6h-5zM51 47h8v6h-8zM64 47h8v6h-8z" fill="#697b72"/>
        </pattern>
      </defs>
      <rect width="720" height="500" fill="url(#cityDawn)"/>
      <path d="M0 270 720 84v416H0z" fill="#869778"/>
      <path d="M0 270 720 84v416H0z" fill="url(#mapBlocks)" opacity=".79"/>
      <path d="M-24 404C110 320 186 423 286 354S450 237 749 291" fill="none" stroke="#dacaa9" strokeWidth="54"/>
      <path d="M-24 404C110 320 186 423 286 354S450 237 749 291" fill="none" stroke="#596364" strokeWidth="37"/>
      <path d="M-24 404C110 320 186 423 286 354S450 237 749 291" fill="none" stroke="#e6d9b9" strokeWidth="2" strokeDasharray="13 12"/>
      <path d="M489 83c-21 82 26 140 10 212s-50 128-22 205h243V0H526z" fill="url(#river)" opacity=".9"/>
      <path d="M-20 170 605 376M90 40l-40 448M307 0l-52 500M-20 315 670 96" fill="none" stroke="#d4c4a2" strokeWidth="19"/>
      <path d="M-20 170 605 376M90 40l-40 448M307 0l-52 500M-20 315 670 96" fill="none" stroke="#717879" strokeWidth="12"/>
      <path d="M-20 170 605 376M90 40l-40 448M307 0l-52 500M-20 315 670 96" fill="none" stroke="#e4d6b8" strokeWidth="1.2" strokeDasharray="8 9"/>
      <path d="M92 251l80-46 70 27-15 77-94 25zM332 120l85-26 30 44-28 62-79 4zM339 321l76-49 68 24-20 73-89 25z" fill="#788967" stroke="#e5d2a6" strokeWidth="4"/>
      <g className="map-car"><rect x="250" y="346" width="22" height="11" rx="4" fill="#b65e49"/><rect x="254" y="348" width="9" height="4" fill="#d5e0d4"/></g>
      <g className="map-car map-car-two"><rect x="444" y="281" width="20" height="10" rx="4" fill="#e1c476"/><rect x="447" y="283" width="8" height="4" fill="#d5e0d4"/></g>
      <g className="city-label"><rect x="60" y="50" width="152" height="33" rx="2"/><text x="74" y="71">NORTHBANK · DISTRICT 01</text></g>
    </svg>
    <div className="scene-vignette"/>
    <div className="scene-readout"><span className="signal-mark"><i/><i/><i/></span><span>LIVE CITY PLAN</span><b>MONTH 01</b></div>
    <div className="city-hall-window"><span className="window-label">NORTHBANK AT FIRST LIGHT</span></div>
    <div className="briefing-panel">
      <div className="briefing-panel-head"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5h16v14H4Zm3-4 3-4 2 2 4-5"/><path d="M7 8h.01M11 8h.01M15 8h.01"/></svg><span>THE MORNING BRIEF</span><i>IN SESSION</i></div>
      <div className="briefing-row"><span>PUBLIC WORKS</span><b><i style={{width:"71%"}}/></b><strong>71</strong></div>
      <div className="briefing-row"><span>CITIZEN TRUST</span><b><i style={{width:"50%"}}/></b><strong>50</strong></div>
      <div className="briefing-note"><span className="briefing-rule"/> Roads, clinics and schools are on today's agenda.</div>
    </div>
    <div className="mayor-desk">
      <svg className="mayor-figure" viewBox="0 0 260 260" aria-hidden="true">
        <path className="mayor-back" d="M39 259c6-57 24-101 70-111h42c48 12 63 54 70 111z" fill="#344b40"/>
        <path d="m108 149 22 32 23-32 19 110H87z" fill="#f1ead9"/>
        <path d="m130 180 14 9-11 47-12-46z" fill="#ad7658"/>
        <path d="M84 105c0-44 17-68 47-68s47 24 47 68c0 30-19 51-47 51s-47-21-47-51z" fill="#b8795c"/>
        <path d="M83 95c-6-42 11-71 51-71 29 0 47 18 48 54-17-6-27-22-30-35-18 22-43 30-69 30z" fill="#32392f"/>
        <path d="M105 107h8m39 0h8" stroke="#453b34" strokeWidth="4" strokeLinecap="round"/>
        <path d="M120 127q11 8 22 0" fill="none" stroke="#734e42" strokeWidth="3" strokeLinecap="round"/>
        <path className="mayor-arm" d="M79 169c-29 20-42 46-47 71l31 8c17-22 32-34 49-44z" fill="#b8795c"/>
        <path d="M48 239c-3 12 5 20 17 14l15-11-21-12z" fill="#b8795c"/>
        <path className="mayor-pen" d="m72 236 25-33" stroke="#d9b56f" strokeWidth="4" strokeLinecap="round"/>
        <path d="M183 176c27 20 39 41 48 64l-24 12c-20-15-38-29-55-41z" fill="#344b40"/>
      </svg>
      <div className="desk-edge"/>
      <div className="desk-paper"><span>INFRASTRUCTURE PLAN</span><i/><i/><i/></div>
      <div className="desk-seal"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 34 9v10c0 9-6 15-14 19C12 34 6 28 6 19V9z"/><path d="M12 25V15h16v10M15 15V11h10v4m-5 10v-6"/></svg></div>
    </div>
    <div className="scene-caption"><span>OFFICE OF THE MAYOR</span><b>EVERY DECISION LEAVES A MARK.</b></div>
  </div>;
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!signing) return undefined;
    const timer = window.setTimeout(() => navigate(isAuthenticated ? "/cities" : "/login"), 1450);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, navigate, signing]);

  return (
    <section className={`hero page-wrap ${signing ? "hero-signing" : ""}`}>
      <div className="hero-copy">
        <p className="hero-brand">POLITARIA <span className="status-dot" /> CITY LEADERSHIP SIMULATION</p>
        <p className="hero-eyebrow">A NEW TERM BEGINS</p>
        <h1>The city is listening.<br />Will you <em>lead?</em></h1>
        <p className="hero-description">Step up to the podium. Build a thriving city, answer to its people, and live with every choice you make.</p>
        <div className="speech-line"><span className="speech-mark">“</span><p>My fellow citizens, our future is something we build together.</p><small>— YOUR FIRST ADDRESS</small></div>
        <div className="hero-actions">
          <button className="button oath-button" type="button" onClick={() => isAuthenticated ? navigate("/cities") : setSigning(true)} disabled={signing}>
            {isAuthenticated ? "Resume a campaign" : signing ? "Signing the oath…" : "Become mayor"}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 11-11 4 4L8 21H4v-4Z"/><path d="m13 8 4 4M4 21l5-1"/></svg>
          </button>
          <Link className="quiet-link" to={isAuthenticated ? "/cities" : "/login"}>{isAuthenticated ? "Choose a city" : "Returning mayor? Log in"}</Link>
        </div>
      </div>
      <CityHallScene />
      <div className="hero-note"><span className="note-line" /> LEAD A CITY. LIVE WITH THE CONSEQUENCES.<span className="hero-months">MONTH 01 — THE FIRST DAY IN OFFICE</span></div>
      {signing && <div className="oath-overlay" role="status" aria-live="polite"><div className="oath-document"><span>OFFICE OF THE MAYOR</span><h2>Oath of service</h2><p>I pledge to serve this city and its people with courage, care, and accountability.</p><div className="oath-signature">Your signature</div><small>APPOINTMENT CONFIRMED</small><i className="oath-seal"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 34 9v10c0 9-6 15-14 19C12 34 6 28 6 19V9z"/><path d="M12 25V15h16v10M15 15V11h10v4m-5 10v-6"/></svg></i></div><strong className="oath-caption">THE CITY AWAITS ITS MAYOR</strong></div>}
    </section>
  );
}
