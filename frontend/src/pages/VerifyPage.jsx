import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function VerifyPage() {
  const [message, setMessage] = useState("Verifying...");
  const navigate = useNavigate();

  useEffect(() => {
    // Extract token from query string
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setMessage("No token provided.");
      return;
    }

    // Call backend verification endpoint
    fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Verification failed");
        }
        return res.json();
      })
      .then((data) => {
        setMessage(data.message || "Email verified! You can log in now.");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err) => {
        setMessage(err.message || "Verification failed.");
      });
  }, []);
  return (
    <div>
      <h2>Email Verification</h2>
      <p>{message}</p>
    </div>
  );
}

export default VerifyPage;