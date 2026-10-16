import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/forms/AuthForm.jsx";
import { authApi } from "../services/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const session = await authApi.register({ username: form.get("username"), email: form.get("email"), password: form.get("password") });
      signIn(session);
      navigate("/cities", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout page-wrap">
      <div className="auth-aside">
        <p className="eyebrow">A NEW CAMPAIGN</p>
        <h1>Every great city starts somewhere.</h1>
        <p>Take the seat, meet the moment, and make the choices that move your city forward.</p>
      </div>
      <div className="form-card">
        <p className="eyebrow">POLITARIA / MAYOR</p>
        <h2>Create your account</h2>
        <p className="muted">Your first day as mayor starts here.</p>
        <AuthForm mode="register" onSubmit={handleSubmit} loading={loading} error={error} />
        <p className="form-footnote">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </section>
  );
}
