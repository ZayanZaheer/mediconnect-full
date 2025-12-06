import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function RequireAuth({ roles, children }) {
  const { isAuthenticated, role, user } = useAuth();
  const loc = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  // Normalize both sides
  const currentRole =
    role?.trim()?.toLowerCase() ||
    user?.role?.trim()?.toLowerCase() ||
    "";

  const allowed = roles.map((r) => r.toLowerCase());

  if (!allowed.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
