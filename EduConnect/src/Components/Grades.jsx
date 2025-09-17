import React from "react";

function Grades({ token }) {
  const [subjects] = React.useState([
    { key: "physics", label: "Physics" },
    { key: "chemistry", label: "Chemistry" },
    { key: "maths", label: "Maths" }
  ]);
  const [selectedSubject, setSelectedSubject] = React.useState(null);
  const [marks, setMarks] = React.useState(null); // fetched marks
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!selectedSubject) return;
    setLoading(true);
    setError(null);

    // Fetch marks data for selectedSubject
    async function fetchMarks() {
      try {
        const res = await fetch(`https://your-backend.com/api/grades?subject=${selectedSubject}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load marks");
        const data = await res.json();
        setMarks(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMarks();
  }, [selectedSubject, token]);

  const testsOrder = ["Test1", "Test2", "Test3", "Quiz1", "Quiz2", "Quiz3", "Assignment1", "Assignment2", "Assignment3", "Half Yearly", "Final Exam"];

  return (
    <div>
      <h2>Grades</h2>
      <div>
        {subjects.map(s => (
          <button
            key={s.key}
            style={{ marginRight: 8, fontWeight: selectedSubject === s.key ? "bold" : "normal" }}
            onClick={() => setSelectedSubject(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading marks...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {marks && !loading && !error && (
        <table border={1} cellPadding={8} style={{ marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Test / Exam</th>
              <th>Mark</th>
            </tr>
          </thead>
          <tbody>
            {testsOrder.map(testName => {
              const testMark = marks[testName.toLowerCase().replace(/\s+/g, "_")]; // e.g. marks.test1 or marks.half_yearly
              return (
                <tr key={testName}>
                  <td>{testName}</td>
                  <td>{testMark !== undefined ? testMark : "--"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!selectedSubject && <p>Please select a subject above to see grades.</p>}
    </div>
  );
}

export default Grades;