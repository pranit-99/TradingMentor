// src/pages/LoginPage.jsx
import React, { useState } from "react";
import "./LoginPage.css"; // we'll create this next

const LoginPage = ({ onLoginSuccess, onNavigate }) => {
  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        // backend probably sent 401 or 400 with message
        const text = await response.text();
        throw new Error(text || "Invalid email or password.");
      }

      const data = await response.json();

      // Example response: { userId, firstName, lastName, email }
      setSuccessMessage(`Welcome back, ${data.firstName}!`);
      setLoading(false);

      // Save user in localStorage (simple way for now)
      localStorage.setItem("tm_user", JSON.stringify(data));

      // Let parent App know login is successful (optional)
      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Login to Trading Mentor</h2>
        <p className="auth-subtitle">
          Access your paper trading account, track portfolio, and view trade history.
        </p>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}
        {successMessage && (
          <div className="auth-alert auth-alert-success">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="auth-link-button"
            onClick={() => onNavigate("ForgotPassword")}

          >
            Forgot password?
          </button>
          <span className="auth-footer-text">
            Don&apos;t have an account?{" "}
            <span className="auth-footer-highlight">
              Use the Sign Up page we built.
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
