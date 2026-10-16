import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../state/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? (children || <Outlet />) : <Navigate to="/login" replace state={{ from: location }} />;
}
