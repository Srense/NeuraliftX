import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Alumni.css";

const Alumni = () => {
  const [form, setForm] = useState({
    name: "",
    company: "",
    designation: "",
    description: "",
    linkedin: "",
    github: "",
  });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);

  // Fetch alumni profile if already exists
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token_alumni");
        const res = await fetch("https://neuraliftx.onrender.com/api/alumni/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching alumni profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token_alumni");
      const res = await fetch("https://neuraliftx.onrender.com/api/alumni", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "danger", text: data.error || "Error saving details" });
      } else {
        setStatus({ type: "success", text: "Profile saved successfully!" });
        setProfile(data);
      }
    } catch (err) {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsSubmitting(false);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0 p-4 rounded-3">
            <h2 className="text-center mb-4">Alumni Profile</h2>

            {status && <Alert variant={status.type}>{status.text}</Alert>}

            {!profile ? (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Enter your company"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Designation</Form.Label>
                  <Form.Control
                    type="text"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="Enter your role/designation"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Write a short bio"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>LinkedIn (optional)</Form.Label>
                  <Form.Control
                    type="url"
                    name="linkedin"
                    value={form.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>GitHub (optional)</Form.Label>
                  <Form.Control
                    type="url"
                    name="github"
                    value={form.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 py-2 mt-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Submit"}
                </Button>
              </Form>
            ) : (
              <div className="text-center">
                <h4>{profile.name}</h4>
                <p className="mb-1">{profile.designation} at {profile.company}</p>
                <p className="text-muted">{profile.description}</p>
                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn btn-outline-primary me-2">LinkedIn</a>}
                {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="btn btn-outline-dark">GitHub</a>}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Alumni;
