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

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Chat states
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const token = localStorage.getItem("token_alumni");

  // ✅ Fetch connection requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;
      setLoadingRequests(true);
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/alumni/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) setRequests(data.requests || []);
        else setRequests([]);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, [token]);

  // ✅ Accept / Reject request
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

  // ✅ Fetch alumni profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/alumni/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setProfile(data.alumni);
      } catch (err) {
        console.error("Error fetching alumni profile:", err);
      }
    };
    fetchProfile();
  }, [token]);

  // ✅ Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!token) return;
      setLoadingStudents(true);
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/alumni/students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setStudents(data.students || []);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [token]);

  // ✅ Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ✅ Save alumni profile
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
        setStatus({ type: "danger", text: data.error || "Error saving details" });
      } else {
        setStatus({ type: "success", text: "Profile saved successfully!" });
        setProfile(data.alumni);
      }
    } catch {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsSubmitting(false);
  };

  // ✅ Delete profile
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
        setStatus({ type: "success", text: "Profile deleted successfully." });
      } else {
        const data = await res.json();
        setStatus({
          type: "danger",
          text: data.error || "Error deleting profile",
        });
      }
    } catch {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsDeleting(false);
  };

  // ✅ View student details
  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setLoadingPerformance(true);
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/alumni/student/${student._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setStudentPerformance(data.quizAttempts || []);
        setSelectedStudent({ ...student, ...data.student });
      } else setStudentPerformance([]);
    } catch {
      setStudentPerformance([]);
    } finally {
      setLoadingPerformance(false);
    }
  };

  // ✅ Start chat with a student (only if connected)
  const startChat = async (studentId) => {
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/chat/start/${studentId}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveChat(data.conversation);
        const msgRes = await fetch(
          `https://neuraliftx.onrender.com/api/chat/${data.conversation._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const msgData = await msgRes.json();
        if (msgRes.ok && msgData.success) setMessages(msgData.messages);
      } else {
        alert("You can only chat with connected students.");
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  // ✅ Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: activeChat._id,
          text: messageText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.message]);
        setMessageText("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // ✅ Refresh chat manually
  const refreshMessages = async () => {
    if (!activeChat) return;
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/chat/${activeChat._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok && data.success) setMessages(data.messages);
    } catch (err) {
      console.error("Error refreshing messages:", err);
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

              {/* ===== Profile Creation or Display ===== */}
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

        {/* ===== Connection Requests ===== */}
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

        {/* ===== Student Directory ===== */}
        <Row className="mt-5">
          <Col>
            <h3 className="mb-3">👩‍🎓 Student Directory</h3>
            {loadingStudents ? (
              <Spinner animation="border" />
            ) : (
              <ListGroup>
                {students.map((student) => (
                  <ListGroup.Item key={student._id}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div
                        onClick={() => handleStudentClick(student)}
                        style={{ cursor: "pointer" }}
                      >
                        {student.firstName} {student.lastName} -{" "}
                        {student.roleIdValue} ({student.coins} coins)
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => startChat(student._id)}
                      >
                        💬 Chat
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>
        </Row>
      </Container>

      {/* ===== Chat Modal ===== */}
      {activeChat && (
        <Modal show centered onHide={() => setActiveChat(null)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>💬 Chat Window</Modal.Title>
          </Modal.Header>

          <Modal.Body className="chat-body">
            {messages.length === 0 ? (
              <p className="text-center text-muted">No messages yet...</p>
            ) : (
              messages.map((msg) => {
                const isYou = msg.senderId === profile?._id;
                return (
                  <div
                    key={msg._id}
                    className={`chat-bubble ${isYou ? "chat-sender" : "chat-receiver"}`}
                  >
                    <div className="chat-text">{msg.text}</div>
                    <div className="chat-sender-name">
                      {isYou ? "You" : "Student"}
                    </div>
                  </div>
                );
              })
            )}
          </Modal.Body>

          <Modal.Footer className="d-flex align-items-center">
            <Form.Control
              type="text"
              placeholder="Type message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{ color: "black" }}
            />
            <Button onClick={sendMessage}>Send</Button>
            <Button variant="outline-secondary" onClick={refreshMessages}>
              🔁 Refresh
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Alumni;
