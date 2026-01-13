import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const isAuth = localStorage.getItem("isAuth") === "true";

  if (isAuth) {
    return <Navigate to="/create-result" replace />;
  }

  return children;
}
