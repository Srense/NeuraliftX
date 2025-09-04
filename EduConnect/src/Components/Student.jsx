import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Student.css";
import logo from "../assets/Logo.png";
import HomeDashboard from "./HomeDashboard";
import AttendanceDashboard from "./AttendanceDashboard";
import QuizPerformanceChart from "./Studentquizperformancechart";
import CourseraCertifications from "./CourseraCertifications";
const getProfileImageUrl = (profilePicUrl) =>
  profilePicUrl ? `http://localhost:4000${profilePicUrl}` : "https://via.placeholder.com/40";

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
      const res = await fetch("http://localhost:4000/api/profile/picture", {
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
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "Uploading..." : "Upload Picture"}
        </button>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
}

export default function Student() {
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
  ];

  useEffect(() => {
    async function fetchUser() {
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await fetch("http://localhost:4000/api/profile", {
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

  // Fetch assignments when "Quiz/Assignments" menu is active
  useEffect(() => {
    if (activeMain === "Quiz/Assignments") {
      fetchAssignments();
    }
  }, [activeMain]);

  async function fetchAssignments() {
    try {
      const res = await fetch("http://localhost:4000/api/assignments", {
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
      if (window.location.pathname.startsWith("/student") && user.role !== "student") {
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

  // Generate Quiz button handler stub
  // function handleGenerateQuiz(assignmentId) {
  //   alert(`Generate quiz for assignment ID: ${assignmentId}`);
  //   // TODO: Implement actual quiz generation or navigation here
  // }

  let contentArea = null;
  if (activeMain === "Home") {
    contentArea = <HomeDashboard token={token} />;
  } else if (activeMain === "Academics" && activeSub === "academics-attendance") {
    contentArea = <AttendanceDashboard token={token} />;
  } else if (activeMain === "Quiz/Assignments") {
    contentArea = (
      <div className="assignments-container">
        {assignments.length === 0 && <p>No assignments available.</p>}
        <div className="assignment-cards">
          {assignments.map(({ _id, originalName, fileUrl }) => (
            <div key={_id} className="assignment-card">
              <a
                href={`http://localhost:4000${fileUrl}`}
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
}

  else {
    contentArea = <div>Select a menu item to view its content.</div>;
  }

  if (loadingUser) return <div className="loading">Loading user info...</div>;
  if (error) return <div className="error">{error}</div>;

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
        <div className="profile-info" style={{ cursor: "pointer" }} onClick={() => setShowProfileModal(true)}>
          <span className="profile-name">{user.firstName} {user.lastName}</span>
          <span className="profile-uid">{user.roleIdValue}</span>
          <img src={getProfileImageUrl(user.profilePicUrl)} alt="Profile" className="profile-pic" />
        </div>
      </header>

      <div className={`student-layout ${sidebarOpen ? "" : "closed"}`}>
        <nav className={`student-sidebar${sidebarOpen ? "" : " closed"}`}>
          <ul>
            {filteredMenu.map((main) => (
              <li key={main.label}>
                <button className={`main-link${activeMain === main.label ? " active" : ""}`} onClick={() => handleMainClick(main.label)}>
                  <span className="main-icon">{main.icon}</span> {main.label}
                </button>
                {activeMain === main.label && main.subLinks.length > 0 && (
                  <ul className="sub-links open">
                    {main.subLinks.map((sub) => (
                      <li key={sub.key}>
                        <button className={`sub-link${activeSub === sub.key ? " active" : ""}`} onClick={() => handleSubClick(sub.key)}>
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
    </div>
  );
}
