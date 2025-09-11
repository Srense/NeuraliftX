import React, { useState, useEffect } from "react";
import logo from "../assets/Logo.png";
import './Admin.css';

const themes = [
  { key: "default", label: "Default" },
  { key: "dark", label: "Dark Mode" },
  { key: "blue", label: "Blue Theme" },
];

const Admin = () => {
  const token = localStorage.getItem("token_admin");
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

  // Theme state - load from localStorage or default to "default"
  const [theme, setTheme] = useState(() => localStorage.getItem("admin_theme") || "default");

  useEffect(() => {
    async function fetchUserProfile() {
      if (!token) {
        setError("Admin token missing. Please login.");
        setLoadingUser(false);
        return;
      }
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load admin profile");
        const data = await res.json();
        setUser(data.user);
      } catch (e) {
        setError("Failed to load user profile.");
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUserProfile();
  }, [token]);

  useEffect(() => {
    if (activeMain === "Announcements") fetchAnnouncements();
  }, [activeMain]);

  async function fetchAnnouncements() {
    if (!token) return;
    setLoadingAnnouncements(true);
    setAnnouncementError(null);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/admin/announcements", {
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

  // Apply theme as class on body element whenever theme changes
  useEffect(() => {
    document.body.classList.remove(...themes.map(t => t.key));
    document.body.classList.add(theme);
    localStorage.setItem("admin_theme", theme);
  }, [theme]);

  const menu = [
    { label: "Dashboard", icon: "🏠", subLinks: [] },
    {
      label: "Announcements",
      icon: "📢",
      subLinks: [{ label: "Manage Announcements", key: "manage-announcements" }],
    },
    // Add other admin panels as needed
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("visibleTo.")) {
      const key = name.split(".")[1];
      setFormData((fd) => ({
        ...fd,
        visibleTo: { ...fd.visibleTo, [key]: checked },
      }));
    } else {
      setFormData((fd) => ({
        ...fd,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const addSurveyQuestion = () =>
    setFormData((fd) => ({
      ...fd,
      surveyQuestions: [...fd.surveyQuestions, { question: "", inputType: "text", options: [] }],
    }));

  const updateSurveyQuestion = (i, key, value) => {
    setFormData((fd) => {
      const sq = [...fd.surveyQuestions];
      sq[i][key] = value;
      return { ...fd, surveyQuestions: sq };
    });
  };

  const removeSurveyQuestion = (i) => {
    setFormData((fd) => {
      const sq = [...fd.surveyQuestions];
      sq.splice(i, 1);
      return { ...fd, surveyQuestions: sq };
    });
  };

  const handleSubmitAnnouncement = async () => {
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      alert("Announcement created");
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
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`https://neuraliftx.onrender.com/api/admin/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      fetchAnnouncements();
    } catch (err) {
      alert(err.message);
    }
  };

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
    localStorage.removeItem("token_admin");
    window.location.href = "/login";
  };

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
        if (item.label.toLowerCase().includes(lowerSearch) || filteredSubs.length > 0) {
          return { ...item, subLinks: filteredSubs };
        }
        return null;
      })
      .filter(Boolean);
    setFilteredMenu(filtered);
  }, [searchTerm, menu]);

  let contentArea = null;
  if (activeMain === "Dashboard") {
    contentArea = <h2>Welcome, Admin {user?.firstName || ""}</h2>;
  } else if (activeMain === "Announcements" && activeSub === "manage-announcements") {
    contentArea = (
      <div>
        <h3>Create Announcement</h3>
        <input name="title" placeholder="Title" value={formData.title} onChange={handleInputChange} />
        <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
        <input type="time" name="time" value={formData.time} onChange={handleInputChange} />
        <input name="refNumber" placeholder="Reference Number" value={formData.refNumber} onChange={handleInputChange} />
        <div>
          <label>
            Content Type:
            <select name="contentType" value={formData.contentType} onChange={handleInputChange}>
              <option value="text">Text</option>
              <option value="survey">Survey</option>
            </select>
          </label>
        </div>
        {formData.contentType === "text" ? (
          <textarea name="message" placeholder="Message" value={formData.message} onChange={handleInputChange} />
        ) : (
          <div>
            <button onClick={addSurveyQuestion}>Add Survey Question</button>
            {formData.surveyQuestions.map((q, i) => (
              <div key={i}>
                <input
                  placeholder="Question"
                  value={q.question}
                  onChange={(e) => updateSurveyQuestion(i, "question", e.target.value)}
                />
                <select
                  value={q.inputType}
                  onChange={(e) => updateSurveyQuestion(i, "inputType", e.target.value)}
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
                    onChange={(e) =>
                      updateSurveyQuestion(i, "options", e.target.value.split(",").map((o) => o.trim()))
                    }
                  />
                )}
                <button onClick={() => removeSurveyQuestion(i)}>Remove</button>
              </div>
            ))}
          </div>
        )}
        <div>
          <label>
            <input
              type="checkbox"
              name="visibleTo.students"
              checked={formData.visibleTo.students}
              onChange={handleInputChange}
            />
            Students
          </label>
          <label>
            <input
              type="checkbox"
              name="visibleTo.faculty"
              checked={formData.visibleTo.faculty}
              onChange={handleInputChange}
            />
            Faculty
          </label>
          <label>
            <input
              type="checkbox"
              name="visibleTo.alumni"
              checked={formData.visibleTo.alumni}
              onChange={handleInputChange}
            />
            Alumni
          </label>
        </div>
        <button onClick={handleSubmitAnnouncement}>Create</button>
        <h3 style={{ marginTop: "2rem" }}>Existing Announcements</h3>
        {loadingAnnouncements ? (
          <p>Loading announcements...</p>
        ) : announcementError ? (
          <p style={{ color: "red" }}>{announcementError}</p>
        ) : announcements.length === 0 ? (
          <p>No announcements found.</p>
        ) : (
          <ul>
            {announcements.map((a) => (
              <li key={a._id}>
                <b>{a.title}</b> ({a.contentType}) — Visible to:
                {a.visibleTo?.students && " Students"}
                {a.visibleTo?.faculty && " Faculty"}
                {a.visibleTo?.alumni && " Alumni"}
                <button onClick={() => handleDeleteAnnouncement(a._id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } else {
    contentArea = <div>Select a menu item to view its content.</div>;
  }

  return (
    <div className={`admin-root ${sidebarOpen ? "" : "closed"}`}>
      <header className="admin-header">
        <button className="hamburger" aria-label="Toggle menu" onClick={toggleSidebar}>
          <span />
          <span />
          <span />
        </button>
        <div className="header-brand">
          <img src={logo} alt="Logo" className="header-logo" />
          <span className="header-title">Admin Panel</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search & Bookmark your page"
            aria-label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* Theme Selector */}
        <div style={{ marginLeft: "1rem" }}>
          <label htmlFor="themeSelect" style={{ color: "white", marginRight: "0.5rem" }}>Select Theme:</label>
          <select
            id="themeSelect"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ padding: "0.2rem 0.5rem" }}
          >
            {themes.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="header-icons"></div>
        <div
          className="profile-info"
          style={{ cursor: "pointer" }}
          onClick={handleLogout}
          title="Logout"
        >
          <span className="profile-name">{user?.firstName} {user?.lastName}</span>
        </div>
      </header>
      <div className={`admin-layout ${sidebarOpen ? "" : "closed"}`}>
        <nav className={`admin-sidebar${sidebarOpen ? "" : " closed"}`}>
          <ul>
            {filteredMenu.length === 0 ? menu.map((main) => (
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
            )) : filteredMenu.map((main) => (
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
          </ul>
        </nav>
        <main className="admin-content">{contentArea}</main>
      </div>
    </div>
  );
};

export default Admin;
