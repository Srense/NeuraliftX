import React, { useEffect, useRef } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import FOG from "vanta/dist/vanta.fog.min";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Homepage.css";

import studentImg from "../assets/Student.jpg";
import facultyImg from "../assets/Faculty.jpg";
import alumniImg from "../assets/Alumni.jpg";
import adminImg from "../assets/Admin.jpg";
import logo from "../assets/Logo.png";

const roleData = [
  { title: "Student", image: studentImg, features: ["Academics", "Internships"], color: "primary" },
  { title: "Faculty", image: facultyImg, features: ["Monitoring", "Credits Check"], color: "success" },
  { title: "Alumni Connect", image: alumniImg, features: ["Mentorship", "Hiring"], color: "warning" },
  { title: "Admin", image: adminImg, features: ["Platform Management", "Analytics"], color: "danger" },
];

const Homepage = () => {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      vantaEffect.current = FOG({
        el: vantaRef.current,
        THREE: THREE,
        highlightColor: 0x6ee7b7,
        midtoneColor: 0x2563eb,
        lowlightColor: 0x1e293b,
        baseColor: 0x0f172a,
        blurFactor: 0.7,
        speed: 1.2,
        zoom: 1.2,
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  const handleLogin = (roleTitle) => {
    const roleMap = {
      Student: "student",
      Faculty: "faculty",
      "Alumni Connect": "alumni",
      Admin: "admin",
    };
    const rolePath = roleMap[roleTitle] || "main";
    navigate(`/${rolePath}-login`, { state: { role: rolePath } });
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Vanta background */}
      <div ref={vantaRef} className="vanta-bg" />
      {/* Main content overlays the Vanta background */}
      <div className="main-content">
        <Container fluid className="py-5">
          <Row className="justify-content-center mb-4 educonnect-hero">
            <Col xs="auto">
              <img src={logo} alt="EduConnect Logo" className="educonnect-logo" />
              <h1 className="educonnect-title">EduConnect LMS</h1>
              <p className="educonnect-subtitle">
                Empowering Students, Faculty, and Alumni for a Connected Future
              </p>
            </Col>
          </Row>
          <Row className="g-4 justify-content-center">
            {roleData.map((role) => (
              <Col key={role.title} xs={12} sm={6} md={6} lg={3}>
                <Card className={`h-100 shadow-lg border-0 bg-opacity-75 bg-${role.color}`}>
                  <Card.Img variant="top" src={role.image} alt={role.title} className="card-img" />
                  <Card.Body className="d-flex flex-column align-items-center">
                    <Card.Title className="fs-3 fw-bold text-white mb-3">{role.title}</Card.Title>
                    <ul className="list-unstyled text-white-50 fs-5">
                      {role.features.map((feature) => (
                        <li key={feature} className="mb-2">{feature}</li>
                      ))}
                    </ul>
                    <Button
                      variant="primary"
                      className="mt-3 px-4 py-2"
                      style={{
                        fontWeight: 600,
                        fontSize: "1.08rem",
                        borderRadius: "2rem",
                        background: "linear-gradient(90deg,#2563eb 70%,#60a5fa 100%)",
                        border: "none",
                        boxShadow: "0 2px 12px #2563eb22",
                        color: "#fff",
                        transition: "background 0.2s, box-shadow 0.2s"
                      }}
                      onClick={() => handleLogin(role.title)}
                      aria-label={`Login as ${role.title}`}
                    >
                      Login
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Homepage;
