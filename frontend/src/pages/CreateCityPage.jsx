import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { citiesApi } from "../services/api.js";

export default function CreateCityPage() {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { city } = await citiesApi.create(name.trim(), difficulty);
      navigate(`/cities/${city._id}`, { replace: true, state: { cityName: city.name } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-wrap create-layout">
      <Link className="back-link" to="/cities">&lt;- Back to your cities</Link>
      <div className="create-card">
        <p className="eyebrow">A PLACE TO BEGIN</p>
        <h1>What will you call it?</h1>
        <p className="muted">Give your new city a name. You can shape the rest as you go.</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label htmlFor="city-name">City name
            <input id="city-name" name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. New Haven" required maxLength="60" autoFocus />
          </label>
          <label htmlFor="city-difficulty">Challenge
            <select id="city-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="easy">Easy · larger reserve, gentler crises</option>
              <option value="normal">Normal · balanced city</option>
              <option value="hard">Hard · tighter reserve, more crises</option>
            </select>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-full" type="submit" disabled={loading || !name.trim()}>
            {loading ? "Creating your city..." : "Create city"}<span aria-hidden="true">-&gt;</span>
          </button>
        </form>
      </div>
    </section>
  );
}
