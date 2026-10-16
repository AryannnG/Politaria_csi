export default function AuthForm({ mode, onSubmit, loading, error }) {
  const isRegister = mode === "register";

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      {isRegister && <label>Username<input name="username" autoComplete="username" required minLength="2" /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 8 : undefined} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-full" type="submit" disabled={loading}>{loading ? "Please wait..." : isRegister ? "Create account" : "Log in"}</button>
    </form>
  );
}
