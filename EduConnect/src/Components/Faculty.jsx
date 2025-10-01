import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css"; // Universal theme CSS for all dashboards
import logo from "../assets/Logo.png";
import "./Student.css";

function useGlobalTheme() {
  useEffect(() => {
    async function syncTheme() {
      const res = await fetch("/api/theme");
      if (res.ok) {
        const { theme } = await res.json();
        document.body.classList.remove("default", "dark", "blue");
        document.body.classList.add(theme);
      }
    }
    syncTheme();
  }, []);
}

function UploadTaskModal({ token, onClose, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/tasks", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      alert(data.message || "Task uploaded successfully");
      onUpload(data.task);
      onClose();
    } catch {
      alert("Task upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2>Upload Faculty Task PDF</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button
          disabled={!selectedFile || uploading}
          onClick={handleUpload}
          className="action-btn"
        >
          {uploading ? "Uploading..." : "Upload Task"}
        </button>
      </div>
    </div>
  );
}

function AnnouncementPopup({ announcement, onClose, token }) {
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (qIndex, value) =>
    setResponses((prev) => ({ ...prev, [qIndex]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ announcementId: announcement._id, responses }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setSubmitted(true);
    } catch (e) {
      alert(e.message || "Submission failed");
    }
    setSubmitting(false);
  };

  if (!announcement) return null;

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal"
        style={{ maxWidth: 600 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="close-btn">
          ×
        </button>
        {(announcement.title || announcement.message) && (
          <>
            <h2>{announcement.title || "Announcement"}</h2>
            <p>{announcement.message || "No details available."}</p>
          </>
        )}
        {announcement.contentType === "survey" && !submitted && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {announcement.surveyQuestions?.map((q, i) => (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <label style={{ fontWeight: "600" }}>{q.question}</label>
                {q.inputType === "text" && (
                  <textarea
                    rows={3}
                    value={responses[i] || ""}
                    onChange={(e) => handleChange(i, e.target.value)}
                    required
                    style={{ width: "100%" }}
                  />
                )}
                {(q.inputType === "radio" || q.inputType === "checkbox") && (
                  <div>
                    {q.options.map((opt, idx) => (
                      <label key={idx} style={{ display: "block", marginTop: 4 }}>
                        <input
                          type={q.inputType}
                          name={`question-${i}`}
                          value={opt}
                          checked={
                            q.inputType === "radio"
                              ? responses[i] === opt
                              : Array.isArray(responses[i]) && responses[i].includes(opt)
                          }
                          onChange={(e) => {
                            if (q.inputType === "radio") {
                              handleChange(i, e.target.value);
                            } else {
                              const prev = responses[i] || [];
                              if (e.target.checked) {
                                handleChange(i, [...prev, e.target.value]);
                              } else {
                                handleChange(i, prev.filter((v) => v !== e.target.value));
                              }
                            }
                          }}
                          required={q.inputType === "radio"}
                        />
                        {" "}
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.inputType === "select" && (
                  <select
                    value={responses[i] || ""}
                    onChange={(e) => handleChange(i, e.target.value)}
                    required
                    style={{ width: "100%" }}
                  >
                    <option value="">Select an option</option>
                    {q.options.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <button type="submit" disabled={submitting} className="action-btn">
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
        {submitted && <p>Thank you for your feedback!</p>}
      </div>
    </div>
  );
}

function CreateAssignmentModal({ token, onClose, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/assignments", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onUpload(data.assignment);
      alert("Uploaded assignment");
      onClose();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
        <h2>Upload Assignment PDF</h2>
        <input type="file" accept="application/pdf" onChange={handleChange} />
        <button
          disabled={!selectedFile || uploading}
          onClick={handleUpload}
          className="action-btn"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}

function ProfileModal({ user, token, onClose, onLogout, onUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreview] = useState(
    user.profilePicUrl ? `https://neuraliftx.onrender.com${user.profilePicUrl}` : ""
  );

  const handleChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("profilePic", selectedFile);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/profile/picture", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onUpdate(data.profilePicUrl);
      alert("Profile pic updated");
      setPreview(`https://neuraliftx.onrender.com${data.profilePicUrl}`);
      setSelectedFile(null);
    } catch {
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close profile modal" onClick={onClose} className="close-btn">
          ×
        </button>
        <h2>My Profile</h2>
        <img
          src={previewUrl || "https://via.placeholder.com/120"}
          alt="Profile"
          className="profile-large-pic"
        />
        <p>
          <b>Name:</b> {user.firstName} {user.lastName}
        </p>
        <p>
          <b>UID:</b> {user.roleIdValue}
        </p>
        <p>
          <b>Email:</b> {user.email}
        </p>
        
        <input type="file" accept="image/*" onChange={handleChange} />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="action-btn"
        >
          {uploading ? "Uploading..." : "Upload Pic"}
        </button>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
}

function FacultyAnswersModal({ token, task, onClose }) {
  const [loading, setLoading] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState([]);

  useEffect(() => {
    async function fetchAnswers() {
      setLoading(true);
      try {
        const res = await fetch(`https://neuraliftx.onrender.com/api/faculty-answers/${task._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch student answers");
        const data = await res.json();
        setStudentAnswers(data);
      } catch (e) {
        alert("Failed to load student answers: " + (e.message || e));
      } finally {
        setLoading(false);
      }
    }
    fetchAnswers();
  }, [task, token]);

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal"
        style={{ maxWidth: 600 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="close-btn">
          ×
        </button>
        <h2>Answers for: {task.originalName}</h2>
        {loading && <p>Loading...</p>}
        {!loading && studentAnswers.length === 0 && (
          <p>No student has submitted an answer for this task yet.</p>
        )}
        {!loading && studentAnswers.length > 0 && (
          <ul>
            {studentAnswers.map((a) => (
              <li key={a.id} style={{ marginBottom: 12 }}>
                <div>
                  <strong>{a.studentName}</strong> ({a.studentUID}) -{" "}
                  <a href={`https://neuraliftx.onrender.com${a.fileUrl}`} target="_blank" rel="noreferrer">
                    View Answer
                  </a>
                </div>
                <div style={{ fontSize: "0.9em", color: "#888" }}>{a.studentEmail}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Faculty() {
  useGlobalTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem("token_faculty");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMain, setActiveMain] = useState("Home");
  const [activeSub, setActiveSub] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMenu, setFilteredMenu] = useState([]);

  const [assignments, setAssignments] = useState([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementError, setAnnouncementError] = useState(null);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);

  const [showUploadTask, setShowUploadTask] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [showFacultyAnswersModal, setShowFacultyAnswersModal] = useState(false);
  const [selectedTaskForAnswers, setSelectedTaskForAnswers] = useState(null);

  // Syllabus state
  const [expandedSyllabusSubject, setExpandedSyllabusSubject] = useState(null);
  const [selectedUnitKey, setSelectedUnitKey] = useState(null);
  // Files uploaded per unit key, managing uploaded files state here:
  const [unitUploadedFiles, setUnitUploadedFiles] = useState({});

  // Menu with syllabus like Student menu, adding nested units for syllabus subjects
  const menu = [
    { label: "Home", icon: "🏠" },
    { label: "Monitoring", icon: "🖥️" },
    { label: "Credits Check", icon: "🧾" },
    {
      label: "Assignments Submission",
      icon: "📤",
      subLinks: [{ label: "Create Assignment", key: "create-assignment" }],
    },
    {
      label: "Tasks",
      icon: "📝",
      subLinks: [
        { label: "Upload Task", key: "upload-task" },
        { label: "My Tasks", key: "my-tasks" },
      ],
    },
    {
      label: "Syllabus",
      icon: "📄",
      subLinks: [
        {
          label: "Physics",
          key: "syllabus-physics",
          subLinks: [
            { label: "UNIT-I", key: "syllabus-physics-unit1" },
            { label: "UNIT-II", key: "syllabus-physics-unit2" },
            { label: "UNIT-III", key: "syllabus-physics-unit3" },
          ],
        },
        {
          label: "Chemistry",
          key: "syllabus-chemistry",
          subLinks: [
            { label: "UNIT-I", key: "syllabus-chemistry-unit1" },
            { label: "UNIT-II", key: "syllabus-chemistry-unit2" },
            { label: "UNIT-III", key: "syllabus-chemistry-unit3" },
          ],
        },
        {
          label: "Maths",
          key: "syllabus-maths",
          subLinks: [
            { label: "UNIT-I", key: "syllabus-maths-unit1" },
            { label: "UNIT-II", key: "syllabus-maths-unit2" },
            { label: "UNIT-III", key: "syllabus-maths-unit3" },
          ],
        },
      ],
    },
  ];

  useEffect(() => {
  async function fetchSyllabusUploads() {
    if (!token) return;
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/syllabus", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch syllabus uploads");
      const syllabusUnits = await res.json();

      const uploadsMap = {};
      syllabusUnits.forEach((unit) => {
        if (unit.uploadedFileUrl) uploadsMap[unit.key] = unit.uploadedFileUrl;
      });

      setUnitUploadedFiles(uploadsMap);
    } catch (e) {
      console.error("Error loading syllabus uploads:", e);
    }
  }
  fetchSyllabusUploads();
}, [token]);


  useEffect(() => {
    async function fetchUser() {
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data.user);
      } catch {
        setError("Error loading user");
        localStorage.removeItem("token_faculty");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [token, navigate]);

  useEffect(() => {
    if (user) {
      if (
        window.location.pathname.startsWith("/faculty") &&
        user.role !== "faculty"
      ) {
        if (user.role === "student") navigate("/student");
        else if (user.role === "admin") navigate("/admin");
        else if (user.role === "alumni") navigate("/alumni");
        else navigate("/");
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    setFilteredMenu(menu);
  }, []);

  useEffect(() => {
    if (user) {
      setLoadingAnnouncements(true);
      fetch("https://neuraliftx.onrender.com/api/announcements/active", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch announcements");
          return res.json();
        })
        .then((data) => {
          setAnnouncements(data);
          if (data.length) {
            setCurrentAnnouncement(data[0]);
            setShowAnnouncementPopup(true);
          }
          setLoadingAnnouncements(false);
        })
        .catch((e) => {
          setAnnouncementError(e.message);
          setLoadingAnnouncements(false);
        });
    }
  }, [user, token]);

  useEffect(() => {
    if (activeMain === "Assignments Submission") {
      fetchAssignments();
    } else {
      setAssignments([]);
    }
  }, [activeMain]);

  useEffect(() => {
    if (activeMain === "My Tasks") {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [activeMain]);

  async function fetchAssignments() {
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/assignments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data = await res.json();
      setAssignments(data);
    } catch {
      alert("Failed to load assignments");
    }
  }

  async function fetchTasks() {
    setLoadingTasks(true);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      alert(e.message || "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }

  const handleUploadSuccess = (newAssignment) => {
    setAssignments((prev) => [newAssignment, ...prev]);
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      const res = await fetch(`https://neuraliftx.onrender.com/api/assignments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch {
      alert("Failed to delete assignment");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(`https://neuraliftx.onrender.com/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setTasks((prev) => prev.filter((t) => t._id !== id));
      alert("Task deleted");
    } catch (e) {
      alert(e.message || "Failed to delete task");
    }
  };

  const handleViewAnswers = (task) => {
    setSelectedTaskForAnswers(task);
    setShowFacultyAnswersModal(true);
  };
  const closeFacultyAnswersModal = () => {
    setShowFacultyAnswersModal(false);
    setSelectedTaskForAnswers(null);
  };

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const handleLogout = () => {
    localStorage.removeItem("token_faculty");
    navigate("/login");
  };

  const handleProfileUpdate = (url) => {
    setUser((prev) => ({ ...prev, profilePicUrl: url }));
    setShowProfile(false);
  };

  const closeAnnouncementPopup = () => {
    const idx = announcements.findIndex((a) => a._id === currentAnnouncement._id);
    const nextIdx = idx + 1;
    if (nextIdx < announcements.length) {
      setCurrentAnnouncement(announcements[nextIdx]);
    } else {
      setShowAnnouncementPopup(false);
      setCurrentAnnouncement(null);
    }
  };

  // Handle Syllabus subject expansion toggle
  const handleSyllabusSubjectClick = (key) => {
    setExpandedSyllabusSubject(expandedSyllabusSubject === key ? null : key);
    setActiveMain("Syllabus");
    setActiveSub(key);
    // Reset selected unit when changing subject
    setSelectedUnitKey(null);
  };

  // Handle Unit click
  const handleUnitClick = (unitKey) => {
    setSelectedUnitKey(unitKey);
  };

 const handleUnitFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || !selectedUnitKey) return;

  const formData = new FormData();
  formData.append("pdf", file);

  try {
    const res = await fetch(
      `https://neuraliftx.onrender.com/api/syllabus/unit-upload?unitKey=${selectedUnitKey}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type header explicitly here; browser sets it for FormData
        },
        body: formData,
      }
    );

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();

    setUnitUploadedFiles((prev) => ({
      ...prev,
      [selectedUnitKey]: data.fileUrl,
    }));

    alert("File uploaded successfully");
  } catch (e) {
    alert("Failed to upload file for unit: " + e.message);
  }
};

  let contentArea = null;
  if (activeMain === "Assignments Submission") {
    contentArea = (
      <>
        <h2>Uploaded Assignments</h2>
        {assignments.length === 0 && <p>No assignments uploaded.</p>}
        <ul>
          {assignments.map(({ _id, originalName, fileUrl }) => (
            <li key={_id} style={{ marginBottom: 12 }}>
              <a
                href={`https://neuraliftx.onrender.com${fileUrl}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontWeight: 500, marginRight: 10 }}
              >
                {originalName}
              </a>
              <button
                style={{
                  color: "red",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => handleDeleteAssignment(_id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  } else if (activeMain === "My Tasks") {
    contentArea = (
      <>
        <h2>My Uploaded Tasks</h2>
        {loadingTasks && <p>Loading tasks...</p>}
        {!loadingTasks && tasks.length === 0 && <p>No tasks uploaded yet.</p>}
        {!loadingTasks && tasks.length > 0 && (
          <ul>
            {tasks.map((task) => (
              <li key={task._id} style={{ marginBottom: 18 }}>
                <a
                  href={`https://neuraliftx.onrender.com${task.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginRight: 10 }}
                >
                  {task.originalName}
                </a>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  style={{ color: "red", cursor: "pointer", marginRight: 8 }}
                >
                  Delete
                </button>
                <button
                  onClick={() => handleViewAnswers(task)}
                  style={{ color: "#0066cc", cursor: "pointer" }}
                >
                  View Answers
                </button>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  } else if (activeMain === "Syllabus") {
    // Render syllabus with subjects, expandable units, and file upload for selected unit
    const currentSubject = menu
      .find((m) => m.label === "Syllabus")
      ?.subLinks.find((sub) => sub.key === activeSub);

    contentArea = (
      <div style={{ padding: "1rem" }}>
        <h2>Syllabus</h2>
        <nav>
          <ul style={{ paddingLeft: 0 }}>
            {menu
              .find((m) => m.label === "Syllabus")
              .subLinks.map((subject) => {
                const isExpanded = expandedSyllabusSubject === subject.key;
                return (
                  <li key={subject.key} style={{ marginBottom: 12 }}>
                    <button
                      onClick={() => handleSyllabusSubjectClick(subject.key)}
                      style={{
                        fontWeight: activeSub === subject.key ? "700" : "500",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      {subject.label}
                    </button>
                    {isExpanded && (
                      <ul style={{ paddingLeft: "1rem", marginTop: 8 }}>
                        {subject.subLinks?.map((unit) => (
                          <li key={unit.key} style={{ marginBottom: 8 }}>
                            <button
                              onClick={() => handleUnitClick(unit.key)}
                              style={{
                                fontWeight: selectedUnitKey === unit.key ? "700" : "400",
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                                padding: 0,
                                textDecoration: "underline",
                              }}
                            >
                              {unit.label}
                            </button>
                            {selectedUnitKey === unit.key && (
                              <div style={{ marginTop: 8 }}>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={handleUnitFileUpload}
                                />
                                {unitUploadedFiles[unit.key] && (
                                  <p>
                                    Uploaded File:{" "}
                                    <a
                                      href={`https://neuraliftx.onrender.com${unitUploadedFiles[unit.key]}`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      View PDF
                                    </a>
                                  </p>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>
    );
  } else {
    contentArea = <h2>{activeMain} content here</h2>;
  }

  return (
    <div className="student-root">
      <header className="student-header">
        <button className="hamburger" aria-label="Toggle sidebar" onClick={toggleSidebar}>
          <span />
          <span />
          <span />
        </button>
        <div className="header-brand">
          <img src={logo} alt="Logo" className="logo" />
          <span className="header-title">EduConnect - Faculty</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search menu"
            aria-label="Search menu"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="header-icons">
          <span className="icon" title="Notifications">
            🔔
          </span>
          <span className="icon" title="Library">
            📚
          </span>
          <span className="icon" title="Home">
            🏠
          </span>
          <span className="icon" title="Settings">
            ⚙️
          </span>
        </div>
        <div
          className="profile-info"
          onClick={() => setShowProfile(true)}
          style={{ cursor: "pointer" }}
        >
          <span className="profile-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="profile-uid">{user?.roleIdValue}</span>
          <img
            src={
              user?.profilePicUrl
                ? `https://neuraliftx.onrender.com${user.profilePicUrl}`
                : "https://via.placeholder.com/40"
            }
            alt="Profile"
            className="profile-pic"

            
          />
        </div>
      </header>

      <div className={`student-layout ${sidebarOpen ? "" : "closed"}`}>
        <nav className={`student-sidebar${sidebarOpen ? "" : " closed"}`}>
          <ul>
            {filteredMenu.map((item) => (
              <li key={item.label}>
                <button
                  className={activeMain === item.label ? "active main-link" : "main-link"}
                  onClick={() => {
                    setActiveMain(item.label);
                    setActiveSub(item.subLinks && item.subLinks.length > 0 ? item.subLinks[0].key : null);
                    if (item.label === "Syllabus") {
                      setExpandedSyllabusSubject(null);
                      setSelectedUnitKey(null);
                    }
                    // Close modals on main menu change
                    setShowCreateAssignment(false);
                    setShowUploadTask(false);
                  }}
                >
                  <span className="main-icon">{item.icon}</span> {item.label}
                </button>
                {activeMain === item.label && item.subLinks && (
                  <ul className="sub-links open">
                    {item.subLinks.map((sub) => {
                      const isSyllabus = item.label === "Syllabus";
                      const isExpanded = expandedSyllabusSubject === sub.key;
                      return (
                        <li key={sub.key}>
                          <button
                            className={`sub-link${activeSub === sub.key ? " active" : ""}`}
                            onClick={() => {
                              if (isSyllabus) {
                                handleSyllabusSubjectClick(sub.key);
                              } else {
                                setActiveSub(sub.key);
                                if (sub.key === "create-assignment") setShowCreateAssignment(true);
                                else setShowCreateAssignment(false);
                                if (sub.key === "upload-task") setShowUploadTask(true);
                                else setShowUploadTask(false);
                                if (sub.key === "my-tasks") setActiveMain("My Tasks");
                              }
                            }}
                          >
                            {sub.label}
                          </button>
                          {/* Render units nested for syllabus */}
                          {isSyllabus && isExpanded && sub.subLinks && (
                            <ul className="unit-sub-links">
                              {sub.subLinks.map((unit) => (
                                <li key={unit.key}>
                                  <button
                                    className={`sub-link${activeSub === unit.key ? " active" : ""}`}
                                    onClick={() => {
                                      handleUnitClick(unit.key);
                                      setActiveSub(unit.key);
                                    }}
                                  >
                                    {unit.label}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <main className="student-content">{contentArea}</main>
      </div>

      {showCreateAssignment && (
        <CreateAssignmentModal
          token={token}
          onUpload={handleUploadSuccess}
          onClose={() => setShowCreateAssignment(false)}
        />
      )}
      {showProfile && (
        <ProfileModal
          user={user}
          token={token}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onUpdate={handleProfileUpdate}
        />
      )}
      {showAnnouncementPopup && currentAnnouncement && (
        <AnnouncementPopup
          announcement={currentAnnouncement}
          onClose={closeAnnouncementPopup}
          token={token}
        />
      )}
      {showUploadTask && (
        <UploadTaskModal
          token={token}
          onClose={() => setShowUploadTask(false)}
          onUpload={fetchTasks}
        />
      )}
      {showFacultyAnswersModal && selectedTaskForAnswers && (
        <FacultyAnswersModal
          token={token}
          task={selectedTaskForAnswers}
          onClose={closeFacultyAnswersModal}
        />
      )}
    </div>
  );
}
