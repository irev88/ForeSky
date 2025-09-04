import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await apiClient.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("accessToken", response.data.access_token);
      navigate("/");
      window.location.reload();
    } catch (err) {
      const detail = err.response?.data?.detail || "Login failed";
      setError(detail);

      if (detail.includes("not verified")) {
        setInfo("Didn't get the email? Click Resend below.");
      }
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.post("/auth/resend", { email });
      setInfo("Verification email resent! Check your inbox.");
      setError("");
    } catch (err) {
      setError("Resend failed.");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      {info && (
        <div>
          <p className="success">{info}</p>
          {info.includes("Resend") && (
            <button onClick={handleResend}>Resend Email</button>
          )}
        </div>
      )}
    </div>
  );
}

export default LoginPage;