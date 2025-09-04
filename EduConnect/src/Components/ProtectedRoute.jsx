import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken"); // Check token presence

  if (!token) {
    // Redirect to login if no token found
    return <Navigate to="/student-login" replace />;
  }

  // Render the children only if token found
  return children;
}
