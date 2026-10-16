import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../state/AuthContext.jsx";

export default function AppShell({ children }) {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" to="/" aria-label="POLITARIA home">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-name">
              <span className="brand-title">POLITARIA</span>
              <span className="brand-subtitle">A CITY IS IN YOUR HANDS</span>
            </span>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            {isAuthenticated ? (
              <>
                <NavLink to="/cities">Campaigns</NavLink>
                <span className="nav-user">{user?.username}</span>
                <button className="text-button" onClick={signOut}>Leave office</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <Link className="button button-small" to="/register">Take office</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main><div className="shell-main-inner">{children}</div></main>
      <footer className="site-footer">
        <span className="footer-name">POLITARIA</span>
        <span>Lead with care. Live with the consequences.</span>
      </footer>
    </div>
  );
}
