import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PdfViewer from "./PDFViewer"; // If you want to preview PDFs inline
import "./Student.css";
import logo from "../assets/Logo.png";

function CreateAssignmentModal({ token, onClose, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const res = await fetch("http://localhost:4000/api/assignments", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onUpload(data.assignment);
      alert("Assignment uploaded successfully!");
      onClose();
    } catch {
      alert("Failed to upload assignment");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        <h2>Create Assignment (PDF)</h2>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading} className="action-btn">
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>
    </div>
  );
}

function ProfileModal({ user, token, onClose, onLogout, onUpdateProfilePic }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user.profilePicUrl ? `http://localhost:4000${user.profilePicUrl}` : "");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
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
      alert("Profile picture updated");
      setSelectedFile(null);
      setPreviewUrl(`http://localhost:4000${data.profilePicUrl}`);
    } catch {
      alert("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close profile modal" onClick={onClose} className="close-btn">
          &times;
        </button>
        <h2>My Profile</h2>
        <img
          src={previewUrl || "https://via.placeholder.com/120"}
          alt="Profile"
          className="profile-large-pic"
        />
        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>UID:</strong> {user.roleIdValue}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading} className="action-btn">
          {uploading ? "Uploading..." : "Upload Picture"}
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
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMain, setActiveMain] = useState("Home");
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
      if (!token) return navigate("/login");
      try {
        const res = await fetch("http://localhost:4000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data.user);
      } catch {
        setError("Error fetching profile");
        localStorage.removeItem("token_faculty");
        navigate("/login");
      } finally {
        setLoadingUser(false);
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
    if (activeMain === "Assignments Submission") {
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
      const res = await fetch(`http://localhost:4000/api/assignments/${id}`, {
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

  const handleUpdateProfilePic = (url) => {
    setUser((prev) => ({ ...prev, profilePicUrl: url }));
    setShowProfileModal(false);
  };

  if (loadingUser) return <div>Loading...</div>;
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
          <img src={logo} alt="EduConnect Faculty" className="header-logo" />
          <span className="header-title">EduConnect Faculty</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search menu"
            aria-label="Search menu"
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
          <span className="profile-name">{user?.firstName} {user?.lastName}</span>
          <span className="profile-uid">{user?.roleIdValue}</span>
          <img
            src={user?.profilePicUrl ? `http://localhost:4000${user.profilePicUrl}` : "https://via.placeholder.com/40"}
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
                  className={`main-link${activeMain === item.label ? " active" : ""}`}
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
            <div>
              <h2>Uploaded Assignments</h2>
              {assignments.length === 0 && <p>No assignments uploaded.</p>}
              <ul>
                {assignments.map(({ _id, originalName, fileUrl }) => (
                  <li key={_id} style={{ marginBottom: 12 }}>
                    <a
                      href={`http://localhost:4000${fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ marginRight: "1rem", fontWeight: 500 }}
                    >
                      {originalName}
                    </a>
                    <button
                      onClick={() => handleDeleteAssignment(_id)}
                      style={{
                        color: "#ef4444",
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <h2>{activeMain} content here</h2>
          )}
        </main>
      </div>

      {showCreateAssignment && (
        <CreateAssignmentModal
          token={token}
          onClose={() => setShowCreateAssignment(false)}
          onUpload={handleUploadSuccess}
        />
      )}

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
