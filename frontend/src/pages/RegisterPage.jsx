import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiClient.post("/auth/register", { email, password });
      setSuccess("Registered! Please check your email to verify your account.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="container">
      <div className="auth-container">
        <h2>Create ForeSky Account</h2>
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
              placeholder="Password (min. 6 characters)"
              minLength="6"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Create Account</button>
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}>
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;