import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ChatArea.css";

const ChatArea = ({ token, conversation, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Decode token to get current user's ID
  useEffect(() => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.id || payload._id || payload.userId);
    } catch (err) {
      console.warn("Unable to parse JWT:", err);
    }
  }, [token]);

  // ✅ Fetch chat messages
  const loadMessages = async () => {
    if (!conversation?._id) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://neuraliftx.onrender.com/api/chat/${conversation._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [conversation]);

  // ✅ Send message
  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const res = await axios.post(
        `https://neuraliftx.onrender.com/api/chat/message`,
        {
          conversationId: conversation._id,
          text,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setText("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="chat-modal">
      <div className="chat-header">
        <h4>💬 Chat Window</h4>
        <button className="close-chat" onClick={onClose}>
          ✖
        </button>
      </div>

      <div className="chat-body">
        {loading ? (
          <p className="loading-msg">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="no-msg">No messages yet. Say hi 👋</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === userId;
            return (
              <div
                key={msg._id}
                className={`message-bubble ${isMine ? "sent" : "received"}`}
              >
                <div className="message-text">{msg.text}</div>
                <div className="sender-name">
                  {isMine ? "You" : msg.senderName || "Other"}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="chat-actions">
          <button onClick={sendMessage}>Send</button>
          <button onClick={loadMessages}>🔄 Refresh</button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
