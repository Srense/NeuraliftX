import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AlumniArena.css";

const AlumniArena = ({ token }) => {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch all alumni + their connection status
  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await axios.get("https://neuraliftx.onrender.com/api/alumni", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let list = [];
        if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.data.alumni)) list = res.data.alumni;

        // ✅ Fetch connection status for each alumni
        const updatedList = await Promise.all(
          list.map(async (alum) => {
            try {
              const statusRes = await axios.get(
  `https://neuraliftx.onrender.com/api/connect/status/${alum.userId?._id || alum._id}`,
  { headers: { Authorization: `Bearer ${token}` } }
);


              return {
                ...alum,
                connectionStatus: statusRes.data.status || "not_sent",
              };
            } catch {
              return { ...alum, connectionStatus: "not_sent" };
            }
          })
        );

        setAlumniList(updatedList);
      } catch (err) {
        console.error("❌ Error fetching alumni:", err);
        setError("Failed to fetch alumni");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchAlumni();
  }, [token]);

  // ✅ Handle connect button click
  const handleConnect = async (alumniId) => {
    try {
      const res = await axios.post(
        `https://neuraliftx.onrender.com/api/connect/${alumniId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ When request is created → set status to pending
      if (res.data.success && res.data.connection?.status === "pending") {
        setAlumniList((prev) =>
          prev.map((alum) =>
            alum._id === alumniId
              ? { ...alum, connectionStatus: "pending" }
              : alum
          )
        );
      } else if (res.data.status) {
        // If backend says already accepted/pending/rejected
        setAlumniList((prev) =>
          prev.map((alum) =>
            alum._id === alumniId
              ? { ...alum, connectionStatus: res.data.status }
              : alum
          )
        );
      } else {
        alert(res.data.message || "Failed to send request");
      }
    } catch (err) {
      console.error("❌ Error sending connection request:", err);
      alert("Failed to send connection request");
    }
  };

  // ✅ Reload connection status from backend after alumni accepts/rejects
  const refreshStatus = async () => {
    try {
      const updated = await Promise.all(
        alumniList.map(async (alum) => {
          try {
            const statusRes = await axios.get(
              `https://neuraliftx.onrender.com/api/connect/status/${alum._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return { ...alum, connectionStatus: statusRes.data.status || "not_sent" };
          } catch {
            return alum;
          }
        })
      );
      setAlumniList(updated);
    } catch (err) {
      console.error("Error refreshing connection statuses:", err);
    }
  };

  // 🔁 Auto-refresh every 15 seconds (to update from alumni approvals)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [alumniList, token]);

  if (loading) return <p className="alumni-loading">Loading alumni...</p>;
  if (error) return <p className="alumni-error">{error}</p>;

  return (
    <div className="alumni-arena-container">
      <h2 className="alumni-title">Alumni Arena</h2>

      {alumniList.length === 0 ? (
        <p className="alumni-empty">No alumni have registered yet.</p>
      ) : (
        <div className="alumni-grid">
          {alumniList.map((alum) => (
            <div key={alum._id} className="alumni-card">
              <h3>
                {alum.firstName} {alum.lastName}
              </h3>
              <p>
                <strong>Company:</strong> {alum.company || "N/A"}
              </p>
              {alum.description && (
                <p>
                  <strong>About:</strong> {alum.description}
                </p>
              )}

              {/* ✅ Connection button with real-time status */}
              <button
                className={`connect-btn status-${alum.connectionStatus}`}
                onClick={() => handleConnect(alum._id)}
                disabled={
                  alum.connectionStatus === "pending" ||
                  alum.connectionStatus === "accepted"
                }
              >
                {alum.connectionStatus === "not_sent" && "Connect"}
                {alum.connectionStatus === "pending" && "Pending..."}
                {alum.connectionStatus === "accepted" && "Connected ✅"}
                {alum.connectionStatus === "rejected" && "Rejected ❌"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlumniArena;
