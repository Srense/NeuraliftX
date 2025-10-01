import {React,useEffect} from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Draggable from 'react-draggable';

import Homepage from "./Components/Homepage";
import LoginSignup from "./Components/LoginSignup";
import Student from './Components/Student';
import Faculty from './Components/Faculty';
import QuizPage from "./Components/QuizPage";
import VerifyEmail from "./Components/VerifyEmail";
import PdfViewerPage from "./Components/PDFViewer";
import Admin from "./Components/Admin";
import Alumni from "./Components/Alumni";

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


  useEffect(() => {
    const addGoogleTranslateScript = () => {
      const script = document.createElement('script');
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en', // change as required
          },
          'google_translate_element'
        );
      };
    };
    addGoogleTranslateScript();
  }, []);

  return (
    <Router>
      <Draggable>
      <div
        id="google_translate_element"
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          zIndex: 9999,
          background: "#fff",
          padding: 5,
          borderRadius: 8,
          cursor: "move",
          width: 32,
          height: 32,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      ></div>
    </Draggable>
      <Routes>
        
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/student-login" element={<LoginSignup />} />
        <Route path="/faculty-login" element={<LoginSignup />} />
        <Route path="/alumni-login" element={<LoginSignup />} />
        <Route path="/admin-login" element={<LoginSignup />} />
        <Route path="/quiz/:assignmentId" element={<QuizPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/pdf-viewer" element={<PdfViewerPage />} />

        {/* Protected routes per role */}
        <Route element={<RoleBasedRoute allowedRoles={['student']} />}>
          <Route path="/student/*" element={<Student />} />
        </Route>
        <Route element={<RoleBasedRoute allowedRoles={['faculty']} />}>
          <Route path="/faculty/*" element={<Faculty />} />
        </Route>
        <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/*" element={<Admin />} />
        </Route>
        <Route element={<RoleBasedRoute allowedRoles={['alumni']} />}>
          <Route path="/alumni/*" element={<Alumni />} />
        </Route>

        

        {/* Fallback to homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    
  );
};

export default App;
