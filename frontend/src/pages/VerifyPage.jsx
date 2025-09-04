import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function VerifyPage() {
  const [message, setMessage] = useState("Verifying...");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setMessage("No token provided.");
      return;
    }

    fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.json();
          throw new Error(txt.detail || "Verification failed");
        }
        return res.json();
      })
      .then(() => {
        setMessage("Email verified! Redirecting...");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="container">
      <h2>Email Verification</h2>
      <p>{message}</p>
    </div>
  );
}

export default VerifyPage;