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

        // Backend always returns { success, alumni: [...] }
        let list = Array.isArray(res.data.alumni) ? res.data.alumni : [];

        // ✅ Fetch connection status for each alumni (use userId._id not alumni._id)
        const updatedList = await Promise.all(
          list.map(async (alum) => {
            try {
              const statusRes = await axios.get(
                `https://neuraliftx.onrender.com/api/connect/status/${alum.userId._id}`,
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
        console.error("Error fetching alumni:", err);
        setError("Failed to fetch alumni");
        setLoading(false);
      }
    };

    fetchAlumni();
  }, [token]);

  const handleConnect = async (alumniUserId) => {
    try {
      const res = await axios.post(
        `https://neuraliftx.onrender.com/api/connect/${alumniUserId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAlumniList((prev) =>
          prev.map((alum) =>
            alum.userId._id === alumniUserId
              ? { ...alum, connectionStatus: "pending" }
              : alum
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
              <p>
                <strong>Designation:</strong> {alum.designation || "N/A"}
              </p>
              {alum.description && (
                <p>
                  <strong>About:</strong> {alum.description}
                </p>
              )}
              <p>
                <strong>Email:</strong> {alum.userId?.email}
              </p>

              {/* ✅ Connect Button with status */}
              <button
                className={`connect-btn status-${alum.connectionStatus}`}
                onClick={() => handleConnect(alum.userId._id)} // use userId
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
