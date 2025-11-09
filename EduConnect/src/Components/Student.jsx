// Student.jsx (FULL — complete & fixed)
// Place this file in the same location as your previous Student.jsx
// Requires: HomeDashboard, AttendanceDashboard, Studentquizperformancechart, CourseraCertifications,
// IndividualLeaderboard, Grades.jsx, AlumniArena, Social (lazy) to be present in the same folder structure.

import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import "./Student.css";
import logo from "../assets/Logo.png";
import HomeDashboard from "./HomeDashboard";
import AttendanceDashboard from "./AttendanceDashboard";
import QuizPerformanceChart from "./Studentquizperformancechart";
import CourseraCertifications from "./CourseraCertifications";
import IndividualLeaderboard from "./IndividualLeaderboard";
import Grades from "./Grades.jsx";
import AlumniArena from "./AlumniArena";
// StudentConnections component is included at bottom of this file (so it's "everything")
const Social = lazy(() => import("./Social"));

// Base API URL used by your backend (keeps existing domain)
const BASE_API = "https://neuraliftx.onrender.com";

// Small helpers
const getProfileImageUrl = (profilePicUrl) =>
  profilePicUrl ? `${BASE_API}${profilePicUrl}` : "https://via.placeholder.com/40";

function CoinBadge({ coins }) {
  return (
    <div className="coin-badge">
      <CoinIcon />
      <span className="coin-value">{coins}</span>
    </div>
  );
}

function CoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" style={{ verticalAlign: "middle" }}>
      <circle cx="20" cy="20" r="16" fill="#febe44" stroke="#f5a623" strokeWidth="4" />
      <circle cx="20" cy="20" r="11" fill="#fff4c1" />
      <polygon
        points="20,12 22,18 28,18 23,21 25,27 20,23.5 15,27 17,21 12,18 18,18"
        fill="#fff"
        stroke="#f5a623"
        strokeWidth="1"
      />
    </svg>
  );
}

/* ---------------- Profile Modal ---------------- */
function ProfileModal({ user, token, onClose, onLogout, onUpdateProfilePic, onProfileUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(getProfileImageUrl(user?.profilePicUrl));
  const [profileData, setProfileData] = useState({
    bio: user?.bio || "",
    percentage: user?.percentage ?? "",
    className: user?.className || "",
    internshipsDone: (user?.internshipsDone || []).join(", "),
    coursesCompleted: (user?.coursesCompleted || []).join(", "),
    areaOfInterest: (user?.areaOfInterest || []).join(", "),
  });

  useEffect(() => {
    setPreviewUrl(getProfileImageUrl(user?.profilePicUrl));
    setProfileData({
      bio: user?.bio || "",
      percentage: user?.percentage ?? "",
      className: user?.className || "",
      internshipsDone: (user?.internshipsDone || []).join(", "),
      coursesCompleted: (user?.coursesCompleted || []).join(", "),
      areaOfInterest: (user?.areaOfInterest || []).join(", "),
    });
    setSelectedFile(null);
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("profilePic", selectedFile);
    try {
      const res = await fetch(`${BASE_API}/api/profile/picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUpdateProfilePic(data.profilePicUrl);
      alert("Profile picture uploaded successfully.");
    } catch (err) {
      console.error("Upload error", err);
      alert(err.message || "Error uploading profile picture.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const body = {
      bio: profileData.bio,
      percentage: profileData.percentage === "" ? null : Number(profileData.percentage),
      className: profileData.className,
      internshipsDone: profileData.internshipsDone.split(",").map((s) => s.trim()).filter(Boolean),
      coursesCompleted: profileData.coursesCompleted.split(",").map((s) => s.trim()).filter(Boolean),
      areaOfInterest: profileData.areaOfInterest.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(`${BASE_API}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      onProfileUpdate(data.user);
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Profile update error", err);
      alert(err.message || "Failed to update profile");
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        <h2>My Profile</h2>
        <img src={previewUrl} alt="Profile" className="profile-large-pic" />
        <p><b>Name:</b> {user?.firstName} {user?.lastName}</p>
        <p><b>UID:</b> {user?.roleIdValue}</p>
        <p><b>Email:</b> {user?.email}</p>

        <label>Bio:</label>
        <textarea
          rows={3}
          value={profileData.bio}
          onChange={(e) => setProfileData((p) => ({ ...p, bio: e.target.value }))}
          style={{ width: "100%" }}
        />

        <label>Percentage:</label>
        <input
          type="number"
          value={profileData.percentage ?? ""}
          onChange={(e) => setProfileData((p) => ({ ...p, percentage: e.target.value }))}
          min={0}
          max={100}
          step={0.01}
          style={{ width: "100%" }}
        />

        <label>Class:</label>
        <input
          type="text"
          value={profileData.className}
          onChange={(e) => setProfileData((p) => ({ ...p, className: e.target.value }))}
          style={{ width: "100%" }}
        />

        <label>Internships Done (comma separated):</label>
        <input
          type="text"
          value={profileData.internshipsDone}
          onChange={(e) => setProfileData((p) => ({ ...p, internshipsDone: e.target.value }))}
          style={{ width: "100%" }}
        />

        <label>Courses Completed (comma separated):</label>
        <input
          type="text"
          value={profileData.coursesCompleted}
          onChange={(e) => setProfileData((p) => ({ ...p, coursesCompleted: e.target.value }))}
          style={{ width: "100%" }}
        />

        <label>Area of Interest (comma separated):</label>
        <input
          type="text"
          value={profileData.areaOfInterest}
          onChange={(e) => setProfileData((p) => ({ ...p, areaOfInterest: e.target.value }))}
          style={{ width: "100%" }}
        />

        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading} style={{ marginTop: 8 }}>
          {uploading ? "Uploading..." : "Upload Picture"}
        </button>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={handleSave} className="action-btn">Save Profile</button>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- StudentProfileModal (search results) ---------------- */
function StudentProfileModal({ student, token, onClose, onConnected }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!student?._id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_API}/api/connect/student/status/${student._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!mounted) return;
        // backend returns { success: true, status: "pending" } or simply status string or array -> handle carefully
        if (json && typeof json.status === "string") setStatus(json.status);
        else if (json && json.success && json.status) setStatus(json.status);
        else setStatus("not_connected");
      } catch (err) {
        console.warn("Status fetch error", err);
        if (mounted) setStatus("not_connected");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [student, token]);

  const sendRequest = async () => {
    if (!student?._id) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_API}/api/connect/student/${student._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Request failed");
      // success -> set pending and optionally notify parent
      setStatus("pending");
      alert(data.message || "Request sent");
      if (onConnected) onConnected(); // parent may refresh lists
    } catch (err) {
      console.error("Send request error", err);
      alert(err.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  if (!student) return null;

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn">×</button>
        <img src={getProfileImageUrl(student.profilePicUrl)} alt="Profile" className="profile-large-pic" />
        <h2>{student.firstName} {student.lastName}</h2>
        <p><b>UID:</b> {student.roleIdValue}</p>
        <p><b>Email:</b> {student.email}</p>
        <p><b>Class:</b> {student.className || "N/A"}</p>
        <p><b>Percentage:</b> {student.percentage ?? "N/A"}{student.percentage ? "%" : ""}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{student.bio || "No bio provided."}</p>

        {loading ? (
          <button className="action-btn" disabled>Checking...</button>
        ) : status === "pending" ? (
          <button className="action-btn" disabled>Request Sent</button>
        ) : status === "accepted" ? (
          <button className="action-btn" disabled>Connected</button>
        ) : (
          <button onClick={sendRequest} disabled={sending} className="action-btn">
            {sending ? "Sending..." : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- AnnouncementPopup ---------------- */
function AnnouncementPopup({ announcement, onClose, token }) {
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Reset responses when announcement changes
    setResponses({});
    setSubmitted(false);
    setSubmitting(false);
  }, [announcement]);

  const handleChange = (qIndex, value) => {
    setResponses((prev) => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_API}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ announcementId: announcement._id, responses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      console.error("Feedback error", err);
      alert(err.message || "Submission error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!announcement) return null;

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <button onClick={onClose} className="close-btn">×</button>
        <h2>{announcement.title}</h2>

        {announcement.contentType === "text" ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{announcement.message}</div>
        ) : submitted ? (
          <div>Thank you — your feedback has been recorded.</div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {announcement.surveyQuestions?.map((q, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600 }}>{q.question}</label>
                {q.inputType === "text" && (
                  <textarea rows={3} value={responses[idx] || ""} onChange={(e) => handleChange(idx, e.target.value)} style={{ width: "100%" }} required />
                )}
                {(q.inputType === "radio" || q.inputType === "checkbox") && (
                  <div>
                    {q.options.map((opt, i) => (
                      <label key={i} style={{ display: "block", marginTop: 6 }}>
                        <input
                          type={q.inputType}
                          name={`q-${idx}`}
                          value={opt}
                          checked={q.inputType === "radio" ? responses[idx] === opt : Array.isArray(responses[idx]) && responses[idx].includes(opt)}
                          onChange={(e) => {
                            if (q.inputType === "radio") handleChange(idx, e.target.value);
                            else {
                              const prev = responses[idx] || [];
                              if (e.target.checked) handleChange(idx, [...prev, e.target.value]);
                              else handleChange(idx, prev.filter((x) => x !== e.target.value));
                            }
                          }}
                          required={q.inputType === "radio"}
                        />{" "}
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.inputType === "select" && (
                  <select value={responses[idx] || ""} onChange={(e) => handleChange(idx, e.target.value)} style={{ width: "100%" }} required>
                    <option value="">Select...</option>
                    {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="action-btn" disabled={submitting}>{submitting ? "Submitting..." : "Submit Feedback"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- useGlobalTheme ---------------- */
function useGlobalTheme() {
  useEffect(() => {
    let mounted = true;
    async function syncTheme() {
      try {
        const res = await fetch(`${BASE_API}/api/theme`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        document.body.classList.remove("default", "dark", "blue");
        document.body.classList.add(json.theme || "default");
      } catch (err) {
        // ignore
      }
    }
    syncTheme();
    const interval = setInterval(syncTheme, 3000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);
}

/* ---------------- StudentTasks ---------------- */
function StudentTasks({ token }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [uploadingAnswer, setUploadingAnswer] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingTasks(true);
      try {
        const res = await fetch(`${BASE_API}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error("Fetch tasks error", err);
        alert(err.message || "Failed to fetch tasks");
      } finally {
        if (mounted) setLoadingTasks(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    if (!selectedTask) {
      setStudentAnswer(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${BASE_API}/api/student-answers/${selectedTask._id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        if (!res.ok) { setStudentAnswer(null); return; }
        const data = await res.json();
        setStudentAnswer(data);
      } catch (err) {
        console.warn("Fetch answer error", err);
        setStudentAnswer(null);
      }
    })();
    return () => { mounted = false; };
  }, [selectedTask, token]);

  const handleAnswerChange = (e) => setAnswerFile(e.target.files[0]);

  const handleSubmitAnswer = async () => {
    if (!answerFile || !selectedTask) {
      alert("Select a file and task first.");
      return;
    }
    setUploadingAnswer(true);
    const fd = new FormData();
    fd.append("answerFile", answerFile);
    try {
      const res = await fetch(`${BASE_API}/api/student-answers/${selectedTask._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      alert("Answer uploaded successfully");
      setStudentAnswer(data);
      setAnswerFile(null);
    } catch (err) {
      console.error("Answer upload error", err);
      alert(err.message || "Failed to upload answer");
    } finally {
      setUploadingAnswer(false);
    }
  };

  const handleCheck = async () => {
    if (!selectedTask) { alert("Select a task first"); return; }
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch(`${BASE_API}/api/check-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskId: selectedTask._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setVerificationResult(data);
    } catch (err) {
      console.error("Check error", err);
      alert(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="tasks-container">
      {loadingTasks && <p>Loading tasks...</p>}
      {!loadingTasks && tasks.length === 0 && <p>No tasks available.</p>}
      {!loadingTasks && tasks.map((task) => (
        <div key={task._id} className="task-card" onClick={() => setSelectedTask(task)}>
          <h3 className="task-title">{task.originalName}</h3>
          <a href={`${BASE_API}${task.fileUrl}`} target="_blank" rel="noreferrer" className="task-link">View Task PDF</a>

          {selectedTask?._id === task._id && (
            <div className="answer-section">
              <h4>Your Answer</h4>
              {studentAnswer ? (
                <p><a href={`${BASE_API}${studentAnswer.fileUrl}`} target="_blank" rel="noreferrer">View uploaded answer</a></p>
              ) : <p>No answer uploaded yet.</p>}

              {studentAnswer && (
                <>
                  <button onClick={handleCheck} disabled={verifying} className="task-btn check">
                    {verifying ? "Checking..." : "Check Answer"}
                  </button>

                  {verificationResult && (
                    <div className="verification-box">
                      <strong>Score:</strong> {verificationResult.score ?? "N/A"}<br />
                      <strong>Feedback:</strong> <div style={{ whiteSpace: "pre-wrap" }}>{verificationResult.feedback ?? "No feedback"}</div>
                      {verificationResult.reportUrl && (
                        <p><a href={`${BASE_API}${verificationResult.reportUrl}`} target="_blank" rel="noreferrer">View Report PDF</a></p>
                      )}
                    </div>
                  )}
                </>
              )}

              <input type="file" accept="application/pdf" onChange={handleAnswerChange} disabled={uploadingAnswer} />
              <button onClick={handleSubmitAnswer} disabled={!answerFile || uploadingAnswer} className="task-btn upload">
                {uploadingAnswer ? "Uploading..." : "Upload Answer"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- StudentConnections Component (complete) ----------------
   This component shows:
    - incoming requests (to the logged-in student)
    - sent requests
    - accepted connections (contacts)
   It uses the backend routes already present in your server file:
    - POST   /api/connect/student/:targetId
    - GET    /api/connect/student/status/:targetId
    - GET    /api/connect/student/requests  (incoming where alumniId == current user)
    - GET    /api/connect/status ... (we use the status endpoint above)
    - PUT    /api/connect/student/requests/:id  (accept/reject)
    - GET    /api/students/connections  (accepted connections)
*/
function StudentConnections({ token }) {
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]); // we will derive 'sent' by calling requests endpoint or by filtering connections
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      try {
        // Incoming requests for current student
        const incRes = await fetch(`${BASE_API}/api/connect/student/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const incJson = await incRes.json();
        const incomingList = Array.isArray(incJson.requests) ? incJson.requests : (Array.isArray(incJson) ? incJson : []);
        // Normalize: inc requests include studentId populated (requester)
        // Some endpoints return { success:true, requests: [...] } or just [...], so handle both
        // Fetch accepted connections
        const conRes = await fetch(`${BASE_API}/api/students/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const conJson = await conRes.json();
        const acceptedList = Array.isArray(conJson) ? conJson : (Array.isArray(conJson.connections) ? conJson.connections : []);
        // To get "sent" requests (requests we sent), backend doesn't have a dedicated "sent" endpoint earlier.
        // We can fetch all connections where requesterId == me OR where studentId==me and status pending.
        // But backend earlier had Connection model with studentId/alumniId; we will try an endpoint fallback:
        // Try GET /api/alumni/requests? (not relevant) -> Instead use /api/students/connections + /api/connect/student/requests/sent if available.
        let sentList = [];
        try {
          const sentRes = await fetch(`${BASE_API}/api/connect/student/requests/sent`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (sentRes.ok) {
            const sentJson = await sentRes.json();
            sentList = Array.isArray(sentJson.requests) ? sentJson.requests : (Array.isArray(sentJson) ? sentJson : []);
          }
        } catch (e) {
          // server may not have 'sent' endpoint — fallback: try to infer from incoming or connections (best-effort)
          sentList = [];
        }

        if (!mounted) return;
        setIncoming(incomingList);
        setConnections(acceptedList);
        setSent(sentList);
      } catch (err) {
        console.error("StudentConnections fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAll();
    return () => (mounted = false);
  }, [token, refreshCounter]);

  const refresh = () => setRefreshCounter((c) => c + 1);

  const acceptOrReject = async (id, action) => {
    // action = 'accept' | 'reject'
    setProcessingId(id);
    try {
      const res = await fetch(`${BASE_API}/api/connect/student/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Unable to update request");
      alert(data.message || `Request ${action}ed`);
      refresh();
    } catch (err) {
      console.error("Accept/reject error", err);
      alert(err.message || "Failed to update request");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="connections-root" style={{ padding: 12 }}>
      <h3>Connections</h3>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <h4>Incoming Requests</h4>
          {loading ? <p>Loading...</p> : incoming.length === 0 ? <p>No incoming requests</p> : (
            incoming.map((req) => {
              const requester = req.studentId || req.requesterId || req.student || {};
              return (
                <div key={req._id || requester._id} className="request-row">
                  <img src={getProfileImageUrl(requester.profilePicUrl)} alt="p" style={{ width: 48, height: 48, borderRadius: 24 }} />
                  <div style={{ flex: 1, marginLeft: 8 }}>
                    <div style={{ fontWeight: 700 }}>{requester.firstName} {requester.lastName}</div>
                    <div style={{ fontSize: 12 }}>{requester.roleIdValue || requester.email}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => acceptOrReject(req._id, "accept")} disabled={processingId === req._id} className="action-btn">Accept</button>
                    <button onClick={() => acceptOrReject(req._id, "reject")} disabled={processingId === req._id} className="logout-button">Reject</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <h4>Sent Requests</h4>
          {loading ? <p>Loading...</p> : (sent.length === 0 ? <p>No sent requests</p> : (
            sent.map((r) => {
              const receiver = r.alumniId || r.receiverId || r.target || {};
              const id = r._id || r.requestId || `${receiver._id}-${Math.random()}`;
              return (
                <div key={id} className="request-row">
                  <img src={getProfileImageUrl(receiver.profilePicUrl)} alt="p" style={{ width: 48, height: 48, borderRadius: 24 }} />
                  <div style={{ flex: 1, marginLeft: 8 }}>
                    <div style={{ fontWeight: 700 }}>{receiver.firstName} {receiver.lastName}</div>
                    <div style={{ fontSize: 12 }}>{receiver.roleIdValue || receiver.email}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }}>{r.status || "pending"}</div>
                </div>
              );
            })
          ))}
        </div>

        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <h4>Connections</h4>
          {loading ? <p>Loading...</p> : connections.length === 0 ? <p>No connections yet</p> : (
            connections.map((c) => {
              // connection schema might return studentId/alumniId populated
              const other = (c.studentId && c.studentId._id) ? c.studentId : (c.alumniId && c.alumniId._id) ? c.alumniId : c;
              const id = other._id || `${other.email || Math.random()}`;
              return (
                <div key={id} className="connection-row">
                  <img src={getProfileImageUrl(other.profilePicUrl)} alt="p" style={{ width: 48, height: 48, borderRadius: 24 }} />
                  <div style={{ marginLeft: 8 }}>
                    <div style={{ fontWeight: 700 }}>{other.firstName} {other.lastName}</div>
                    <div style={{ fontSize: 12 }}>{other.roleIdValue || other.email}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={refresh} className="action-btn">Refresh</button>
      </div>
    </div>
  );
}

/* ---------------- MAIN STUDENT COMPONENT ---------------- */
export default function Student() {
  useGlobalTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem("token_student");

  // user state
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  // layout/menu state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMain, setActiveMain] = useState("Home");
  const [activeSub, setActiveSub] = useState(null);

  // search
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchAbortRef = useRef(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // announcements
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);

  // assignments/syllabus
  const [assignments, setAssignments] = useState([]);
  const [unitUploadedFiles, setUnitUploadedFiles] = useState({});
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [expandedSyllabusSubject, setExpandedSyllabusSubject] = useState(null);

  // social
  const [showSocial, setShowSocial] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState(false);

  // menu definition (same as your earlier)
  const menu = [
    { label: "Home", icon: "🏠", subLinks: [] },
    {
      label: "Academics",
      icon: "📚",
      subLinks: [
        { label: "Attendance", key: "academics-attendance" },
        { label: "Courses", key: "academics-courses" },
        { label: "Grades", key: "academics-grades" },
      ],
    },
    {
      label: "Syllabus",
      icon: "📄",
      subLinks: [
        {
          label: "Physics",
          key: "syllabus-physics",
          subLinks: [
            { label: "UNIT-I", key: "syllabus-physics-unit1" },
            { label: "UNIT-II", key: "syllabus-physics-unit2" },
            { label: "UNIT-III", key: "syllabus-physics-unit3" },
          ],
        },
        {
          label: "Chemistry",
          key: "syllabus-chemistry",
          subLinks: [
            { label: "UNIT-I", key: "syllabus-chemistry-unit1" },
            { label: "UNIT-II", key: "syllabus-chemistry-unit2" },
            { label: "UNIT-III", key: "syllabus-chemistry-unit3" },
          ],
        },
        {
          label: "Maths",
          key: "syllabus-maths",
          subLinks: [
            { label: "UNIT-I", key: "syllabus-maths-unit1" },
            { label: "UNIT-II", key: "syllabus-maths-unit2" },
            { label: "UNIT-III", key: "syllabus-maths-unit3" },
          ],
        },
      ],
    },
    { label: "Quiz/Assignments", icon: "📝", subLinks: [] },
    { label: "Tasks", icon: "📝", subLinks: [] },
    { label: "Personalisation Tracker", icon: "📈", subLinks: [] },
    { label: "Internships", icon: "💼", subLinks: [] },
    { label: "Live Projects", icon: "💻", subLinks: [] },
    { label: "Certifications", icon: "🎓", subLinks: [] },
    { label: "Alumni Arena", icon: "🤝", subLinks: [] },
    {
      label: "Top Rankers",
      icon: "🏆",
      subLinks: [
        { label: "Individual", key: "toprankers-individual" },
        { label: "School Ranking", key: "toprankers-school" },
      ],
    },
    { label: "Student Connections", icon: "🔗", subLinks: [] },
  ];

  // fetch user profile on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) { navigate("/login"); return; }
        const res = await fetch(`${BASE_API}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        if (!res.ok) throw new Error("Failed to fetch profile");
        const json = await res.json();
        setUser(json.user);
      } catch (err) {
        console.error("Profile fetch error", err);
        localStorage.removeItem("token_student");
        navigate("/login");
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();
    return () => (mounted = false);
  }, [token, navigate]);

  // prefetch assignments & syllabus uploads
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const aRes = await fetch(`${BASE_API}/api/assignments`, { headers: { Authorization: `Bearer ${token}` } });
        if (aRes.ok) {
          const aJson = await aRes.json();
          if (mounted) setAssignments(aJson);
        }
      } catch (err) {
        console.warn("Assignments prefetch failed", err);
      }

      try {
        const sRes = await fetch(`${BASE_API}/api/syllabus`, { headers: { Authorization: `Bearer ${token}` } });
        if (sRes.ok) {
          const sJson = await sRes.json();
          const map = {};
          (sJson || []).forEach((u) => { if (u.uploadedFileUrl) map[u.key] = u.uploadedFileUrl; });
          if (mounted) setUnitUploadedFiles(map);
        }
      } catch (err) {
        console.warn("Syllabus fetch failed", err);
      }
    })();
    return () => (mounted = false);
  }, [token]);

  // fetch announcements for the user
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${BASE_API}/api/announcements/active`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        if (!res.ok) throw new Error("Failed to fetch announcements");
        const json = await res.json();
        const arr = Array.isArray(json) ? json : (json.announcements || []);
        setAnnouncements(arr);
        if (arr.length > 0) {
          setCurrentAnnouncement(arr[0]);
          setShowAnnouncementPopup(true);
        }
      } catch (err) {
        console.warn("Announcement fetch failed", err);
      }
    })();
    return () => (mounted = false);
  }, [user, token]);

  // menu filter (left nav)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMenu(menu);
      return;
    }
    const q = searchTerm.toLowerCase();
    const filtered = menu.map((m) => {
      const subs = (m.subLinks || []).filter((s) => (s.label || "").toLowerCase().includes(q));
      if ((m.label || "").toLowerCase().includes(q) || subs.length > 0) return { ...m, subLinks: subs };
      return null;
    }).filter(Boolean);
    setFilteredMenu(filtered);
  }, [searchTerm]);

  // debounced global search (students, assignments, tasks, menu)
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      if (searchAbortRef.current) { try { searchAbortRef.current.abort(); } catch {} searchAbortRef.current = null; }
      return;
    }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      if (searchAbortRef.current) { try { searchAbortRef.current.abort(); } catch {} }
      const ac = new AbortController();
      searchAbortRef.current = ac;
      const q = searchTerm.trim();
      try {
        // Student search
        const sRes = await fetch(`${BASE_API}/api/students/search?query=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        let studentResults = [];
        if (sRes.ok) {
          const sJson = await sRes.json();
          // backend returns array of students
          if (Array.isArray(sJson)) studentResults = sJson.map((s) => ({ type: "Student", data: s }));
          else if (sJson.success && Array.isArray(sJson.students)) studentResults = sJson.students.map((s) => ({ type: "Student", data: s }));
        }

        // local assignments
        const locals = [];
        if (Array.isArray(assignments)) {
          assignments.forEach((a) => {
            if (a.originalName && a.originalName.toLowerCase().includes(q.toLowerCase())) locals.push({ type: "Assignment", data: a, label: a.originalName });
          });
        }

        // tasks
        try {
          const tRes = await fetch(`${BASE_API}/api/tasks`, { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal });
          if (tRes.ok) {
            const tJson = await tRes.json();
            (tJson || []).forEach((t) => {
              if (t.originalName && t.originalName.toLowerCase().includes(q.toLowerCase())) locals.push({ type: "Task", data: t, label: t.originalName });
            });
          }
        } catch (e) {
          // ignore tasks fetch failure
        }

        // menu match
        menu.forEach((m) => {
          if ((m.label || "").toLowerCase().includes(q)) locals.push({ type: "Menu", label: m.label, data: m });
          else if (Array.isArray(m.subLinks)) {
            m.subLinks.forEach((s) => {
              if ((s.label || "").toLowerCase().includes(q)) locals.push({ type: "Menu", label: `${m.label} > ${s.label}`, data: s });
              if (s.subLinks && Array.isArray(s.subLinks)) {
                s.subLinks.forEach((u) => {
                  if ((u.label || "").toLowerCase().includes(q)) locals.push({ type: "Menu", label: `${m.label} > ${s.label} > ${u.label}`, data: u });
                });
              }
            });
          }
        });

        const combined = [...studentResults, ...locals];
        setSearchResults(combined);
      } catch (err) {
        if (err.name === "AbortError") {
          // ignore
        } else {
          console.warn("Search error", err);
          setSearchResults([]);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, token, assignments]);

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  const handleMainClick = (label) => {
    setActiveMain(label);
    const mainItem = menu.find((m) => m.label === label);
    if (mainItem && mainItem.subLinks && mainItem.subLinks.length > 0) {
      setActiveSub(mainItem.subLinks[0].key);
    } else {
      setActiveSub(null);
    }
  };

  const handleSubClick = (key) => {
    setActiveSub(key);
    if (unitUploadedFiles[key]) setSelectedPdf(`${BASE_API}${unitUploadedFiles[key]}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token_student");
    navigate("/login");
  };

  const handleUpdateProfilePic = (profilePicUrl) => setUser((u) => ({ ...u, profilePicUrl }));

  const handleProfileUpdate = (newUser) => setUser(newUser);

  const handleGenerateQuiz = (assignmentId) => navigate(`/quiz/${assignmentId}`);

  const handleSelectSearchResult = (result) => {
    if (!result) return;
    if (result.type === "Student") {
      setSelectedStudent(result.data);
      setShowStudentModal(true);
      setSearchTerm("");
      setSearchResults([]);
    } else if (result.type === "Assignment") {
      if (result.data?.fileUrl) window.open(`${BASE_API}${result.data.fileUrl}`, "_blank");
      else alert("Opening assignment: " + result.label);
    } else if (result.type === "Task") {
      setActiveMain("Tasks");
    } else if (result.type === "Menu") {
      if (result.data?.key) {
        // find parent
        const key = result.data.key;
        const foundMain = menu.find((m) => {
          if (m.subLinks && m.subLinks.find((s) => s.key === key)) return true;
          return m.subLinks && m.subLinks.some((s) => s.subLinks && s.subLinks.find((u) => u.key === key));
        });
        if (foundMain) {
          setActiveMain(foundMain.label);
          setActiveSub(key);
        } else {
          // top-level menu
          setActiveMain(result.label);
        }
      } else setActiveMain(result.label);
    } else {
      alert(`${result.type}: ${result.label || JSON.stringify(result)}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) handleSelectSearchResult(searchResults[0]);
    }
  };

  const closeAnnouncementPopup = () => {
    const idx = announcements.findIndex((a) => a._id === currentAnnouncement?._id);
    const next = idx + 1;
    if (next < announcements.length) {
      setCurrentAnnouncement(announcements[next]);
    } else {
      setShowAnnouncementPopup(false);
      setCurrentAnnouncement(null);
    }
  };

  // content area selection
  let contentArea = <div>Select a menu item to view its content.</div>;
  if (activeMain === "Home") contentArea = <HomeDashboard token={token} />;
  else if (activeMain === "Academics" && activeSub === "academics-attendance") contentArea = <AttendanceDashboard token={token} />;
  else if (activeMain === "Quiz/Assignments") contentArea = (
    <div className="assignments-container">
      {assignments.length === 0 ? <p>No assignments available.</p> : (
        <div className="assignment-cards">
          {assignments.map(({ _id, originalName, fileUrl }) => (
            <div key={_id} className="assignment-card">
              <a href={`${BASE_API}${fileUrl}`} target="_blank" rel="noopener noreferrer" className="assignment-link">{originalName}</a>
              <button className="generate-quiz-btn" onClick={() => handleGenerateQuiz(_id)}>Generate Quiz</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  else if (activeMain === "Academics" && activeSub === "academics-grades") contentArea = <Grades token={token} />;
  else if (activeMain === "Personalisation Tracker") contentArea = <div style={{ padding: "2rem 1rem" }}><QuizPerformanceChart /></div>;
  else if (activeMain === "Certifications") contentArea = <CourseraCertifications token={token} />;
  else if (activeMain === "Top Rankers" && activeSub === "toprankers-individual") contentArea = <IndividualLeaderboard />;
  else if (activeMain === "Tasks") contentArea = <StudentTasks token={token} />;
  else if (activeMain === "Alumni Arena") contentArea = <AlumniArena token={token} />;
  else if (activeMain === "Syllabus" && selectedPdf) contentArea = (
    <div className="pdf-viewer-container">
      <iframe src={selectedPdf} title="Syllabus PDF" width="100%" height="600px" style={{ border: "none", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }} />
    </div>
  );
  else if (activeMain === "Internships") contentArea = (
    <div className="opportunities-container"> {/* ... (kept short for brevity) */}
      <h3 className="section-title">Internship Opportunities</h3>
      <div className="card-list">
        <div className="opportunity-card">
          <h4>Frontend Developer Intern</h4>
          <p>Work with React and TailwindCSS to build dynamic dashboards.</p>
          <p><strong>Duration:</strong> 3 Months</p>
          <p><strong>Location:</strong> Remote</p>
          <button className="apply-btn">Apply Now</button>
        </div>
        <div className="opportunity-card">
          <h4>Backend Developer Intern</h4>
          <p>Assist in building REST APIs using Node.js and MongoDB.</p>
          <p><strong>Duration:</strong> 2 Months</p>
          <p><strong>Location:</strong> Hybrid (Delhi)</p>
          <button className="apply-btn">Apply Now</button>
        </div>
      </div>
    </div>
  );
  else if (activeMain === "Live Projects") contentArea = (
    <div className="opportunities-container">
      <h3 className="section-title">Ongoing Live Projects</h3>
      <div className="card-list">
        <div className="opportunity-card">
          <h4>NeuraLiftX Student Portal</h4>
          <p>Collaborate on enhancing the student–alumni system using MERN stack.</p>
          <p><strong>Tech Stack:</strong> React, Node.js, MongoDB</p>
          <button className="contribute-btn">Contribute</button>
        </div>
        <div className="opportunity-card">
          <h4>AI Notes Summarizer</h4>
          <p>Help build a tool that summarizes lecture notes using NLP.</p>
          <button className="contribute-btn">Contribute</button>
        </div>
      </div>
    </div>
  );
  else if (activeMain === "Top Rankers" && activeSub === "toprankers-school") contentArea = (
    <div className="opportunities-container"><h3 className="section-title">Top Ranked Schools</h3></div>
  );
  else if (activeMain === "Student Connections") contentArea = <StudentConnections token={token} />;
  // else default contentArea remains.

  return (
    <div className="student-root">
      <header className="student-header">
        <button className="hamburger" aria-label="Toggle menu" onClick={toggleSidebar}>
          <span /><span /><span />
        </button>
        <div className="header-brand">
          <img src={logo} alt="EduConnect Logo" className="header-logo" />
          <span className="header-title">EduConnect</span>
        </div>

        <div className="search-bar" style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search by name, UID or page..."
            aria-label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoComplete="off"
          />
          <button aria-label="Search" onClick={() => { if (searchResults.length > 0) handleSelectSearchResult(searchResults[0]); }} className="search-icon-button">
            <span className="search-icon">&#128269;</span>
          </button>

          {(searchResults.length > 0 || searchLoading) && (
            <div className="search-results-dropdown" style={{ position: "absolute", top: "110%", left: 0, right: 0, zIndex: 1200, background: "#fff", color: "#000", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", maxHeight: 360, overflow: "auto", padding: 8 }}>
              {searchLoading && <div style={{ padding: 12, textAlign: "center" }}><div className="spinner" style={{ width: 24, height: 24, margin: "0 auto" }}></div></div>}
              {!searchLoading && searchResults.length === 0 && <div style={{ padding: 12 }}>No results.</div>}
              {!searchLoading && searchResults.map((r, idx) => (
                <div key={idx} onClick={(e) => { e.stopPropagation(); handleSelectSearchResult(r); }} style={{ display: "flex", gap: 12, padding: "8px 10px", alignItems: "center", cursor: "pointer", borderRadius: 6, transition: "background .12s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  {r.type === "Student" ? (
                    <>
                      <img src={getProfileImageUrl(r.data.profilePicUrl)} alt="p" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{r.data.firstName} {r.data.lastName}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>{r.data.roleIdValue} • {r.data.className || ""}</div>
                        <div style={{ fontSize: 11, color: "#666" }}>{r.data.bio ? (r.data.bio.length > 60 ? r.data.bio.substring(0, 60) + "..." : r.data.bio) : ""}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>Student</div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: "#f1f1f1", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14 }}>{r.type[0]}</span></div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{r.label}</div><div style={{ fontSize: 12, color: "#555" }}>{r.type}</div></div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="header-icons">
          <span className="icon" title="Notifications">&#128276;</span>
          <span className="icon" title="Social" onClick={() => { setLoadingSocial(true); setShowSocial(true); setTimeout(() => setLoadingSocial(false), 600); }} style={{ cursor: "pointer", fontSize: 24 }}>&#128172;</span>
          <span className="icon" title="Home" onClick={() => handleMainClick("Home")} style={{ cursor: "pointer" }}>&#8962;</span>
          <span className="icon" title="Settings">&#9881;</span>
        </div>

        <div className="profile-info" style={{ cursor: "pointer" }} onClick={() => document.location = "/profile"}>
          <span className="profile-name">{user?.firstName} {user?.lastName}</span>
          <span className="profile-uid">{user?.roleIdValue}</span>
          <img src={getProfileImageUrl(user?.profilePicUrl)} alt="Profile" className="profile-pic" />
        </div>

        {user && <CoinBadge coins={user.coins || 0} />}
      </header>

      <div className={`student-layout ${sidebarOpen ? "" : "closed"}`}>
        <nav className={`student-sidebar${sidebarOpen ? "" : " closed"}`}>
          <ul>
            {filteredMenu.map((main) => (
              <li key={main.label}>
                <button className={`main-link${activeMain === main.label ? " active" : ""}`} onClick={() => handleMainClick(main.label)}>
                  <span className="main-icon">{main.icon}</span> {main.label}
                </button>

                {activeMain === main.label && main.subLinks && main.subLinks.length > 0 && (
                  <ul className="sub-links open">
                    {main.subLinks.map((sub) => {
                      const isSyllabus = main.label === "Syllabus";
                      const isExpanded = expandedSyllabusSubject === sub.key;
                      return (
                        <li key={sub.key}>
                          <button className={`sub-link${activeSub === sub.key ? " active" : ""}`} onClick={() => {
                            if (isSyllabus) {
                              setExpandedSyllabusSubject(isExpanded ? null : sub.key);
                              setActiveSub(sub.key);
                            } else handleSubClick(sub.key);
                          }}>{sub.label}</button>

                          {isSyllabus && isExpanded && sub.subLinks && (
                            <ul className="unit-sub-links">
                              {sub.subLinks.map((unit) => (
                                <li key={unit.key}>
                                  <button className={`sub-link${activeSub === unit.key ? " active" : ""}`} onClick={() => handleSubClick(unit.key)}>{unit.label}</button>
                                  {unitUploadedFiles[unit.key] && <a href={`${BASE_API}${unitUploadedFiles[unit.key]}`} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>View PDF</a>}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main className="student-content">
          {loadingSocial ? (
            <div className="loader-container"><div className="spinner"></div><p>Loading...</p></div>
          ) : showSocial ? (
            <Suspense fallback={<div className="loader-container"><div className="spinner"></div><p>Loading...</p></div>}>
              <StudentConnections token={token} />
              <Social />
            </Suspense>
          ) : contentArea}
        </main>
      </div>

      {/* Modals */}
      {user && <ProfileModal user={user} token={token} onClose={() => { /* the profile modal is triggered by profile button not here */ }} onLogout={handleLogout} onUpdateProfilePic={handleUpdateProfilePic} onProfileUpdate={handleProfileUpdate} />}

      {showStudentModal && selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          token={token}
          onClose={() => { setShowStudentModal(false); setSelectedStudent(null); }}
          onConnected={() => {
            // refresh suggestion/search lists if needed
            setShowStudentModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {showAnnouncementPopup && currentAnnouncement && (
        <AnnouncementPopup announcement={currentAnnouncement} onClose={closeAnnouncementPopup} token={token} />
      )}
    </div>
  );
}
