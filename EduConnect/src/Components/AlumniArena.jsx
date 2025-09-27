import React, { useEffect, useState } from "react";
import axios from "axios";


const AlumniArena = ({ token }) => {
  const [alumniList, setAlumniList] = useState([]); // ✅ always start as array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await axios.get("https://neuraliftx.onrender.com/api/alumni", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Ensure array handling
        if (Array.isArray(res.data)) {
          setAlumniList(res.data);
        } else if (Array.isArray(res.data.alumni)) {
          setAlumniList(res.data.alumni);
        } else {
          setAlumniList([]);
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch alumni");
        setLoading(false);
      }
    };

    fetchAlumni();
  }, [token]);

  const handleConnect = (alumniId) => {
    alert(`Connect request sent to alumni with ID: ${alumniId}`);
    // Later → make API POST: /api/connect/:alumniId
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
              <button
                className="connect-btn"
                onClick={() => handleConnect(alum._id)}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlumniArena;
