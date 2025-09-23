import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeDashboard.css";

// Spinner style
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

export default function HomeDashboard() {
  const [weather, setWeather] = useState(null);
  const [courses, setCourses] = useState(null);
  const [grades, setGrades] = useState(null);
  const [certifications, setCertifications] = useState(null);
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const BACKEND_URL = "https://neuraliftx.onrender.com";
  const token = localStorage.getItem("token_student");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    async function safeFetch(url) {
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    async function fetchData(lat, lon) {
      try {
        setLoading(true);
        setError(null);

        // Fetch weather based on location
        const weatherData = lat && lon
          ? await safeFetch(`${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`)
          : null;

        // Parallel fetch remaining data
        const [coursesData, gradesData, certificationsData, alumniData] = await Promise.all([
          safeFetch(`${BACKEND_URL}/api/courses`),
          safeFetch(`${BACKEND_URL}/api/grades`),
          safeFetch(`${BACKEND_URL}/api/certifications`),
          safeFetch(`${BACKEND_URL}/api/alumni`),
        ]);

        setWeather(weatherData);
        setCourses(coursesData);
        setGrades(gradesData);
        setCertifications(certificationsData);
        setAlumni(alumniData);
      } catch (e) {
        setError("Error loading dashboard data");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      fetchData(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchData(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError("Unable to retrieve your location");
        setLoading(false);
        fetchData(null, null);
      }
    );
  }, [BACKEND_URL, headers]);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <div>Loading dashboard...</div>
      </div>
    );

  if (error && !weather && !courses && !grades && !certifications && !alumni)
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

      {/* Courses Card */}
      <div className="dashboard-card">
        <h3>My Courses</h3>
        {courses && courses.list && courses.list.length > 0 ? (
          <ul>
            {courses.list.map((course) => (
              <li
                key={course._id || course.id}
                onClick={() => navigate(`/courses/${course._id || course.id}`)}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                {course.subject} - Class: {course.classCount} - Attendance: {course.attendancePercent}%
              </li>
            ))}
          </ul>
        ) : (
          <p>No courses available.</p>
        )}
      </div>

      {/* Grades Card */}
      <div className="dashboard-card">
        <h3>Grades</h3>
        {grades && grades.list && grades.list.length > 0 ? (
          <ul>
            {grades.list.map((grade) => (
              <li
                key={grade._id || grade.id}
                onClick={() => navigate(`/grades/${grade._id || grade.id}`)}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                {grade.subject}: {grade.grade}
              </li>
            ))}
          </ul>
        ) : (
          <p>No grades available.</p>
        )}
      </div>

      {/* Certifications Card */}
      <div className="dashboard-card">
        <h3>Certifications</h3>
        {certifications && certifications.list && certifications.list.length > 0 ? (
          <ul>
            {certifications.list.map((cert) => (
              <li
                key={cert._id || cert.id}
                onClick={() => navigate(`/certifications/${cert._id || cert.id}`)}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                {cert.title} - Issued by {cert.issuer}
              </li>
            ))}
          </ul>
        ) : (
          <p>No certifications available.</p>
        )}
      </div>

      {/* Alumni Arena Card */}
      <div className="dashboard-card">
        <h3>Alumni Arena</h3>
        {alumni && alumni.list && alumni.list.length > 0 ? (
          <ul>
            {alumni.list.map((alum) => (
              <li
                key={alum._id || alum.id}
                onClick={() => navigate(`/alumni/${alum._id || alum.id}`)}
                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              >
                {alum.name} - {alum.currentRole}
              </li>
            ))}
          </ul>
        ) : (
          <p>No alumni data available.</p>
        )}
      </div>

    </div>
  );
}
