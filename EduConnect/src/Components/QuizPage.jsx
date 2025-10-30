import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Award, 
  BookOpen,
  Clock,
  Target
} from 'lucide-react';

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

  const getScorePercentage = () => {
    if (!results || !quiz) return 0;
    return Math.round((results.score / quiz.length) * 100);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <XCircle style={{ width: 48, height: 48, color: '#dc2626', marginBottom: 16 }} />
            <h2 style={styles.errorTitle}>Oops! Something went wrong</h2>
            <p style={styles.errorMessage}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.emptyState}>
            <BookOpen style={{ width: 64, height: 64, color: '#9ca3af', marginBottom: 16 }} />
            <p style={styles.emptyText}>No quiz available.</p>
          </div>
        </div>
      </div>
    );
  }

  if (results) {
    const percentage = getScorePercentage();
    const scoreColor = getScoreColor(percentage);

    return (
      <div style={styles.pageWrapper}>
        <div style={styles.resultsContainer}>
          <div style={styles.resultsHeader}>
            <div style={{...styles.scoreCircle, borderColor: scoreColor}}>
              <span style={{...styles.scorePercentage, color: scoreColor}}>
                {percentage}%
              </span>
            </div>
            <h1 style={styles.resultsTitle}>Quiz Complete! 🎉</h1>
            <p style={styles.resultsSubtitle}>
              You scored <strong style={{color: scoreColor}}>{results.score}</strong> out of {quiz.length} questions
            </p>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <Award style={{ width: 32, height: 32, color: '#f59e0b' }} />
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Coins Earned</p>
                <p style={styles.statValue}>{results.coinsAwarded}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <Target style={{ width: 32, height: 32, color: '#8b5cf6' }} />
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Total Coins</p>
                <p style={styles.statValue}>{results.totalCoins}</p>
              </div>
            </div>
          </div>

          <div style={styles.answersSection}>
            <h2 style={styles.answersSectionTitle}>Review Your Answers</h2>
            {quiz.map((q, i) => {
              const isCorrect = selectedAnswers[i] === results.correctAnswers[i];
              return (
                <div key={i} style={styles.answerCard}>
                  <div style={styles.answerHeader}>
                    {isCorrect ? (
                      <CheckCircle style={{ width: 24, height: 24, color: '#10b981', flexShrink: 0 }} />
                    ) : (
                      <XCircle style={{ width: 24, height: 24, color: '#ef4444', flexShrink: 0 }} />
                    )}
                    <span style={styles.questionNumber}>Question {i + 1}</span>
                  </div>
                  
                  <p style={styles.questionText}>{q.question}</p>
                  
                  <div style={styles.answerDetails}>
                    <div style={styles.answerRow}>
                      <span style={styles.answerLabel}>Your answer:</span>
                      <span style={{
                        ...styles.answerValue,
                        color: isCorrect ? '#10b981' : '#ef4444',
                        fontWeight: 600
                      }}>
                        {selectedAnswers[i] || "No answer"}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div style={styles.answerRow}>
                        <span style={styles.answerLabel}>Correct answer:</span>
                        <span style={{...styles.answerValue, color: '#10b981', fontWeight: 600}}>
                          {results.correctAnswers[i]}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const { pdfUrl, page, highlightText } = results.suggestions[i];
                      const highlightParam = highlightText ? encodeURIComponent(highlightText) : "";
                      const viewerUrl = `https://neuraliftx.onrender.com/pdf-viewer?file=${encodeURIComponent(
                        pdfUrl
                      )}&page=${page}&highlight=${highlightParam}`;
                      window.open(viewerUrl, "_blank");
                    }}
                    style={styles.pdfButton}
                  >
                    <BookOpen style={{ width: 18, height: 18 }} />
                    View in PDF
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / quiz.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.quizContainer}>
        {/* Progress Bar */}
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${progress}%`}}></div>
        </div>

        {/* Quiz Header */}
        <div style={styles.quizHeader}>
          <div style={styles.headerTop}>
            <div style={styles.questionCounter}>
              <Clock style={{ width: 20, height: 20, color: '#6366f1' }} />
              <span style={styles.counterText}>
                Question {currentQuestionIndex + 1} of {quiz.length}
              </span>
            </div>
            <div style={styles.answeredCounter}>
              <span style={styles.answeredText}>
                {answeredCount}/{quiz.length} answered
              </span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div style={styles.questionCard}>
          <h2 style={styles.questionTitle}>{question?.question}</h2>

          <div style={styles.optionsContainer}>
            {question?.options.map((option, i) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === option;
              return (
                <label
                  key={i}
                  style={{
                    ...styles.optionLabel,
                    ...(isSelected ? styles.optionLabelSelected : {})
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#818cf8';
                      e.currentTarget.style.backgroundColor = '#f5f3ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  <input
                    type="radio"
                    name={`answer-${currentQuestionIndex}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleSelectAnswer(option)}
                    style={styles.radioInput}
                  />
                  <span style={styles.customRadio}>
                    {isSelected && <span style={styles.radioInner}></span>}
                  </span>
                  <span style={styles.optionText}>{option}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={styles.navigationButtons}>
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            style={{
              ...styles.navButton,
              ...(currentQuestionIndex === 0 ? styles.navButtonDisabled : styles.secondaryButton)
            }}
          >
            <ChevronLeft style={{ width: 20, height: 20 }} />
            Previous
          </button>

          {currentQuestionIndex + 1 < quiz.length ? (
            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestionIndex]}
              style={{
                ...styles.navButton,
                ...styles.primaryButton,
                ...((!selectedAnswers[currentQuestionIndex]) ? styles.navButtonDisabled : {})
              }}
            >
              Next
              <ChevronRight style={{ width: 20, height: 20 }} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswers[currentQuestionIndex] || submitting}
              style={{
                ...styles.navButton,
                ...styles.submitButton,
                ...((!selectedAnswers[currentQuestionIndex] || submitting) ? styles.navButtonDisabled : {})
              }}
            >
              {submitting ? (
                <>
                  <div style={styles.smallSpinner}></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Quiz
                  <CheckCircle style={{ width: 20, height: 20 }} />
                </>
              )}
            </button>
          )}
        </div>

        {/* Question Dots */}
        <div style={styles.questionDots}>
          {quiz.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestionIndex(i)}
              style={{
                ...styles.dot,
                ...(i === currentQuestionIndex ? styles.dotActive : {}),
                ...(selectedAnswers[i] ? styles.dotAnswered : {})
              }}
              title={`Question ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  
  loadingContainer: {
    textAlign: 'center',
    padding: '40px',
  },
  
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid #ffffff',
    borderRadius: '50%',
    margin: '0 auto 20px',
    animation: 'spin 1s linear infinite',
  },
  
  loadingText: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 500,
  },
  
  container: {
    maxWidth: '700px',
    width: '100%',
    margin: '0 auto',
  },
  
  errorBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  
  errorTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '12px',
  },
  
  errorMessage: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: 1.6,
  },
  
  retryButton: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '60px 40px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  
  emptyText: {
    fontSize: '18px',
    color: '#6b7280',
  },
  
  quizContainer: {
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
  },
  
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.3s ease',
    borderRadius: '999px',
  },
  
  quizHeader: {
    marginBottom: '24px',
  },
  
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  
  questionCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '12px 20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  
  counterText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
  },
  
  answeredCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '12px 20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  
  answeredText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#6b7280',
  },
  
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    marginBottom: '24px',
  },
  
  questionTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '32px',
    lineHeight: 1.5,
  },
  
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  },
  
  optionLabelSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
  },
  
  radioInput: {
    display: 'none',
  },
  
  customRadio: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  
  radioInner: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
  },
  
  optionText: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: 1.6,
    flex: 1,
  },
  
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  
  primaryButton: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
  },
  
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#374151',
  },
  
  submitButton: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  
  navButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  
  smallSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  questionDots: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
  },
  
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#d1d5db',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 0,
  },
  
  dotActive: {
    backgroundColor: '#6366f1',
    transform: 'scale(1.3)',
  },
  
  dotAnswered: {
    backgroundColor: '#10b981',
  },
  
  resultsContainer: {
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },
  
  resultsHeader: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '48px 32px',
    textAlign: 'center',
    marginBottom: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  
  scoreCircle: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    border: '8px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  
  scorePercentage: {
    fontSize: '42px',
    fontWeight: 700,
  },
  
  resultsTitle: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '12px',
  },
  
  resultsSubtitle: {
    fontSize: '18px',
    color: '#6b7280',
    lineHeight: 1.6,
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  
  statContent: {
    flex: 1,
  },
  
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: 500,
  },
  
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1f2937',
  },
  
  answersSection: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  
  answersSectionTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '24px',
  },
  
  answerCard: {
    padding: '24px',
    borderBottom: '2px solid #f3f4f6',
    marginBottom: '24px',
  },
  
  answerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  
  questionNumber: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#6b7280',
  },
  
  questionText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '16px',
    lineHeight: 1.6,
  },
  
  answerDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  
  answerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px',
  },
  
  answerLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
  },
  
  answerValue: {
    fontSize: '14px',
    fontWeight: 600,
  },
  
  pdfButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// Add keyframes animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .quiz-container {
      padding: 16px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default QuizPage;