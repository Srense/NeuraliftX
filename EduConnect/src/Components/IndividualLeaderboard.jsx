import React, { useEffect, useState } from "react";
import { Table, Container, Badge } from "react-bootstrap";

const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // Gold, silver, bronze

function IndividualLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    fetch("https://neuraliftx.onrender.com/api/leaderboard/individual")
      .then(res => res.json())
      .then(resp => {
        if (Array.isArray(resp)) setData(resp);
        else setData([]); // Always use array
      })
      .catch(() => setApiError("Failed to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading leaderboard...</div>;
  if (apiError) return <div style={{ color: 'red' }}>{apiError}</div>;

  return (
    <Container>
      <h2 className="text-glow mb-4">🏆 Top Individual Rankers</h2>
      <Table responsive hover className="bg-dark text-white rounded shadow">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Total Coins</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((student, idx) => (
              <tr
                key={student.studentId}
                style={idx < 3 ? { background: rankColors[idx], color: "#1e293b" } : {}}
              >
                <td>
                  {idx + 1}{" "}
                  {idx === 0 && "🥇"}
                  {idx === 1 && "🥈"}
                  {idx === 2 && "🥉"}
                </td>
                <td>{student.firstName} {student.lastName}</td>
                <td>
  <span
    style={{
      position: "relative",
      display: "inline-block",
      width: 36,
      height: 36,
      background: "radial-gradient(circle at center, #ffd700, #b8860b)",
      borderRadius: "50%",
      boxShadow: "0 0 5px #b8860b inset",
      verticalAlign: "middle",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 14,
      lineHeight: "36px",
      color: "black",
      userSelect: "none",
      fontFamily: "monospace",
    }}
  >
    <span
      style={{
        position: "relative",
        zIndex: 2,
        color: "black",
        fontWeight: "bold",
      }}
    >
      {student.totalCoins}
    </span>
  </span>
</td>

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center' }}>
                No leaderboard data available.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default IndividualLeaderboard;
