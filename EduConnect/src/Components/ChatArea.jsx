import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ChatArea.css";

const ChatArea = ({ token, conversation, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // ✅ Load messages initially
  const loadMessages = async () => {
    try {
      const res = await axios.get(
        `https://neuraliftx.onrender.com/api/chat/${conversation._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("❌ Error loading messages:", err);
    }
  };

  useEffect(() => {
    if (conversation?._id) loadMessages();
  }, [conversation]);

  // ✅ Send new message
  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const res = await axios.post(
        "https://neuraliftx.onrender.com/api/chat/message",
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
      console.error("❌ Error sending message:", err);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span className="chat-title">💬 Chat Window</span>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
      </div>

      <div className="chat-body">
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`chat-bubble ${
                msg.senderId === conversation.members[0] ? "sent" : "received"
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
      </div>

      <div className="chat-footer">
        <input
          type="text"
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="chat-actions">
          <button onClick={sendMessage} className="send-btn">
            Send
          </button>
          <button onClick={loadMessages} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
