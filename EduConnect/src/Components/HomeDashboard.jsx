import React, { useState, useEffect } from "react";

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

const DASHBOARD_SECTIONS = {
  COURSES: "Courses",
  GRADES: "Grades",
  ATTENDANCE: "Attendance",
  ALUMNI: "Alumni Arena",
};

// Dummy content data, replace with API or state-driven data
const dummyCourses = [
  { subject: "Math", classCount: 20, attendancePercent: "95%" },
  { subject: "Science", classCount: 22, attendancePercent: "90%" },
];

const dummyGrades = [
  { subject: "Math", grade: "A" },
  { subject: "Science", grade: "B+" },
];

const dummyAttendance = {
  overallPercent: "92%",
  details: dummyCourses,
};

const dummyAlumni = [
  { name: "Sarah Chen", title: "Engineer at Google" },
  { name: "Michael Rodriguez", title: "PM at Microsoft" },
];

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState(DASHBOARD_SECTIONS.COURSES);
  const [loading, setLoading] = useState(false);

  const summaryCards = [
    { label: DASHBOARD_SECTIONS.COURSES, icon: "📚" },
    { label: DASHBOARD_SECTIONS.GRADES, icon: "📝" },
    { label: DASHBOARD_SECTIONS.ATTENDANCE, icon: "✅" },
    { label: DASHBOARD_SECTIONS.ALUMNI, icon: "🤝" },
  ];

  // Render summary cards
  const renderSummaryCards = () => (
    <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
      {summaryCards.map(({ label, icon }) => (
        <div
          key={label}
          onClick={() => setActiveSection(label)}
          style={{
            cursor: "pointer",
            flex: 1,
            backgroundColor: activeSection === label ? "#6366f1" : "#fff",
            color: activeSection === label ? "#fff" : "#2c3e50",
            borderRadius: 12,
            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 15,
            fontWeight: 600,
            fontSize: 18,
            userSelect: "none",
            transition: "background-color 0.3s",
          }}
        >
          <span style={{ fontSize: 28 }}>{icon}</span>
          {label}
        </div>
      ))}
    </div>
  );

  // Section renderers
  const renderCourses = () => (
    <div style={cardStyle}>
      <h2>Courses</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Class Count</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {dummyCourses.map(({ subject, classCount, attendancePercent }) => (
            <tr key={subject}>
              <td>{subject}</td>
              <td>{classCount}</td>
              <td>{attendancePercent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGrades = () => (
    <div style={cardStyle}>
      <h2>Grades</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {dummyGrades.map(({ subject, grade }) => (
            <tr key={subject}>
              <td>{subject}</td>
              <td>{grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAttendance = () => (
    <div style={cardStyle}>
      <h2>Attendance</h2>
      <p>
        Overall Attendance: <strong>{dummyAttendance.overallPercent}</strong>
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Class Count</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {dummyAttendance.details.map(({ subject, classCount, attendancePercent }) => (
            <tr key={subject}>
              <td>{subject}</td>
              <td>{classCount}</td>
              <td>{attendancePercent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAlumniArena = () => (
    <div style={cardStyle}>
      <h2>Alumni Arena</h2>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {dummyAlumni.map(({ name, title }) => (
          <li key={name} style={{ marginBottom: 12 }}>
            <strong>{name}</strong> - <em>{title}</em>
          </li>
        ))}
      </ul>
    </div>
  );

  const cardStyle = {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    marginBottom: 25,
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 20px" }}>
      {renderSummaryCards()}

      {loading ? (
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <div style={spinnerStyle} />
          <div>Loading...</div>
        </div>
      ) : (
        <>
          {activeSection === DASHBOARD_SECTIONS.COURSES && renderCourses()}
          {activeSection === DASHBOARD_SECTIONS.GRADES && renderGrades()}
          {activeSection === DASHBOARD_SECTIONS.ATTENDANCE && renderAttendance()}
          {activeSection === DASHBOARD_SECTIONS.ALUMNI && renderAlumniArena()}
        </>
      )}
    </div>
  );
}
