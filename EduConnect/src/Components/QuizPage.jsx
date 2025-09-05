import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const getStoredToken = () => {
  return (
    localStorage.getItem("token_student") ||
    localStorage.getItem("token_faculty") ||
    localStorage.getItem("token_admin") ||
    localStorage.getItem("token_alumni")
  );
};

const QuizPage = () => {
  const { assignmentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function generateQuiz() {
      setLoading(true);
      setError("");
      try {
        const token = getStoredToken();
        if (!token) throw new Error("User not authenticated");

        const response = await fetch("https://neuraliftx.onrender.com/api/generate-quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assignmentId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate quiz");
        }

        const data = await response.json();
        setQuiz(data.quiz);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setResults(null);
      } catch (err) {
        setError(err.message || "Error generating quiz");
      } finally {
        setLoading(false);
      }
    }

    if (assignmentId) {
      generateQuiz();
    }
  }, [assignmentId]);

  const question = quiz ? quiz[currentQuestionIndex] : null;

  const handleSelectAnswer = (answer) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < quiz.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const token = getStoredToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch("https://neuraliftx.onrender.com/api/submit-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignmentId,
          answers: selectedAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit quiz");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || "Submission error");
    } finally {
      setSubmitting(false);
    }
  };

  // Style objects
  const containerStyle = {
    maxWidth: "700px",
    margin: "2rem auto",
    padding: "2rem",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.95)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const bgStyle = {
    minHeight: "100vh",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1470&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    padding: "3rem 1rem",
  };

  const buttonStyle = {
    padding: "10px 24px",
    margin: "0 8px 8px 0",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  };

  const primaryButton = {
    ...buttonStyle,
    backgroundColor: "#007bff",
    color: "white",
  };

  const disabledButton = {
    ...primaryButton,
    opacity: 0.5,
    cursor: "not-allowed",
  };

  const secondaryButton = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    color: "white",
  };

  const errorStyle = {
    backgroundColor: "#f8d7da",
    color: "#842029",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "1rem",
  };

  if (loading)
    return (
      <div style={bgStyle}>
        <div style={containerStyle}>Generating quiz, please wait...</div>
      </div>
    );

  if (error)
    return (
      <div style={bgStyle}>
        <div style={containerStyle}>
          <div style={errorStyle}>{error}</div>
        </div>
      </div>
    );

  if (!quiz)
    return (
      <div style={bgStyle}>
        <div style={containerStyle}>No quiz available.</div>
      </div>
    );

  if (results)
    return (
      <div style={bgStyle}>
        <div style={containerStyle}>
          <h2 style={{ marginBottom: "1rem" }}>Quiz Results</h2>
          <p style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            Score: <strong>{results.score}</strong> / {quiz.length}
          </p>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {quiz.map((q, i) => {
              // Ensure pdfUrl is absolute:
              const pdfUrlRaw = results.suggestions[i]?.pdfUrl || "";
              const pdfUrl = pdfUrlRaw.startsWith("http")
                ? pdfUrlRaw
                : `https://neuraliftx.onrender.com${pdfUrlRaw}`;
              const page = results.suggestions[i]?.page || 1;
              const highlightText = results.suggestions[i]?.highlightText || "";

              return (
                <li
                  key={i}
                  style={{
                    marginBottom: "1.5rem",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>{q.question}</p>
                  <p>
                    Your answer:{" "}
                    <span
                      style={{
                        color:
                          selectedAnswers[i] === results.correctAnswers[i] ? "green" : "red",
                        fontWeight: "600",
                      }}
                    >
                      {selectedAnswers[i] || "No answer"}
                    </span>
                  </p>
                  <p>Correct answer: {results.correctAnswers[i]}</p>

                  <button
                    onClick={() => {
                      const highlightParam = highlightText
                        ? encodeURIComponent(highlightText)
                        : "";
                      const viewerUrl = `https://neuraliftx.onrender.com/pdf-viewer?file=${encodeURIComponent(
                        pdfUrl
                      )}&page=${page}&highlight=${highlightParam}`;
                      window.open(viewerUrl, "_blank");
                    }}
                    style={{ ...primaryButton, marginTop: "0.5rem" }}
                    aria-label={`See relevant section in PDF for question ${i + 1}`}
                  >
                    See relevant section in PDF
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );

  return (
    <div style={bgStyle}>
      <div style={containerStyle}>
        <h2 style={{ marginBottom: "1rem" }}>
          Quiz: Question {currentQuestionIndex + 1} / {quiz.length}
        </h2>

        <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{question?.question}</p>

        <ul style={{ listStyle: "none", padding: 0, marginBottom: "1rem" }}>
          {question?.options.map((option, i) => (
            <li key={i} style={{ marginBottom: "0.6rem" }}>
              <label
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  fontSize: "1rem",
                }}
              >
                <input
                  type="radio"
                  name={`answer-${currentQuestionIndex}`}
                  value={option}
                  checked={selectedAnswers[currentQuestionIndex] === option}
                  onChange={() => handleSelectAnswer(option)}
                  style={{ marginRight: "0.6rem" }}
                />
                {option}
              </label>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            style={currentQuestionIndex === 0 ? disabledButton : secondaryButton}
          >
            Previous
          </button>

          {currentQuestionIndex + 1 < quiz.length ? (
            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestionIndex]}
              style={!selectedAnswers[currentQuestionIndex] ? disabledButton : primaryButton}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswers[currentQuestionIndex] || submitting}
              style={!selectedAnswers[currentQuestionIndex] || submitting ? disabledButton : primaryButton}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
