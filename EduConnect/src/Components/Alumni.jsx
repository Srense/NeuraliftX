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

  // Students
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Connection requests
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const token = localStorage.getItem("token_alumni");

  // Fetch connection requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;
      setLoadingRequests(true);
      try {
        const res = await fetch(
          "https://neuraliftx.onrender.com/api/alumni/requests",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();

        if (res.ok && data.success) {
          setRequests(data.requests || []);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, [token]);

  // Handle Accept / Reject
  const handleAction = async (id, action) => {
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/alumni/requests/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: action }),
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setRequests((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      console.error("Error updating request:", err);
    }
  };

  // Fetch alumni profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(
          "https://neuraliftx.onrender.com/api/alumni/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok) {
          setProfile(data.alumni);
        }
      } catch (err) {
        console.error("Error fetching alumni profile:", err);
      }
    };
    fetchProfile();
  }, [token]);

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!token) return;
      setLoadingStudents(true);
      try {
        const res = await fetch(
          "https://neuraliftx.onrender.com/api/alumni/students",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok) {
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [token]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Save profile
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

  // Delete Alumni Profile
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile?"))
      return;

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

  // Select student & fetch full details
  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setLoadingPerformance(true);
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/alumni/student/${student._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setStudentPerformance(data.quizAttempts || []);
        // Extend selected student with full data received from backend
        setSelectedStudent({ ...student, ...data.student });
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
              <h2 className="text-center mb-4 alumni-heading">
                🎓 Alumni Profile
              </h2>

              {status && <Alert variant={status.type}>{status.text}</Alert>}

              {!profile ? (
                // Profile form
                <Form onSubmit={handleSubmit}>
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
                // Profile details
                <div className="text-center alumni-profile">
                  <div className="alumni-avatar mx-auto mb-3">
                    <img
                      src="https://via.placeholder.com/120"
                      alt="Profile"
                      className="rounded-circle"
                    />
                  </div>
                  <h4>
                    {profile.firstName} {profile.lastName}
                  </h4>
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

        {/* Connection Requests Section */}
        <Row className="mt-5">
          <Col>
            <h3 className="mb-3">📩 Connection Requests</h3>
            {loadingRequests ? (
              <Spinner animation="border" />
            ) : requests.length === 0 ? (
              <p>No pending requests</p>
            ) : (
              <ListGroup>
                {requests.map((req) => (
                  <ListGroup.Item key={req._id}>
                    <strong>
                      {req.studentId.firstName} {req.studentId.lastName}
                    </strong>{" "}
                    ({req.studentId.email})
                    <Button
                      onClick={() => handleAction(req._id, "accepted")}
                      variant="success"
                      className="ms-2"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleAction(req._id, "rejected")}
                      variant="danger"
                      className="ms-2"
                    >
                      Reject
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
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
                    {student.firstName} {student.lastName} -{" "}
                    {student.roleIdValue} ({student.coins} coins)
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
            <img
             src={selectedStudent?.profilePicUrl ? `https://neuraliftx.onrender.com${selectedStudent.profilePicUrl}` : "https://via.placeholder.com/120"}
             alt={`${selectedStudent?.firstName} Profile`}
             className="rounded-circle mb-3"
             width={120}
             height={120}
            />

              <p>
                <b>Email:</b> {selectedStudent?.email}
              </p>
              <p>
                <b>UID:</b> {selectedStudent?.roleIdValue}
              </p>
              <p>
                <b>Coins:</b> {selectedStudent?.coins}
              </p>

              {/* Extended Profile Fields */}
              <p><b>Bio:</b> {selectedStudent?.bio || "N/A"}</p>
              <p><b>Percentage:</b> {selectedStudent?.percentage ?? "N/A"}</p>
              <p><b>Class:</b> {selectedStudent?.className || "N/A"}</p>
              <p><b>Internships Done:</b> {(selectedStudent?.internshipsDone?.join(", ")) || "N/A"}</p>
              <p><b>Courses Completed:</b> {(selectedStudent?.coursesCompleted?.join(", ")) || "N/A"}</p>
              <p><b>Area of Interest:</b> {(selectedStudent?.areaOfInterest?.join(", ")) || "N/A"}</p>

              <h5>📊 Recent Quiz Performance</h5>
              {studentPerformance && studentPerformance.length > 0 ? (
                <ul>
                  {studentPerformance.map((p, idx) => (
                    <li key={idx}>
                      {p.assignmentId?.originalName || "Quiz"}: {p.score}/
                      {p.total} ({new Date(p.createdAt).toLocaleDateString()})
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
