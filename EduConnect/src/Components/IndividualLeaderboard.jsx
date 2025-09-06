// IndividualLeaderboard.jsx
import React, { useEffect, useState } from "react";
import { Table, Container, Badge } from "react-bootstrap";

const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // Gold, silver, bronze

function IndividualLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://neuraliftx.onrender.com/api/leaderboard/individual") // Adjust path as needed
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading leaderboard...</div>;

  // Adjust IndividualLeaderboard to show totalCoins

return (
  <Container>
    <h2>🏆 Top Individual Rankers</h2>
    <Table responsive hover>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Total Coins</th>
        </tr>
      </thead>
      <tbody>
        {data.map((student, idx) => (
          <tr key={student.studentId} style={idx < 3 ? { background: rankColors[idx], color: "#1e293b" } : {}}>
            <td>
              {idx + 1} {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
            </td>
            <td>{student.firstName} {student.lastName}</td>
            <td>{student.totalCoins}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </Container>
);

}

export default IndividualLeaderboard;
