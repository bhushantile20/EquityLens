// import { Navigate } from "react-router-dom";
// import { isAuthenticated } from "../utils/auth";
// import API from "../api/axios";

// export default function ProtectedRoute({ children }) {
//   return isAuthenticated() ? children : <Navigate to="/login" replace />;
// }

import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;