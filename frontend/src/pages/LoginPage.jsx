import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthForm from "../components/forms/AuthForm.jsx";
import { authApi } from "../services/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const session = await authApi.login({ email: form.get("email"), password: form.get("password") });
      signIn(session);
      navigate(location.state?.from?.pathname || "/cities", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout page-wrap">
      <div className="auth-aside">
        <p className="eyebrow">RETURN TO YOUR CAMPAIGN</p>
        <h1>The city is ready for you.</h1>
        <p>Pick up where you left off and keep building a place people are proud to call home.</p>
      </div>
      <div className="form-card">
        <p className="eyebrow">POLITARIA / MAYOR</p>
        <h2>Log in</h2>
        <p className="muted">Good to have you back.</p>
        <AuthForm mode="login" onSubmit={handleSubmit} loading={loading} error={error} />
        <p className="form-footnote">New to the office? <Link to="/register">Create an account</Link></p>
      </div>
    </section>
  );
}
