import React, { useEffect, useState } from "react";

const StudentConnections = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // Fetch incoming requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/connect/student/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("❌ Failed to load connection requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle Accept / Reject
  const handleAction = async (id, action) => {
    try {
      setProcessingId(id);
      const res = await fetch(`${BASE_URL}/api/connect/student/requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (data.success) {
        setRequests((prev) => prev.filter((req) => req._id !== id));
      } else {
        alert(data.error || "Failed to update request");
      }
    } catch (err) {
      console.error("Error updating request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading requests...</div>;
  }

  if (!requests.length) {
    return <div className="text-center py-8 text-gray-500">No new connection requests ✨</div>;
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Incoming Connection Requests</h2>
      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req._id}
            className="flex items-center justify-between border p-4 rounded-xl hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              <img
                src={req.studentId?.profilePicUrl || "/default-avatar.png"}
                alt="Student"
                className="w-12 h-12 rounded-full border"
              />
              <div>
                <h3 className="font-semibold text-gray-800">
                  {req.studentId?.firstName} {req.studentId?.lastName}
                </h3>
                <p className="text-sm text-gray-600">{req.studentId?.email}</p>
                <p className="text-xs text-gray-500">
                  UID: {req.studentId?.roleIdValue} | Class: {req.studentId?.className || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAction(req._id, "accept")}
                disabled={processingId === req._id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction(req._id, "reject")}
                disabled={processingId === req._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentConnections;
