import React, { useState, useEffect } from "react";
import { BookOpen, GraduationCap, Award, Users } from "lucide-react";
import "./HomeDashboard.css";

// ✅ Actual components
import AttendanceDashboard from "./AttendanceDashboard";
import Grades from "./Grades";
import CourseraCertifications from "./CourseraCertifications";

// Dummy CoursesView (replace with your real one later if needed)
const CoursesView = ({ token }) => (
  <div className="component-placeholder">
    <h2>Courses</h2>
    <p>Detailed view of all your enrolled courses will be displayed here.</p>
  </div>
);

const spinnerStyle = {
  display: "block",
  margin: "60px auto",
  width: "48px",
  height: "48px",
  border: "6px solid #b3c0e1",
  borderTop: "6px solid #2563eb",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const MenuButton = ({ icon, title, description, isActive, onClick }) => (
  <div
    className={`menu-button ${isActive ? "active" : ""}`}
    onClick={onClick}
  >
    <div className="menu-icon">{icon}</div>
    <div className="menu-content">
      <h3 className="menu-title">{title}</h3>
      <p className="menu-description">{description}</p>
    </div>
  </div>
);

export default function EnhancedDashboard() {
  const [weather, setWeather] = useState(null);
  const [courses, setCourses] = useState(null);
  const [announcements, setAnnouncements] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  const token =
    localStorage.getItem("token") || localStorage.getItem("token_student");

  const menuItems = [
    {
      id: "courses",
      icon: <BookOpen size={24} />,
      title: "Courses",
      description: "View all enrolled courses and materials",
    },
    {
      id: "grades",
      icon: <GraduationCap size={24} />,
      title: "Grades",
      description: "Check your academic performance",
    },
    {
      id: "certifications",
      icon: <Award size={24} />,
      title: "Certifications",
      description: "View your achievements and certificates",
    },
    {
      id: "attendance",
      icon: <Users size={24} />,
      title: "Attendance",
      description: "Track your attendance records",
    },
  ];

  useEffect(() => {
    async function fetchData(lat, lon) {
      const BACKEND_URL = "https://neuraliftx.onrender.com";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      async function safeFetch(url) {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      }

      try {
        setLoading(true);
        const weatherData = await safeFetch(
          `${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`
        );
        const coursesData = await safeFetch(`${BACKEND_URL}/api/courses`);
        const announcementsData = await safeFetch(
          `${BACKEND_URL}/api/announcements`
        );
        const mentorData = await safeFetch(`${BACKEND_URL}/api/mentor`);

        setWeather(weatherData);
        setCourses(coursesData);
        setAnnouncements(announcementsData);
        setMentor(mentorData);
      } catch (err) {
        setError("Error loading dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchData(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError("Unable to retrieve your location");
        setLoading(false);
      }
    );
  }, [token]);

  const handleMenuClick = (viewId) => {
    setActiveView(viewId);
  };

  const handleBackToDashboard = () => {
    setActiveView("dashboard");
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <div style={spinnerStyle} />
        <style>
          {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
        </style>
        <div>Loading dashboard...</div>
      </div>
    );

  if (error && !weather && !courses && !announcements && !mentor)
    return <div className="error">{error}</div>;

  // ✅ If user is inside a sub-view (Attendance/Grades/etc.)
  if (activeView !== "dashboard") {
    let ComponentToRender;

    switch (activeView) {
      case "attendance":
        ComponentToRender = AttendanceDashboard;
        break;
      case "grades":
        ComponentToRender = Grades;
        break;
      case "certifications":
        ComponentToRender = CourseraCertifications;
        break;
      case "courses":
        ComponentToRender = CoursesView;
        break;
      default:
        ComponentToRender = () => <div>View not found</div>;
    }

    return (
      <div className="dashboard-container">
        <div className="navigation-menu">
          <h2 className="menu-header">Quick Access</h2>
          <div className="menu-grid">
            {menuItems.map((item) => (
              <MenuButton
                key={item.id}
                icon={item.icon}
                title={item.title}
                description={item.description}
                isActive={activeView === item.id}
                onClick={() => handleMenuClick(item.id)}
              />
            ))}
          </div>
        </div>

        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>

        <ComponentToRender token={token || ""} />
      </div>
    );
  }

  // ✅ Default Dashboard (Home)
  return (
    <div className="dashboard-container">
      {/* Navigation Menu */}
      <div className="navigation-menu">
        <h2 className="menu-header">Quick Access</h2>
        <div className="menu-grid">
          {menuItems.map((item) => (
            <MenuButton
              key={item.id}
              icon={item.icon}
              title={item.title}
              description={item.description}
              isActive={activeView === item.id}
              onClick={() => handleMenuClick(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Weather Card */}
      {weather ? (
        <div className="dashboard-weather">
          <div className="weather-title">XYZ SCHOOL WEATHER</div>
          <div className="weather-main">
            <span className="weather-temp">{weather.temperature}°C</span>
            <span className="weather-desc">{weather.description}</span>
          </div>
        </div>
      ) : (
        <div className="dashboard-weather">Weather info not available.</div>
      )}

      {/* Course & Attendance Card */}
      {courses && courses.list && courses.list.length > 0 ? (
        <div className="dashboard-card my-course">
          <h3>My Course & Attendance</h3>
          <b>{courses.studentName}</b>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {courses.list.map((course) => (
                  <tr key={course._id || course.id}>
                    <td>{course.subject}</td>
                    <td>{course.classCount}</td>
                    <td>{course.attendancePercent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="dashboard-card my-course">No courses available.</div>
      )}

      {/* Announcements Card */}
      {announcements && announcements.length > 0 ? (
        <div className="dashboard-card announcements">
          <h3>Announcements (ALL)</h3>
          {announcements.map((ann) => (
            <div key={ann._id || ann.id} className="announcement-item">
              <div>
                <span className="pin">📌</span>
                <b>{ann.title}</b>
              </div>
              <div>
                <span className="cal">📅 {ann.date}</span>{" "}
                <span>🕒 {ann.time}</span>
              </div>
              <div>
                <b>Ref. No:</b> {ann.refNumber}
                <br />
                <span>{ann.details}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-card announcements">
          No announcements available.
        </div>
      )}

      {/* Mentor Details */}
      {mentor ? (
        <div className="dashboard-card mentor">
          <h3>👤 Mentor Details</h3>
          <div>
            <b>Mentor Name:</b> {mentor.name} ({mentor._id || mentor.id})
            <br />
            <b>Email Id:</b> {mentor.email}
          </div>
        </div>
      ) : (
        <div className="dashboard-card mentor">No mentor assigned.</div>
      )}
    </div>
  );
}
