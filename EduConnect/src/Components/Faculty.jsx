import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Student.css";
import logo from "../assets/Logo.png"; // Please adjust path as needed

// Announcement Popup Component
function AnnouncementPopup({ announcement, onClose, token }) {
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (qIndex, value) => {
    setResponses((prev) => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ announcementId: announcement._id, responses }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setSubmitted(true);
    } catch (e) {
      alert(e.message || "Submission failed");
    }
    setSubmitting(false);
  };

  useEffect(() => {
    const theme = localStorage.getItem("admin_theme") || "default";
    document.body.classList.remove("default", "dark", "blue"); // remove all known themes
    document.body.classList.add(theme);

    // Optional: listen for changes in other tabs/windows
    function onStorage(event) {
      if (event.key === "admin_theme" && event.newValue) {
        document.body.classList.remove("default", "dark", "blue");
        document.body.classList.add(event.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!announcement) return null;

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        {(announcement.title || announcement.message) && (
          <>
            <h2>{announcement.title || "Announcement"}</h2>
            <p>{announcement.message || "No details available."}</p>
          </>
        )}
        {announcement.contentType === "survey" && !submitted && (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
                          checked={q.inputType === 'radio'
                            ? responses[i] === opt
                            : Array.isArray(responses[i]) && responses[i].includes(opt)}
                          onChange={(e) => {
                            if (q.inputType === 'radio') {
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
                          required={q.inputType === 'radio'}
                        />
                        {' '}{opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.inputType === "select" && (
                  <select
                    value={responses[i] || ''}
                    onChange={(e) => handleChange(i, e.target.value)}
                    required
                    style={{ width: '100%' }}
                  >
                    <option value="">Select an option</option>
                    {q.options.map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
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

// CreateAssignmentModal Component
function CreateAssignmentModal({ token, onClose, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = e => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/assignments", {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onUpload(data.assignment);
      alert('Uploaded assignment');
      onClose();
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        <h2>Upload Assignment PDF</h2>
        <input type="file" accept="application/pdf" onChange={handleChange} />
        <button disabled={!selectedFile || uploading} onClick={handleUpload} className="action-btn">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

// ProfileModal Component
function ProfileModal({ user, token, onClose, onLogout, onUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreview] = useState(user.profilePicUrl ? `https://neuraliftx.onrender.com${user.profilePicUrl}` : '');

  const handleChange = e => {
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
    formData.append('profilePic', selectedFile);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/profile/picture", {
        method: 'POST',
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
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button aria-label="Close profile modal" onClick={onClose} className="close-btn">×</button>
        <h2>My Profile</h2>
        <img src={previewUrl || "https://via.placeholder.com/120"} alt="Profile" className="profile-large-pic" />
        <p><b>Name:</b> {user.firstName} {user.lastName}</p>
        <p><b>UID:</b> {user.roleIdValue}</p>
        <p><b>Email:</b> {user.email}</p>
        <input type="file" accept="image/*" onChange={handleChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading} className="action-btn">
          {uploading ? 'Uploading...' : 'Upload Pic'}
        </button>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
}

export default function Faculty() {
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

  const menu = [
    { label: "Home", icon: "🏠" },
    { label: "Monitoring", icon: "🖥️" },
    { label: "Credits Check", icon: "🧾" },
    {
      label: "Assignments Submission",
      icon: "📤",
      subLinks: [{ label: "Create Assignment", key: "create-assignment" }],
    },
  ];

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
      if (window.location.pathname.startsWith("/faculty") && user.role !== "faculty") {
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
          <span className="icon" title="Notifications">🔔</span>
          <span className="icon" title="Library">📚</span>
          <span className="icon" title="Home">🏠</span>
          <span className="icon" title="Settings">⚙️</span>
        </div>
        <div className="profile-info" onClick={() => setShowProfile(true)} style={{ cursor: "pointer" }}>
          <span className="profile-name">{user?.firstName} {user?.lastName}</span>
          <span className="profile-uid">{user?.roleIdValue}</span>
          <img
            src={user?.profilePicUrl ? `https://neuraliftx.onrender.com${user.profilePicUrl}` : "https://via.placeholder.com/40"}
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
                  onClick={() => setActiveMain(item.label)}
                >
                  <span className="main-icon">{item.icon}</span> {item.label}
                </button>
                {activeMain === item.label && item.subLinks && (
                  <ul className="sub-links open">
                    {item.subLinks.map((sub) => (
                      <li key={sub.key}>
                        <button
                          className="sub-link"
                          onClick={() => {
                            if (sub.key === "create-assignment") setShowCreateAssignment(true);
                          }}
                        >
                          {sub.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main className="student-content">
          {activeMain === "Assignments Submission" ? (
            <>
              <h2>Uploaded Assignments</h2>
              {assignments.length === 0 && <p>No assignments uploaded.</p>}
              <ul>
                {assignments.map(({ _id, originalName, fileUrl }) => (
                  <li key={_id} style={{ marginBottom: 12 }}>
                    <a href={`https://neuraliftx.onrender.com${fileUrl}`} target="_blank" rel="noreferrer" style={{ fontWeight: 500, marginRight: 10 }}>
                      {originalName}
                    </a>
                    <button
                      style={{ color: "red", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                      onClick={() => handleDeleteAssignment(_id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <h2>{activeMain} content here</h2>
          )}
        </main>
      </div>

      {showCreateAssignment && (
        <CreateAssignmentModal token={token} onUpload={handleUploadSuccess} onClose={() => setShowCreateAssignment(false)} />
      )}
      {showProfile && (
        <ProfileModal user={user} token={token} onClose={() => setShowProfile(false)} onLogout={handleLogout} onUpdate={handleProfileUpdate} />
      )}
      {showAnnouncementPopup && currentAnnouncement && (
        <AnnouncementPopup announcement={currentAnnouncement} onClose={closeAnnouncementPopup} token={token} />
      )}
    </div>
  );
}
