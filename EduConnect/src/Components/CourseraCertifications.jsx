import React, { useEffect, useState } from "react";
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

const CourseraCertifications = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("http://localhost:4000/api/coursera-courses");
        if (!res.ok) throw new Error("Failed to load Coursera courses");
        const data = await res.json();
        setCourses(data.courses);
      } catch (err) {
        setError(err.message || "Error fetching Coursera data");
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // Helper function to validate URLs
  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <div style={spinnerStyle} />
      <style>
        {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
      </style>
      <div>Loading dashboard...</div>
    </div>
  );
  if (error) return <p>Error: {error}</p>;
  if (courses.length === 0) return <p>No courses found.</p>;
  

  return (
    <div>
      <h3>Coursera Courses</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {courses.map((course) => {
          const imageUrl = isValidUrl(course.photoUrl)
            ? course.photoUrl
            : "https://via.placeholder.com/120x80?text=No+Image";

          return (
            <li
              key={course.id}
              style={{
                marginBottom: "1rem",
                borderBottom: "1px solid #ddd",
                paddingBottom: "1rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src={imageUrl}
                alt={course.name}
                style={{
                  height: 80,
                  width: 120,
                  objectFit: "cover",
                  marginRight: "1rem",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/120x80?text=No+Image";
                }}
              />
              <div>
                <a
                  href={course.courseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#007bff" }}
                >
                  {course.name}
                </a>
                <p style={{ margin: "0.5rem 0", maxWidth: 600 }}>
                  {course.description.length > 200
                    ? course.description.slice(0, 200) + "..."
                    : course.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CourseraCertifications;
