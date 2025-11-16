import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
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
      <polygon points="20,12 22,18 28,18 23,21 25,27 20,23.5 15,27 17,21 12,18 18,18" fill="#fff" stroke="#f5a623" strokeWidth="1" />
    </svg>
  );
}

const getProfileImageUrl = (profilePicUrl) =>
  profilePicUrl ? `https://neuraliftx.onrender.com${profilePicUrl}` : "https://via.placeholder.com/40";

/* ---------------- Profile Modal (student viewing their own profile) ---------------- */
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
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        <h2>My Profile</h2>
        <img src={previewUrl} alt="Profile" className="profile-large-pic" />
        <p><b>Name:</b> {user.firstName} {user.lastName}</p>
        <p><b>UID:</b> {user.roleIdValue}</p>
        <p><b>Email:</b> {user.email}</p>

        <label>
          Bio:
          <textarea name="bio" value={profileData.bio} onChange={handleChange} rows={3} style={{ width: "100%" }} />
        </label>

        <label>
          Percentage:
          <input type="number" name="percentage" value={profileData.percentage} onChange={handleChange} min={0} max={100} step={0.01} style={{ width: "100%" }} />
        </label>

        <label>
          Class:
          <input type="text" name="className" value={profileData.className} onChange={handleChange} style={{ width: "100%" }} />
        </label>

        <label>
          Internships Done (comma separated):
          <input type="text" name="internshipsDone" value={profileData.internshipsDone} onChange={handleChange} style={{ width: "100%" }} />
        </label>

        <label>
          Courses Completed (comma separated):
          <input type="text" name="coursesCompleted" value={profileData.coursesCompleted} onChange={handleChange} style={{ width: "100%" }} />
        </label>

        <label>
          Area of Interest (comma separated):
          <input type="text" name="areaOfInterest" value={profileData.areaOfInterest} onChange={handleChange} style={{ width: "100%" }} />
        </label>

        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "Uploading..." : "Upload Picture"}
        </button>

        <button onClick={handleSave} className="action-btn" style={{ marginTop: 10 }}>
          Save Profile
        </button>

        <button onClick={onLogout} className="logout-button" style={{ marginTop: 10 }}>
          Logout
        </button>
      </div>
    </div>
  );
}

/* ----------------- StudentProfileModal (for searched students) ----------------- */
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
        setStatus(data.status || (data.success ? data.status : null));
      } catch {
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
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        <img src={getProfileImageUrl(student.profilePicUrl)} alt="Profile" className="profile-large-pic" />
        <h2>{student.firstName} {student.lastName}</h2>
        <p><b>UID:</b> {student.roleIdValue}</p>
        <p><b>Email:</b> {student.email}</p>
        <p><b>Class:</b> {student.className || "N/A"}</p>
        <p><b>Percentage:</b> {student.percentage ?? "N/A"}{student.percentage ? "%" : ""}</p>
        <p><b>Bio:</b> {student.bio || "No bio provided."}</p>
        <p><b>Interests:</b> {Array.isArray(student.areaOfInterest) ? student.areaOfInterest.join(", ") : (student.areaOfInterest || "N/A")}</p>

        {loading ? (
          <button className="action-btn" disabled>Checking...</button>
        ) : status && status !== "not_connected" ? (
          <button className="action-btn" disabled>
            {status === "pending" ? "Request Sent"
              : status === "accepted" ? "Connected"
                : "Status: " + status}
          </button>
        ) : (
          <button onClick={sendRequest} className="action-btn" disabled={sending}>
            {sending ? "Sending..." : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------- UseGlobalTheme Hook ----------- */
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
      } catch { }
    }
    syncTheme();
    const interval = setInterval(syncTheme, 3000);
    return () => clearInterval(interval);
  }, []);
}

/* ----------------- Main Student Component ----------------- */
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

  // Search related states
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
    { label: "Tasks", icon: "📝", subLinks: [] },
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

  useEffect(() => {
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
    if (activeMain === "Quiz/Assignments") fetchAssignments();
  }, [token, activeMain]);

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
        if ((item.label || "").toLowerCase().includes(lowerSearch) || filteredSubs.length > 0) {
          return { ...item, subLinks: filteredSubs };
        }
        return null;
      })
      .filter(Boolean);
    setFilteredMenu(filtered);
  }, [searchTerm]);

  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      if (searchAbortControllerRef.current) {
        try { searchAbortControllerRef.current.abort(); } catch { }
        searchAbortControllerRef.current = null;
      }
      return;
    }
    setSearchLoading(true);
    searchDebounceTimerRef.current = setTimeout(async () => {
      if (searchAbortControllerRef.current) {
        try { searchAbortControllerRef.current.abort(); } catch { }
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

        // You can add tasks here similarly if available

        menu.forEach((m) => {
          if ((m.label || "").toLowerCase().includes(query.toLowerCase())) {
            locals.push({ type: "Menu", label: m.label, data: m });
          }
          if (Array.isArray(m.subLinks)) {
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
        if (err.name !== "AbortError") {
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
        {assignments.length === 0 ? (
          <p>No assignments available.</p>
        ) : (
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
  } else if (
    activeMain === "Top Rankers" &&
    activeSub === "toprankers-individual"
  ) {
    contentArea = <IndividualLeaderboard />;
  } else if (activeMain === "Tasks") {
    contentArea = <StudentConnections token={token} />;
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
  } else {
    contentArea = <div>Select a menu item to view its content.</div>;
  }

  return (
    <div className="student-root">
      <header className="student-header">
        <button className="hamburger" aria-label="Toggle menu" onClick={toggleSidebar}>
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
            <div
              className="search-results-dropdown"
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                right: 0,
                zIndex: 1200,
                background: "#fff",
                color: "#000",
                borderRadius: 8,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                maxHeight: 360,
                overflow: "auto",
                padding: 8,
              }}
            >
              {searchLoading && (
                <div style={{ padding: 12, textAlign: "center" }}>
                  <div className="spinner" style={{ width: 24, height: 24, margin: "0 auto" }}></div>
                </div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div style={{ padding: 12 }}>No results.</div>
              )}
              {!searchLoading &&
                searchResults.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSearchResult(r);
                    }}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "8px 10px",
                      alignItems: "center",
                      cursor: "pointer",
                      borderRadius: 6,
                      transition: "background .12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {r.type === "Student" ? (
                      <>
                        <img src={getProfileImageUrl(r.data.profilePicUrl)} alt="p" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>
                            {r.data.firstName} {r.data.lastName}
                          </div>
                          <div style={{ fontSize: 12, color: "#555" }}>
                            {r.data.roleIdValue} • {r.data.className || ""}
                          </div>
                          <div style={{ fontSize: 11, color: "#666" }}>
                            {r.data.bio ? (r.data.bio.length > 60 ? r.data.bio.substring(0, 60) + "..." : r.data.bio) : ""}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>Student</div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 6,
                            background: "#f1f1f1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{r.type[0]}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{r.label}</div>
                          <div style={{ fontSize: 12, color: "#555" }}>{r.type}</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="header-icons">
          <span className="icon" title="Notifications">
            🔔
          </span>
          <span
            className="icon"
            title="Social"
            onClick={() => {
              setLoadingSocial(true);
              setShowSocial(true);
              setTimeout(() => setLoadingSocial(false), 600);
            }}
            style={{ cursor: "pointer", fontSize: "24px" }}
          >
            💬
          </span>
          <span className="icon" title="Home" onClick={() => handleMainClick("Home")} style={{ cursor: "pointer" }}>
            🏠
          </span>

          <span className="icon" title="Settings">
            ⚙
          </span>
        </div>
        <div className="profile-info" style={{ cursor: "pointer" }} onClick={() => setShowProfileModal(true)}>
          <span className="profile-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="profile-uid">{user?.roleIdValue}</span>
          <img src={getProfileImageUrl(user?.profilePicUrl)} alt="Profile" className="profile-pic" />
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
                                    <a href={`https://neuraliftx.onrender.com${unitUploadedFiles[unit.key]}`} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>
                                      View PDF
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
              <p>Loading...</p>
            </div>
          ) : showSocial ? (
            <Suspense fallback={<div className="loader-container"><div className="spinner"></div><p>Loading...</p></div>}>
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
    </div>
  );
}
