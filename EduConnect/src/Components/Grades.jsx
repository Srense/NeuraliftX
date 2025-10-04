import React, { useState } from "react";
import "./Grades.css";

const Grades = () => {
  const [openSubject, setOpenSubject] = useState(null);

  const subjects = [
    { key: "physics", label: "Physics" },
    { key: "chemistry", label: "Chemistry" },
    { key: "maths", label: "Maths" },
  ];

  const dummyData = {
    physics: {
      assignments: [
        { name: "Assignment 1", marks: 9, grade: "A+" },
        { name: "Assignment 2", marks: 8, grade: "A" },
      ],
      surpriseTests: [
        { name: "Surprise Test 1", marks: 10, grade: "A+" },
        { name: "Surprise Test 2", marks: 9, grade: "A" },
      ],
      tests: [
        { name: "Test 1", marks: 18, grade: "A+" },
        { name: "Test 2", marks: 16, grade: "A" },
        { name: "Final Exam", marks: 19, grade: "A+" },
      ],
    },
    chemistry: {
      assignments: [
        { name: "Assignment 1", marks: 7, grade: "B" },
        { name: "Assignment 2", marks: 9, grade: "A" },
      ],
      surpriseTests: [
        { name: "Surprise Test 1", marks: 8, grade: "B+" },
        { name: "Surprise Test 2", marks: 11, grade: "A+" },
      ],
      tests: [
        { name: "Test 1", marks: 15, grade: "B+" },
        { name: "Test 2", marks: 17, grade: "A" },
        { name: "Final Exam", marks: 18, grade: "A+" },
      ],
    },
    maths: {
      assignments: [
        { name: "Assignment 1", marks: 10, grade: "A+" },
        { name: "Assignment 2", marks: 9, grade: "A" },
      ],
      surpriseTests: [
        { name: "Surprise Test 1", marks: 12, grade: "A+" },
        { name: "Surprise Test 2", marks: 11, grade: "A" },
      ],
      tests: [
        { name: "Test 1", marks: 19, grade: "A+" },
        { name: "Test 2", marks: 20, grade: "A+" },
        { name: "Final Exam", marks: 18, grade: "A" },
      ],
    },
  };

  const toggleSubject = (subjectKey) => {
    setOpenSubject(openSubject === subjectKey ? null : subjectKey);
  };

  return (
    <div className="grades-container">
      <h2 className="grades-title">Grades Overview</h2>
      <div className="subjects-list">
        {subjects.map((subj) => {
          const isOpen = openSubject === subj.key;
          return (
            <div key={subj.key} className="subject-item">
              <button
                className={`subject-btn ${isOpen ? "active" : ""}`}
                onClick={() => toggleSubject(subj.key)}
              >
                {subj.label}
                <span className={`arrow ${isOpen ? "rotate" : ""}`}>▼</span>
              </button>

              <div
                className={`dropdown-wrapper ${isOpen ? "open" : ""}`}
              >
                <div className="dropdown">
                  <div className="section">
                    <h4>Assignments (out of 10)</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Marks</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dummyData[subj.key].assignments.map((a, i) => (
                          <tr key={i}>
                            <td>{a.name}</td>
                            <td>{a.marks}</td>
                            <td>{a.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="section">
                    <h4>Surprise Tests (out of 12)</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Marks</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dummyData[subj.key].surpriseTests.map((t, i) => (
                          <tr key={i}>
                            <td>{t.name}</td>
                            <td>{t.marks}</td>
                            <td>{t.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="section">
                    <h4>Tests (out of 20)</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Marks</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dummyData[subj.key].tests.map((t, i) => (
                          <tr key={i}>
                            <td>{t.name}</td>
                            <td>{t.marks}</td>
                            <td>{t.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Grades;
