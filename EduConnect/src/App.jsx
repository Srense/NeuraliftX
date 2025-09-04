import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Homepage from "./Components/Homepage";
import LoginSignup from "./Components/LoginSignup";
import Student from './Components/Student';
import Faculty from './Components/Faculty';
import QuizPage from "./Components/QuizPage";

// Role-based protected route for multi-session support
const RoleBasedRoute = ({ allowedRoles }) => {
  // Try all possible role tokens
  const possibleTokens = [
    localStorage.getItem("token_student"),
    localStorage.getItem("token_faculty"),
    localStorage.getItem("token_admin"),
    localStorage.getItem("token_alumni")
  ].filter(Boolean);

  let foundRole = null;
  let foundToken = null;

  for (let tkn of possibleTokens) {
    try {
      const { role } = jwtDecode(tkn);
      if (allowedRoles.includes(role)) {
        foundRole = role;
        foundToken = tkn;
        break;
      }
    } catch {
      // ignore decode failure
    }
  }

  if (foundRole) {
    return <Outlet />;
  } else if (possibleTokens.length > 0) {
    // Redirect to the dashboard for the first found valid role
    for (let tkn of possibleTokens) {
      try {
        const { role } = jwtDecode(tkn);
        switch (role) {
          case "student": return <Navigate to="/student" replace />;
          case "faculty": return <Navigate to="/faculty" replace />;
          case "admin": return <Navigate to="/admin" replace />;
          case "alumni": return <Navigate to="/alumni" replace />;
          default: break;
        }
      } catch {}
    }
    // If none matched, send to login
    return <Navigate to="/login" replace />;
  } else {
    // No token at all: user must log in
    return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/student-login" element={<LoginSignup />} />
        <Route path="/faculty-login" element={<LoginSignup />} />
        <Route path="/alumni-login" element={<LoginSignup />} />
        <Route path="/admin-login" element={<LoginSignup />} />
        <Route path="/quiz/:assignmentId" element={<QuizPage />} />

        {/* Protected routes per role */}
        <Route element={<RoleBasedRoute allowedRoles={['student']} />}>
          <Route path="/student/*" element={<Student />} />
        </Route>
        <Route element={<RoleBasedRoute allowedRoles={['faculty']} />}>
          <Route path="/faculty/*" element={<Faculty />} />
        </Route>
        {/* Add similar for admin and alumni */}

        {/* Fallback to homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
