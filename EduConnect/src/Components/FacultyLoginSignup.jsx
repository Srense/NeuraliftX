import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./StudentLoginSignup.css";
import logo from "../assets/Logo.png";

export default function RoleBasedLoginSignup() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = location.state?.role || "student"; // role implicitly passed from Homepage

  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    uidEmail: "",
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const safeJson = async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const saveTokenAndRedirect = (token, userRole) => {
    localStorage.setItem("authToken", token);
    switch (userRole) {
      case "student":
        navigate("/student");
        break;
      case "faculty":
        navigate("/faculty");
        break;
      case "alumni":
        navigate("/alumni");
        break;
      case "admin":
        navigate("/admin");
        break;
      default:
        navigate("/");
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
          uidEmail: formData.uidEmail,
          password: formData.password,
          // no role sent, backend determines from DB
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Login failed");
      setSuccessMsg("Login successful! Redirecting...");
      saveTokenAndRedirect(data.token, data.user.role);
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
      !formData.uidEmail ||
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
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.uidEmail,
          username: formData.username,
          password: formData.password,
          role: role,  // send role explicitly on signup
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Signup failed");
      setSuccessMsg("Signup successful! Redirecting to login...");
      setShowSignup(false);
      setFormData({
        firstName: "",
        lastName: "",
        uidEmail: "",
        username: "",
        password: ""
      });
      navigate(`/${role}-login`);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-root">
      <div className={`auth-card${showSignup ? " signup" : ""}`}>
        <img src={logo} alt="EduConnect Logo" className="auth-logo" />
        <h2 className="auth-title">{showSignup ? `${role.charAt(0).toUpperCase() + role.slice(1)} Sign Up` : `${role.charAt(0).toUpperCase() + role.slice(1)} Login`}</h2>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {showSignup ? (
          <form autoComplete="off" className="auth-form" onSubmit={handleSignupSubmit}>
            <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} disabled={loading} required />
            <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} disabled={loading} required />
            <input type="email" name="uidEmail" placeholder="Email / UID" value={formData.uidEmail} onChange={handleInputChange} disabled={loading} required />
            <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleInputChange} disabled={loading} required />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} disabled={loading} required />
            <button className="auth-btn" type="submit" disabled={loading}>{loading ? "Signing Up..." : "Sign Up"}</button>
            <div className="auth-footer">
              Already registered? <span className="auth-link" onClick={() => setShowSignup(false)}>Login</span>
            </div>
          </form>
        ) : (
          <form autoComplete="off" className="auth-form" onSubmit={handleLoginSubmit}>
            <input type="email" name="uidEmail" placeholder="Email / UID" value={formData.uidEmail} onChange={handleInputChange} disabled={loading} required />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} disabled={loading} required />
            <button className="auth-btn" type="submit" disabled={loading}>{loading ? "Logging In..." : "Login"}</button>
            <div className="auth-footer">
              Not registered? <span className="auth-link" onClick={() => setShowSignup(true)}>Sign Up</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
