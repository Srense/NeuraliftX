import React, { useState, useEffect } from "react";
import "./HomeDashboard.css";

const spinnerStyle = {
  display: "block",
  margin: "60px auto",
  width: "48px",
  height: "48px",
  border: "6px solid #b3c0e1",
  borderTop: "6px solid #2563eb",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
};

export default function HomeDashboard() {
  const [weather, setWeather] = useState(null);
  const [courses, setCourses] = useState(null);
  const [grades, setGrades] = useState(null);
  const [certifications, setCertifications] = useState(null);
  const [alumniArena, setAlumniArena] = useState(null);
  const [announcements, setAnnouncements] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData(lat, lon) {
      const BACKEND_URL = "https://neuraliftx.onrender.com";
      const tokenStudent = localStorage.getItem("token_student");
      const token = tokenStudent ? tokenStudent : localStorage.getItem("token");
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

        // Parallel fetching
        const [
          weatherData,
          coursesData,
          gradesData,
          certificationsData,
          alumniArenaData,
          announcementsData,
          mentorData,
        ] = await Promise.all([
          safeFetch(`${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`),
          safeFetch(`${BACKEND_URL}/api/courses`),
          safeFetch(`${BACKEND_URL}/api/grades`),
          safeFetch(`${BACKEND_URL}/api/certifications`),
          safeFetch(`${BACKEND_URL}/api/alumni-arena`),
          safeFetch(`${BACKEND_URL}/api/announcements`),
          safeFetch(`${BACKEND_URL}/api/mentor`),
        ]);

        setWeather(weatherData);
        setCourses(coursesData);
        setGrades(gradesData);
        setCertifications(certificationsData);
        setAlumniArena(alumniArenaData);
        setAnnouncements(announcementsData);
        setMentor(mentorData);
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
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <div>Loading dashboard...</div>
      </div>
    );

  if (error && !weather && !courses && !grades && !certifications && !alumniArena && !announcements && !mentor)
    return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
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

      {/* Grades Card */}
      {grades && grades.list && grades.list.length > 0 ? (
        <div className="dashboard-card grades">
          <h3>Grades</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {grades.list.map((grade) => (
                  <tr key={grade._id || grade.id}>
                    <td>{grade.subject}</td>
                    <td>{grade.score}</td>
                    <td>{grade.letterGrade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="dashboard-card grades">No grades available.</div>
      )}

      {/* Certifications Card */}
      {certifications && certifications.list && certifications.list.length > 0 ? (
        <div className="dashboard-card certifications">
          <h3>Certifications</h3>
          <ul>
            {certifications.list.map((cert) => (
              <li key={cert._id || cert.id}>
                <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                  {cert.name} - {cert.provider}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="dashboard-card certifications">No certifications available.</div>
      )}

      {/* Alumni Arena Card */}
      {alumniArena && alumniArena.list && alumniArena.list.length > 0 ? (
        <div className="dashboard-card alumni-arena">
          <h3>Alumni Arena</h3>
          <ul>
            {alumniArena.list.map((alumni) => (
              <li key={alumni._id || alumni.id}>
                <b>{alumni.name}</b> - {alumni.currentRole} - {alumni.company}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="dashboard-card alumni-arena">No alumni data available.</div>
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
