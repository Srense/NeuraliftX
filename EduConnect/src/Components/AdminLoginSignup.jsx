import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // for navigation after login/signup
import "./StudentLoginSignup.css";
import logo from "../assets/Logo.png"; // Adjust path as needed
import ThreeDBox from "./ThreeDGlobe";

export default function AdminLoginSignup() {
  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveTokenAndRedirect = (token) => {
    localStorage.setItem("authToken", token);
    navigate("/admin"); // redirect to admin dashboard route
  };

  const safeJson = async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uidEmail: formData.email || formData.username,
          password: formData.password,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Login failed");
      setSuccessMsg("Login successful! Redirecting...");
      saveTokenAndRedirect(data.token);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.username ||
      !formData.password
    ) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "admin" }), // pass role = admin explicitly
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Signup failed");
      setSuccessMsg("Signup successful! Redirecting to login...");
      setShowSignup(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: ""
      });
      navigate("/admin-login"); // or your admin login route
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-root">
      <div className="auth-bg-shape shape1" />
      <div className="auth-bg-shape shape2" />
      <div className="auth-bg-shape shape3" />

      <div className={`auth-card${showSignup ? " signup" : ""}`}>
        <ThreeDBox />
        <img src={logo} alt="EduConnect Logo" className="auth-logo" />
        <h2 className="auth-title">
          {showSignup
            ? "Admin Sign Up"
            : showForgot
            ? "Forgot Password"
            : "Admin Login"}
        </h2>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {showSignup ? (
          <form autoComplete="off" className="auth-form" onSubmit={handleSignupSubmit}>
            <div className="auth-row">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={loading}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
            <div className="auth-footer">
              Already registered?{" "}
              <span className="auth-link" onClick={() => setShowSignup(false)}>
                Login
              </span>
            </div>
          </form>
        ) : showForgot ? (
          <form autoComplete="off" className="auth-form">
            <input
              type="email"
              placeholder="Enter your registered email"
              required
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
            />
            <button type="submit" className="auth-btn">Send Reset Link</button>
            <div className="auth-footer">
              Remembered your password?{" "}
              <span className="auth-link" onClick={() => setShowForgot(false)}>
                Login
              </span>
            </div>
          </form>
        ) : (
          <form autoComplete="off" className="auth-form" onSubmit={handleLoginSubmit}>
            <input
              type="text"
              name="email"
              placeholder="Admin ID / Email"
              required
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Logging In..." : "Login"}
            </button>
            <div className="auth-footer">
              <span
                className="auth-link"
                style={{ marginRight: "10px" }}
                onClick={() => setShowForgot(true)}
              >
                Forgot Password?
              </span>
              Not registered?{" "}
              <span className="auth-link" onClick={() => setShowSignup(true)}>
                Sign Up
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
