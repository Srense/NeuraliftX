import React, { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner, Modal } from "react-bootstrap";
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

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const token = localStorage.getItem("token_alumni");

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
    <div className="alumni-arena">
      <h2 className="alumni-title">🎓 Alumni Dashboard</h2>
      {status && <Alert variant={status.type}>{status.text}</Alert>}

      {/* Profile Section */}
      {!profile ? (
        <Form onSubmit={handleSubmit} className="alumni-card mx-auto" style={{ maxWidth: 500 }}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control type="text" name="name" value={form.name} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Company</Form.Label>
            <Form.Control type="text" name="company" value={form.company} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Designation</Form.Label>
            <Form.Control type="text" name="designation" value={form.designation} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleChange} />
          </Form.Group>
          <Button type="submit" className="connect-btn w-100" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Profile"}
          </Button>
        </Form>
      ) : (
        <div className="alumni-grid">
          <div className="alumni-card">
            <div className="alumni-header">
              <h3>{profile.name}</h3>
              <div className="designation">{profile.designation}</div>
              <div className="company">{profile.company}</div>
            </div>
            <p className="description">{profile.description}</p>
            <Button variant="danger" className="w-100 mt-3" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Profile"}
            </Button>
          </div>

          {/* Connection Requests */}
          <div className="alumni-card">
            <h4>📩 Connection Requests</h4>
            {loadingRequests ? (
              <Spinner animation="border" />
            ) : requests.length === 0 ? (
              <p>No pending requests</p>
            ) : (
              requests.map((req) => (
                <div key={req._id} className="button-group">
                  <div>
                    {req.studentId.firstName} {req.studentId.lastName} ({req.studentId.email})
                  </div>
                  <button className="connect-btn" onClick={() => handleAction(req._id, "accepted")}>
                    Accept
                  </button>
                  <button className="connect-btn" style={{ background: "#ef4444" }} onClick={() => handleAction(req._id, "rejected")}>
                    Reject
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Students */}
          <div className="alumni-card">
            <h4>👩‍🎓 Student Directory</h4>
            {loadingStudents ? (
              <Spinner animation="border" />
            ) : (
              students.map((student) => (
                <div key={student._id} className="button-group">
                  <div onClick={() => handleStudentClick(student)} style={{ cursor: "pointer" }}>
                    {student.firstName} {student.lastName} ({student.roleIdValue})
                  </div>
                  <button className="chat-btn" onClick={() => startChat(student._id)}>
                    Chat 💬
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Student Modal */}
      <Modal show={!!selectedStudent} onHide={() => setSelectedStudent(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Student Details - {selectedStudent?.firstName} {selectedStudent?.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingPerformance ? (
            <Spinner animation="border" />
          ) : (
            <>
              <p><b>Email:</b> {selectedStudent?.email}</p>
              <p><b>UID:</b> {selectedStudent?.roleIdValue}</p>
              <p><b>Coins:</b> {selectedStudent?.coins}</p>
              <h5>📊 Recent Quiz Performance</h5>
              {studentPerformance.length > 0 ? (
                <ul>
                  {studentPerformance.map((p, i) => (
                    <li key={i}>{p.assignmentId?.originalName || "Quiz"}: {p.score}/{p.total}</li>
                  ))}
                </ul>
              ) : (
                <p>No quiz data available.</p>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Floating Chat */}
      {activeChat && (
        <div className="chat-modal">
          <div className="chat-header">
            <span>Chat Window</span>
            <button onClick={() => setActiveChat(null)}>✖</button>
          </div>
          <div className="chat-body">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat-bubble ${
                  msg.senderId === activeChat.members[0] ? "sent" : "received"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
            <button onClick={refreshMessages}>🔁</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alumni;
