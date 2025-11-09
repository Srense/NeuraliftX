import React, { useEffect, useState } from "react";
import axios from "axios";
import { UserPlus2, Check, XCircle, Loader2 } from "lucide-react";

const StudentConnections = ({ token }) => {
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("connections");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [sent, received, connected] = await Promise.all([
        axios.get("/api/student-connection/requests/sent", { headers }),
        axios.get("/api/student-connection/requests", { headers }),
        axios.get("/api/student-connection/connections", { headers }),
      ]);
      setSentRequests(sent.data);
      setReceivedRequests(received.data);
      setConnections(connected.data);
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await axios.put(`/api/student-connection/requests/${id}`, { status }, { headers });
      fetchAll();
    } catch (err) {
      console.error("Error updating request:", err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await axios.delete(`/api/student-connection/connections/${id}`, { headers });
      fetchAll();
    } catch (err) {
      console.error("Error removing connection:", err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading connections...
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md border">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Student Connections
      </h2>

      <div className="flex gap-3 mb-4">
        {["connections", "sent", "received"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {t === "connections"
              ? "Connected"
              : t === "sent"
              ? "Sent Requests"
              : "Received Requests"}
          </button>
        ))}
      </div>

      {tab === "connections" && (
        <div>
          {connections.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No connections yet.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((conn) => {
                const partner =
                  conn.senderId._id === conn.receiverId._id
                    ? conn.senderId
                    : conn.senderId._id === token.id
                    ? conn.receiverId
                    : conn.senderId;
                const p = partner || {};
                return (
                  <div
                    key={conn._id}
                    className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.profilePicUrl || "/default-avatar.png"}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{p.roleIdValue}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(conn._id)}
                      className="mt-3 text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "sent" && (
        <div>
          {sentRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No sent requests yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((req) => (
                <div
                  key={req._id}
                  className="flex justify-between items-center border rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.receiverId.profilePicUrl || "/default-avatar.png"}
                      className="w-10 h-10 rounded-full object-cover"
                      alt=""
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {req.receiverId.firstName} {req.receiverId.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {req.receiverId.roleIdValue}
                      </p>
                    </div>
                  </div>
                  <p className="text-yellow-600 font-medium">Pending...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "received" && (
        <div>
          {receivedRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No received requests.
            </p>
          ) : (
            <div className="space-y-3">
              {receivedRequests.map((req) => (
                <div
                  key={req._id}
                  className="flex justify-between items-center border rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.senderId.profilePicUrl || "/default-avatar.png"}
                      className="w-10 h-10 rounded-full object-cover"
                      alt=""
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {req.senderId.firstName} {req.senderId.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {req.senderId.roleIdValue}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req._id, "accepted")}
                      className="bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 inline-block" />
                    </button>
                    <button
                      onClick={() => handleAction(req._id, "rejected")}
                      className="bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 inline-block" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentConnections;
