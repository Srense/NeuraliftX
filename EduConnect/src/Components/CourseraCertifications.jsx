import React, { useEffect, useState } from "react";

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

const CourseraCertifications = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("https://neuraliftx.onrender.com/api/coursera-courses");
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
  if (error) return <p>Error: {error}</p>;
  if (courses.length === 0) return <p>No courses found.</p>;

  return (
    <div>
      <h3>Coursera Courses</h3>

      <style>{`
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          padding: 0;
          list-style: none;
        }
        .course-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          background-color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-height: 260px;
        }
        .course-card img {
          height: 100px;
          width: 100%;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #ccc;
        }
        .course-card a {
          font-weight: bold;
          font-size: 1.1rem;
          color: #007bff;
          margin-bottom: 0.5rem;
          text-decoration: none;
          word-break: break-word;
        }
        .course-card p {
          margin: 0;
          font-size: 14px;
          color: #444;
          max-height: 60px;
          overflow: hidden;
        }
        @media (max-width: 600px) {
          .course-card {
            min-height: auto;
          }
          .course-card img {
            height: 80px;
          }
          .course-card a {
            font-size: 1rem;
          }
          .course-card p {
            font-size: 13px;
            max-height: 80px;
          }
        }
      `}</style>

      <ul className="courses-grid">
        {courses.map((course) => {
          const imageUrl = isValidUrl(course.photoUrl)
            ? course.photoUrl
            : "https://via.placeholder.com/120x80?text=No+Image";

          return (
            <li className="course-card" key={course.id}>
              <img
                src={imageUrl}
                alt={course.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/120x80?text=No+Image";
                }}
              />
              <a href={course.courseUrl} target="_blank" rel="noopener noreferrer">
                {course.name}
              </a>
              <p>
                {course.description.length > 100
                  ? course.description.slice(0, 100) + "..."
                  : course.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CourseraCertifications;
