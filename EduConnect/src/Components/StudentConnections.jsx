import React, { useState, useEffect } from "react";

const BASE_API = "https://neuraliftx.onrender.com"; // Change if running locally

export default function StudentConnections({ token }) {
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const safeArray = (val) =>
    Array.isArray(val)
      ? val
      : Array.isArray(val?.requests)
      ? val.requests
      : Array.isArray(val?.connections)
      ? val.connections
      : [];

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [incomingRes, sentRes, connRes] = await Promise.all([
          fetch(`${BASE_API}/api/connect/student/requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_API}/api/connect/student/requests/sent`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_API}/api/students/connections`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const incomingJson = await incomingRes.json().catch(() => []);
        const sentJson = await sentRes.json().catch(() => []);
        const connJson = await connRes.json().catch(() => []);

        setIncoming(safeArray(incomingJson));
        setSent(safeArray(sentJson));
        setConnections(safeArray(connJson));
      } catch (err) {
        console.error("Error fetching connections:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, refreshKey]);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${BASE_API}/api/connect/student/requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      alert(`Request ${action}ed successfully.`);
      refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getImage = (url) =>
    url ? `${BASE_API}${url}` : "https://via.placeholder.com/50";

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading connections...
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md border">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Student Connections
      </h2>

      {/* Incoming Requests */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-blue-600">
          Incoming Requests
        </h3>
        {incoming.length === 0 ? (
          <p className="text-gray-500 text-sm">No incoming requests.</p>
        ) : (
          <div className="space-y-3">
            {incoming.map((req) => {
              const sender = req.studentId || req.senderId || {};
              return (
                <div
                  key={req._id}
                  className="flex items-center justify-between border rounded-xl p-3 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getImage(sender.profilePicUrl)}
                      alt="profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {sender.firstName} {sender.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sender.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req._id, "accept")}
                      disabled={processingId === req._id}
                      className="px-4 py-1 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(req._id, "reject")}
                      disabled={processingId === req._id}
                      className="px-4 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sent Requests */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-blue-600">
          Sent Requests
        </h3>
        {sent.length === 0 ? (
          <p className="text-gray-500 text-sm">No sent requests.</p>
        ) : (
          <div className="space-y-3">
            {sent.map((req) => {
              const receiver = req.receiverId || req.alumniId || {};
              return (
                <div
                  key={req._id}
                  className="flex items-center justify-between border rounded-xl p-3 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getImage(receiver.profilePicUrl)}
                      alt="profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {receiver.firstName} {receiver.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {receiver.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <p className="text-yellow-600 text-sm font-medium capitalize">
                    {req.status || "pending"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Connections */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-blue-600">
          Connected Students
        </h3>
        {connections.length === 0 ? (
          <p className="text-gray-500 text-sm">No connections yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((conn) => {
              const partner =
                conn.alumniId || conn.receiverId || conn.studentId || {};
              return (
                <div
                  key={conn._id}
                  className="border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition"
                >
                  <img
                    src={getImage(partner.profilePicUrl)}
                    alt="profile"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {partner.firstName} {partner.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {partner.email || "No email"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="text-center mt-6">
        <button
          onClick={refresh}
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
