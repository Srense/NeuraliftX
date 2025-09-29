import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AlumniArena.css";

const AlumniArena = ({ token }) => {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await axios.get("https://neuraliftx.onrender.com/api/alumni", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ensure array handling
        let list = [];
        if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.data.alumni)) list = res.data.alumni;

        // ✅ Fetch connection status for each alumni
        const updatedList = await Promise.all(
          list.map(async (alum) => {
            try {
              const statusRes = await axios.get(
                `https://neuraliftx.onrender.com/api/connect/status/${alum._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return { ...alum, connectionStatus: statusRes.data.status || "not_sent" };
            } catch {
              return { ...alum, connectionStatus: "not_sent" };
            }
          })
        );

        setAlumniList(updatedList);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch alumni");
        setLoading(false);
      }
    };

    fetchAlumni();
  }, [token]);

  const handleConnect = async (alumniId) => {
    try {
      const res = await axios.post(
        `https://neuraliftx.onrender.com/api/connect/${alumniId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAlumniList((prev) =>
          prev.map((alum) =>
            alum._id === alumniId ? { ...alum, connectionStatus: "pending" } : alum
          )
        );
      }
    } catch (err) {
      console.error("Error sending connection request:", err);
    }
  };

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
              <h3>{alum.name}</h3>
              <p>
                <strong>Company:</strong> {alum.company || "N/A"}
              </p>
              {alum.description && (
                <p>
                  <strong>About:</strong> {alum.description}
                </p>
              )}

              {/* ✅ Connect Button with status */}
              <button
                className={`connect-btn status-${alum.connectionStatus}`}
                onClick={() => handleConnect(alum._id)}
                disabled={alum.connectionStatus === "pending" || alum.connectionStatus === "accepted"}
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
