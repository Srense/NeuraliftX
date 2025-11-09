import React, { useState, useEffect } from "react";
import "./Student.css";

/**
 * StudentConnections Component
 * ---------------------------------------
 * Handles:
 * - Viewing sent + received connection requests
 * - Accepting / Rejecting incoming requests
 * - Showing connected students list
 * - Unified design consistent with Student dashboard
 */
export default function StudentConnections({ token }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("connections"); // 'connections' | 'received' | 'sent'

  useEffect(() => {
    if (!token) return;
    fetchAllData();
  }, [token]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [reqRes, connRes, sentRes] = await Promise.all([
        fetch("https://neuraliftx.onrender.com/api/student/requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://neuraliftx.onrender.com/api/student/connections", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://neuraliftx.onrender.com/api/student/requests/sent", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [requestsData, connectionsData, sentData] = await Promise.all([
        reqRes.ok ? reqRes.json() : [],
        connRes.ok ? connRes.json() : [],
        sentRes.ok ? sentRes.json() : [],
      ]);

      setPendingRequests(Array.isArray(requestsData) ? requestsData : []);
      setConnections(Array.isArray(connectionsData) ? connectionsData : []);
      setSentRequests(Array.isArray(sentData) ? sentData : []);
    } catch (e) {
      console.error("Error fetching connections data", e);
      alert("Error loading connection data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/student/requests/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: action }),
        }
      );
      if (!res.ok) throw new Error("Failed to update request");
      alert(`Request ${action}ed successfully.`);
      fetchAllData(); // Refresh all data
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm("Are you sure you want to remove this connection?"))
      return;
    try {
      const res = await fetch(
        `https://neuraliftx.onrender.com/api/student/connections/${connectionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to remove connection");
      alert("Connection removed successfully.");
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getProfileImageUrl = (url) =>
    url
      ? `https://neuraliftx.onrender.com${url}`
      : "https://via.placeholder.com/50";

  const renderCard = (person, actions) => (
    <div key={person._id || Math.random()} className="request-card">
      <img
        src={getProfileImageUrl(person.profilePicUrl)}
        alt="Profile"
        className="request-avatar"
      />
      <div className="request-info">
        <p>
          <strong>
            {person.firstName} {person.lastName}
          </strong>
        </p>
        <p>{person.email}</p>
        {person.className && <p>Class: {person.className}</p>}
      </div>
      <div className="request-actions">{actions}</div>
    </div>
  );

  const renderView = () => {
    if (loading) return <p>Loading connections...</p>;

    switch (view) {
      case "connections":
        return (
          <>
            <h3>Connected Students</h3>
            {connections.length === 0 ? (
              <p>No active connections.</p>
            ) : (
              <div className="requests-list">
                {connections.map((c) =>
                  renderCard(c.connectedStudent || c.studentId || c.alumniId, (
                    <button
                      onClick={() => handleRemoveConnection(c._id)}
                      className="reject-btn"
                    >
                      Remove
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        );

      case "received":
        return (
          <>
            <h3>Pending Requests (Received)</h3>
            {pendingRequests.length === 0 ? (
              <p>No pending requests.</p>
            ) : (
              <div className="requests-list">
                {pendingRequests.map((r) =>
                  renderCard(r.studentId, (
                    <>
                      <button
                        onClick={() => handleAction(r._id, "accepted")}
                        className="accept-btn"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(r._id, "rejected")}
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </>
                  ))
                )}
              </div>
            )}
          </>
        );

      case "sent":
        return (
          <>
            <h3>Sent Requests</h3>
            {sentRequests.length === 0 ? (
              <p>No sent requests.</p>
            ) : (
              <div className="requests-list">
                {sentRequests.map((r) =>
                  renderCard(r.receiverId || r.studentId || {}, (
                    <span className="pending-tag">Pending</span>
                  ))
                )}
              </div>
            )}
          </>
        );

      default:
        return <p>Invalid view selected.</p>;
    }
  };

  return (
    <div className="connections-container">
      <h2>Student Connections</h2>

      <div className="connections-tabs">
        <button
          className={`tab-btn ${view === "connections" ? "active" : ""}`}
          onClick={() => setView("connections")}
        >
          Connections
        </button>
        <button
          className={`tab-btn ${view === "received" ? "active" : ""}`}
          onClick={() => setView("received")}
        >
          Received Requests
        </button>
        <button
          className={`tab-btn ${view === "sent" ? "active" : ""}`}
          onClick={() => setView("sent")}
        >
          Sent Requests
        </button>
      </div>

      <div className="connections-content">{renderView()}</div>
    </div>
  );
}
