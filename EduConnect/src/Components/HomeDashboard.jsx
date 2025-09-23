import React, { useState, useEffect } from "react";
import "./HomeDashboard.css";

// Spinner style
const spinnerStyle = {
  display: "block",
  margin: "60px auto",
  width: 48,
  height: 48,
  border: "6px solid #b3c0e1",
  borderTop: "6px solid #2563eb",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

function SummaryCard({ icon, title, number, description }) {
  return (
    <div className="dashboard-summary-card">
      <div className="summary-icon-circle">{icon}</div>
      <div className="summary-card-content">
        <div className="summary-card-title">{title}</div>
        <div className="summary-card-number">{number}</div>
        <div className="summary-card-desc">{description}</div>
      </div>
    </div>
  );
}

export default function HomeDashboard() {
  const [weather, setWeather] = useState(null);
  const [courses, setCourses] = useState(null);
  const [announcements, setAnnouncements] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData(lat, lon) {
      const BACKEND_URL = "https://neuraliftx.onrender.com";
      const token = localStorage.getItem("token");
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
        const [weatherData, coursesData, announcementsData, mentorData] =
          await Promise.all([
            safeFetch(`${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`),
            safeFetch(`${BACKEND_URL}/api/courses`),
            safeFetch(`${BACKEND_URL}/api/announcements`),
            safeFetch(`${BACKEND_URL}/api/mentor`),
          ]);

        setWeather(weatherData);
        setCourses(coursesData);
        setAnnouncements(announcementsData);
        setMentor(mentorData);
        setError(null);
      } catch (err) {
        setError("Error loading (partial) dashboard data");
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
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <div>Loading dashboard...</div>
      </div>
    );

  if (error && !weather && !courses && !announcements && !mentor) {
    return <div className="error">{error}</div>;
  }

  // Dummy icons used as emoji, replace with SVG or icon component if needed
  const dummySummaryData = [
    {
      icon: "📚",
      title: "Total Courses",
      number: courses?.list?.length || 0,
      description: "+12% this month",
    },
    {
      icon: "✅",
      title: "Attendance Rate",
      number:
        courses && courses.list && courses.list.length > 0
          ? (
              courses.list.reduce(
                (sum, c) => sum + (c.attendancePercent || 0),
                0
              ) / courses.list.length
            ).toFixed(1) + "%"
          : "N/A",
      description: "Stable",
    },
    {
      icon: "📝",
      title: "Announcements",
      number: announcements ? announcements.length : 0,
      description: "Latest news",
    },
    {
      icon: "👤",
      title: "Mentors",
      number: mentor ? 1 : 0,
      description: mentor ? "Active" : "None assigned",
    },
    {
      icon: "⏳",
      title: "Pending Tasks",
      number: 3, // Dummy value, replace as per real data
      description: "Due soon",
    },
  ];

  return (
    <div className="dashboard-main-container">
      {/* Top row - Summary cards */}
      <div className="dashboard-summary-row">
        {dummySummaryData.map(({ icon, title, number, description }, i) => (
          <SummaryCard
            key={i}
            icon={icon}
            title={title}
            number={number}
            description={description}
          />
        ))}
      </div>

      {/* Bottom section - two column layout */}
      <div className="dashboard-bottom-section">
        {/* Left column */}
        <div className="dashboard-col-left">
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
          {courses && Array.isArray(courses.list) && courses.list.length > 0 ? (
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
            <div className="dashboard-card announcements">No announcements available.</div>
          )}
        </div>

        {/* Right column */}
        <div className="dashboard-col-right">
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
      </div>
    </div>
  );
}
