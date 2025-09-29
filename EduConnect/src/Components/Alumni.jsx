import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Spinner } from "react-bootstrap";
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
  const [isDeleting, setIsDeleting] = useState(false);

  // 🔵 New state for students
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch alumni profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token_alumni");
        const res = await fetch("https://neuraliftx.onrender.com/api/alumni/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.alumni);
        }
      } catch (err) {
        console.error("Error fetching alumni profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const token = localStorage.getItem("token_alumni");
        const res = await fetch("https://neuraliftx.onrender.com/api/students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  // Fetch details of one student
  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setSelectedStudent(id);
    try {
      const token = localStorage.getItem("token_alumni");
      const res = await fetch(`https://neuraliftx.onrender.com/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudentDetails(data);
      }
    } catch (err) {
      console.error("Error fetching student details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Alumni profile form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Alumni profile submit
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
        setProfile(data.alumni);
      }
    } catch (err) {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsSubmitting(false);
  };

  // Alumni profile delete
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile?")) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token_alumni");
      const res = await fetch("https://neuraliftx.onrender.com/api/alumni", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProfile(null);
        setStatus({ type: "success", text: "Profile deleted successfully." });
      } else {
        const data = await res.json();
        setStatus({ type: "danger", text: data.error || "Error deleting profile" });
      }
    } catch (err) {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsDeleting(false);
  };

  return (
    <div className="alumni-wrapper">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="alumni-card glass-card shadow-lg border-0 p-4 rounded-4">
              <h2 className="text-center mb-4 alumni-heading">🎓 Alumni Profile</h2>

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
                    <Form.Label>Description</Form.Label>
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
                    <Form.Label>LinkedIn</Form.Label>
                    <Form.Control
                      type="url"
                      name="linkedin"
                      value={form.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>GitHub</Form.Label>
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
                    className="w-100 py-2 mt-3 alumni-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Submit"}
                  </Button>
                </Form>
              ) : (
                <div className="text-center alumni-profile">
                  <div className="alumni-avatar mx-auto mb-3">
                    <img
                      src="https://via.placeholder.com/120"
                      alt="Profile"
                      className="rounded-circle"
                    />
                  </div>
                  <h4>{profile.name}</h4>
                  <p className="mb-1">
                    {profile.designation} at {profile.company}
                  </p>
                  <p className="text-muted">{profile.description}</p>
                  <div className="d-flex justify-content-center gap-3 mt-3">
                    {profile.linkedin && (
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary"
                      >
                        LinkedIn
                      </a>
                    )}
                    {profile.github && (
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-dark"
                      >
                        GitHub
                      </a>
                    )}
                  </div>

                  <Button
                    variant="danger"
                    className="w-100 mt-4"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Profile"}
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* 🔵 Students Section */}
        <Row className="mt-5">
          <h2 className="text-center mb-4 alumni-heading">👩‍🎓 Student Directory</h2>
          {loadingStudents ? (
            <p className="text-center"><Spinner animation="border" /> Loading students...</p>
          ) : (
            students.map((stu) => (
              <Col md={6} lg={4} key={stu._id} className="mb-4">
                <Card className="student-card glass-card p-3 shadow">
                  <Card.Body className="text-center">
                    <img
                      src={stu.profilePicUrl ? `https://neuraliftx.onrender.com${stu.profilePicUrl}` : "https://via.placeholder.com/80"}
                      alt="Student"
                      className="rounded-circle mb-3"
                      style={{ width: "80px", height: "80px", objectFit: "cover" }}
                    />
                    <Card.Title>{stu.firstName} {stu.lastName}</Card.Title>
                    <Card.Text><b>Email:</b> {stu.email}</Card.Text>
                    <Button variant="primary" onClick={() => handleViewDetails(stu._id)}>
                      View Details
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>

        {/* Student details modal */}
        <Modal show={!!selectedStudent} onHide={() => { setSelectedStudent(null); setStudentDetails(null); }} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Student Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loadingDetails ? (
              <p><Spinner animation="border" /> Loading...</p>
            ) : studentDetails ? (
              <div>
                <h4>{studentDetails.user?.firstName} {studentDetails.user?.lastName}</h4>
                <p><b>Email:</b> {studentDetails.user?.email}</p>
                <p><b>Coins:</b> {studentDetails.user?.coins}</p>
                <hr />
                <h5>📊 Quiz Performance</h5>
                <p>{studentDetails.quizStats?.completed} quizzes completed</p>
                <p>Average Score: {studentDetails.quizStats?.averageScore || "N/A"}</p>

                <h5>📑 Assignments</h5>
                <ul>
                  {studentDetails.assignments?.map((a) => (
                    <li key={a._id}>{a.title} - {a.status}</li>
                  ))}
                </ul>

                <h5>✅ Tasks</h5>
                <ul>
                  {studentDetails.tasks?.map((t) => (
                    <li key={t._id}>{t.originalName} - {t.status}</li>
                  ))}
                </ul>

                <h5>🎓 Grades</h5>
                <ul>
                  {studentDetails.grades?.map((g, idx) => (
                    <li key={idx}>{g.subject}: {g.grade}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No details available.</p>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default Alumni;
