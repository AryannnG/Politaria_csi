import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingMessage from "../components/feedback/LoadingMessage.jsx";
import { citiesApi } from "../services/api.js";

export default function CitiesPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await citiesApi.delete(pendingDelete._id);
      setCities((current) => current.filter((city) => city._id !== pendingDelete._id));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err.message || "The city could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let active = true;
    citiesApi.list()
      .then(({ cities: results }) => { if (active) setCities(results); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="page-wrap content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR CAMPAIGNS</p>
          <h1>Your cities</h1>
          <p className="muted">Every city is a chance to make things better.</p>
        </div>
        <Link className="button" to="/cities/new">Create a city <span aria-hidden="true">+</span></Link>
      </div>
      {loading ? <LoadingMessage>Gathering your city reports...</LoadingMessage>
        : error ? <p className="form-error" role="alert">{error}</p>
          : cities.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">+</span>
              <h2>A clean slate.</h2>
              <p>Your first city is waiting to take shape.</p>
              <Link className="button" to="/cities/new">Create your first city</Link>
            </div>
          ) : (
            <div className="city-grid">
              {cities.map((city) => (
                <article className="city-card" key={city._id}>
                  <div className="city-card-top">
                    <span className="city-symbol" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M7 33V15l13-8 13 8v18M12 33V19h16v14M17 24h2m4 0h2m-8 5h2m4 0h2M4 34h32"/><path d="M17 13V8h6v5"/></svg></span>
                    <span className={`pill pill-${city.status}`}>{city.status}</span>
                  </div>
                  <h2>{city.name}</h2>
                  <p className="city-month">Month {city.month}</p>
                  <div className="city-stats">
                    <span><small>POPULATION</small><strong>{Number(city.stats?.population || 0).toLocaleString()}</strong></span>
                    <span><small>TREASURY</small><strong>${Number(city.stats?.treasury || 0).toLocaleString()}</strong></span>
                    <span><small>APPROVAL</small><strong>{city.stats?.approval ?? 0}%</strong></span>
                  </div>
                  <div className="city-card-actions">
                    <Link className="card-link" to={`/cities/${city._id}`}>Open city <b aria-hidden="true">-&gt;</b></Link>
                    <button className="city-delete-button" type="button" onClick={() => { setPendingDelete(city); setDeleteError(""); }} aria-label={`Delete ${city.name}`} title="Delete city"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 3v7m4-7v7"/></svg></button>
                  </div>
                </article>
              ))}
            </div>
          )}
      {pendingDelete && <div className="delete-city-backdrop"><section className="delete-city-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-city-title"><div className="delete-city-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 3v7m4-7v7"/></svg></div><p className="eyebrow">PERMANENT CITY RECORD</p><h2 id="delete-city-title">Delete {pendingDelete.name}?</h2><p>This removes the city and its campaign history from your account.</p>{deleteError && <p className="form-error" role="alert">{deleteError}</p>}<div className="delete-city-actions"><button className="hud-secondary" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Keep city</button><button className="delete-confirm-button" type="button" disabled={deleting} onClick={confirmDelete}>{deleting ? "Deleting…" : "Delete city"}</button></div></section></div>}
    </section>
  );
}
