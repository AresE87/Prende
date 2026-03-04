import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({ children, hostOnly = false }) {
  const { state, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (hostOnly && !state.user.isHost) {
    return <Navigate to="/" replace />;
  }

  return children;
}
