import React, { useState, useEffect, useRef } from "react";
import { Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import "./Student.css";
import logo from "../assets/Logo.png";
import HomeDashboard from "./HomeDashboard";
import AttendanceDashboard from "./AttendanceDashboard";
import QuizPerformanceChart from "./Studentquizperformancechart";
import CourseraCertifications from "./CourseraCertifications";
import IndividualLeaderboard from "./IndividualLeaderboard";
import Grades from "./Grades.jsx";
import AlumniArena from "./AlumniArena";
import StudentConnections from "./StudentConnections";

const Social = lazy(() => import("./Social"));

// Coin Badge Component
function CoinBadge({ coins }) {
  return (
    <div className="coin-badge">
      <CoinIcon />
      <span className="coin-value">{coins}</span>
    </div>
  );
}

function CoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" style={{ verticalAlign: "middle" }}>
      <circle cx="20" cy="20" r="16" fill="#febe44" stroke="#f5a623" strokeWidth="4" />
      <circle cx="20" cy="20" r="11" fill="#fff4c1" />
      <polygon
        points="20,12 22,18 28,18 23,21 25,27 20,23.5 15,27 17,21 12,18 18,18"
        fill="#fff"
        stroke="#f5a623"
        strokeWidth="1"
      />
    </svg>
  );
}

const getProfileImageUrl = (profilePicUrl) =>
  profilePicUrl ? `https://neuraliftx.onrender.com${profilePicUrl}` : "https://via.placeholder.com/40";

// Profile Modal (student viewing their own profile)
function ProfileModal({ user, token, onClose, onLogout, onUpdateProfilePic, onProfileUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(getProfileImageUrl(user.profilePicUrl));
  const [profileData, setProfileData] = useState({
    bio: user.bio || "",
    percentage: user.percentage || "",
    className: user.className || "",
    internshipsDone: (user.internshipsDone || []).join(", "),
    coursesCompleted: (user.coursesCompleted || []).join(", "),
    areaOfInterest: (user.areaOfInterest || []).join(", "),
  });

  useEffect(() => {
    setProfileData({
      bio: user.bio || "",
      percentage: user.percentage || "",
      className: user.className || "",
      internshipsDone: (user.internshipsDone || []).join(", "),
      coursesCompleted: (user.coursesCompleted || []).join(", "),
      areaOfInterest: (user.areaOfInterest || []).join(", "),
    });
    setPreviewUrl(getProfileImageUrl(user.profilePicUrl));
    setSelectedFile(null);
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const body = {
      bio: profileData.bio,
      percentage: profileData.percentage === "" ? null : Number(profileData.percentage),
      className: profileData.className,
      internshipsDone: profileData.internshipsDone.split(",").map((s) => s.trim()).filter(Boolean),
      coursesCompleted: profileData.coursesCompleted.split(",").map((s) => s.trim()).filter(Boolean),
      areaOfInterest: profileData.areaOfInterest.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      onProfileUpdate(data.user);
      alert("Profile updated successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal profile-modal-enhanced" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        <h2 className="modal-title">My Profile</h2>
        
        <div className="profile-image-section">
          <img src={previewUrl} alt="Profile" className="profile-large-pic" />
          <div className="profile-image-upload">
            <input type="file" accept="image/*" onChange={handleFileChange} id="profile-upload" />
            <label htmlFor="profile-upload" className="upload-label">Choose Photo</label>
            <button onClick={handleUpload} disabled={!selectedFile || uploading} className="upload-btn">
              {uploading ? "Uploading..." : "Upload Picture"}
            </button>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="info-item">
            <label>Name</label>
            <p>{user.firstName} {user.lastName}</p>
          </div>
          <div className="info-item">
            <label>UID</label>
            <p>{user.roleIdValue}</p>
          </div>
          <div className="info-item full-width">
            <label>Email</label>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Percentage</label>
              <input
                type="number"
                name="percentage"
                value={profileData.percentage}
                onChange={handleChange}
                min={0}
                max={100}
                step={0.01}
                placeholder="85.5"
              />
            </div>

            <div className="form-group">
              <label>Class</label>
              <input
                type="text"
                name="className"
                value={profileData.className}
                onChange={handleChange}
                placeholder="12th Science-A"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Internships Done (comma separated)</label>
            <input
              type="text"
              name="internshipsDone"
              value={profileData.internshipsDone}
              onChange={handleChange}
              placeholder="Google SWE, Microsoft PM"
            />
          </div>

          <div className="form-group">
            <label>Courses Completed (comma separated)</label>
            <input
              type="text"
              name="coursesCompleted"
              value={profileData.coursesCompleted}
              onChange={handleChange}
              placeholder="React, Node.js, Python"
            />
          </div>

          <div className="form-group">
            <label>Area of Interest (comma separated)</label>
            <input
              type="text"
              name="areaOfInterest"
              value={profileData.areaOfInterest}
              onChange={handleChange}
              placeholder="AI/ML, Web Development, Data Science"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleSave} className="action-btn save-btn">
            Save Profile
          </button>
          <button onClick={onLogout} className="action-btn logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// Student Profile Modal (for search results)
function StudentProfileModal({ student, token, onClose }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!student?._id) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`https://neuraliftx.onrender.com/api/connect/student/status/${student._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = await res.json();
        if (!mounted) return;
        setStatus(data.status || "not_connected");
      } catch (e) {
        setStatus(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [student, token]);

  const sendRequest = async () => {
    if (!student?._id) return;
    setSending(true);
    try {
      const res = await fetch(`https://neuraliftx.onrender.com/api/connect/student/${student._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to send connection request");
      alert(data.message || "Connection request sent!");
      setStatus("pending");
    } catch (err) {
      alert(err.message || "Request failed");
    } finally {
      setSending(false);
    }
  };

  if (!student) return null;

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal student-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        
        <div className="student-profile-header">
          <img src={getProfileImageUrl(student.profilePicUrl)} alt="Profile" className="profile-large-pic" />
          <div className="student-profile-info">
            <h2>{student.firstName} {student.lastName}</h2>
            <p className="student-uid">{student.roleIdValue}</p>
            <p className="student-email">{student.email}</p>
          </div>
        </div>

        <div className="student-profile-details">
          <div className="detail-card">
            <span className="detail-label">Class</span>
            <span className="detail-value">{student.className || "N/A"}</span>
          </div>
          <div className="detail-card">
            <span className="detail-label">Percentage</span>
            <span className="detail-value">{student.percentage ?? "N/A"}{student.percentage ? "%" : ""}</span>
          </div>
        </div>

        <div className="student-bio-section">
          <h3>Bio</h3>
          <p>{student.bio || "No bio provided."}</p>
        </div>

        <div className="student-interests-section">
          <h3>Interests</h3>
          <div className="interests-tags">
            {Array.isArray(student.areaOfInterest) && student.areaOfInterest.length > 0 ? (
              student.areaOfInterest.map((interest, idx) => (
                <span key={idx} className="interest-tag">{interest}</span>
              ))
            ) : (
              <p>No interests specified</p>
            )}
          </div>
        </div>

        <div className="modal-actions">
          {loading ? (
            <button className="action-btn" disabled>Checking...</button>
          ) : status && status !== "not_connected" ? (
            <button className="action-btn" disabled>
              {status === "pending" ? "Request Sent" : status === "accepted" ? "Connected" : "Status: " + status}
            </button>
          ) : (
            <button onClick={sendRequest} className="action-btn connect-btn" disabled={sending}>
              {sending ? "Sending..." : "Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Announcement Popup
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
      <div className="profile-modal announcement-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        <h2>{announcement.title}</h2>
        {announcement.contentType === "text" ? (
          <p className="announcement-message">{announcement.message}</p>
        ) : submitted ? (
          <div className="success-message">
            <span className="success-icon">✓</span>
            <p>Thank you for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="survey-form">
            {announcement.surveyQuestions?.map((q, idx) => (
              <div key={idx} className="survey-question">
                <label>{q.question}</label>
                {q.inputType === "text" && (
                  <textarea
                    rows={3}
                    value={responses[idx] || ""}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    required
                  />
                )}
                {(q.inputType === "radio" || q.inputType === "checkbox") && (
                  <div className="options-group">
                    {q.options.map((opt, i) => (
                      <label key={i} className="option-label">
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
                        {opt}
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
            <button type="submit" disabled={submitting} className="action-btn submit-btn">
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Global Theme Hook
function useGlobalTheme() {
  useEffect(() => {
    async function syncTheme() {
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/theme");
        if (res.ok) {
          const { theme } = await res.json();
          document.body.classList.remove("default", "dark", "blue");
          document.body.classList.add(theme);
        }
      } catch (e) {
        // ignore
      }
    }
    syncTheme();
    const interval = setInterval(syncTheme, 3000);
    return () => clearInterval(interval);
  }, []);
}

// Student Tasks Component
function StudentTasks({ token }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [uploadingAnswer, setUploadingAnswer] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
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
        alert(e.message);
      } finally {
        setLoadingTasks(false);
      }
    }
    fetchTasks();
  }, [token]);

  useEffect(() => {
    if (!selectedTask) {
      setStudentAnswer(null);
      return;
    }
    async function fetchAnswer() {
      try {
        const res = await fetch(
          `https://neuraliftx.onrender.com/api/student-answers/${selectedTask._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

  const handleAnswerChange = (e) => setAnswerFile(e.target.files[0]);

  const handleSubmitAnswer = async () => {
    if (!answerFile || !selectedTask) {
      alert("Select a file and task first.");
      return;
    }
    setUploadingAnswer(true);
    const formData = new FormData();
    formData.append("answerFile", answerFile);

    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/student-answers/${selectedTask._id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
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

  const handleCheck = async () => {
    if (!selectedTask) {
      alert("Select a task first");
      return;
    }
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/check-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId: selectedTask._id }),
      });
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="tasks-container">
      {loadingTasks && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading tasks...</p>
        </div>
      )}
      {!loadingTasks && tasks.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>No tasks available.</p>
        </div>
      )}

      <div className="tasks-grid">
        {!loadingTasks && tasks.map((task) => (
          <div
            key={task._id}
            className={`task-card ${selectedTask?._id === task._id ? 'active' : ''}`}
            onClick={() => setSelectedTask(task)}
          >
            <div className="task-header">
              <h3 className="task-title">{task.originalName}</h3>
              <a
                href={`https://neuraliftx.onrender.com${task.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="task-link"
                onClick={(e) => e.stopPropagation()}
              >
                View PDF
              </a>
            </div>

            {selectedTask?._id === task._id && (
              <div className="answer-section">
                <h4>Your Answer</h4>
                {studentAnswer ? (
                  <div className="answer-info">
                    <a
                      href={`https://neuraliftx.onrender.com${studentAnswer.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="answer-link"
                    >
                      View uploaded answer
                    </a>
                    <button
                      onClick={handleCheck}
                      disabled={verifying}
                      className="task-btn check"
                    >
                      {verifying ? "Checking..." : "Check Answer"}
                    </button>

                    {verificationResult && (
                      <div className="verification-box">
                        <div className="verification-score">
                          <span className="score-label">Score:</span>
                          <span className="score-value">{verificationResult.score ?? "N/A"}</span>
                        </div>
                        <div className="verification-feedback">
                          <span className="feedback-label">Feedback:</span>
                          <p>{verificationResult.feedback ?? "No feedback"}</p>
                        </div>
                        {verificationResult.reportUrl && (
                          <a
                            href={`https://neuraliftx.onrender.com${verificationResult.reportUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="report-link"
                          >
                            View Detailed Report
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="no-answer">No answer uploaded yet.</p>
                )}

                <div className="upload-section">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleAnswerChange}
                    disabled={uploadingAnswer}
                    id={`file-${task._id}`}
                    className="file-input"
                  />
                  <label htmlFor={`file-${task._id}`} className="file-label">
                    {answerFile ? answerFile.name : "Choose PDF file"}
                  </label>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!answerFile || uploadingAnswer}
                    className="task-btn upload"
                  >
                    {uploadingAnswer ? "Uploading..." : "Upload Answer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Student Component
export default function Student() {
  useGlobalTheme();

  const navigate = useNavigate();
  const token = localStorage.getItem("token_student");

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMain, setActiveMain] = useState("Home");
  const [activeSub, setActiveSub] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [showSocial, setShowSocial] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementError, setAnnouncementError] = useState(null);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [expandedSyllabusSubject, setExpandedSyllabusSubject] = useState(null);
  const [unitUploadedFiles, setUnitUploadedFiles] = useState({});
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const searchAbortControllerRef = useRef(null);
  const searchDebounceTimerRef = useRef(null);

  const menu = [
    { label: "Home", icon: "🏠", subLinks: [] },
    {
      label: "Academics",
      icon: "📚",
      subLinks: [
        { label: "Attendance", key: "academics-attendance" },
        { label: "Courses", key: "academics-courses" },
        { label: "Grades", key: "academics-grades" },
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
    { label: "Quiz/Assignments", icon: "📝", subLinks: [] },
    { label: "Tasks", icon: "📋", subLinks: [] },
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
  ];

  // Fetch syllabus units
  useEffect(() => {
    async function fetchSyllabusUnits() {
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/syllabus", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch syllabus units");
        const syllabusUnits = await res.json();
        const uploadsMap = {};
        syllabusUnits.forEach((unit) => {
          if (unit.uploadedFileUrl) uploadsMap[unit.key] = unit.uploadedFileUrl;
        });
        setUnitUploadedFiles(uploadsMap);
      } catch (e) {
        console.error("Error fetching syllabus units uploads", e);
      }
    }
    if (token) fetchSyllabusUnits();
  }, [token]);

  // Fetch user profile
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

  // Prefetch assignments
  useEffect(() => {
    async function prefetch() {
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAssignments(data);
        }
      } catch (e) {
        // ignore
      }
    }
    if (token) prefetch();
  }, [token]);

  // Fetch announcements
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
        if (Array.isArray(data) && data.length > 0) {
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

  // Fetch assignments when Quiz/Assignments is active
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

  // Role-based navigation
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

  // Filter menu based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMenu(menu);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = menu
      .map((item) => {
        const filteredSubs = (item.subLinks || []).filter((sub) =>
          (sub.label || "").toLowerCase().includes(lowerSearch)
        );
        if (
          (item.label || "").toLowerCase().includes(lowerSearch) ||
          filteredSubs.length > 0
        ) {
          return { ...item, subLinks: filteredSubs };
        }
        return null;
      })
      .filter(Boolean);
    setFilteredMenu(filtered);
  }, [searchTerm]);

  // Global search with debounce
  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      if (searchAbortControllerRef.current) {
        try { searchAbortControllerRef.current.abort(); } catch {}
        searchAbortControllerRef.current = null;
      }
      return;
    }

    setSearchLoading(true);

    searchDebounceTimerRef.current = setTimeout(async () => {
      if (searchAbortControllerRef.current) {
        try { searchAbortControllerRef.current.abort(); } catch {}
      }
      const ac = new AbortController();
      searchAbortControllerRef.current = ac;

      const query = searchTerm.trim();

      try {
        const studentRes = await fetch(`https://neuraliftx.onrender.com/api/students/search?query=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });

        let studentResults = [];
        if (studentRes.ok) {
          const data = await studentRes.json();
          if (Array.isArray(data)) {
            studentResults = data.map(s => ({ type: "Student", data: s }));
          }
        }

        const locals = [];

        if (Array.isArray(assignments)) {
          assignments.forEach((a) => {
            if (a.originalName && a.originalName.toLowerCase().includes(query.toLowerCase())) {
              locals.push({ type: "Assignment", label: a.originalName, data: a });
            }
          });
        }

        try {
          const tasksRes = await fetch("https://neuraliftx.onrender.com/api/tasks", {
            headers: { Authorization: `Bearer ${token}` },
            signal: ac.signal,
          });
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            (tasksData || []).forEach((t) => {
              if (t.originalName && t.originalName.toLowerCase().includes(query.toLowerCase())) {
                locals.push({ type: "Task", label: t.originalName, data: t });
              }
            });
          }
        } catch (e) {
          // ignore
        }

        menu.forEach((m) => {
          if ((m.label || "").toLowerCase().includes(query.toLowerCase())) {
            locals.push({ type: "Menu", label: m.label, data: m });
          } else if (Array.isArray(m.subLinks)) {
            m.subLinks.forEach((s) => {
              if ((s.label || "").toLowerCase().includes(query.toLowerCase())) {
                locals.push({ type: "Menu", label: `${m.label} > ${s.label}`, data: s });
              }
              if (s.subLinks && Array.isArray(s.subLinks)) {
                s.subLinks.forEach((u) => {
                  if ((u.label || "").toLowerCase().includes(query.toLowerCase())) {
                    locals.push({ type: "Menu", label: `${m.label} > ${s.label} > ${u.label}`, data: u });
                  }
                });
              }
            });
          }
        });

        const combined = [...studentResults, ...locals];
        setSearchResults(combined);
      } catch (err) {
        if (err.name === "AbortError") {
          // ignore
        } else {
          console.warn("Search error:", err);
          setSearchResults([]);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, [searchTerm, token, assignments, menu]);

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

  const handleSubClick = (key) => {
    setActiveSub(key);
    if (unitUploadedFiles[key]) {
      setSelectedPdf(`https://neuraliftx.onrender.com${unitUploadedFiles[key]}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token_student");
    navigate("/login");
  };

  const handleUpdateProfilePic = (profilePicUrl) => {
    setUser((prev) => ({ ...prev, profilePicUrl }));
    setShowProfileModal(false);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleOpenProfile = () => {
    setShowProfileModal(true);
  };

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

  const handleGenerateQuiz = (assignmentId) => {
    navigate(`/quiz/${assignmentId}`);
  };

  const handleSelectSearchResult = (result) => {
    if (!result) return;
    if (result.type === "Student") {
      setSelectedStudent(result.data);
      setShowStudentModal(true);
      setSearchResults([]);
      setSearchTerm("");
    } else if (result.type === "Assignment") {
      if (result.data?.fileUrl) {
        window.open(`https://neuraliftx.onrender.com${result.data.fileUrl}`, "_blank");
      } else {
        alert("Opening assignment: " + result.label);
      }
    } else if (result.type === "Task") {
      setActiveMain("Tasks");
      setSearchResults([]);
      setSearchTerm("");
    } else if (result.type === "Menu") {
      if (result.data?.key) {
        const key = result.data.key;
        const foundMain = menu.find((m) => {
          if (m.subLinks && m.subLinks.find((s) => s.key === key)) return true;
          return m.subLinks && m.subLinks.some((s) => s.subLinks && s.subLinks.find((u) => u.key === key));
        });
        if (foundMain) {
          setActiveMain(foundMain.label);
          setActiveSub(key);
        } else {
          alert("Menu: " + result.label);
        }
      } else {
        setActiveMain(result.label);
      }
      setSearchResults([]);
      setSearchTerm("");
    } else {
      alert(`${result.type}: ${result.label || JSON.stringify(result)}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectSearchResult(searchResults[0]);
      }
    }
  };

  // Content rendering logic
  let contentArea = null;
  if (activeMain === "Home") {
    contentArea = <HomeDashboard token={token} />;
  } else if (activeMain === "Academics" && activeSub === "academics-attendance") {
    contentArea = <AttendanceDashboard token={token} />;
  } else if (activeMain === "Quiz/Assignments") {
    contentArea = (
      <div className="assignments-container">
        {assignments.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <p>No assignments available.</p>
          </div>
        ) : (
          <div className="assignment-cards">
            {assignments.map(({ _id, originalName, fileUrl }) => (
              <div key={_id} className="assignment-card">
                <div className="assignment-content">
                  <span className="assignment-icon">📄</span>
                  <a
                    href={`https://neuraliftx.onrender.com${fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="assignment-link"
                  >
                    {originalName}
                  </a>
                </div>
                <button
                  className="generate-quiz-btn"
                  onClick={() => handleGenerateQuiz(_id)}
                >
                  Generate Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (activeMain === "Academics" && activeSub === "academics-grades") {
    contentArea = <Grades token={token} />;
  } else if (activeMain === "Personalisation Tracker") {
    contentArea = (
      <div style={{ padding: "2rem 1rem" }}>
        <QuizPerformanceChart />
      </div>
    );
  } else if (activeMain === "Certifications") {
    contentArea = <CourseraCertifications token={token} />;
  } else if (activeMain === "Top Rankers" && activeSub === "toprankers-individual") {
    contentArea = <IndividualLeaderboard />;
  } else if (activeMain === "Tasks") {
    contentArea = <StudentTasks token={token} />;
  } else if (activeMain === "Alumni Arena") {
    contentArea = <AlumniArena token={token} />;
  } else if (activeMain === "Syllabus" && selectedPdf) {
    contentArea = (
      <div className="pdf-viewer-container">
        <iframe
          src={selectedPdf}
          title="Syllabus PDF"
          width="100%"
          height="600px"
          style={{
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        />
      </div>
    );
  } else if (activeMain === "Internships") {
    contentArea = (
      <div className="opportunities-container">
        <h3 className="section-title">Internship Opportunities</h3>
        <div className="card-list">
          <div className="opportunity-card">
            <div className="opportunity-icon">💼</div>
            <h4>Frontend Developer Intern</h4>
            <p>Work with React and TailwindCSS to build dynamic dashboards.</p>
            <div className="opportunity-details">
              <span><strong>Duration:</strong> 3 Months</span>
              <span><strong>Location:</strong> Remote</span>
            </div>
            <button className="apply-btn">Apply Now</button>
          </div>

          <div className="opportunity-card">
            <div className="opportunity-icon">⚙️</div>
            <h4>Backend Developer Intern</h4>
            <p>Assist in building REST APIs using Node.js and MongoDB.</p>
            <div className="opportunity-details">
              <span><strong>Duration:</strong> 2 Months</span>
              <span><strong>Location:</strong> Hybrid (Delhi)</span>
            </div>
            <button className="apply-btn">Apply Now</button>
          </div>

          <div className="opportunity-card">
            <div className="opportunity-icon">🤖</div>
            <h4>AI Research Intern</h4>
            <p>Work on AI/ML projects like chatbots and image recognition models.</p>
            <div className="opportunity-details">
              <span><strong>Duration:</strong> 6 Months</span>
              <span><strong>Location:</strong> Remote</span>
            </div>
            <button className="apply-btn">Apply Now</button>
          </div>
        </div>
      </div>
    );
  } else if (activeMain === "Live Projects") {
    contentArea = (
      <div className="opportunities-container">
        <h3 className="section-title">Ongoing Live Projects</h3>
        <div className="card-list">
          <div className="opportunity-card">
            <div className="opportunity-icon">🌐</div>
            <h4>NeuraLiftX Student Portal</h4>
            <p>Collaborate on enhancing the student–alumni system using MERN stack.</p>
            <p className="tech-stack"><strong>Tech Stack:</strong> React, Node.js, MongoDB</p>
            <button className="contribute-btn">Contribute</button>
          </div>

          <div className="opportunity-card">
            <div className="opportunity-icon">📝</div>
            <h4>AI Notes Summarizer</h4>
            <p>Help build a tool that summarizes lecture notes using NLP.</p>
            <p className="tech-stack"><strong>Tech Stack:</strong> Python, Flask, OpenAI API</p>
            <button className="contribute-btn">Contribute</button>
          </div>

          <div className="opportunity-card">
            <div className="opportunity-icon">📊</div>
            <h4>Attendance Dashboard</h4>
            <p>Improve student attendance visualization using Recharts.</p>
            <p className="tech-stack"><strong>Tech Stack:</strong> React, Express</p>
            <button className="contribute-btn">Contribute</button>
          </div>
        </div>
      </div>
    );
  } else if (activeMain === "Academics" && activeSub === "academics-courses") {
    contentArea = (
      <div className="opportunities-container">
        <h3 className="section-title">Available Courses</h3>
        <div className="card-list">
          <div className="opportunity-card">
            <div className="opportunity-icon">🔢</div>
            <h4>Data Structures & Algorithms</h4>
            <p>Learn efficient problem-solving techniques using arrays, trees, graphs, and dynamic programming.</p>
            <div className="course-info">
              <span><strong>Instructor:</strong> Prof. A. Sharma</span>
              <span><strong>Duration:</strong> 10 Weeks</span>
            </div>
            <button className="enroll-btn">Enroll Now</button>
          </div>

          <div className="opportunity-card">
            <div className="opportunity-icon">💻</div>
            <h4>Web Development with MERN Stack</h4>
            <p>Build modern full-stack web apps using MongoDB, Express, React, and Node.js.</p>
            <div className="course-info">
              <span><strong>Instructor:</strong> Mr. R. Mehta</span>
              <span><strong>Duration:</strong> 8 Weeks</span>
            </div>
            <button className="enroll-btn">Enroll Now</button>
          </div>

          <div className="opportunity-card">
            <div className="opportunity-icon">🧠</div>
            <h4>Machine Learning Fundamentals</h4>
            <p>Introduction to supervised and unsupervised learning with Python and real-world datasets.</p>
            <div className="course-info">
              <span><strong>Instructor:</strong> Dr. N. Gupta</span>
              <span><strong>Duration:</strong> 12 Weeks</span>
            </div>
            <button className="enroll-btn">Enroll Now</button>
          </div>
        </div>
      </div>
    );
  } else if (activeMain === "Top Rankers" && activeSub === "toprankers-school") {
    contentArea = (
      <div className="opportunities-container">
        <h3 className="section-title">Top Ranked Schools</h3>
        <div className="card-list">
          <div className="opportunity-card">
            <div className="rank-badge">1</div>
            <h4>Delhi Public School, Ranchi</h4>
            <div className="rating">⭐⭐⭐⭐⭐ (4.9/5)</div>
            <p>Known for excellent academic performance, discipline, and advanced learning infrastructure.</p>
            <button className="view-btn">View Details</button>
          </div>

          <div className="opportunity-card">
            <div className="rank-badge">2</div>
            <h4>D.A.V. Public School, Khalari</h4>
            <div className="rating">⭐⭐⭐⭐☆ (4.7/5)</div>
            <p>Focused on holistic education with emphasis on sports, science, and moral development.</p>
            <button className="view-btn">View Details</button>
          </div>

          <div className="opportunity-card">
            <div className="rank-badge">3</div>
            <h4>D.A.V. Public School, Kurali</h4>
            <div className="rating">⭐⭐⭐⭐☆ (4.6/5)</div>
            <p>Recognized for co-curricular excellence, student leadership, and modern teaching methods.</p>
            <button className="view-btn">View Details</button>
          </div>
        </div>
      </div>
    );
  } else {
    contentArea = (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <p>Select a menu item to view its content.</p>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

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
        <div className="search-bar" style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search by name, UID or page..."
            aria-label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoComplete="off"
          />
          <button
            aria-label="Search"
            onClick={() => {
              if (searchResults.length > 0) handleSelectSearchResult(searchResults[0]);
            }}
            className="search-icon-button"
          >
            <span className="search-icon">🔍</span>
          </button>

          {(searchResults.length > 0 || searchLoading) && (
            <div className="search-results-dropdown">
              {searchLoading && (
                <div className="search-loading">
                  <div className="spinner-small"></div>
                  <span>Searching...</span>
                </div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div className="no-results">No results found.</div>
              )}
              {!searchLoading && searchResults.map((r, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSearchResult(r);
                  }}
                  className="search-result-item"
                >
                  {r.type === "Student" ? (
                    <>
                      <img src={getProfileImageUrl(r.data.profilePicUrl)} alt="p" className="result-avatar" />
                      <div className="result-content">
                        <div className="result-name">{r.data.firstName} {r.data.lastName}</div>
                        <div className="result-meta">{r.data.roleIdValue} • {r.data.className || ""}</div>
                        {r.data.bio && <div className="result-bio">{r.data.bio.length > 60 ? r.data.bio.substring(0,60) + "..." : r.data.bio}</div>}
                      </div>
                      <div className="result-type">Student</div>
                    </>
                  ) : (
                    <>
                      <div className="result-icon">{r.type[0]}</div>
                      <div className="result-content">
                        <div className="result-name">{r.label}</div>
                        <div className="result-type-label">{r.type}</div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="header-icons">
          <span className="icon" title="Notifications">🔔</span>
          <span
            className="icon"
            title="Social"
            onClick={() => {
              setLoadingSocial(true);
              setShowSocial(true);
              setTimeout(() => setLoadingSocial(false), 600);
            }}
            style={{ cursor: "pointer" }}
          >
            💬
          </span>
          <span
            className="icon"
            title="Home"
            onClick={() => handleMainClick("Home")}
            style={{ cursor: "pointer" }}
          >
            🏠
          </span>
          <span className="icon" title="Settings">⚙️</span>
        </div>
        <div
          className="profile-info"
          style={{ cursor: "pointer" }}
          onClick={handleOpenProfile}
        >
          <span className="profile-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="profile-uid">{user?.roleIdValue}</span>
          <img
            src={getProfileImageUrl(user?.profilePicUrl)}
            alt="Profile"
            className="profile-pic"
          />
        </div>
        {user && <CoinBadge coins={user.coins || 0} />}
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
                    {main.subLinks.map((sub) => {
                      const isSyllabus = main.label === "Syllabus";
                      const isExpanded = expandedSyllabusSubject === sub.key;
                      return (
                        <li key={sub.key}>
                          <button
                            className={`sub-link${activeSub === sub.key ? " active" : ""}`}
                            onClick={() => {
                              if (isSyllabus) {
                                setExpandedSyllabusSubject(isExpanded ? null : sub.key);
                                setActiveSub(sub.key);
                              } else {
                                handleSubClick(sub.key);
                              }
                            }}
                          >
                            {sub.label}
                          </button>
                          {isSyllabus && isExpanded && sub.subLinks && (
                            <ul className="unit-sub-links">
                              {sub.subLinks.map((unit) => (
                                <li key={unit.key}>
                                  <button
                                    className={`sub-link${activeSub === unit.key ? " active" : ""}`}
                                    onClick={() => handleSubClick(unit.key)}
                                  >
                                    {unit.label}
                                  </button>
                                  {unitUploadedFiles[unit.key] && (
                                    <a
                                      href={`https://neuraliftx.onrender.com${unitUploadedFiles[unit.key]}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="pdf-link"
                                    >
                                      📄 View
                                    </a>
                                  )}
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

        <main className="student-content">
          {loadingSocial ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p>Loading social...</p>
            </div>
          ) : showSocial ? (
            <Suspense
              fallback={
                <div className="loader-container">
                  <div className="spinner"></div>
                  <p>Loading...</p>
                </div>
              }
            >
              <StudentConnections token={token} />
              <Social />
            </Suspense>
          ) : (
            contentArea
          )}
        </main>
      </div>

      {showProfileModal && (
        <ProfileModal
          user={user}
          token={token}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
          onUpdateProfilePic={handleUpdateProfilePic}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {showStudentModal && selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          token={token}
          onClose={() => { setShowStudentModal(false); setSelectedStudent(null); }}
        />
      )}

      {showAnnouncementPopup && currentAnnouncement && (
        <AnnouncementPopup announcement={currentAnnouncement} onClose={closeAnnouncementPopup} token={token} />
      )}
    </div>
  );
}