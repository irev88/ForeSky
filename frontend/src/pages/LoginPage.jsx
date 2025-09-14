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
      <div className="auth-container">
        <h2>Login to ForeSky</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
        {info && (
          <div>
            <p className="success">{info}</p>
            {info.includes("Resend") && (
              <button onClick={handleResend} className="btn btn-secondary">
                Resend Email
              </button>
            )}
          </div>
        )}
        // Add this after the resend email section
        {!error && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <a href="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}>
                Create Account
            </a>
            </p>
        </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;