import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  ListGroup,
  Modal,
  Spinner,
} from "react-bootstrap";
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

  // Student data
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const token = localStorage.getItem("token_alumni");

  // Fetch alumni profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          "https://neuraliftx.onrender.com/api/alumni/me",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setProfile(data.alumni);
        }
      } catch (err) {
        console.error("Error fetching alumni profile:", err);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
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
    if (token) fetchStudents();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
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
        setStatus({
          type: "danger",
          text: data.error || "Error saving details",
        });
      } else {
        setStatus({ type: "success", text: "Profile saved successfully!" });
        setProfile(data.alumni);
      }
    } catch (err) {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsSubmitting(false);
  };

  // ✅ Delete Profile
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/alumni", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProfile(null);
        setStatus({
          type: "success",
          text: "Profile deleted successfully.",
        });
      } else {
        const data = await res.json();
        setStatus({
          type: "danger",
          text: data.error || "Error deleting profile",
        });
      }
    } catch (err) {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsDeleting(false);
  };

  // ✅ Select student and fetch performance
  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setLoadingPerformance(true);
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/students/${student._id}/performance`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setStudentPerformance(data.performance || []);
      } else {
        setStudentPerformance([]);
      }
    } catch (err) {
      console.error("Error fetching student performance:", err);
      setStudentPerformance([]);
    } finally {
      setLoadingPerformance(false);
    }
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
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>LinkedIn</Form.Label>
                    <Form.Control
                      type="url"
                      name="linkedin"
                      value={form.linkedin}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>GitHub</Form.Label>
                    <Form.Control
                      type="url"
                      name="github"
                      value={form.github}
                      onChange={handleChange}
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

        {/* Student List */}
        <Row className="mt-5">
          <Col>
            <h3 className="mb-3">👩‍🎓 Student Directory</h3>
            {loadingStudents ? (
              <Spinner animation="border" />
            ) : (
              <ListGroup>
                {students.map((student) => (
                  <ListGroup.Item
                    key={student._id}
                    action
                    onClick={() => handleStudentClick(student)}
                  >
                    {student.firstName} {student.lastName} - {student.roleIdValue} ({student.coins} coins)
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>
        </Row>
      </Container>

      {/* Student Detail Modal */}
      <Modal
        show={!!selectedStudent}
        onHide={() => setSelectedStudent(null)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Student Details - {selectedStudent?.firstName}{" "}
            {selectedStudent?.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingPerformance ? (
            <Spinner animation="border" />
          ) : (
            <>
              <p>
                <b>Email:</b> {selectedStudent?.email}
              </p>
              <p>
                <b>UID:</b> {selectedStudent?.roleIdValue}
              </p>
              <p>
                <b>Coins:</b> {selectedStudent?.coins}
              </p>
              <h5>📊 Recent Quiz Performance</h5>
              {studentPerformance && studentPerformance.length > 0 ? (
                <ul>
                  {studentPerformance.map((p, idx) => (
                    <li key={idx}>
                      {p.assignmentTitle}: {p.score}/{p.total} (
                      {new Date(p.date).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No quiz data available.</p>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Alumni;
