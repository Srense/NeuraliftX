import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./ChatArea.css";

const ChatArea = ({ token, conversation, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `https://neuraliftx.onrender.com/api/chat/${conversation._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) setMessages(res.data.messages || []);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [conversation, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const res = await axios.post(
        `https://neuraliftx.onrender.com/api/chat/message`,
        { conversationId: conversation._id, text },
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
    <div className="chat-area">
      <div className="chat-header">
        <h4>💬 Chat</h4>
        <button className="close-chat" onClick={onClose}>
          ✖
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`chat-bubble ${
              msg.senderId === conversation.members[0] ? "sent" : "received"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatArea;
