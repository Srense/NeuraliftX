import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function VerifyEmail() {
  const [message, setMessage] = useState("Verifying...");
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (token) {
      fetch(`https://your-backend.com/api/verify-email?token=${token}`)
        .then(res => res.json())
        .then(data => {
          setMessage(data.message || data.error || "Invalid or expired link");
        });
    } else {
      setMessage("Verification token missing.");
    }
  }, [search]);

  return <div className="verify-status">{message}</div>;
}
