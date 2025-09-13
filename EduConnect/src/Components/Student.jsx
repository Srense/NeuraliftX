import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css"; // Notice: Use the shared theme CSS for all dashboards!
import "./Student.css"; // Student specific styles
import logo from "../assets/Logo.png";
import HomeDashboard from "./HomeDashboard";
import AttendanceDashboard from "./AttendanceDashboard";
import QuizPerformanceChart from "./Studentquizperformancechart";
import CourseraCertifications from "./CourseraCertifications";
import IndividualLeaderboard from "./IndividualLeaderboard";

const getProfileImageUrl = (profilePicUrl) =>
  profilePicUrl ? `https://neuraliftx.onrender.com${profilePicUrl}` : "https://via.placeholder.com/40";

function ProfileModal({ user, token, onClose, onLogout, onUpdateProfilePic }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(getProfileImageUrl(user.profilePicUrl));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
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
      onUpdateProfilePic(data.profilePicUrl);
      alert("Profile picture uploaded successfully.");
      setSelectedFile(null);
      setPreviewUrl(getProfileImageUrl(data.profilePicUrl));
    } catch {
      alert("Error uploading profile picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">✕</button>
        <h2>My Profile</h2>
        <img src={previewUrl} alt="Profile" className="profile-large-pic" />
        <p><b>Name:</b> {user.firstName} {user.lastName}</p>
        <p><b>UID:</b> {user.roleIdValue}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Coins Earned:</b> {user.coins || 0}</p>

        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "Uploading..." : "Upload Picture"}
        </button>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
}

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
      if (!res.ok) throw new Error("Feedback submission failed");
      setSubmitted(true);
    } catch (e) {
      alert(e.message || "Submission error");
    }
    setSubmitting(false);
  };

  if (!announcement) return null;

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <button onClick={onClose} className="close-btn">✕</button>
        <h2>{announcement.title}</h2>
        {announcement.contentType === "text" ? (
          <p>{announcement.message}</p>
        ) : submitted ? (
          <p>Thank you for your feedback!</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {announcement.surveyQuestions.map((q, idx) => (
              <div key={idx} style={{ marginBottom: "1rem" }}>
                <label style={{ fontWeight: "600" }}>{q.question}</label>
                {q.inputType === "text" && (
                  <textarea
                    rows={3}
                    value={responses[idx] || ""}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    required
                  />
                )}
                {(q.inputType === "radio" || q.inputType === "checkbox") && (
                  <div>
                    {q.options.map((opt, i) => (
                      <label key={i} style={{ display: "block", marginTop: 4 }}>
                        <input
                          type={q.inputType}
                          name={`question-${idx}`}
                          value={opt}
                          checked={
                            q.inputType === "radio"
                              ? responses[idx] === opt
                              : Array.isArray(responses[idx]) && responses[idx].includes(opt)
                          }
                          onChange={(e) => {
                            if (q.inputType === "radio") {
                              handleChange(idx, e.target.value);
                            } else {
                              const prev = responses[idx] || [];
                              if (e.target.checked) {
                                handleChange(idx, [...prev, e.target.value]);
                              } else {
                                handleChange(idx, prev.filter((v) => v !== e.target.value));
                              }
                            }
                          }}
                          required={q.inputType === "radio"}
                        />
                        {" "}{opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.inputType === "select" && (
                  <select
                    value={responses[idx] || ""}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <button type="submit" disabled={submitting} className="action-btn">
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ======================= THEME SYNC LOGIC: fetch global theme and apply ====================
function useGlobalTheme() {
  useEffect(() => {
    async function syncTheme() {
      const res = await fetch("https://neuraliftx.onrender.com/api/theme");
      if (res.ok) {
        const { theme } = await res.json();
        document.body.classList.remove("default", "dark", "blue");
        document.body.classList.add(theme);
      }
    }
    syncTheme();
    const interval = setInterval(syncTheme, 3000); // 3 seconds
    return () => clearInterval(interval);
  }, []);
}

// ========== Student Task Section Component ==========
function StudentTasks({ token }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [uploadingAnswer, setUploadingAnswer] = useState(false);

  // Fetch tasks uploaded by faculty
  useEffect(() => {
    async function fetchTasks() {
      setLoadingTasks(true);
      try {
        const res = await fetch('https://neuraliftx.onrender.com/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const data = await res.json();
        setTasks(data);
      } catch (e) {
        alert(e.message);
      } finally {
        setLoadingTasks(false);
      }
    }
    fetchTasks();
  }, [token]);

  // Fetch student's existing answer for the selected task
  useEffect(() => {
    if (!selectedTask) {
      setStudentAnswer(null);
      return;
    }

    async function fetchAnswer() {
      try {
        const res = await fetch(`https://neuraliftx.onrender.com/api/student-answers/${selectedTask._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setStudentAnswer(null);
          return;
        }
        const data = await res.json();
        setStudentAnswer(data);
      } catch {
        setStudentAnswer(null);
      }
    }
    fetchAnswer();
  }, [selectedTask, token]);

  const handleAnswerChange = (e) => {
    setAnswerFile(e.target.files[0]);
  };

  const handleSubmitAnswer = async () => {
    if (!answerFile || !selectedTask) {
      alert("Select a file and task first.");
      return;
    }
    setUploadingAnswer(true);
    const formData = new FormData();
    formData.append('answerFile', answerFile);

    try {
      const res = await fetch(`https://neuraliftx.onrender.com/api/student-answers/${selectedTask._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Answer upload failed");
      const data = await res.json();
      alert("Answer uploaded successfully");
      setStudentAnswer(data);
      setAnswerFile(null);
    } catch (e) {
      alert(e.message || "Failed to upload answer");
    } finally {
      setUploadingAnswer(false);
    }
  };

  return (
    <div>
      <h2>Tasks Assigned</h2>
      {loadingTasks && <p>Loading tasks...</p>}
      {!loadingTasks && tasks.length === 0 && <p>No tasks available.</p>}
      {!loadingTasks && tasks.length > 0 && (
        <ul>
          {tasks.map(task => (
            <li key={task._id} style={{ marginBottom: 12, cursor: "pointer" }}>
              <button onClick={() => setSelectedTask(task)} style={{ background: selectedTask?._id === task._id ? '#ccc' : 'transparent' }}>
                {task.originalName}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedTask && (
        <>
          <h3>Task Details</h3>
          <p><a href={`https://neuraliftx.onrender.com${selectedTask.fileUrl}`} target="_blank" rel="noreferrer">View Task PDF</a></p>
          <hr />
          <div>
            <h4>Your Answer</h4>
            {studentAnswer ? (
              <p>
                <a href={`https://neuraliftx.onrender.com${studentAnswer.fileUrl}`} target="_blank" rel="noreferrer">View uploaded answer</a>
              </p>
            ) : (
              <p>No answer uploaded yet.</p>
            )}
            <input type="file" accept="application/pdf" onChange={handleAnswerChange} disabled={uploadingAnswer} />
            <button onClick={handleSubmitAnswer} disabled={!answerFile || uploadingAnswer}>
              {uploadingAnswer ? "Uploading..." : "Upload Answer"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
// ===========================================================================================


export default function Student() {
  useGlobalTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem("token_student");
  const handleGenerateQuiz = (assignmentId) => {
    navigate(`/quiz/${assignmentId}`);
  };

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMain, setActiveMain] = useState("Home");
  const [activeSub, setActiveSub] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Announcement popup states
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementError, setAnnouncementError] = useState(null);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);

  const [assignments, setAssignments] = useState([]); // for storing fetched assignments

  const menu = [
    { label: "Home", icon: "🏠", subLinks: [] },
    {
      label: "Academics",
      icon: "📚",
      subLinks: [
        { label: "Attendance", key: "academics-attendance" },
        { label: "Grades", key: "academics-grades" },
        { label: "Courses", key: "academics-courses" },
      ],
    },
    { label: "Syllabus", icon: "📄", subLinks: [] },
    { label: "Quiz/Assignments", icon: "📝", subLinks: [] },
    { label: "Personalisation Tracker", icon: "📈", subLinks: [] },
    { label: "Internships", icon: "💼", subLinks: [] },
    { label: "Live Projects", icon: "💻", subLinks: [] },
    { label: "Certifications", icon: "🎓", subLinks: [] },
    { label: "Alumni Arena", icon: "🤝", subLinks: [] },
    {
      label: "Top Rankers",
      icon: "🏆",
      subLinks: [
        { label: "Individual", key: "toprankers-individual" },
        { label: "School Ranking", key: "toprankers-school" },
      ],
    },
    { label: "Tasks", icon: "📝", subLinks: [] }, // Add Tasks menu (linked to the new Task component)
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
        if (!res.ok) throw new Error("Failed to fetch user profile");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        setError("Could not load user data. Please log in again.");
        localStorage.removeItem("token_student");
        navigate("/login");
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, [token, navigate]);

  // Fetch announcements after user loads
  useEffect(() => {
    if (!user) return;
    async function fetchAnnouncements() {
      setLoadingAnnouncements(true);
      setAnnouncementError(null);
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/announcements/active", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch announcements");
        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : []);
        // Show first announcement immediately
        if (data.length > 0) {
          setCurrentAnnouncement(data[0]);
          setShowAnnouncementPopup(true);
        }
      } catch (e) {
        setAnnouncementError(e.message);
        setAnnouncements([]);
      } finally {
        setLoadingAnnouncements(false);
      }
    }
    fetchAnnouncements();
  }, [user, token]);

  // Fetch assignments when "Quiz/Assignments" menu is active
  useEffect(() => {
    if (activeMain === "Quiz/Assignments") {
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
    } catch (e) {
      alert("Failed to load assignments");
    }
  }

  useEffect(() => {
    if (user) {
      if (
        window.location.pathname.startsWith("/student") &&
        user.role !== "student"
      ) {
        if (user.role === "faculty") navigate("/faculty");
        else if (user.role === "admin") navigate("/admin");
        else if (user.role === "alumni") navigate("/alumni");
        else navigate("/");
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMenu(menu);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = menu
      .map((item) => {
        const filteredSubs = item.subLinks.filter((sub) =>
          sub.label.toLowerCase().includes(lowerSearch)
        );
        if (
          item.label.toLowerCase().includes(lowerSearch) ||
          filteredSubs.length > 0
        ) {
          return { ...item, subLinks: filteredSubs };
        }
        return null;
      })
      .filter(Boolean);
    setFilteredMenu(filtered);
  }, [searchTerm]);

  const toggleSidebar = () => setSidebarOpen((open) => !open);

  const handleMainClick = (label) => {
    setActiveMain(label);
    const mainItem = menu.find((m) => m.label === label);
    if (mainItem && mainItem.subLinks.length > 0) {
      setActiveSub(mainItem.subLinks[0].key);
    } else {
      setActiveSub(null);
    }
  };

  const handleSubClick = (key) => setActiveSub(key);

  const handleLogout = () => {
    localStorage.removeItem("token_student");
    navigate("/login");
  };

  const handleUpdateProfilePic = (profilePicUrl) => {
    setUser((prev) => ({ ...prev, profilePicUrl }));
    setShowProfileModal(false);
  };

  // Close announcement and show next if any
  const closeAnnouncementPopup = () => {
    const currentIndex = announcements.findIndex(
      (a) => a._id === currentAnnouncement?._id
    );
    const nextIndex = currentIndex + 1;
    if (nextIndex < announcements.length) {
      setCurrentAnnouncement(announcements[nextIndex]);
    } else {
      setShowAnnouncementPopup(false);
      setCurrentAnnouncement(null);
    }
  };

  let contentArea = null;
  if (activeMain === "Home") {
    contentArea = <HomeDashboard token={token} />;
  } else if (
    activeMain === "Academics" &&
    activeSub === "academics-attendance"
  ) {
    contentArea = <AttendanceDashboard token={token} />;
  } else if (activeMain === "Quiz/Assignments") {
    contentArea = (
      <div className="assignments-container">
        {assignments.length === 0 && <p>No assignments available.</p>}
        <div className="assignment-cards">
          {assignments.map(({ _id, originalName, fileUrl }) => (
            <div key={_id} className="assignment-card">
              <a
                href={`https://neuraliftx.onrender.com${fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="assignment-link"
              >
                {originalName}
              </a>
              <button
                className="generate-quiz-btn"
                onClick={() => handleGenerateQuiz(_id)}
              >
                Generate Quiz
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (activeMain === "Personalisation Tracker") {
    contentArea = (
      <div style={{ padding: "2rem 1rem" }}>
        <QuizPerformanceChart />
      </div>
    );
  } else if (activeMain === "Certifications") {
    contentArea = <CourseraCertifications />;
  } else if (activeMain === "Top Rankers" && activeSub === "toprankers-individual") {
    contentArea = <IndividualLeaderboard />;
  } else if (activeMain === "Tasks") {
    contentArea = <StudentTasks token={token} />;
  } else {
    contentArea = <div>Select a menu item to view its content.</div>;
  }

  if (loadingUser) return <div className="loading">Loading user info...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-root">
      <header className="student-header">
        <button
          className="hamburger"
          aria-label="Toggle menu"
          onClick={toggleSidebar}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="header-brand">
          <img src={logo} alt="EduConnect Logo" className="header-logo" />
          <span className="header-title">EduConnect</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search & Bookmark your page"
            aria-label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">&#128269;</span>
        </div>
        <div className="header-icons">
          <span className="icon" title="Notifications">&#128276;</span>
          <span className="icon" title="Library">&#128214;</span>
          <span className="icon" title="Home">&#8962;</span>
          <span className="icon" title="Settings">&#9881;</span>
        </div>
        <div
          className="profile-info"
          style={{ cursor: "pointer" }}
          onClick={() => setShowProfileModal(true)}
        >
          <span className="profile-name">
            {user.firstName} {user.lastName}
          </span>
          <span className="profile-uid">{user.roleIdValue}</span>
          <img
            src={getProfileImageUrl(user.profilePicUrl)}
            alt="Profile"
            className="profile-pic"
          />
        </div>
      </header>

      <div className={`student-layout ${sidebarOpen ? "" : "closed"}`}>
        <nav className={`student-sidebar${sidebarOpen ? "" : " closed"}`}>
          <ul>
            {filteredMenu.map((main) => (
              <li key={main.label}>
                <button
                  className={`main-link${activeMain === main.label ? " active" : ""}`}
                  onClick={() => handleMainClick(main.label)}
                >
                  <span className="main-icon">{main.icon}</span> {main.label}
                </button>
                {activeMain === main.label && main.subLinks.length > 0 && (
                  <ul className="sub-links open">
                    {main.subLinks.map((sub) => (
                      <li key={sub.key}>
                        <button
                          className={`sub-link${activeSub === sub.key ? " active" : ""}`}
                          onClick={() => handleSubClick(sub.key)}
                        >
                          {sub.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {/* Add Tasks menu separately */}
            <li>
              <button
                className={`main-link${activeMain === "Tasks" ? " active" : ""}`}
                onClick={() => setActiveMain("Tasks")}
              >
                <span className="main-icon">📝</span> Tasks
              </button>
            </li>
          </ul>
        </nav>

        <main className="student-content">{contentArea}</main>
      </div>

      {showProfileModal && (
        <ProfileModal
          user={user}
          token={token}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
          onUpdateProfilePic={handleUpdateProfilePic}
        />
      )}

      {showAnnouncementPopup && currentAnnouncement && (
        <AnnouncementPopup
          announcement={currentAnnouncement}
          onClose={closeAnnouncementPopup}
          token={token}
        />
      )}
    </div>
  );
}
