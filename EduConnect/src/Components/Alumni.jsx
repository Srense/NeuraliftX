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
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // ✅ Chat states
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const token = localStorage.getItem("token_alumni");

  // ✅ Fetch connection requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;
      setLoadingRequests(true);
      try {
        const res = await fetch(
          "https://neuraliftx.onrender.com/api/alumni/requests",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok && data.success) setRequests(data.requests || []);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, [token]);

  // ✅ Accept/Reject connection
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
        // Refresh connected students after acceptance
        fetchConnectedStudents();
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

  // ✅ Fetch connected students
  const fetchConnectedStudents = async () => {
    if (!token) return;
    setLoadingStudents(true);
    try {
      const res = await fetch(
        "https://neuraliftx.onrender.com/api/alumni/connections",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok && data.success) setStudents(data.connections || []);
    } catch (err) {
      console.error("Error fetching connected students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchConnectedStudents();
  }, [token]);

  // ✅ Form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ✅ Submit profile
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (!res.ok)
        setStatus({ type: "danger", text: data.error || "Error saving profile" });
      else {
        setStatus({ type: "success", text: "Profile saved successfully!" });
        setProfile(data.alumni);
      }
    } catch (err) {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsSubmitting(false);
  };

  // ✅ Delete profile
  const handleDelete = async () => {
    if (!window.confirm("Delete your profile?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/alumni", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProfile(null);
        setStatus({ type: "success", text: "Profile deleted successfully." });
      }
    } catch (err) {
      setStatus({ type: "danger", text: "Server error. Try again later." });
    }
    setIsDeleting(false);
  };

  // ✅ Open Chat Modal
  const openChat = async (studentId) => {
    setLoadingChat(true);
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/chat/start/${studentId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveChat(data.conversation);
        const msgRes = await fetch(
          `https://neuraliftx.onrender.com/api/chat/${data.conversation._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const msgData = await msgRes.json();
        if (msgRes.ok) setMessages(msgData.messages || []);
      }
    } catch (err) {
      console.error("Error opening chat:", err);
    }
    setLoadingChat(false);
  };

  // ✅ Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/chat/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: activeChat._id,
            text: messageText,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.message]);
        setMessageText("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="alumni-wrapper">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="alumni-card p-4 shadow-lg border-0 rounded-4">
              <h2 className="text-center mb-4">🎓 Alumni Profile</h2>
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
                  <Button
                    type="submit"
                    className="w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Submit"}
                  </Button>
                </Form>
              ) : (
                <div className="text-center">
                  <h4>{profile.name}</h4>
                  <p>
                    {profile.designation} at {profile.company}
                  </p>
                  <Button
                    variant="danger"
                    className="mt-3"
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

        {/* Connection Requests */}
        <Row className="mt-5">
          <Col>
            <h3>📩 Connection Requests</h3>
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
                      variant="success"
                      className="ms-2"
                      onClick={() => handleAction(req._id, "accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      className="ms-2"
                      onClick={() => handleAction(req._id, "rejected")}
                    >
                      Reject
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>
        </Row>

        {/* Connected Students */}
        <Row className="mt-5">
          <Col>
            <h3>💬 Connected Students</h3>
            {loadingStudents ? (
              <Spinner animation="border" />
            ) : students.length === 0 ? (
              <p>No connected students</p>
            ) : (
              <ListGroup>
                {students.map((stu) => (
                  <ListGroup.Item key={stu._id}>
                    {stu.firstName} {stu.lastName} ({stu.email})
                    <Button
                      className="ms-2"
                      variant="primary"
                      onClick={() => openChat(stu._id)}
                    >
                      💬 Chat
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>
        </Row>
      </Container>

      {/* ✅ Chat Modal */}
      <Modal show={!!activeChat} onHide={() => setActiveChat(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chat with Student</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingChat ? (
            <Spinner animation="border" />
          ) : (
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                background: "#f7f7f7",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              {messages.length === 0 ? (
                <p className="text-center text-muted">No messages yet.</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      background:
                        msg.senderId === activeChat.members[0]
                          ? "#d1e7ff"
                          : "#e9ecef",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      padding: "6px 10px",
                    }}
                  >
                    {msg.text}
                  </div>
                ))
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Form.Control
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <Button onClick={sendMessage}>Send</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Alumni;
