import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import "./Student.css";
import logo from "../assets/Logo.png";

export default function Faculty() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token_faculty");

  // User and loading states (simplified)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sidebar and navigation state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMain, setActiveMain] = useState("Home");
  const [activeSub, setActiveSub] = useState(null);

  // Syllabus expansion and selection states
  const [expandedSyllabusSubject, setExpandedSyllabusSubject] = useState(null); // Which subject is expanded
  const [selectedSyllabusUnit, setSelectedSyllabusUnit] = useState(null); // Selected unit to load content/files

  // Dummy syllabus data; replace/fetch as needed
  const syllabusMenu = {
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
  };

  // Full menu with syllabus integrated (add your other menus as needed)
  const menu = [
    { label: "Home", icon: "🏠" },
    // ... other menu items
    syllabusMenu,
  ];

  // Handle click on subject to expand/collapse and set first unit selected
  const handleSubjectClick = (subject) => {
    if (expandedSyllabusSubject === subject.key) {
      // Collapse if already expanded
      setExpandedSyllabusSubject(null);
      setSelectedSyllabusUnit(null);
      setActiveSub(null);
    } else {
      setExpandedSyllabusSubject(subject.key);
      // Select first unit if exists
      if (subject.subLinks && subject.subLinks.length > 0) {
        setSelectedSyllabusUnit(subject.subLinks[0]);
        setActiveSub(subject.subLinks[0].key);
      } else {
        setSelectedSyllabusUnit(null);
        setActiveSub(null);
      }
    }
    setActiveMain("Syllabus");
  };

  // Handle clicking a syllabus unit
  const handleUnitClick = (unit) => {
    setSelectedSyllabusUnit(unit);
    setActiveSub(unit.key);
    setActiveMain("Syllabus");
  };

  // Basic user fetching logic (simplified, should have better error handling in your code)
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    async function fetchUser() {
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data.user);
        setLoading(false);
      } catch {
        setLoading(false);
        navigate("/login");
      }
    }
    fetchUser();
  }, [token, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="student-root">
      <header className="student-header">
        <button className="hamburger" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(v => !v)}>
          <span />
          <span />
          <span />
        </button>
        <div className="header-brand">
          <img src={logo} alt="Logo" className="logo" />
          <span className="header-title">EduConnect - Faculty</span>
        </div>

        <div className="profile-info" onClick={() => {}}>
          <span className="profile-name">{user.firstName} {user.lastName}</span>
          <span className="profile-uid">{user.roleIdValue}</span>
          <img
            src={user.profilePicUrl ? `https://neuraliftx.onrender.com${user.profilePicUrl}` : "https://via.placeholder.com/40"}
            alt="Profile"
            className="profile-pic"
          />
        </div>
      </header>

      <div className={`student-layout ${sidebarOpen ? "" : "closed"}`}>
        <nav className={`student-sidebar${sidebarOpen ? "" : " closed"}`}>
          <ul>
            {menu.map((item) => (
              <li key={item.label}>
                <button
                  className={activeMain === item.label ? "active main-link" : "main-link"}
                  onClick={() => setActiveMain(item.label)}
                >
                  <span className="main-icon">{item.icon}</span> {item.label}
                </button>

                {activeMain === item.label && item.subLinks && (
                  <ul className="sub-links open">
                    {item.subLinks.map((sub) => {
                      const isSyllabus = item.label === "Syllabus";
                      const hasUnits = isSyllabus && sub.subLinks?.length > 0;
                      return (
                        <li key={sub.key}>
                          <button
                            className={`sub-link${activeSub === sub.key ? " active" : ""}`}
                            onClick={() => {
                              if (hasUnits) {
                                handleSubjectClick(sub);
                              } else if (isSyllabus) {
                                handleUnitClick(sub);
                              } else {
                                setActiveSub(sub.key);
                                // other menu logic here
                              }
                            }}
                          >
                            {sub.label}
                          </button>

                          {/* Render units list only if subject is expanded */}
                          {hasUnits && expandedSyllabusSubject === sub.key && (
                            <ul className="sub-links nested-unit-list">
                              {sub.subLinks.map((unit) => (
                                <li key={unit.key}>
                                  <button
                                    className={`sub-link${selectedSyllabusUnit?.key === unit.key ? " active" : ""}`}
                                    onClick={() => handleUnitClick(unit)}
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

        <main className="student-content">
          {activeMain === "Syllabus" && selectedSyllabusUnit ? (
            <>
              <h2>Syllabus - {selectedSyllabusUnit.label}</h2>
              {/* Here you can load/display syllabus files or content */}
              <p>Display or upload files for: <strong>{selectedSyllabusUnit.label}</strong></p>
            </>
          ) : (
            <h2>{activeMain} content here</h2>
          )}
        </main>
      </div>
    </div>
  );
}
