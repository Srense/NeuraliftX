import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import './Admin.css';
import ThemeContext from "../ThemeContext";  // Adjust path as per your structure
import ThemeSelector from "../ThemeSelector"; // Adjust path

const Admin = () => {
  const token = localStorage.getItem("token_admin");
  const navigate = useNavigate();

  const { theme, setThemeName, allThemes } = useContext(ThemeContext);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMain, setActiveMain] = useState("Dashboard");
  const [activeSub, setActiveSub] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMenu, setFilteredMenu] = useState([]);

  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementError, setAnnouncementError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    refNumber: "",
    contentType: "text",
    message: "",
    surveyQuestions: [],
    visibleTo: { students: false, faculty: false, alumni: false },
  });

  const menu = [
    { label: "Dashboard", icon: "🏠", subLinks: [] },
    {
      label: "Announcements",
      icon: "📢",
      subLinks: [
        { label: "Manage Announcements", key: "manage-announcements" },
      ],
    },
    // Add more menu items here as needed
  ];

  useEffect(() => {
    async function fetchProfile() {
      if (!token) {
        setError("Admin token missing. Please login.");
        setLoadingUser(false);
        return;
      }
      try {
        const res = await fetch("https://yourdomain.com/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setUser(data.user);
      } catch (e) {
        setError("Failed to load profile.");
      } finally {
        setLoadingUser(false);
      }
    }
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (activeMain === "Announcements") {
      fetchAnnouncements();
    }
  }, [activeMain]);

  async function fetchAnnouncements() {
    if (!token) return;
    setLoadingAnnouncements(true);
    setAnnouncementError(null);
    try {
      const res = await fetch("https://yourdomain.com/api/admin/announcements", {
          headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load announcements");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Unexpected response");
      setAnnouncements(data);
    } catch (e) {
      setAnnouncementError(e.message);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  }

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("visibleTo.")) {
      const key = name.split(".")[1];
      setFormData(fd => ({
        ...fd,
        visibleTo: { ...fd.visibleTo, [key]: checked }
      }));
    } else {
      setFormData(fd => ({
        ...fd,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  }

  const addSurveyQuestion = () => {
    setFormData(fd => ({
      ...fd,
      surveyQuestions: [...fd.surveyQuestions, { question: "", inputType: "text", options: [] }]
    }));
  }

  const updateSurveyQuestion = (index, key, value) => {
    setFormData(fd => {
      const updatedQuestions = [...fd.surveyQuestions];
      updatedQuestions[index] = { ...updatedQuestions[index], [key]: value };
      return { ...fd, surveyQuestions: updatedQuestions };
    });
  }

  const removeSurveyQuestion = index => {
    setFormData(fd => {
      const updatedQuestions = [...fd.surveyQuestions];
      updatedQuestions.splice(index, 1);
      return { ...fd, surveyQuestions: updatedQuestions };
    });
  }

  const handleSubmitAnnouncement = async () => {
    if (!formData.title.trim() || 
        (formData.contentType === "text" && !formData.message.trim())) {
      alert("Please enter a title and message.");
      return;
    }
    if (!formData.visibleTo.students && !formData.visibleTo.faculty && !formData.visibleTo.alumni) {
      alert("Select at least one audience.");
      return;
    }
    try {
      const res = await fetch("https://yourdomain.com/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create announcement");
      }
      alert("Announcement created successfully.");
      setFormData({
        title: "",
        date: "",
        time: "",
        refNumber: "",
        contentType: "text",
        message: "",
        surveyQuestions: [],
        visibleTo: { students: false, faculty: false, alumni: false },
      });
      fetchAnnouncements();
    } catch (e) {
      alert(e.message);
    }
  }

  const handleDeleteAnnouncement = async id => {
    if (!window.confirm("Confirm delete announcement?")) return;
    try {
      const res = await fetch(`https://yourdomain.com/api/admin/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      alert("Deleted successfully");
      fetchAnnouncements();
    } catch (e) {
      alert(e.message);
    }
  }

  const toggleSidebar = () => setSidebarOpen(v => !v);

  const handleMainClick = label => {
    setActiveMain(label);
    const menuItem = menu.find(m => m.label === label);
    setActiveSub(menuItem && menuItem.subLinks.length > 0 ? menuItem.subLinks[0].key : null);
  }

  const handleSubClick = key => setActiveSub(key);

  const handleLogout = () => {
    localStorage.removeItem("token_admin");
    window.location.href = "/login";
  }

  // Filter menu
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMenu(menu);
      return;
    }
    const filtered = menu
      .map(m => {
        const filteredSubs = m.subLinks.filter(s => s.label.toLowerCase().includes(searchTerm.toLowerCase()));
        if (m.label.toLowerCase().includes(searchTerm.toLowerCase()) || filteredSubs.length > 0) {
          return { ...m, subLinks: filteredSubs };
        }
        return null;
      })
      .filter(Boolean);
    setFilteredMenu(filtered);
  }, [searchTerm]);

  // Content area rendering
  let contentArea = null;
  if (activeMain === "Dashboard") {
    contentArea = <h2>Welcome, {user ? user.firstName : 'Admin'}</h2>;
  } else if (activeMain === "Announcements" && activeSub === "manage-announcements") {
    contentArea = (
      <div>
        <h3>Create Announcement</h3>
        <input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleInputChange}
          className="input"
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          className="input"
        />
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleInputChange}
          className="input"
        />
        <input
          name="refNumber"
          placeholder="Reference Number"
          value={formData.refNumber}
          onChange={handleInputChange}
          className="input"
        />
        <div>
          <label>
            Content Type:
            <select
              name="contentType"
              value={formData.contentType}
              onChange={handleInputChange}
              className="input"
            >
              <option value="text">Text</option>
              <option value="survey">Survey</option>
            </select>
          </label>
        </div>
        {formData.contentType === "text" ? (
          <textarea
            name="message"
            placeholder="Message"
            value={formData.message}
            onChange={handleInputChange}
            className="input"
          />
        ) : (
          <div>
            <button onClick={addSurveyQuestion} className="action-btn" style={{ marginBottom: "1rem" }}>Add Survey Question</button>
            {formData.surveyQuestions.map((q, i) => (
              <div key={i} className="survey-question">
                <input
                  placeholder="Question"
                  value={q.question}
                  onChange={e => updateSurveyQuestion(i, "question", e.target.value)}
                  className="input"
                />
                <select
                  value={q.inputType}
                  onChange={e => updateSurveyQuestion(i, "inputType", e.target.value)}
                  className="input"
                >
                  <option value="text">Text</option>
                  <option value="radio">Single Choice</option>
                  <option value="checkbox">Multiple Choice</option>
                  <option value="select">Dropdown</option>
                </select>
                {(q.inputType === "radio" || q.inputType === "checkbox" || q.inputType === "select") && (
                  <input
                    placeholder="Options (comma separated)"
                    value={q.options.join(",")}
                    onChange={e => updateSurveyQuestion(i, "options", e.target.value.split(",").map(o => o.trim()))}
                    className="input"
                  />
                )}
                <button onClick={() => removeSurveyQuestion(i)} className="action-btn" style={{ marginTop: "0.5rem" }}>Remove Question</button>
              </div>
            ))}
          </div>
        )}
        <div>
          <label><input type="checkbox" name="visibleTo.students" checked={formData.visibleTo.students} onChange={handleInputChange} /> Students</label>
          <label style={{ marginLeft: "1rem" }}><input type="checkbox" name="visibleTo.faculty" checked={formData.visibleTo.faculty} onChange={handleInputChange} /> Faculty</label>
          <label style={{ marginLeft: "1rem" }}><input type="checkbox" name="visibleTo.alumni" checked={formData.visibleTo.alumni} onChange={handleInputChange} /> Alumni</label>
        </div>
        <button onClick={handleSubmitAnnouncement} className="action-btn" style={{ marginTop: "1rem" }}>Create Announcement</button>

        <h3 style={{ marginTop: "2rem" }}>Existing Announcements</h3>
        {loadingAnnouncements && <p>Loading announcements...</p>}
        {announcementError && <p style={{ color: "red" }}>{announcementError}</p>}
        {!loadingAnnouncements && announcements.length === 0 && <p>No announcements found</p>}
        {announcements.length > 0 && (
          <ul>
            {announcements.map(a => (
              <li key={a._id} style={{ marginBottom: "0.5rem" }}>
                <b>{a.title}</b> ({a.contentType}) - Visible to:
                {a.visibleTo.students && " Students"}
                {a.visibleTo.faculty && " Faculty"}
                {a.visibleTo.alumni && " Alumni"}
                <button onClick={() => handleDeleteAnnouncement(a._id)} className="action-btn" style={{ marginLeft: "1rem" }}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } else {
    contentArea = <div>Please select an option from the menu.</div>;
  }

  if (loadingUser) return <div>Loading user profile...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className={`admin-root ${sidebarOpen ? "" : "closed"}`}>
      <header className="admin-header">
        <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="header-brand">
          <img src={logo} alt="Logo" className="header-logo"/>
          <span className="header-title">Admin Panel</span>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search & Bookmark your page"
            aria-label="Search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">&#128269;</span>
        </div>

        <div className="profile-info" onClick={handleLogout} title="Logout" style={{ cursor: "pointer" }}>
          <span>{user ? `Hi, ${user.firstName}` : "Logout"}</span>
        </div>
      </header>

      <div className={`admin-layout ${sidebarOpen ? "" : "closed"}`}>
        <nav className={`admin-sidebar ${sidebarOpen ? "" : "closed"}`}>
          <ul>
            {filteredMenu.map(item => (
              <li key={item.label}>
                <button onClick={() => handleMainClick(item.label)} className={`main-link ${activeMain === item.label ? "active" : ""}`}>
                  <span className="icon">{item.icon}</span> {item.label}
                </button>
                {activeMain === item.label && item.subLinks.length > 0 && (
                  <ul className="sub-links open">
                    {item.subLinks.map(sub => (
                      <li key={sub.key}>
                        <button onClick={() => handleSubClick(sub.key)} className={`sub-link ${activeSub === sub.key ? "active" : ""}`}>{sub.label}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main className="admin-content">
          {contentArea}
        </main>
      </div>
    </div>
  );
};

export default Admin;
