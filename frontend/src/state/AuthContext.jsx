import { createContext, useContext, useMemo, useState } from "react";
import { TOKEN_KEY } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mayor_user") || "null");
    } catch {
      return null;
    }
  });

  function signIn(session) {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem("mayor_user", JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("mayor_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, isAuthenticated: Boolean(token), signIn, signOut }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
