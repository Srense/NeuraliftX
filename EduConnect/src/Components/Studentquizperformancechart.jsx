import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import 'chart.js/auto'; // required for chart.js v3+

const QuizPerformanceChart = () => {
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerformance() {
      try {
        const token =
          localStorage.getItem("token_student") ||
          localStorage.getItem("token_faculty") ||
          localStorage.getItem("token_admin") ||
          localStorage.getItem("token_alumni");
        const res = await fetch("https://neuraliftx.onrender.com/api/student/quiz-performance", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setQuizData(data);
      } catch (e) {
        setQuizData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPerformance();
  }, []);

  if (loading) return <div>Loading quiz performance...</div>;
  if (quizData.length === 0) return <div>No quiz performance data available yet.</div>;

  const labels = quizData.map(
    (q, i) =>
      q.assignmentTitle ||
      `Quiz ${i + 1} (${q.date ? new Date(q.date).toLocaleDateString() : ""})`
  );
  const scores = quizData.map((q) => (q.total ? (q.score / q.total) * 100 : 0));

  return (
    <div style={{ marginBottom: 32 }}>
      <h3>Your Quiz Performance (last 3 attempts)</h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Score (%)",
              data: scores,
              fill: false,
              backgroundColor: "#007bff",
              borderColor: "#3b82f6",
              tension: 0.25,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: true, position: "top" },
            tooltip: {
              callbacks: {
                afterBody: (context) => {
                  const idx = context[0]?.dataIndex;
                  const topics = quizData[idx]?.topics || [];
                  return topics.length
                    ? `Topics: ${topics.join(", ")}`
                    : "";
                },
              },
            },
          },
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score (%)' } },
          },
        }}
      />
      <ul style={{ marginTop: 16 }}>
        {quizData.map((q, i) => (
          <li key={i}>
            <b>
              {labels[i]}: {q.score}/{q.total} ({Math.round((q.score / q.total) * 100)}%)
            </b>
            {q.topics && q.topics.length ? (
              <span> &mdash; Topics: {q.topics.join(", ")}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 8 }}>
        <b>
          Trend:{" "}
          {scores[2] > scores[1] && scores[1] > scores[0]
            ? "Improving 📈"
            : scores[2] < scores[1] && scores[1] < scores[0]
            ? "Needs Attention 📉"
            : "Varying"}
        </b>
      </div>
    </div>
  );
};

export default QuizPerformanceChart;
