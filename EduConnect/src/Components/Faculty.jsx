import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css"; // Universal theme CSS for all dashboards
import logo from "../assets/Logo.png";

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

// Existing modals omitted for brevity (UploadTaskModal, AnnouncementPopup, CreateAssignmentModal, ProfileModal, FacultyAnswersModal)
// ...  (use your existing versions for those)

function SyllabusUploadModal({ token, subjectLabel, unitLabel, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('subject', subjectLabel);
    formData.append('unit', unitLabel);

    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/syllabus-content", {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      alert("Content uploaded successfully");
      onClose();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Upload Content: {subjectLabel} - {unitLabel}</h2>
        <input type="file" accept="application/pdf" onChange={e => setSelectedFile(e.target.files[0])} />
        <button disabled={!selectedFile || uploading} onClick={handleUpload} className="action-btn">
          {uploading ? "Uploading..." : "Upload Content"}
        </button>
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

  // New syllabus related states
  const [expandedSyllabusSubject, setExpandedSyllabusSubject] = useState(null);
  const [showSyllabusUploadModal, setShowSyllabusUploadModal] = useState(false);
  const [selectedSyllabusUnit, setSelectedSyllabusUnit] = useState(null);

  // New state to store syllabus content files fetched from backend
  const [syllabusContents, setSyllabusContents] = useState([]);
  const [loadingSyllabusContents, setLoadingSyllabusContents] = useState(false);

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

  // Fetch user profile on load
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

  // Role-based redirect if needed
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

  // Fetch assignments when selected
  useEffect(() => {
    if (activeMain === "Assignments Submission") {
      fetchAssignments();
    } else {
      setAssignments([]);
    }
  }, [activeMain]);

  // Fetch tasks when selected
  useEffect(() => {
    if (activeMain === "My Tasks") {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [activeMain]);

  // Fetch syllabus contents when activeSub changes and it is a unit key
  useEffect(() => {
    async function fetchSyllabusContents() {
      if (!activeSub) {
        setSyllabusContents([]);
        return;
      }
      setLoadingSyllabusContents(true);
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/syllabus-content", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch syllabus contents");
        const contents = await res.json();

        // Filter to match selected unit key (activeSub)
        const filteredContents = contents.filter(c => c.unit === activeSub);
        setSyllabusContents(filteredContents);
      } catch (e) {
        alert(e.message);
      } finally {
        setLoadingSyllabusContents(false);
      }
    }
    fetchSyllabusContents();
  }, [activeSub, token]);

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
    setAssignments(prev => [newAssignment, ...prev]);
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      const res = await fetch(`https://neuraliftx.onrender.com/api/assignments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setAssignments(prev => prev.filter(a => a._id !== id));
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
      setTasks(prev => prev.filter(t => t._id !== id));
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

  const toggleSidebar = () => setSidebarOpen(v => !v);

  const handleLogout = () => {
    localStorage.removeItem("token_faculty");
    navigate("/login");
  };

  const handleProfileUpdate = (url) => {
    setUser(prev => ({ ...prev, profilePicUrl: url }));
    setShowProfile(false);
  };

  const closeAnnouncementPopup = () => {
    const idx = announcements.findIndex(a => a._id === currentAnnouncement._id);
    const nextIdx = idx + 1;
    if (nextIdx < announcements.length) {
      setCurrentAnnouncement(announcements[nextIdx]);
    } else {
      setShowAnnouncementPopup(false);
      setCurrentAnnouncement(null);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMenu(menu);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = menu
      .map(item => {
        const filteredSubs = item.subLinks.filter(sub => sub.label.toLowerCase().includes(lowerSearch));
        if (item.label.toLowerCase().includes(lowerSearch) || filteredSubs.length > 0) {
          return { ...item, subLinks: filteredSubs };
        }
        return null;
      })
      .filter(Boolean);
    setFilteredMenu(filtered);
  }, [searchTerm]);

  const handleMainClick = (label) => {
    setActiveMain(label);
    const mainItem = menu.find(m => m.label === label);
    if (mainItem?.subLinks?.length > 0) {
      setActiveSub(mainItem.subLinks[0].key);
      if (label !== "Syllabus") setExpandedSyllabusSubject(null);
    } else {
      setActiveSub(null);
      if (label !== "Syllabus") setExpandedSyllabusSubject(null);
    }
  };

  const handleSubClick = (key) => setActiveSub(key);

  const handleSyllabusSubjectClick = (key) => {
    const isExpanded = expandedSyllabusSubject === key;
    setExpandedSyllabusSubject(isExpanded ? null : key);
    setActiveSub(key);
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
            onChange={e => setSearchTerm(e.target.value)}
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
            {filteredMenu.map(item => (
              <li key={item.label}>
                <button
                  className={activeMain === item.label ? "active main-link" : "main-link"}
                  onClick={() => handleMainClick(item.label)}
                >
                  <span className="main-icon">{item.icon}</span> {item.label}
                </button>
                {activeMain === item.label && item.subLinks && (
                  <ul className="sub-links open">
                    {item.subLinks.map(sub => {
                      if (item.label === "Syllabus") {
                        const isExpanded = expandedSyllabusSubject === sub.key;
                        return (
                          <li key={sub.key}>
                            <button
                              className={`sub-link${activeSub === sub.key ? " active" : ""}`}
                              onClick={() => handleSyllabusSubjectClick(sub.key)}
                            >
                              {sub.label}
                            </button>
                            {isExpanded && sub.subLinks && (
                              <ul className="unit-sub-links">
                                {sub.subLinks.map(unit => (
                                  <li key={unit.key}>
                                    <button
                                      className={`sub-link${activeSub === unit.key ? " active" : ""}`}
                                      onClick={() => {
                                        handleSubClick(unit.key);
                                        setSelectedSyllabusUnit({
                                          subjectKey: sub.key,
                                          unitKey: unit.key,
                                          subjectLabel: sub.label,
                                          unitLabel: unit.label,
                                        });
                                        setShowSyllabusUploadModal(true);
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
                      }
                      return (
                        <li key={sub.key}>
                          <button
                            className={`sub-link${activeSub === sub.key ? " active" : ""}`}
                            onClick={() => handleSubClick(sub.key)}
                          >
                            {sub.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main className="student-content">
          {activeMain === "Assignments Submission" && (
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
          )}

          {activeMain === "My Tasks" && (
            <>
              <h2>My Uploaded Tasks</h2>
              {loadingTasks && <p>Loading tasks...</p>}
              {!loadingTasks && tasks.length === 0 && <p>No tasks uploaded yet.</p>}
              {!loadingTasks && tasks.length > 0 && (
                <ul>
                  {tasks.map(task => (
                    <li key={task._id} style={{ marginBottom: 18 }}>
                      <a href={`https://neuraliftx.onrender.com${task.fileUrl}`} target="_blank" rel="noreferrer" style={{ marginRight: 10 }}>
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
          )}

          {activeMain === "Syllabus" && (
            <div>
              <h2>Syllabus Content for Unit: {activeSub}</h2>
              {loadingSyllabusContents && <p>Loading syllabus content...</p>}
              {!loadingSyllabusContents && syllabusContents.length === 0 && <p>No content uploaded for this unit yet.</p>}
              <ul>
                {syllabusContents.map(content => (
                  <li key={content._id}>
                    <a href={`https://neuraliftx.onrender.com${content.filePath}`} target="_blank" rel="noopener noreferrer">
                      {content.subject} - {content.unit} (View PDF)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeMain !== "Assignments Submission" && activeMain !== "My Tasks" && activeMain !== "Syllabus" && (
            <h2>{activeMain} content here</h2>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateAssignment && (
        <CreateAssignmentModal token={token} onUpload={handleUploadSuccess} onClose={() => setShowCreateAssignment(false)} />
      )}
      {showProfile && (
        <ProfileModal user={user} token={token} onClose={() => setShowProfile(false)} onLogout={handleLogout} onUpdate={handleProfileUpdate} />
      )}
      {showAnnouncementPopup && currentAnnouncement && (
        <AnnouncementPopup announcement={currentAnnouncement} onClose={closeAnnouncementPopup} token={token} />
      )}
      {showUploadTask && (
        <UploadTaskModal token={token} onClose={() => setShowUploadTask(false)} onUpload={fetchTasks} />
      )}
      {showFacultyAnswersModal && selectedTaskForAnswers && (
        <FacultyAnswersModal
          token={token}
          task={selectedTaskForAnswers}
          onClose={closeFacultyAnswersModal}
        />
      )}
      {showSyllabusUploadModal && selectedSyllabusUnit && (
        <SyllabusUploadModal
          token={token}
          subjectLabel={selectedSyllabusUnit.subjectLabel}
          unitLabel={selectedSyllabusUnit.unitLabel}
          onClose={() => setShowSyllabusUploadModal(false)}
        />
      )}
    </div>
  );
}
