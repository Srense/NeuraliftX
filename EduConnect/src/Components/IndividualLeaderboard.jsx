import React, { useEffect, useState } from "react";
import { Table, Container } from "react-bootstrap";

const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // Gold, silver, bronze

function CoinBadge({ value, style = {} }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#fff",
        borderRadius: 22,
        padding: "2px 16px 2px 10px",
        marginLeft: 6,
        minWidth: 60,
        boxShadow: "0 1px 6px 0 rgba(0,0,0,0.08)",
        fontSize: "1.15rem",
        fontWeight: 600,
        color: "#212121",
        ...style,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 40 40" style={{ marginRight: 6 }}>
        <circle cx="20" cy="20" r="16" fill="#febe44" stroke="#f5a623" strokeWidth="4" />
        <circle cx="20" cy="20" r="11" fill="#fff4c1" />
        <polygon
          points="20,12 22,18 28,18 23,21 25,27 20,23.5 15,27 17,21 12,18 18,18"
          fill="#fff"
          stroke="#f5a623"
          strokeWidth="1"
        />
      </svg>
      {value}
    </span>
  );
}

function IndividualLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    fetch("https://neuraliftx.onrender.com/api/leaderboard/individual")
      .then((res) => res.json())
      .then((resp) => {
        if (Array.isArray(resp)) setData(resp);
        else setData([]); // Always use array
      })
      .catch(() => setApiError("Failed to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading leaderboard...</div>;
  if (apiError) return <div style={{ color: "red" }}>{apiError}</div>;

  return (
    <Container>
      <h2
        style={{
          color: "#0c0c0bff", // gold color
          textShadow: "0 0 8px #FFD700, 0 0 12px #FFA500",
          fontWeight: "700",
          fontSize: "2.25rem",
          marginBottom: "1.5rem",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span role="img" aria-label="trophy" style={{ fontSize: "2.5rem" }}>
          🏆
        </span>
        Top Individual Rankers
      </h2>

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
                <td>
                  {student.firstName} {student.lastName}
                </td>
                <td>
                  <CoinBadge value={student.totalCoins} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: "center" }}>
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
