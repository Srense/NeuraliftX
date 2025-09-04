import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import * as THREE from "three";
import WAVES from "vanta/dist/vanta.waves.min";
import "bootstrap/dist/css/bootstrap.min.css";
import './LoginSignup.css';

const roleSpecificFields = {
  student: { label: "University ID", name: "roleIdValue" },
  faculty: { label: "Faculty ID", name: "roleIdValue" },
  alumni: { label: "Alumni ID", name: "roleIdValue" },
  admin: { label: "Admin Email", name: "roleIdValue" }
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const forbiddenEmailDomains = [
  "tempmail.com","10minutemail.com","mailinator.com","guerrillamail.com",
  "throwawaymail.com","fakeinbox.com","maildrop.cc","trashmail.com","yopmail.com"
];
const isDisposableEmail = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return forbiddenEmailDomains.includes(domain);
};
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const initialFormState = {
  firstName: "", lastName: "", email: "", password: "", confirmPassword: "", roleIdValue: ""
};

const LoginSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialRole = location.state?.role || "student";

  const [mode, setMode] = useState("login"); 
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      vantaEffect.current = WAVES({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 400,
        minWidth: 200,
        scale: 1.00,
        scaleMobile: 1.00,
        waveSpeed: 1.2,
        waveHeight: 20,
        waveColor: 0x2563eb,
        shininess: 30,
        zoom: 1.1,
        color: 0x0f172a,
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  const validateField = useCallback((field, value) => {
    switch (field) {
      case "firstName":
      case "lastName":
        if (mode === "signup" && !value.trim()) return "This field is required.";
        break;
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!emailRegex.test(value)) return "Invalid email format.";
        if (isDisposableEmail(value)) return "Disposable or temporary emails are not allowed.";
        break;
      case "password":
        if (mode !== "forgot") {
          if (!value) return "Password is required.";
          if (!passwordRegex.test(value))
            return "Password must have at least 8 characters, uppercase, lowercase, number, special character.";
        }
        break;
      case "confirmPassword":
        if (mode === "signup") {
          if (!value) return "Confirm password is required.";
          if (value !== form.password) return "Passwords do not match.";
        }
        break;
      case "roleIdValue":
        if (mode === "signup" && !value.trim())
          return `${roleSpecificFields[initialRole]?.label} is required.`;
        if (mode === "signup" && initialRole === "admin" && value.toLowerCase() !== form.email.toLowerCase())
          return "Admin Email must match your Email.";
        break;
      default:
        break;
    }
    return "";
  }, [mode, initialRole, form.password, form.email]);

  const validateForm = () => {
    const newErrors = {};
    if (mode === "signup") {
      ["firstName", "lastName", "email", "password", "confirmPassword", "roleIdValue"].forEach(field => {
        const err = validateField(field, form[field]);
        if (err) newErrors[field] = err;
      });
    } else if (mode === "login") {
      ["email", "password"].forEach(field => {
        const err = validateField(field, form[field]);
        if (err) newErrors[field] = err;
      });
    } else if (mode === "forgot") {
      const err = validateField("email", form.email);
      if (err) newErrors.email = err;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!validateForm()) {
      setStatusMessage({ type: "danger", text: "Please fix the errors above." });
      return;
    }
    setIsSubmitting(true);

    try {
      let response;
      if (mode === "login") {
        response = await fetch("https://neuraliftx.onrender.com/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
      } else if (mode === "signup") {
        response = await fetch("https://neuraliftx.onrender.com/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
            role: initialRole,
            roleIdValue: form.roleIdValue,
          }),
        });
      } else if (mode === "forgot") {
        response = await fetch("https://neuraliftx.onrender.com/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage({ 
          type: "danger", 
          text: data.error || data.message || "Server error"
        });
        setIsSubmitting(false);
        return;
      }
      setStatusMessage({ type: "success", text: data.message });
      if (mode === "signup") {
        setMode("login");
        setForm(initialFormState);
      }
      if (mode === "login") {
        // Store token separately per role to allow multiple active sessions
        const decoded = jwtDecode(data.token);
        const userRole = decoded.role;
        const tokenKey = `token_${userRole}`;
        localStorage.setItem(tokenKey, data.token);

        // Navigate to role-based dashboard
        switch(userRole) {
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
            break;
        }
      }
    } catch (error) {
      setStatusMessage({ type: "danger", text: "Server unreachable. Please try again later." },error);
    }
    setIsSubmitting(false);
  };

  const switchModeTo = (newMode) => {
    setStatusMessage(null);
    setErrors({});
    setForm(initialFormState);
    setMode(newMode);
  };

  // Optional: always remove generic token on mount to avoid confusion
  useEffect(() => {
    if (mode === "login") {
      localStorage.removeItem("token");
    }
  }, [mode]);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div ref={vantaRef} className="vanta-bg full-screen-bg"></div>
      <div className="form-wrapper">
        <div className="form-container">
          <h2 className="text-glow mb-4">
            {mode === "login"
              ? "Login"
              : mode === "signup"
              ? `Sign Up as ${initialRole.charAt(0).toUpperCase() + initialRole.slice(1)}`
              : "Forgot Password"}
          </h2>

          {statusMessage && (
            <Alert variant={statusMessage.type} onClose={() => setStatusMessage(null)} dismissible>
              {statusMessage.text}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            {(mode === "signup" || mode === "login") && (
              <>
                {mode === "signup" && (
                  <>
                    <Form.Group className="mb-3" controlId="firstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        isInvalid={!!errors.firstName}
                        placeholder="Enter your first name"
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.firstName}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="lastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        isInvalid={!!errors.lastName}
                        placeholder="Enter your last name"
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </>
                )}

                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder="Enter your email"
                    required
                    autoComplete="username"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                {mode === "signup" && (
                  <Form.Group className="mb-3" controlId="roleIdValue">
                    <Form.Label>{roleSpecificFields[initialRole].label}</Form.Label>
                    <Form.Control
                      type={initialRole === "admin" ? "email" : "text"}
                      name="roleIdValue"
                      value={form.roleIdValue}
                      onChange={handleChange}
                      isInvalid={!!errors.roleIdValue}
                      placeholder={`Enter your ${roleSpecificFields[initialRole].label}`}
                      required
                      autoComplete={initialRole === "admin" ? "email" : undefined}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.roleIdValue}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    placeholder="Enter your password"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                {mode === "signup" && (
                  <Form.Group className="mb-3" controlId="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      isInvalid={!!errors.confirmPassword}
                      placeholder="Confirm your password"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              </>
            )}

            {mode === "forgot" && (
              <Form.Group className="mb-3" controlId="forgotEmail">
                <Form.Label>Enter your registered Email address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  isInvalid={!!errors.email}
                  placeholder="your.email@example.com"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>
            )}

            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              className="w-100 py-2 mt-3 mb-3 glow-btn"
            >
              {isSubmitting
                ? "Processing..."
                : mode === "login"
                ? "Login"
                : mode === "signup"
                ? "Sign Up"
                : "Send Reset Link"}
            </Button>
          </Form>

          <Row className="justify-content-between text-center">
            {mode !== "login" && (
              <Col xs={12} className="mb-2">
                <Button variant="link" onClick={() => switchModeTo("login")} className="link-btn">
                  Back to Login
                </Button>
              </Col>
            )}
            {mode !== "signup" && (
              <Col xs={12} className="mb-2">
                <Button variant="link" onClick={() => switchModeTo("signup")} className="link-btn">
                  Create an Account
                </Button>
              </Col>
            )}
            {mode !== "forgot" && (
              <Col xs={12} className="mb-2">
                <Button variant="link" onClick={() => switchModeTo("forgot")} className="link-btn">
                  Forgot Password?
                </Button>
              </Col>
            )}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
